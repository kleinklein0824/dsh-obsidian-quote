const core = require("./core.cjs");
const { build, makeVault, settings } = require("./helpers.cjs");

module.exports = [
	{
		id: "T043",
		name: "中文按二元组匹配，无需分词词典",
		severity: "critical",
		run: async () => {
			const { indexer } = await build({});
			const hits = indexer.search("命名规范", { limit: 3 }).hits;
			const pass = hits.length > 0 && hits[0].path === "00-规范/01-组件命名规范.md";
			return { pass, detail: hits.map((h) => `${h.path}#${h.heading}`).join(" | ") };
		},
	},
	{
		id: "T044",
		name: "英文标识符（下划线）保持完整并可命中",
		severity: "high",
		run: async () => {
			const { indexer } = await build({});
			const hits = indexer.search("GPIO_Init").hits;
			return { pass: hits.length > 0 && hits[0].path.includes("GPIO工作方式"), detail: hits.map((h) => h.path).join(" | ") };
		},
	},
	{
		id: "T045",
		name: "标题/章节加权使最相关章节排第一",
		severity: "high",
		run: async () => {
			const { indexer } = await build({});
			const hits = indexer.search("GPIO 工作方式").hits;
			const pass = hits.length > 0 && hits[0].heading === "八种工作模式" && hits[0].path.includes("GPIO工作方式");
			return { pass, detail: hits.slice(0, 3).map((h) => `${h.heading}:${h.score}`).join(" | ") };
		},
	},
	{
		id: "T046",
		name: "单篇片段上限 perFileLimit 生效",
		severity: "high",
		run: async () => {
			const { indexer } = await build({});
			const hits = indexer.search("必须", { limit: 50 }).hits;
			const counts = new Map();
			for (const hit of hits) counts.set(hit.path, (counts.get(hit.path) || 0) + 1);
			const max = Math.max(0, ...counts.values());
			return { pass: max <= 3, detail: `单篇最多 ${max} 段（配置 3）` };
		},
	},
	{
		id: "T047",
		name: "单次条数 topK 生效",
		severity: "high",
		run: async () => {
			const { indexer } = await build({});
			const two = indexer.search("必须", { limit: 2 }).hits.length;
			const five = indexer.search("必须").hits.length;
			return { pass: two <= 2 && five <= 5, detail: `limit=2 → ${two} 条；默认 → ${five} 条` };
		},
	},
	{
		id: "T048",
		name: "最低相关度阈值按最高分比例过滤",
		severity: "medium",
		run: async () => {
			const { indexer } = await build({});
			const strict = indexer.search("命名", { minScoreRatio: 1 }).hits.length;
			const loose = indexer.search("命名", { minScoreRatio: 0 }).hits.length;
			return { pass: strict === 1 && loose > strict, detail: `ratio=1 → ${strict} 条；ratio=0 → ${loose} 条` };
		},
	},
	{
		id: "T049",
		name: "单段字符上限截断并加省略号",
		severity: "medium",
		run: async () => {
			const dir = makeVault("longtext", { "long.md": "# 长文\n\nZQXLONGTEXT " + "填充内容。".repeat(600) });
			const s = settings({ vaults: [{ id: "lt", name: "longtext", path: dir, enabled: true }] });
			const indexer = new core.VaultIndexer(() => s);
			await indexer.build();
			const hits = indexer.search("ZQXLONGTEXT", { maxChars: 100, limit: 10 }).hits;
			const truncated = hits.filter((h) => h.excerpt.endsWith("…"));
			const pass = hits.every((h) => h.excerpt.length <= 102) && truncated.length > 0;
			return { pass, detail: `最长 ${Math.max(...hits.map((h) => h.excerpt.length))} 字符（上限 100 + 省略号），截断 ${truncated.length}/${hits.length} 条` };
		},
	},
	{
		id: "T050",
		name: "上下文总字符预算是硬上限",
		severity: "high",
		run: async () => {
			const { indexer } = await build({});
			const ctx = indexer.buildContext("命名", 200);
			const pass = ctx.markdown.length <= 200;
			return { pass, detail: `budget=200，实际 ${ctx.markdown.length} 字符（used 字段=${ctx.used}）` };
		},
	},
	{
		id: "T051",
		name: "空查询与纯表情查询安全返回空结果",
		severity: "low",
		run: async () => {
			const { indexer } = await build({});
			const empty = indexer.search("   ");
			const emoji = indexer.search("🚀🚀");
			return { pass: empty.hits.length === 0 && emoji.hits.length === 0 && empty.total === 0, detail: `空=${empty.hits.length} 表情=${emoji.hits.length}` };
		},
	},
	{
		id: "T052",
		name: "导航型页面被降权，不占据答案位",
		severity: "medium",
		run: async () => {
			const { indexer } = await build({});
			const hits = indexer.search("GPIO", { limit: 5 }).hits;
			const indexPage = hits.findIndex((h) => h.path === "wiki/索引.md");
			const pass = indexPage === -1 || indexPage >= 2;
			return { pass, detail: hits.map((h) => h.path).join(" > ") };
		},
	},
	{
		id: "T053",
		name: "单字符拉丁查询（如 C）也能命中",
		severity: "low",
		run: async () => {
			const dir = makeVault("singlechar", {
				"c.md": "# C 语言规范\n\nC 语言必须使用 C99 标准。\n",
			});
			const s = settings({ vaults: [{ id: "sc", name: "singlechar", path: dir, enabled: true }] });
			const indexer = new core.VaultIndexer(() => s);
			await indexer.build();
			const hits = indexer.search("C").hits;
			return { pass: hits.length > 0, detail: `查询 “C” 命中 ${hits.length} 条（分词器丢弃单字符拉丁 token）` };
		},
	},
];
