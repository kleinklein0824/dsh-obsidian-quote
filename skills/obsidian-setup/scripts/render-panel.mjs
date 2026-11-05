// Produces a credential-free conversation fragment from an explicit public snapshot.
// This adapter neither reads connection settings nor calls the Obsidian service.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function fail() {
  console.error('Invalid panel input. Use --data <public-snapshot.json> --output <panel.html>; settings and credentials are not accepted.');
  process.exitCode = 1;
}
try {
  if (args.length !== 4 || args[0] !== '--data' || args[2] !== '--output') throw Error();
  const input = path.resolve(args[1]);
  const output = path.resolve(args[3]);
  if (input === output || path.extname(output).toLowerCase() !== '.html') throw Error();
  if (fs.statSync(input).size > 131072) throw Error();
  const source = JSON.parse(fs.readFileSync(input, 'utf8'));
  if (!source || typeof source !== 'object' || Array.isArray(source) || !Array.isArray(source.vaults)) throw Error();
  if (!['ready', 'offline', 'auth-error', 'missing-config'].includes(source.state)) throw Error();
  const text = (value, max) => typeof value === 'string' ? value.slice(0, max).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '') : '';
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
  const data = {
    state: source.state,
    checkedAt: Number.isFinite(Date.parse(source.checkedAt)) ? new Date(source.checkedAt).toISOString() : '',
    serviceVersion: /^\d+\.\d+\.\d+(?:[-.][\w.]+)?$/.test(source.serviceVersion) ? source.serviceVersion : '',
    vaults: source.vaults.slice(0, 100).filter(v => v && typeof v.name === 'string' && v.name.trim() && v.name.length <= 256).map(v => ({
      name: text(v.name, 256), enabled: v.enabled === true, docs: count(v.docs), chunks: count(v.chunks),
    })),
    results: Array.isArray(source.results) ? source.results.slice(0, 10).filter(v => v && typeof v === 'object').map(v => ({
      title: text(v.title, 256),
      path: typeof v.path === 'string' && !/^(?:[a-z]:|[\\/])/i.test(v.path) ? text(v.path, 512) : '',
      text: text(v.text, 8000),
    })) : [],
  };
  const json = JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  const template = fs.readFileSync(new URL('../references/panel.html', import.meta.url), 'utf8');
  const marker = '<!-- OBSIDIAN_QUOTE_DATA -->';
  if (template.split(marker).length !== 2) throw Error();
  const fragment = template.replace(marker, () => json);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, fragment);
  console.log(JSON.stringify({ output, state: data.state, vaults: data.vaults.length, credentialsIncluded: false }));
} catch {
  fail();
}
