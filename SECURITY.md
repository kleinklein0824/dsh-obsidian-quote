# Security

## Scope and trust boundaries

This is a desktop, single-user, local retrieval service. Indexing reads Markdown; the plugin persists its own settings and citation ledger. Explicit configuration actions also write `~/.obsidian-quote/config.json` and may keep `config.json.bak`. Retrieved content can leave the machine when an AI client sends it to its model provider.

QuoteServer requires a nonempty token and loopback binding. Data APIs require a token or a permitted browser session. `/health` intentionally exposes basic service/index status without authentication. Browser cookies are same-origin, HttpOnly, SameSite=Strict, expire after 12 hours, and are revoked on restart or token change. Cookies cannot authorize `/reindex`.

The optional Harness proxy checks actual loopback peers, loopback Host and browser Origin. It has no separate per-user authentication layer. Local programs acting as the trusted user can reach that proxy. Use it only in a trusted single-user host; do not expose either service through port forwarding or a public reverse proxy.

Local credentials are plaintext, including plugin `data.json`, exported config, and backups. POSIX code requests mode 0700 only for the exported `~/.obsidian-quote/` directory and mode 0600 for its `config.json` and backup. Obsidian saves plugin `data.json`; its access permissions depend on the vault and Obsidian, and this plugin does not harden them. Windows permissions are inherited ACLs. Review access to containing folders on shared computers. This does not prevent local administrator access or other processes running as the same user.

Prefer login forms and Authorization headers. URL token compatibility can leave credentials in history or logs. Notes and retrieved Markdown are untrusted content: verify instructions before allowing an AI assistant to act on them.

## Capabilities disclosed by the community scanner

The desktop plugin uses Node `fs` because the user can explicitly register multiple local vault directories outside the current vault. Scanning reads Markdown in enabled, allowed scopes; file-system watchers trigger index refreshes. Hidden directories and the current vault's actual `Vault.configDir` are excluded. An external vault's non-hidden custom configuration directory is not discoverable through the current application's API; exclude it explicitly in scope settings. The file API capability itself is broad, so this relies on the code and user-selected scopes rather than an OS sandbox.

Explicit actions can write this plugin's settings/ledger and local connection configuration with a backup. Management-panel copy actions write generated client-connection examples; the browser UI can also copy retrieved Markdown. All clipboard writes require a user click, and the plugin does not read clipboard content. Connection examples can contain the token and should stay private.

Release 0.2.8 provides SHA-256 checksums but does not yet provide GitHub artifact attestations. Checksums establish byte consistency, not trusted build provenance or a security review. The minimum supported application remains 1.5.0; the plugin retains its existing settings UI rather than declaring an empty 1.13 settings-search API to suppress a warning.

## Rotate a credential

1. Close Obsidian. The current panel's token field is read-only, so rotation is an offline configuration edit: back up `<vault>/<configDir>/plugins/<installed-plugin-id>/data.json` (`configDir` defaults to `.obsidian`; the community id is `vault-quote`, while legacy installations use `obsidian-quote`) privately and replace only `settings.server.token` with a newly generated random secret. A local command such as `node -p "require('node:crypto').randomBytes(32).toString('hex')"` can generate one. Preserve all other settings and never commit that backup. Do not delete existing settings just to rotate a token.
2. Reopen Obsidian and use the panel's explicit **write connection config** action to update CLI/MCP/Harness access.
3. Replace the old token in environment variables and remove copied URLs, screenshots or local copies containing it. Replace or delete old `config.json.bak` files too: writing a new config can back up the previous secret.
4. Restart MCP sessions that cached the previous configuration. Log in again and confirm the old token no longer authorizes `/vaults`.
5. If a secret reached a Git commit or public upload, rotate it first, then remove it from history and other published assets. Deleting the latest file does not revoke a credential or erase old copies.

Release preparation found a credential in an old probe assertion and removed it from distributed source. The original archive and previously exported copies can still contain it. Changing the source alone does not rotate an active credential.

## Reporting

Do not put tokens, private notes or personal paths in public issues. Send a reproduction with synthetic data through the repository's private vulnerability reporting feature if enabled. If no private channel exists, open a non-sensitive request for a reporting contact first. Include version, operating system, endpoint and expected/actual behavior.

Automated tests, dependency audits and antivirus scans have limited coverage; they do not guarantee the absence of unknown vulnerabilities or malicious changes.

