const fs = require("node:fs");
const path = require("node:path");
const core = require("./core.cjs");
const { VA } = require("./helpers.cjs");

const readNote = (rel) => core.parseNote(fs.readFileSync(path.join(VA, rel), "utf8"), rel);
const ctx = (heading, tags = []) => ({ vaultId: "x", vault: "x", path: "x.md", heading, tags, updated: "" });

module.exports = [
	{
		id: "T033",
		name: "frontmatter 行内数组标签与 title 正确解析",
		severity: "high",
		run: async () => {
			const note = readNote("00-规范/01-组件命名规范.md");
			const pass = note.title === "组件命名规范" && ["规范", "vue", "前端"].every((t) => note.tags.includes(t));
			return { pass, detail: `title=${note.title} tags=${note.tags.join(",")}` };
		},
	},
	{
		id: "T034",
		name: "frontmatter 块状标签列表正确解析",
		severity: "medium",
		run: async () => {
			const note = readNote("00-规范/02-目录结构.md");
			const pass = note.tags.includes("规范") && note.tags.includes("架构") && note.tags.length === 2;
			return { pass, detail: `tags=${note.tags.join(",")}` };
		},
	},
	{
		id: "T035",
		name: "正文内联 #标签被识别（含层级标签）",
		severity: "medium",
		run: async () => {
			const note = readNote("00-规范/03-样式约定.md");
			return { pass: note.tags.includes("前端/样式"), detail: `tags=${note.tags.join(",")}` };
		},
	},
	{
		id: "T036",
		name: "标题行不会被解析成标签",
		severity: "low",
		run: async () => {
			const note = core.parseNote("# 命名规范\n\n正文内容。\n", "命名规范.md");
			const leaked = note.tags.filter((t) => t.includes("命名"));
			return { pass: leaked.length === 0, detail: `tags=${note.tags.join(",") || "（空）"}` };
		},
	},
	{
		id: "T037",
		name: "嵌套标题生成章节路径且不重复 H1",
		severity: "medium",
		run: async () => {
			const note = core.parseNote("# T\n\n## A\n\n### B\n\n#### C\n\ntext\n", "T.md");
			const heading = note.sections[0].heading;
			return { pass: heading === "A › B › C", detail: `heading=${heading}` };
		},
	},
	{
		id: "T038",
		name: "同名重复标题各自成段且内容不丢",
		severity: "low",
		run: async () => {
			const note = core.parseNote("# T\n\n## A\n\n第一段\n\n## A\n\n第二段\n", "T.md");
			const sections = note.sections.filter((s) => s.heading === "A");
			const joined = sections.map((s) => s.text).join("|");
			return { pass: sections.length === 2 && joined.includes("第一段") && joined.includes("第二段"), detail: `${sections.length} 段：${joined}` };
		},
	},
	{
		id: "T039",
		name: "代码块内的 # 行不被当作标题",
		severity: "high",
		run: async () => {
			const note = readNote("代码块.md");
			const headings = note.sections.map((s) => s.heading);
			const leaked = headings.some((h) => h.includes("这不是标题"));
			return { pass: !leaked, detail: headings.join(" / ") };
		},
	},
	{
		id: "T040",
		name: "代码块内的“必须”不进入条款提取",
		severity: "high",
		run: async () => {
			const note = readNote("代码块.md");
			const rules = note.sections.flatMap((s) => core.extractRules(s.text, ctx(s.heading)));
			const fake = rules.some((r) => r.text.includes("代码块里的假规则"));
			const real = rules.some((r) => r.text.includes("注释必须使用中文"));
			return { pass: !fake && real, detail: `假规则=${fake} 真规则=${real} 共${rules.length}条` };
		},
	},
	{
		id: "T041",
		name: "表格行被提炼为带级别的条款",
		severity: "medium",
		run: async () => {
			const note = readNote("表格规范.md");
			const rules = core.extractRules(note.sections[0].text, ctx(note.sections[0].heading));
			const labels = rules.map((r) => `${r.priority}:${r.text}`);
			const pass = rules.length === 3 && rules.filter((r) => r.priority === "must").length === 2 && rules.some((r) => r.priority === "should");
			return { pass, detail: labels.join(" | ") };
		},
	},
	{
		id: "T042",
		name: "CRLF 与 BOM 文件均可正确解析",
		severity: "medium",
		run: async () => {
			const crlf = readNote("CRLF.md");
			const bom = readNote("BOM.md");
			const pass = crlf.sections[0].heading === "CRLF 笔记 › 约定" && bom.sections[0].heading === "BOM 笔记 › 约定" && !bom.title.includes("\uFEFF");
			return { pass, detail: `crlf=${crlf.sections[0].heading} bom=${bom.sections[0].heading}` };
		},
	},
];
