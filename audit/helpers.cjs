const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");
const core = require("./core.cjs");

const ROOT = path.join(__dirname, "vaults");
const VA = path.join(ROOT, "Vue规范库");
const VB = path.join(ROOT, "嵌入式库");
const VC = path.join(ROOT, "禁用库");
const TMP = path.join(__dirname, "tmp");
const PROJECT = path.resolve(__dirname, "..");
const PLUGIN = path.join(PROJECT, "plugin");
const SKILL = path.join(PROJECT, "harness-skill");

function vaults(extra = {}) {
	return [
		{ id: "va", name: "Vue规范库", path: VA, enabled: true },
		{ id: "vb", name: "嵌入式库", path: VB, enabled: true },
		...(extra.includeDisabled ? [{ id: "vc", name: "禁用库", path: VC, enabled: false }] : []),
	];
}

function settings(overrides = {}) {
	const s = core.createDefaultSettings();
	s.vaults = overrides.vaults || vaults({ includeDisabled: true });
	if (overrides.scope) Object.assign(s.scope, overrides.scope);
	if (overrides.retrieval) Object.assign(s.retrieval, overrides.retrieval);
	if (overrides.index) Object.assign(s.index, overrides.index);
	if (overrides.server) Object.assign(s.server, overrides.server);
	if (overrides.profiles) s.profiles = overrides.profiles;
	return s;
}

async function build(overrides = {}) {
	const s = settings(overrides);
	const indexer = new core.VaultIndexer(() => s);
	await indexer.build();
	return { s, indexer };
}

function walk(dir, base = dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const abs = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(abs, base, out);
		else if (entry.isFile()) out.push(path.relative(base, abs).replace(/\\/g, "/"));
	}
	return out.sort();
}

function snapshot(dir) {
	const map = new Map();
	for (const rel of walk(dir)) {
		const abs = path.join(dir, rel);
		const stat = fs.statSync(abs);
		const hash = crypto.createHash("sha1").update(fs.readFileSync(abs)).digest("hex");
		map.set(rel, `${hash}:${stat.mtimeMs}:${stat.size}`);
	}
	return map;
}

function sameSnapshot(a, b) {
	if (a.size !== b.size) return false;
	for (const [key, value] of a) if (b.get(key) !== value) return false;
	return true;
}

function ensureProject() {
	const dir = path.join(TMP, "proj");
	fs.mkdirSync(path.join(dir, "src"), { recursive: true });
	fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { vue: "^3", pinia: "^2" }, devDependencies: { typescript: "^5", vite: "^5" } }));
	fs.writeFileSync(path.join(dir, "tsconfig.json"), "{}");
	fs.writeFileSync(path.join(dir, "src", "a.vue"), "<template/>");
	fs.writeFileSync(path.join(dir, "src", "b.ts"), "export {}");
	return dir;
}

function makeVault(name, files) {
	const dir = path.join(TMP, name);
	fs.rmSync(dir, { recursive: true, force: true });
	for (const [rel, content] of Object.entries(files)) {
		const abs = path.join(dir, rel);
		fs.mkdirSync(path.dirname(abs), { recursive: true });
		fs.writeFileSync(abs, content, "utf8");
	}
	return dir;
}

function run(cwd, args, env = {}, timeout = 20000) {
	return new Promise((resolve) => {
		execFile(process.execPath, args, { cwd, env: { ...process.env, ...env }, timeout, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
			resolve({ code: error ? (typeof error.code === "number" ? error.code : 1) : 0, stdout, stderr, timedOut: Boolean(error && error.killed) });
		});
	});
}

function runNpm(script) {
	return new Promise((resolve) => {
		const child = require("node:child_process").spawn("npm", ["run", script], { cwd: PLUGIN, shell: true });
		let out = "";
		child.stdout.on("data", (d) => (out += d));
		child.stderr.on("data", (d) => (out += d));
		child.on("close", (code) => resolve({ code, out }));
	});
}

async function startService(s = settings()) {
	const indexer = new core.VaultIndexer(() => s);
	await indexer.build();
	const ledger = new core.CitationLedger();
	const host = {
		getSettings: () => s,
		getStatus: () => {
			const stats = new Map(indexer.statsList.map((item) => [item.vaultId, item]));
			return {
				version: require(path.join(PLUGIN, "manifest.json")).version,
				vaults: s.vaults.map((vault) => {
					const stat = stats.get(vault.id);
					return { id: vault.id, name: vault.name, path: vault.path, enabled: vault.enabled, docs: stat ? stat.docs : 0, chunks: stat ? stat.chunks : 0, rules: stat ? stat.rules : 0, error: stat && stat.error };
				}),
				totalDocs: indexer.docCount,
				totalChunks: indexer.chunkCount,
				totalRules: indexer.ruleCount,
				indexing: indexer.isBuilding,
				lastBuiltAt: indexer.lastBuiltAt,
				server: { running: true, url: "", port: s.server.port },
				settings: s,
			};
		},
		search: (q, o) => indexer.search(q, o),
		buildContext: (q, b, l, src, p) => indexer.buildContext(q, b, l, src, p),
		getRules: (o) => indexer.getRules(o),
		buildBrief: (o) => indexer.buildBrief(o),
		getStats: () => ledger.getStats(),
		recordCitation: (k, q, r) => ledger.record(k, q, r),
		rebuild: () => indexer.build(),
		log: () => {},
	};
	const server = new core.QuoteServer(host);
	await server.start();
	return { s, indexer, ledger, host, server, base: `http://127.0.0.1:${server.port}` };
}

ensureProject();

module.exports = {
	core, ROOT, VA, VB, VC, TMP, PROJECT, PLUGIN, SKILL,
	vaults, settings, build, ensureProject, snapshot, sameSnapshot, makeVault, run, runNpm, startService, walk,
};
