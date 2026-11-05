---
name: obsidian-vault-quote
description: 从本地 Obsidian 知识库按需检索代码规范、命名约定、目录结构、技术方案，并生成按技术栈筛选的规范摘要（必须/建议/可选）。当用户要求“按我的知识库/笔记/规范来做”，或需要在动手写代码前确认项目约定时使用。默认按需检索，不全量注入。
---

# Obsidian 知识库引用

把用户本地已建好的 Obsidian 知识库当作**只读参考手册**：需要时检索，拿到片段或条款后按其中的约定写代码。

## 前置条件

- Obsidian 桌面端正在运行，且已启用 **Obsidian Quote** 插件、面板中「启用引用服务」为开启状态。
- Node.js 18+。
- 接入配置位于 `~/.obsidian-quote/config.json`（`{ "url": "...", "token": "..." }`），由插件面板的「写入接入配置」直接落盘（旧文件自动备份为 `config.json.bak`），或「复制接入配置」手动保存；也可用环境变量 `OBSIDIAN_QUOTE_URL` / `OBSIDIAN_QUOTE_TOKEN` 覆盖。没有配置时 `kb.mjs` / MCP 会明确提示「未找到接入配置」，不会误报令牌不一致。

## 路径约定

本文件所在目录记为 **skill 目录**。按 README 安装到 `<项目>/.claude/skills/obsidian-vault-quote/` 时，在项目根目录先声明：

```bash
SKILL_DIR=".claude/skills/obsidian-vault-quote"
node "$SKILL_DIR/scripts/kb.mjs" status
```

如果 harness 以 skill 目录作为工作目录，可直接写 `node scripts/kb.mjs`。下文所有命令中的 `$SKILL_DIR` 都指上述目录；不要假设当前目录就是 skill 目录。

## 第一步：确认服务可用

```bash
node "$SKILL_DIR/scripts/kb.mjs" status
```

```
服务：正常 · http://127.0.0.1:43117
鉴权：通过
知识库：2 个 · 笔记 116 篇 · 段落 984 个
索引：就绪
注入：manual · markdown
```

失败时直接告知用户打开 Obsidian 并启用服务，**不要凭空编造“知识库里的规范”**。

## 工作流

1. **项目或新模块开始**：先要一份规范摘要，作为本轮约束。

   ```bash
   node "$SKILL_DIR/scripts/kb.mjs" brief --project .
   ```

   返回按 `必须 / 建议 / 可选` 分组的条款清单，每条带稳定编号（如 `R-3F2A1B6C7D8E9012`）与来源路径。技术栈由目录自动识别，也可 `--stack vue,typescript` 指定；用户建过引用组合时优先加 `--profile 组合名`。**这是一次性摘要，不要每轮重复生成。**

2. **具体问题**：按主题检索原文片段或条款。

   ```bash
   node "$SKILL_DIR/scripts/kb.mjs" search "组件 命名规范" --limit 5
   node "$SKILL_DIR/scripts/kb.mjs" rules "命名" --priority must
   ```

3. **落地**：按条款中的命名、分层、目录、写法产出代码；摘要未覆盖的部分按通用最佳实践处理。

4. **收尾自查**：对照摘要中的「必须」逐条检查；有偏离要在回复里说明原因。

5. **标注来源**：在回复末尾列出实际引用的笔记路径，便于用户核对。

6. **冲突时的优先级**：用户当前明确指令 > 项目内既有配置（`.editorconfig`、`AGENTS.md`、lint 配置）> 知识库条款 > 通用最佳实践。

## 命令

```bash
# 项目规范摘要（Markdown，含必须/建议/可选）
node "$SKILL_DIR/scripts/kb.mjs" brief --project . --budget 4000

# 用面板里建好的「引用组合」限定来源（可跨库、可指定子目录）
node "$SKILL_DIR/scripts/kb.mjs" brief --project . --profile vue-规范

# 临时指定多个来源，结果合并排序
node "$SKILL_DIR/scripts/kb.mjs" search "命名" --source "Obsidian test1/Vue3/课程知识图谱" --source "Obsidian Vault/wiki"

# 只取“必须”条款
node "$SKILL_DIR/scripts/kb.mjs" rules "命名 目录" --priority must --limit 10

# 检索原文片段（人读格式）
node "$SKILL_DIR/scripts/kb.mjs" search "组件 命名规范" --limit 5

# 组装成带来源的 Markdown 上下文（受字符预算约束）
node "$SKILL_DIR/scripts/kb.mjs" context "GPIO 输入 上拉" --budget 4000

# 查看知识库与规则规模
node "$SKILL_DIR/scripts/kb.mjs" vaults

# 查看本机引用台账（哪些笔记真的被用到）
node "$SKILL_DIR/scripts/kb.mjs" stats

# 机器可读输出
node "$SKILL_DIR/scripts/kb.mjs" rules "命名" --json
```

