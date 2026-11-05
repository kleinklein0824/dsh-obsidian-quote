import * as fs from "fs";
import * as path from "path";
import { GROUP_TITLES } from "./format";
import type { BriefResponse, RuleHit } from "./types";

const SKIP_DIRS = new Set([
	"node_modules",
	".git",
	".svn",
	".hg",
	"dist",
	"build",
	"out",
	".next",
	".nuxt",
	".output",
	"target",
	"venv",
	".venv",
	"__pycache__",
	".idea",
	".vscode",
	"coverage",
	".cache",
	".turbo",
]);

const DEP_STACKS: Record<string, string[]> = {
	vue: ["vue"],
	nuxt: ["nuxt", "vue"],
	react: ["react"],
	"react-dom": ["react"],
	next: ["next", "react"],
	svelte: ["svelte"],
	typescript: ["typescript"],
	vite: ["vite"],
	webpack: ["webpack"],
	tailwindcss: ["tailwind"],
	sass: ["css"],
	less: ["css"],
	pinia: ["vue", "state"],
	vuex: ["vue", "state"],
	redux: ["react", "state"],
	"@nestjs/core": ["node"],
	express: ["node"],
	koa: ["node"],
	fastify: ["node"],
	antd: ["react"],
	"element-plus": ["vue"],
	"ant-design-vue": ["vue"],
	vitest: ["testing"],
	jest: ["testing"],
};

const CONFIG_STACKS: { pattern: RegExp; stack: string[] }[] = [
	{ pattern: /^tsconfig.*\.json$/i, stack: ["typescript"] },
	{ pattern: /^vite\.config\./i, stack: ["vite"] },
	{ pattern: /^next\.config\./i, stack: ["next", "react"] },
	{ pattern: /^nuxt\.config\./i, stack: ["nuxt", "vue"] },
	{ pattern: /^tailwind\.config\./i, stack: ["tailwind"] },
	{ pattern: /^eslint\.config\.|^\.eslintrc/i, stack: ["eslint"] },
	{ pattern: /^pyproject\.toml$|^requirements\.txt$|^setup\.py$/i, stack: ["python"] },
	{ pattern: /^go\.mod$/i, stack: ["go"] },
	{ pattern: /^Cargo\.toml$/i, stack: ["rust"] },
	{ pattern: /^pom\.xml$|^build\.gradle/i, stack: ["java"] },
	{ pattern: /^platformio\.ini$/i, stack: ["embedded"] },
	{ pattern: /\.uvprojx$|\.ioc$/i, stack: ["embedded"] },
];

const EXT_STACKS: Record<string, { stack: string[]; min: number }> = {
	".vue": { stack: ["vue"], min: 1 },
	".tsx": { stack: ["react", "typescript"], min: 1 },
	".jsx": { stack: ["react"], min: 1 },
	".ts": { stack: ["typescript"], min: 3 },
	".js": { stack: ["javascript"], min: 3 },
	".py": { stack: ["python"], min: 1 },
	".c": { stack: ["c"], min: 3 },
	".h": { stack: ["c"], min: 3 },
	".cpp": { stack: ["cpp"], min: 1 },
	".ino": { stack: ["embedded"], min: 1 },
	".go": { stack: ["go"], min: 1 },
	".rs": { stack: ["rust"], min: 1 },
	".java": { stack: ["java"], min: 1 },
	".css": { stack: ["css"], min: 3 },
	".scss": { stack: ["css"], min: 1 },
};

const STACK_TOPICS: Record<string, string[]> = {	vue: ["组件", "样式", "状态管理", "目录结构", "命名", "类型"],
	nuxt: ["组件", "目录结构", "样式", "状态管理"],
	react: ["组件", "状态管理", "目录结构", "命名", "类型"],
	next: ["目录结构", "组件", "样式", "性能"],
	svelte: ["组件", "样式", "状态管理"],
	typescript: ["类型", "命名", "注释"],
	javascript: ["命名", "注释", "错误处理", "格式"],
	node: ["接口", "错误处理", "配置", "日志"],
	python: ["命名", "注释", "错误处理", "测试"],
	embedded: ["命名", "注释", "配置", "错误处理"],
	c: ["命名", "注释", "错误处理"],
	cpp: ["命名", "注释", "错误处理"],
	rust: ["命名", "注释", "错误处理", "测试"],
	go: ["命名", "注释", "错误处理", "测试"],
	java: ["命名", "注释", "错误处理", "测试"],
	css: ["样式", "命名"],
	tailwind: ["样式"],
	vite: ["配置", "目录结构"],
	webpack: ["配置", "目录结构"],
	eslint: ["格式", "命名"],
	testing: ["测试"],
	state: ["状态管理"],
};

