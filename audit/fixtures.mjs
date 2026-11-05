import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.argv[2] || path.join(HERE, "vaults");
fs.rmSync(ROOT, { recursive: true, force: true });

function write(vault, rel, content, opts = {}) {
	const abs = path.join(ROOT, vault, rel);
	fs.mkdirSync(path.dirname(abs), { recursive: true });
	fs.writeFileSync(abs, content, "utf8");
	if (opts.mtime) fs.utimesSync(abs, opts.mtime, opts.mtime);
}

const A = "Vue规范库";
write(A, "00-规范/01-组件命名规范.md", `---
title: 组件命名规范
tags: [规范, vue, 前端]
---
# 组件命名规范

本页约定 Vue 3 项目的组件命名方式。

## 组件文件命名

组件文件必须使用 PascalCase，例如 \`UserCard.vue\`。
组件名应该使用多单词，避免与 HTML 标签冲突。
避免使用 \`index.vue\` 作为业务组件名。

## Props 命名

prop 名必须使用 camelCase，模板中使用 kebab-case。
事件名建议使用 kebab-case，例如 \`update:modelValue\`。

## 目录结构

组件放在 \`src/components\` 下，必须按业务域分层。
页面级组件放在 \`src/views\`，不要与通用组件混放。

## 反例

| 写法 | 说明 |
| --- | --- |
| \`userCard.vue\` | 文件名必须 PascalCase |
| \`index.vue\` | 避免无语义命名 |
`);

write(A, "00-规范/02-目录结构.md", `---
tags:
  - 规范
  - 架构
---
# 目录结构

## 分层约定

项目必须采用 \`src/\` 下的分层结构。
api 层只做请求封装，不得写业务逻辑。
store 层必须使用 Pinia，禁止直接修改 state。
`);

write(A, "00-规范/03-样式约定.md", `---
tags: 规范, css
---
# 样式约定

## 类名

类名必须使用 kebab-case，例如 \`user-card\`。
颜色值不要写死，统一使用变量 \`var(--color-primary)\`。
背景色 #fff 仅用于弹层，正文背景必须使用变量。
行内标签示例 #前端/样式 仅作演示。
`);

write(A, "10-项目/示例组件.md", `# 示例组件

## 说明

这是一个示例，演示 \`UserCard.vue\` 的写法。
组件必须保持单一职责。
`);

write(A, "90-归档/旧规范.md", `# 旧规范

ZQXARCHIVEONLY 组件命名必须使用下划线分隔。
这条规则已经废弃，不应被检索到。
`);

write(A, "草稿/无标签.md", `# 无标签草稿

ZQXDRAFTONLY 组件必须使用随机命名，这是草稿里的临时约定。
`);

write(A, ".obsidian/plugins/plugin-note.md", `# 插件内部笔记

ZQXPLUGININTERNAL 组件必须使用全大写命名。
`);

write(A, ".trash/已删除.md", `# 已删除

ZQXTRASHDELETED 组件必须使用数字开头命名。
`);

write(A, "node_modules/pkg/readme.md", `# 依赖说明

ZQXDEPENDENCY 组件必须使用依赖库的命名。
`);

write(A, "深层/A/B/C.md", `# 深层笔记

## 约定

深层目录中的工具函数必须使用 camelCase。
`);

write(A, "大文件.md", `# 大文件\n\n` + "填充内容。".repeat(80_000));

write(A, "CRLF.md", "# CRLF 笔记\r\n\r\n## 约定\r\n\r\n换行必须使用 CRLF 测试。\r\n");

write(A, "BOM.md", "\uFEFF# BOM 笔记\n\n## 约定\n\n带 BOM 的文件必须能正常解析。\n");

write(A, "空.md", "");

write(A, "只有标题.md", "# 只有标题\n");

write(A, "代码块.md", `# 代码块

## 示例

\`\`\`bash
# 这不是标题
组件必须使用代码块里的假规则。
\`\`\`

真正的规则：注释必须使用中文。
`);

write(A, "表格规范.md", `# 表格规范

## 约定表

| 项目 | 约定 |
| --- | --- |
| 命名 | 变量必须使用 camelCase |
| 缩进 | 必须使用 2 个空格 |
| 分号 | 建议保留分号 |
`);

write(A, "同名.md", `# 同名（根）

## 约定

根目录同名笔记必须使用 A 方案。
`);
write(A, "深层/同名.md", `# 同名（深层）

## 约定

深层同名笔记必须使用 B 方案。
`);

const B = "嵌入式库";
write(B, "STM32/GPIO/GPIO工作方式.md", `---
tags: [STM32, GPIO]
---
# GPIO工作方式

## 八种工作模式

GPIO 必须在使用前调用 \`GPIO_Init\` 配置模式。
输入模式必须显式配置上拉或下拉，不得浮空。
寄存器操作必须使用库函数封装，禁止直接写 \`ODR\`。

## 时钟

使用 GPIO 前必须使能对应时钟。
`);

write(B, "STM32/串口/中断接收.md", `# 串口中断接收

## 接收流程

串口接收必须使用中断加环形缓冲区。
中断服务函数中不得调用阻塞函数。
缓冲区长度建议为 2 的幂。
`);

write(B, "wiki/索引.md", `# 索引

## 相关笔记

- [[GPIO工作方式]]
- [[中断接收]]
- [[时钟配置]]
- [[寄存器映射]]
- [[开发环境]]
- [[调试技巧]]
`);

write(B, "wiki/链接.md", `# 链接页

## 相关

[[A]] [[B]] [[C]] [[D]] [[E]] [[F]]
`);

const C = "禁用库";
write(C, "专属.md", `# 禁用库专属

## 约定

禁用库专属条款必须永远不被检索到。
`);

write("dup/Notes", "笔记.md", `# Notes 甲

## 约定

甲库条款必须使用甲方案。
`);
write("dup2/Notes", "笔记.md", `# Notes 乙

## 约定

乙库条款必须使用乙方案。
`);

write("空库", "占位.txt", "no markdown here\n");

console.log(ROOT);
