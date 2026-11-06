import * as fs from "fs";
import * as path from "path";
import { composeBrief, detectProjectStack, isForeignRule, stackTopics } from "./brief";
import { renderContextHeader } from "./format";
import { parseNote } from "./note-parser";
import { extractRules, priorityWeight, publicRule, ruleKey, type RuleInternal } from "./rules";
import { tokenize } from "./tokenizer";
import { isWithinDirectory } from "./vault-registry";
import type {
	BriefOptions,
	BriefResponse,
	Chunk,
	ContextResponse,
	IndexStats,
	QuoteSettings,
	RuleHit,
	RuleOptions,
	RulePriority,
	RuleResponse,
	SearchHit,
	SearchOptions,
	SearchResponse,
	SourceInput,
} from "./types";

const SKIP_DIRS = new Set([
	".git",
	".trash",
	".stfolder",
	".stversions",
	"node_modules",
	"__pycache__",
	".venv",
	"venv",
	".idea",
	".vscode",
	".next",
	".nuxt",
	".cache",
	".tox",
	".mypy_cache",
	".pytest_cache",
]);

const K1 = 1.2;
const B = 0.6;

/**
 * Navigational sections match keywords but rarely contain the rule itself.
 * This is a ranking prior only: such snippets can still be returned.
 */
const NAVIGATION_HEADING =
	/(资料来源|参考资料|参考文献|来源|关系|相关笔记|相关链接|目录|索引|导航|总览|references?|sources?|see also|related)/i;

/**
 * Damps snippets that are mostly navigation (wiki-link lists, "related notes",
 * source lists). They match a query well but carry little reference value.
 */
function contentWeight(text: string, heading: string): number {
	const length = text.length;
	if (length === 0) return 0;
	const links = text.match(/\[\[[^\]]*\]\]|\[[^\]]*\]\([^)]*\)/g) ?? [];
	const linkChars = links.reduce((sum, item) => sum + item.length, 0);
	const linkRatio = linkChars / length;

	let weight = 1;
	if (length < 80) weight *= 0.85;
	if (linkRatio > 0.4) weight *= 0.55;
	else if (linkRatio > 0.2) weight *= 0.8;
	if (NAVIGATION_HEADING.test(heading)) weight *= 0.6;
	return weight;
}

function normalizePrefix(input: string): string {
	return input
		.trim()
		.replace(/\\/g, "/")
		.replace(/^\.\//, "")
		.replace(/^\/+/, "")
		.replace(/\/+$/, "");
}

function matchesPrefix(relPath: string, prefix: string): boolean {
	if (!prefix) return false;
	return relPath === prefix || relPath.startsWith(prefix + "/");
}

/**
 * Deep-ish copy of a cached rule for use in a fresh build.
 *
 * `doBuild` later merges rules by id and mutates `count` **in place**
 * (`existing.count += 1`). Reusing the cached object references would therefore
 * increment the very objects stored in the cache, so every rebuild would add
 * another +1 on top of an already inflated number. `tf` is a Map, so it needs
 * its own copy too; `count` is reset because the merge recomputes it from the
 * rules present in this build.
 */
function cloneRule(rule: RuleInternal): RuleInternal {
	return { ...rule, tf: new Map(rule.tf), count: 1 };
}

function mergeRules(occurrences: RuleInternal[]): RuleInternal[] {
	const merged = new Map<string, RuleInternal>();
	for (const rule of occurrences) {
		const key = ruleKey(rule.text);
		const existing = merged.get(key);
		if (existing) existing.count += 1;
		else merged.set(key, cloneRule(rule));
	}
	return Array.from(merged.values());
}

function splitByLength(text: string, max: number): string[] {
	if (text.length <= max) return [text];
	const parts: string[] = [];
	let buffer = "";
	const push = () => {
		if (buffer.trim()) parts.push(buffer.trim());
		buffer = "";
	};
	for (const paragraph of text.split(/\n{2,}/)) {
		const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
		if (candidate.length > max && buffer) push();
		buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
		while (buffer.length > max) {
			parts.push(buffer.slice(0, max));
			buffer = buffer.slice(max);
		}
	}
	push();
	return parts;
}

async function collectFiles(root: string, settings: QuoteSettings, configDir?: string): Promise<string[]> {
	const out: string[] = [];
	const includes = settings.scope.includeFolders.map(normalizePrefix).filter(Boolean);
	const excludes = settings.scope.excludeFolders.map(normalizePrefix).filter(Boolean);
	const configPrefix = normalizePrefix(configDir ?? "");

	const visit = async (rel: string): Promise<void> => {
		let entries: fs.Dirent[];
		try {
			entries = await fs.promises.readdir(rel ? path.join(root, rel) : root, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			const childRel = rel ? `${rel}/${entry.name}` : entry.name;
			if (configPrefix && isWithinDirectory(childRel, configPrefix)) continue;
			if (entry.isDirectory()) {
				if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name.toLowerCase())) continue;
				if (excludes.some((prefix) => matchesPrefix(childRel, prefix))) continue;
				await visit(childRel);
			} else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
				if (excludes.some((prefix) => matchesPrefix(childRel, prefix))) continue;
				if (includes.length > 0 && !includes.some((prefix) => matchesPrefix(childRel, prefix))) continue;
				out.push(childRel);
			}
		}
	};

	await visit("");
	out.sort();
	return out;
}