const MAX_ENTRIES = 600;

/** Strong domain markers used to drop off-stack rules from a brief. */
const DOMAIN_HINTS: { stack: string; pattern: RegExp }[] = [
	{ stack: "vue", pattern: /(vue|pinia|vuex|element-plus|elementplus)/i },
	{ stack: "react", pattern: /(react|jsx|redux)/i },
	{ stack: "next", pattern: /next\.?js/i },
	{ stack: "embedded", pattern: /(stm32|gpio|单片机|寄存器|中断|串口|定时器|外设|keil|mdk|固件库)/i },
	{ stack: "python", pattern: /(python|django|flask|pip install)/i },
	{ stack: "rust", pattern: /(rust|cargo)/i },
	{ stack: "go", pattern: /(golang|goroutine|go\.mod)/i },
	{ stack: "java", pattern: /(java|spring boot|maven|gradle)/i },
	{ stack: "vite", pattern: /\bvite\b/i },
	{ stack: "tailwind", pattern: /tailwind/i },
];

/** Stacks that legitimately consume CSS/styling conventions. */
const WEB_STACKS = new Set(["vue", "nuxt", "react", "next", "svelte", "css", "tailwind", "vite", "html"]);

export function isForeignRule(
	rule: { text: string; heading: string; path: string; tags: string[] },
	stack: string[]
): boolean {
	const known = new Set(stack);
	const haystack = `${rule.text} ${rule.heading} ${rule.path} ${rule.tags.join(" ")}`;
	// Styling rules are only relevant to stacks that actually ship a UI layer.
	// Topic overlap alone (e.g. "命名") used to let CSS rules into an embedded
	// brief, so check the vocabulary directly.
	const allowCss = Array.from(known).some((item) => WEB_STACKS.has(item));
	if (!allowCss && /(kebab-case|类名|scss|tailwind|样式表|颜色值|背景色|var\(--)/i.test(haystack)) {
		return true;
	}
	return DOMAIN_HINTS.some((hint) => !known.has(hint.stack) && hint.pattern.test(haystack));
}

function addStack(target: string[], values: string[]): void {
	for (const value of values) {
		if (!target.includes(value)) target.push(value);
	}
}

async function applyPackageJson(
	file: string,
	label: string,
	stack: string[],
	evidence: string[]
): Promise<void> {
	try {
		const raw = await fs.promises.readFile(file, "utf8");
		const parsed = JSON.parse(raw) as {
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		};
		const names = Object.keys({ ...(parsed.dependencies ?? {}), ...(parsed.devDependencies ?? {}) });
		const detected: string[] = [];
		for (const name of names) {
			const mapped = DEP_STACKS[name];
			if (mapped) addStack(detected, mapped);
		}
		if (detected.length > 0) {
			addStack(stack, detected);
			if (evidence.length < 2) evidence.push(`${label}：${detected.slice(0, 4).join("、")}`);
		}
	} catch {
		evidence.push(`${label} 无法解析`);
	}
}

/** Infers the stack from a local project folder. Read-only, depth 2, capped. */
export async function detectProjectStack(projectPath: string): Promise<{ stack: string[]; evidence: string[] }> {
	const stack: string[] = [];
	const evidence: string[] = [];
	const root = path.resolve(projectPath);

	let rootEntries: fs.Dirent[];
	try {
		rootEntries = await fs.promises.readdir(root, { withFileTypes: true });
	} catch {
		return { stack, evidence: ["项目路径不可读"] };
	}

	const packageJson = rootEntries.find((entry) => entry.isFile() && entry.name === "package.json");
	if (packageJson) {
		await applyPackageJson(path.join(root, "package.json"), "package.json", stack, evidence);
	}

	const configs: string[] = [];
	for (const entry of rootEntries) {
		if (!entry.isFile()) continue;
		for (const rule of CONFIG_STACKS) {
			if (rule.pattern.test(entry.name)) {
				addStack(stack, rule.stack);
				configs.push(entry.name);
				break;
			}
		}
	}
	if (configs.length > 0) evidence.push(`配置文件：${configs.slice(0, 4).join("、")}`);

	const counts = new Map<string, number>();
	let scanned = 0;
	const scanDir = async (dir: string, depth: number): Promise<void> => {
		if (scanned > MAX_ENTRIES || depth > 2) return;
		let entries: fs.Dirent[];
		try {
			entries = await fs.promises.readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			scanned++;
			if (scanned > MAX_ENTRIES) return;
			if (entry.isDirectory()) {
				if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name.toLowerCase())) continue;
				await scanDir(path.join(dir, entry.name), depth + 1);
			} else if (entry.isFile()) {
				if (entry.name === "package.json" && depth >= 1 && depth <= 2) {
					const label = path.relative(root, path.join(dir, entry.name)).replace(/\\/g, "/");
					await applyPackageJson(path.join(dir, entry.name), label, stack, evidence);
					continue;
				}
				const ext = path.extname(entry.name).toLowerCase();
				if (EXT_STACKS[ext]) counts.set(ext, (counts.get(ext) ?? 0) + 1);
			}
		}
	};
	await scanDir(root, 0);

	const byExt: string[] = [];
	for (const [ext, count] of counts) {
		const rule = EXT_STACKS[ext];
		if (count >= rule.min) {
			addStack(stack, rule.stack);
			if (!byExt.some((item) => item.startsWith(ext))) byExt.push(`${count} 个 ${ext}`);
		}
	}
	if (byExt.length > 0) evidence.push(byExt.slice(0, 4).join("，"));

	return { stack: stack.slice(0, 8), evidence };
}

