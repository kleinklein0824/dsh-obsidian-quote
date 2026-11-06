const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { QuotePlugin, renderQuotePanel, Setting, El } = require('./panel.cjs');

global.window = { setTimeout, clearTimeout };

test('unloading releases service resources while preserving the panel workspace position', async () => {
  const leaf = { location: 'user-selected-left-dock' };
  let stopped = 0;
  let closed = 0;
  let notifications = 0;
  const plugin = new QuotePlugin({ workspace: {
    detachLeavesOfType() { leaf.location = 'default-right-dock'; },
  } }, { id: 'vault-quote', version: '0.2.8' });
  plugin.server = { async stop() { stopped++; } };
  plugin.watchers = [{ close() { closed++; } }];
  plugin.subscribe(() => notifications++);
  plugin.onunload();
  plugin.notify();
  assert.equal(stopped, 1);
  assert.equal(closed, 1);
  assert.equal(notifications, 0);
  assert.equal(leaf.location, 'user-selected-left-dock');
});

test('free-text setting rows keep the wide layout while numeric rows stay compact', async () => {
  const plugin = new QuotePlugin({}, { id: 'vault-quote', version: '0.2.8' });
  plugin.__data = { settings: { ui: { advanced: true }, server: { enabled: false, token: 'synthetic-token' } } };
  await plugin.loadSettings();
  plugin.indexer = { isBuilding: false, statsList: [], statsFor() {} };
  plugin.server = { isRunning: false };
  Setting.all = [];
  renderQuotePanel(new El('div'), plugin);
  let wide = 0;
  let compact = 0;
  for (const setting of Setting.all) {
    const controls = setting.controls.filter(({ type }) => type === 'text' || type === 'textarea');
    if (!controls.length) continue;
    const freeText = controls.some(({ type, control }) => type === 'textarea' || control.inputEl.type !== 'number');
    assert.equal(setting.el.classes.has('oq-setting-wide'), freeText, setting.name);
    if (freeText) wide++; else compact++;
  }
  assert.ok(wide >= 7 && compact >= 5);
});

test('a custom current-vault config folder is excluded without hiding same-named notes in another vault', async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-quote-config-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const current = path.join(root, 'current');
  const external = path.join(root, 'external');
  // On Windows the API spelling and the directory entry can differ in case.
  const actualConfigDir = process.platform === 'win32' ? 'App-Config' : 'app-config';
  for (const vault of [current, external]) {
    fs.mkdirSync(path.join(vault, actualConfigDir), { recursive: true });
  }
  fs.writeFileSync(path.join(current, actualConfigDir, 'private.md'), 'PRIVATECONFIGSENTINEL must stay private.');
  fs.writeFileSync(path.join(current, 'visible.md'), 'VISIBLEGUIDESENTINEL must stay searchable.');
  fs.writeFileSync(path.join(external, actualConfigDir, 'legit.md'), 'EXTERNALGUIDESENTINEL is a normal note.');
  const app = {
    vault: { configDir: 'app-config', adapter: { getBasePath: () => current } },
    workspace: { onLayoutReady() {} },
  };
  const plugin = new QuotePlugin(app, { id: 'vault-quote', version: '0.2.8' });
  plugin.__data = { settings: { server: { enabled: false }, index: { watch: false } } };
  await plugin.onload();
  t.after(() => plugin.onunload());
  plugin.addVault(current);
  plugin.addVault(external);
  await plugin.indexer.build();
  assert.equal(plugin.indexer.search('PRIVATECONFIGSENTINEL').hits.length, 0);
  assert.equal(plugin.indexer.search('VISIBLEGUIDESENTINEL').hits.length, 1);
  assert.equal(plugin.indexer.search('EXTERNALGUIDESENTINEL').hits.length, 1);
  assert.equal(plugin.isRelevantChange('app-config/private.md', current), false);
  assert.equal(plugin.isRelevantChange(`${actualConfigDir}/private.md`, current), false);
  assert.equal(plugin.isRelevantChange('app-config/legit.md', external), true);
  assert.equal(plugin.isRelevantChange(`${actualConfigDir}/legit.md`, external), true);
});
