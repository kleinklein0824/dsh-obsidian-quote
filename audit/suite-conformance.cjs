const fs = require("node:fs");
const path = require("node:path");
const { core, VA, VB, PROJECT, build, snapshot, sameSnapshot, settings } = require("./helpers.cjs");
const { QuotePlugin, renderQuotePanel, Setting, El } = require("./panel.cjs");

global.window = { setTimeout, clearTimeout };
Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: async () => {} } }, configurable: true });

const app = {
	vault: { adapter: { getBasePath: () => VA } },
	workspace: { onLayoutReady: () => {}, getLeavesOfType: () => [], getRightLeaf: () => null, getLeaf: () => null, revealLeaf: async () => {}, detachLeavesOfType: () => {} },
	setting: { open: () => {}, openTabById: () => {} },
};

module.exports = [
	{
		id: "T096",
		name: "需求1+2：多库登记/选择，默认按需检索而非全量注入",
		severity: "critical",
		run: async () => {
			const { indexer } = await build({});
			const all = indexer.search("必须", { limit: 50 }).hits;
			const onlyB = indexer.search("必须", { vaults: ["vb"], limit: 50 }).hits;
			const ctx = indexer.buildContext("命名");
			const pass = new Set(all.map((h) => h.vault)).size === 2 && onlyB.every((h) => h.vault === "嵌入式库") && ctx.hits.length <= 5 && ctx.markdown.length <= 6000;
			return { pass, detail: `双库命中=${new Set(all.map((h) => h.vault)).size} 单库过滤=${onlyB.length} 默认上下文=${ctx.hits.length}段/${ctx.markdown.length}字符` };
		},
	},
	{
		id: "T097",
		name: "需求3：功能面板保持最小可用，不扩展额外交互",
		severity: "medium",
		run: async () => {
			const p = new QuotePlugin(app, { version: "0.1.0" });
			p.__data = { settings: { vaults: [{ id: "va", name: "Vue规范库", path: VA, enabled: true }], index: { watch: false }, server: { enabled: false, port: 45621, token: "t", host: "127.0.0.1" } } };
			await p.loadSettings();
			p.indexer = new core.VaultIndexer(() => p.settings);
			p.server = new core.QuoteServer(p);
			await p.indexer.build();
			const render = () => {
				Setting.all = [];
				const root = new El("div");
				renderQuotePanel(root, p, { showSettingsLink: true });
				return { root, names: Setting.all.map((s) => s.name) };
			};
			const first = render();
			const minimal =
				!first.names.includes("组合来源") &&
				!first.names.includes("组合名称") &&
				!first.root.allText().includes("引用台账") &&
				!first.root.allText().includes("全部设置");

			const toggle = Setting.all.find((s) => s.name === "显示高级功能");
			await toggle.controls[0].control.toggle(true);
			const second = render();
			const revealed =
				second.names.includes("组合来源") &&
				second.root.allText().includes("引用台账") &&
				second.root.allText().includes("全部设置");
			const pass = minimal && revealed && p.settings.ui.advanced === true;
			return { pass, detail: `默认最小=${minimal} 高级展开=${revealed} 控件数=${first.names.length}/${second.names.length}` };
		},
	},
	{
		id: "T098",
		name: "需求4：知识库只读、harness 源码与配置不被改动",
		severity: "critical",
		run: async () => {
			const beforeA = snapshot(VA);
			const beforeB = snapshot(VB);
			const { indexer } = await build({});
			indexer.search("命名");
			indexer.buildContext("GPIO");
			indexer.getRules({ query: "必须" });
			await indexer.buildBrief({ stack: ["vue"] });
			const untouched = sameSnapshot(beforeA, snapshot(VA)) && sameSnapshot(beforeB, snapshot(VB));
			const harnessFiles = ["AGENTS.md", ".claude/settings.json", ".cursorrules", "CLAUDE.md"].filter((f) => fs.existsSync(path.join(PROJECT, f)));
			const cli = fs.readFileSync(path.join(PROJECT, "harness-skill/scripts/kb.mjs"), "utf8");
			const writes = [...cli.matchAll(/writeFileSync\(([^,]+)/g)].map((m) => m[1]);
			const writesOnlyConfig = writes.every((arg) => arg.includes("CONFIG_PATH"));
			const pass = untouched && harnessFiles.length === 0 && writesOnlyConfig;
			return { pass, detail: `知识库未变=${untouched} harness 配置文件=${harnessFiles.length} CLI 写操作=${writes.join(",") || "无"}` };
		},
	},
	{
		id: "T099",
		name: "需求4：新增能力已写入确认范围，且未实现未批准功能",
		severity: "medium",
		run: async () => {
			const idea = fs.readFileSync(path.join(PROJECT, "idea.md"), "utf8");
			const readme = fs.readFileSync(path.join(PROJECT, "README.md"), "utf8");
			const approved = ["规范条款", "项目规范摘要", "引用台账", "引用组合", "注入格式"].filter((name) => idea.includes(name));
			const documented = ["规范条款", "项目规范摘要", "引用台账"].filter((name) => readme.includes(name));
			const hasSection = /增补能力/.test(idea);
			const srcDir = path.join(PROJECT, "plugin/src");
			const source = fs.readdirSync(srcDir).map((file) => fs.readFileSync(path.join(srcDir, file), "utf8")).join("\n");
			const unapproved = /知识图谱|knowledge.?graph|自动笔记生成/.test(source);
			const pass = approved.length === 5 && documented.length === 3 && hasSection && !unapproved;
			return {
				pass,
				detail: `idea.md 确认能力=${approved.length}/5 增补章节=${hasSection} README 记录=${documented.length}/3 未批准功能实现=${unapproved}`,
			};
		},
	},
	{
		id: "T100",
		name: "需求5：未明确参数可配置，注入时机与格式不写死",
		severity: "medium",
		run: async () => {
			const s = settings({});
			const configurable = ["topK", "maxCharsPerSnippet", "totalCharsBudget", "perFileLimit", "minScoreRatio"].every((key) => typeof s.retrieval[key] === "number") && typeof s.index.refreshSeconds === "number" && typeof s.index.maxFileSizeKB === "number";
			const context = fs.readFileSync(path.join(PROJECT, "plugin/src/indexer.ts"), "utf8");
			const brief = fs.readFileSync(path.join(PROJECT, "plugin/src/brief.ts"), "utf8");
			const hardcodedFormat = context.includes("<!-- obsidian-quote: query=") && brief.includes("## 必须");
			const timingConfig = Object.keys(s).some((key) => /inject|format|timing/i.test(key));
			return { pass: configurable && !hardcodedFormat && timingConfig, detail: `篇幅参数可配=${configurable} 上下文格式硬编码=${hardcodedFormat} 注入时机/格式配置项=${timingConfig}` };
		},
	},
];
