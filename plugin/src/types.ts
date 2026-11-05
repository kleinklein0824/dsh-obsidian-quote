export interface VaultEntry {
	/** Stable id derived from the absolute path. */
	id: string;
	name: string;
	/** Absolute path to the vault root. */
	path: string;
	enabled: boolean;
}

export interface ScopeSettings {
	/** Relative folders to include. Empty means the whole vault. */
	includeFolders: string[];
	/** Relative folders to skip. */
	excludeFolders: string[];
	/** A note must carry at least one of these tags. Empty means no tag filter. */
	requiredTags: string[];
}

export interface RetrievalSettings {
	/** Max number of snippets returned per query. */
	topK: number;
	/** Max characters per snippet. */
	maxCharsPerSnippet: number;
	/** Max characters of the whole assembled context block. */
	totalCharsBudget: number;
	/** Max snippets taken from a single note. */
	perFileLimit: number;
	/** Relative score cut-off against the best hit (0 - 1). */
	minScoreRatio: number;
}

export interface ServerSettings {
	enabled: boolean;
	host: string;
	port: number;
	token: string;
}

export interface IndexSettings {
	/** Rebuild the index in the background when it is older than this. */
	refreshSeconds: number;
	/** Skip markdown files larger than this. */
	maxFileSizeKB: number;
	/** Watch vault folders and rebuild incrementally when notes change. */
	watch: boolean;
}

export interface UiSettings {
	/** Reveal profiles, the citation ledger and advanced controls. */
	advanced: boolean;
	/** Register the currently open vault when the vault list is still empty. */
	autoRegisterCurrentVault: boolean;
}

export interface InjectionSettings {
	/** How assembled context is framed for the harness. */
	format: "markdown" | "plain";
	/** Advisory hint exposed via /health so the harness can decide when to pull. */
	timing: "manual" | "brief-first";
}

export interface QuoteSettings {
	vaults: VaultEntry[];
	scope: ScopeSettings;
	retrieval: RetrievalSettings;
	server: ServerSettings;
	index: IndexSettings;
	ui: UiSettings;
	injection: InjectionSettings;
	/** Named, reusable source sets (multiple vaults and/or subfolders). */
	profiles: Profile[];
}

/** A source selector: a vault (id or name) plus an optional subfolder. */
export interface SourceInput {
	vault: string;
	vaultId?: string;
	path?: string;
}

export interface Profile {
	id: string;
	name: string;
	sources: SourceInput[];
}

export interface Chunk {
	vaultId: string;
	vaultName: string;
	relPath: string;
	title: string;
	heading: string;
	text: string;
	tags: string[];
	mtime: number;
	/** Weighted token count, used by BM25 length normalisation. */
	length: number;
	/** Prior in (0, 1] that damps navigational snippets (link lists, stubs). */
	weight: number;
	termFreq: Map<string, number>;
}

export interface IndexStats {
	vaultId: string;
	vaultName: string;
	docs: number;
	chunks: number;
	rules: number;
	skipped: number;
	error?: string;
	builtAt: number;
}

export interface SearchHit {
	vaultId: string;
	vault: string;
	path: string;
	title: string;
	heading: string;
	tags: string[];
	score: number;
	updated: string;
	excerpt: string;
}

export interface SearchResponse {
	query: string;
	total: number;
	tookMs: number;
	hits: SearchHit[];
	/** Non-fatal problems such as an ambiguous source name. */
	warnings?: string[];
}

export interface ContextResponse {
	query: string;
	markdown: string;
	used: number;
	hits: SearchHit[];
	warnings?: string[];
}

export interface SearchOptions {
	limit?: number;
	maxChars?: number;
	/** Vault ids or vault names. */
	vaults?: string[];
	/** Pick specific vaults/subfolders; merged in one result set. */
	sources?: SourceInput[];
	/** Name or id of a stored profile. */
	profile?: string;
	minScoreRatio?: number;
}

export interface HostStatus {
	version: string;
	vaults: { id: string; name: string; path: string; enabled: boolean; docs: number; chunks: number; rules: number; error?: string }[];
	totalDocs: number;
	totalChunks: number;
	totalRules: number;
	indexing: boolean;
	lastBuiltAt: number;
	server: { running: boolean; url: string; port: number };
	settings: QuoteSettings;
}

export type RulePriority = "must" | "should" | "tip";

/** A normative sentence lifted from a note, e.g. "组件名必须使用 PascalCase". */
export interface Rule {
	id: string;
	text: string;
	priority: RulePriority;
	topics: string[];
	code: string[];
	tags: string[];
	vaultId: string;
	vault: string;
	path: string;
	heading: string;
	updated: string;
	/** Number of notes that state the same rule. */
	count: number;
}

export interface RuleHit extends Rule {
	score: number;
}

export interface RuleOptions {
	query?: string;
	topic?: string;
	priority?: RulePriority;
	limit?: number;
	sources?: SourceInput[];
	profile?: string;
}

export interface RuleResponse {
	total: number;
	tookMs: number;
	rules: RuleHit[];
	warnings?: string[];
}

export interface BriefOptions {
	/** Local project folder used to infer the tech stack (read-only scan). */
	projectPath?: string;
	/** Explicit stack tags, skips detection when provided. */
	stack?: string[];
	budget?: number;
	limit?: number;
	sources?: SourceInput[];
	profile?: string;
}

export interface BriefResponse {
	stack: string[];
	evidence: string[];
	markdown: string;
	used: number;
	ruleCount: number;
	rules: RuleHit[];
	/** Set when the request could not be honoured, e.g. an unreadable project path. */
	error?: string;
	warnings?: string[];
}

export interface CitationRecord {
	at: number;
	kind: string;
	query: string;
	hits: number;
	top: { vault: string; path: string; title: string }[];
}

export interface NoteStat {
	vault: string;
	path: string;
	title: string;
	count: number;
	lastAt: number;
}

export interface StatsResponse {
	totalQueries: number;
	totalCitations: number;
	topNotes: NoteStat[];
	recent: CitationRecord[];
}
