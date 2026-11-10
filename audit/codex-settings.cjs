// Native settings integration: real stdio server and isolated local HTTP fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const readline = require('node:readline');

const root = path.resolve(__dirname, '..');
const secret = 'TEST_ONLY_NATIVE_PANEL_SECRET';
const privatePath = 'PRIVATE_VAULT_PATH_MUST_NOT_BE_IN_UI';
const checks = [];
const calls = [];
let vaults = [
  { id: 'vault-a', name: '同名库', enabled: true, docs: 2, chunks: 3, path: privatePath },
  { id: 'vault-b', name: '同名库', enabled: true, docs: 4, chunks: 6, path: privatePath },
  { id: 'vault-disabled', name: '已停用', enabled: false, docs: 1, chunks: 1 },
];
async function check(name, fn) {
  await fn(); checks.push({ name, passed: true }); console.log('PASS ' + name);
}
function connect(script, env) {
  const child = spawn(process.execPath, [script], { env, cwd: root, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map(); let next = 0;
  const rl = readline.createInterface({ input: child.stdout });
  rl.on('line', line => {
    const message = JSON.parse(line); const request = pending.get(message.id);
    if (!request) return;
    clearTimeout(request.timer); pending.delete(message.id);
    message.error ? request.reject(Error(message.error.message)) : request.resolve(message.result);
  });
  child.stderr.resume();
  child.on('exit', () => {
    for (const request of pending.values()) { clearTimeout(request.timer); request.reject(Error('MCP exited')); }
    pending.clear();
  });
  const rpc = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++next;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('MCP timeout: ' + method)); }, 10000);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  return { child, rpc, call: (name, args = {}) => rpc('tools/call', { name, arguments: args }) };
}

