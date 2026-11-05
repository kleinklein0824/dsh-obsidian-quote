const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { core, settings, startService, makeVault } = require('./helpers.cjs');

const TOKEN = 'synthetic-security-fixture-token';
async function withService(fn) {
  const svc = await startService(settings({ server: { port: 45931, token: TOKEN } }));
  try { return await fn(svc); } finally { await svc.server.stop(); }
}
async function login(base) {
  const res = await fetch(base + '/ui/session', {
    method: 'POST', headers: { 'content-type': 'application/json', connection: 'close' },
    body: JSON.stringify({ token: TOKEN }),
  });
  assert.equal(res.status, 200);
  await res.text();
  return res.headers.get('set-cookie').split(';')[0];
}
async function status(base, endpoint, init) {
  const res = await fetch(base + endpoint, { ...init, headers: { connection: 'close', ...init?.headers } });
  await res.text();
  return res.status;
}
async function hostGuardStatus(headers, remoteAddress) {
  const { apply } = await import(pathToFileURL(path.join(__dirname, '..', 'harness-plugin', 'index.js')).href);
  let route;
  apply({
    get: () => ({ register: value => { route = value; return () => {}; } }),
    effect: factory => factory(),
  });
  const oldUrl = process.env.OBSIDIAN_QUOTE_URL;
  const oldToken = process.env.OBSIDIAN_QUOTE_TOKEN;
  process.env.OBSIDIAN_QUOTE_URL = 'http://127.0.0.1:9';
  process.env.OBSIDIAN_QUOTE_TOKEN = 'synthetic-denied-route-token';
  try {
    const response = { statusCode: 0, setHeader() {}, writeHead(code) { this.statusCode = code; return this; }, end() {} };
    await route.handler({ method: 'GET', headers, socket: { remoteAddress } }, response);
    return response.statusCode;
  } finally {
    if (oldUrl === undefined) delete process.env.OBSIDIAN_QUOTE_URL;
    else process.env.OBSIDIAN_QUOTE_URL = oldUrl;
    if (oldToken === undefined) delete process.env.OBSIDIAN_QUOTE_TOKEN;
    else process.env.OBSIDIAN_QUOTE_TOKEN = oldToken;
  }
}

