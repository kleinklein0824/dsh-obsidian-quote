# Codex 对话内知识库面板

仅用于当前会话具备 `visualize` 能力且用户要求在对话内显示面板的情况。先读取当前可用的 visualize Skill，并按它的规则返回内容引用；其他客户端保留其已有界面和 MCP 工作方式。此模板不提供原生桌面弹窗、固定侧栏、内嵌浏览器或后台检索。

调用当前会话的 `kb_vaults` 确认真正可用。连接成功后，把实际返回的库名、启用状态、篇数和分块数整理为一个公开字段快照文件；不复制工具返回的绝对路径或整个配置文件。`state: ready` 必须来自当前成功的工具调用；异常时按真实状态使用 `offline`、`auth-error` 或 `missing-config`，库列表可为空。日期填本次核查时间；服务版本仅在 setup 脚本实际返回时填写。

```json
{
  "state": "ready",
  "checkedAt": "2026-11-05T14:00:00Z",
  "serviceVersion": "0.2.3",
  "vaults": [{ "name": "示例库", "enabled": true, "docs": 12, "chunks": 24 }]
}
```

运行本 Skill 下的生成器，参数均为绝对路径，输出位置遵循 visualize Skill 的可写目录要求：

```text
node <本Skill目录>/scripts/render-panel.mjs --data <公开字段快照.json> --output <对话可视化目录>/obsidian-panel.html
```

随后按 visualize 的内容引用格式显示输出。原始模板 `panel.html` 含数据插槽，不直接展示。生成器只接受明确提供的快照，不读取连接配置、不访问服务；会丢弃未知字段并转义数据，片段不含网络请求。可选 `results` 是实际检索结果的 `{title,path,text}` 数组，`path` 使用笔记相对路径；按当前用户任务限制范围与数量，初次打开不主动读取笔记正文。

面板的按钮调用宿主 `sendFollowUpMessage` 请求后续对话。收到请求后，使用列出的真实 MCP 工具和 JSON 参数检索，保留来源警告，在新回复中显示实际结果；不得把按钮点击或面板状态当作已检索证据。刷新按钮请求重新调用 `kb_vaults`，并更新面板快照。宿主缺少发送入口或用户取消时，面板显示可复制的请求，不假报检索完成。

同名库无法在此名称选择器中消除歧义，需用户在对话中给出明确的库 id；保存的来源失效后要求重新选择，不静默扩大范围。面板无法修改知识库登记、令牌、服务端设置或 DeepSeek Harness 配置。
