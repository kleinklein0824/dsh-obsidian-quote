# 排查与更新说明

修订日期：2026-11-10。Obsidian 社区组件 **Vault Quote 0.2.10**，ID **`vault-quote`**；DeepSeek 面板 **0.5.1**；Codex 接入 **0.1.6**；Claude 清单 **0.1.2**；CLI/MCP **0.2.3**。各组件独立编号。

## 已经在本地正常使用

**原来的 Obsidian Quote 0.2.1/0.2.3 可以继续使用，现有 DeepSeek 和 Codex 连接也可以保留。** GitHub 发布、改清单名称和提交市场，不会自动修改本机已安装的文件。本次没有覆盖原 Obsidian 插件、DeepSeek 安装目录、profile、库登记、来源范围、引用组合、令牌或共享接入配置。

已经本地部署的 DeepSeek `harness-plugin/` 与仓库 0.5.1 的运行文件逐字节一致，包括两个语言文件，无需更新或重新安装。Codex 0.1.6 可直接从面板添加本机文件夹，再与已有路径一起多选检索；Claude 0.1.2 和六工具服务代码保持不变。GitHub 推送和市场刷新不会自动替换已安装的 Codex 插件文件。

如果只是新建 AI 编码项目，继续复用已有 Obsidian 本机服务。可在 Codex 面板登记当前 Obsidian 库以外的本机目录，并为每次查询单独选择一个或多个来源；服务设置、包含/排除范围仍在 Obsidian 管理，无需给每个编码工程复制一份 Obsidian 插件。

## Obsidian 上架为什么改名

原 `obsidian-quote` ID 和 `Obsidian Quote` 显示名称包含官方禁止的 `obsidian` 字样。本地加载与社区新插件提交的校验不同，能在本地使用不代表能通过市场提交。

发布版使用 **`vault-quote` / Vault Quote**，根清单、安装清单、开发包和版本映射同步到 **0.2.10**。新增在 Codex 面板直接登记外部本地目录并多选检索；已有面板、索引、检索、规则、上下文、摘要和本机 API 保留。各 AI 客户端和仓库继续使用 Obsidian Quote 品牌。

Obsidian 自动安装使用 **`0.2.10`（无 `v`）** Release，附件是 `main.js`、`manifest.json`、`styles.css`、ZIP 和校验和。该标签也包含 Codex 0.1.6 路径登记更新；旧的完整源码、Harness ZIP/tgz 和视频仍在 **`v0.2.7` 配套发行**中。GitHub 发布和 awesome-dsh 收录不替代 Obsidian 官方社区审核。

## 官网显示 Risks 时怎样更新

**0.2.8 的自动审核现已完成（Completed），公开条目的 Add to Obsidian 按钮已启用。** 截至 2026-11-06 22:37（台北时间），官方导出数据已有 `vault-quote`，桌面端使用的 GitHub 镜像尚未收录，应用内仍可能搜索不到；按钮出现不能证明桌面目录已同步。该状态只对应 0.2.8，尚未核实新发布 0.2.10 的审核结果。详见[目录同步排查](docs/OBSIDIAN-SUBMISSION.md#官网正常但-obsidian-里搜索不到怎么办)。文件访问、剪贴板、全局设置搜索、英文 README、构建来源证明和额外附件仍有 Warning/Recommendation。

现有官方条目的 0.2.7 分数卡指出描述禁词和卸载时关闭面板标签两项风险；0.2.8 修复这两项，并处理宽行样式、当前库自定义配置目录、常规日志、计时器和英文 README。保留原有面板、HTTP API 与最低 Obsidian 1.5.0 支持。

作者登录后进入 **Plugins → Your entries → Vault Quote**，打开 **`…` → Check for new releases** 检查 GitHub 的 **0.2.10**，确认新版本被识别。需要立即重新扫描时再选择 **`…` → Request review**；已有审核队列时继续跟进现有项。路径依据[官方条目管理说明](https://docs.obsidian.md/community-directory/manage-entry)。不要重新创建同 ID 条目，也不要只刷新旧版分数卡。

文件访问、主动复制接入配置、1.13 全局设置搜索未迁移和缺少 GitHub artifact attestation 的说明见 [审核指南](docs/OBSIDIAN-SUBMISSION.md)。本地测试和发布成功不代表官网已经重新扫描通过。

## 希望迁移到新的 Obsidian 市场 ID

1. 停用旧 Obsidian Quote，私下备份 `<库配置目录>/plugins/obsidian-quote/data.json` 与现有接入配置。
2. 安装新 Vault Quote 到 `<库配置目录>/plugins/vault-quote/`，先保持停用。
3. 将旧 `data.json` 复制到新目录；新目录已存在此文件时先备份，保留旧目录原件。
4. 启用新 Vault Quote，核对原有库登记、范围、引用组合、服务地址和查询结果。保持旧插件停用，避免两份引用服务同时启动。

其中 `<库配置目录>` 默认为 `.obsidian`，修改过时使用实际目录。同一份 `data.json` 的格式仍然兼容，保存的设置和引用台账可沿用。已有共享地址和令牌正确时，DeepSeek/Codex 无需重新配置。安装新 ID 本身不会自动读取旧目录的设置文件；完整说明见 [Obsidian 上架与配置迁移](docs/OBSIDIAN-SUBMISSION.md)。

## Codex 更新到 0.1.6

**0.1.6** 在原多选功能上增加“添加本地路径”输入框，可直接加入任意本机绝对路径；Obsidian 服务验证、保存并索引后，新目录会出现在多选列表中。服务配置、包含/排除范围等仍由 Obsidian 管理，对话检索继续保留。

已经安装的 **0.1.5 不会因 GitHub 新版或市场刷新自动更新**。在 Codex 中先刷新 **Klein · Obsidian Quote** 市场，再更新/重新安装 **Obsidian Quote** 插件本身，并重新加载或重启 Codex；确认插件版本为 **0.1.6**。新安装来源为本仓库，Git 引用 `main` 或 `0.2.10`，稀疏路径留空。客户端本身需要支持对应设置扩展。

## DeepSeek 社区目录

沿用 [awesome-dsh-plugin #12409](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/12409)，入口指向可安装的 `harness-plugin/` 子目录。首次安装可使用 `v0.2.7` 配套发行中的 **`dsh-obsidian-quote-panel-0.5.1.tgz`**；已安装用户无需更新。收录申请与 Obsidian 社区目录是两套独立流程。

## 连接故障

- 服务离线：保持 Obsidian 打开，在当前启用的插件里确认引用服务开启。
- 鉴权失败：核对本机接入文件和环境变量覆盖。已有连接正常时无需更换令牌。
- 原有来源失效：明确重新选择范围，避免查询被意外扩大。
- 同时启用新旧 ID：停用其中一份，再核对客户端连接的服务地址；保持一个实际引用服务供多个客户端共用。

操作入口见 [各 Harness 使用指南](docs/HARNESS-USAGE.md)。仍使用最初归档、需要处理历史安全修复的用户，另读 [原始归档升级说明](docs/UPDATING-FROM-ORIGINAL.md)，不要仅因旧截图的版本号重复迁移。

## 本轮验证

生产构建、完整回归 **134/134**、Host **25/25**、Client **90/90**、发布与审核回归检查 **9/9**。检查覆盖名称/ID/描述、清单与版本一致性、新旧插件设置按钮、卸载清理与面板位置、宽行分类，以及当前库自定义配置目录排除和外库同名目录保留。旧客户端及真实 Obsidian 全功能没有在本轮逐项重新验收；已有截图和历史测试保留各自验证范围。
