import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Notice, Plugin } from "obsidian";
import { createDefaultSettings, VIEW_TYPE } from "./constants";
import { VaultIndexer } from "./indexer";
import { CitationLedger, type LedgerData } from "./ledger";
import { QuotePanel } from "./panel";
import { QuoteServer } from "./server";
import type { CitationRef, QuoteHost } from "./server";
import { QuoteSettingTab } from "./settings";
import type {
	BriefOptions,
	BriefResponse,
	ContextResponse,
	HostStatus,
	Profile,
	QuoteSettings,
	RuleOptions,
	RuleResponse,
	SearchOptions,
	SearchResponse,
	SourceInput,
	StatsResponse,
	VaultEntry,
} from "./types";
import {
	createVaultEntry,
	isWithinDirectory,
	isValidVaultPath,
	makeVaultId,
	normalizeVaultPath,
	vaultNameFromPath,
} from "./vault-registry";

interface PluginData {
	settings?: Partial<QuoteSettings>;
	ledger?: LedgerData;
}

export default class QuotePlugin extends Plugin implements QuoteHost {
	settings!: QuoteSettings;
	indexer!: VaultIndexer;
	server!: QuoteServer;
	ledger = new CitationLedger();

	private listeners = new Set<() => void>();
	private saveTimer: number | null = null;
	private rebuildTimer: number | null = null;
	private watchers: fs.FSWatcher[] = [];
	private watchSignature = "";

	async onload(): Promise<void> {
		await this.loadSettings();

		this.indexer = new VaultIndexer(() => this.settings, (vaultPath) => this.configDirForVault(vaultPath));
		this.server = new QuoteServer(this);

		this.registerView(VIEW_TYPE, (leaf) => new QuotePanel(leaf, this));

		this.addRibbonIcon("library", "知识库引用", () => {
			void this.openPanel();
		});

		this.addCommand({
			id: "open-quote-panel",
			name: "打开知识库引用面板",
			callback: () => {
				void this.openPanel();
			},
		});

		this.addCommand({
			id: "rebuild-quote-index",
			name: "重建知识库索引",
			callback: () => {
				void this.rebuild()
					.then(() => {
						new Notice(`索引完成：${this.indexer.chunkCount} 个段落 / ${this.indexer.ruleCount} 条规则`);
					})
					.catch((error: unknown) => {
						new Notice(`索引失败：${error instanceof Error ? error.message : String(error)}`);
					});
			},
		});

		this.addSettingTab(new QuoteSettingTab(this.app, this));

		this.app.workspace.onLayoutReady(() => {
			// First run on a fresh install: registering the open vault removes the
			// hardest manual step. Opt out with the panel toggle when the user wants
			// to start with a hand-picked list instead.
			if (this.settings.ui.autoRegisterCurrentVault && this.settings.vaults.length === 0) {
				const adapter = this.app.vault.adapter as unknown as { getBasePath?: () => string };
				const basePath = adapter.getBasePath?.();
				if (basePath) {
					const before = this.settings.vaults.length;
					const added = this.addVault(basePath);
					if (added.ok && this.settings.vaults.length > before) {
						const entry = this.settings.vaults[this.settings.vaults.length - 1];
						new Notice(`已自动登记当前库：${entry.name}`);
						void this.saveSettings();
					}
				}
			}
			if (this.settings.server.enabled) {
				void this.server.start().catch((error: unknown) => {
					new Notice(`引用服务启动失败：${error instanceof Error ? error.message : String(error)}`);
				});
			}
			this.syncWatchers();
			void this.rebuild();
		});
	}

	onunload(): void {
		if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
		if (this.rebuildTimer !== null) window.clearTimeout(this.rebuildTimer);
		this.saveTimer = null;
		this.rebuildTimer = null;
		this.listeners.clear();
		this.closeWatchers();
		void this.server.stop();
	}

