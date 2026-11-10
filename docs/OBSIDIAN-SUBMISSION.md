# Obsidian 社区上架与配置迁移

更新日期：2026-11-10。

**截至 2026-11-06 22:37（台北时间）：0.2.8 自动审核已完成（Completed），原两项 Risks 已清除，官网按钮已启用，官方导出数据已收录；桌面端使用的 GitHub 目录镜像尚未收录，应用内搜索仍可能没有结果。** 旧版 0.2.7 的 Failed 保留为历史记录。本次无需重复提交或请求审核，下方保留目录同步排查、修复记录与以后更新时的操作方法。

**最新发行：Vault Quote 0.2.10，发布时间 2026-11-10。** Codex 0.1.6 可从知识库面板直接添加本机路径并多选检索。0.2.8 的 Completed 状态是历史结果，不代表 0.2.10 已被官方扫描；发布后需在管理页面执行 **Check for new releases**，再查看新版本的审核结果。

## 官网正常但 Obsidian 里搜索不到怎么办

官网公开条目、自动审核结果和桌面安装目录分别更新。官网的 Add to Obsidian 按钮使用 `obsidian://show-plugin?id=vault-quote` 唤起客户端；它的出现不能证明客户端已读取到该条目。

2026-11-06 的实际核验结果（台北时间）：

| 核验对象 | 结果 |
| --- | --- |
| 官网公开条目与用户提供的管理截图 | 0.2.8，自动审核 Completed，按钮已启用 |
| 22:34 的官方导出普通响应 | 10,028 项，尚无 `vault-quote` |
| 22:37 的官方导出普通响应与带查询参数的响应 | 两者均为 10,029 项，已包含 `vault-quote` 和正确仓库 |
| 同时读取的 GitHub 主分支目录 | 10,028 项，尚无 `vault-quote`；使用 GitHub API 直接读取文件，排除了 raw CDN 缓存的影响 |
| 最近一次官方镜像任务 | 22:20 开始并成功完成，早于本条目进入导出数据 |