function hasAnyTag(noteTags: string[], required: string[]): boolean {
	if (required.length === 0) return true;
	const lowered = noteTags.map((tag) => tag.toLowerCase());
	return required.some((tag) => lowered.includes(tag.toLowerCase()));
}

function makeChunk(
	vaultId: string,
	vaultName: string,
	relPath: string,
	title: string,
	heading: string,
	text: string,
	tags: string[],
	mtime: number
): Chunk {
	const termFreq = new Map<string, number>();
	const add = (value: string, weight: number) => {
		if (!value) return;
		for (const token of tokenize(value)) {
			termFreq.set(token, (termFreq.get(token) ?? 0) + weight);
		}
	};

	add(title, 3);
	add(heading, 2);
	add(tags.join(" "), 2);
	add(relPath, 1);
	add(text, 1);

	let length = 0;
	for (const value of termFreq.values()) length += value;

	return {
		vaultId,
		vaultName,
		relPath,
		title,
		heading,
		text,
		tags,
		mtime,
		length,
		weight: contentWeight(text, heading),
		termFreq,
	};
}

interface FileCacheEntry {
	mtimeMs: number;
	size: number;
	vaultName: string;
	chunks: Chunk[];
	rules: RuleInternal[];
}

interface ResolvedSource {
	vaultId: string;
	vaultName: string;
	path: string;
}

function matchesSources(vaultId: string, relPath: string, sources: ResolvedSource[]): boolean {
	return sources.some(
		(source) =>
			source.vaultId === vaultId &&
			(!source.path || relPath === source.path || relPath.startsWith(source.path + "/"))
	);
}

export class VaultIndexer {
	private ruleOccurrences: RuleInternal[] = [];
	private chunks: Chunk[] = [];
	private rules: RuleInternal[] = [];
	private stats = new Map<string, IndexStats>();
	private docFreq = new Map<string, number>();
	private avgLength = 0;
	private ruleDf = new Map<string, number>();
	private ruleAvgLength = 0;
	private building: Promise<void> | null = null;
	private cache = new Map<string, FileCacheEntry>();
	private cacheSignature = "";
	private lastWarnings: string[] = [];

	lastBuiltAt = 0;

	constructor(
		private readonly getSettings: () => QuoteSettings,
		private readonly getConfigDir: (vaultPath: string) => string | undefined = () => undefined
	) {}

	get isBuilding(): boolean {
		return this.building !== null;
	}

	get chunkCount(): number {
		return this.chunks.length;
	}

	get ruleCount(): number {
		return this.rules.length;
	}

	get docCount(): number {
		let total = 0;
		for (const stat of this.stats.values()) total += stat.docs;
		return total;
	}

	get statsList(): IndexStats[] {
		return Array.from(this.stats.values());
	}

	statsFor(vaultId: string): IndexStats | undefined {
		return this.stats.get(vaultId);
	}

