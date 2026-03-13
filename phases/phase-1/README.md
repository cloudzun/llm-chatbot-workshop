# Phase 1 — 基础流式聊天

## 本阶段你将构建

- Express 后端服务器，代理转发 LLM 请求
- SSE（Server-Sent Events）流式输出
- 简洁的聊天前端界面（HTML/CSS/JS）
- Token 用量统计显示

**关键技术**: LLM API · Express · SSE · fetch streaming

---

## 目录说明

| 目录 | 说明 |
|------|------|
| `starter/` | 本阶段起点 — 没有 server.js，从零开始构建 |
| `completed/server.js` | 本阶段完成后的参考实现 |

---

## 从这里开始（Phase 1 起点）

```bash
# Phase 1 没有 starter server.js — 你将在本阶段亲手创建它
# 打开教材，跟着 AI 编程助手一步一步来：
```

📖 [学员教材 → Phase 1 章节](../../docs/teaching/student-textbook.md)

---

## 完成验证

- [ ] `npm run dev` 能正常启动，终端显示监听端口
- [ ] 浏览器打开 http://localhost:3000 看到聊天界面
- [ ] 发送一条消息，AI 回复以流式方式逐字显示
- [ ] 对话结束后显示 Token 用量统计
