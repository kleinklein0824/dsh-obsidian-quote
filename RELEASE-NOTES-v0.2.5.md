# Obsidian Quote v0.2.5（预发布）

本次为 **Codex 接入 0.1.4** 增加插件设置页的固定知识库面板按钮。点击后可选择知识库、输入关键词并直接查看结果；原有对话检索和对话面板继续保留。

## 使用入口

更新插件市场与 Obsidian Quote，按客户端提示刷新或重启 Codex，再进入：

**插件设置 → Obsidian Quote → Obsidian 知识库 → 打开知识库面板**。

保持已有 Obsidian 引用服务运行，面板会自动读取已有登记。知识库管理仍在 Obsidian。每个客户端的安装与使用方式见 [各 Harness 使用指南](docs/HARNESS-USAGE.md)，排查与更新步骤见 [UPDATING.md](UPDATING.md)。

## 本次变化

- 独立的 Codex 设置和 MCP Apps 面板服务，声明可选侧栏与会话入口；具体显示由客户端支持情况决定。
- 面板直接查询既有鉴权服务，不发送模型消息；令牌不进入页面。
- 同名库使用稳定 id 区分；失效来源须明确重选，不静默扩大检索范围。
- 补齐设置工具输出 schema，并覆盖有效慢速查询的响应时间。
- 保留原有六工具、setup Skill、对话面板和 DeepSeek 已实现配置。

## 组件与附件

| 内容 | 版本 / 文件 | 用途 |
| --- | --- | --- |
| Codex 接入 | 0.1.4 | 从本仓库市场安装；完整源码 ZIP 包含 `codex/` 原生面板 |
| 完整源码 | `dsh-obsidian-quote-github-v0.2.5.zip` | 两种市场清单、Codex 面板、所有组件源码与文档 |
| Obsidian 桌面插件 | `obsidian-quote-v0.2.3.zip`，或 `main.js` / `manifest.json` / `styles.css` | 与 v0.2.3 字节一致，已有可用安装无需更新 |
| DeepSeek Harness 面板 | `dsh-obsidian-quote-panel-v0.5.1.zip` | 与既有发布一致，保留正常使用的现有安装 |
| 原 CLI/MCP | `obsidian-quote-cli-mcp-v0.2.3.zip` | 原六工具接入；不包含新增 Codex 专用界面 |
| Claude 清单 | 0.1.2 | 完整源码中的独立 Claude 市场清单，继续提供六工具 |
| 更新与验证 | `UPDATING-zh-CN.md`、本说明、`verification-evidence.json`、`Release-SHA256SUMS.txt` | 排查、验证范围和附件校验 |

## 验证与边界

新设置协议 7/7；新面板独立浏览器点击 7/7（含连续两个 11 秒的有效慢速请求）；原对话面板 9/9；首次配置 6/6；实际 Codex 安装、自动启动两个服务、六工具、设置能力和 UI 资源均通过。

Obsidian、DeepSeek Harness 和原 CLI/MCP 的运行文件保持不变，六个组件附件直接复用 v0.2.3；134/134 核心、25/25 Host、90/90 Client、14/14 浏览器结果来自该版。源码和归档检查会排除本机凭据、真实笔记、配置文件、依赖目录与临时测试文件。

独立浏览器和实际运行时测试尚不能代替用户桌面设置按钮的可视点击验收；没有宣称所有 Harness 都有同样的原生面板，因此维持预发布。当前变更不要求重装 DeepSeek、重置令牌或改写共享连接。
