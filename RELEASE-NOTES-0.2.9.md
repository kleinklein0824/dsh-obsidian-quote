# Vault Quote 0.2.9

Release date: 2026-11-10. Obsidian plugin id: `vault-quote`; minimum Obsidian version: 1.5.0. Codex integration: 0.1.5.

This release lets users register local reference directories outside the currently open Obsidian vault and select several registered paths together in the Codex knowledge panel.

## Changes

- Clarify that registered reference directories may be outside the active Obsidian vault.
- Search all enabled directories or any selected combination in one Codex panel query.
- Reject empty, disabled, deleted, or malformed source selections without widening the search to other directories.
- Keep the existing retrieval API, note contents, DeepSeek integration, Claude integration, and CLI/MCP tools unchanged.

## Installation and compatibility

The exact Obsidian release tag is **`0.2.9`**, matching `manifest.json`. The release includes `main.js`, `manifest.json`, `styles.css`, `vault-quote-v0.2.9.zip`, and `SHA256SUMS-0.2.9.txt`. The ZIP contains the three install files under `vault-quote/`; preserve the existing `data.json` when updating manually.

The repository source at tag `0.2.9` also includes Codex integration 0.1.5. Existing DeepSeek 0.5.1, Claude 0.1.2, CLI/MCP 0.2.3, connection settings, and registered vault configuration do not require migration.

## Verification and limits

Production build passed; core regression suite **134/134**; release/community checks **9/9**; Codex service checks **8/8**; panel interaction checks **7/7**; Codex runtime installation check passed. These checks use synthetic data and host/API stubs. A full real-desktop acceptance run was not performed.
