// Optional real Chromium verification. Requires Node 22+ and a local Chrome/Edge.
// Uses a dedicated profile, generated notes and a synthetic token only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { settings, startService, makeVault, TMP } = require('./helpers.cjs');
const results = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const chromePath = process.env.OBSIDIAN_QUOTE_TEST_CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(file => fs.existsSync(file));

class Cdp {
  constructor(ws) {
    this.ws = ws; this.next = 0; this.pending = new Map(); this.events = [];
    ws.addEventListener('message', event => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id); clearTimeout(pending.timer);
        if (message.error) pending.reject(Error(message.error.message));
        else pending.resolve(message.result);
      } else this.events.push(message);
    });
  }
  send(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++this.next;
      const timer = setTimeout(() => { this.pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 10000);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, this.sessionId);
    if (result.exceptionDetails) throw Error(result.exceptionDetails.text + ': ' + result.exceptionDetails.exception?.description);
    return result.result.value;
  }
  async until(expression) {
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      if (await this.evaluate(expression)) return;
      await sleep(60);
    }
    throw Error('UI condition timed out: ' + expression);
  }
}

(async () => {
  if (!chromePath || typeof WebSocket === 'undefined') throw Error('Set OBSIDIAN_QUOTE_TEST_CHROME and use Node 22+ for the optional browser test.');
  const first = makeVault('browser-first', {
    '规范/组件命名.md': '# 组件命名规范\n\nVue 组件命名必须使用 PascalCase。\n\n命名示例 <img src=x onerror="window.__OQ_XSS__=true"> 应作为纯文本显示。\n',
  });
  const second = makeVault('browser-second', { '其他命名.md': '# 命名规范\n\nSECOND_VAULT_ONLY 变量命名应该清晰。\n' });
  const token = 'synthetic-browser-test-token';
  const svc = await startService(settings({
    vaults: [
      { id: 'first', name: '公开演示库', path: first, enabled: true },
      { id: 'second', name: '第二演示库', path: second, enabled: true },
    ], server: { port: 45991, token },
  }));
  let browser, cdp;
  try {
    const profile = path.join(TMP, 'chrome-profile');
    fs.mkdirSync(profile, { recursive: true });
    browser = spawn(chromePath, [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-background-networking', '--disable-default-apps', '--remote-debugging-port=0',
      '--user-data-dir=' + profile, 'about:blank',
    ], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
    const endpoint = await new Promise((resolve, reject) => {
      let stderr = '';
      const timer = setTimeout(() => reject(Error('Chromium did not start remote debugging')), 12000);
      browser.once('error', error => { clearTimeout(timer); reject(error); });
      browser.stderr.on('data', chunk => {
        stderr += chunk;
        const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
    });
    const ws = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
    cdp = new Cdp(ws);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    cdp.sessionId = (await cdp.send('Target.attachToTarget', { targetId, flatten: true })).sessionId;
    await cdp.send('Network.enable', {}, cdp.sessionId);
    await cdp.send('Page.enable', {}, cdp.sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false }, cdp.sessionId);
    await cdp.send('Page.navigate', { url: svc.base + '/ui' }, cdp.sessionId);
    const check = async (name, fn) => {
      try { await fn(); results.push({ name, pass: true }); console.log('PASS ' + name); }
      catch (error) { results.push({ name, pass: false, detail: error.message }); throw error; }
    };
    const click = selector => cdp.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    const value = (id, text) => cdp.evaluate(`document.getElementById(${JSON.stringify(id)}).value = ${JSON.stringify(text)}`);
    await check('Unauthenticated browser shows login and cannot read vaults', async () => {
      await cdp.until(`document.getElementById('login') && !document.getElementById('login').classList.contains('hidden')`);
      assert.equal(await cdp.evaluate(`fetch('/vaults').then(r=>r.status)`), 401);
    });
    await check('Wrong token is rejected visibly', async () => {
      await value('token', 'wrong-synthetic-token'); await click('#login-btn');
      await cdp.until(`document.getElementById('login-error').textContent.includes('令牌')`);
    });
    await check('Correct token opens all five browser tabs', async () => {
      await value('token', token); await click('#login-btn');
      await cdp.until(`!document.getElementById('app').classList.contains('hidden')`);
      assert.equal(await cdp.evaluate(`document.querySelectorAll('.tabs [data-tab]').length`), 5);
      assert.equal(await cdp.evaluate(`document.getElementById('token').value`), '');
    });
    await check('Chinese search renders real indexed notes', async () => {
      await value('search-q', '命名'); await click('#search-run');
      await cdp.until(`document.querySelectorAll('#search-out .card').length >= 2`);
      assert.ok(await cdp.evaluate(`document.getElementById('search-out').textContent.includes('PascalCase')`));
    });
    await check('HTML in notes stays text and cannot execute', async () => {
      assert.ok(await cdp.evaluate(`window.__OQ_XSS__ === undefined && document.querySelectorAll('#search-out img').length === 0 && document.getElementById('search-out').textContent.includes('<img')`));
    });
    const screenshot = process.env.OBSIDIAN_QUOTE_TEST_SCREENSHOT || path.join(TMP, 'browser-ui.png');
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }, cdp.sessionId);
    fs.writeFileSync(screenshot, Buffer.from(shot.data, 'base64'));
    await check('Vault checkbox scopes search to the chosen vault', async () => {
      await click('#scope-list input'); await click('#search-run');
      await cdp.until(`document.querySelectorAll('#search-out .card').length === 1`);
      assert.ok(await cdp.evaluate(`!document.getElementById('search-out').textContent.includes('SECOND_VAULT_ONLY')`));
    });
    await check('Context tab returns cited Markdown', async () => {
      await click('[data-tab="context"]'); await value('context-q', '命名'); await click('#context-run');
      await cdp.until(`document.querySelector('#context-out pre')?.textContent.includes('PascalCase')`);
    });
    await check('Rule tab returns extracted clauses', async () => {
      await click('[data-tab="rules"]'); await click('#rules-run');
      await cdp.until(`document.getElementById('rules-out').textContent.includes('PascalCase')`);
    });
    await check('Brief tab returns a stack-filtered convention sheet', async () => {
      await click('[data-tab="brief"]'); await value('brief-stack', 'vue'); await click('#brief-run');
      await cdp.until(`document.getElementById('brief-out').textContent.includes('PascalCase')`);
    });
    await check('Statistics tab shows locally recorded citations', async () => {
      await click('[data-tab="stats"]'); await click('#stats-refresh');
      await cdp.until(`document.getElementById('stats-out').textContent.includes('查询次数')`);
    });
    await check('Browser session cannot invoke administrative reindexing', async () => {
      assert.equal(await cdp.evaluate(`fetch('/reindex',{method:'POST'}).then(r=>r.status)`), 401);
    });
    await check('Browser layout fits a 360-pixel viewport', async () => {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: 360, height: 800, deviceScaleFactor: 1, mobile: true }, cdp.sessionId);
      assert.ok(await cdp.evaluate(`document.documentElement.scrollWidth <= window.innerWidth`));
    });
    await check('Logout revokes the actual browser cookie', async () => {
      await click('#logout-btn');
      await cdp.until(`!document.getElementById('login').classList.contains('hidden')`);
      assert.equal(await cdp.evaluate(`fetch('/vaults').then(r=>r.status)`), 401);
    });
    await check('Page requests stay on the fixture service origin', async () => {
      const urls = cdp.events.filter(e => e.method === 'Network.requestWillBeSent').map(e => e.params.request.url);
      assert.ok(urls.length > 5);
      assert.ok(urls.every(url => new URL(url).origin === svc.base));
    });
  } finally {
    fs.writeFileSync(path.join(__dirname, 'browser-results.json'), JSON.stringify({ total: results.length, passed: results.filter(r=>r.pass).length, results }, null, 2));
    if (cdp) { try { await cdp.send('Browser.close'); } catch {} cdp.ws.close(); }
    if (browser && browser.exitCode === null) browser.kill();
    await svc.server.stop();
  }
  console.log(`${results.filter(r=>r.pass).length}/${results.length} browser checks passed`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
