# v0.2.3：修复 Codex 工具加载并补齐首次配置入口

旧接入包 0.1.0 / 0.1.1 虽能安装和显示 Skill，Codex 可能把 MCP 脚本路径中的 `${PLUGIN_ROOT}` 当作普通文字，导致 Node 找不到文件并在初始化时退出。Obsidian 服务正常时也会出现“知识库工具未加载”。此前由测试脚本展开路径的六工具测试未覆盖此问题；本版以实际 Codex 运行时回归补齐验证。

修复为完整根 `plugin.json` + `mcp.json` 格式，并注册首次配置 Skill。接入包版本 **0.1.2**；Obsidian / CLI-MCP 版本 **0.2.3**；Harness 面板保持 **0.5.1**。Obsidian 功能二进制与安全修复版相同；MCP 功能逻辑不变。

## 安装后怎么用

1. Codex 市场更新并安装 Obsidian Quote 0.1.2，重新加载会话。在插件详情运行“首次配置”，或输入“检查 Obsidian Quote 连接并打开面板”。
2. 添加知识库和修改范围：**Obsidian → 设置 → 第三方插件 → Obsidian Quote**，登记库目录并点击“写入接入配置”，重建索引。
3. 日常在 Codex 直接要求列出库、搜索笔记或检索规范。需要可视化检索时，让配置 Skill 打开本机浏览器面板；登录凭据保留在本机。

Codex 的配置入口是原生配置会话；本项目的 DeepSeek 侧栏依赖 Harness 界面接口。浏览器 `/ui` 提供检索与来源选择，知识库管理在 Obsidian。所有客户端复用同一服务配置，不扫描未登记目录。

## 下载

- `dsh-obsidian-quote-github-v0.2.3.zip`：完整源码，含两套客户端清单、首次配置和检索 Skill。
- `obsidian-quote-v0.2.3.zip`：Obsidian 安装包，保留原 data.json。
- `dsh-obsidian-quote-panel-v0.5.1.zip`：Harness 面板，内容不变。
- `obsidian-quote-cli-mcp-v0.2.3.zip`：CLI/MCP 和本机连接检查、打开面板脚本。
- `UPDATING-zh-CN.md`、`verification-evidence.json`、`Release-SHA256SUMS.txt`：更新指南、验证范围和校验值。

真实 Codex 运行时回归会由客户端自身启动 MCP 并枚举六工具，测试不替换占位符；六项首次配置状态检查也独立验证。真实宿主完整界面与用户操作验收仍有边界，保持预发布。

原始包的受影响凭据若尚未撤销，仍按 UPDATING.md 更换；本次客户端修复不自动更改令牌。历史 Release 保留快照，Codex 用户应使用本版。
