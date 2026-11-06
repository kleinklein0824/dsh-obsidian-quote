const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const manifest = read('manifest.json');

// These assertions follow the published Obsidian manifest submission rules.
// They catch the actual rejection before an author publishes another release.
test('Obsidian plugin id satisfies the community submission naming rules', () => {
  assert.match(manifest.id, /^[a-z]+(?:-[a-z]+)*$/);
  assert.ok(!manifest.id.includes('obsidian'), 'Plugin ID must not contain "obsidian"');
  assert.ok(!manifest.id.endsWith('plugin'), 'Plugin ID must not end with "plugin"');
});

test('Obsidian plugin display name satisfies the community submission naming rules', () => {
  assert.ok(!/obsidian/i.test(manifest.name), 'Plugin name must not contain "Obsidian"');
  assert.match(manifest.name, /^[A-Za-z0-9 +()-]+$/);
  assert.ok(!/plugin/i.test(manifest.name), 'Plugin name must not contain "Plugin"');
});

test('the directory description omits the redundant product name', () => {
  assert.ok(!/obsidian/i.test(manifest.description), 'Plugin description must not include "Obsidian"');
});

test('root and installable manifests describe the same plugin and release', () => {
  assert.deepEqual(manifest, read('plugin/manifest.json'));
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(read('plugin/package.json').version, manifest.version);
  assert.equal(read('versions.json')[manifest.version], manifest.minAppVersion);
  assert.equal(manifest.isDesktopOnly, true);
});
