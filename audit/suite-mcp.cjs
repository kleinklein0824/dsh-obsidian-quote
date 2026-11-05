const path = require("node:path");
const { spawn } = require("node:child_process");
const { startService, settings, PROJECT } = require("./helpers.cjs");

const MCP = path.join(PROJECT, "harness-skill/scripts/mcp-server.mjs");
const TOKEN = "mcp-token";
const PORT = 45811;

async function withMcp(fn) {
	const svc = await startService(settings({ server: { port: PORT, token: TOKEN } }));
	const child = spawn(process.execPath, [MCP], {
		cwd: PROJECT,
		env: { ...process.env, OBSIDIAN_QUOTE_URL: svc.base, OBSIDIAN_QUOTE_TOKEN: TOKEN },
		stdio: ["pipe", "pipe", "pipe"],
	});
	let buffer = "";
	const pending = new Map();
	const notifications = [];
	const stderr = [];
	child.stdout.on("data", (chunk) => {
		buffer += chunk.toString();
		let index;
		while ((index = buffer.indexOf("\n")) >= 0) {
			const line = buffer.slice(0, index);
			buffer = buffer.slice(index + 1);
			if (!line.trim()) continue;
			let message;
			try {
				message = JSON.parse(line);
			} catch {
				continue;
			}
			if (message.id === undefined || message.id === null) notifications.push(message);
			else if (pending.has(message.id)) {
				pending.get(message.id)(message);
				pending.delete(message.id);
			}
		}
	});
	child.stderr.on("data", (chunk) => stderr.push(chunk.toString()));
	let nextId = 1;
	const rpc = (method, params) =>
		new Promise((resolve, reject) => {
			const id = nextId++;
			const timer = setTimeout(() => reject(new Error(`MCP 响应超时：${method}`)), 4000);
			pending.set(id, (message) => {
				clearTimeout(timer);
				resolve(message);
			});
			child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
		});
	const notify = (method, params) => child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
	const wait = (ms) => new Promise((r) => setTimeout(r, ms));
	try {
		const init = await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "audit", version: "1" } });
		return await fn({ init, rpc, notify, wait, notifications, stderr, svc });
	} finally {
		child.kill();
		await svc.server.stop();
	}
}

