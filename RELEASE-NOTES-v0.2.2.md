# v0.2.2 发行说明

2026-11-05。此版本将安全修复、Codex / Claude Code 插件市场接入及最新更新说明统一打包。仍标为预发布，真实 Obsidian / DeepSeek Harness 的安装验收尚待完成。

## 组件版本与代码变化

| 组件 | 版本 | 相较 v0.2.1 安全修复版 |
| --- | --- | --- |
| Obsidian 桌面插件 | 0.2.2 | 清单和包版本更新；`main.js` 功能代码相同 |
| DeepSeek Harness 面板 | 0.5.1 | 运行代码相同，包含此前的代理访问校验修复 |
| CLI / MCP | 0.2.2 | MCP 声明版本更新；功能逻辑相同，技能示例已校正 |
| Codex / Claude Code 接入包 | 0.1.1 | 完整源码中包含两套市场清单、MCP 配置及共享 Skill |

原始 7z 到 v0.2.1 已修复凭据泄露、会话失效、网络访问校验、来源过滤与规则去重等问题。本次保留这些修复，并补齐正式发行附件；已完整安装安全修复版且换过令牌的用户，无需再次更换安全的新令牌。历史 v0.2.1 标签和附件保留其原始快照。

## 下载哪个附件

| 附件 | 用途 |
| --- | --- |
| `dsh-obsidian-quote-github-v0.2.2.zip` | 与 v0.2.2 / main 同步的完整源码，包含隐藏目录中的 Codex / Claude 市场清单 |
| `obsidian-quote-v0.2.2.zip` | Obsidian 插件安装包；也可使用单独的 `main.js`、`manifest.json`、`styles.css` |
| `dsh-obsidian-quote-panel-v0.5.1.zip` | DeepSeek Harness 专用面板；需宿主支持相应安装接口 |
| `obsidian-quote-cli-mcp-v0.2.2.zip` | CLI、stdio MCP 和传统 Skill 目录 |
| `UPDATING-zh-CN.md` | 已安装用户的排查、令牌更换、更新和验收步骤，与仓库 UPDATING.md 一致 |
| `verification-evidence.json` | 实际验证结果及其范围 |
| `Release-SHA256SUMS.txt` | 本次全部人工上传附件的 SHA256 校验值（不含该清单自身） |

GitHub 自动生成的 Source code ZIP / tar.gz 也来自本次 v0.2.2 标签。手工源码 ZIP 与提交树逐文件核对；请保留以点开头的市场目录。

## 安装入口

- Codex：添加本仓库为插件市场，Git 引用 `main` 或 `v0.2.2`，稀疏路径留空，再安装并启用 Obsidian Quote。
- Claude Code：`/plugin marketplace add kleinklein0824/dsh-obsidian-quote`，然后 `/plugin install obsidian-quote@dsh-obsidian-quote`。
- DeepSeek Harness：按 [UPDATING.md](UPDATING.md) 更新面板、实际运行的 Obsidian 插件和已复制的 CLI/MCP；重启 Host / MCP。

所有接入仍需本机运行 Obsidian 服务、写入本地接入配置，并让客户端能运行 Node.js。其他客户端需要支持本地 stdio MCP；普通 Obsidian HTTP API 不是远程 MCP 端点。

完整更新与验收要求见 [UPDATING.md](UPDATING.md)。原始包的受影响令牌若尚未撤销，必须按说明更换；发布新代码不会自动更新真实安装或撤销旧凭据。
