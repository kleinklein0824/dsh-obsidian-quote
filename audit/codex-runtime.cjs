/* Optional acceptance probe: actual Codex installer and MCP runtime, no model call. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'oq-codex-'));
const executable = process.env.CODEX_TEST_EXECUTABLE || 'codex';
const env = { ...process.env, CODEX_HOME: temp, USERPROFILE: temp, HOME: temp, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' };
for (const name of ['OBSIDIAN_QUOTE_URL', 'OBSIDIAN_QUOTE_TOKEN']) delete env[name];
function cli(args) {
  const result = spawnSync(executable, ['plugin', ...args], { env, cwd: root, encoding: 'utf8', timeout: 30000, windowsHide: true });
  assert.equal(result.status, 0, result.stderr || String(result.error));
}

(async () => {
  cli(['marketplace', 'add', root, '--json']);
  cli(['add', 'obsidian-quote@dsh-obsidian-quote', '--json']);
  const child = spawn(executable, ['app-server', '--stdio'], { env, cwd: root, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  let buffer = '', next = 0;
  const pending = new Map();
  const closed = new Promise(resolve => child.once('close', resolve));
  const failPending = error => {
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(error);
    }
    pending.clear();
  };
  child.once('error', failPending);
  child.once('exit', (code, signal) => failPending(Error('Codex app-server exited before completing RPC: ' + (signal || code))));
  child.stdout.on('data', data => {
    buffer += data;
    while (buffer.includes('\n')) {
      const end = buffer.indexOf('\n');
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 1);
      try {
        const message = JSON.parse(line);
        const request = pending.get(message.id);
        if (request) {
          clearTimeout(request.timer);
          pending.delete(message.id);
          request.resolve(message);
        }
      } catch {}
    }
  });
  child.stderr.on('data', () => {});
  const rpc = (method, params) => new Promise((resolve, reject) => {
    if (child.exitCode !== null || child.signalCode !== null) return reject(Error('Codex app-server is no longer running'));
    const id = ++next;
    const timer = setTimeout(() => { pending.delete(id); reject(Error('Codex runtime timed out: ' + method)); }, 20000);
    pending.set(id, { resolve, reject, timer });
    child.stdin.write(JSON.stringify({ id, method, params }) + '\n');
  });
  try {
    const init = await rpc('initialize', { clientInfo: { name: 'obsidian-quote-runtime-test', version: '1' }, capabilities: { experimentalApi: true } });
    assert.ok(!init.error, JSON.stringify(init.error));
    child.stdin.write('{"method":"initialized"}\n');
    const inventory = await rpc('mcpServerStatus/list', { serverName: 'obsidian-quote' });
    const server = inventory.result?.data?.find(item => item.name === 'obsidian-quote');
    assert.ok(server, 'Installed plugin must expose its MCP server');
    assert.equal(server.toolsError, null, 'Codex must launch the bundled MCP without manual path substitution: ' + server.toolsError);
    const tools = Object.keys(server.tools).sort();
    assert.deepEqual(tools, ['kb_brief', 'kb_context', 'kb_rules', 'kb_search', 'kb_stats', 'kb_vaults']);
    const details = await rpc('plugin/read', { pluginName: 'obsidian-quote', marketplacePath: path.join(root, '.agents/plugins/marketplace.json') });
    assert.ok(details.result?.plugin?.onboardingSkill, 'Codex setup entry must be registered');
    const report = { actual_codex_runtime: 'passed', discovered_tools: tools, setup_entry: 'present', manual_placeholder_substitution: false, user_configuration_modified: false };
    fs.writeFileSync(path.join(__dirname, 'codex-runtime-results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('PASS actual Codex installation, automatic MCP startup, six tools and setup entry');
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await closed;
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
