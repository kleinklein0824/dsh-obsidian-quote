#!/usr/bin/env node
/**
 * obsidian-quote CLI — thin client for the local read-only retrieval service
 * exposed by the Obsidian Quote plugin. Zero dependencies, Node 18+.
 *
 *   node kb.mjs status
 *   node kb.mjs vaults
 *   node kb.mjs search "命名规范" --limit 5
 *   node kb.mjs context "GPIO 输入模式" --budget 6000
 *   node kb.mjs init --url http://127.0.0.1:43117 --token <token>
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_PATH = path.join(os.homedir(), ".obsidian-quote", "config.json");
const DEFAULT_URL = "http://127.0.0.1:43117";
const BOOLEAN_FLAGS = new Set(["json", "help"]);
// A half-open connection on the server side makes a bare fetch() wait for the
// Node default requestTimeout (300 s), which looks like a frozen CLI.
const REQUEST_TIMEOUT_MS = 15000;

function readConfigFile() {
	try {
		return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
	} catch {
		return {};
	}
}

function setFlag(flags, key, value) {
	if (!(key in flags)) {
		flags[key] = value;
		return;
	}
	if (Array.isArray(flags[key])) flags[key].push(value);
	else flags[key] = [flags[key], value];
}

function parseArgs(argv) {
	const positional = [];
	const flags = {};
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg.startsWith("--")) {
			let key = arg.slice(2);
			// Support the GNU-style `--flag=value` spelling as well as `--flag value`.
			// Previously `--limit=2` produced the key "limit=2", which matched no
			// known flag and was dropped silently, so the command quietly ran with
			// its default instead of the requested value.
			let inlineValue;
			const eq = key.indexOf("=");
			if (eq !== -1) {
				inlineValue = key.slice(eq + 1);
				key = key.slice(0, eq);
			}
			if (BOOLEAN_FLAGS.has(key)) {
				setFlag(flags, key, inlineValue === undefined ? true : inlineValue !== "0" && inlineValue !== "false");
				continue;
			}
			if (inlineValue !== undefined) {
				setFlag(flags, key, inlineValue);
				continue;
			}
			const next = argv[i + 1];
			if (next === undefined || next.startsWith("--")) {
				setFlag(flags, key, true);
			} else {
				setFlag(flags, key, next);
				i++;
			}
		} else {
			positional.push(arg);
		}
	}
	return { positional, flags };
}

function parseSource(value) {
	const raw = String(value).trim();
	if (!raw) return null;
	const index = raw.indexOf("/");
	return index === -1 ? { vault: raw } : { vault: raw.slice(0, index), path: raw.slice(index + 1) };
}

function collectSources(flags) {
	const list = [];
	const add = (value) => {
		for (const item of [].concat(value)) {
			const parsed = parseSource(item);
			if (parsed) list.push(parsed);
		}
	};
	if (flags.vault) add(flags.vault);
	if (flags.source) add(flags.source);
	return list.length > 0 ? list : undefined;
}

function applyScope(body, flags) {
	const sources = collectSources(flags);
	if (sources) body.sources = sources;
	if (flags.profile) body.profile = String(flags.profile);
}

function numberFlag(flags, key) {
	const value = flags[key];
	if (value === undefined || value === true) return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function printWarnings(result) {
	for (const warning of result.warnings || []) process.stderr.write(`警告：${warning}\n`);
}

async function probeStatus(config, endpoint) {
	try {
		const headers = config.token ? { authorization: `Bearer ${config.token}` } : {};
		const response = await fetch(config.url + endpoint, { headers, signal: AbortSignal.timeout(5000) });
		return response.status;
	} catch {
		return 0;
	}
}

function resolveConfig(flags) {
	const file = readConfigFile();
	const url = String(flags.url || process.env.OBSIDIAN_QUOTE_URL || file.url || DEFAULT_URL).replace(/\/+$/, "");
	const token = String(flags.token || process.env.OBSIDIAN_QUOTE_TOKEN || file.token || "");
	return { url, token };
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(2);
}

async function request(config, method, endpoint, body) {
	const headers = {};
	if (body) headers["content-type"] = "application/json";
	if (config.token) headers.authorization = `Bearer ${config.token}`;

	let response;
	try {
		response = await fetch(config.url + endpoint, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});
	} catch (error) {
		fail(
			[
				`无法连接知识库引用服务：${config.url}`,
				"请检查：",
				"  1. Obsidian 已打开，Obsidian Quote 插件已启用；",
				"  2. 插件面板中「启用引用服务」已打开；",
				`  3. 端口与令牌与 ${CONFIG_PATH} 一致（可在面板复制接入配置）。`,
				`原始错误：${error.message}`,
			].join("\n")
		);
	}

	const text = await response.text();
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		data = { raw: text };
	}
	if (!response.ok) {
		fail(`引用服务返回 ${response.status}：${data.error || text}`);
	}
	return data;
}

function indent(text, prefix = "    ") {
	return String(text)
		.split(/\r?\n/)
		.map((line) => (line ? prefix + line : ""))
		.join("\n");
}

function printSearch(result) {
	if (!result.hits || result.hits.length === 0) {
		console.log("没有匹配的笔记。");
		return;
	}
	console.log(`查询：${result.query} · ${result.hits.length} 条 · ${result.tookMs}ms`);
	for (let i = 0; i < result.hits.length; i++) {
		const hit = result.hits[i];
		const where = hit.heading ? `${hit.title} › ${hit.heading}` : hit.title;
		console.log(`\n[${i + 1}] ${where}`);
		console.log(`    ${hit.vault} / ${hit.path}`);
		if (hit.tags && hit.tags.length > 0) console.log(`    tags: ${hit.tags.join(", ")}`);
		console.log("");
		console.log(indent(hit.excerpt));
	}
}

function printVaults(vaults) {
	if (!vaults || vaults.length === 0) {
		console.log("尚未登记知识库。");
		return;
	}
	for (const vault of vaults) {
		const state = vault.enabled ? "启用" : "停用";
		const error = vault.error ? ` · ${vault.error}` : "";
		const rules = typeof vault.rules === "number" ? ` / ${vault.rules} 条规则` : "";
		console.log(`${vault.name}  [${state}]  ${vault.docs} 篇 / ${vault.chunks} 段${rules}${error}`);
		console.log(`    ${vault.path}`);
	}
}

function printRules(result) {
	if (!result.rules || result.rules.length === 0) {
		console.log("没有匹配的规则。");
		return;
	}
	const label = { must: "必须", should: "建议", tip: "可选" };
	console.log(`规则：${result.rules.length} / ${result.total} 条 · ${result.tookMs}ms`);
	for (const rule of result.rules) {
		console.log(`\n[${rule.id}] [${label[rule.priority] || rule.priority}] ${rule.text}`);
		console.log(`    ${rule.vault} / ${rule.path}`);
		if (rule.topics.length > 0) console.log(`    topics: ${rule.topics.join(", ")}`);
	}
}

async function main() {
	const { positional, flags } = parseArgs(process.argv.slice(2));
	const command = positional[0] || "help";
	const config = resolveConfig(flags);
	const asJson = flags.json === true;

	if (command === "help" || flags.help === true) {
		console.log(
			[
				"obsidian-quote — 本地 Obsidian 知识库只读检索",
				"",
				"用法：",
				"  node kb.mjs status                     服务与索引状态",
				"  node kb.mjs vaults                     已登记知识库",
				"  node kb.mjs search <关键词> [--vault 名称] [--source 库名/子目录] [--profile 组合] [--limit N]",
				"  node kb.mjs context <关键词> [--budget N] [--limit N] [--profile 组合]",
				"  node kb.mjs rules [关键词] [--topic 命名] [--priority must|should|tip] [--profile 组合]",
				"  node kb.mjs brief [--project .] [--stack vue,typescript] [--profile 组合] [--budget N]",
				"  node kb.mjs stats                      引用台账（本机）",
				"  node kb.mjs init --url <url> --token <token>   写入配置",
				"",
				`配置文件：${CONFIG_PATH}`,
				"环境变量：OBSIDIAN_QUOTE_URL / OBSIDIAN_QUOTE_TOKEN",
			].join("\n")
		);
		return;
	}

	if (command === "init") {
		const url = String(flags.url || DEFAULT_URL);
		const token = flags.token ? String(flags.token) : "";
		if (!token) fail("缺少 --token，请从插件面板复制接入配置。");
		fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true, mode: 0o700 });
		if (process.platform !== "win32") {
			fs.chmodSync(path.dirname(CONFIG_PATH), 0o700);
			if (fs.existsSync(CONFIG_PATH)) fs.chmodSync(CONFIG_PATH, 0o600);
		}
		fs.writeFileSync(CONFIG_PATH, `${JSON.stringify({ url, token }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
		if (process.platform !== "win32") fs.chmodSync(CONFIG_PATH, 0o600);
		console.log(`已写入 ${CONFIG_PATH}`);
		return;
	}

	const serviceCommands = new Set(["status", "vaults", "search", "context", "rules", "brief", "stats"]);
	if (serviceCommands.has(command)) {
		// A fresh install has neither a config file nor env vars. Say that first,
		// otherwise the generic "令牌不一致" message wrongly blames the token and
		// sends the user looking in the wrong place.
		const hasExplicitConfig = Boolean(
			flags.url || flags.token || process.env.OBSIDIAN_QUOTE_URL || process.env.OBSIDIAN_QUOTE_TOKEN
		);
		if (!hasExplicitConfig) {
			const file = readConfigFile();
			if (!file || (!file.url && !file.token)) {
				fail(
					[
						`未找到接入配置：${CONFIG_PATH} 不存在或缺少 url / token。`,
						"请任选其一：",
						"  1. 在 Obsidian 插件面板点「写入接入配置」，自动写入上述路径；",
						"  2. 运行 node kb.mjs init --url <url> --token <token>；",
						"  3. 设置环境变量 OBSIDIAN_QUOTE_URL / OBSIDIAN_QUOTE_TOKEN。",
					].join("\n")
				);
			}
		}
		if (!config.token) {
			fail(
				[
					"接入配置缺少令牌（token）。",
					`配置文件：${CONFIG_PATH}`,
					"请在 Obsidian 插件面板重新「写入接入配置」，或运行 node kb.mjs init --url <url> --token <token>。",
				].join("\n")
			);
		}
	}

	if (command === "status") {
		const health = await request(config, "GET", "/health");
		const auth = await probeStatus(config, "/vaults");
		if (auth === 401) {
			fail(
				[
					"令牌不一致：/health 可访问，但带令牌的 /vaults 返回 401。",
					`当前配置：${CONFIG_PATH}`,
					"请在 Obsidian 插件面板重新「复制接入配置」，更新 url 与 token。",
				].join("\n")
			);
		}
		if (auth === 0) fail(`无法连接知识库引用服务：${config.url}`);
		if (asJson) {
			console.log(JSON.stringify({ ...health, auth: auth === 200 ? "ok" : `http-${auth}` }, null, 2));
			return;
		}
		console.log(`服务：${health.ok ? "正常" : "异常"} · ${config.url}`);
		console.log(`鉴权：${auth === 200 ? "通过" : `未验证（HTTP ${auth}）`}`);
		console.log(`知识库：${health.vaults} 个 · 笔记 ${health.docs} 篇 · 段落 ${health.chunks} 个`);
		console.log(`索引：${health.indexing ? "构建中" : "就绪"}${health.lastBuiltAt ? ` · ${new Date(health.lastBuiltAt).toLocaleString()}` : ""}`);
		if (health.injection) console.log(`注入：${health.injection.timing} · ${health.injection.format}`);
		return;
	}

	if (command === "vaults") {
		const data = await request(config, "GET", "/vaults");
		if (asJson) {
			console.log(JSON.stringify(data, null, 2));
			return;
		}
		printVaults(data.vaults);
		return;
	}

	if (command === "search") {
		const query = positional.slice(1).join(" ").trim();
		if (!query) fail("缺少查询关键词。示例：node kb.mjs search \"命名规范\"");
		const body = { query };
		const limit = numberFlag(flags, "limit");
		const maxChars = numberFlag(flags, "max-chars");
		if (limit !== undefined) body.limit = limit;
		if (maxChars !== undefined) body.maxChars = maxChars;
		applyScope(body, flags);
		const result = await request(config, "POST", "/search", body);
		printWarnings(result);
		if (asJson) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}
		printSearch(result);
		return;
	}

	if (command === "context") {
		const query = positional.slice(1).join(" ").trim();
		if (!query) fail("缺少查询关键词。示例：node kb.mjs context \"代码规范\"");
		const body = { query };
		const budget = numberFlag(flags, "budget");
		const limit = numberFlag(flags, "limit");
		if (budget !== undefined) body.budget = budget;
		if (limit !== undefined) body.limit = limit;
		applyScope(body, flags);
		const result = await request(config, "POST", "/context", body);
		printWarnings(result);
		if (asJson) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}
		if (!result.markdown) {
			console.log("没有匹配的笔记。");
			return;
		}
		console.log(result.markdown);
		return;
	}

	if (command === "rules") {
		const query = positional.slice(1).join(" ").trim();
		const body = {};
		if (query) body.query = query;
		if (flags.topic) body.topic = String(flags.topic);
		if (flags.priority) body.priority = String(flags.priority);
		const limit = numberFlag(flags, "limit");
		if (limit !== undefined) body.limit = limit;
		applyScope(body, flags);
		const result = await request(config, "POST", "/rules", body);
		printWarnings(result);
		if (asJson) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}
		printRules(result);
		return;
	}

	if (command === "brief") {
		const projectPath = path.resolve(String(flags.project || "."));
		const body = { projectPath };
		if (flags.stack) {
			body.stack = String(flags.stack)
				.split(",")
				.map((item) => item.trim())
				.filter(Boolean);
		}
		const budget = numberFlag(flags, "budget");
		const limit = numberFlag(flags, "limit");
		if (budget !== undefined) body.budget = budget;
		if (limit !== undefined) body.limit = limit;
		applyScope(body, flags);
		const result = await request(config, "POST", "/brief", body);
		printWarnings(result);
		if (asJson) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}
		console.log(result.markdown || "没有匹配的条款。");
		return;
	}

	if (command === "stats") {
		const result = await request(config, "GET", "/stats");
		if (asJson) {
			console.log(JSON.stringify(result, null, 2));
			return;
		}
		console.log(`累计 ${result.totalQueries} 次检索 · 引用 ${result.totalCitations} 个片段`);
		if (!result.topNotes || result.topNotes.length === 0) {
			console.log("暂无引用记录。");
			return;
		}
		console.log("\n高频笔记：");
		for (const note of result.topNotes.slice(0, 6)) {
			console.log(`  ${note.count} 次 · ${note.path}`);
		}
		if (result.recent && result.recent.length > 0) {
			console.log("\n最近检索：");
			for (const item of result.recent.slice(0, 5)) {
				console.log(`  ${item.kind} · ${item.query || "（空）"} · ${item.hits} 条`);
			}
		}
		return;
	}

	fail(`未知命令：${command}（运行 node kb.mjs help 查看用法）`);
}

main().catch((error) => fail(error && error.message ? error.message : String(error)));
