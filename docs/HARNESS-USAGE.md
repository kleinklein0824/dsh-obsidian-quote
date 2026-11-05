# 各 Harness 安装与使用指南

适用发行：v0.2.5，2026-11-05。各客户端复用本机 Obsidian 引用服务；面板入口取决于本仓库提供的接入方式及客户端支持。

## 先找到自己的客户端

| 客户端 | 本项目提供的面板 | 日常使用 | 安装方式 |
| --- | --- | --- | --- |
| Codex 桌面版，接入 0.1.4 | 插件设置中的知识库面板；保留对话面板。设置入口要求支持 MCP Apps 与设置扩展 | 点击“打开知识库面板”，结果直接在面板中显示；也可对话检索 | 添加本仓库插件市场，安装并启用 Obsidian Quote |
| Codex CLI | 通过终端使用六工具；桌面设置面板不在终端显示 | 对话中要求检索知识库，并标注来源 | 同一 Codex 市场包；支持插件命令的版本可安装 |
| DeepSeek Harness，面板 0.5.1 | 原有 Host/Client 侧栏面板 | 在原有侧栏选择来源并检索；也可使用已有工具/Skill | 专用 `harness-plugin/` 组合包；已有可用安装继续使用 |
| Claude Code，清单 0.1.2 | 本仓库的 Claude 接入提供六工具与 Skill；不注册新增 Codex 设置面板 | 直接要求 Claude 查询知识库；需要图形界面时使用浏览器 `/ui` | Claude 插件市场，或手动注册原六工具 MCP |
| 其他支持本地 stdio MCP 的客户端 | 手动登记默认提供六工具；是否渲染扩展 UI 取决于客户端与额外接入，未逐一验证 | 对话检索；浏览器 `/ui` 可独立使用 | 按客户端文档登记下文的 stdio 配置 |
| 只能连接远程 HTTP MCP 的客户端 | 此仓库的本地 stdio 适配器不能直接安装到这类远程连接 | 需另有经过验证的本地运行/桥接方案，本仓库未提供 | 不要把 Obsidian HTTP 地址直接填作远程 MCP 地址 |

Codex 的新面板与 DeepSeek 已有侧栏分别使用自己的宿主入口。新增设置服务只写入 Codex 的 `mcp.json`；Claude 清单及原有六工具脚本保持原样。

## 所有本机接入的共同前提

1. 本机 Obsidian 已安装并启用 Obsidian Quote，引用服务已开启，Obsidian 保持运行。
2. 需要的知识库已在 **Obsidian → 设置 → 第三方插件 → Obsidian Quote** 登记并启用。包含/排除目录、标签和引用组合也在这里管理。
3. 首次使用时，在 Obsidian 插件面板点击“写入接入配置”，客户端便可读取当前用户的 `~/.obsidian-quote/config.json`。已有连接正常时直接复用。
4. MCP/CLI 运行环境能找到 Node.js 18+。客户端与 Obsidian 要能访问同一本机服务；远程主机、容器或不同用户账户不能自动继承本机配置。

安装 AI 客户端接入包不会自动安装 Obsidian 服务，也不会扫描整个磁盘。DeepSeek Harness 退出后，只要 Obsidian 仍运行，其他本机客户端仍可检索。

## Codex 桌面版：点击设置按钮

在“添加插件市场”中填写：

- 来源：`https://github.com/kleinklein0824/dsh-obsidian-quote`
- Git 引用：`main` 或 `v0.2.5`
- 稀疏路径：留空

在 **Klein · Obsidian Quote** 市场中安装并启用 **Obsidian Quote**，核对版本 **0.1.4**，按提示刷新插件或重启 Codex。

打开 **插件设置 → Obsidian Quote → Obsidian 知识库 → 打开知识库面板**。面板自动检查连接；选择检索范围、返回内容，填写关键词并点击“查询”。结果直接显示在面板中，可以连续使用，不需要每次再发一句话打开。插件也声明可选全局/会话入口，具体是否出现及位置由宿主决定。

原有对话方式继续保留：

```text
在 Codex 对话里显示 Obsidian 知识库面板。
在我的前端规范知识库中检索组件命名要求，引用笔记路径。
```

对话可视化面板中的“请 Codex 查询”仍请求助手在后续回复检索；它与新设置面板的直接显示方式不同。两种用法均保留。

