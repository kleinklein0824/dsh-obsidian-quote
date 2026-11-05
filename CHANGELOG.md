# Changelog

## Unreleased — client integration 0.1.0

- Add Codex and Claude Code marketplace catalogs and plugin manifests so each client can discover and install the integration from this repository.
- Reuse the existing MCP server with each client's plugin-root variable; keep local credentials outside the package.
- Add a shared knowledge-retrieval skill and document installation, stdio requirements, the separate Obsidian service, and the DeepSeek-only panel.
- Correct legacy skill examples to use the current 16-hex-digit rule IDs; add an installed-component code and version checklist to UPDATING.md.
- Existing Obsidian 0.2.1 and Harness panel 0.5.1 release assets remain unchanged; marketplace installation uses the updated main branch.

## 0.2.1 — 2026-11-05

- Remove an accidentally embedded credential and machine-specific test paths from release source.
- Generate tokens with cryptographic randomness; reject missing tokens and non-loopback listening hosts.
- Revoke browser sessions on restart/token change, enforce same-origin cookie access, require explicit credentials for reindexing, and close a listener unloaded during startup.
- Tighten requested POSIX config/backup access modes; document Windows ACL limitations.
- Check actual peers and loopback Host in the Harness proxy; prevent credentials appearing in malformed-header errors.
- Filter rule occurrences by source before merging so copied rules remain in selected vaults/folders.
- Deduplicate by full text, preserve code punctuation/case/spaces, and use 16-hex-digit SHA256-derived public IDs. **Old six-digit IDs change; refresh saved citations.**
- Reject ambiguous vault names in profiles and preserve MCP source warnings.
- Upgrade esbuild to 0.28.2 and regenerate the lockfile.
- Add security regressions, an isolated Host probe runner and real-browser checks; correct unsupported documentation claims.

The optional Harness panel is independently versioned as 0.5.1, including its visible build badge, so installed users can identify the corrected adapter. Update the Obsidian plugin, Harness adapter and any copied CLI/MCP scripts together. See UPDATING.md. These checks do not certify a real Obsidian/Harness compatibility matrix.

