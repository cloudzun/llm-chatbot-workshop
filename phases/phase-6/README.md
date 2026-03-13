# Phase 6 — 多工具编排：互联网搜索

## 本阶段你将构建

- `search_web` 工具定义（调用 DuckDuckGo Instant Answer，无需 API Key）
- 多工具共存的 `toolHandlers` 编排逻辑
- `tools/search.js` 搜索模块

**关键技术**: 多工具编排 · DuckDuckGo API · 工具路由

> 完成本阶段后，你的智能机器人具备：流式对话 + 参数调优 + RAG 知识问答 + 天气查询 + 新闻阅读 + 互联网搜索 — 六大能力！

---

## 目录说明

| 目录 | 说明 |
|------|------|
| `starter/server.js` | Phase 5 完成状态 — 含 MCP 新闻工具，无搜索 |
| `completed/server.js` | Phase 6 完整实现（同 `solution/server.js`） |

---

## 从这里开始

```bash
cp phases/phase-6/starter/server.js server.js
npm run dev
```

📖 [学员教材 → Phase 6 章节](../../docs/teaching/student-textbook.md)

---

## 完成验证

- [ ] 询问「最新 AI 进展」，AI 调用搜索工具返回实时结果
- [ ] 天气 / 新闻 / 搜索三个工具可以在同一对话中各自独立触发
- [ ] 与 `npm run solution` 运行的成品对比，功能一致 🎉
