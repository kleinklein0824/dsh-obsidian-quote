const fs = require("node:fs");
const path = require("node:path");
const core = require("./core.cjs");
const { build, makeVault, settings, TMP } = require("./helpers.cjs");

const ctx = { vaultId: "x", vault: "x", path: "x.md", heading: "命名", tags: ["规范"], updated: "" };

module.exports = [
	{
		id: "T062",
		name: "条款按必须/建议/避免分级",
		severity: "high",
		run: async () => {
			const rules = core.extractRules("组件名必须使用 PascalCase。\n命名应该保持简短。\n避免使用 index.vue。\n", ctx);
			const map = Object.fromEntries(rules.map((r) => [r.priority, r.text]));
			const pass = rules.length === 3 && map.must && map.should && map.tip;
			return { pass, detail: rules.map((r) => `${r.priority}:${r.text}`).join(" | ") };
		},
	},
	{
		id: "T063",
		name: "导航/来源类噪声句不进入条款",
		severity: "medium",
		run: async () => {
			const rules = core.extractRules("[[a]] [[b]]\n来源：某处\n目录\n一句话：必须这样做\n", ctx);
			return { pass: rules.length === 0, detail: rules.map((r) => r.text).join(" | ") || "全部过滤" };
		},
	},
	{
		id: "T064",
		name: "跨笔记同述条款合并并计数",
		severity: "medium",
		run: async () => {
			const dir = makeVault("dedupe", {
				"a.md": "# A\n\n组件名必须使用 PascalCase。\n",
				"b.md": "# B\n\n组件名必须使用 PascalCase。\n",
			});
			const s = settings({ vaults: [{ id: "dd", name: "dedupe", path: dir, enabled: true }] });
			const indexer = new core.VaultIndexer(() => s);
			await indexer.build();
			const rules = indexer.getRules({ query: "PascalCase", limit: 10 }).rules;
			const pass = rules.length === 1 && rules[0].count === 2;
			return { pass, detail: rules.map((r) => `${r.id} count=${r.count}`).join(" | ") };
		},
	},
	{
		id: "T065",
		name: "条款编号对相同文本稳定，保留代码差异",
		severity: "high",
		run: async () => {
			const a = core.ruleId("组件文件必须使用 PascalCase，例如 `UserCard.vue`。");
			const b = core.ruleId("组件文件必须使用 PascalCase，例如 `UserCard.vue`。");
			const different = core.ruleId("组件文件必须使用 PascalCase，例如 `usercard.vue`。");
			return { pass: a === b && a !== different && /^R-[0-9A-F]{16}$/.test(a), detail: `${a} vs ${b}; code change=${different}` };
		},
	},
	{
		id: "T066",
		name: "单章节条款数量上限生效",
		severity: "low",
		run: async () => {
			const text = Array.from({ length: 100 }, (_, i) => `- 第 ${i} 条规范必须遵守编号 ${i}。`).join("\n");
			const rules = core.extractRules(text, ctx);
			return { pass: rules.length === 60, detail: `100 行提取 ${rules.length} 条（上限 60）` };
		},
	},
	{
		id: "T067",
		name: "主题过滤支持用户自然写法",
		severity: "low",
		run: async () => {
			const { indexer } = await build({});
			const exact = indexer.getRules({ topic: "命名" }).total;
			const natural = indexer.getRules({ topic: "命名规范" }).total;
			return { pass: natural > 0, detail: `topic=命名 → ${exact} 条；topic=命名规范 → ${natural} 条（精确匹配，无提示）` };
		},
	},
	{
		id: "T068",
		name: "非法级别参数应报错或归一化",
		severity: "medium",
		run: async () => {
			const { indexer } = await build({});
			const upper = indexer.getRules({ priority: "MUST" }).total;
			const lower = indexer.getRules({ priority: "must" }).total;
			return { pass: upper === lower && lower > 0, detail: `priority=MUST → ${upper} 条；must → ${lower} 条（大写被静默当作无匹配）` };
		},
	},
	{
		id: "T069",
		name: "项目技术栈可自动识别并给出依据",
		severity: "high",
		run: async () => {
			const project = path.join(TMP, "proj");
			const detected = await core.detectProjectStack(project);
			const { indexer } = await build({});
			const brief = await indexer.buildBrief({ projectPath: project });
			const pass = detected.stack.includes("vue") && detected.stack.includes("typescript") && brief.stack.includes("vue") && brief.evidence.some((e) => e.includes("package.json"));
			return { pass, detail: `stack=${detected.stack.join(",")} evidence=${detected.evidence.join("；")}` };
		},
	},
	{
		id: "T070",
		name: "规范摘要过滤异域技术栈条款",
		severity: "high",
		run: async () => {
			const { indexer } = await build({});
			const brief = await indexer.buildBrief({ stack: ["embedded"], limit: 40 });
			const paths = [...new Set(brief.rules.map((r) => r.path))];
			const leaked = brief.rules.filter((r) => r.text.includes("类名必须使用 kebab-case") || r.path === "00-规范/03-样式约定.md");
			return { pass: leaked.length === 0, detail: `embedded 摘要仍包含 ${leaked.length} 条 Vue/CSS 条款；路径=${paths.join(",")}` };
		},
	},
	{
		id: "T101",
		name: "否定式规范（不建议/不推荐/不要/切勿）不得升级为 must/should",
		severity: "high",
		run: async () => {
			const cases = [
				["不建议使用 var，统一用 const。", "tip"],
				["不推荐使用 var。", "tip"],
				["不要使用 var。", "tip"],
				["切勿使用 any。", "tip"],
				["禁止使用 any。", "must"],
				["应该使用 const。", "should"],
			];
			const out = [];
			for (const [text, want] of cases) {
				const rules = core.extractRules(text, ctx);
				out.push([text, rules[0] ? rules[0].priority : "none", want]);
			}
			const bad = out.filter(([, got, want]) => got !== want);
			return {
				pass: bad.length === 0,
				detail: out.map(([t, g, w]) => `${t}->${g}${g === w ? "" : `(want ${w})`}`).join(" | "),
			};
		},
	},
	{
		id: "T102",
		name: "重复重建不会累加条款同述计数",
		severity: "high",
		run: async () => {
			const dir = makeVault("rebuild", {
				"a.md": "# A\n\n必须使用 kebab-case 命名。\n",
				"b.md": "# B\n\n必须使用 kebab-case 命名。\n",
			});
			const s = settings({ vaults: [{ id: "rb", name: "rebuild", path: dir, enabled: true }] });
			const indexer = new core.VaultIndexer(() => s);
			const counts = [];
			for (let i = 0; i < 4; i++) {
				await indexer.build();
				const rules = indexer.getRules({ query: "kebab-case", limit: 10 }).rules;
				counts.push(rules[0] ? rules[0].count : 0);
			}
			const pass = counts.every((count) => count === 2);
			return { pass, detail: `重建计数序列=${counts.join(",")}（应恒为 2）` };
		},
	},
	{
		id: "T103",
		name: "摘要「必须」档不被「建议」档挤占",
		severity: "high",
		run: async () => {
			const must = Array.from({ length: 30 }, (_, i) => `必须遵循规范条目第${i}号。`).join("\n");
			const should = Array.from({ length: 5 }, (_, i) => `应该遵循建议条目第${i}号。`).join("\n");
			const dir = makeVault("quota", {
				"must.md": `# 编码规范\n\n${must}\n`,
				"should.md": `# 编码规范\n\n${should}\n`,
			});
			const s = settings({ vaults: [{ id: "q", name: "quota", path: dir, enabled: true }] });
			const indexer = new core.VaultIndexer(() => s);
			await indexer.build();
			const brief = await indexer.buildBrief({ limit: 24, budget: 20000 });
			const keptMust = brief.rules.filter((r) => r.priority === "must").length;
			// Before the fix the must tier was capped at ceil(limit * 0.5) = 12
			// while every should-rule got in, so 18 of 30 binding rules dropped.
			const pass = keptMust >= 24;
			const keptShould = brief.rules.filter((r) => r.priority === "should").length;
			return { pass, detail: `limit=24 时保留 must ${keptMust}/30，should ${keptShould}/5` };
		},
	},
	{
		id: "T104",
		name: "未知 profile 返回空结果并给出警告",
		severity: "medium",
		run: async () => {
			const { indexer } = await build({});
			const res = indexer.search("命名", { profile: "不存在的组合" });
			const empty = res.total === 0;
			const warned = (res.warnings || []).some((w) => w.includes("不存在的组合"));
			return { pass: empty && warned, detail: `total=${res.total} warnings=${JSON.stringify(res.warnings || [])}` };
		},
	},
	{
		id: "T105",
		name: "知识库路径不可用时报出具体原因",
		severity: "medium",
		run: async () => {
			const dir = makeVault("badpath", { "a.md": "# A\n\n必须遵守规范。\n" });
			const file = path.join(dir, "not-a-dir.md");
			fs.writeFileSync(file, "# nope\n", "utf8");
			const s = settings({ vaults: [{ id: "bp", name: "badpath", path: file, enabled: true }] });
			const indexer = new core.VaultIndexer(() => s);
			await indexer.build();
			const stat = indexer.statsFor("bp") || {};
			const pass = typeof stat.error === "string" && stat.error.length > 0;
			return { pass, detail: `error=${JSON.stringify(stat.error)}` };
		},
	},
	{
		id: "T071",
		name: "摘要预算与无效项目路径处理正确",
		severity: "high",
		run: async () => {
			const { indexer } = await build({});
			const tight = await indexer.buildBrief({ stack: ["vue"], budget: 400 });
			const bad = await indexer.buildBrief({ projectPath: "Z:/definitely-not-here" });
			const budgetOk = tight.markdown.length <= 400;
			const badOk = bad.ruleCount === 0 || bad.stack[0] !== "通用";
			return { pass: budgetOk && badOk, detail: `budget=400 实际 ${tight.markdown.length} 字符；无效项目 → stack=${bad.stack.join(",")} rules=${bad.ruleCount}` };
		},
	},
];
