# Vault Quote 0.2.8

Release date: 2026-11-06. Desktop plugin id: `vault-quote`; minimum Obsidian version: 1.5.0. This release fixes findings from the existing community page's 0.2.7 scorecard.

## Changes

- Remove `Obsidian` from the installable description in both manifests.
- Preserve the user's workspace leaf placement on unload while stopping the service, timers, watchers and subscriptions.
- Respect the current vault's actual configuration directory in indexing and file-change filtering. Preserve ordinary same-named folders in other registered vaults.
- Replace thirteen `:has()` selectors with explicit wide-setting classes, retaining the management panel's full-width text fields and compact numeric rows.
- Remove routine console logging and explicitly scope server-shutdown timers to Node, retaining headless HTTP compatibility.
- Add English README content, the matching Vault Quote title, a contribution guide and detailed community-review instructions. Preserve the nine Chinese FAQs, actual client screenshots and existing video links.

## Installation and compatibility

The exact numeric tag is **`0.2.8`**, with separate `main.js`, `manifest.json` and `styles.css` assets for the community installer. A manual-install `vault-quote-v0.2.8.zip` and SHA-256 checksums are also provided.

For a manual update, disable Vault Quote and replace only its three program files under `<vault>/<configDir>/plugins/vault-quote/`; preserve `data.json`. Legacy `obsidian-quote` users should follow [the migration guide](docs/OBSIDIAN-SUBMISSION.md#已有用户怎样保留配置) and keep the old plugin disabled when enabling the new id.

DeepSeek Harness 0.5.1, Codex 0.1.4, Claude 0.1.2, CLI/MCP 0.2.3, the shared connection format and retrieval API are unchanged. Existing working client integrations do not need reinstalling. Supplementary source/client packages and the original promo video remain in the existing **v0.2.7** prerelease; its tags and assets are not rewritten. Live local deployments, notes and personal configuration are not part of this release.

## Verification and remaining disclosures

Production build; 134/134 existing regressions; 9/9 release and community regressions; 25/25 Host probes; 90/90 Client probes. The new description, unload, rendered-layout and custom-config cases first reproduced failures on 0.2.7. These are automated tests with generated data and API stubs, not a complete real-desktop acceptance run.

Node filesystem access and user-initiated clipboard writes remain intentional capabilities. The legacy settings tab has not migrated to the 1.13 global settings-search API. SHA-256 checksums are provided, but GitHub artifact attestations are not. The website may continue reporting these disclosures. Publication does not mean the official scanner has rerun or approved this release; check the existing entry's developer-management page for the new release and review status.
