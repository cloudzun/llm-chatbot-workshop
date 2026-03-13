# Phase 5 — MCP 协议：RSS 新闻阅读

## 本阶段你将构建

- MCP Client 初始化（`@modelcontextprotocol/sdk`）
- stdio 子进程通信，连接 `feed-mcp` RSS 服务器
- `get_news` 工具定义与处理器
- 降级路径：MCP 不可用时直接解析 RSS XML
- `mcp/mcp-config.json` 配置文件

**关键技术**: MCP 协议 · stdio 子进程 · RSS 解析

---

## 目录说明

| 目录 | 说明 |
|------|------|
| `starter/server.js` | Phase 4 完成状态 — 含天气工具，无 MCP |
| `completed/` | Phase 5 完成后的参考实现（含 server.js + public/ + rag/ + tools/ + mcp/） |

---

## 从这里开始

```bash
cp -r phases/phase-5/starter/* .
npm run dev
```

📖 [学员教材 → Phase 5 章节](../../docs/teaching/student-textbook.md)

---

## 完成验证

- [ ] 询问「最新科技新闻」，AI 调用 MCP 工具并返回新闻列表
- [ ] 终端日志显示「MCP RSS Server 已连接」
- [ ] 天气工具和新闻工具可以在同一对话中使用
