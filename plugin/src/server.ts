import * as http from "http";
import * as nodeTimers from "node:timers";
import type { IncomingMessage, ServerResponse } from "http";
import { randomBytes, timingSafeEqual } from "crypto";
import { URL } from "url";
import { renderWebUi } from "./webui";
import type {
	BriefOptions,
	BriefResponse,
	ContextResponse,
	HostStatus,
	QuoteSettings,
	RuleOptions,
	RulePriority,
	RuleResponse,
	SearchOptions,
	SearchResponse,
	SourceInput,
	StatsResponse,
} from "./types";

export interface CitationRef {
	vault: string;
	path: string;
	title: string;
}

export interface QuoteHost {
	getSettings(): QuoteSettings;
	getStatus(): HostStatus;
	search(query: string, options: SearchOptions): SearchResponse;
	buildContext(
		query: string,
		budget?: number,
		limit?: number,
		sources?: SourceInput[],
		profile?: string
	): ContextResponse;
	getRules(options: RuleOptions): RuleResponse;
	buildBrief(options: BriefOptions): Promise<BriefResponse>;
	getStats(): StatsResponse;
	recordCitation(kind: string, query: string, refs: CitationRef[]): void;
	rebuild(): Promise<void>;
}

const MAX_BODY_BYTES = 1_000_000;

/** Cookie that carries the `/ui` session id (the token itself is never stored). */
const SESSION_COOKIE = "oq_session";
/** Browser panel sessions expire after half a day; the plugin reload clears them. */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const LOOPBACK_NAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** Minimal cookie parser: the service issues exactly one cookie. */
function parseCookies(header: string | undefined): Record<string, string> {
	const out: Record<string, string> = {};
	if (!header) return out;
	for (const part of header.split(";")) {
		const index = part.indexOf("=");
		if (index === -1) continue;
		const name = part.slice(0, index).trim();
		if (!name) continue;
		try {
			out[name] = decodeURIComponent(part.slice(index + 1).trim());
		} catch {
			out[name] = part.slice(index + 1).trim();
		}
	}
	return out;
}

/** Accept only loopback Host headers, blocking DNS-rebinding requests. */
function isLoopbackHost(host: string | undefined): boolean {
	if (!host) return true; // HTTP/1.0 clients may omit it; not a browser.
	const name = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0];
	return LOOPBACK_NAMES.has(name.toLowerCase());
}

/** Grant CORS only to loopback origins, so a remote page cannot read replies. */
function isLoopbackOrigin(origin: string): boolean {
	try {
		const { hostname } = new URL(origin);
		return LOOPBACK_NAMES.has(hostname.toLowerCase());
	} catch {
		return false;
	}
}

class HttpError extends Error {
	constructor(readonly status: number, message: string) {
		super(message);
	}
}

function readBody(req: IncomingMessage): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;
		let settled = false;
		req.on("data", (chunk: Buffer) => {
			if (settled) return;
			size += chunk.length;
			if (size > MAX_BODY_BYTES) {
				settled = true;
				reject(new HttpError(413, "请求体过大"));
				// Drain the rest instead of destroying the socket, so the client
				// receives a real 413 response rather than a connection reset.
				req.resume();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			if (settled) return;
			settled = true;
			const raw = Buffer.concat(chunks).toString("utf8").trim();
			if (!raw) {
				resolve({});
				return;
			}
			try {
				resolve(JSON.parse(raw));
			} catch {
				reject(new HttpError(400, "请求体不是合法 JSON"));
			}
		});
		req.on("error", (error) => {
			if (settled) return;
			settled = true;
			reject(error);
		});
	});
}

