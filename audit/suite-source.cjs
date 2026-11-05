const path = require("node:path");
const core = require("./core.cjs");
const { VA, ROOT, build, makeVault, settings } = require("./helpers.cjs");

const profiles = [
	{ id: "p1", name: "vue-规范", sources: [{ vault: "Vue规范库", vaultId: "va", path: "00-规范" }] },
	{ id: "p2", name: "mixed", sources: [{ vault: "Vue规范库", vaultId: "va", path: "00-规范" }, { vault: "嵌入式库", vaultId: "vb", path: "STM32" }] },
];

module.exports = [
	{
		id: "T054",
		name: "引用组合按名称限定来源",
		severity: "high",
		run: async () => {
			const { indexer } = await build({ profiles });
			const hits = indexer.search("命名", { profile: "vue-规范", limit: 20 }).hits;
			return { pass: hits.length > 0 && hits.every((h) => h.path.startsWith("00-规范/")), detail: hits.map((h) => h.path).join(" | ") };
		},
	},
	{
		id: "T055",
		name: "引用组合可按 id 引用",
		severity: "medium",
		run: async () => {
			const { indexer } = await build({ profiles });
			const byId = indexer.search("命名", { profile: "p1", limit: 20 }).hits;
			const byName = indexer.search("命名", { profile: "vue-规范", limit: 20 }).hits;
			return { pass: byId.length === byName.length && byId.length > 0, detail: `id=${byId.length} name=${byName.length}` };
		},
	},
	{
		id: "T056",
		name: "不存在的组合返回空结果而不回退全库",
		severity: "critical",
		run: async () => {
			const { indexer } = await build({ profiles });
			const hits = indexer.search("命名", { profile: "no-such-profile" }).hits;
			return { pass: hits.length === 0, detail: `命中 ${hits.length} 条（若回退全库会 >0）` };
		},
	},
	{
		id: "T057",
		name: "来源可精确到知识库内子目录",
		severity: "high",
		run: async () => {
			const { indexer } = await build({});
			const hits = indexer.search("必须", { sources: [{ vault: "Vue规范库", path: "00-规范" }], limit: 20 }).hits;
			return { pass: hits.length > 0 && hits.every((h) => h.path.startsWith("00-规范/")), detail: hits.map((h) => h.path).join(" | ") };
		},
	},
	{
		id: "T058",
		name: "子目录前缀不做模糊匹配（避免误伤）",
		severity: "high",
		run: async () => {
			const { indexer } = await build({});
			const hits = indexer.search("必须", { sources: [{ vault: "Vue规范库", path: "00-规" }] }).hits;
			return { pass: hits.length === 0, detail: `路径 “00-规” 命中 ${hits.length} 条` };
		},
	},
	{
		id: "T059",
		name: "来源路径尾部斜杠被规范化",
		severity: "low",
		run: async () => {
			const { indexer } = await build({});
			const withSlash = indexer.search("必须", { sources: [{ vault: "Vue规范库", path: "00-规范/" }], limit: 20 }).hits;
			const without = indexer.search("必须", { sources: [{ vault: "Vue规范库", path: "00-规范" }], limit: 20 }).hits;
			return { pass: withSlash.length === without.length && withSlash.length > 0, detail: `带斜杠=${withSlash.length} 不带=${without.length}` };
		},
	},
	{
		id: "T060",
		name: "多来源结果合并后统一排序",
		severity: "high",
		run: async () => {
			const { indexer } = await build({ profiles });
			const hits = indexer.search("必须", { profile: "mixed", limit: 20 }).hits;
			const vaults = new Set(hits.map((h) => h.vault));
			const sorted = hits.every((h, i) => i === 0 || hits[i - 1].score >= h.score);
			return { pass: vaults.size === 2 && sorted, detail: `来源=${[...vaults].join(",")} 单调排序=${sorted}` };
		},
	},
	{
		id: "T061",
		name: "同名知识库的来源指定不应静默歧义",
		severity: "medium",
		run: async () => {
			const s = settings({
				vaults: [
					{ id: "d1", name: "Notes", path: path.join(ROOT, "dup/Notes"), enabled: true },
					{ id: "d2", name: "Notes", path: path.join(ROOT, "dup2/Notes"), enabled: true },
				],
			});
			const indexer = new core.VaultIndexer(() => s);
			await indexer.build();
			const byName = indexer.search("方案", { sources: [{ vault: "Notes" }], limit: 20 }).hits;
			const byId = indexer.search("方案", { sources: [{ vault: "Notes", vaultId: "d2" }], limit: 20 }).hits;
			const ambiguous = new Set(byName.map((h) => h.vaultId)).size === 1 && byName.length > 0 && byName[0].vaultId === "d1";
			return { pass: !ambiguous, detail: `按名称只命中 ${byName.map((h) => h.vaultId).join(",")}；按 id 命中 ${byId.map((h) => h.vaultId).join(",")}（同名时静默取第一个）` };
		},
	},
];