export function stackTopics(stack: string[]): string[] {
	const topics: string[] = ["命名", "目录结构", "注释", "格式"];
	for (const item of stack) {
		addStack(topics, STACK_TOPICS[item] ?? []);
	}
	return topics;
}

function ruleLine(rule: RuleHit): string {
	const suffix = rule.count > 1 ? `（${rule.count} 篇同述）` : "";
	return `- \`${rule.id}\` ${rule.text}${suffix} — ${rule.path}`;
}

/** Assembles a budget-limited convention sheet from ranked rules. */
export function composeBrief(
	stack: string[],
	evidence: string[],
	rules: RuleHit[],
	budget: number
): Omit<BriefResponse, "rules"> {
	const header: string[] = [
		`<!-- obsidian-quote brief | stack: ${stack.join(", ") || "unknown"} | rules: ${rules.length} -->`,
		"## 适用范围",
		stack.length > 0 ? stack.join("、") : "未识别技术栈（可显式指定 stack）",
	];
	if (evidence.length > 0) header.push(`依据：${evidence.slice(0, 3).join("；")}`);

	const footer = "> 只读引用自本地 Obsidian 知识库；与项目既有配置冲突时，以项目配置为准。";

	const groups: { title: string; priority: RuleHit["priority"] }[] = [
		{ title: GROUP_TITLES.must, priority: "must" },
		{ title: GROUP_TITLES.should, priority: "should" },
		{ title: GROUP_TITLES.tip, priority: "tip" },
	];

	const body: string[] = [];
	let used = header.join("\n").length + 2 + footer.length;
	let emitted = 0;

	for (const group of groups) {
		const items = rules.filter((rule) => rule.priority === group.priority);
		if (items.length === 0) continue;
		const groupLines: string[] = [];
		let groupUsed = group.title.length + 2;
		for (const rule of items) {
			const line = ruleLine(rule);
			if (used + groupUsed + line.length + 1 > budget) break;
			groupLines.push(line);
			groupUsed += line.length + 1;
		}
		if (groupLines.length > 0) {
			body.push("", group.title, ...groupLines);
			used += groupUsed;
			emitted += groupLines.length;
		}
	}

	if (emitted === 0) {
		const message = "知识库中暂未提取到可执行条款，可改用检索片段（search / context）。";
		body.push("", message);
		used += message.length + 2;
	}

	let markdown = [...header, ...body, "", footer].join("\n");
	if (markdown.length > budget) markdown = markdown.slice(0, budget);

	return { stack, evidence, markdown, used: markdown.length, ruleCount: emitted };
}