function asString(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

/**
 * Read the request body and assert it is a JSON object.
 *
 * `readBody` happily returns `null`, `[]`, `"str"` or `123` when those are valid
 * JSON, and each POST handler then did `body.query`, which threw a TypeError and
 * surfaced as a 500 with an internal message. A malformed-but-parseable body is
 * a client error, so reject it as 400 here.
 */
async function readObjectBody(req: IncomingMessage): Promise<Record<string, unknown>> {
	const body = await readBody(req);
	if (body === null || typeof body !== "object" || Array.isArray(body)) {
		throw new HttpError(400, "请求体必须是 JSON 对象");
	}
	return body as Record<string, unknown>;
}

function asNumber(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return undefined;
}

function asStringArray(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
	return items.length > 0 ? items : undefined;
}

function asPriority(value: unknown): RulePriority | undefined {
	if (typeof value !== "string") return undefined;
	const normalized = value.trim().toLowerCase();
	if (!normalized) return undefined;
	if (normalized === "must" || normalized === "should" || normalized === "tip") return normalized;
	throw new HttpError(400, `priority 只能是 must / should / tip，收到：${value}`);
}

function asSources(value: unknown): SourceInput[] | undefined {
	if (!Array.isArray(value)) return undefined;
	const out: SourceInput[] = [];
	for (const item of value) {
		if (typeof item === "string" && item.trim()) {
			const raw = item.trim();
			const index = raw.indexOf("/");
			out.push(index === -1 ? { vault: raw } : { vault: raw.slice(0, index), path: raw.slice(index + 1) });
			continue;
		}
		if (item && typeof item === "object") {
			const record = item as Record<string, unknown>;
			const vault = asString(record.vault) ?? asString(record.vaultId);
			if (!vault) continue;
			out.push({ vault, vaultId: asString(record.vaultId), path: asString(record.path) });
		}
	}
	return out.length > 0 ? out : undefined;
}

export class QuoteServer {
	private server: http.Server | null = null;
	private starting: Promise<void> | null = null;
	private boundPort = 0;
	/**
	 * Session ids minted by `/ui/session`, keyed to their expiry. In memory on
	 * purpose: a plugin reload (Obsidian restart) drops every browser session,
	 * which is the safe default for a local-only panel.
	 */
	private readonly sessions = new Map<string, number>();
	private sessionToken: string | null = null;

	constructor(private readonly host: QuoteHost) {}

	get running(): boolean {
		return this.server !== null;
	}

	get port(): number {
		return this.boundPort || this.host.getSettings().server.port;
	}

	get url(): string {
		const { host } = this.host.getSettings().server;
		return `http://${host.includes(":") ? `[${host}]` : host}:${this.port}`;
	}

	async start(): Promise<void> {
		if (this.server) return;
		if (this.starting) return this.starting;
		this.starting = this.doStart().finally(() => {
			this.starting = null;
		});
		return this.starting;
	}

	private async doStart(): Promise<void> {
		const settings = this.host.getSettings().server;
		if (!["127.0.0.1", "localhost", "::1"].includes(settings.host)) {
			throw new Error("引用服务仅支持本机回环地址（127.0.0.1 / localhost / ::1）");
		}
		if (!settings.token?.trim()) throw new Error("缺少访问令牌，拒绝启动引用服务");
		const ports = [settings.port];
		for (let i = 1; i <= 9; i++) ports.push(settings.port + i);

		let lastError: unknown = null;
		for (const port of ports) {
			try {
				await this.listen(port);
				this.boundPort = port;
				return;
			} catch (error) {
				lastError = error;
			}
		}
		throw lastError instanceof Error ? lastError : new Error("端口启动失败");
	}

	async stop(): Promise<void> {
		if (this.starting) await this.starting.catch(() => undefined);
		this.sessions.clear();
		this.sessionToken = null;
		const server = this.server;
		if (!server) return;
		this.server = null;
		await new Promise<void>((resolve) => {
			// server.close() only stops accepting new connections and then waits for
			// the existing ones to end. A client that declares a body and never sends
			// it holds its connection open until the 300 s requestTimeout, so a plain
			// `await` hung forever — and panel.ts switches ports with
			// `await stop(); await start();`, so the new port was never bound.
			// Tear sockets down explicitly and keep a hard deadline, so shutdown can
			// never be blocked indefinitely.
			let settled = false;
			const finish = () => {
				if (settled) return;
				settled = true;
				nodeTimers.clearTimeout(timer);
				resolve();
			};
			// The HTTP service also runs in headless Node fixtures; these timers
			// belong to that service, independently of any popout window.
			const timer = nodeTimers.setTimeout(finish, 1000);
			server.close(finish);
			server.closeAllConnections?.();
		});
	}

	private listen(port: number): Promise<void> {
		return new Promise((resolve, reject) => {
			const server = http.createServer((req, res) => {
				this.handle(req, res).catch((error: unknown) => {
					this.sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
				});
			});
			const onError = (error: Error) => {
				server.close();
				reject(error);
			};
			server.once("error", onError);
			server.listen(port, this.host.getSettings().server.host, () => {
				server.off("error", onError);
				this.server = server;
				resolve();
			});
		});
	}

	private authorized(req: IncomingMessage, url: URL, allowSession = true): boolean {
		const token = this.host.getSettings().server.token;
		if (!token?.trim()) return false;

		const header = req.headers["authorization"];
		if (typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
			if (this.tokenMatches(header.slice(7).trim())) return true;
		}
		const custom = req.headers["x-quote-token"];
		if (typeof custom === "string" && this.tokenMatches(custom)) return true;
		if (this.tokenMatches(url.searchParams.get("token") ?? undefined)) return true;
		// A browser that exchanged the token for a session cookie at /ui/session.
		// The cookie is HttpOnly + SameSite=Strict, so a cross-site page cannot
		// attach it, and DNS rebinding is already blocked by the Host check.
		if (!allowSession) return false;
		const origin = req.headers.origin;
		if (origin) {
			try {
				if (new URL(origin).origin !== url.origin) return false;
			} catch {
				return false;
			}
		}
		return this.sessionValid(req);
	}

	/** Constant-time token comparison; never compares a missing token. */
	private tokenMatches(candidate: string | undefined): boolean {
		const token = this.host.getSettings().server.token;
		if (!token?.trim()) return false;
		if (typeof candidate !== "string") return false;
		const left = Buffer.from(candidate, "utf8");
		const right = Buffer.from(token, "utf8");
		if (left.length !== right.length) return false;
		return timingSafeEqual(left, right);
	}

	private createSession(): string {
		this.pruneSessions();
		const id = randomBytes(32).toString("hex");
		this.sessions.set(id, Date.now() + SESSION_TTL_MS);
		return id;
	}

	private pruneSessions(): void {
		const token = this.host.getSettings().server.token;
		if (this.sessionToken !== token) {
			this.sessions.clear();
			this.sessionToken = token;
		}
		const now = Date.now();
		for (const [id, expiresAt] of this.sessions) {
			if (expiresAt <= now) this.sessions.delete(id);
		}
	}

	private sessionValid(req: IncomingMessage): boolean {
		this.pruneSessions();
		const id = parseCookies(req.headers.cookie)[SESSION_COOKIE];
		if (!id) return false;
		const expiresAt = this.sessions.get(id);
		if (!expiresAt) return false;
		if (expiresAt <= Date.now()) {
			this.sessions.delete(id);
			return false;
		}
		return true;
	}

	private destroySession(req: IncomingMessage): void {
		const id = parseCookies(req.headers.cookie)[SESSION_COOKIE];
		if (id) this.sessions.delete(id);
	}

	private sessionCookie(id: string | null): string {
		const attributes = `Path=/; HttpOnly; SameSite=Strict`;
		if (!id) return `${SESSION_COOKIE}=; ${attributes}; Max-Age=0`;
		const maxAge = Math.floor(SESSION_TTL_MS / 1000);
		return `${SESSION_COOKIE}=${id}; ${attributes}; Max-Age=${maxAge}`;
	}

	private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);

		// The service binds to loopback, but a loopback bind alone does not stop a
		// remote page from reaching it: DNS rebinding makes the browser send
		// `Host: attacker.example` to 127.0.0.1, and the old `ACAO: *` made those
		// responses readable from that page. Only answer to loopback Host names and
		// only grant CORS to loopback origins, so rebinding and cross-site reads
		// both fail. CLI/MCP clients do not send Origin and are unaffected.
		if (!isLoopbackHost(req.headers.host)) {
			this.sendJson(res, 403, { error: "forbidden host" });
			return;
		}

		const origin = req.headers["origin"];
		if (typeof origin === "string" && isLoopbackOrigin(origin)) {
			res.setHeader("Access-Control-Allow-Origin", origin);
			res.setHeader("Vary", "Origin");
		}
		res.setHeader("Access-Control-Allow-Headers", "authorization, content-type, x-quote-token");
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		res.setHeader("Cache-Control", "no-store");
		res.setHeader("X-Content-Type-Options", "nosniff");
		res.setHeader("Referrer-Policy", "no-referrer");
		res.setHeader("X-Frame-Options", "DENY");

		if (req.method === "OPTIONS") {
			res.statusCode = 204;
			res.end();
			return;
		}

		// The browser panel: a harness-agnostic read-only page served by the same
		// loopback service, so Claude Code / Cursor / Codex users still get a UI
		// even though only DSH can mount an in-app sidebar tab. The shell itself
		// carries no data; `/ui/session` trades the token for an HttpOnly cookie.
		if (url.pathname === "/ui" || url.pathname === "/ui/") {
			if (req.method !== "GET") {
				this.sendJson(res, 405, { error: "method not allowed" });
				return;
			}
			const tokenParam = url.searchParams.get("token");
			if (tokenParam !== null) {
				if (!this.tokenMatches(tokenParam)) {
					this.sendJson(res, 401, { error: "unauthorized" });
					return;
				}
				res.setHeader("Set-Cookie", this.sessionCookie(this.createSession()));
				this.redirect(res, "/ui");
				return;
			}
			const nonce = randomBytes(16).toString("base64");
			this.sendHtml(res, renderWebUi(nonce), nonce);
			return;
		}

		if (req.method === "POST" && url.pathname === "/ui/session") {
			try {
				const body = await readObjectBody(req);
				const token = asString(body.token);
				if (!token) {
					this.sendJson(res, 400, { ok: false, error: "缺少令牌。" });
					return;
				}
				if (!this.tokenMatches(token)) {
					this.sendJson(res, 401, { ok: false, error: "令牌不正确。" });
					return;
				}
				res.setHeader("Set-Cookie", this.sessionCookie(this.createSession()));
				this.sendJson(res, 200, { ok: true });
			} catch (error) {
				const status = error instanceof HttpError ? error.status : 500;
				this.sendJson(res, status, { ok: false, error: error instanceof Error ? error.message : String(error) });
			}
			return;
		}

		if (req.method === "POST" && url.pathname === "/ui/logout") {
			this.destroySession(req);
			res.setHeader("Set-Cookie", this.sessionCookie(null));
			this.sendJson(res, 200, { ok: true });
			return;
		}

		if (url.pathname === "/health") {
			const status = this.host.getStatus();
			this.sendJson(res, 200, {
				ok: true,
				version: status.version,
				indexing: status.indexing,
				vaults: status.vaults.length,
				docs: status.totalDocs,
				chunks: status.totalChunks,
				rules: status.totalRules,
				lastBuiltAt: status.lastBuiltAt,
				injection: status.settings.injection,
			});
			return;
		}

		if (!this.authorized(req, url, url.pathname !== "/reindex")) {
			this.sendJson(res, 401, { error: "unauthorized", hint: "在插件面板复制接入配置，使用 Bearer 令牌访问。" });
			return;
		}

		try {
			if (req.method === "GET" && url.pathname === "/vaults") {
				const status = this.host.getStatus();
				this.sendJson(res, 200, { vaults: status.vaults });
				return;
			}

			if (req.method === "GET" && url.pathname === "/search") {
				const query = url.searchParams.get("q") ?? url.searchParams.get("query") ?? "";
				if (!query.trim()) {
					this.sendJson(res, 400, { error: "缺少查询参数 q" });
					return;
				}
				const result = this.host.search(query, this.optionsFrom(url.searchParams));
				this.host.recordCitation("search", query, result.hits);
				this.sendJson(res, 200, result);
				return;
			}

			if (req.method === "POST" && url.pathname === "/search") {
				const body = await readObjectBody(req);
				const query = asString(body.query) ?? asString(body.q) ?? "";
				if (!query.trim()) {
					this.sendJson(res, 400, { error: "缺少 query 字段" });
					return;
				}
				const options: SearchOptions = {
					limit: asNumber(body.limit),
					maxChars: asNumber(body.maxChars),
					vaults: asStringArray(body.vaults),
					sources: asSources(body.sources),
					profile: asString(body.profile),
					minScoreRatio: asNumber(body.minScoreRatio),
				};
				const result = this.host.search(query, options);
				this.host.recordCitation("search", query, result.hits);
				this.sendJson(res, 200, result);
				return;
			}

			if (req.method === "POST" && url.pathname === "/context") {
				const body = await readObjectBody(req);
				const query = asString(body.query) ?? asString(body.q) ?? "";
				if (!query.trim()) {
					this.sendJson(res, 400, { error: "缺少 query 字段" });
					return;
				}
				const result = this.host.buildContext(
					query,
					asNumber(body.budget),
					asNumber(body.limit),
					asSources(body.sources),
					asString(body.profile)
				);
				this.host.recordCitation("context", query, result.hits);
				this.sendJson(res, 200, result);
				return;
			}

			if (req.method === "GET" && url.pathname === "/rules") {
				const options: RuleOptions = {
					query: url.searchParams.get("q") ?? url.searchParams.get("query") ?? undefined,
					topic: url.searchParams.get("topic") ?? undefined,
					priority: asPriority(url.searchParams.get("priority")),
					limit: asNumber(url.searchParams.get("limit")),
					sources: asSources(url.searchParams.getAll("source")),
					profile: url.searchParams.get("profile") ?? undefined,
				};
				const result = this.host.getRules(options);
				this.host.recordCitation(
					"rules",
					options.query ?? "",
					result.rules.map((rule) => ({ vault: rule.vault, path: rule.path, title: rule.heading || rule.text }))
				);
				this.sendJson(res, 200, result);
				return;
			}

			if (req.method === "POST" && url.pathname === "/rules") {
				const body = await readObjectBody(req);
				const options: RuleOptions = {
					query: asString(body.query) ?? asString(body.q),
					topic: asString(body.topic),
					priority: asPriority(body.priority),
					limit: asNumber(body.limit),
					sources: asSources(body.sources),
					profile: asString(body.profile),
				};
				const result = this.host.getRules(options);
				this.host.recordCitation(
					"rules",
					options.query ?? "",
					result.rules.map((rule) => ({ vault: rule.vault, path: rule.path, title: rule.heading || rule.text }))
				);
				this.sendJson(res, 200, result);
				return;
			}

			if (req.method === "POST" && url.pathname === "/brief") {
				const body = await readObjectBody(req);
				const options: BriefOptions = {
					projectPath: asString(body.projectPath) ?? asString(body.project),
					stack: asStringArray(body.stack),
					budget: asNumber(body.budget),
					limit: asNumber(body.limit),
					sources: asSources(body.sources),
					profile: asString(body.profile),
				};
				const result = await this.host.buildBrief(options);
				if (result.error) {
					this.sendJson(res, 400, { error: result.error });
					return;
				}
				this.host.recordCitation(
					"brief",
					`brief: ${result.stack.join(", ")}`,
					result.rules.map((rule) => ({ vault: rule.vault, path: rule.path, title: rule.heading || rule.text }))
				);
				this.sendJson(res, 200, result);
				return;
			}

			if (req.method === "GET" && url.pathname === "/stats") {
				this.sendJson(res, 200, this.host.getStats());
				return;
			}

			if (req.method === "POST" && url.pathname === "/reindex") {
				await this.host.rebuild();
				const status = this.host.getStatus();
				this.sendJson(res, 200, { ok: true, docs: status.totalDocs, chunks: status.totalChunks, rules: status.totalRules });
				return;
			}

			this.sendJson(res, 404, {
				error: "not found",
				endpoints: ["/health", "/ui", "/vaults", "/search", "/context", "/rules", "/brief", "/stats", "/reindex"],
			});
		} catch (error) {
			const status = error instanceof HttpError ? error.status : 500;
			this.sendJson(res, status, { error: error instanceof Error ? error.message : String(error) });
		}
	}

	private optionsFrom(params: URLSearchParams): SearchOptions {
		return {
			limit: asNumber(params.get("limit")),
			maxChars: asNumber(params.get("maxChars")),
			vaults: params.getAll("vault"),
			sources: asSources(params.getAll("source")),
			profile: params.get("profile") ?? undefined,
			minScoreRatio: asNumber(params.get("minScoreRatio")),
		};
	}

	private sendHtml(res: ServerResponse, html: string, nonce: string): void {
		if (res.writableEnded) return;
		const body = Buffer.from(html, "utf8");
		res.statusCode = 200;
		res.setHeader("Content-Type", "text/html; charset=utf-8");
		res.setHeader(
			"Content-Security-Policy",
			[
				"default-src 'none'",
				`style-src 'nonce-${nonce}'`,
				`script-src 'nonce-${nonce}'`,
				"connect-src 'self'",
				"img-src 'none'",
				"base-uri 'none'",
				"form-action 'none'",
				"frame-ancestors 'none'",
			].join("; ")
		);
		res.setHeader("Content-Length", body.length);
		res.end(body);
	}

	private redirect(res: ServerResponse, location: string): void {
		res.statusCode = 303;
		res.setHeader("Location", location);
		res.end();
	}

	private sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
		if (res.writableEnded) return;
		const body = JSON.stringify(payload, null, 2);
		res.statusCode = statusCode;
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.setHeader("Content-Length", Buffer.byteLength(body));
		res.end(body);
	}
}
