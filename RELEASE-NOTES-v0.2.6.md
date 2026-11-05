# Obsidian Quote v0.2.6（文档预发布）

本版补充不同 Harness 安装后的实际界面截图、准确的 Codex 按钮名称，以及多客户端共用服务的说明。**运行代码与 v0.2.5 完全相同**，已有可用安装无需为文档更新重装。四份插件/市场清单只移除额外的个人邮箱，联系方式保留在根 README；启动设置和组件版本不变。

## 实际入口

- Codex 桌面版：插件 → Obsidian Quote → 设置 → 点击右侧“Obsidian 知识库”。选择来源、填写关键词并查询；保留原有对话方式。
- DeepSeek Harness：继续使用左侧“知识库”及原有配置。
- Codex CLI / Claude Code：使用六工具和对话；可选本机浏览器 `/ui`。没有未经验证的原生界面截图。

用户截图确认当前 Codex 设置入口、弹出面板及连接状态，以及 DeepSeek 已有侧栏；Codex 截图尚未执行查询，不据此声称桌面查询结果已验收。公开副本已遮挡私人名称。

## 共用端口与验证

多个 Harness 是同一个 Obsidian 服务的客户端，连接同一个实际 URL 和令牌不会争抢监听端口。多个 Obsidian 服务实例才有端口占用；插件尝试配置端口及后续 9 个端口。共享引用统计会合并，多个服务写同一用户级接入文件会相互覆盖；详见 [各 Harness 使用指南](docs/HARNESS-USAGE.md#多个-harness-共用同一知识库与端口)。

本轮隔离验证 6/6：4 个 stdio 客户端，48 次 HTTP 与 32 次 MCP 并发检索，来源正确、台账累计 80 次、测试笔记未修改；包含重复启动、端口顺延和并发重建。没有访问用户真实笔记或写用户配置。历史的 Codex / setup / UI 和核心测试记录按原验证版本注明，不冒充本次全部重跑。

## 附件与版本

| 附件/组件 | 内容 |
| --- | --- |
| `dsh-obsidian-quote-github-v0.2.6.zip` | 当前标签完整源码，含新截图、说明和验证记录 |
| Codex 接入 0.1.4、Claude 清单 0.1.2 | 完整源码内；运行内容与 v0.2.5 相同 |
| `obsidian-quote-v0.2.3.zip`、`main.js`、`manifest.json`、`styles.css` | 复用原组件，字节不变 |
| `dsh-obsidian-quote-panel-v0.5.1.zip` | 复用现有 DeepSeek 组件，字节不变 |
| `obsidian-quote-cli-mcp-v0.2.3.zip` | 复用原六工具组件，字节不变 |
| `UPDATING-zh-CN.md`、本说明、`verification-evidence.json`、`Release-SHA256SUMS.txt` | 更新方法、验证边界及校验值 |

本版不更新用户 DeepSeek 安装，不重置令牌、不改 profile、不改知识库登记和来源组合。已正常工作的环境继续使用；对最初归档的历史修复按 [UPDATING.md](UPDATING.md) 核对后处理。历史 Release/tag 保留。
