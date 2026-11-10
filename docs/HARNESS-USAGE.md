# 各 Harness 安装与使用指南

适用发行：0.2.10，2026-11-10。Obsidian 市场组件为 **Vault Quote 0.2.10 / `vault-quote`**，历史本地安装仍显示 **Obsidian Quote**，二者都可提供本机 API；已有安装继续使用，无需仅为改名迁移。Codex 接入为 **0.1.6**，支持直接添加本机文件夹并一次检索多个目录。各客户端继续使用 Obsidian Quote 品牌，复用本机引用服务；面板入口取决于客户端支持。

## 先找到自己的客户端

| 客户端 | 本项目提供的面板 | 日常使用 | 安装方式 |
| --- | --- | --- | --- |
| Codex 桌面版，接入 0.1.6 | 插件设置中的知识库面板；保留对话面板。设置入口要求支持 MCP Apps 与设置扩展 | 添加本机文件夹，选择全部或多个目录，结果直接在面板中显示；也可对话检索 | 添加本仓库插件市场，安装并启用 Obsidian Quote |
| Codex CLI | 通过终端使用六工具；桌面设置面板不在终端显示 | 对话中要求检索知识库，并标注来源 | 同一 Codex 市场包；支持插件命令的版本可安装 |
| DeepSeek Harness，面板 0.5.1 | 原有 Host/Client 侧栏面板 | 在原有侧栏选择来源并检索；也可使用已有工具/Skill | 专用 `harness-plugin/` 组合包；已有可用安装继续使用 |
| Claude Code，清单 0.1.2 | 本仓库的 Claude 接入提供六工具与 Skill；不注册新增 Codex 设置面板 | 直接要求 Claude 查询知识库；需要图形界面时使用浏览器 `/ui` | Claude 插件市场，或手动注册原六工具 MCP |
| 其他支持本地 stdio MCP 的客户端 | 手动登记默认提供六工具；是否渲染扩展 UI 取决于客户端与额外接入，未逐一验证 | 对话检索；浏览器 `/ui` 可独立使用 | 按客户端文档登记下文的 stdio 配置 |
| 只能连接远程 HTTP MCP 的客户端 | 此仓库的本地 stdio 适配器不能直接安装到这类远程连接 | 需另有经过验证的本地运行/桥接方案，本仓库未提供 | 不要把 Obsidian HTTP 地址直接填作远程 MCP 地址 |

Codex 的面板与 DeepSeek 已有侧栏分别使用自己的宿主入口。设置服务只写入 Codex 的 `mcp.json`；Claude 的启动配置及原有六工具脚本保持原样。本次只更新 Codex 多路径选择，不改变 DeepSeek 安装、Claude 配置或共享服务 API。

## 所有本机接入的共同前提

1. 本机 Obsidian 已安装并启用 **Vault Quote（旧安装为 Obsidian Quote）**，引用服务已开启，Obsidian 保持运行。
2. 已有知识库可在 **Obsidian → 设置 → 第三方插件 → Vault Quote（旧安装为 Obsidian Quote）** 管理。Codex 0.1.6 可在知识库面板直接添加新的本机文件夹；包含/排除目录、标签和引用组合仍在 Obsidian 管理。
3. 首次使用时，在 Obsidian 插件面板点击“写入接入配置”，客户端便可读取当前用户的 `~/.obsidian-quote/config.json`。已有连接正常时直接复用。
4. MCP/CLI 运行环境能找到 Node.js 18+。客户端与 Obsidian 要能访问同一本机服务；远程主机、容器或不同用户账户不能自动继承本机配置。

安装 AI 客户端接入包不会自动安装 Obsidian 服务，也不会扫描整个磁盘。DeepSeek Harness 退出后，只要 Obsidian 仍运行，其他本机客户端仍可检索。

## Codex 桌面版：点击设置按钮

在“添加插件市场”中填写：

- 来源：`https://github.com/kleinklein0824/dsh-obsidian-quote`
- Git 引用：`main` 或 `0.2.10`
- 稀疏路径：留空

在 **Klein · Obsidian Quote** 市场中安装并启用 **Obsidian Quote**，核对版本 **0.1.6**，按提示刷新插件或重启 Codex。已安装的 0.1.5 不会自动替换，必须更新或重新安装插件本身。

打开 **插件 → Obsidian Quote → 设置 → 点击右侧「Obsidian 知识库」按钮**。面板自动检查连接；在“添加本地路径”输入完整文件夹路径并添加，随后可勾选新路径和其他目录一起检索。新路径由本机 Obsidian 服务验证、保存并建立索引。选择返回内容、填写关键词并点击“查询”，结果直接显示在面板中。插件也声明可选全局/会话入口，具体是否出现及位置由宿主决定。

