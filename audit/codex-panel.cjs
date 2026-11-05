// Codex-specific panel checks; uses synthetic metadata and an isolated Chrome profile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const renderer = path.join(root, 'skills/obsidian-setup/scripts/render-panel.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oq-codex-panel-'));
const input = path.join(tmp, 'snapshot.json');
const output = path.join(tmp, 'panel.html');
const marker = 'SYNTHETIC_PRIVATE_CREDENTIAL_MUST_NOT_LEAK';
const snapshot = {
  state: 'ready', checkedAt: '2026-11-05T14:00:00Z', serviceVersion: '0.2.1',
  vaults: [
    { name: '测试库', enabled: true, docs: 2, chunks: 3, path: marker, token: marker },
    { name: '</script><img src=x onerror="window.injected=true">', enabled: false, docs: 1, chunks: 1 },
  ], token: marker, config: { token: marker },
  results: [{ title: '命名规范', path: '规范/组件.md', text: '<img src=x onerror="window.injected=true">', raw: marker }],
};
const checks = [];
async function check(name, fn) {
  await fn(); checks.push({ name, pass: true }); console.log('PASS ' + name);
}
function render(data = snapshot) {
  fs.writeFileSync(input, JSON.stringify(data));
  return spawnSync(process.execPath, [renderer, '--data', input, '--output', output], { encoding: 'utf8', windowsHide: true });
}
class Cdp {
  constructor(ws) {
    this.ws = ws; this.next = 0; this.pending = new Map();
    ws.addEventListener('message', event => {
      const message = JSON.parse(String(event.data));
      const request = this.pending.get(message.id);
      if (!request) return;
      clearTimeout(request.timer); this.pending.delete(message.id);
      message.error ? request.reject(Error(message.error.message)) : request.resolve(message.result);
    });
  }
  send(method, params = {}, sessionId = this.sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++this.next;
      const timer = setTimeout(() => { this.pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 10000);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
}
(async () => {
  await check('Renderer accepts explicit public snapshot and produces a fragment', () => {
    const result = render();
    assert.equal(result.status, 0, result.stderr);
    const fragment = fs.readFileSync(output, 'utf8');
    assert.ok(!/<(?:!doctype|html|head|body)[\s>]/i.test(fragment));
    assert.ok(!fragment.includes(marker), 'Unknown/private fields must be dropped');
    assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(fragment));
    assert.ok(!fragment.includes('<img src=x'), 'Snapshot cannot terminate its script container');
  });
  const fragment = fs.readFileSync(output, 'utf8');
  await check('Malformed snapshot is rejected without overwriting the output or echoing input', () => {
    for (const value of [null, [], 'invalid', { state: 'ready', vaults: 'invalid', token: marker }]) {
      const result = render(value);
      assert.notEqual(result.status, 0);
      assert.ok(!(result.stdout + result.stderr).includes(marker));
      assert.equal(fs.readFileSync(output, 'utf8'), fragment);
    }
  });
  const chrome = process.env.OBSIDIAN_QUOTE_TEST_CHROME || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(file => fs.existsSync(file));
  assert.ok(chrome && typeof WebSocket !== 'undefined', 'Chrome/Edge and Node 22+ required');
  const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', '--disable-default-apps', '--remote-debugging-port=0',
    '--user-data-dir=' + path.join(tmp, 'chrome'), 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  let ws;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let stderr = '';
      const timer = setTimeout(() => reject(Error('Chrome startup timed out')), 15000);
      browser.once('error', error => { clearTimeout(timer); reject(error); });
      browser.stderr.on('data', chunk => {
        stderr += chunk;
        const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
    });
    ws = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
    const cdp = new Cdp(ws);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    cdp.sessionId = (await cdp.send('Target.attachToTarget', { targetId, flatten: true })).sessionId;
    await cdp.send('Page.enable');
    const { frameTree } = await cdp.send('Page.getFrameTree');
    const bridge = '<script>window.sent=[];window.saved=[];window.openai={sendFollowUpMessage:async(x)=>{window.sent.push(x)},setWidgetState:async(x)=>{window.saved.push(x)},widgetState:null};</script>';
    await cdp.send('Page.setDocumentContent', { frameId: frameTree.frame.id,
      html: '<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:16px;font:14px sans-serif}.viz-controls,.viz-row{display:flex;flex-wrap:wrap;gap:12px}.form-label{display:grid;gap:6px;max-width:100%}.form-control,.form-select{width:100%;min-width:0;font:inherit}.btn{font:inherit}.text-small{font-size:12px}</style>' + bridge + fragment });
    const click = selector => cdp.evaluate('document.querySelector(' + JSON.stringify(selector) + ').click()');
    const value = (selector, text) => cdp.evaluate('document.querySelector(' + JSON.stringify(selector) + ').value=' + JSON.stringify(text));
    await check('Metadata and note content render as text; disabled sources cannot be selected', async () => {
      assert.equal(await cdp.evaluate('window.injected'), undefined);
      assert.equal(await cdp.evaluate('document.querySelectorAll("img").length'), 0);
      assert.ok(await cdp.evaluate('document.body.textContent.includes("<img src=x")'));
      assert.equal(await cdp.evaluate('document.querySelectorAll("#oq-vault option").length - 1'), 1);
    });
    await check('Empty query shows validation and does not request Codex', async () => {
      await click('#oq-submit');
      assert.equal(await cdp.evaluate('window.sent.length'), 0);
      assert.ok(await cdp.evaluate('document.querySelector("#oq-status").textContent.includes("关键词")'));
    });
    await check('Search sends explicit scoped MCP parameters and saves only UI state', async () => {
      await value('#oq-query', '组件命名'); await value('#oq-vault', '测试库');
      await click('#oq-submit');
      const sent = await cdp.evaluate('window.sent');
      assert.equal(sent.length, 1); assert.ok(sent[0].prompt.includes('kb_search'));
      assert.ok(sent[0].prompt.includes('"sources":["测试库"]'));
      assert.ok(sent[0].prompt.includes('"query":"组件命名"'));
      assert.ok(!(await cdp.evaluate('JSON.stringify(window.saved)')).includes(marker));
      assert.ok(await cdp.evaluate('document.querySelector("#oq-status").textContent.includes("后续回复")'));
    });
    await check('Context and refresh request real tools without changing configuration', async () => {
      await value('#oq-mode', 'context'); await click('#oq-submit'); await click('#oq-refresh');
      const sent = await cdp.evaluate('window.sent');
      assert.ok(sent[1].prompt.includes('kb_context')); assert.ok(sent[2].prompt.includes('kb_vaults'));
      assert.ok(!sent.some(item => item.prompt.includes(marker)));
    });
    await check('Host state restores controls; an invalid source cannot broaden a query', async () => {
      await cdp.evaluate('window.dispatchEvent(new CustomEvent("openai:set_globals",{detail:{globals:{widgetState:{modelContent:{query:"恢复查询",source:"测试库",mode:"search"}}}}}))');
      assert.equal(await cdp.evaluate('document.querySelector("#oq-query").value'), '恢复查询');
      assert.equal(await cdp.evaluate('document.querySelector("#oq-vault").value'), '测试库');
      await cdp.evaluate('window.dispatchEvent(new CustomEvent("openai:set_globals",{detail:{globals:{widgetState:{modelContent:{query:"",source:"missing",mode:"search"}}}}}))');
      const count = await cdp.evaluate('window.sent.length');
      await value('#oq-query', 'scope');
      await cdp.evaluate('document.querySelector("#oq-query").dispatchEvent(new Event("input"))');
      assert.equal(await cdp.evaluate('window.saved.at(-1).modelContent.source'), 'missing');
      await cdp.evaluate('window.dispatchEvent(new CustomEvent("openai:set_globals",{detail:{globals:{widgetState:window.saved.at(-1)}}}))');
      await click('#oq-submit');
      assert.equal(await cdp.evaluate('window.sent.length'), count);
      assert.ok(await cdp.evaluate('document.querySelector("#oq-status").textContent.includes("重新选择")'));
    });
    await check('Absent or failed host bridge gives a copyable request and no fake success', async () => {
      await value('#oq-query', 'fallback');
      await value('#oq-vault', '测试库');
      await cdp.evaluate('document.querySelector("#oq-vault").dispatchEvent(new Event("change"))');
      await cdp.evaluate('window.openai.sendFollowUpMessage=undefined'); await click('#oq-submit');
      assert.ok(await cdp.evaluate('!document.querySelector("#oq-request").hidden && document.querySelector("#oq-request-text").value.includes("fallback")'));
      await cdp.evaluate('window.openai.sendFollowUpMessage=async()=>{throw Error("cancelled")}'); await click('#oq-submit');
      assert.ok(await cdp.evaluate('document.querySelector("#oq-status").textContent.includes("未完成")'));
      assert.equal(await cdp.evaluate('document.querySelector("#oq-submit").disabled'), false);
    });
    await check('320px and desktop layouts contain all controls', async () => {
      for (const width of [320, 736]) {
        await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
        assert.ok(await cdp.evaluate('document.documentElement.scrollWidth<=innerWidth'));
      }
    });
  } finally {
    if (ws) ws.close();
    browser.kill();
  }
  fs.writeFileSync(path.join(__dirname, 'codex-panel-results.json'), JSON.stringify({ total: checks.length, passed: checks.length, checks, scope: 'Synthetic browser bridge; native Codex popup/rendering is not certified' }, null, 2) + '\n');
  console.log(checks.length + '/' + checks.length + ' Codex panel checks passed');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