`brief` 返回：适用范围（技术栈 + 依据）、`必须 / 建议 / 可选` 条款、来源路径。
`rules` 返回：条款编号、级别、正文、主题、来源。
`search` 返回：标题、章节、知识库/相对路径、标签、原文片段。

## 多库与来源组合

- 面板「知识库」的勾选是**全局启用范围**：不勾选的库不参与任何检索。
- 面板「引用组合」是**命名来源集**：一个组合可以包含多个库，也可以精确到库内子目录，例如 `Obsidian test1/Vue3/课程知识图谱` + `代码规范库`。
- 调用时用 `--profile 组合名` 引用整组；用 `--source "库名/子目录"` 临时指定（可重复），多个来源的结果会合并后统一排序。
- `search` / `context` / `rules` / `brief` 都支持 `--profile` 与 `--source`；MCP 对应 `profile` 与 `sources` 参数。
- 指定了来源但没有任何库匹配时返回空结果，而不是回退到全库——避免误引用无关笔记。

## 检索词建议

- 用主题词 + 约束词：「命名规范 组件」「目录结构 Vue」「串口 中断 接收」。
- 中文按词检索即可，服务端对中文按二元组匹配，不需要完整句子。
- 无结果时换同义词再试一次：「规范 / 约定 / 风格」「目录结构 / 工程结构」「配置 / 设置」。
- 不要用「帮我看看有没有关于……的笔记」这类长句，直接给关键词。

## 引用格式

在回复末尾追加：

```markdown
参考知识库：
- Obsidian test1 / STM32/课程知识图谱/02-GPIO/GPIO工作方式.md
```

引用条款时可带编号：`按 R-3F2A1B6C7D8E9012（组件名必须 PascalCase）`。不要把来源写成代码注释塞进产物文件，除非用户要求。

## 失败处理

| 现象 | 处理 |
| --- | --- |
| 连接失败 | 提示用户打开 Obsidian → 插件面板 → 启用引用服务；不要继续猜测规范 |
| 未找到接入配置 | 让用户在面板点「写入接入配置」，或运行 `node scripts/kb.mjs init --url … --token …`，或设 `OBSIDIAN_QUOTE_URL/TOKEN`；不要当成令牌错误 |
| 401 / unauthorized | 令牌不一致，让用户在面板重新「复制接入配置」或「写入接入配置」，并更新 `~/.obsidian-quote/config.json` |
| `brief` 返回 0 条 | 说明知识库中没有该技术栈的可执行条款；改用 `search` 找片段，或按通用最佳实践并标注「未命中知识库」 |
| 无匹配结果 | 明确说明「知识库中未命中」，按通用最佳实践实现并标注这一点 |
| 片段与任务无关 | 丢弃，不要为了“用上知识库”而硬套 |

## 边界

- **只读**：不修改、不新增、不移动知识库中的任何笔记。
- **按需**：不做全量注入；`brief` 一次、`search` 按题，单次引用受插件配置的条数与字符预算限制。
- **不替代工具链**：知识库条款是参考，项目自身的 lint / formatter / 构建配置仍然优先执行。
- 不修改 harness 的既有配置；本 skill 与 MCP 适配层都是外挂接入。

## MCP 方式（可选）

若 harness 支持 MCP，可挂载 `scripts/mcp-server.mjs`，获得 6 个只读工具：

| 工具 | 用途 |
| --- | --- |
| `kb_brief` | 按技术栈生成规范摘要（必须/建议/可选） |
| `kb_rules` | 查询可执行条款（按关键词/主题/级别） |
| `kb_search` | 检索原文片段 |
| `kb_context` | 组装带来源的上下文块 |
| `kb_vaults` | 已登记知识库与规模 |
| `kb_stats` | 本机引用台账 |

```json
{
  "mcpServers": {
    "obsidian-quote": {
      "command": "node",
      "args": ["<skill 目录>/scripts/mcp-server.mjs"]
    }
  }
}
```
