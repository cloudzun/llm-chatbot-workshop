# Phase 2 — 参数调优面板

## 本阶段你将构建

- 前端参数控制面板（temperature、top_p、max_tokens、system prompt）
- 后端 `/api/chat` 接收并应用自定义参数
- 所有参数有安全默认值回退

**关键技术**: HTTP 请求体参数传递 · 实时参数调优

---

## 目录说明

| 目录 | 说明 |
|------|------|
| `starter/server.js` | Phase 1 完成状态 — 基础聊天服务器 |
| `completed/server.js` | Phase 2 完成后的参考实现 |

---

## 从这里开始

```bash
# 将本阶段起点复制到项目根目录
cp phases/phase-2/starter/server.js server.js

# 启动开发模式
npm run dev
```

📖 [学员教材 → Phase 2 章节](../../docs/teaching/student-textbook.md)

---

## 完成验证

- [ ] 前端界面出现 temperature、top_p 等参数滑块
- [ ] 调整 temperature 为 0（确定性回复）和 1（创意回复），发同一条消息感受差异
- [ ] 修改 system prompt 后，AI 的回复风格明显改变
