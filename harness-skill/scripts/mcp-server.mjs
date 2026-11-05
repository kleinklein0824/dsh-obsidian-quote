#!/usr/bin/env node
/**
 * Minimal MCP (stdio) adapter for obsidian-quote.
 *
 * This is the optional pluggable layer: harnesses that speak MCP can mount this
 * server without any change to the harness source. It only talks to the local
 * read-only HTTP service started by the Obsidian plugin.
 *
 * Register (Claude Code / compatible harness):
 *   {"mcpServers":{"obsidian-quote":{"command":"node","args":["<abs>/mcp-server.mjs"]}}}
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const CONFIG_PATH = path.join(os.homedir(), ".obsidian-quote", "config.json");
const DEFAULT_URL = "http://127.0.0.1:43117";
const SERVER_INFO = { name: "obsidian-quote", version: "0.2.2" };

function resolveConfig() {
	let file = {};
	try {
		file = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
	} catch {
		file = {};
	}
	const fileToken = typeof file.token === "string" ? file.token : "";
	const token = String(process.env.OBSIDIAN_QUOTE_TOKEN || fileToken || "");
	return {
		url: String(process.env.OBSIDIAN_QUOTE_URL || file.url || DEFAULT_URL).replace(/\/+$/, ""),
		token,
		// Distinguishes "no config at all" from "wrong token": both used to surface
		// as the same 401, which made a fresh install look like an auth problem.
		hasTokenSource: Boolean(token),
	};
}

const config = resolveConfig();

async function callService(method, endpoint, body) {
	if (!config.hasTokenSource) {
		throw new Error(
			`未找到接入配置：${CONFIG_PATH} 不存在或缺少 token。请先在 Obsidian 插件面板点「写入接入配置」，或运行 node kb.mjs init --url <url> --token <token>。`
		);
	}
	const headers = {};
	if (body) headers["content-type"] = "application/json";
	if (config.token) headers.authorization = `Bearer ${config.token}`;

	let response;
	try {
		response = await fetch(config.url + endpoint, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
			// Without a timeout a half-open server connection stalls this MCP call
			// for the Node requestTimeout default (300 s).
			signal: AbortSignal.timeout(15000),
		});
	} catch (error) {
		throw new Error(
			`无法连接知识库引用服务 ${config.url}。请确认 Obsidian 已打开且插件面板中「启用引用服务」已开启。（${error.message}）`
		);
	}
	const text = await response.text();
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		data = { raw: text };
	}
	if (!response.ok) throw new Error(`引用服务返回 ${response.status}：${data.error || text}`);
	return data;
}

function withWarnings(result, text) {
	const warnings = Array.isArray(result.warnings) ? result.warnings.filter(value => typeof value === "string") : [];
	return warnings.length > 0 ? `来源警告：\n${warnings.map(value => `- ${value}`).join("\n")}\n\n${text}` : text;
}

function formatHits(result) {
	if (!result.hits || result.hits.length === 0) return "没有匹配的笔记。";
	const lines = [`查询：${result.query} · ${result.hits.length} 条`];
	result.hits.forEach((hit, index) => {
		lines.push("");
		lines.push(`[${index + 1}] ${hit.heading ? `${hit.title} › ${hit.heading}` : hit.title}`);
		lines.push(`来源：${hit.vault} / ${hit.path}`);
		if (hit.tags && hit.tags.length > 0) lines.push(`标签：${hit.tags.join(", ")}`);
		lines.push("");
		lines.push(hit.excerpt);
	});
	return lines.join("\n");
}

function formatRules(result) {
	if (!result.rules || result.rules.length === 0) return "没有匹配的规则。";
	const label = { must: "必须", should: "建议", tip: "可选" };
	const lines = [`规则：${result.rules.length} / ${result.total} 条`];
	for (const rule of result.rules) {
		lines.push("");
		lines.push(`[${rule.id}] [${label[rule.priority] || rule.priority}] ${rule.text}`);
		lines.push(`来源：${rule.vault} / ${rule.path}`);
	}
	return lines.join("\n");
}

function formatStats(data) {
	const lines = [`累计 ${data.totalQueries} 次检索 · 引用 ${data.totalCitations} 个片段`];
	if (data.topNotes && data.topNotes.length > 0) {
		lines.push("", "高频笔记：");
		for (const note of data.topNotes.slice(0, 6)) lines.push(`- ${note.count} 次 · ${note.path}`);
	}
	return lines.join("\n");
}

function parseSources(value) {
	if (!Array.isArray(value)) return undefined;
	const out = [];
	for (const item of value) {
		if (typeof item === "string" && item.trim()) {
			const raw = item.trim();
			const index = raw.indexOf("/");
			out.push(index === -1 ? { vault: raw } : { vault: raw.slice(0, index), path: raw.slice(index + 1) });
		} else if (item && typeof item === "object" && item.vault) {
			out.push({ vault: String(item.vault), path: item.path ? String(item.path) : undefined });
		}
	}
	return out.length > 0 ? out : undefined;
}

function applyScope(body, args) {
	const sources = parseSources(args.sources);
	if (sources) body.sources = sources;
	if (args.profile) body.profile = String(args.profile);
}

const SCOPE_PROPS = {
	profile: { type: "string", description: "引用组合名称（在 Obsidian 插件面板创建）" },
	sources: {
		type: "array",
		items: { type: "string" },
		description: "临时指定来源，格式：库名 或 库名/子目录，可多个，结果合并",
	},
};

const TOOLS = [
	{
		name: "kb_search",
		description:
			"在本地 Obsidian 知识库中按关键词检索笔记片段，返回标题、章节、来源路径与原文片段。用于查找代码规范、命名约定、技术方案等参考内容。只读。",
		inputSchema: {
			type: "object",
			properties: {
				query: { type: "string", description: "检索关键词，中英文均可，建议包含主题词与约束词" },
				limit: { type: "number", description: "返回条数，默认使用插件配置（5）" },
				vaults: {
					type: "array",
					items: { type: "string" },
					description: "限定知识库（名称或 id），不填表示全部已启用知识库",
				},
				...SCOPE_PROPS,
			},
			required: ["query"],
		},
	},
	{
		name: "kb_context",
		description:
			"检索并组装成可直接引用的 Markdown 上下文块（受字符预算限制），适合在写代码前一次性获取相关规范。只读。",
		inputSchema: {
			type: "object",
			properties: {
				query: { type: "string", description: "检索关键词" },
				budget: { type: "number", description: "上下文字符预算，默认使用插件配置（6000）" },
				limit: { type: "number", description: "最多引用的片段数" },
				...SCOPE_PROPS,
			},
			required: ["query"],
		},
	},
	{
		name: "kb_vaults",
		description: "列出已登记的知识库及其启用状态、笔记数量。只读。",
		inputSchema: { type: "object", properties: {} },
	},
	{
		name: "kb_rules",
		description:
			"返回从知识库提炼的可执行条款（必须/建议/可选），带稳定编号（R- 加 16 位十六进制）与来源路径，适合写代码前逐条对照。只读。",
		inputSchema: {
			type: "object",
			properties: {
				query: { type: "string", description: "按关键词过滤条款，如“命名 组件”" },
				topic: { type: "string", description: "按主题过滤，如 命名、目录结构、注释、格式、测试" },
				priority: { type: "string", enum: ["must", "should", "tip"], description: "只取某一级别" },
				limit: { type: "number", description: "返回条数，默认 20" },
				...SCOPE_PROPS,
			},
		},
	},
	{
		name: "kb_brief",
		description:
			"按项目技术栈生成紧凑的规范摘要（Markdown，分必须/建议/可选），适合项目开始或新模块开始前一次性注入。只读。",
		inputSchema: {
			type: "object",
			properties: {
				projectPath: { type: "string", description: "本地项目目录，用于自动识别技术栈" },
				stack: {
					type: "array",
					items: { type: "string" },
					description: "显式指定技术栈（如 vue、typescript），指定后跳过目录扫描",
				},
				budget: { type: "number", description: "字符预算，默认 4000" },
				limit: { type: "number", description: "最多条款数，默认 24" },
				...SCOPE_PROPS,
			},
		},
	},
	{
		name: "kb_stats",
		description: "查看本机引用台账：检索次数、被引用最多的笔记。只读。",
		inputSchema: { type: "object", properties: {} },
	},
];

async function runTool(name, args) {
	if (name === "kb_search") {
		const body = { query: String(args.query || "") };
		if (args.limit) body.limit = Number(args.limit);
		if (Array.isArray(args.vaults) && args.vaults.length > 0) body.vaults = args.vaults.map(String);
		applyScope(body, args);
		const result = await callService("POST", "/search", body);
		return withWarnings(result, formatHits(result));
	}
	if (name === "kb_context") {
		const body = { query: String(args.query || "") };
		if (args.budget) body.budget = Number(args.budget);
		if (args.limit) body.limit = Number(args.limit);
		applyScope(body, args);
		const result = await callService("POST", "/context", body);
		return withWarnings(result, result.markdown || "没有匹配的笔记。");
	}
	if (name === "kb_vaults") {
		const data = await callService("GET", "/vaults");
		if (!data.vaults || data.vaults.length === 0) return "尚未登记知识库。";
		return data.vaults
			.map(
				(vault) =>
					`${vault.name} [${vault.enabled ? "启用" : "停用"}] ${vault.docs} 篇 / ${vault.chunks} 段${
						typeof vault.rules === "number" ? ` / ${vault.rules} 条规则` : ""
					}\n  ${vault.path}${vault.error ? `\n  ${vault.error}` : ""}`
			)
			.join("\n");
	}
	if (name === "kb_rules") {
		const body = {};
		if (args.query) body.query = String(args.query);
		if (args.topic) body.topic = String(args.topic);
		if (args.priority) body.priority = String(args.priority);
		if (args.limit) body.limit = Number(args.limit);
		applyScope(body, args);
		const result = await callService("POST", "/rules", body);
		return withWarnings(result, formatRules(result));
	}
	if (name === "kb_brief") {
		const body = {};
		if (args.projectPath) body.projectPath = String(args.projectPath);
		if (Array.isArray(args.stack) && args.stack.length > 0) body.stack = args.stack.map(String);
		if (args.budget) body.budget = Number(args.budget);
		if (args.limit) body.limit = Number(args.limit);
		applyScope(body, args);
		const result = await callService("POST", "/brief", body);
		return withWarnings(result, result.markdown || "没有匹配的条款。");
	}
	if (name === "kb_stats") {
		return formatStats(await callService("GET", "/stats"));
	}
	throw new Error(`未知工具：${name}`);
}

function send(payload) {
	process.stdout.write(`${JSON.stringify(payload)}\n`);
}

async function handle(message) {
	const { id, method, params } = message;
	const isNotification = id === undefined || id === null;

	if (method === "initialize") {
		send({
			jsonrpc: "2.0",
			id,
			result: {
				protocolVersion: (params && params.protocolVersion) || "2024-11-05",
				capabilities: { tools: {} },
				serverInfo: SERVER_INFO,
			},
		});
		return;
	}

	if (method === "ping") {
		if (!isNotification) send({ jsonrpc: "2.0", id, result: {} });
		return;
	}

	if (method === "tools/list") {
		send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
		return;
	}

	if (method === "tools/call") {
		const name = params && params.name;
		const args = (params && params.arguments) || {};
		try {
			const text = await runTool(name, args);
			send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text }], isError: false } });
		} catch (error) {
			send({
				jsonrpc: "2.0",
				id,
				result: { content: [{ type: "text", text: error.message || String(error) }], isError: true },
			});
		}
		return;
	}

	if (isNotification) return;
	send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", (line) => {
	const trimmed = line.trim();
	if (!trimmed) return;
	let message;
	try {
		message = JSON.parse(trimmed);
	} catch {
		return;
	}
	handle(message).catch((error) => {
		process.stderr.write(`[obsidian-quote] ${error && error.stack ? error.stack : error}\n`);
	});
});