(async () => {
  const fixture = http.createServer(async (req, res) => {
    if (req.headers.authorization !== 'Bearer ' + secret) { res.writeHead(401).end(); return; }
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : null;
    calls.push({ method: req.method, endpoint: req.url, body });
    res.setHeader('content-type', 'application/json');
    if (req.url === '/vaults') res.end(JSON.stringify({ vaults }));
    else if (req.url === '/search') res.end(JSON.stringify({ query: body.query, hits: [{ title: '<img src=x onerror="window.injected=1">', path: '规范/测试.md', vault: '同名库', excerpt: 'quoted text ' + body.query }], warnings: [] }));
    else if (req.url === '/context') res.end(JSON.stringify({ markdown: 'context ' + body.query, warnings: [] }));
    else { res.writeHead(404).end(); }
  });
  await new Promise(resolve => fixture.listen(0, '127.0.0.1', resolve));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oq-native-'));
  const env = { ...process.env, USERPROFILE: tmp, HOME: tmp,
    OBSIDIAN_QUOTE_URL: 'http://127.0.0.1:' + fixture.address().port, OBSIDIAN_QUOTE_TOKEN: secret };
  let server;
  try {
    let launch;
    await check('Codex installs a dedicated panel server alongside the original six-tool server', () => {
      const manifest = JSON.parse(fs.readFileSync(path.join(root, 'mcp.json'), 'utf8'));
      assert.ok(manifest.mcpServers['obsidian-quote-panel'], 'Native settings panel server is missing');
      assert.deepEqual(manifest.mcpServers['obsidian-quote'].args, ['${PLUGIN_ROOT}/harness-skill/scripts/mcp-server.mjs']);
      launch = manifest.mcpServers['obsidian-quote-panel'].args[0].replace('${PLUGIN_ROOT}', root);
    });
    server = connect(launch, env);
    let settings, tools, html;
    await check('MCP advertises native structured settings with an actual panel action', async () => {
      const init = await server.rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'codex-test', version: '1' } });
      const extension = init.capabilities.extensions?.['openai/settings'];
      assert.ok(extension?.readTool && extension?.updateTool);
      tools = (await server.rpc('tools/list')).tools;
      const readSchema = tools.find(tool => tool.name === extension.readTool)?.outputSchema;
      assert.equal(readSchema?.type, 'object', 'Settings read tool must declare its structured output schema');
      assert.deepEqual(readSchema.required, ['schema', 'values']);
      assert.equal(readSchema.properties.schema.type, 'object');
      assert.equal(readSchema.properties.values.type, 'object');
      assert.equal(readSchema.properties.layout.type, 'array');
      const result = await server.call(extension.readTool);
      assert.equal(result.isError, false);
      settings = result.structuredContent;
      assert.equal(settings.schema.type, 'object');
      const action = settings.layout.flatMap(group => group.items).find(item => item.kind === 'tool');
      assert.ok(action);
      const descriptor = tools.find(tool => tool.name === action.tool);
      assert.ok(descriptor?._meta?.ui?.resourceUri?.startsWith('ui://'));
      const querySchema = tools.find(tool => tool.name === 'oq_panel_query')?.inputSchema;
      assert.ok(querySchema?.oneOf?.some(branch => branch.required?.includes('sources')));
      assert.equal(querySchema?.properties?.sources?.type, 'array');
      const resource = await server.rpc('resources/read', { uri: descriptor._meta.ui.resourceUri });
      html = resource.contents[0].text;
      assert.equal(resource.contents[0].mimeType, 'text/html;profile=mcp-app');
      assert.ok(!html.includes(secret) && !html.includes(privatePath));
    });
    await check('Native UI tools are app-only; connection settings and absolute paths are not returned', async () => {
      for (const tool of tools) assert.deepEqual(tool._meta.ui.visibility, ['app']);
      const state = await server.call('oq_panel_state');
      assert.equal(state.isError, false);
      assert.equal(state.structuredContent.vaults.length, 3);
      assert.ok(!JSON.stringify(state).includes(privatePath));
      assert.ok(!JSON.stringify(state).includes(secret));
    });
    await check('Panel search addresses the chosen vault by stable id even when names are duplicated', async () => {
      const result = await server.call('oq_panel_query', { query: '命名', source: 'vault-b', mode: 'search', limit: 5 });
      assert.equal(result.isError, false);
      assert.equal(result.structuredContent.hits[0].excerpt, 'quoted text 命名');
      assert.deepEqual(calls.at(-1).body.sources, [{ vault: '同名库', vaultId: 'vault-b' }]);
    });
    await check('Panel search combines multiple selected directories by stable ids', async () => {
      const result = await server.call('oq_panel_query', { query: '命名', sources: ['vault-a', 'vault-b'], mode: 'search', limit: 5 });
      assert.equal(result.isError, false);
      assert.deepEqual(calls.at(-1).body.sources, [
        { vault: '同名库', vaultId: 'vault-a' },
        { vault: '同名库', vaultId: 'vault-b' },
      ]);
    });
    await check('Deleted, disabled, and malformed selections fail without broadening retrieval', async () => {
      const before = calls.filter(call => call.endpoint === '/search' || call.endpoint === '/context').length;
      for (const args of [
        { query: '命名', source: 'does-not-exist', mode: 'search', limit: 5 },
        { query: '命名', source: 'vault-disabled', mode: 'search', limit: 5 },
        { query: '命名', source: [], mode: 'search', limit: 5 },
        { query: '命名', sources: [], mode: 'search', limit: 5 },
        { query: '命名', sources: ['vault-a', 'vault-disabled'], mode: 'search', limit: 5 },
        { query: '命名', sources: ['vault-a', 'missing'], mode: 'search', limit: 5 },
        { query: '命名', sources: ['vault-a', 'vault-a'], mode: 'search', limit: 5 },
        { query: '命名', source: 'vault-a', mode: 'search', limit: -1 },
        { query: '', source: 'vault-a', mode: 'context', limit: 5 },
      ]) assert.equal((await server.call('oq_panel_query', args)).isError, true);
      assert.equal(calls.filter(call => call.endpoint === '/search' || call.endpoint === '/context').length, before);
    });
    await check('Context requests retain the explicit source and the requested limits', async () => {
      const result = await server.call('oq_panel_query', { query: '引用', source: 'vault-a', mode: 'context', limit: 3 });
      assert.equal(result.structuredContent.markdown, 'context 引用');
      assert.deepEqual(calls.at(-1).body, { query: '引用', limit: 3, budget: 4000, sources: [{ vault: '同名库', vaultId: 'vault-a' }] });
    });
    await check('Opening and querying the panel leaves connection configuration unwritten', () => {
      assert.equal(fs.existsSync(path.join(tmp, '.obsidian-quote/config.json')), false);
      assert.ok(calls.every(call => ['GET /vaults', 'POST /search', 'POST /context'].includes(call.method + ' ' + call.endpoint)));
    });
    fs.writeFileSync(path.join(__dirname, 'codex-settings-results.json'), JSON.stringify({ total: checks.length, passed: checks.length, checks }, null, 2) + '\n');
  } finally {
    if (server) { server.child.stdin.end(); server.child.kill(); }
    await new Promise(resolve => fixture.close(resolve));
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