官方仓库 [README](https://github.com/obsidianmd/obsidian-releases#how-community-plugins-are-pulled)说明客户端读取 `community-plugins.json`；[镜像任务](https://github.com/obsidianmd/obsidian-releases/blob/master/.github/workflows/mirror-community-json.yml)从 `https://community.obsidian.md/assets/community-plugins.json` 同步到该文件，计划每小时第 17 分钟执行，实际开始可能延迟。导出响应还标注 `s-maxage=3600` 缓存。因此当前证据指向官方目录尚在同步，不能据此认定本机缓存损坏、插件代码失效或需要再发一个版本。[JSON 核验记录](community-catalog-status-2026-11-06.json)保留了地址、时间、匹配条目及文件摘要。

1. 保留当前已经正常工作的本地插件和客户端连接，无需为目录同步修改服务配置。
2. 等官方下一轮镜像完成后，在上述 GitHub 目录文件中搜索 `"id": "vault-quote"`。目录尚未出现时，重装客户端或重复申请审核不能补上该条目。
3. 镜像出现后，关闭并重新打开 Obsidian 的“第三方插件 → 浏览”，关闭“仅显示已安装”，搜索 **Vault Quote**。若仍无结果，再重新启动 Obsidian，使客户端重新读取目录。
4. 镜像已收录但客户端仍缺失时，再针对客户端获取目录的网络或缓存问题排查；保留具体错误，不要直接删除整个 Obsidian 缓存或用户配置。
5. 若后续镜像任务成功却持续未导出该条目，可向官方 `#community-directory` 频道反馈，附上公开条目、插件 ID、版本和该核验记录。不要为同一插件新建重复条目。

需要立即在新知识库使用时，可从 **0.2.10 Release** 手动安装三文件或 ZIP。已有旧 ID 的用户先按下方步骤备份并迁移 `data.json`，不要同时启用两套服务。Codex 插件也需要单独更新到 0.1.6；发布 Obsidian 服务不会自动替换 Codex 的已安装缓存。

## 报错原因和本版修复

Obsidian 的清单规范禁止插件 ID 含 `obsidian`，显示名称也不能含 `Obsidian` 或 `Plugin`。因此原 `obsidian-quote` / `Obsidian Quote` 可以本地加载，却不能通过新插件提交校验。

Obsidian 安装组件现在使用 **`vault-quote` / Vault Quote / 0.2.10**，根目录与 `plugin/manifest.json` 一致。可登记当前库以外的本地目录；Codex 0.1.6 还可在面板直接登记新文件夹，并限制查询到用户勾选的多个来源。共享 HTTP API、视图类型、`~/.obsidian-quote/config.json`、环境变量和各客户端的服务地址不变。

Obsidian 用标签 **`0.2.10`**，不带 `v`，与清单版本逐字一致；该 Release 提供 `main.js`、`manifest.json`、`styles.css`、手动安装 ZIP 和校验和。配套 **`v0.2.7`** 保存旧的完整源码包、Harness tgz、ZIP、视频与校验和，不作为 Obsidian 自动安装标签。

规范来源：[清单参考](https://docs.obsidian.md/Reference/Manifest)、[提交要求](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins)、[提交插件](https://docs.obsidian.md/plugins/releasing/submit-plugin)。GitHub 发布和通过本地验证都不等于社区审核通过。

## 现有官方条目与重新审核

本插件已有[官方 Community 条目](https://community.obsidian.md/plugins/vault-quote)。作者提供的 0.2.7 截图显示 **2 项 Risks、22 项 Warnings、3 项 Other**，因此不再需要重新提交同一仓库创建条目。自动审核同时已报告构建与源码一致、未发现可疑网络模式、易受攻击依赖或混淆；这些是特定扫描结果，不是整体安全认证。

0.2.8 针对已核实的问题修复：

| 0.2.7 意见 | 0.2.8 处理 |
| --- | --- |
| 描述含 `Obsidian` | 根/安装清单与开发包描述同步移除该词 |
| `onunload` 主动 detach 面板 | 保留用户标签布局，只清理服务、监听、计时器与订阅 |
| 13 处 `:has()` | 改为渲染时添加明确宽行类，数字行保持紧凑 |
| 写死配置目录 | 通过 `Vault.configDir` 排除当前库实际目录，监听同样处理 |
| 常规 console 日志与裸 timer | 移除常规日志，HTTP 服务显式使用 Node timers，兼容无窗口运行 |
| README 英文和标题、缺贡献指南 | 补英文介绍、标题改为 Vault Quote，新增 CONTRIBUTING.md |

### 以后发布新版本怎样检查

以下针对最新发行 0.2.10。0.2.8 的审核完成状态是历史结果；每次新发行都应检查对应版本的分数卡。

1. 登录创建此条目的 Obsidian 账号，在侧栏进入 **Plugins → Your entries → Vault Quote**，打开已有条目的管理页面。公开 Scorecard 页主要展示结果，GitHub 登录不等于已登录该开发者账号。
2. 在管理页打开 **`…` → Check for new releases**。GitHub 仓库仍是 `https://github.com/kleinklein0824/dsh-obsidian-quote`，目标发行是 **`0.2.10`（无 `v`、正式发行）**，不要改成 `v0.2.7` 的配套素材发行。
3. 确认网站的发行/更新列表识别了 **0.2.10**。新发行的清单必须为 `vault-quote` / `Vault Quote` / `0.2.10`，并具有 `main.js`、`manifest.json`、`styles.css` 三个安装附件。
4. 需要立即重新扫描时，在管理页打开 **`…` → Request review**；已有队列时继续跟进现有项。官方说明新 Release 会触发新审核，这个菜单可主动请求立即检查。如果需要维护承诺确认，由作者阅读并确认；本仓库无法代替作者完成账号内操作。
5. 重新打开 Scorecard，先确认它对应 **0.2.10** 再检查新版本意见。仍显示 0.2.8、0.2.9 或 0.2.7 时是在看旧版结果；刷新公开页面本身不能保证后台已检查新发行。保留新版本号与具体意见后再定位剩余问题。

上述路径来自[官方条目管理说明](https://docs.obsidian.md/community-directory/manage-entry)。官方说明 **Warnings 不阻止提交**，应先核对新版本仍有哪些错误或风险；不能把剩余能力提示等同于全部功能故障。公开简介仍显示旧文字时，可在 **Edit listing** 修改短介绍为 `Register local vaults as read-only reference sources for AI coding assistants.`，再点击 **Save**。

只有网站显示相应完成状态，才可声称该版本审核通过。不要为同一插件新建重复条目或旧式 `obsidian-releases` PR；awesome-dsh #12409 是另一份独立申请。

### 可能继续出现的能力与缺失项

- **Direct Filesystem Access**：明确登记多个本地库需要 Node `fs`。索引只读允许范围内的 Markdown；写操作用于插件自身设置/台账，以及用户主动导出的接入文件和备份。不会为消除提示而删除多库功能。
- **Clipboard Access**：管理面板复制接入示例，浏览器面板也可复制检索结果的 Markdown；均需用户点击，代码不读取剪贴板。接入示例可能含令牌，不能公开分享。
- **1.13 设置搜索**：尚未迁移声明式 `getSettingDefinitions()`，新版本的全局设置搜索可能无法列出本插件设置。现有设置页和管理面板保留，最低版本仍为 1.5.0；不会添加空实现冒充已支持。
- **Artifact attestation**：当前尚未提供 GitHub 构建来源证明。Release 提供的 SHA-256 可核对下载字节，但不能替代来源证明。
- **README 英文提示**：虽然 0.2.8 已提供英文介绍，扫描器仍给出此 Warning，保留为后续文档改进项。
- **额外发行附件**：ZIP 与 SHA-256 被列为 Recommendation，Obsidian 安装器只下载三个程序文件，额外附件供手动安装和下载校验。
- **Malware scan not available**：属于网站的扫描可用性披露，不能通过修改文档宣称消除。

当前库的自定义配置目录会被自动排除。外部登记库的非隐藏自定义配置目录无法通过当前 `Vault.configDir` 推断，应在排除范围中明确填写。文件权限和凭据边界见 [SECURITY.md](../SECURITY.md)。

## 已有用户怎样保留配置

**只是继续使用原来正常工作的 DeepSeek 或 Codex：无需迁移。** 本版无需重新部署 DeepSeek `harness-plugin/`，也无需更换令牌、重写接入配置或重新登记知识库。

希望把现有 Obsidian 本地插件转到新市场 ID 时，按下面顺序处理。`<库配置目录>` 默认为 `.obsidian`，修改过时使用实际目录：

1. 在原知识库停用旧 **Obsidian Quote**，备份 `<库配置目录>/plugins/obsidian-quote/data.json` 和现有接入配置。备份留在本机，不能提交到仓库。
2. 将新安装三文件放入 `<库配置目录>/plugins/vault-quote/`；先不要启用新插件。若新目录已有 `data.json`，先单独备份，勿直接覆盖已有配置。
3. 把旧目录的 `data.json` **复制**到新目录。保留原文件作为回退。设置和引用台账格式兼容，库登记、包含/排除目录、引用组合、端口与令牌随文件保留。
4. 启用新 **Vault Quote**。检查原有库列表、来源范围、服务地址和检索结果，确认旧插件保持停用。如果仍使用原服务地址和令牌，DeepSeek/Codex 可继续连接，无需重写 `~/.obsidian-quote/config.json`。
5. 验证正常后再按个人备份习惯保留旧目录。不要同时启用新旧两套服务，以免端口顺延以及手动导出接入配置时覆盖共享连接地址。

不需要因这次市场 ID 改动重命名 `.obsidian-quote/`、MCP 的 `obsidian-quote` 服务、Codex/Claude 插件或 DeepSeek 的 `dsh-obsidian-quote-panel`。

## 新知识库和新编码项目的区别

Obsidian 的插件按知识库安装和启用。社区目录实际收录并同步到客户端后，新 Obsidian 知识库可在“第三方插件 → 浏览”搜索 **Vault Quote**，省去手工复制安装文件。审核完成与目录同步可能有时间差，市场上架也不等于所有知识库自动装好。

如果只是新建 DeepSeek/Codex 编码工程，保持已有 Obsidian 引用服务运行即可。需要让 Codex 读取新的本机文件夹时，可从 Codex 面板添加路径；服务设置、包含/排除目录和其他知识库管理仍在现有 Obsidian 插件中完成，编码工程本身无需再装一份 Obsidian 插件。

## 权限与数据

插件读取当前库及用户明确登记的其他本地库中的 Markdown，可按库、目录、标签限制范围。笔记正文只读；保存插件设置和本机引用台账，用户主动导出连接时还会写入 `~/.obsidian-quote/config.json` 及备份。文件监听与 HTTP 服务使用桌面端 Node.js API，因此只支持桌面版。

服务只监听回环地址，检索 API 需要令牌。浏览器 UI、DeepSeek 面板和 MCP 客户端通过它查询；插件自身不把知识库上传到云端。AI 客户端把选中的检索结果发给模型时，遵循该客户端的数据处理方式。令牌以本机配置中的明文保存，具体边界见 [SECURITY.md](../SECURITY.md)。
