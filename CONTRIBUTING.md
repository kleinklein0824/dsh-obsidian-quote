# Contributing to Vault Quote

The community desktop plugin is **Vault Quote** (`vault-quote`). The repository and client integrations retain the **Obsidian Quote** brand. Contributions should preserve the existing local retrieval API and keep client component versions independent.

## Development setup

Use Node.js 18 or later for the CLI/MCP tools and a current Node.js version supported by the locked build dependencies. Browser acceptance probes require Node.js 22 or later and Chrome or Edge. From the repository root:

```bash
cd plugin
npm ci --ignore-scripts
npm run build
npm test
npm run test:release
npm run test:host
npm run test:client
```

The build writes `plugin/main.js`. Install only that file, `plugin/manifest.json` and `plugin/styles.css` into a disposable desktop test vault's `<configDir>/plugins/vault-quote/`. The default configuration directory is `.obsidian`; respect the application's actual configuration directory. See [audit instructions](audit/README.md) for optional browser and client-runtime probes and their limitations.

## Component boundaries

- `plugin/`: desktop management panel, local indexing and authenticated loopback HTTP service.
- `harness-plugin/`: DeepSeek Harness Host/Client sidebar integration.
- `harness-skill/`: CLI and six read-only MCP retrieval tools.
- `codex/` and the root/client manifests: client-specific panels and marketplace entrypoints.

Installing one component does not install another application. Keep the desktop management panel and existing client connection formats working. A change to the desktop plugin does not automatically require a Harness version bump or an installed-user migration.

## Changes and validation

Describe the concrete problem, expected behavior and affected components in an issue or pull request. For fixes, add focused behavior coverage that reproduces the original problem when useful, then run checks appropriate to the changed component. Use generated Markdown, temporary vaults and test-only credentials. Do not run mutation probes against a user's real notes, installed plugins or shared connection configuration.

Keep root `manifest.json` and `plugin/manifest.json` identical. For a desktop release, update the version map and package metadata and use an exact numeric Git tag matching the manifest version. Never rewrite an already published release to change its executable files. Update documentation and changelog with actual test evidence and any remaining limitations.

## Privacy and reporting

Never commit `data.json`, local connection files/backups, live tokens, private vault paths or unredacted screenshots. Treat note content as untrusted data. Read [SECURITY.md](SECURITY.md) before changing authentication, filesystem scope, clipboard actions or network behavior; use its reporting guidance for vulnerabilities.
