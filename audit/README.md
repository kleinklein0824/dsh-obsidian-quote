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

## Historical marketplace packaging check (integration 0.1.1)

Windows / Codex CLI 0.166.0-alpha.6 / Claude Code 2.1.318: the original missing-manifest error was reproduced in an isolated Codex configuration. With the new catalogs, both actual CLIs added the local marketplace and installed `obsidian-quote@dsh-obsidian-quote`. Claude's strict plugin and marketplace manifest validations passed. This checks installer compatibility, independently of the host stubs used by the original 134-case suite.

Both installers also added the published GitHub URL and installed the plugin in separate isolated configurations. The test script then resolved and substituted each remote-installed cache's plugin-root path before launching MCP against a synthetic vault through real HTTP. Each package initialized, listed six tools, and passed calls to all six tools: 12/12 combined. This did not test the client's own path expansion; the Codex runtime defect was subsequently reproduced and fixed in integration 0.1.2. Credentials were generated for the fixture, and existing user configuration was not modified. This does not certify desktop interaction, a real user's vault, or every client/version.


## Codex conversation panel (0.1.3)

Run `node audit/codex-panel.cjs` from the repository root with Node 22+ and Chrome/Edge. The check uses synthetic metadata and a dedicated browser profile. It verifies public-field filtering, script injection resistance, scoped follow-up requests, state restoration without silently broadening invalid sources, bridge failure recovery, and 320px/desktop layout containment. It does not inspect the user's browser or certify a native Codex desktop modal, sidebar or the host's real confirmation flow.

The panel renderer reads only the supplied public snapshot. It has no connection-file or service access. Existing Obsidian, DeepSeek and MCP runtime files must remain byte-identical to v0.2.3 for this integration-only revision.

## Actual Codex runtime and setup regression (0.1.2)

`npm run test:codex` requires an installed Codex CLI. It installs this package into a temporary isolated home, starts the actual app-server, and asserts automatic MCP startup, all six tool names and the registered onboarding Skill. No path placeholder is expanded by the test. The old 0.1.0/0.1.1 config fails this test during MCP initialization. `npm run test:setup` runs six real HTTP/local-config cases for the setup helper, including credential redaction and rejection of non-loopback endpoints. Existing 12/12 direct-process checks remain useful for tools but were insufficient to certify host startup.

## Codex native settings and direct-query panel (0.1.4)

From the repository root, run `node audit/codex-settings.cjs` (7 checks) and `node audit/codex-settings-ui.cjs` (7 checks). The first starts the actual dedicated stdio panel server against synthetic authenticated HTTP data. It checks settings capability and output schema, UI resources, app-only tools, credential/path exclusion, stable vault ids, strict source handling and absence of connection-file writes.

The second opens the actual panel HTML in an isolated Chrome/Edge bridge fixture. Clicks display results without model messages; tests cover injection, expired selection preservation, explicit recovery, two sequential 11-second service responses and 320px layout. Node 22+ and Chrome/Edge are required; expect the slow-response case to take about 22 seconds. This does not certify the actual desktop settings-button renderer.

`test:codex` now also checks automatic startup of `obsidian-quote-panel`, discovery of `openai/settings` and the UI resource. The original six-tool server launch and all Obsidian/Harness/CLI runtime files are unchanged. Original conversation-panel coverage remains in `codex-panel.cjs`.

## Documentation acceptance and concurrent-use check (v0.2.6)

User-provided screenshots in the main README show the actual Codex settings entry, open native panel and existing DeepSeek sidebar. They establish the observed entry and connection state; the Codex screenshot has an empty query field, so it does not establish desktop query-result acceptance. Private workspace, vault and note names are covered in the published copy.

`concurrent-use-evidence.json` records a separate isolated acceptance run against the existing `QuoteServer`, `VaultIndexer`, original MCP script and Codex panel script. It created two synthetic vaults and a temporary loopback service, started three independent six-tool MCP processes plus one panel MCP process, then issued 48 HTTP and 32 MCP searches together. Each requested source was checked; the shared ledger reached 80 queries and note bytes/mtimes stayed unchanged. Repeated starts, a second listener on the occupied port and concurrent index rebuilds were also checked, for 6/6 checks. No real user vault or connection-file write was involved. This is a recorded acceptance run, not a new all-Harness UI test suite or a throughput guarantee.

Runtime files and versions remain identical to v0.2.5. Earlier suite results keep their original validation version; they were not all rerun for a documentation release.


## Obsidian submission metadata and settings identity (0.2.7, 2026-11-06)

Run `npm run test:release` inside `plugin/`. The five checks verify the documented community ID/name requirements, identical root/installable manifests, numeric release/version mapping, and the actual rendered advanced-settings button under both `vault-quote` and legacy `obsidian-quote` manifests. The original metadata fails the two naming checks; the original hardcoded settings target fails the new-id button check. All five pass after the fix.

The full 134-case suite (including production build), 25 Host probes and 90 Client probes were rerun in the isolated release worktree. Runtime files under `harness-plugin/`, `harness-skill/` and `codex/` remain identical to c79b152; the Harness README and screenshots sidecar are documentation additions. The live local deployments and shared user configuration were not overwritten. These checks do not assert approval by the Obsidian directory or complete real-desktop acceptance.