	/**
	 * Turns explicit sources or a stored profile into concrete vault+subfolder
	 * selectors. Returns null when no scoping was requested (use every enabled
	 * vault), and an empty list when the request could not be resolved.
	 */
	private resolveSources(input?: SourceInput[], profileName?: string): ResolvedSource[] | null {
		const settings = this.getSettings();
		this.lastWarnings = [];
		const requested = Boolean((input && input.length > 0) || profileName);
		if (!requested) return null;

		let list = input;
		if ((!list || list.length === 0) && profileName) {
			const profile = settings.profiles.find((item) => item.id === profileName || item.name === profileName);
			if (!profile) this.lastWarnings.push(`未找到组合「${profileName}」`);
			list = profile?.sources;
		}
		// A profile/source was requested but nothing matched: return an empty
		// scope (zero results) instead of silently falling back to every vault.
		// Always say why — an empty result with no warning is indistinguishable
		// from "the knowledge base has no matching content".
		if (!list || list.length === 0) {
			if (!profileName) this.lastWarnings.push("指定的来源为空，未检索任何知识库");
			return [];
		}

		const resolved: ResolvedSource[] = [];
		for (const item of list) {
			if (!item || typeof item.vault !== "string") continue;

			let vault: (typeof settings.vaults)[number] | undefined;
			if (item.vaultId) {
				vault = settings.vaults.find((entry) => entry.id === item.vaultId);
			} else {
				const byName = settings.vaults.filter((entry) => entry.name.toLowerCase() === item.vault.toLowerCase());
				if (byName.length > 1) {
					// Two vaults can share a folder name (e.g. two "Notes").
					// Picking the first one silently would cite the wrong notes.
					this.lastWarnings.push(
						`来源「${item.vault}」匹配到 ${byName.length} 个同名知识库，已跳过；请改用唯一的库名或 vaultId`
					);
					continue;
				}
				vault = byName[0] ?? settings.vaults.find((entry) => entry.id === item.vault);
			}
			if (!vault) {
				this.lastWarnings.push(`未找到知识库「${item.vault}」`);
				continue;
			}
			resolved.push({
				vaultId: vault.id,
				vaultName: vault.name,
				path: normalizePrefix(item.path ?? ""),
			});
		}
		return resolved;
	}

	async build(): Promise<void> {
		if (this.building) return this.building;
		this.building = this.doBuild().finally(() => {
			this.building = null;
		});
		return this.building;
	}

	/** Kicks off a rebuild when the index is older than the configured TTL. */
	ensureFresh(): void {
		if (this.building) return;
		const ttl = Math.max(10, this.getSettings().index.refreshSeconds) * 1000;
		if (Date.now() - this.lastBuiltAt > ttl) {
			void this.build();
		}
	}

