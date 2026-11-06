# Obsidian 社区上架与配置迁移

更新日期：2026-11-06。

## 报错原因和本版修复

Obsidian 的清单规范禁止插件 ID 含 `obsidian`，显示名称也不能含 `Obsidian` 或 `Plugin`。因此原 `obsidian-quote` / `Obsidian Quote` 可以本地加载，却不能通过新插件提交校验。

Obsidian 安装组件现在使用 **`vault-quote` / Vault Quote / 0.2.7**，根目录与 `plugin/manifest.json` 一致。面板的“全部设置”按钮读取当前 `plugin.manifest.id`，不再固定打开旧 ID。共享 HTTP API、视图类型、`~/.obsidian-quote/config.json`、环境变量和各客户端的插件 ID 不变。

Obsidian 用标签 **`0.2.7`**，不带 `v`，与清单版本逐字一致；该 Release 的安装附件是 `main.js`、`manifest.json`、`styles.css`。配套 **`v0.2.7`** 保存完整源码包、Harness tgz、ZIP、视频与校验和，不作为 Obsidian 自动安装标签。

规范来源：[清单参考](https://docs.obsidian.md/Reference/Manifest)、[提交要求](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins)、[提交插件](https://docs.obsidian.md/plugins/releasing/submit-plugin)。GitHub 发布和通过本地验证都不等于社区审核通过。

## 作者继续提交

1. 在 Obsidian 官方开发者页面使用自己的账号打开“提交新插件”。
2. 仓库仍填 `https://github.com/kleinklein0824/dsh-obsidian-quote`，不填子目录或 Release 地址。确认公开仓库根清单已经显示 `vault-quote` / `Vault Quote` / `0.2.7`。
3. 阅读并确认开发者政策与持续维护承诺，提交后按页面显示的审核状态和意见跟进。仅当网站报告成功后，才可称为“已提交”；只有目录审核通过后，其他用户才可以在 Obsidian 内搜索安装。

Obsidian 官方当前说明从 Community 网站提交。不要为同一个插件另行创建旧式 `obsidian-releases` 收录 PR；本任务中的 awesome-dsh PR 是另一份独立申请，不会代替 Obsidian 审核。

## 已有用户怎样保留配置

**只是继续使用原来正常工作的 DeepSeek 或 Codex：无需迁移。** 本版无需重新部署 DeepSeek `harness-plugin/`，也无需更换令牌、重写接入配置或重新登记知识库。

希望把现有 Obsidian 本地插件转到新市场 ID 时，按下面顺序处理：

1. 在原知识库停用旧 **Obsidian Quote**，备份 `.obsidian/plugins/obsidian-quote/data.json` 和现有接入配置。备份留在本机，不能提交到仓库。
2. 将新安装三文件放入 `.obsidian/plugins/vault-quote/`；先不要启用新插件。若新目录已有 `data.json`，先单独备份，勿直接覆盖已有配置。
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
