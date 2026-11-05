const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
execFileSync(process.execPath, [path.join(__dirname, 'fixtures.mjs')], { stdio: 'ignore' });
(async () => {
  const results = [];
  for (const test of require('./suite-security.cjs')) {
    try {
      const result = await test.run();
      results.push({ id: test.id, name: test.name, ...result });
    } catch (error) {
      results.push({ id: test.id, name: test.name, pass: false, detail: error.message });
    }
    const item = results.at(-1);
    console.log(`${item.id} ${item.pass ? 'PASS' : 'FAIL'} ${item.name}${item.pass ? '' : '\n' + item.detail}`);
  }
  fs.writeFileSync(path.join(__dirname, 'security-results.json'), JSON.stringify(results, null, 2));
  const failed = results.filter(r => !r.pass).length;
  console.log(`${results.length - failed}/${results.length} security regression checks passed`);
  if (failed) process.exitCode = 1;
})();