	private async doBuild(): Promise<void> {
		const settings = this.getSettings();
		const chunks: Chunk[] = [];
		const stats = new Map<string, IndexStats>();
		const startedAt = Date.now();
		const maxBytes = Math.max(1, settings.index.maxFileSizeKB) * 1024;
		const maxChars = Math.max(200, settings.retrieval.maxCharsPerSnippet);
		const allRules: RuleInternal[] = [];

		const signature = `${maxChars}|${maxBytes}|${settings.scope.requiredTags.join(",")}`;
		if (this.cacheSignature !== signature) {
			this.cache.clear();
			this.cacheSignature = signature;
		}
		const nextCache = new Map<string, FileCacheEntry>();

		for (const vault of settings.vaults) {
			if (!vault.enabled) {
				stats.set(vault.id, {
					vaultId: vault.id,
					vaultName: vault.name,
					docs: 0,
					chunks: 0,
					rules: 0,
					skipped: 0,
					builtAt: startedAt,
				});
				continue;
			}

			let docs = 0;
			let vaultChunks = 0;
			let vaultRules = 0;
			let skipped = 0;
			let error: string | undefined;

			try {
				await fs.promises.access(vault.path, fs.constants.R_OK);
				// access() succeeds on a regular file too, and the readdir inside
				// collectFiles() swallows its own failure — so a vault path that
				// points at a file used to yield docs:0 with a null error and no
				// hint at all. Reject it here so the reason is reported.
				const pathStat = await fs.promises.stat(vault.path);
				if (!pathStat.isDirectory()) throw new Error("不是目录");
			} catch (pathError) {
				stats.set(vault.id, {
					vaultId: vault.id,
					vaultName: vault.name,
					docs: 0,
					chunks: 0,
					rules: 0,
					skipped: 0,
					error: pathError instanceof Error ? `路径不可读：${pathError.message}` : "路径不可读",
					builtAt: startedAt,
				});
				continue;
			}

			const files = await collectFiles(vault.path, settings, this.getConfigDir(vault.path));
			for (const relPath of files) {
				const absolute = path.join(vault.path, relPath);
				try {
					const stat = await fs.promises.stat(absolute);
					if (stat.size > maxBytes) {
						skipped++;
						continue;
					}

					const cacheKey = `${vault.id}|${relPath}`;
					const cached = this.cache.get(cacheKey);
					if (
						cached &&
						cached.mtimeMs === stat.mtimeMs &&
						cached.size === stat.size &&
						cached.vaultName === vault.name
					) {
						chunks.push(...cached.chunks);
						// Clone the cached rule objects: the merge step below mutates
						// `count` in place, so handing out the cached references would
						// accumulate one increment per rebuild on the *same* objects
						// (build#1=2, build#2=3, ...), corrupting both the /rules
						// ordering and the "（N 篇同述）" suffix written into briefs.
						allRules.push(...cached.rules.map(cloneRule));
						docs++;
						vaultChunks += cached.chunks.length;
						vaultRules += cached.rules.length;
						nextCache.set(cacheKey, cached);
						continue;
					}

					const raw = await fs.promises.readFile(absolute, "utf8");
					const note = parseNote(raw, relPath);
					if (!hasAnyTag(note.tags, settings.scope.requiredTags)) {
						skipped++;
						continue;
					}
					docs++;

					const fileChunks: Chunk[] = [];
					const fileRules: RuleInternal[] = [];
					const updated = new Date(stat.mtimeMs).toISOString();

					for (const section of note.sections) {
						for (const piece of splitByLength(section.text, maxChars)) {
							fileChunks.push(
								makeChunk(
									vault.id,
									vault.name,
									relPath,
									note.title,
									section.heading,
									piece,
									note.tags,
									stat.mtimeMs
								)
							);
						}
						fileRules.push(
							...extractRules(section.text, {
								vaultId: vault.id,
								vault: vault.name,
								path: relPath,
								heading: section.heading,
								tags: note.tags,
								updated,
							})
						);
					}

					chunks.push(...fileChunks);
					allRules.push(...fileRules);
					vaultChunks += fileChunks.length;
					vaultRules += fileRules.length;
					nextCache.set(cacheKey, {
						mtimeMs: stat.mtimeMs,
						size: stat.size,
						vaultName: vault.name,
						chunks: fileChunks,
						rules: fileRules,
					});
				} catch (readError) {
					// Distinguish "this note could not be read/parsed" from the
					// benign skips above (no tag match, too large, excluded). Without
					// this the IndexStats.error field stayed undefined forever and a
					// user asking "why is this note missing?" got no answer at all.
					skipped++;
					if (!error) {
						const reason = readError instanceof Error ? readError.message : String(readError);
						error = `${relPath}：${reason}`;
					}
				}
			}

			stats.set(vault.id, {
				vaultId: vault.id,
				vaultName: vault.name,
				docs,
				chunks: vaultChunks,
				rules: vaultRules,
				skipped,
				error,
				builtAt: startedAt,
			});
		}

		const rules = mergeRules(allRules);

		const docFreq = new Map<string, number>();
		let totalLength = 0;
		for (const chunk of chunks) {
			totalLength += chunk.length;
			for (const token of chunk.termFreq.keys()) {
				docFreq.set(token, (docFreq.get(token) ?? 0) + 1);
			}
		}

		const ruleDf = new Map<string, number>();
		let ruleTotalLength = 0;
		for (const rule of rules) {
			ruleTotalLength += rule.length;
			for (const token of rule.tf.keys()) {
				ruleDf.set(token, (ruleDf.get(token) ?? 0) + 1);
			}
		}

		this.chunks = chunks;
		this.ruleOccurrences = allRules;
		this.rules = rules;
		this.docFreq = docFreq;
		this.avgLength = chunks.length > 0 ? totalLength / chunks.length : 0;
		this.ruleDf = ruleDf;
		this.ruleAvgLength = rules.length > 0 ? ruleTotalLength / rules.length : 0;
		this.cache = nextCache;
		this.stats = stats;
		this.lastBuiltAt = Date.now();
	}

