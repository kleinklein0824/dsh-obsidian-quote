// Run the Host probe against generated notes and a synthetic credential.
// Never connect a reproducible test to the user's actual vault or configuration.
const path = require('node:path');
const { core, makeVault, run, settings, startService, PROJECT } = require('./helpers.cjs');
(async () => {
  const vault = makeVault('host-probe', {
    'Vue3/组件命名规范.md': '# 命名规范\n\nVue 3 组件命名必须采用 PascalCase，组件名必须清晰。\n\nTypeScript 接口命名应该说明用途。\n',
    '其他/命名约定.md': '# 命名约定\n\n目录命名应该使用一致格式。\n',
  });
  const token = 'synthetic-host-probe-token';
  const svc = await startService(settings({
    vaults: [{ id: 'probe', name: 'Obsidian test1', path: vault, enabled: true }],
    server: { port: 45971, token },
  }));
  try {
    const result = await run(PROJECT, [path.join(PROJECT, 'harness-plugin', 'probe-host.mjs')], {
      OBSIDIAN_QUOTE_URL: svc.base, OBSIDIAN_QUOTE_TOKEN: token,
    });
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exitCode = result.code;
  } finally { await svc.server.stop(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
