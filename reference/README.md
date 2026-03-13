# reference/ — 各阶段参考代码说明

本目录包含课程每个阶段的**参考代码**（标准答案）。

---

## 用途

| 角色 | 使用方式 |
|------|----------|
| **讲师** | 带练时对照；开场演示时运行 |
| **学员** | 卡住时参考逻辑；完成后与自己的代码对比 |
| **课程制作团队** | 验证每个阶段可行性 |

> ⚠️ **参考代码不是给学员直接复制的。** 学员应通过与 OpenCode 对话，自己生成代码。

---

## 文件对应关系

| 文件 | 对应 Git 标签 | 新增能力 |
|------|--------------|---------|
| `phase-1-server.js` | `phase-1-basic-chat` | 基础聊天：SSE 流式输出 + Token 统计 |
| `phase-2-server.js` | `phase-2-param-tuning` | 参数面板：temperature / top_p / model / system prompt |
| `phase-3-server.js` | `phase-3-rag` | RAG：文档向量检索 + 知识库增强 System Prompt |
| `phase-4-server.js` | `phase-4-weather-api` | Function Calling：wttr.in 天气查询 |
| `phase-5-server.js` | `phase-5-mcp-news` | MCP：RSS 新闻阅读（feed-mcp） |
| `../server.js`（项目根） | `phase-6-duckduckgo` | 全功能：+ DuckDuckGo 搜索，多工具编排 |

每个阶段都**包含前一阶段的全部功能**，按增量演进。

---

## 如何运行某个阶段的参考代码

1. 确保项目根目录的 `.env` 已配置 API Key
2. 确保已执行 `npm install`
3. 从**项目根目录**运行：

```bash
# 运行 Phase 1 参考
node reference/phase-1-server.js

# 运行 Phase 2 参考
node reference/phase-2-server.js

# 以此类推...

# Phase 6（完整版）直接运行根目录
node server.js
```

> Phase 3 及以后依赖 `rag/` 和 `tools/` 模块，**必须从项目根目录运行**，不能进入 `reference/` 目录执行。

---

## 阶段差异速查

### Phase 1 → Phase 2（新增）
```
/api/chat 接收 params 对象：
  model, temperature, top_p, max_tokens,
  frequency_penalty, presence_penalty, system_prompt
```

### Phase 2 → Phase 3（新增）
```
新路由: POST /api/rag/build-index
/api/chat 接收 ragEnabled, rerankEnabled(进阶) 参数
RAG 流程: 检索 → 注入 system prompt → 发送 metadata 事件
```

### Phase 3 → Phase 4（新增）
```
tools 数组: [get_weather]
toolHandlers: { get_weather }
两次 LLM 调用流程:
  第一次流式 → 检测 tool_calls → 执行工具 →
  第二次流式（附工具结果） → 转发给前端
```

### Phase 4 → Phase 5（新增）
```
tools 数组增加: get_news
toolHandlers 增加: { get_news }  ← 通过 news.js MCP 客户端获取
```

### Phase 5 → Phase 6（新增）
```
tools 数组增加: search_web
toolHandlers 增加: { search_web }  ← DuckDuckGo Instant Answer API
```

---

## Git 标签管理

每个阶段完成后在对应 commit 上打标签：

```bash
git add -A
git commit -m "Phase 1: 基础聊天完成"
git tag phase-1-basic-chat

git add -A
git commit -m "Phase 2: 参数调优面板"
git tag phase-2-param-tuning

# ... 以此类推
```

查看所有标签：
```bash
git tag -l
```

切换到某个阶段的代码状态：
```bash
git checkout phase-3-rag   # 查看 Phase 3 完成时的代码状态
git checkout main          # 回到最新状态
```