	search(query: string, options: SearchOptions = {}): SearchResponse {
		const startedAt = Date.now();
		const settings = this.getSettings();
		const limit = Math.max(1, options.limit ?? settings.retrieval.topK);
		const maxChars = Math.max(100, options.maxChars ?? settings.retrieval.maxCharsPerSnippet);
		const minRatio = options.minScoreRatio ?? settings.retrieval.minScoreRatio;
		const perFileLimit = Math.max(1, settings.retrieval.perFileLimit);

		const trimmed = query.trim();
		if (!trimmed || this.chunks.length === 0) {
			return { query, total: 0, tookMs: Date.now() - startedAt, hits: [] };
		}

		const vaultFilter = options.vaults && options.vaults.length > 0 ? new Set(options.vaults.map((v) => v.toLowerCase())) : null;
		const sources = this.resolveSources(options.sources, options.profile);
		const warnings = this.lastWarnings.length > 0 ? [...this.lastWarnings] : undefined;
		const queryTokens = Array.from(new Set(tokenize(trimmed)));
		// Single-letter queries ("C", "R") produce no tokens; fall back to a
		// word-boundary scan so a one-character lookup still works.
		const literal = queryTokens.length === 0 ? this.literalFallback(trimmed) : null;
		if (queryTokens.length === 0 && !literal) {
			return { query, total: 0, tookMs: Date.now() - startedAt, hits: [], warnings };
		}

		const phrase = trimmed.toLowerCase().replace(/\s+/g, "");
		const totalChunks = this.chunks.length;
		const scored: { chunk: Chunk; score: number }[] = [];

		for (const chunk of this.chunks) {
			if (sources) {
				if (!matchesSources(chunk.vaultId, chunk.relPath, sources)) continue;
			} else if (
				vaultFilter &&
				!vaultFilter.has(chunk.vaultId.toLowerCase()) &&
				!vaultFilter.has(chunk.vaultName.toLowerCase())
			) {
				continue;
			}

			let score = 0;
			if (literal) {
				const haystack = `${chunk.title}\n${chunk.heading}\n${chunk.text}`;
				const matches = haystack.match(literal);
				if (!matches) continue;
				score = matches.length;
			} else {
				for (const token of queryTokens) {
					const freq = chunk.termFreq.get(token);
					if (!freq) continue;
					const df = this.docFreq.get(token) ?? 0;
					const idf = Math.log(1 + (totalChunks - df + 0.5) / (df + 0.5));
					const denominator = freq + K1 * (1 - B + (B * chunk.length) / (this.avgLength || 1));
					score += (idf * freq * (K1 + 1)) / denominator;
				}
			}

			if (score <= 0) continue;

			score *= chunk.weight;

			if (!literal && phrase.length >= 2) {
				const haystack = chunk.text.toLowerCase().replace(/\s+/g, "");
				if (haystack.includes(phrase)) score *= 1.4;
				else if (chunk.title.toLowerCase().includes(trimmed.toLowerCase())) score *= 1.2;
			}

			scored.push({ chunk, score });
		}

		scored.sort((a, b) => b.score - a.score || b.chunk.mtime - a.chunk.mtime);

		const threshold = scored.length > 0 ? scored[0].score * Math.max(0, minRatio) : 0;
		const perFile = new Map<string, number>();
		const hits: SearchHit[] = [];

		for (const item of scored) {
			if (hits.length >= limit) break;
			if (item.score < threshold) break;
			const key = `${item.chunk.vaultId}|${item.chunk.relPath}`;
			const used = perFile.get(key) ?? 0;
			if (used >= perFileLimit) continue;
			perFile.set(key, used + 1);
			hits.push({
				vaultId: item.chunk.vaultId,
				vault: item.chunk.vaultName,
				path: item.chunk.relPath,
				title: item.chunk.title,
				heading: item.chunk.heading,
				tags: item.chunk.tags,
				score: Number(item.score.toFixed(4)),
				updated: new Date(item.chunk.mtime).toISOString(),
				excerpt:
					item.chunk.text.length > maxChars
						? `${item.chunk.text.slice(0, maxChars).trimEnd()}\n…`
						: item.chunk.text,
			});
		}

		return { query, total: scored.length, tookMs: Date.now() - startedAt, hits, warnings };
	}

	/**
	 * Builds a word-boundary matcher for very short Latin queries that the
	 * bigram/word tokenizer would otherwise drop.
	 */
	private literalFallback(query: string): RegExp | null {
		if (!/^[A-Za-z0-9_]{1,2}$/.test(query)) return null;
		const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		return new RegExp(`(^|[^A-Za-z0-9_])${escaped}([^A-Za-z0-9_]|$)`, "gi");
	}

