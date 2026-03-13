# AI Chatbot 渐进式演练项目 — PRD

> **版本**: v2 (Streamlit) | **日期**: 2026-03-13  
> **定位**: Track A / Track B 补充演练场景  
> **性质**: 分阶段教学演练项目

---

## 1. 项目定义

### 这个项目是什么

一个**分阶段教学演练项目**：学员在讲师指导下，通过与 AI 编程助手（OpenClaw / OpenCode）的自然语言对话，**亲手从零搭建**一个 AI 聊天机器人，每一轮迭代添加一个新能力。

- **不是**施工团队做好一个成品交给学员
- **而是**施工团队准备好教学素材，**让学员自己通过与 AI 对话把项目做出来**

### 为什么用 Streamlit

学员来学的是 **AI 应用开发概念**（LLM API、RAG、Function Calling、MCP），不是 Web 开发。Streamlit 让学员把 90% 的注意力放在 AI 核心知识上：

| 对比 | Node.js 方案 | Streamlit 方案 |
|------|-------------|---------------|
| Phase 1 代码量 | ~150行 + 4个文件 | **~25行 + 1个文件** |
| 聊天UI | 手写 HTML/CSS/JS | `st.chat_message()` 一行内置 |
| 参数滑块 | 手写前端控件 | `st.slider()` 一行 |
| 学员关注点 | 50%Web开发 + 50%AI | **90%+ 聚焦AI概念** |

### 学习目标

学员完成 6 个阶段后将：
- 理解 AI 应用核心架构（API 调用、RAG、Function Calling、MCP）
- 体验通过自然语言指令驱动 AI 编写代码的完整流程
- 拥有一个自己亲手搭建的、可运行的 AI 聊天机器人

### 受众

| 角色 | 体验方式 |
|------|----------|
| **非代码人员** | 全程用自然语言指令让 AI 生成代码 |
| **专业开发者** | 可深入理解架构，手写或优化代码 |

---

## 2. 技术环境

### 技术栈

```
语言: Python 3.10+
框架: Streamlit
AI SDK: openai (Python，兼容硅基流动)
```

### 大模型服务

| 项目 | 详情 |
|------|------|
| **平台** | 硅基流动 (SiliconFlow) |
| **API 格式** | OpenAI 兼容 |
| **默认模型** | `deepseek-ai/DeepSeek-V3.2` |
| **备选免费模型** | `Qwen/Qwen2.5-7B-Instruct` |
| **嵌入模型** | `BAAI/bge-m3`（免费） |
| **重排序模型** | `BAAI/bge-reranker-v2-m3`（免费，进阶） |

### 配置文件 `.streamlit/secrets.toml`

```toml
LLM_API_KEY = "sk-xxx"
LLM_BASE_URL = "https://api.siliconflow.cn/v1"
LLM_DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3.2"
EMBEDDING_MODEL = "BAAI/bge-m3"
RERANK_MODEL = "BAAI/bge-reranker-v2-m3"
```

> [!IMPORTANT]
> 通用命名，换供应商只改此文件。使用 `openai` Python SDK，天然兼容所有 OpenAI 格式服务。

---

## 3. 迭代阶段总览

| 阶段 | 学员完成后的能力 | 核心知识点 | 新增代码量 |
|------|----------------|-----------|-----------|
| **Phase 1** | 能和 AI 聊天 | LLM API、消息角色、流式输出 | ~25行 |
| **Phase 2** | 能调控 AI 参数 | temperature、top_p、Prompt Engineering | ~15行 |
| **Phase 3** | 能基于文档回答 | RAG、Embedding、向量检索；[进阶]重排序 | ~80行 |
| **Phase 4** | 能查实时天气 | Function Calling、工具调用 | ~50行 |
| **Phase 5** | 能读新闻 | MCP 协议 | ~40行 |
| **Phase 6** | 能搜索互联网 | 多工具编排 | ~30行 |