module.exports = [
  {
    id: 'T116', name: 'Stopping and restarting the service revokes old browser sessions', severity: 'high',
    run: () => withService(async ({ base, server }) => {
      const cookie = await login(base);
      assert.equal(await status(base, '/vaults', { headers: { cookie } }), 200);
      await server.stop();
      await server.start();
      assert.equal(await status(base, '/vaults', { headers: { cookie } }), 401);
      return { pass: true, detail: 'A previously valid cookie returns 401 after restart.' };
    }),
  },
  {
    id: 'T117', name: 'Changing the access token revokes existing browser sessions', severity: 'high',
    run: () => withService(async ({ base, s }) => {
      const cookie = await login(base);
      s.server.token = 'replacement-synthetic-token';
      assert.equal(await status(base, '/vaults', { headers: { cookie } }), 401);
      assert.equal(await status(base, '/vaults', { headers: { authorization: 'Bearer replacement-synthetic-token' } }), 200);
      return { pass: true, detail: 'Old session denied; replacement Bearer token accepted.' };
    }),
  },
  {
    id: 'T118', name: 'An empty runtime credential never disables authentication', severity: 'high',
    run: () => withService(async ({ base, s }) => {
      s.server.token = '';
      assert.equal(await status(base, '/vaults'), 401);
      return { pass: true, detail: 'Protected data remains unauthorized with an empty configured token.' };
    }),
  },
  {
    id: 'T119', name: 'Browser cookies cannot call the administrative reindex endpoint', severity: 'medium',
    run: () => withService(async ({ base }) => {
      const cookie = await login(base);
      assert.equal(await status(base, '/reindex', { method: 'POST', headers: { cookie } }), 401);
      assert.equal(await status(base, '/reindex', { method: 'POST', headers: { authorization: 'Bearer ' + TOKEN } }), 200);
      return { pass: true, detail: 'Read-only browser session denied; explicit token still works.' };
    }),
  },
  {
    id: 'T120', name: 'A different localhost origin cannot reuse a browser session', severity: 'high',
    run: () => withService(async ({ base }) => {
      const cookie = await login(base);
      const different = new URL(base);
      different.port = String(Number(different.port) + 1);
      assert.equal(await status(base, '/vaults', { headers: { cookie, origin: different.origin } }), 401);
      assert.equal(await status(base, '/vaults', { headers: { cookie, origin: base } }), 200);
      return { pass: true, detail: 'Cookie authentication is restricted to the UI origin.' };
    }),
  },
  {
    id: 'T121', name: 'Stopping while startup is pending leaves no listening server', severity: 'high',
    run: async () => {
      const s = settings({ server: { port: 45951, token: TOKEN } });
      const server = new core.QuoteServer({ getSettings: () => s, log: () => {} });
      try {
        const starting = server.start();
        await server.stop();
        await starting;
        assert.equal(server.running, false);
        return { pass: true, detail: 'Startup is awaited and its socket is closed before stop resolves.' };
      } finally { await server.stop(); }
    },
  },
  {
    id: 'T122', name: 'Wildcard network binding is rejected before opening any socket', severity: 'high',
    run: async () => {
      const s = settings({ server: { host: '0.0.0.0', token: TOKEN } });
      const server = new core.QuoteServer({ getSettings: () => s, log: () => {} });
      // Never expose a real listener during the regression's failing run.
      server.listen = async () => { throw Error('A network bind was attempted'); };
      await assert.rejects(server.start(), /回环|loopback/i);
      return { pass: true, detail: 'Unsafe host configuration rejected before the networking boundary.' };
    },
  },
  {
    id: 'T123', name: 'A server without an access token refuses to start', severity: 'high',
    run: async () => {
      const s = settings({ server: { token: '' } });
      const server = new core.QuoteServer({ getSettings: () => s, log: () => {} });
      server.listen = async () => { throw Error('A network bind was attempted'); };
      await assert.rejects(server.start(), /令牌|token/i);
      return { pass: true, detail: 'Missing credential rejected before opening a socket.' };
    },
  },
  {
    id: 'T124', name: 'Token generation never falls back to predictable Math.random', severity: 'high',
    run: async () => {
      const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
      const originalRandom = Math.random;
      try {
        Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
        Math.random = () => 0;
        const first = core.createDefaultSettings().server.token;
        const second = core.createDefaultSettings().server.token;
        assert.notEqual(first, second);
        assert.match(first, /^[a-f0-9]{32,}$/);
        return { pass: true, detail: 'Distinct secure tokens without browser crypto or Math.random entropy.' };
      } finally {
        Math.random = originalRandom;
        if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor);
        else delete globalThis.crypto;
      }
    },
  },
  {
    id: 'T125', name: 'Harness RPC rejects a rebinding Host even when Origin matches it', severity: 'high',
    run: async () => {
      assert.equal(await hostGuardStatus({ host: 'attacker.example:12345', origin: 'http://attacker.example:12345' }, '127.0.0.1'), 403);
      return { pass: true, detail: 'Matching attacker Host/Origin cannot reach the credentialed proxy.' };
    },
  },
  {
    id: 'T126', name: 'Harness RPC rejects a nonlocal peer with a forged localhost Host', severity: 'high',
    run: async () => {
      assert.equal(await hostGuardStatus({ host: '127.0.0.1:12345' }, '198.51.100.10'), 403);
      return { pass: true, detail: 'Actual socket peer is checked independently of headers.' };
    },
  },
  {
    id: 'T127', name: 'A duplicated rule remains available in the selected second vault', severity: 'high',
    run: async () => {
      const note = '# 命名规范\n\n组件命名必须使用 PascalCase。\n';
      const first = makeVault('scope-duplicate-a', { 'notes/a.md': note });
      const second = makeVault('scope-duplicate-b', { 'notes/b.md': note });
      const s = settings({ vaults: [
        { id: 'copy-a', name: 'First', path: first, enabled: true },
        { id: 'copy-b', name: 'Second', path: second, enabled: true },
      ] });
      const indexer = new core.VaultIndexer(() => s);
      await indexer.build();
      assert.equal(indexer.getRules().rules[0].count, 2);
      const scoped = indexer.getRules({ sources: [{ vault: 'Second' }] }).rules;
      assert.equal(scoped.length, 1);
      assert.equal(scoped[0].vault, 'Second');
      assert.equal(scoped[0].path, 'notes/b.md');
      assert.equal(scoped[0].count, 1);
      return { pass: true, detail: 'Source filtering preserves a duplicated rule and scopes its provenance/count.' };
    },
  },
  {
    id: 'T128', name: 'A brief can cite a duplicated rule in the selected second folder', severity: 'high',
    run: async () => {
      const note = '# 命名规范\n\n组件命名必须使用 PascalCase。\n';
      const vault = makeVault('scope-duplicate-folders', { 'a/note.md': note, 'b/note.md': note });
      const s = settings({ vaults: [{ id: 'folders', name: 'Folders', path: vault, enabled: true }] });
      const indexer = new core.VaultIndexer(() => s);
      await indexer.build();
      const result = await indexer.buildBrief({ stack: ['vue'], sources: [{ vault: 'Folders', path: 'b' }] });
      assert.equal(result.rules.length, 1);
      assert.equal(result.rules[0].path, 'b/note.md');
      assert.equal(result.rules[0].count, 1);
      return { pass: true, detail: 'Folder-scoped briefs retain copied rules from their actual selected folder.' };
    },
  },
  {
    id: 'T129', name: 'Distinct rules with a legacy 24-bit ID collision remain separate', severity: 'high',
    run: async () => {
      const texts = ['Module 1214 must use descriptive names.', 'Module 1596 must use descriptive names.'];
      const vault = makeVault('rule-id-collision', { 'a.md': '# Rules\n\n' + texts[0], 'b.md': '# Rules\n\n' + texts[1] });
      const s = settings({ vaults: [{ id: 'collision', name: 'Collision', path: vault, enabled: true }] });
      const indexer = new core.VaultIndexer(() => s);
      await indexer.build();
      const rules = indexer.getRules().rules;
      assert.deepEqual(rules.map(r => r.text).sort(), texts.slice().sort());
      assert.equal(new Set(rules.map(r => r.id)).size, 2);
      assert.ok(rules.every(r => r.count === 1));
      return { pass: true, detail: 'Both formerly colliding rules retain distinct citations and count 1.' };
    },
  },
  {
    id: 'T130', name: 'Code punctuation, negative signs and letter case do not collapse distinct rules', severity: 'high',
    run: async () => {
      const texts = ['The value must be -1.', 'The value must be 1.', 'The constant must be `user-name`.', 'The constant must be `username`.', 'The key must be `userName`.', 'The key must be `username`.'];
      const ctx = { vaultId: 'x', vault: 'x', path: 'x.md', heading: 'Rules', tags: [], updated: '' };
      const rules = core.extractRules(texts.join('\n'), ctx);
      assert.deepEqual(rules.map(r => r.text).sort(), texts.slice().sort());
      assert.equal(new Set(rules.map(r => r.id)).size, texts.length);
      return { pass: true, detail: 'All six semantically distinct rules survive section-level deduplication.' };
    },
  },
  {
    id: 'T131', name: 'Inline code preserves meaningful whitespace during rule extraction', severity: 'high',
    run: async () => {
      const texts = ['The string must be `a  b`.', 'The string must be `a b`.'];
      const ctx = { vaultId: 'x', vault: 'x', path: 'x.md', heading: 'Rules', tags: [], updated: '' };
      const rules = core.extractRules(texts.join('\n'), ctx);
      assert.deepEqual(rules.map(r => r.text).sort(), texts.slice().sort());
      return { pass: true, detail: 'One-space and two-space string examples remain unchanged and separate.' };
    },
  },
  {
    id: 'T132', name: 'Malformed configured credentials never appear in Harness browser errors', severity: 'high',
    run: async () => {
      const { apply } = await import(pathToFileURL(path.join(__dirname, '..', 'harness-plugin', 'index.js')).href);
      let route;
      apply({ get: () => ({ register: value => { route = value; return () => {}; } }), effect: factory => factory() });
      const oldUrl = process.env.OBSIDIAN_QUOTE_URL;
      const oldToken = process.env.OBSIDIAN_QUOTE_TOKEN;
      process.env.OBSIDIAN_QUOTE_URL = 'http://127.0.0.1:9';
      process.env.OBSIDIAN_QUOTE_TOKEN = 'SYNTHETIC-HEADER-SECRET\nSECOND-LINE';
      try {
        let payload = '';
        const response = { setHeader() {}, writeHead() {}, end: value => { payload = value; } };
        await route.handler({ method: 'GET', headers: { host: '127.0.0.1:12345' }, socket: { remoteAddress: '127.0.0.1' } }, response);
        assert.equal(JSON.parse(payload).ok, false);
        assert.ok(!payload.includes('SYNTHETIC-HEADER-SECRET') && !payload.includes('SECOND-LINE'));
        return { pass: true, detail: 'Actual fetch header-validation failure produces a credential-free error.' };
      } finally {
        if (oldUrl === undefined) delete process.env.OBSIDIAN_QUOTE_URL; else process.env.OBSIDIAN_QUOTE_URL = oldUrl;
        if (oldToken === undefined) delete process.env.OBSIDIAN_QUOTE_TOKEN; else process.env.OBSIDIAN_QUOTE_TOKEN = oldToken;
      }
    },
  },
];