	async loadSettings(): Promise<void> {
		const raw = (await this.loadData()) as (Partial<QuoteSettings> & PluginData) | null;
		const source = raw?.settings ?? raw;
		const defaults = createDefaultSettings();

		this.settings = {
			vaults: this.normalizeVaults(source?.vaults),
			scope: { ...defaults.scope, ...(source?.scope ?? {}) },
			retrieval: { ...defaults.retrieval, ...(source?.retrieval ?? {}) },
			server: { ...defaults.server, ...(source?.server ?? {}) },
			index: { ...defaults.index, ...(source?.index ?? {}) },
			ui: { ...defaults.ui, ...(source?.ui ?? {}) },
			injection: { ...defaults.injection, ...(source?.injection ?? {}) },
			profiles: this.normalizeProfiles(source?.profiles),
		};

		for (const key of ["includeFolders", "excludeFolders", "requiredTags"] as const) {
			if (!Array.isArray(this.settings.scope[key])) this.settings.scope[key] = [];
		}
		if (!this.settings.server.token) this.settings.server.token = defaults.server.token;
		if (typeof this.settings.index.watch !== "boolean") this.settings.index.watch = true;
		if (typeof this.settings.ui.advanced !== "boolean") this.settings.ui.advanced = false;
		if (typeof this.settings.ui.autoRegisterCurrentVault !== "boolean") {
			this.settings.ui.autoRegisterCurrentVault = true;
		}
		if (this.settings.injection.format !== "plain") this.settings.injection.format = "markdown";
		if (this.settings.injection.timing !== "brief-first") this.settings.injection.timing = "manual";

		this.ledger.load(raw?.ledger);
	}

	addProfile(name: string, lines: string[]): { ok: boolean; message: string } {
		const trimmed = name.trim();
		if (!trimmed) return { ok: false, message: "请填写组合名称" };
		if (this.settings.profiles.some((profile) => profile.name === trimmed)) {
			return { ok: false, message: "同名组合已存在" };
		}

		const sources: SourceInput[] = [];
		for (const line of lines) {
			const raw = line.trim();
			if (!raw) continue;
			const index = raw.indexOf("/");
			const vaultName = (index === -1 ? raw : raw.slice(0, index)).trim();
			const subPath = index === -1 ? "" : raw.slice(index + 1).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").trim();
			const explicit = this.settings.vaults.find((entry) => entry.id === vaultName);
			const matches = this.settings.vaults.filter((entry) => entry.name.toLowerCase() === vaultName.toLowerCase());
			if (!explicit && matches.length > 1) {
				return { ok: false, message: `存在同名知识库：${vaultName}，请使用知识库 id 指定来源` };
			}
			const vault = explicit ?? matches[0];
			if (!vault) return { ok: false, message: `未登记的知识库：${vaultName}` };
			if (subPath) {
				const absolute = path.join(vault.path, subPath);
				if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
					return { ok: false, message: `子目录不存在：${vault.name}/${subPath}` };
				}
			}
			sources.push({ vault: vault.name, vaultId: vault.id, path: subPath || undefined });
		}

