# Phase 4 — Function Calling：天气查询

## 本阶段你将构建

- 工具定义（JSON Schema 描述 `get_weather`）
- 流式工具调用检测 — 第一轮判断是否触发工具
- 工具执行（调用 wttr.in 免费天气 API）
- 第二轮携带工具结果的 LLM 请求
- 前端天气卡片展示

**关键技术**: Function Calling · 工具 Schema · 两轮流式请求

---

## 目录说明

| 目录 | 说明 |
|------|------|
| `starter/server.js` | Phase 3 完成状态 — 含 RAG，无工具调用 |
| `completed/server.js` | Phase 4 完成后的参考实现（需配合根目录 `tools/weather.js`） |

---

## 从这里开始

```bash
cp phases/phase-4/starter/server.js server.js
npm run dev
```

📖 [学员教材 → Phase 4 章节](../../docs/teaching/student-textbook.md)

---

## 完成验证

- [ ] 询问「北京今天天气怎么样」，AI 自动调用工具并返回真实天气数据
- [ ] 普通问题（非天气类）不触发工具，直接流式回复
- [ ] 天气响应中包含温度、天气状况等信息