	buildContext(
		query: string,
		budget?: number,
		limit?: number,
		sources?: SourceInput[],
		profile?: string
	): ContextResponse {
		const settings = this.getSettings();
		const totalBudget = Math.max(200, budget ?? settings.retrieval.totalCharsBudget);
		const response = this.search(query, {
			limit: limit ?? settings.retrieval.topK,
			maxChars: settings.retrieval.maxCharsPerSnippet,
			sources,
			profile,
		});

		const blocks: string[] = [];
		const format = settings.injection?.format === "plain" ? "plain" : "markdown";
		const separator = format === "plain" ? "\n\n" : "\n\n---\n\n";
		// Reserve room for the header comment and separators so the final
		// Markdown never exceeds the configured budget.
		const reserve = 96;

		for (const hit of response.hits) {
			const meta = [`- 来源：${hit.vault} / ${hit.path}`];
			if (hit.tags.length > 0) meta.push(`- 标签：${hit.tags.join(", ")}`);
			const heading = hit.heading ? `${hit.title} › ${hit.heading}` : hit.title;

			const block = [`### ${heading}`, ...meta, "", hit.excerpt].join("\n");
			const extra = blocks.length > 0 ? separator.length : 0;
			if (reserve + blocks.reduce((sum, item) => sum + item.length, 0) + extra + block.length > totalBudget) {
				if (blocks.length === 0) {
					const room = Math.max(0, totalBudget - reserve);
					if (room > 0) blocks.push(block.slice(0, room));
				}
				break;
			}
			blocks.push(block);
		}

		let markdown = "";
		if (blocks.length > 0) {
			const render = () => {
				const header = `${renderContextHeader(query, blocks.length, format)}\n\n`;
				return `${header}${blocks.join(separator)}`;
			};
			markdown = render();
			// Last-resort guard: drop or trim trailing blocks until it fits.
			while (blocks.length > 0 && markdown.length > totalBudget) {
				const overflow = markdown.length - totalBudget;
				const last = blocks[blocks.length - 1];
				if (last.length > overflow + 8) {
					blocks[blocks.length - 1] = `${last.slice(0, Math.max(0, last.length - overflow - 1)).trimEnd()}…`;
				} else {
					blocks.pop();
				}
				markdown = blocks.length > 0 ? render() : "";
			}
			if (markdown.length > totalBudget) markdown = markdown.slice(0, totalBudget);
		}

		return { query, markdown, used: markdown.length, hits: response.hits, warnings: response.warnings };
	}

	getRules(options: RuleOptions = {}): RuleResponse {
		const startedAt = Date.now();
		const limit = Math.max(1, Math.min(100, options.limit ?? 20));
		const topic = (options.topic ?? "").trim();
		const priority = (options.priority ?? "").toString().trim().toLowerCase();
		const sources = this.resolveSources(options.sources, options.profile);
		const warnings = this.lastWarnings.length > 0 ? [...this.lastWarnings] : undefined;
		let pool = this.ruleOccurrences;
		if (sources) pool = pool.filter((rule) => matchesSources(rule.vaultId, rule.path, sources));
		if (priority === "must" || priority === "should" || priority === "tip") {
			pool = pool.filter((rule) => rule.priority === priority);
		}
		if (topic) {
			pool = pool.filter((rule) => rule.topics.some((item) => item === topic || item.includes(topic) || topic.includes(item)));
		}
		// Scope first so deduplication cannot discard a selected occurrence.
		pool = mergeRules(pool);

		const query = (options.query ?? "").trim();
		const hits: RuleHit[] = [];

		if (query) {
			const tokens = Array.from(new Set(tokenize(query)));
			const total = this.rules.length || 1;
			for (const rule of pool) {
				let score = 0;
				for (const token of tokens) {
					const freq = rule.tf.get(token);
					if (!freq) continue;
					const df = this.ruleDf.get(token) ?? 0;
					const idf = Math.log(1 + (total - df + 0.5) / (df + 0.5));
					const denominator = freq + K1 * (1 - B + (B * rule.length) / (this.ruleAvgLength || 1));
					score += (idf * freq * (K1 + 1)) / denominator;
				}
				if (score <= 0) continue;
				hits.push({ ...publicRule(rule), score: Number((score * priorityWeight(rule.priority)).toFixed(4)) });
			}
			hits.sort((a, b) => b.score - a.score || b.count - a.count);
		} else {
			const order: Record<RulePriority, number> = { must: 0, should: 1, tip: 2 };
			const sorted = pool.slice().sort((a, b) => order[a.priority] - order[b.priority] || b.count - a.count);
			for (const rule of sorted) hits.push({ ...publicRule(rule), score: 0 });
		}

		return { total: hits.length, tookMs: Date.now() - startedAt, rules: hits.slice(0, limit), warnings };
	}

