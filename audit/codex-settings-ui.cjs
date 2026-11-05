// Click-through checks with the actual panel and MCP server, a synthetic service,
// and an isolated headless browser. This does not certify the desktop renderer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const readline = require('node:readline');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oq-native-ui-'));
const checks = [];
const queries = [];
let vaults = [{ id: 'selected-vault', name: '测试库', enabled: true, docs: 2, chunks: 3 }];
let slow = false;
async function check(name, fn) { await fn(); checks.push({ name, passed: true }); console.log('PASS ' + name); }

class Cdp {
  constructor(ws) {
    this.ws = ws; this.next = 0; this.pending = new Map();
    ws.addEventListener('message', event => {
      const message = JSON.parse(String(event.data)); const request = this.pending.get(message.id);
      if (!request) return;
      clearTimeout(request.timer); this.pending.delete(message.id);
      message.error ? request.reject(Error(message.error.message)) : request.resolve(message.result);
    });
  }
  send(method, params = {}, sessionId = this.sessionId) {
    return new Promise((resolve, reject) => {
      const id = ++this.next;
      const timer = setTimeout(() => { this.pending.delete(id); reject(Error('Browser timeout: ' + method)); }, 10000);
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
  let mcp, browser, ws; const pending = new Map(); let next = 0;
  const rpc = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++next; const timer = setTimeout(() => { pending.delete(id); reject(Error('MCP timeout')); }, 40000);
    pending.set(id, { resolve, reject, timer });
    mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  const fixture = http.createServer(async (req, res) => {
    try {
      res.setHeader('content-type', 'application/json');
      if (['/vaults', '/search', '/context'].includes(req.url)) {
        assert.equal(req.headers.authorization, 'Bearer UI_TEST_ONLY');
        if (slow) await new Promise(resolve => setTimeout(resolve, 11000));
        if (req.url === '/vaults') return res.end(JSON.stringify({ vaults }));
        let raw = ''; for await (const chunk of req) raw += chunk;
        const data = JSON.parse(raw); queries.push({ endpoint: req.url, data });
        if (req.url === '/context') return res.end(JSON.stringify({ markdown: '引用结果 ' + data.query, warnings: [] }));
        return res.end(JSON.stringify({ hits: [{ title: '<img src=x onerror="parent.injected=1">', path: '规范/测试.md', vault: '测试库', excerpt: '查询结果 ' + data.query }], warnings: [] }));
      }
      if (req.url === '/rpc') {
        let raw = ''; for await (const chunk of req) raw += chunk;
        const data = JSON.parse(raw); return res.end(JSON.stringify(await rpc(data.method, data.params)));
      }
      res.setHeader('content-type', 'text/html; charset=utf-8');
      if (req.url === '/panel') return res.end(fs.readFileSync(path.join(root, 'codex/panel.html')));
      res.end(`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#171717}iframe{display:block;width:100%;height:850px;border:0}</style><iframe id="panel" src="/panel"></iframe><script>
        window.methods=[];window.calls=[];
        addEventListener('message',async event=>{
          const frame=document.getElementById('panel');const m=event.data;
          if(event.source!==frame.contentWindow||m?.jsonrpc!=='2.0')return;
          window.methods.push(m.method);if(m.id==null)return;
          try{
            let result;
            if(m.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'fixture',version:'1'},hostCapabilities:{serverTools:{}},hostContext:{theme:'dark'}};
            else{window.calls.push(m.params);result=await(await fetch('/rpc',{method:'POST',body:JSON.stringify(m)})).json()}
            frame.contentWindow.postMessage({jsonrpc:'2.0',id:m.id,result},'*');
          }catch{frame.contentWindow.postMessage({jsonrpc:'2.0',id:m.id,error:{code:-32603,message:'Fixture failure'}},'*')}
        });
      </script>`);
    } catch { res.writeHead(500).end('{}'); }
  });
  await new Promise(resolve => fixture.listen(0, '127.0.0.1', resolve));
  try {
    const origin = 'http://127.0.0.1:' + fixture.address().port;
    mcp = spawn(process.execPath, [path.join(root, 'codex/mcp-server.mjs')], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, USERPROFILE: tmp, HOME: tmp, OBSIDIAN_QUOTE_URL: origin, OBSIDIAN_QUOTE_TOKEN: 'UI_TEST_ONLY' } });
    mcp.stderr.resume();
    readline.createInterface({ input: mcp.stdout }).on('line', line => {
      const message = JSON.parse(line), request = pending.get(message.id); if (!request) return;
      clearTimeout(request.timer); pending.delete(message.id);
      message.error ? request.reject(Error(message.error.message)) : request.resolve(message.result);
    });
    await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    const chrome = process.env.OBSIDIAN_QUOTE_TEST_CHROME || [
      'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    ].find(file => fs.existsSync(file));
    assert.ok(chrome && typeof WebSocket !== 'undefined', 'Chrome/Edge and Node 22+ required');
    browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
      '--disable-default-apps', '--remote-debugging-port=0', '--user-data-dir=' + path.join(tmp, 'chrome'), 'about:blank'],
      { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
    const endpoint = await new Promise((resolve, reject) => {
      let stderr = ''; const timer = setTimeout(() => reject(Error('Browser startup timeout')), 15000);
      browser.once('error', reject);
      browser.stderr.on('data', chunk => {
        stderr += chunk; const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
    });
    ws = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
    const cdp = new Cdp(ws);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    cdp.sessionId = (await cdp.send('Target.attachToTarget', { targetId, flatten: true })).sessionId;
    await cdp.send('Page.enable'); await cdp.send('Page.navigate', { url: origin });
    const waitFor = async (expression, timeout = 5000) => {
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if (await cdp.evaluate(expression)) return;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      throw Error('UI condition timed out: ' + expression);
    };
    const prefix = 'document.querySelector("#panel").contentDocument';
    const ui = expression => cdp.evaluate('(()=>{const d=' + prefix + ';' + expression + '})()');
    await waitFor(prefix + '?.querySelector("#status")?.textContent.includes("连接成功")');
    await check('Opening the panel initializes the standard bridge and loads actual service metadata', async () => {
      assert.ok(await ui('return d.querySelector("#summary").textContent.includes("2 篇笔记")'));
      assert.equal(await ui('return d.querySelector("#query").value'), '');
      assert.equal(queries.length, 0);
    });
    await check('A click retrieves scoped results directly without sending a model message', async () => {
      await ui('d.querySelector("#source").value="selected-vault";d.querySelector("#query").value="中断";d.querySelector("#search").click();d.querySelector("#search").click()');
      await waitFor(prefix + '.querySelector("#status").textContent==="检索完成。"');
      assert.equal(queries.length, 1);
      assert.deepEqual(queries[0].data.sources, [{ vault: '测试库', vaultId: 'selected-vault' }]);
      assert.equal(await ui('return d.querySelector("#results pre").textContent'), '查询结果 中断');
      assert.equal(await cdp.evaluate('window.methods.some(m=>m==="ui/message"||m==="sendFollowUpMessage")'), false);
    });
    await check('Untrusted note text is displayed as text without executing markup', async () => {
      assert.equal(await cdp.evaluate('window.injected'), undefined);
      assert.equal(await ui('return d.querySelectorAll("img").length'), 0);
      assert.ok(await ui('return d.querySelector("#results h2").textContent.includes("<img")'));
    });
    await check('Refresh preserves an expired source; typing a query cannot silently select all vaults', async () => {
      vaults = [{ id: 'another-vault', name: '另一个库', enabled: true, docs: 3, chunks: 4 }];
      await ui('d.querySelector("#refresh").click()');
      await waitFor(prefix + '.querySelector("#status").textContent.includes("之前选择的来源已失效")');
      await ui('d.querySelector("#query").value="新词";d.querySelector("#query").dispatchEvent(new Event("input",{bubbles:true}));d.querySelector("#search").click()');
      assert.equal(queries.length, 1);
      assert.equal(await ui('return d.querySelector("#source").value'), 'selected-vault');
    });
    await check('Explicit reselection restores context retrieval and clears old results', async () => {
      await ui('d.querySelector("#source").value="another-vault";d.querySelector("#source").dispatchEvent(new Event("change",{bubbles:true}));d.querySelector("#mode").value="context";d.querySelector("#search").click()');
      await waitFor(prefix + '.querySelector("#status").textContent==="检索完成。"');
      assert.equal(queries.length, 2); assert.equal(queries[1].endpoint, '/context');
      assert.equal(await ui('return d.querySelector("#results pre").textContent'), '引用结果 新词');
    });
    await check('Valid slow metadata and query responses finish within the panel deadline', async () => {
      slow = true;
      try {
        await ui('d.querySelector("#query").value="慢速检索";d.querySelector("#search").click()');
        await waitFor(prefix + '.querySelector("#status").textContent!=="正在检索…"', 30000);
        assert.equal(await ui('return d.querySelector("#status").textContent'), '检索完成。');
        assert.equal(await ui('return d.querySelector("#results pre").textContent'), '引用结果 慢速检索');
      } finally { slow = false; }
    });
    await check('Narrow windows keep the form and results inside the visible width', async () => {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 850, deviceScaleFactor: 1, mobile: false });
      assert.ok(await ui('return d.documentElement.scrollWidth<=d.documentElement.clientWidth+1'));
    });
    fs.writeFileSync(path.join(__dirname, 'codex-settings-ui-results.json'), JSON.stringify({ total: checks.length, passed: checks.length, checks, desktop_renderer_certified: false }, null, 2) + '\n');
  } finally {
    if (ws) ws.close(); if (browser) browser.kill(); if (mcp) { mcp.stdin.end(); mcp.kill(); }
    for (const request of pending.values()) clearTimeout(request.timer);
    await new Promise(resolve => fixture.close(resolve));
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
