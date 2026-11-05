const fs = require("node:fs");
const path = require("node:path");
const core = require("./core.cjs");
const { VA, TMP, build, snapshot, sameSnapshot, makeVault, settings } = require("./helpers.cjs");
const onlyA = { vaults: [{ id: "va", name: "Vue规范库", path: VA, enabled: true }] };

const has = (response, predicate) => response.hits.some(predicate);

module.exports = [
	{
		id: "T022",
		name: "建索引全程不写入知识库",
		severity: "critical",
		run: async () => {
			const before = snapshot(VA);
			const { indexer } = await build({ vaults: [{ id: "va", name: "Vue规范库", path: VA, enabled: true }] });
			const after = snapshot(VA);
			return { pass: sameSnapshot(before, after) && indexer.chunkCount > 0, detail: `文件数 ${before.size} → ${after.size}，内容/mtime 完全一致` };
		},
	},
	{
		id: "T023",
		name: "跳过 .obsidian / .trash / node_modules",
		severity: "high",
		run: async () => {
			const { indexer } = await build({ vaults: [{ id: "va", name: "Vue规范库", path: VA, enabled: true }] });
			const probes = ["ZQXPLUGININTERNAL", "ZQXTRASHDELETED", "ZQXDEPENDENCY"].map((q) => indexer.search(q).hits.length);
			return { pass: probes.every((n) => n === 0), detail: `三个内部目录命中数 ${probes.join(",")}` };
		},
	},
	{
		id: "T024",
		name: "排除目录不参与检索",
		severity: "high",
		run: async () => {
			const { indexer } = await build({ ...onlyA, scope: { excludeFolders: ["90-归档", "草稿"] } });
			const archive = indexer.search("ZQXARCHIVEONLY").hits.length;
			const draft = indexer.search("ZQXDRAFTONLY").hits.length;
			return { pass: archive === 0 && draft === 0 && indexer.docCount === 13, detail: `归档命中=${archive} 草稿命中=${draft} docs=${indexer.docCount}` };
		},
	},
	{
		id: "T025",
		name: "包含目录只索引指定范围",
		severity: "high",
		run: async () => {
			const { indexer } = await build({ ...onlyA, scope: { includeFolders: ["00-规范"] } });
			const outside = indexer.search("GPIO_Init").hits.length;
			const inside = indexer.search("命名").hits;
			return { pass: outside === 0 && indexer.docCount === 3 && inside.every((h) => h.path.startsWith("00-规范/")), detail: `docs=${indexer.docCount} 范围外命中=${outside} 范围内命中=${inside.length}` };
		},
	},
	{
		id: "T026",
		name: "标签过滤只保留命中标签的笔记",
		severity: "medium",
		run: async () => {
			const { indexer } = await build({ ...onlyA, scope: { requiredTags: ["规范"] } });
			const hits = indexer.search("camelCase", { limit: 20 }).hits;
			const noTable = hits.every((h) => h.path !== "表格规范.md");
			return { pass: indexer.docCount === 3 && noTable && hits.length > 0, detail: `docs=${indexer.docCount} 表格规范是否泄漏=${!noTable}` };
		},
	},
	{
		id: "T027",
		name: "超大文件按 maxFileSizeKB 跳过",
		severity: "medium",
		run: async () => {
			const { indexer } = await build({ ...onlyA, index: { maxFileSizeKB: 64 } });
			const stat = indexer.statsFor("va");
			const hit = indexer.search("填充内容").hits.length;
			return { pass: stat.skipped >= 1 && hit === 0, detail: `skipped=${stat.skipped} 命中=${hit}` };
		},
	},
	{
		id: "T028",
		name: "停用的知识库完全不进入索引",
		severity: "critical",
		run: async () => {
			const { indexer } = await build({});
			const stat = indexer.statsFor("vc");
			const hits = indexer.search("禁用库专属条款", { limit: 20 }).hits;
			return { pass: stat.docs === 0 && stat.chunks === 0 && !has({ hits }, (h) => h.vaultId === "vc"), detail: `vc docs=${stat.docs} chunks=${stat.chunks} 泄漏命中=${hits.filter((h) => h.vaultId === "vc").length}` };
		},
	},
	{
		id: "T029",
		name: "隐藏目录与非 Markdown 文件被忽略",
		severity: "medium",
		run: async () => {
			const dir = makeVault("hidden", {
				"note.md": "# 正常\n\n正常条款必须被索引。\n",
				"readme.txt": "ZQXHIDDENONLY 隐藏条款必须不被索引。",
				".hidden/secret.md": "# 隐藏\n\nZQXHIDDENONLY 隐藏条款必须不被索引。\n",
			});
			const { indexer } = await build({ vaults: [{ id: "h", name: "hidden", path: dir, enabled: true }] });
			const normal = indexer.search("正常条款").hits.length;
			const hidden = indexer.search("ZQXHIDDENONLY").hits.length;
			return { pass: normal === 1 && hidden === 0 && indexer.docCount === 1, detail: `正常=${normal} 隐藏=${hidden} docs=${indexer.docCount}` };
		},
	},
	{
		id: "T030",
		name: "空笔记与仅标题笔记不产生异常",
		severity: "low",
		run: async () => {
			const { indexer } = await build(onlyA);
			const stat = indexer.statsFor("va");
			return { pass: stat.docs === 15 && stat.chunks === 17 && !stat.error, detail: `docs=${stat.docs} chunks=${stat.chunks} error=${stat.error || "无"}` };
		},
	},
	{
		id: "T031",
		name: "二次构建命中缓存，不重复读盘",
		severity: "high",
		run: async () => {
			const dir = makeVault("cache", {
				"a.md": "# A\n\n甲条款必须遵守。\n",
				"b.md": "# B\n\n乙条款必须遵守。\n",
			});
			const s = settings({ vaults: [{ id: "c", name: "cache", path: dir, enabled: true }] });
			const indexer = new core.VaultIndexer(() => s);
			await indexer.build();
			const original = fs.promises.readFile;
			let reads = 0;
			fs.promises.readFile = async (...args) => {
				reads++;
				return original.apply(fs.promises, args);
			};
			const t0 = Date.now();
			try {
				await indexer.build();
			} finally {
				fs.promises.readFile = original;
			}
			const took = Date.now() - t0;
			return { pass: reads === 0 && took < 20, detail: `二次构建读文件 ${reads} 次，耗时 ${took}ms` };
		},
	},
	{
		id: "T032",
		name: "笔记变更后只重读变化文件并更新结果",
		severity: "high",
		run: async () => {
			const dir = makeVault("invalidate", {
				"a.md": "# A\n\n旧条款必须遵守。\n",
				"b.md": "# B\n\n稳定条款必须遵守。\n",
			});
			const s = settings({ vaults: [{ id: "i", name: "invalidate", path: dir, enabled: true }] });
			const indexer = new core.VaultIndexer(() => s);
			await indexer.build();
			fs.appendFileSync(path.join(dir, "a.md"), "\n新增条款必须使用缓存失效标记。\n");
			const original = fs.promises.readFile;
			let reads = 0;
			fs.promises.readFile = async (...args) => {
				reads++;
				return original.apply(fs.promises, args);
			};
			try {
				await indexer.build();
			} finally {
				fs.promises.readFile = original;
			}
			const hit = indexer.search("缓存失效标记").hits.length;
			return { pass: reads === 1 && hit > 0, detail: `重读文件=${reads} 新内容命中=${hit}` };
		},
	},
];