	async buildBrief(options: BriefOptions = {}): Promise<BriefResponse> {
		const budget = Math.max(400, options.budget ?? 4000);
		const limit = Math.max(4, Math.min(60, options.limit ?? 24));

		let stack = (options.stack ?? []).map((item) => item.trim()).filter(Boolean);
		let evidence: string[] = [];
		if (stack.length === 0 && options.projectPath) {
			const resolved = path.resolve(options.projectPath);
			let readable = false;
			try {
				readable = fs.statSync(resolved).isDirectory();
			} catch {
				readable = false;
			}
			if (!readable) {
				// A typo in --project must not silently turn into a generic
				// (near full) convention sheet.
				return {
					stack: [],
					evidence: ["项目路径不可读"],
					markdown: `<!-- obsidian-quote brief | error: unreadable project -->\n\n项目路径不可读：${options.projectPath}`,
					used: 0,
					ruleCount: 0,
					rules: [],
					error: `项目路径不可读：${options.projectPath}`,
				};
			}
			const detected = await detectProjectStack(resolved);
			stack = detected.stack;
			evidence = detected.evidence;
		}
		if (stack.length === 0) stack = ["通用"];

		const topics = stackTopics(stack);
		const knownStack = stack[0] !== "通用";
		const sources = this.resolveSources(options.sources, options.profile);
		const warnings = this.lastWarnings.length > 0 ? [...this.lastWarnings] : undefined;
		// Only label the scope when it actually resolved to something. An unknown
		// profile yields an empty array, and `范围 ${[].join("、")}` used to render
		// the meaningless line "依据：范围 " into the injected markdown.
		if (sources && sources.length > 0) {
			evidence = [
				`范围 ${sources.map((source) => (source.path ? `${source.vaultName}/${source.path}` : source.vaultName)).join("、")}`,
				...evidence,
			];
		}
		const tokens = Array.from(
			new Set(tokenize([...stack, ...topics, "规范", "约定", "命名", "目录", "风格"].join(" ")))
		);
		const total = this.rules.length || 1;
		const scored: RuleHit[] = [];

		const pool = mergeRules(this.ruleOccurrences.filter((rule) => {
			if (sources && !matchesSources(rule.vaultId, rule.path, sources)) return false;
			if (knownStack && isForeignRule(rule, stack)) return false;
			return rule.topics.length === 0 || rule.topics.some((topic) => topics.includes(topic));
		}));
		for (const rule of pool) {

			let score = 0;
			for (const token of tokens) {
				const freq = rule.tf.get(token);
				if (!freq) continue;
				const df = this.ruleDf.get(token) ?? 0;
				const idf = Math.log(1 + (total - df + 0.5) / (df + 0.5));
				const denominator = freq + K1 * (1 - B + (B * rule.length) / (this.ruleAvgLength || 1));
				score += (idf * freq * (K1 + 1)) / denominator;
			}
			const topicBoost = rule.topics.filter((topic) => topics.includes(topic)).length * 0.8;
			const combined = (score + topicBoost) * priorityWeight(rule.priority);
			if (combined <= 0) continue;
			scored.push({ ...publicRule(rule), score: Number(combined.toFixed(4)) });
		}

		scored.sort((a, b) => b.score - a.score);

		const caps: Record<RulePriority, number> = {
			// "必须" is the highest-value tier of a brief: it is the part that is
			// actually binding. Capping it below the total limit meant that a
			// knowledge base with many must-rules silently dropped them in favour
			// of "建议"/"可选" entries (measured: 30 must rules -> only 12 kept,
			// while all 5 should-rules got in). Only the softer tiers are capped.
			must: limit,
			should: Math.ceil(limit * 0.35),
			tip: limit,
		};
		const counts: Record<RulePriority, number> = { must: 0, should: 0, tip: 0 };
		const selected: RuleHit[] = [];
		for (const rule of scored) {
			if (selected.length >= limit) break;
			if (counts[rule.priority] >= caps[rule.priority]) continue;
			counts[rule.priority]++;
			selected.push(rule);
		}

		const brief = composeBrief(stack, evidence, selected, budget);
		return { ...brief, rules: selected, warnings };
	}
}