module.exports = [
	{
		id: "T090",
		name: "MCP initialize 返回协议版本与服务信息",
		severity: "high",
		run: async () =>
			withMcp(async ({ init }) => {
				const result = init.result || {};
				const pass = result.protocolVersion === "2024-11-05" && result.serverInfo && result.serverInfo.name === "obsidian-quote" && result.capabilities && result.capabilities.tools;
				return { pass, detail: JSON.stringify(result) };
			}),
	},
	{
		id: "T091",
		name: "MCP 暴露 6 个只读工具且 schema 完整",
		severity: "high",
		run: async () =>
			withMcp(async ({ rpc }) => {
				const message = await rpc("tools/list", {});
				const tools = message.result.tools;
				const names = tools.map((tool) => tool.name).sort();
				const expected = ["kb_brief", "kb_context", "kb_rules", "kb_search", "kb_stats", "kb_vaults"];
				const schemas = tools.every((tool) => tool.inputSchema && tool.inputSchema.type === "object");
				const search = tools.find((tool) => tool.name === "kb_search");
				const pass = JSON.stringify(names) === JSON.stringify(expected) && schemas && search.inputSchema.required.includes("query");
				return { pass, detail: `${names.join(",")} schema完整=${schemas}` };
			}),
	},
	{
		id: "T092",
		name: "MCP 六个工具均可实际调用",
		severity: "critical",
		run: async () =>
			withMcp(async ({ rpc }) => {
				const calls = [
					["kb_search", { query: "组件 命名", limit: 2 }],
					["kb_context", { query: "GPIO", budget: 600 }],
					["kb_rules", { query: "命名", priority: "must", limit: 2 }],
					["kb_brief", { stack: ["vue"], limit: 5 }],
					["kb_vaults", {}],
					["kb_stats", {}],
				];
				const results = [];
				for (const [name, args] of calls) {
					const message = await rpc("tools/call", { name, arguments: args });
					results.push([name, message.result && message.result.isError, message.result && message.result.content[0].text]);
				}
				const failed = results.filter(([, isError, text]) => isError || !text);
				const search = results.find(([name]) => name === "kb_search")[2];
				const vaults = results.find(([name]) => name === "kb_vaults")[2];
				const pass = failed.length === 0 && search.includes("Vue规范库") && vaults.includes("Vue规范库");
				return { pass, detail: results.map(([name, isError]) => `${name}:${isError ? "ERR" : "OK"}`).join(" ") };
			}),
	},
	{
		id: "T093",
		name: "未知工具返回 isError 而非崩溃",
		severity: "medium",
		run: async () =>
			withMcp(async ({ rpc }) => {
				const message = await rpc("tools/call", { name: "kb_nope", arguments: {} });
				const pass = message.result && message.result.isError === true && message.result.content[0].text.includes("未知工具");
				return { pass, detail: JSON.stringify(message.result && message.result.content[0].text) };
			}),
	},
	{
		id: "T094",
		name: "未知方法返回 -32601",
		severity: "medium",
		run: async () =>
			withMcp(async ({ rpc }) => {
				const message = await rpc("resources/list", {});
				return { pass: message.error && message.error.code === -32601, detail: JSON.stringify(message.error) };
			}),
	},
	{
		id: "T095",
		name: "畸形输入与通知不影响后续请求",
		severity: "medium",
		run: async () =>
			withMcp(async ({ rpc, notify, wait, notifications, svc }) => {
				svc.server.running;
				const before = notifications.length;
				notify("notifications/initialized", {});
				await wait(120);
				const silent = notifications.length === before;
				const ping = await rpc("ping", {});
				const pass = silent && ping.result && Object.keys(ping.result).length === 0;
				return { pass, detail: `通知静默=${silent} ping=${JSON.stringify(ping.result)}` };
			}),
	},
	{
		id: "T134",
		name: "MCP 检索、上下文、规则与摘要保留来源警告",
		severity: "medium",
		run: async () => withMcp(async ({ rpc }) => {
			const profile = "profile-not-found-regression";
			const results = [];
			for (const name of ["kb_search", "kb_context", "kb_rules", "kb_brief"]) {
				const reply = await rpc("tools/call", { name, arguments: { query: "命名", stack: ["vue"], profile } });
				const text = reply.result?.content?.[0]?.text || "";
				results.push([name, text.includes(profile)]);
			}
			return { pass: results.every(([, warned]) => warned), detail: results.map(([name, warned]) => `${name}:${warned}`).join(" ") };
		}),
	},
	{
		id: "T114",
		name: "MCP 在没有配置文件时返回未找到接入配置的错误",
		severity: "medium",
		run: async () => {
			const fakeHome = path.join(__dirname, "tmp", "nohome-114");
			const child = spawn(process.execPath, [MCP], {
				cwd: PROJECT,
				env: { ...process.env, USERPROFILE: fakeHome, OBSIDIAN_QUOTE_URL: "", OBSIDIAN_QUOTE_TOKEN: "" },
				stdio: ["pipe", "pipe", "pipe"],
			});
			const response = await new Promise((resolve, reject) => {
				let buffer = "";
				const timer = setTimeout(() => reject(new Error("MCP 响应超时")), 5000);
				child.stdout.on("data", (chunk) => {
					buffer += chunk.toString();
					const index = buffer.indexOf("\n");
					if (index === -1) return;
					try {
						const message = JSON.parse(buffer.slice(0, index));
						clearTimeout(timer);
						resolve(message);
					} catch {
						// keep reading until a full JSON-RPC line arrives
					}
				});
				child.stdin.write(
					`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "kb_vaults", arguments: {} } })}\n`
				);
			});
			child.kill();
			const text = (response.result && response.result.content && response.result.content[0] && response.result.content[0].text) || "";
			const pass = Boolean(response.result && response.result.isError) && text.includes("未找到接入配置");
			return { pass, detail: text || JSON.stringify(response) };
		},
	},
];
