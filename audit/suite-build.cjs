const fs = require("node:fs");
const path = require("node:path");
const { PLUGIN, PROJECT, runNpm } = require("./helpers.cjs");

const read = (rel) => fs.readFileSync(path.join(PROJECT, rel), "utf8");

module.exports = [
	{
		id: "T001",
		name: "TypeScript 严格模式类型检查通过",
		severity: "high",
		run: async () => {
			const r = await runNpm("typecheck");
			return { pass: r.code === 0, detail: r.code === 0 ? "tsc --noEmit 退出码 0" : r.out.slice(-400) };
		},
	},
	{
		id: "T002",
		name: "生产构建产出可安装的 main.js",
		severity: "high",
		run: async () => {
			const r = await runNpm("build");
			const file = path.join(PLUGIN, "main.js");
			const exists = fs.existsSync(file);
			const size = exists ? fs.statSync(file).size : 0;
			return { pass: r.code === 0 && exists && size > 10000, detail: `exit=${r.code} main.js=${size}B` };
		},
	},
	{
		id: "T003",
		name: "构建产物不落后于源码",
		severity: "high",
		run: async () => {
			const artifact = fs.statSync(path.join(PLUGIN, "main.js")).mtimeMs;
			const srcDir = path.join(PLUGIN, "src");
			const newest = Math.max(...fs.readdirSync(srcDir).map((f) => fs.statSync(path.join(srcDir, f)).mtimeMs));
			return { pass: artifact >= newest, detail: `main.js=${new Date(artifact).toISOString()} src=${new Date(newest).toISOString()}` };
		},
	},
	{
		id: "T004",
		name: "manifest.json 具备 Obsidian 必需字段",
		severity: "high",
		run: async () => {
			const m = JSON.parse(read("plugin/manifest.json"));
			const required = ["id", "name", "version", "minAppVersion", "description", "author"];
			const missing = required.filter((key) => typeof m[key] !== "string" || !m[key]);
			return { pass: missing.length === 0, detail: missing.length ? `缺少 ${missing.join(",")}` : JSON.stringify(m) };
		},
	},
	{
		id: "T005",
		name: "manifest id 与插件常量一致",
		severity: "medium",
		run: async () => {
			const constants = read("plugin/src/constants.ts");
			const id = /PLUGIN_ID\s*=\s*"([^"]+)"/.exec(constants)[1];
			const view = /VIEW_TYPE\s*=\s*"([^"]+)"/.exec(constants)[1];
			const m = JSON.parse(read("plugin/manifest.json"));
			const panel = read("plugin/src/panel.ts");
			return { pass: m.id === id && panel.includes(view), detail: `manifest=${m.id} constant=${id} view=${view}` };
		},
	},
	{
		id: "T006",
		name: "仅桌面端声明与实现一致",
		severity: "medium",
		run: async () => {
			const m = JSON.parse(read("plugin/manifest.json"));
			const usesFs = /from "fs"/.test(read("plugin/src/indexer.ts")) && /createServer/.test(read("plugin/src/server.ts"));
			return { pass: m.isDesktopOnly === true && usesFs, detail: `isDesktopOnly=${m.isDesktopOnly} 使用 fs/http=${usesFs}` };
		},
	},
	{
		id: "T007",
		name: "面板使用的样式类都有定义",
		severity: "low",
		run: async () => {
			const panel = read("plugin/src/panel.ts");
			const css = read("plugin/styles.css");
			const classes = [...new Set([...panel.matchAll(/oq-[a-z-]+/g)].map((m) => m[0]))];
			const missing = classes.filter((cls) => !css.includes(`.${cls}`));
			return { pass: missing.length === 0, detail: missing.length ? `缺少 ${missing.join(",")}` : `${classes.length} 个类全部有样式` };
		},
	},
	{
		id: "T008",
		name: "README 记录全部可配置默认值且与代码一致",
		severity: "medium",
		run: async () => {
			const readme = read("README.md");
			const expected = {
				topK: "5",
				maxCharsPerSnippet: "1200",
				totalCharsBudget: "6000",
				perFileLimit: "3",
				minScoreRatio: "0.2",
				port: "43117",
				host: "127.0.0.1",
				refreshSeconds: "120",
				maxFileSizeKB: "512",
			};
			const missing = Object.entries(expected).filter(([key, value]) => !readme.includes(key) || !readme.includes(value)).map(([key]) => key);
			return { pass: missing.length === 0, detail: missing.length ? `README 缺少 ${missing.join(",")}` : "9 项参数均有说明" };
		},
	},
	{
		id: "T009",
		name: "插件无运行时 npm 依赖（可单文件安装）",
		severity: "medium",
		run: async () => {
			const pkg = JSON.parse(read("plugin/package.json"));
			const deps = Object.keys(pkg.dependencies || {});
			return { pass: deps.length === 0, detail: deps.length ? `存在依赖 ${deps.join(",")}` : "仅 devDependencies" };
		},
	},
	{
		id: "T010",
		name: "仓库内存在可重复执行的自动化测试",
		severity: "medium",
		run: async () => {
			const pkg = JSON.parse(read("plugin/package.json"));
			const files = fs.readdirSync(PROJECT, { recursive: true }).map(String).filter((f) => /\.(test|spec)\.(ts|js|mjs|cjs)$/.test(f));
			const hasScript = Boolean(pkg.scripts && pkg.scripts.test);
			return { pass: hasScript || files.length > 0, detail: `test script=${hasScript} 测试文件=${files.length}（README 的“已验证”无对应资产）` };
		},
	},
];
