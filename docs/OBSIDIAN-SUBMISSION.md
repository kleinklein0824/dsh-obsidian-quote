# Obsidian 社区上架与配置迁移

更新日期：2026-11-06。

## 报错原因和本版修复

Obsidian 的清单规范禁止插件 ID 含 `obsidian`，显示名称也不能含 `Obsidian` 或 `Plugin`。因此原 `obsidian-quote` / `Obsidian Quote` 可以本地加载，却不能通过新插件提交校验。

Obsidian 安装组件现在使用 **`vault-quote` / Vault Quote / 0.2.8**，根目录与 `plugin/manifest.json` 一致。面板的“全部设置”按钮读取当前 `plugin.manifest.id`，不再固定打开旧 ID。共享 HTTP API、视图类型、`~/.obsidian-quote/config.json`、环境变量和各客户端的插件 ID 不变。

Obsidian 用标签 **`0.2.8`**，不带 `v`，与清单版本逐字一致；该 Release 的安装附件是 `main.js`、`manifest.json`、`styles.css`。配套 **`v0.2.7`** 保存完整源码包、Harness tgz、ZIP、视频与校验和，不作为 Obsidian 自动安装标签。

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

### 作者现在怎样操作

1. 登录创建此条目的 Obsidian 账号，打开上述**已有 Vault Quote 条目**；从头像菜单或条目的 `…` 进入开发者/插件管理入口，以实际页面显示为准。公开 Scorecard 页主要展示结果，GitHub 登录不等于已登录该开发者账号。
2. 在该插件的管理页面点击 **Check for new releases**。GitHub 仓库仍是 `https://github.com/kleinklein0824/dsh-obsidian-quote`，目标发行是 **`0.2.8`（无 `v`、正式发行）**，不要改成 `v0.2.7` 的配套素材发行。
3. 确认网站的发行/更新列表识别了 **0.2.8**。新发行的清单必须为 `vault-quote` / `Vault Quote` / `0.2.8`，并具有 `main.js`、`manifest.json`、`styles.css` 三个安装附件。
4. 等待网站扫描和审核。若管理页另有 **Request review** 且没有正在进行的审核，按页面要求申请；已有队列时继续跟进现有项。如果需要维护承诺确认，由作者阅读并确认。按钮与状态以网站实际显示为准，本仓库无法代替作者完成账号内操作。
5. 重新打开 Scorecard，先确认它对应 **0.2.8** 再检查两项风险。仍显示 0.2.7 时是在看旧版结果；刷新公开页面本身不能保证后台已检查新发行。保留新版本号与具体意见后再定位剩余问题。

只有网站显示相应完成状态，才可声称该版本审核通过。不要为同一插件新建重复条目或旧式 `obsidian-releases` PR；awesome-dsh #12409 是另一份独立申请。

### 可能继续出现的能力与缺失项

- **Direct Filesystem Access**：明确登记多个本地库需要 Node `fs`。索引只读允许范围内的 Markdown；写操作用于插件自身设置/台账，以及用户主动导出的接入文件和备份。不会为消除提示而删除多库功能。
- **Clipboard Access**：管理面板复制接入示例，浏览器面板也可复制检索结果的 Markdown；均需用户点击，代码不读取剪贴板。接入示例可能含令牌，不能公开分享。
- **1.13 设置搜索**：尚未迁移声明式 `getSettingDefinitions()`，新版本的全局设置搜索可能无法列出本插件设置。现有设置页和管理面板保留，最低版本仍为 1.5.0；不会添加空实现冒充已支持。
- **Artifact attestation**：当前尚未提供 GitHub 构建来源证明。Release 提供的 SHA-256 可核对下载字节，但不能替代来源证明。
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

Obsidian 的插件按知识库安装和启用。社区审核通过后，新 Obsidian 知识库可在“第三方插件 → 浏览”搜索 **Vault Quote**，省去手工复制安装文件。市场上架不等于所有知识库自动装好。

如果只是新建 DeepSeek/Codex 编码工程，保持已有 Obsidian 引用服务运行即可。需要读取其他知识库时，到现有插件里登记该库及允许范围；编码工程本身无需再装一份 Obsidian 插件。

## 权限与数据

插件读取当前库及用户明确登记的其他本地库中的 Markdown，可按库、目录、标签限制范围。笔记正文只读；保存插件设置和本机引用台账，用户主动导出连接时还会写入 `~/.obsidian-quote/config.json` 及备份。文件监听与 HTTP 服务使用桌面端 Node.js API，因此只支持桌面版。

服务只监听回环地址，检索 API 需要令牌。浏览器 UI、DeepSeek 面板和 MCP 客户端通过它查询；插件自身不把知识库上传到云端。AI 客户端把选中的检索结果发给模型时，遵循该客户端的数据处理方式。令牌以本机配置中的明文保存，具体边界见 [SECURITY.md](../SECURITY.md)。
