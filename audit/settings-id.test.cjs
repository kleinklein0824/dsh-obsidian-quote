const assert = require('node:assert/strict');
const test = require('node:test');
const core = require('./core.cjs');
const { QuotePlugin, renderQuotePanel, El } = require('./panel.cjs');

for (const id of ['vault-quote', 'obsidian-quote']) {
  test(`the rendered settings button opens the loaded plugin id: ${id}`, async () => {
    const opened = [];
    const app = { setting: { open() {}, openTabById(tab) { opened.push(tab); } } };
    const plugin = new QuotePlugin(app, { id, version: '0.2.7' });
    plugin.__data = { settings: { vaults: [], ui: { advanced: true }, server: { enabled: false, token: 'synthetic-test-token' } } };
    await plugin.loadSettings();
    plugin.indexer = new core.VaultIndexer(() => plugin.settings);
    plugin.server = new core.QuoteServer(plugin);
    const root = new El('div');
    renderQuotePanel(root, plugin, { showSettingsLink: true });
    const button = root.find((element) => element.tagName === 'button' && element.textContent === '全部设置')[0];
    assert.ok(button, 'the advanced panel must render its actual settings button');
    button.click();
    assert.deepEqual(opened, [id]);
  });
}