		if (sources.length === 0) return { ok: false, message: "至少填写一个来源" };
		this.settings.profiles.push({ id: `P-${Date.now().toString(36)}`, name: trimmed, sources });
		return { ok: true, message: "已添加组合" };
	}

	async saveSettings(): Promise<void> {
		await this.saveData({ settings: this.settings, ledger: this.ledger.toJSON() } satisfies PluginData);
		this.syncWatchers();
	}

	/**
	 * Persist the same `{url, token}` blob the panel shows to the well-known
	 * harness config path, so users no longer have to copy it by hand.
	 * The previous file is kept as `config.json.bak` instead of being lost.
	 */
	async writeHarnessConfig(): Promise<{ ok: boolean; message: string }> {
		const dir = path.join(os.homedir(), ".obsidian-quote");
		const file = path.join(dir, "config.json");
		const payload = { url: this.server.url, token: this.settings.server.token };
		try {
			fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
			if (process.platform !== "win32") fs.chmodSync(dir, 0o700);
			let backup = "";
			if (fs.existsSync(file)) {
				if (process.platform !== "win32") fs.chmodSync(file, 0o600);
				try {
					fs.copyFileSync(file, `${file}.bak`);
					if (process.platform !== "win32") fs.chmodSync(`${file}.bak`, 0o600);
					backup = "（原文件已备份为 config.json.bak）";
				} catch {
					// Backup is a courtesy; a read-only old file must not block the write.
				}
			}
			fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
			if (process.platform !== "win32") fs.chmodSync(file, 0o600);
			return { ok: true, message: `接入配置已写入 ${file}${backup}` };
		} catch (error) {
			return {
				ok: false,
				message: `写入接入配置失败：${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	scheduleSave(delay = 250): void {
		if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
		this.saveTimer = window.setTimeout(() => {
			this.saveTimer = null;
			void this.saveSettings();
		}, delay);
	}

	scheduleRebuild(delay = 600): void {
		if (this.rebuildTimer !== null) window.clearTimeout(this.rebuildTimer);
		this.rebuildTimer = window.setTimeout(() => {
			this.rebuildTimer = null;
			void this.rebuild();
		}, delay);
	}

	async rebuild(): Promise<void> {
		await this.indexer.build();
		this.notify();
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	notify(): void {
		for (const listener of Array.from(this.listeners)) {
			listener();
		}
	}

	addVault(input: string): { ok: boolean; message: string } {
		const absolute = normalizeVaultPath(input);
		if (!isValidVaultPath(absolute)) {
			return { ok: false, message: "路径不存在或不是文件夹" };
		}
		const id = makeVaultId(absolute);
		if (this.settings.vaults.some((vault) => vault.id === id)) {
			return { ok: false, message: "该知识库已登记" };
		}
		this.settings.vaults.push(createVaultEntry(absolute));
		return { ok: true, message: "已添加" };
	}

	async openPanel(): Promise<void> {
		const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
		if (existing) {
			await this.app.workspace.revealLeaf(existing);
			return;
		}
		const leaf = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf(true);
		await leaf.setViewState({ type: VIEW_TYPE, active: true });
		await this.app.workspace.revealLeaf(leaf);
	}

	// ------------------------------------------------------------ QuoteHost
	getSettings(): QuoteSettings {
		return this.settings;
	}

	getStatus(): HostStatus {
		const stats = new Map(this.indexer.statsList.map((stat) => [stat.vaultId, stat]));
		return {
			version: this.manifest.version,
			vaults: this.settings.vaults.map((vault) => {
				const stat = stats.get(vault.id);
				return {
					id: vault.id,
					name: vault.name,
					path: vault.path,
					enabled: vault.enabled,
					docs: stat?.docs ?? 0,
					chunks: stat?.chunks ?? 0,
					rules: stat?.rules ?? 0,
					error: stat?.error,
				};
			}),
			totalDocs: this.indexer.docCount,
			totalChunks: this.indexer.chunkCount,
			totalRules: this.indexer.ruleCount,
			indexing: this.indexer.isBuilding,
			lastBuiltAt: this.indexer.lastBuiltAt,
			server: {
				running: this.server.running,
				url: this.server.url,
				port: this.server.port,
			},
			settings: this.settings,
		};
	}

	search(query: string, options: SearchOptions = {}): SearchResponse {
		this.indexer.ensureFresh();
		return this.indexer.search(query, options);
	}

	buildContext(
		query: string,
		budget?: number,
		limit?: number,
		sources?: SourceInput[],
		profile?: string
	): ContextResponse {
		this.indexer.ensureFresh();
		return this.indexer.buildContext(query, budget, limit, sources, profile);
	}

	getRules(options: RuleOptions): RuleResponse {
		this.indexer.ensureFresh();
		return this.indexer.getRules(options);
	}

	buildBrief(options: BriefOptions): Promise<BriefResponse> {
		this.indexer.ensureFresh();
		return this.indexer.buildBrief(options);
	}

	getStats(): StatsResponse {
		return this.ledger.getStats();
	}

	recordCitation(kind: string, query: string, refs: CitationRef[]): void {
		this.ledger.record(kind, query, refs);
		this.scheduleSave(4000);
	}

	// --------------------------------------------------------------- watchers
	private configDirForVault(vaultPath: string): string | undefined {
		const currentPath = (this.app.vault.adapter as { getBasePath?: () => string }).getBasePath?.();
		if (!currentPath || path.relative(currentPath, vaultPath) !== "") return undefined;
		return this.app.vault.configDir;
	}
	private syncWatchers(): void {
		const signature = `${this.settings.index.watch}|${this.settings.vaults
			.filter((vault) => vault.enabled)
			.map((vault) => vault.path)
			.join("|")}`;
		if (signature === this.watchSignature) return;
		this.watchSignature = signature;
		this.closeWatchers();

		if (!this.settings.index.watch) return;

		for (const vault of this.settings.vaults) {
			if (!vault.enabled) continue;
			try {
				const watcher = fs.watch(vault.path, { recursive: true }, (_event, filename) => {
					if (typeof filename === "string" && filename.length > 0 && !this.isRelevantChange(filename, vault.path)) return;
					this.scheduleRebuild(1200);
				});
				watcher.on("error", () => undefined);
				this.watchers.push(watcher);
			} catch (error) {
				new Notice(`知识库文件监听不可用，请手动重建索引：${error instanceof Error ? error.message : String(error)}`);
			}
		}
	}

	private isRelevantChange(filename: string, vaultPath: string): boolean {
		const normalized = filename.replace(/\\/g, "/");
		const parts = normalized.split("/");
		if (parts.some((part) => part.startsWith(".") || part === "node_modules")) {
			return false;
		}
		const configDir = this.configDirForVault(vaultPath)?.replace(/\\/g, "/").replace(/\/+$/, "");
		if (configDir && isWithinDirectory(normalized, configDir)) return false;
		const base = normalized.split("/").pop() ?? normalized;
		return base.toLowerCase().endsWith(".md");
	}

	private closeWatchers(): void {
		for (const watcher of this.watchers) {
			try {
				watcher.close();
			} catch {
				// ignore
			}
		}
		this.watchers = [];
	}

	private normalizeProfiles(raw: unknown): Profile[] {
		if (!Array.isArray(raw)) return [];
		const result: Profile[] = [];
		for (const item of raw) {
			if (!item || typeof item !== "object") continue;
			const record = item as Record<string, unknown>;
			if (typeof record.name !== "string" || !record.name.trim()) continue;
			if (!Array.isArray(record.sources)) continue;

			const sources: SourceInput[] = [];
			for (const entry of record.sources) {
				if (!entry || typeof entry !== "object") continue;
				const source = entry as Record<string, unknown>;
				if (typeof source.vault !== "string" || !source.vault.trim()) continue;
				sources.push({
					vault: source.vault,
					vaultId: typeof source.vaultId === "string" ? source.vaultId : undefined,
					path: typeof source.path === "string" ? source.path : undefined,
				});
			}
			if (sources.length === 0) continue;
			result.push({
				id: typeof record.id === "string" && record.id ? record.id : `P-${result.length + 1}`,
				name: record.name.trim(),
				sources,
			});
		}
		return result;
	}

	private normalizeVaults(raw: unknown): VaultEntry[] {
		if (!Array.isArray(raw)) return [];
		const result: VaultEntry[] = [];
		const seen = new Set<string>();
		for (const item of raw) {
			if (!item || typeof item !== "object") continue;
			const record = item as Record<string, unknown>;
			if (typeof record.path !== "string" || record.path.trim().length === 0) continue;
			const absolute = normalizeVaultPath(record.path);
			const id = makeVaultId(absolute);
			if (seen.has(id)) continue;
			seen.add(id);
			result.push({
				id,
				name: typeof record.name === "string" && record.name.trim() ? record.name : vaultNameFromPath(absolute),
				path: absolute,
				enabled: record.enabled !== false,
			});
		}
		return result;
	}
}
