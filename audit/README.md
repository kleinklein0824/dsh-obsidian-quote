# Reproducible verification

From `plugin/`, after `npm ci --ignore-scripts`:

```bash
npm run build
npm test
npm run test:host
npm run test:client
npm run test:browser
npm audit --ignore-scripts
```

On 2026-11-05, Windows / Node.js 26.7.0 / npm 12.0.2:

| Check | Result | Actual scope |
| --- | --- | --- |
| `npm test` | 134/134 | Real indexing, read-only snapshots, rules, HTTP, CLI and MCP; Obsidian UI uses API/DOM stubs |
| `test:host` | 25/25 | Real HTTP against synthetic notes; simulated Harness route registration |
| `test:client` | 90/90 | Simulated React hooks, locale, UI slots and remote services |
| `test:browser` | 14/14 | Real Chrome and `/ui`; generated vaults and fixture QuoteHost |
| `npm audit` | 0 known vulnerabilities | Locked npm dependency advisory audit at verification time |

These results do not establish installation compatibility with actual Obsidian, DeepSeek Harness, Claude, Cursor or Codex. The minimum Obsidian version is a declaration, not a tested matrix. POSIX file modes were not tested on a POSIX filesystem.

`npm test` bundles TypeScript into `audit/core.cjs` and `audit/panel.cjs`, regenerates synthetic vaults, and runs twelve suites sequentially. Results go to `audit/results.json`. The 19 added cases T116–T134 cover security, source-scoped deduplication, rule identity, malformed credentials, ambiguous profiles and MCP warnings. Counts come from actual case arrays; legacy IDs also include T075b/T075c.

`test:host` wraps `harness-plugin/probe-host.mjs` with a fixture service and synthetic token. Do not run that probe against private notes merely to reproduce this release. `test:client` needs no real Harness process.

`test:browser` is optional: Node.js 22+ (global WebSocket) and installed Chrome/Edge are required. Set `OBSIDIAN_QUOTE_TEST_CHROME` if automatic Windows paths do not match. The browser uses a dedicated profile under `audit/tmp/`. Set `OBSIDIAN_QUOTE_TEST_SCREENSHOT` to an absolute output path to save a screenshot. Results go to `audit/browser-results.json`.

`test:security` runs the 17 cases in `suite-security.cjs`; `npm test` includes them plus the profile/MCP regressions in their own suites.

Run commands sequentially: they share bundles, ports and fixture directories. Generated vaults, temporary homes, browser profiles, result JSON and audit bundles must not be published as source. No actual user knowledge-base config is required by these test commands.

