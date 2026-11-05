const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const file = path.join(__dirname, '../harness-skill/scripts/setup.mjs');

(async () => {
  assert.ok(fs.existsSync(file), 'A first-run connection helper must exist');
  const { inspectConnection } = await import(pathToFileURL(file).href);
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'oq-setup-'));
  const config = path.join(home, '.obsidian-quote/config.json');
  fs.mkdirSync(path.dirname(config));
  const write = value => fs.writeFileSync(config, JSON.stringify(value));
  let requests = 0;
  const token = 'synthetic-setup-credential';
  const server = http.createServer((req, res) => {
    requests++;
    res.setHeader('content-type', 'application/json');
    if (req.url === '/health') return res.end(JSON.stringify({ version: 'fixture', docs: 3, chunks: 7 }));
    if (req.headers.authorization !== 'Bearer ' + token) { res.statusCode = 401; return res.end('{}'); }
    res.end(JSON.stringify({ vaults: [{ name: 'Synthetic vault', enabled: true, docs: 3, chunks: 7 }] }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  try {
    let result = await inspectConnection({ home, env: {} });
    assert.equal(result.state, 'missing-config');
    for (const value of [null, [], 42]) {
      write(value);
      result = await inspectConnection({ home, env: {} });
      assert.equal(result.state, 'missing-config');
    }
    write({ url, token });
    result = await inspectConnection({ home, env: {} });
    assert.equal(result.state, 'ready');
    assert.equal(result.vaults, 1);
    assert.equal(result.docs, 3);
    assert.equal(result.panelUrl, url + '/ui');
    assert.ok(!JSON.stringify(result).includes(token));
    result = await inspectConnection({ home, env: { OBSIDIAN_QUOTE_TOKEN: 'wrong-fixture' } });
    assert.equal(result.state, 'unauthorized');
    write({ url: 'https://example.org', token });
    const count = requests;
    result = await inspectConnection({ home, env: {} });
    assert.equal(result.state, 'invalid-endpoint');
    assert.equal(requests, count);
    write({ url, token: 'bad\r\ncredential' });
    result = await inspectConnection({ home, env: {} });
    assert.equal(result.state, 'invalid-credential');
    assert.ok(!JSON.stringify(result).includes('bad'));
    write({ url, token });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
  const result = await inspectConnection({ home, env: {} });
  assert.equal(result.state, 'service-offline');
  console.log('6/6 setup checks passed: missing config, ready, authentication, endpoint boundary, malformed credential, offline service');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
