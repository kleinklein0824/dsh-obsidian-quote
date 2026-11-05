#!/usr/bin/env node
/** Bundles the plugin sources and the Obsidian stub for the audit suites. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const dir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const esbuild = require(path.join(dir, "..", "plugin", "node_modules", "esbuild"));

await esbuild.build({
	entryPoints: [path.join(dir, "entry.ts")],
	bundle: true,
	platform: "node",
	format: "cjs",
	outfile: path.join(dir, "core.cjs"),
	external: ["obsidian"],
	logLevel: "warning",
});

await esbuild.build({
	entryPoints: [path.join(dir, "panel-entry.ts")],
	bundle: true,
	platform: "node",
	format: "cjs",
	outfile: path.join(dir, "panel.cjs"),
	alias: { obsidian: path.join(dir, "obsidian-stub.ts") },
	logLevel: "warning",
});

console.log("audit bundles ready");
