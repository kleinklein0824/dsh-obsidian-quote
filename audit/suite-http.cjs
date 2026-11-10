const http = require("node:http");
const { startService, settings } = require("./helpers.cjs");

const TOKEN = "audit-token";
const AUTH = { authorization: `Bearer ${TOKEN}` };
const JSON_HEADERS = { ...AUTH, "content-type": "application/json" };

async function withService(fn, port = 45731) {
	const svc = await startService(settings({ server: { port, token: TOKEN } }));
	try {
		return await fn(svc);
	} finally {
		await svc.server.stop();
	}
}

async function call(base, path, options = {}) {
	const response = await fetch(base + path, options);
	const text = await response.text();
	let body;
	try {
		body = JSON.parse(text);
	} catch {
		body = text;
	}
	return { status: response.status, body, headers: response.headers };
}

module.exports = [
	{
		id: "T072",
		name: "/health 无需令牌即可查看服务状态",
		severity: "high",
		run: async () =>
			withService(async ({ base, indexer }) => {
				const r = await call(base, "/health");
				const pass = r.status === 200 && r.body.ok === true && r.body.chunks === indexer.chunkCount && r.body.docs > 0;
				return { pass, detail: `status=${r.status} body=${JSON.stringify(r.body)}` };
			}),
	},
	{
		id: "T073",
		name: "除 /health 外的接口全部要求令牌",
		severity: "critical",
		run: async () =>
			withService(async ({ base }) => {
				const results = [];
				for (const path of ["/vaults", "/search?q=GPIO", "/rules", "/stats"]) results.push([path, (await call(base, path)).status]);
				results.push(["/context", (await call(base, "/context", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: "GPIO" }) })).status]);
				results.push(["/brief", (await call(base, "/brief", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status]);
				const pass = results.every(([, status]) => status === 401);
				return { pass, detail: results.map(([p, s]) => `${p}:${s}`).join(" ") };
			}),
	},
	{
		id: "T074",
		name: "Bearer / 查询参数 / 自定义头三种令牌方式均可用",
		severity: "high",
		run: async () =>
			withService(async ({ base }) => {
				const bearer = await call(base, "/search?q=GPIO&limit=1", { headers: AUTH });
				const query = await call(base, `/search?q=GPIO&limit=1&token=${TOKEN}`);
				const custom = await call(base, "/search?q=GPIO&limit=1", { headers: { "x-quote-token": TOKEN } });
				const pass = [bearer, query, custom].every((r) => r.status === 200 && r.body.hits.length === 1);
				return { pass, detail: `bearer=${bearer.status} query=${query.status} header=${custom.status}` };
			}),
	},
	{
		id: "T140",
		name: "新增本地目录接口要求鉴权并返回不含绝对路径的登记结果",
		severity: "high",
		run: async () => {
			const svc = await startService(settings({ server: { port: 45741, token: TOKEN } }));
			const requested = [];
			svc.host.registerVault = async (vaultPath) => {
				requested.push(vaultPath);
				if (vaultPath === "C:/missing-folder") return { ok: false, status: 400, message: "路径不存在或不是文件夹" };
				if (vaultPath === "C:/already-registered") return { ok: false, status: 409, message: "该知识库已登记" };
				return { ok: true, vault: { id: "custom-vault", name: "自定义目录", enabled: true } };
			};
			try {
				const customPath = "C:/Users/Klein/Notes/Custom Vault";
				const unauth = await call(svc.base, "/vaults", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: customPath }) });
				const empty = await call(svc.base, "/vaults", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ path: "  " }) });
				const created = await call(svc.base, "/vaults", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ path: customPath }) });
				const invalid = await call(svc.base, "/vaults", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ path: "C:/missing-folder" }) });
				const duplicate = await call(svc.base, "/vaults", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify({ path: "C:/already-registered" }) });
				const pass = unauth.status === 401 && empty.status === 400 && created.status === 201 &&
					created.body.vault.id === "custom-vault" && !JSON.stringify(created.body).includes(customPath) &&
					invalid.status === 400 && duplicate.status === 409 && requested.length === 3 && requested[0] === customPath;
				return { pass, detail: "unauthorized=" + unauth.status + " empty=" + empty.status + " created=" + created.status + " invalid=" + invalid.status + " duplicate=" + duplicate.status + " delegated=" + requested.length };
			} finally {
				await svc.server.stop();
			}
		},
	},
	{
		id: "T075",
		name: "CORS 预检返回 204 与允许方法，且不向任意来源开放",
		severity: "medium",
		run: async () =>
			withService(async ({ base }) => {
				const r = await call(base, "/search", { method: "OPTIONS" });
				const methods = r.headers.get("access-control-allow-methods") || "";
				// A wildcard ACAO let any web page read loopback replies (DNS
				// rebinding). Only loopback origins may receive a grant now.
				const wildcard = await call(base, "/search", {
					method: "OPTIONS",
					headers: { origin: "https://evil.example" },
				});
				const evilAllow = wildcard.headers.get("access-control-allow-origin");
				const loopback = await call(base, "/search", {
					method: "OPTIONS",
					headers: { origin: "http://127.0.0.1:43117" },
				});
				const loopAllow = loopback.headers.get("access-control-allow-origin");
				const pass =
					r.status === 204 &&
					methods.includes("POST") &&
					evilAllow === null &&
					loopAllow === "http://127.0.0.1:43117";
				return {
					pass,
					detail: `status=${r.status} methods=${methods} evil=${evilAllow} loopback=${loopAllow}`,
				};
			}),
	},
	{
		id: "T075b",
		name: "非回环 Host 头被拒绝（防 DNS rebinding）",
		severity: "high",
		run: async () =>
			withService(async ({ base }) => {
				// undici rewrites Host, so talk to the socket directly.
				const net = require("node:net");
				const probe = (hostHeader) =>
					new Promise((resolve) => {
						const { port } = new URL(base);
						const socket = net.connect(Number(port), "127.0.0.1");
						let buf = "";
						socket.on("connect", () =>
							socket.write(`GET /health HTTP/1.1\r\nHost: ${hostHeader}\r\nConnection: close\r\n\r\n`)
						);
						socket.on("data", (chunk) => (buf += chunk));
						socket.on("close", () => resolve(buf));
						socket.on("error", () => resolve(buf));
					});
				const good = await probe(`127.0.0.1:${new URL(base).port}`);
				const bad = await probe("evil.example.com");
				const status = (text) => (text.match(/^HTTP\/1\.1 (\d+)/) || [])[1];
				const pass = status(good) === "200" && status(bad) === "403";
				return { pass, detail: `loopback=${status(good)} evil=${status(bad)}` };
			}),
	},
	{
		id: "T075c",
		name: "可解析但非对象的 JSON 请求体返回 400 而非 500",
		severity: "medium",
		run: async () =>
			withService(async ({ base }) => {
				const results = [];
				for (const raw of ["null", "[]", '"str"', "123", "true"]) {
					const r = await call(base, "/search", { method: "POST", headers: JSON_HEADERS, body: raw });
					results.push([raw, r.status]);
				}
				const pass = results.every(([, status]) => status === 400);
				return { pass, detail: results.map(([b, s]) => `${b}:${s}`).join(" ") };
			}),
	},
	{
		id: "T076",
		name: "非法 JSON 请求体返回 400 而非 500",
		severity: "medium",
		run: async () =>
			withService(async ({ base }) => {
				const r = await call(base, "/search", { method: "POST", headers: JSON_HEADERS, body: "{oops" });
				return { pass: r.status === 400, detail: `status=${r.status} body=${JSON.stringify(r.body)}` };
			}),
	},
	{
		id: "T077",
		name: "缺少查询词时 GET/POST 均返回 400",
		severity: "high",
		run: async () =>
			withService(async ({ base }) => {
				const get = await call(base, `/search?token=${TOKEN}`);
				const post = await call(base, "/search", { method: "POST", headers: JSON_HEADERS, body: "{}" });
				const context = await call(base, "/context", { method: "POST", headers: JSON_HEADERS, body: "{}" });
				const pass = get.status === 400 && post.status === 400 && context.status === 400;
				return { pass, detail: `GET=${get.status} POST=${post.status} context=${context.status}` };
			}),
	},
	{
		id: "T078",
		name: "未知路由返回 404 并列出可用端点",
		severity: "low",
		run: async () =>
			withService(async ({ base }) => {
				const r = await call(base, `/nope?token=${TOKEN}`);
				const pass = r.status === 404 && Array.isArray(r.body.endpoints) && r.body.endpoints.includes("/brief");
				return { pass, detail: `status=${r.status} endpoints=${(r.body.endpoints || []).join(",")}` };
			}),
	},
	{
		id: "T079",
		name: "端口被占用时自动顺延",
		severity: "high",
		run: async () => {
			const base = 45751;
			const blocker = http.createServer((_, res) => res.end("x"));
			await new Promise((resolve) => blocker.listen(base, "127.0.0.1", resolve));
			const svc = await startService(settings({ server: { port: base, token: TOKEN } }));
			try {
				return { pass: svc.server.port === base + 1, detail: `期望 ${base + 1}，实际 ${svc.server.port}` };
			} finally {
				await svc.server.stop();
				await new Promise((resolve) => blocker.close(resolve));
			}
		},
	},
	{
		id: "T080",
		name: "超大请求体返回 413 而非直接断连",
		severity: "low",
		run: async () =>
			withService(async ({ base }) => {
				try {
					const response = await fetch(base + "/search", {
						method: "POST",
						headers: JSON_HEADERS,
						body: JSON.stringify({ query: "a", pad: "x".repeat(1_100_000) }),
					});
					return { pass: response.status === 413, detail: `status=${response.status}` };
				} catch (error) {
					return { pass: false, detail: `连接被重置，无 HTTP 状态码：${error.message}` };
				}
			}),
	},
	{
		id: "T081",
		name: "/reindex 可重建，stop 后端口释放",
		severity: "high",
		run: async () => {
			const svc = await startService(settings({ server: { port: 45761, token: TOKEN } }));
			const before = await call(svc.base, "/reindex", { method: "POST", headers: AUTH });
			await svc.server.stop();
			let refused = false;
			try {
				await fetch(svc.base + "/health");
			} catch {
				refused = true;
			}
			const pass = before.status === 200 && before.body.ok === true && before.body.chunks > 0 && refused && svc.server.running === false;
			return { pass, detail: `reindex=${before.status} chunks=${before.body.chunks} 停止后拒绝连接=${refused}` };
		},
	},
	{
		id: "T106",
		name: "/ui 返回自包含只读面板，CSP nonce 生效且页面不泄露令牌",
		severity: "critical",
		run: async () =>
			withService(async ({ base }) => {
				const r = await call(base, "/ui");
				const html = typeof r.body === "string" ? r.body : JSON.stringify(r.body);
				const csp = r.headers.get("content-security-policy") || "";
				const nonceMatch = csp.match(/'nonce-([^']+)'/);
				const nonce = nonceMatch ? nonceMatch[1] : "";
				const styleTag = /<style nonce="([^"]+)"/.exec(html);
				const scriptTag = /<script nonce="([^"]+)"/.exec(html);
				const pass =
					r.status === 200 &&
					(r.headers.get("content-type") || "").includes("text/html") &&
					nonce.length > 0 &&
					Boolean(styleTag) &&
					styleTag[1] === nonce &&
					Boolean(scriptTag) &&
					scriptTag[1] === nonce &&
					html.includes("连接本地知识库") &&
					!html.includes(TOKEN) &&
					!/innerHTML/.test(html);
				return { pass, detail: `status=${r.status} nonce=${nonce ? "yes" : "no"} bytes=${html.length}` };
			}),
	},
	{
		id: "T107",
		name: "/ui/session 校验令牌，发放 HttpOnly + SameSite=Strict 会话 Cookie",
		severity: "critical",
		run: async () =>
			withService(async ({ base }) => {
				const bad = await call(base, "/ui/session", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ token: "wrong-token" }),
				});
				const good = await call(base, "/ui/session", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ token: TOKEN }),
				});
				const cookies = good.headers.getSetCookie ? good.headers.getSetCookie() : [good.headers.get("set-cookie")].filter(Boolean);
				const raw = cookies.join(";");
				const cookie = raw.split(";")[0];
				const authed = await call(base, "/vaults", { headers: { cookie } });
				const forged = await call(base, "/vaults", { headers: { cookie: "oq_session=forged" } });
				const pass =
					bad.status === 401 &&
					good.status === 200 &&
					/HttpOnly/.test(raw) &&
					/SameSite=Strict/.test(raw) &&
					cookie.startsWith("oq_session=") &&
					authed.status === 200 &&
					forged.status === 401;
				return { pass, detail: `bad=${bad.status} good=${good.status} cookie=${cookie ? "set" : "none"} authed=${authed.status} forged=${forged.status}` };
			}),
	},
	{
		id: "T108",
		name: "/ui/logout 立即作废会话 Cookie",
		severity: "high",
		run: async () =>
			withService(async ({ base }) => {
				const login = await call(base, "/ui/session", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ token: TOKEN }),
				});
				const cookies = login.headers.getSetCookie ? login.headers.getSetCookie() : [login.headers.get("set-cookie")].filter(Boolean);
				const cookie = cookies.join(";").split(";")[0];
				const before = await call(base, "/vaults", { headers: { cookie } });
				const out = await call(base, "/ui/logout", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: "{}" });
				const after = await call(base, "/vaults", { headers: { cookie } });
				const pass = login.status === 200 && before.status === 200 && out.status === 200 && after.status === 401;
				return { pass, detail: `before=${before.status} logout=${out.status} after=${after.status}` };
			}),
	},
	{
		id: "T109",
		name: "/ui?token= 一次性换取 Cookie 后 303 跳转到无令牌地址",
		severity: "high",
		run: async () =>
			withService(async ({ base }) => {
				const bad = await call(base, "/ui?token=wrong", { redirect: "manual" });
				const good = await call(base, `/ui?token=${TOKEN}`, { redirect: "manual" });
				const cookies = good.headers.getSetCookie ? good.headers.getSetCookie() : [good.headers.get("set-cookie")].filter(Boolean);
				const raw = cookies.join(";");
				const pass = bad.status === 401 && good.status === 303 && good.headers.get("location") === "/ui" && /HttpOnly/.test(raw);
				return { pass, detail: `bad=${bad.status} good=${good.status} location=${good.headers.get("location")}` };
			}),
	},
	{
		id: "T110",
		name: "浏览器面板只读：不写 innerHTML、不暴露 reindex 或外部 URL",
		severity: "high",
		run: async () =>
			withService(async ({ base }) => {
				const r = await call(base, "/ui");
				const html = typeof r.body === "string" ? r.body : JSON.stringify(r.body);
				const endpoints = ["/search", "/context", "/rules", "/brief", "/stats", "/ui/session", "/ui/logout"];
				const missing = endpoints.filter((path) => !html.includes(path));
				const pass =
					r.status === 200 &&
					missing.length === 0 &&
					!/innerHTML/.test(html) &&
					!/\/reindex/.test(html) &&
					!/https?:\/\//.test(html) &&
					/textContent/.test(html);
				return { pass, detail: `missing=${missing.join(",") || "none"} length=${html.length}` };
			}),
	},
];