每阶段教学结构：
```
概念讲解（讲师）~10min → 现场演示 ~5min → 学员动手 ~20-30min → 验证讨论 ~10min
```

---

## 4. 各阶段设计

### Phase 1: 基础聊天

**学员通过 AI 对话构建**：一个 `app.py`，使用 Streamlit 聊天组件 + OpenAI SDK 与大模型对话。

**预期产出**：浏览器中的聊天界面，AI 回复逐字显示。

**知识点**：Chat Completions API、消息角色、流式输出、Token

---

### Phase 2: 参数调优

**学员通过 AI 对话添加**：侧边栏参数面板（`st.sidebar`），含 temperature / top_p / max_tokens 滑块、模型选择、System Prompt 编辑器。

**预期产出**：调参数 → 实时感受 AI 输出变化。

**知识点**：Temperature、Top-P、Prompt Engineering

**教学活动**：对比实验

---

### Phase 3: RAG 知识问答

**学员通过 AI 对话构建**：文档加载器 → 嵌入模块 → 向量检索 → RAG 增强。使用 `oneflower/` 易速鲜花文档。

**预期产出**：开启 RAG 后，Chatbot 能准确回答鲜花相关问题并显示引用来源。

**知识点**：RAG、Embedding、余弦相似度、Chunking；[进阶] Reranking

---

### Phase 4: API 对接 — 天气

**学员通过 AI 对话添加**：天气查询工具（wttr.in），实现 Function Calling 的"判断→执行→回答"流程。

**预期产出**：问天气返回实时数据，问其他话题正常聊天。

**知识点**：Function Calling、Tool Schema、两次调用模式

---

### Phase 5: MCP 对接 — 新闻

**学员通过 AI 对话添加**：MCP Client 连接 RSS MCP Server，获取新闻。

**预期产出**：问新闻返回最新条目。

**知识点**：MCP 协议、Server/Client

---

### Phase 6: 搜索引擎 — DuckDuckGo

**学员通过 AI 对话添加**：DuckDuckGo 搜索工具，实现多工具智能选择。

**预期产出**：天气/新闻/搜索/RAG 四种工具根据问题自动分派。

**知识点**：多工具编排、工具描述区分度

---

## 5. 项目文件结构（最终形态参考）

```
aigc-chatbot/
├── app.py                    # Streamlit 主应用
├── requirements.txt
├── .streamlit/
│   └── secrets.toml          # API 配置（通用命名）
├── oneflower/                # RAG 知识库 — 易速鲜花
├── rag/
│   ├── loader.py             # 文档加载与切分
│   ├── embeddings.py         # 向量嵌入
│   ├── vectorstore.py        # 向量存储与检索
│   └── reranker.py           # [进阶] 重排序
└── tools/
    ├── weather.py             # wttr.in 天气
    ├── search.py              # DuckDuckGo 搜索
    └── news.py                # MCP 新闻客户端
```

---

## 6. 施工团队交付物

| 交付物 | 说明 |
|--------|------|
| 每阶段参考代码 | Git 标签，学员做对了的"标准答案" |
| 每阶段提示词模板 | 学员给 OpenCode 输入的自然语言指令 |
| 讲师教案 | 每阶段讲解要点、演示脚本、常见问题应对 |
| 学生教科书 | 知识点讲解 + 操作指南 + 练习 |
| 易速鲜花文档 | `oneflower/` 目录知识库 |

---

## 7. 质量验收

**核心标准**：零基础学员，按教科书提示词输入 OpenCode，30 分钟内完成该阶段并看到效果。

| 风险 | 缓解措施 |
|------|----------|
| AI 生成代码有错 | 把报错贴给 OpenCode 说"帮我修"；参考代码可对照 |
| 额度耗尽 | 改 `secrets.toml` 切换免费模型或其他供应商 |
| 环境差异 | 提供 `requirements.txt` + 安装指南 |
