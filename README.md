# Obsidian Quote

把多个本地 Obsidian 知识库接成 AI 编码助手的只读参考资料。按需检索笔记、提取编码规则、生成带来源的上下文和项目规范摘要，提供浏览器面板、命令行与 MCP 接口。

Obsidian 桌面插件版本 **0.2.3**；可选 DeepSeek Harness 面板版本 **0.5.1**；Codex / Claude Code 插件接入包版本 **0.1.2**。交付包含可复现的自动化验证；真实 Obsidian 与各 AI 客户端的完整联调仍待进行。

完整安装包与源码见 [v0.2.3 预发布](https://github.com/kleinklein0824/dsh-obsidian-quote/releases/tag/v0.2.3)，包含 Codex / Claude 市场清单、Obsidian、Harness 与 CLI/MCP 组件，文件选择见 [发行说明](RELEASE-NOTES-v0.2.3.md)。

### Codex 安装后怎么使用

1. 在插件详情运行“首次配置”（客户端可能显示为 Set up），或在对话中输入“检查 Obsidian Quote 连接并打开面板”。插件的配置 Skill 会检查真实连接状态，并按请求打开本机浏览器面板。
2. **添加/移除知识库、设置包含/排除目录**：到 Obsidian → 设置 → 第三方插件 → Obsidian Quote；也可点击 Obsidian 左侧书本图标。登记后点击“写入接入配置”，并重建索引。
3. **日常检索**：在 Codex 说“列出我的知识库和笔记数量”或“在前端规范库查找组件命名规则”。六个 MCP 工具按配置读取已登记的知识库，不会自行扫描整块磁盘。
4. **可视化检索**：运行插件附带的 `node harness-skill/scripts/setup.mjs --open` 打开服务实际端口的 `/ui`；登录凭据在本机 Obsidian 面板查看，避免贴到聊天中。浏览器面板支持检索和来源选择，库管理位于 Obsidian。

Codex 接入提供工具和首次配置会话；DeepSeek 专用的侧栏按钮依赖 Harness 的界面接口。旧客户端接入包 **0.1.0 / 0.1.1 存在 MCP 路径加载故障**，请从市场更新到 0.1.2 后重开会话。仅能看到 Skill 或插件徽标不能证明工具已加载。

已安装用户的故障排查、令牌更换及分组件更新步骤见 [UPDATING.md](UPDATING.md)。

## 功能与工作方式

- 多知识库登记、启用/停用，按库、子目录、标签限制范围，并可保存命名引用组合。
- 只读扫描 Markdown，按标题分块，使用 BM25 与中文二元组进行词法检索。
- 根据“必须、建议、避免”等线索提取规范条款，保留来源；按技术栈生成有字符预算的项目规范摘要。
- 本地引用台账统计查询与被引用的片段。
- 自包含浏览器面板 `/ui`，包含检索、上下文、规则、摘要、统计五个页签。
- 零运行时 npm 依赖的 CLI、六个只读 MCP 工具，以及实验性的 DeepSeek Harness 原生面板适配。

```text
本地 Markdown 知识库 → Obsidian 桌面插件 → 本机 HTTP 服务
                                              ↑
                        浏览器 / CLI / MCP / 可选 Harness 面板
```

默认按需检索，不把整个知识库一次性交给模型。检索与索引在本机完成；如果 AI 客户端把检索结果发给模型服务商，后续处理可能经过网络。

## 安装与构建

从发行附件取得 `main.js`、`manifest.json`、`styles.css`，将三者放到：

```text
<你的知识库>/.obsidian/plugins/obsidian-quote/
```

或者将安装 ZIP 中的 `obsidian-quote/` 文件夹解压到 `<你的知识库>/.obsidian/plugins/`。重新加载 Obsidian，在第三方插件中启用 **Obsidian Quote**。只提供桌面版；发布到 GitHub 不代表已经上架 Obsidian 社区插件目录。

在仓库根目录执行开发构建：

```bash
cd plugin
npm ci --ignore-scripts
npm run build
npm test
```

构建输出是 `plugin/main.js`，安装时搭配同目录中的清单和样式。CLI 与 MCP 需要 Node.js 18+；可选浏览器测试要求 Node.js 22+。

## 首次使用

1. 点击 Obsidian 左侧书本图标，或执行“打开知识库引用面板”。首次启用且列表为空时会登记当前库，可在面板关闭这一选项。
2. 添加其他知识库的绝对路径，设置包含目录、排除目录、标签和启用状态。“扫描本机”只读取 Obsidian 已登记库清单。
3. 保持引用服务只监听回环地址。默认 `127.0.0.1:43117`，端口占用时顺延，以面板实际地址为准。
4. 点击“写入接入配置”，将地址与令牌保存到当前用户的 `~/.obsidian-quote/config.json`。已有文件会尝试备份到 `config.json.bak`。
5. 打开 `http://127.0.0.1:43117/ui`，在登录表单输入令牌，或配置 CLI/MCP。

不要提交 `data.json`、接入配置、备份文件或带令牌的截图。浏览器登录使用 `HttpOnly; SameSite=Strict` 会话 Cookie。兼容 `?token=` 链接和 API 查询参数，但推荐登录表单与 `Authorization: Bearer` 请求头，以免令牌进入浏览历史和复制的 URL。

## 可配置项

| 配置 | 默认值 | 含义 |
| --- | --- | --- |
| `topK` | 5 | 单次返回片段数 |
| `maxCharsPerSnippet` | 1200 | 单片段字符上限 |
| `totalCharsBudget` | 6000 | 上下文字符预算 |
| `perFileLimit` | 3 | 同一笔记最多片段数 |
| `minScoreRatio` | 0.2 | 相对最高分的最低比例 |
| `server.enabled` | true | 启用本地服务 |
| `host` | 127.0.0.1 | 只允许回环监听 |
| `port` | 43117 | 优先使用的端口 |
| `refreshSeconds` | 120 | 超时后在查询时触发后台刷新 |
| `maxFileSizeKB` | 512 | 跳过超过上限的笔记 |
| `watch` | true | 支持时监听变更，防抖 1.2 秒 |
| `includeFolders` / `excludeFolders` / `requiredTags` | 空 | 全局索引范围 |
| `profiles` | 空 | 命名来源组合 |
| `ui.advanced` | false | 显示组合、注入与台账等高级项 |
| `ui.autoRegisterCurrentVault` | true | 空列表首次登记当前库 |
| `injection.format` | markdown | 可选 `markdown` / `plain` |
| `injection.timing` | manual | `manual` / `brief-first`，供接入层参考，不强制客户端调用 |

高级面板中的引用组合按一行一个来源填写，例如 `规范库/前端`、`技术库/wiki`。多个来源取并集；未指定范围表示所有已启用库。遇到同名知识库须使用明确的知识库 id。

## 各客户端的安装方式

| 客户端 | 接入方式 | 安装位置与边界 |
| --- | --- | --- |
| Codex 桌面版 | 本仓库的插件市场 → 安装 Obsidian Quote | 提供首次配置 Skill、检索 Skill 和六个 MCP 工具，不安装 Obsidian 本体或 DeepSeek 面板 |
| Claude Code | 本仓库的 Claude 插件市场，或手动注册 MCP | 提供同一套 Skill 和六个 MCP 工具 |
| DeepSeek Harness | 安装 `harness-plugin/` 组合包；也可用 CLI / MCP / Skill | 专用 Host/Client 侧栏面板依赖宿主服务；修订版仍需真实宿主验收 |
| 其他本地客户端 | 由客户端注册 stdio MCP，或使用 CLI / Skill | 必须支持对应接口；尚未逐一验证，不承诺所有插件市场直接通装 |

所有方式都需要先在本机 Obsidian 中安装并运行桌面插件、登记知识库，再点击“写入接入配置”。仅安装 AI 客户端的接入包不会自动部署 Obsidian 端服务。MCP 进程需要 Node.js 18+，客户端进程也须能找到 `node`。

### Codex：从插件市场安装

在 Codex 的“添加插件市场”窗口填写：

- 来源：`https://github.com/kleinklein0824/dsh-obsidian-quote`
- Git 引用：`main`（或固定版本 `v0.2.3`）
- 稀疏路径：**留空**，本项目的清单和工具跨多个目录。

添加后选择市场 **Klein · Obsidian Quote**，安装并启用 **Obsidian Quote**。按客户端提示重开会话或刷新插件，再要求“检索我的 Obsidian 知识库中的命名规范”。接入包带首次配置与检索两项 Skill，以及 `kb_search` 等六个工具。

如果出现 `marketplace root does not contain a supported manifest`，检查是否仍在使用旧缓存、旧标签 `v0.2.1`，或填写了稀疏路径。**首次 `v0.2.1` Release 早于市场适配；此入口应使用更新后的 `main` 或 `v0.2.3`。**添加市场不等于已安装其中的插件。

### Claude Code：从插件市场安装

在 Claude Code 会话中执行：

```text
/plugin marketplace add kleinklein0824/dsh-obsidian-quote
/plugin install obsidian-quote@dsh-obsidian-quote
```

按提示确认安装并启用，在 `/mcp` 中检查服务器；必要时重新加载插件或新开会话。Codex 使用根 `plugin.json` 与 `mcp.json` 的完整插件格式来展开安装路径；Claude 使用 `.claude-plugin/` 与 `mcp.claude.json`，二者复用相同 MCP 脚本。若不使用插件市场，可按下文登记 MCP。

Codex / Claude Code 的市场接入不提供 DeepSeek 专用侧栏。其他客户端可用工具，或在本机浏览器打开 Obsidian 服务的 `/ui`。只有远程 HTTP MCP、无法运行本地 stdio 进程的客户端不能直接使用此 MCP 适配器；Obsidian 的 HTTP 检索 API 本身也不是 MCP HTTP 端点，不应直接填为远程 MCP URL。

本次在 Windows 上用 **Codex CLI 0.166.0-alpha.6** 与 **Claude Code 2.1.318** 的独立测试配置，分别完成本地目录及 GitHub 地址的市场添加和插件安装；Claude 两份清单严格校验通过。从 GitHub 安装后，再分别按两个缓存中的 MCP 配置启动服务器，连接合成知识库，六个工具各调用一次，合计 **12/12**。早期 12/12 是测试脚本展开路径后直接启动 MCP，不能证明 Codex 自动启动成功；0.1.2 修订增加 `npm run test:codex`，让实际 Codex 安装器与运行时原样加载清单、启动 MCP、枚举六工具并识别首次配置入口。桌面端操作、真实用户知识库联调及其他客户端的完整验收仍待进行。

格式依据：[Codex 插件文档](https://developers.openai.com/plugins/build/plugins)、[Claude Code 插件文档](https://code.claude.com/docs/en/plugins-reference)。

## CLI、Skill 与 MCP

在仓库根目录执行：

```bash
node harness-skill/scripts/kb.mjs status
node harness-skill/scripts/kb.mjs search "组件 命名" --limit 5
node harness-skill/scripts/kb.mjs context "目录结构" --budget 4000
node harness-skill/scripts/kb.mjs rules "命名" --priority must
node harness-skill/scripts/kb.mjs brief --project .
node harness-skill/scripts/kb.mjs search "命名" --source "规范库/前端"
node harness-skill/scripts/kb.mjs search "命名" --profile "前端规范"
```

配置格式见 `harness-skill/config.example.json`。环境变量 `OBSIDIAN_QUOTE_URL` 与 `OBSIDIAN_QUOTE_TOKEN` 可覆盖文件配置；不要将实际令牌写进仓库。

支持 Skill 的客户端可把整个 `harness-skill/` 复制到其技能目录，例如 `<项目>/.claude/skills/obsidian-vault-quote/`。

支持 MCP stdio 的客户端可登记以下服务器。替换为实际绝对路径，Windows JSON 中路径分隔符可写 `/`：

```json
{
  "mcpServers": {
    "obsidian-quote": {
      "command": "node",
      "args": ["<绝对路径>/harness-skill/scripts/mcp-server.mjs"]
    }
  }
}
```

六个工具为 `kb_search`、`kb_context`、`kb_rules`、`kb_brief`、`kb_vaults`、`kb_stats`。前四个支持 `sources` / `profile`；无法解析来源时保留警告并返回空结果。客户端配置位置和协议支持因版本而异，协议测试不代表已在所有 AI 产品中验收。

## 可选 DeepSeek Harness 面板

`harness-plugin/` 提供 Host 代理和 Client 面板，依赖宿主的 `dsh.bundle`、`dsh.client`、侧栏、语言和目录选择服务。包含检索、上下文、规则、摘要、来源选择与统计。

适配器预期的安装命令如下，需要宿主实际提供对应接口：

```text
plugin_manager action=install_bundle target=<harness-plugin 的绝对目录>
```

已验证模拟宿主契约、真实 HTTP 和模拟 React 渲染；尚未在真实 DeepSeek Harness 中验收本次修订，宿主接口变化可能需要适配。其他客户端可使用 `/ui`。

Host 从本机配置读取令牌，通过 `/dsh-obsidian-quote-panel/rpc` 代查结果。正常响应不将令牌交给浏览器，异常凭据会被拒绝。RPC 校验实际连接来源、回环 Host 与浏览器 Origin，但没有独立用户登录，只适用于受信任的单用户本机环境，不要公网暴露或反向代理。

## HTTP API

| 方法 | 路径 | 功能 |
| --- | --- | --- |
| GET | `/health` | 无需令牌的服务概况 |
| GET | `/vaults` | 已登记库、启用状态与索引数量 |
| GET / POST | `/search` | 查询片段；POST 接收 query/limit/sources/profile 等 |
| POST | `/context` | 按 query/budget 返回带来源的 Markdown |
| GET / POST | `/rules` | 按 query/topic/priority/sources/profile 获取规则 |
| POST | `/brief` | 按项目目录或显式技术栈生成摘要 |
| GET | `/stats` | 本机引用台账 |
| POST | `/reindex` | 重建索引，须显式令牌，Cookie 无此权限 |
| GET | `/ui` | 浏览器面板壳页 |
| POST | `/ui/session` | 校验令牌并建立 12 小时会话 |
| POST | `/ui/logout` | 注销并撤销会话 |

除 `/health` 与浏览器登录所需的页面/会话接口外，数据接口需要鉴权。推荐 `Authorization: Bearer <token>`；Cookie 只用于同源浏览器访问，服务重启和更换令牌会撤销会话。

## 数据边界与限制

- 笔记只读；插件会保存自身设置和引用台账。主动点击“写入接入配置”或执行 CLI `init` 还会写入本机接入文件与备份。
- 索引和解析缓存在内存中，启动后重建，没有磁盘索引缓存，不承诺固定耗时。
- 递归文件监听取决于宿主 Node.js 和操作系统；不支持时使用刷新周期在后续查询触发重建。真实 Obsidian 中的监听尚待验收。
- BM25 不理解语义。规则提取、优先级与技术栈识别是启发式，可能遗漏或误分类，关键决策应回看原文。
- 0.2.1 按完整规则文本去重，保留大小写、代码标点和内联代码空格；编号为 `R-` 加 16 位十六进制。旧版 6 位编号会改变，保存的引用须重新获取；这不是语义等价判定。
- `/health` 显示全局去重规则数，`/vaults` 显示各库提取数量，口径不同。规则与摘要先限定来源再去重，避免选中库的副本规则消失。
- 令牌以明文保存在插件 `data.json` 和主动写出的接入配置。POSIX 上仅对导出的 `~/.obsidian-quote/` 目录申请 `0700`，对其中的 `config.json` 及备份申请 `0600`；插件 `data.json` 由 Obsidian 保存，访问权限取决于知识库/Obsidian。Windows 使用继承 ACL，不能据此保证只有当前用户能读。POSIX 权限未在本次 Windows 环境实测。
- 清单声明最低 Obsidian 1.5.0，尚未逐版本运行验证。

安全边界和令牌更换步骤见 [SECURITY.md](SECURITY.md)。

## 可复现验证（2026-11-05）

本次环境为 Windows、Node.js 26.7.0、npm 12.0.2：

| 检查 | 结果 | 验证范围 |
| --- | --- | --- |
| `npm run build` | 通过 | 类型检查与生产构建 |
| `npm test` | 134/134 | 索引、范围、预算、HTTP、CLI、MCP、安全回归；Obsidian UI 使用 API 桩 |
| `npm run test:host` | 25/25 | 生成笔记、测试令牌、真实 HTTP 与模拟 Host |
| `npm run test:client` | 90/90 | 模拟 React、语言与槽位服务 |
| `npm run test:browser` | 14/14 | 真实 Chrome、测试服务与生成笔记；登录、五页签、HTML 注入、范围、360px 布局、注销 |
| `npm run test:codex` | 通过 | 真实 Codex 安装与自动启动 MCP，发现六工具和首次配置入口；不手工展开安装路径 |
| `npm run test:setup` | 6/6 | 本机连接状态、鉴权失败、远程地址拒绝、凭据脱敏和服务离线 |
| `npm audit` | 0 项已知漏洞 | 验证时锁定依赖的漏洞数据库审计 |

复现方法见 [audit/README.md](audit/README.md)。本次未将修订版安装到用户真实知识库，也没有对真实 Obsidian / DeepSeek Harness / Claude / Cursor / Codex 做完整联调。测试和漏洞审计不是安全认证。

## 发布

将源代码 ZIP 解压后的内容上传为仓库文件；不要只把 ZIP 当作仓库源码。本次 `v0.2.3` 标签和 Release 包含完整源码、`main.js`、`manifest.json`、`styles.css` 与各组件安装 ZIP。根清单与 `plugin/manifest.json` 一致；`versions.json` 记录声明的最低版本。

背景见 `idea.md`，本版修订见 [CHANGELOG.md](CHANGELOG.md)。许可证：MIT，见 [LICENSE](LICENSE)。

## 作者

Klein

邮箱：[kleinkleinwu@gmail.com](mailto:kleinkleinwu@gmail.com)