原有对话方式继续保留：

```text
在 Codex 对话里显示 Obsidian 知识库面板。
在我的前端规范知识库中检索组件命名要求，引用笔记路径。
```

对话可视化面板中的“请 Codex 查询”仍请求助手在后续回复检索；它与新设置面板的直接显示方式不同。两种用法均保留。

没有设置按钮时，核对版本与 `obsidian-quote-panel` 服务加载状态，再刷新或重启。旧客户端需要升级到支持对应扩展的版本；六工具仍可用于文本检索。实际 Codex 运行时发现与独立浏览器点击已验证；用户提供的实际截图也已确认当前桌面按钮、弹出面板和连接状态。截图尚未展示查询结果，不能据此宣称桌面检索结果已验收。

## Codex CLI：在对话中使用工具

支持当前插件管理命令的 CLI 可以执行：

```text
codex plugin marketplace add https://github.com/kleinklein0824/dsh-obsidian-quote --json
codex plugin add obsidian-quote@dsh-obsidian-quote --json
```

已在桌面使用同一用户配置安装过的，先检查现有安装，无需重复安装。新开 CLI 会话，要求“列出我的 Obsidian 知识库”或“检索命名规范并标注来源”。终端以工具和文本回复提供结果；设置按钮在支持的桌面客户端里使用。

## DeepSeek Harness：保留原有侧栏

已可用的安装直接使用现有侧栏、来源选择、检索/上下文/规则/摘要/统计功能。本次无需更换组合包、修改 profile、重写接入配置或重置令牌。

首次安装推荐使用 [v0.2.7 配套发行](https://github.com/kleinklein0824/dsh-obsidian-quote/releases/tag/v0.2.7)中的预构建 `dsh-obsidian-quote-panel-0.5.1.tgz`。该包以 `package.json` 所在目录为安装根，包含原有 0.5.1 运行代码；ZIP 和源码中的 `harness-plugin/` 也继续提供。由支持 `dsh.bundle`、`dsh.client`、侧栏和目录选择服务的宿主执行组合包安装；宿主工具请求示例为：

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

## 多个 Harness 共用同一知识库与端口

**可以共用一个 Obsidian Quote 服务。** Codex、Claude Code、DeepSeek 的接入进程都是客户端，只向已有服务发请求；各自的 stdio MCP 进程不会再次监听 Obsidian 的 HTTP 端口。多个任务连接同一个实际 URL 和令牌，本身不会造成端口冲突，DeepSeek 退出也不影响独立运行的 Obsidian 服务。

| 情况 | 实际行为与建议 |
| --- | --- |
| 多个 Harness → 一个服务 | 正常共用。每个请求传自己的关键词、来源和引用组合；服务不会把一个任务的查询设成另一个任务的全局默认值。建议每次明确指定需要的来源。 |
| 多个 Obsidian 实例都启用服务 | 同一地址端口只能由一个监听器使用。插件尝试配置端口及后续 9 个端口；以每个实例实际显示的地址为准。多个独立服务不要互相覆盖接入配置。 |
| 多个服务都点“写入接入配置” | 默认写同一个用户级 `~/.obsidian-quote/config.json`，后写入的地址/令牌会替换先前值。尽量保持一套服务登记多个库；确需多服务时，为每个客户端显式设置自己的 `OBSIDIAN_QUOTE_URL` / `OBSIDIAN_QUOTE_TOKEN`。 |
| 地址或令牌变更 | 先核对正确服务，再刷新/重启相应 MCP 或 Harness。原六工具进程启动时缓存连接，旧进程不会自动读到新配置。已有连接正常时不必重写配置。 |
| 查看统计 | 引用台账由同一 Obsidian 服务共享，累计所有客户端的调用，不是按 Harness 或任务隔离的账本。 |
| 大量并发、扫描或重建 | 会共用本机 CPU、磁盘与索引，可能排队或超时；没有无限并发保证。避免各任务同时反复重建索引，客户端无需自行再启动一个服务。 |

2026-11-05 使用合成的两个知识库和临时端口验证：4 个独立 stdio 客户端共用一个实际引用服务，48 次 HTTP 与 32 次 MCP 检索并发完成，来源正确、共享台账累计 80 次，测试笔记内容和修改时间未变；重复启动合并、第二服务遇占用顺延及并发重建也通过。6/6 记录见 [隔离验证](../audit/concurrent-use-evidence.json)。此测试没有读用户真实笔记、没有写用户接入配置，也不代表每种 Harness 均已做界面并发验收。

实际 Codex 与 DeepSeek 面板截图见 [README](../README.md#不同-harness-安装后的实际面板)。
