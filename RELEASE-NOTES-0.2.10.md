# Vault Quote 0.2.10

Release date: 2026-11-10. Obsidian plugin id: `vault-quote`; minimum Obsidian version: 1.5.0. Codex integration: 0.1.6.

The Codex knowledge panel can now register a local folder directly. Enter its absolute path under **添加本地路径**; the running Obsidian service validates and saves it, then indexes it. Newly added folders can be selected together with existing sources for a query.

## Changes

- Add an authenticated local-folder registration action to the Codex panel; reject relative, missing, invalid and duplicate paths.
- Persist the registration in the Obsidian plugin settings and start indexing without exposing absolute paths in panel metadata.
- Show indexing progress and disable queries until indexing finishes.
- Keep the existing Obsidian management panel for service settings and include/exclude scope, and preserve the conversation panel and six original MCP tools.

## Installation and compatibility

The exact Obsidian release tag is **`0.2.10`**, matching `manifest.json`. The release includes `main.js`, `manifest.json`, `styles.css`, `vault-quote-v0.2.10.zip`, and `SHA256SUMS-0.2.10.txt`. The ZIP contains the three install files under `vault-quote/`; preserve the existing `data.json` when updating manually.

Codex integration **0.1.6** is published in the same repository release. Updating the GitHub release does not update an already-installed Codex plugin automatically; refresh the marketplace, update/reinstall the plugin, and reload Codex. Existing connection settings, notes, registered paths, DeepSeek 0.5.1, Claude 0.1.2, and CLI/MCP 0.2.3 remain compatible.

## Verification

- Production build passed.
- Core regression suite: 136/136.
- Codex settings MCP: 10/10; panel interactions: 8/8.
- Actual Codex installation and runtime discovery passed in an isolated test profile.
- Setup checks: 6/6; release and community checks: 9/9.

Synthetic vault fixtures and API stubs are used; no user notes or connection credentials are included in the release assets.
