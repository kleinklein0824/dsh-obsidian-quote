# v0.2.4：Codex 对话内检索入口，保留已有 DeepSeek 环境

Codex 接入版本 **0.1.3** 新增对话内知识库面板的 setup Skill、无凭据数据生成器与模板。在具备对话可视化能力的 Codex 中输入“在 Codex 对话里显示 Obsidian 知识库面板”，即可查看实际连接快照、选择来源并请求 Codex 检索。按钮通过后续对话调用原有 MCP，结果显示在后续回复中；不是原生桌面弹窗、固定侧栏或实时网页。缺少宿主发送入口时提供可复制请求。

本版未更改 Obsidian、Harness 和 CLI/MCP 的代码、配置格式、清单或二进制。Obsidian / CLI-MCP 保持 **0.2.3**，Harness 面板保持 **0.5.1**，Claude 清单保持 **0.1.2**。已有正常工作的 DeepSeek 环境无需重装、重置令牌或重写接入配置。

## 下载选择

- `dsh-obsidian-quote-github-v0.2.4.zip`：本次完整源码与 Codex 0.1.3 接入；市场也可使用 `main` 或 `v0.2.4`。
- `obsidian-quote-v0.2.3.zip`、`obsidian-quote-cli-mcp-v0.2.3.zip`、`dsh-obsidian-quote-panel-v0.5.1.zip`：按原文件名提供，逐字节复用 v0.2.3 附件；已安装用户无需替换。
- `main.js`、`manifest.json`、`styles.css`：与 v0.2.3 相同，仅供需要首次安装 Obsidian 端的用户。
- `UPDATING-zh-CN.md`、`verification-evidence.json`、`Release-SHA256SUMS.txt`：当前更新指南、验证范围与校验值。

本版验证 Codex 新面板在合成桥接环境中的交互及实际 Codex MCP 启动；未把合成浏览器测试当作原生桌面弹窗验收。所有客户端均依赖运行中的本机 Obsidian 服务，知识库管理仍位于 Obsidian。安全迁移针对原始归档，按更新指南中的适用条件执行。