没有设置按钮时，核对版本与 `obsidian-quote-panel` 服务加载状态，再刷新或重启。旧客户端需要升级到支持对应扩展的版本；六工具仍可用于文本检索。当前验证包含实际 Codex 运行时发现和独立浏览器点击，用户桌面原生按钮的最终可视点击验收仍待完成。

## Codex CLI：在对话中使用工具

支持当前插件管理命令的 CLI 可以执行：

```text
codex plugin marketplace add https://github.com/kleinklein0824/dsh-obsidian-quote --json
codex plugin add obsidian-quote@dsh-obsidian-quote --json
```

已在桌面使用同一用户配置安装过的，先检查现有安装，无需重复安装。新开 CLI 会话，要求“列出我的 Obsidian 知识库”或“检索命名规范并标注来源”。终端以工具和文本回复提供结果；设置按钮在支持的桌面客户端里使用。

## DeepSeek Harness：保留原有侧栏

已可用的安装直接使用现有侧栏、来源选择、检索/上下文/规则/摘要/统计功能。本次无需更换组合包、修改 profile、重写接入配置或重置令牌。

首次安装时使用 Release 的 `dsh-obsidian-quote-panel-v0.5.1.zip` 或源码中的 `harness-plugin/`。由支持 `dsh.bundle`、`dsh.client`、侧栏和目录选择服务的宿主执行组合包安装；宿主工具请求示例为：

```text
plugin_manager action=install_bundle target=<harness-plugin 的绝对目录>
```

这是一条宿主工具请求示例，不是终端命令。安装后的具体入口遵循该宿主的插件管理界面。六工具/Skill 接入仍可按原有方式使用。用户现有环境已确认可用；本次没有重装或重新完成其整套界面验收。

## Claude Code：插件市场与对话检索

在 Claude Code 会话中执行：

```text
/plugin marketplace add kleinklein0824/dsh-obsidian-quote
/plugin install obsidian-quote@dsh-obsidian-quote
```

按提示启用或重新加载，在 `/mcp` 检查 `obsidian-quote`，再要求：

```text
列出我已登记的 Obsidian 知识库。
只在前端规范库检索组件命名要求，返回原文片段和笔记路径。
按我的知识库规范完成此任务，先检索相关条款。
```

本仓库的 Claude 包保持清单 0.1.2，使用 `.claude-plugin/` 和 `mcp.claude.json`。它不注册 Codex 专用面板服务。需要可点击检索界面时，在本机浏览器使用下文的 `/ui`，或者继续对话检索。

## 其他客户端：登记六工具

Cursor、Windsurf、其他编辑器/桌面助手等客户端，先查看其当前版本是否支持**本地 stdio MCP**。以下是服务器定义示例；外层配置结构及放置位置按该客户端文档调整：

```json
{
  "mcpServers": {
    "obsidian-quote": {
      "command": "node",
      "args": ["<本仓库的绝对路径>/harness-skill/scripts/mcp-server.mjs"]
    }
  }
}
```

将路径替换为实际绝对路径，Windows JSON 中可使用 `/`。启动后应发现 `kb_vaults`、`kb_search`、`kb_context`、`kb_rules`、`kb_brief`、`kb_stats` 六工具，再通过对话检索。仅复制 Skill 不会自动完成 MCP 注册；同时拥有 CLI 执行能力的 Skill 可以按其指引运行脚本。

这里没有声称上述客户端已逐一完成安装验收，也不承诺能直接安装另一客户端的市场包或显示同一原生面板。普通六工具注册不会自动增加 Codex 的设置按钮。

## 通用浏览器与命令行入口

本机浏览器打开实际服务地址的 `/ui`（默认 `http://127.0.0.1:43117/ui`，端口以 Obsidian 设置为准），使用现有本机访问令牌登录。浏览器面板包含检索、上下文、规则、摘要、统计，独立于 AI 客户端；浏览器结果不会自动发送给助手。

也可在仓库根目录运行：

```text
node harness-skill/scripts/setup.mjs --open
node harness-skill/scripts/kb.mjs status
node harness-skill/scripts/kb.mjs search "组件 命名规范" --limit 5
node harness-skill/scripts/kb.mjs context "目录结构" --budget 4000
node harness-skill/scripts/kb.mjs search "命名" --profile "前端规范"
```

首次未配置时按 Obsidian 插件面板完成连接；已有配置正常时不必重置。令牌属于本机服务，不能用模型 API key 代替，也不要放进仓库或聊天。

更多排查见 [更新说明](../UPDATING.md)。历史原始归档的安全迁移另见 [历史安全升级指南](UPDATING-FROM-ORIGINAL.md)。
