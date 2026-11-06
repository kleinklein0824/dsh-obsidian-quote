# 0.2.7 / v0.2.7 · 社区发布兼容与配套素材

发布日期：2026-11-06。

Obsidian 的提交校验禁止原 ID `obsidian-quote` 和名称 `Obsidian Quote`。新安装组件改为 **Vault Quote**、ID **`vault-quote`**、版本 **0.2.7**。这是同一插件的市场发布身份，原有面板和检索功能保留。设置按钮改为使用当前加载的 manifest id，避免改名后打不开设置。

## 文件选择

| 入口 | 文件 | 用途 |
| --- | --- | --- |
| `0.2.7` Release，无 `v` | `main.js`、`manifest.json`、`styles.css` | Obsidian 自动安装的三文件；标签与清单版本完全一致 |
| `v0.2.7` 配套发行 | `vault-quote-v0.2.7.zip` | 手动安装 Obsidian：解压 `vault-quote/` 到 `.obsidian/plugins/` |
| `v0.2.7` 配套发行 | `dsh-obsidian-quote-panel-0.5.1.tgz` | DeepSeek 首次安装用的 npm 格式预构建包；以 package.json 所在目录为根 |
| `v0.2.7` 配套发行 | `dsh-obsidian-quote-panel-v0.5.1.zip` | DeepSeek 原有本地目录安装方式；运行代码与既有 0.5.1 相同 |
| `v0.2.7` 配套发行 | `obsidian-quote-cli-mcp-v0.2.3.zip` | 既有 CLI、Skill、六工具 MCP 接入，运行代码不变 |
| `v0.2.7` 配套发行 | `dsh-obsidian-quote-github-v0.2.7.zip` | 完整仓库源码、Codex/Claude 市场清单、文档与真实面板截图 |
| `v0.2.7` 配套发行 | `Obsidian-Quote-promo-1080p.mp4` | 作者提供的原版 1920×1080、约 73 秒项目介绍视频 |
| `v0.2.7` 配套发行 | `Release-SHA256SUMS.txt`、`verification-evidence.json` | 文件校验与本轮验证证据 |

Codex 与 Claude 从仓库市场安装，Git 引用选择 `main` 或 `v0.2.7`，稀疏路径留空。Codex 接入 **0.1.4**，Claude 清单 **0.1.2**，不需要单独改为 Obsidian 的新 ID。

## 已安装用户

原本地 Obsidian Quote 和 DeepSeek 面板可以继续使用。此次未覆盖任何用户安装或配置。DeepSeek 0.5.1、Codex 0.1.4、Claude 0.1.2 与 CLI/MCP 0.2.3 的运行文件保持原样，无需为市场改名重装。

若迁移到 Obsidian 新 ID，先停用旧插件，把旧目录的 `data.json` 备份后复制到 `vault-quote/`，再启用新插件。不要同时启用新旧两套服务。旧知识库登记、目录范围、引用组合、令牌和台账随 `data.json` 保留。具体步骤见 [UPDATING.md](UPDATING.md) 和 [迁移说明](docs/OBSIDIAN-SUBMISSION.md)。

## 文档和目录申请

根 README 新增原视频的封面与观看入口，并保留作者实际 Codex、DeepSeek 面板截图。视频部分画面为演示设计，不作为真实客户端验收截图。Harness 子目录增加独立 README 与 screenshots.json，便于商店展示准确界面。

awesome-dsh 继续使用已有申请 **#12409**，不重复投稿。Obsidian 社区仍须作者使用自己的账户在 Community 网站提交并通过审核；GitHub Release 不等于已上架。

## 验证

- 生产构建和类型检查通过，原完整回归 **134/134**。
- Host 探针 **25/25**、Client 探针 **90/90**。
- 新增发布与实际设置按钮检查 **5/5**；先复现旧 ID/名称失败及新 ID 下的设置按钮错误，再修复至通过。
- DeepSeek 部署目录与源仓库 0.5.1 运行文件逐字节一致；共享配置与凭据未改动。
- 历史 Codex、浏览器、并发证据保留原验证范围，未冒充本轮重新完成全部真实客户端验收。
