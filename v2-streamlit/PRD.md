# AI Chatbot 渐进式演练项目 — PRD（Python / Streamlit 版）

> **版本**: v2-streamlit | **日期**: 2026-03-13
> **定位**: 面向有代码经验学员的演练路径（与 Node.js v1 并行，功能对等）
> **性质**: 分阶段教学演练项目，独立代码仓库

---

## 1. 项目定义

### 这个项目是什么

一个**分阶段教学演练项目**：学员在讲师指导下，通过与 AI 编程助手（OpenCode）的自然语言对话，**亲手从零搭建**一个 AI 聊天机器人，每一轮迭代添加一个新能力。

- **不是**施工团队做好成品交给学员
- **而是**施工团队准备好教学素材，**让学员自己通过与 AI 对话把项目做出来**

### 为什么选 Streamlit

面向**有代码基础**的学员。Streamlit 既足够简洁（不用写 HTML/CSS/JS），又足够透明（状态管理、路由、API 调用全部显式可见）。学员可以真正读懂每一行代码，而不只是"运行起来了"。

| 对比 | Node.js v1 版 | Python Streamlit v2 版 |
|------|--------------|------------------------|
| 目标学员 | 零基础 / 非技术 | **有代码经验** |
| Phase 1 文件数 | 4 个（server.js + 3 个前端文件） | **1 个（app.py）** |
| 状态管理 | 隐式（浏览器状态 + 后端 session） | **显式 `session_state`，可逐行解读** |
| Function Calling 可见性 | 前后端分离，调试复杂 | **单文件，`st.expander` 实时展示中间状态** |
| 教学侧重 | AI 概念 + Web 开发并行 | **90%+ 聚焦 AI 概念** |

### 学习目标

学员完成 6 个阶段后将：
1. 理解 AI 应用核心架构（LLM API → RAG → Function Calling → MCP → 多工具编排）
2. 能用 Python 独立搭建可运行的 AI 聊天机器人
3. 体验通过自然语言指令驱动 AI 编写代码的完整流程

### 受众

| 角色 | 体验方式 |
|------|----------|
| **Python 开发者** | 理解每行代码，手动优化或扩展 |
| **数据/AI 工程师** | 快速上手 LLM 应用架构，聚焦核心逻辑 |
| **有编程经验的非专业者** | 用自然语言指令让 AI 生成代码，理解基本原理 |

---

## 2. 技术环境

### 技术栈

```
语言:     Python 3.10+
框架:     Streamlit ≥ 1.35
AI SDK:   openai（Python，OpenAI 兼容协议）
其他依赖:  requests, numpy, mcp, pypdf, python-docx
```

### 大模型服务

| 项目 | 详情 |
|------|------|
| **平台** | 硅基流动 (SiliconFlow) |
| **API 格式** | OpenAI 兼容 |
| **默认对话模型** | `deepseek-ai/DeepSeek-V3` |
| **备选免费模型** | `Qwen/Qwen2.5-7B-Instruct` |
| **嵌入模型** | `BAAI/bge-m3`（免费） |
| **重排序模型** | `BAAI/bge-reranker-v2-m3`（免费，进阶） |

### 配置：`.streamlit/secrets.toml`

```toml
LLM_API_KEY       = "sk-xxx"
LLM_BASE_URL      = "https://api.siliconflow.cn/v1"
LLM_DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3"
EMBEDDING_MODEL   = "BAAI/bge-m3"
RERANK_MODEL      = "BAAI/bge-reranker-v2-m3"
```

> 通用命名，换供应商只改此一个文件。

### `requirements.txt`（阶段累积版）

```
# Phase 1-2
streamlit>=1.35
openai>=1.0

# Phase 3 追加
numpy
pypdf
python-docx

# Phase 4 追加
requests

# Phase 5 追加
mcp
# nest_asyncio  # Windows + Streamlit 事件循环冲突时取消注释

# Phase 6（选修）
# duckduckgo-search
```

### 知识库文档（与 v1 共用）

`oneflower/` 目录：
- `易速鲜花员工手册.pdf`
- `易速鲜花运营指南.docx`
- `花语大全.txt`

---

## 3. 迭代阶段总览

| 阶段 | 学员完成后的能力 | 核心知识点 | 新增代码量 |
|------|----------------|-----------|-----------|
| **Phase 1** | 能和 AI 聊天（多轮，流式） | LLM API、消息角色、流式输出、Token | ~35 行 |
| **Phase 2** | 能调控 AI 参数 | Temperature、Top-P、Prompt Engineering | ~25 行 |
| **Phase 3** | 能基于文档回答（RAG） | Embedding、向量检索、余弦相似度；[进阶] Reranking | ~120 行 |
| **Phase 4** | 能查实时天气 | Function Calling、Tool Schema、两次调用模式 | ~60 行 |
| **Phase 5** | 能读新闻（MCP） | MCP 协议、Server/Client、asyncio、降级策略 | ~60 行 |
| **Phase 6** | 能搜索互联网（选修） | 多工具编排、工具描述区分度 | ~30 行 |

每阶段教学节奏（参考）：
```
概念讲解（讲师）~10min → 现场演示 ~5min → 学员实操 ~25min → 验证答疑 ~10min
```

---

## 4. 各阶段详细设计

### Phase 1：基础聊天

**预期产出**：`app.py`，浏览器聊天界面，多轮对话，AI 回复逐字流式显示。

**核心技术点**：
- `st.session_state.messages` — 维护对话历史（Streamlit 每次交互重新执行整个脚本）
- `client.chat.completions.create(stream=True)` + `st.write_stream()` — 流式输出
- 消息角色：`system` / `user` / `assistant`

**验收**：多轮对话上下文保持；侧边栏「清空对话」按钮生效。

---

### Phase 2：参数调优面板

**预期产出**：在 Phase 1 基础上，侧边栏增加完整参数控制。

**新增控件**：
- `st.selectbox` — 模型（DeepSeek-V3 / Qwen2.5-7B-Instruct / DeepSeek-R1）
- `st.slider` — temperature（0.0 → 2.0，默认 0.7）
- `st.slider` — top_p（0.0 → 1.0，默认 0.9）
- `st.number_input` — max_tokens（默认 1024）
- `st.text_area` — System Prompt（可实时编辑）

**教学活动**：同一问题 × temperature = 0 / 0.7 / 1.5 对比实验，记录差异。

---

### Phase 3：RAG 知识问答

**预期产出**：挂载 `oneflower/` 知识库，开启 RAG 后准确回答鲜花相关问题并显示引用来源。

**新增文件**：
```
rag/
├── loader.py        # load_and_chunk()：加载 .txt/.md/.pdf/.docx，切分 ~500字片段，100字重叠
├── embeddings.py    # get_embeddings()：调用嵌入 API，返回向量列表
├── vectorstore.py   # build_index()：生成并保存 vectorstore.json
│                    # search()：余弦相似度检索，返回 top-K 片段
└── reranker.py      # [进阶] rerank()：调用 /rerank API 对粗检索结果精排
```

**app.py 变化**：
- 侧边栏：「知识库模式」`st.toggle` + 「构建索引」`st.button`
- 构建索引后用 `@st.cache_data` 缓存，避免重复调 API
- 检索结果拼入 `system` 消息上下文
- AI 回复下方 `st.expander`：显示引用片段 + 相似度分数 + 来源文件名

**[进阶]** `reranker.py`：粗检索 top-10 → 重排序 → 取 top-3，侧边栏加「启用重排序」开关。

---

### Phase 4：Function Calling — 天气

**预期产出**：问天气返回实时数据（`st.metric` 卡片），问其他话题正常聊天。

**新增文件**：`tools/weather.py`（封装 `wttr.in/{city}?format=j1`）

**app.py 两阶段 Function Calling 逻辑**：
```
第1次调用（非流式，传 tools 参数）
  └─ finish_reason == "tool_calls"?
       ├─ 是：解析 tool_calls → 执行 weather.py → 追加 tool 角色消息 → 第2次调用（流式）
       └─ 否：直接流式输出（普通对话）
```

天气卡片：用 `st.columns` + `st.metric` 展示温度 / 体感 / 湿度 / 天气描述。

---

### Phase 5：MCP — 新闻

**预期产出**：问新闻返回最新条目（`st.expander` 逐条展示），天气工具共存。

**新增文件**：`tools/news.py`

**实现策略（与 v1 Node.js 版对等）**：
- **主路径**：`mcp` Python SDK，`StdioServerParameters` 启动 `feed-mcp`（npx），调用 `get_feed` 工具
- **降级路径**：MCP 初始化失败时，直接 `requests.get` 抓 RSS XML，用正则解析 `<item>` 条目
- **asyncio 处理**：`asyncio.run()` 包裹 MCP 调用；Windows 下若有事件循环冲突，使用 `nest_asyncio.apply()`

**RSS 源（国内可访问，每次最多 10 条）**：

| topic | 源 |
|-------|-----|
| tech | `https://hnrss.org/frontpage` |
| general | `https://www.oschina.net/news/rss` |
| world | `https://rss.dw.com/xml/rss-zh-all` |
| finance | `https://36kr.com/feed` |

---

### Phase 6：搜索引擎（选修）

**预期产出**：四工具自动分派（天气 / 新闻 / 搜索 / RAG），演示工具描述对 LLM 决策的影响。

**新增文件**：`tools/search.py`

**实现策略（降级友好）**：
- 直接调 DuckDuckGo Instant Answer API（`api.duckduckgo.com?format=json`，无需 Key）
- 中文查询加 `kl=cn-zh` 偏好参数
- 无结果时返回必应 / 百度搜索链接（作为 `relatedTopics`），不返回空结果

**`duckduckgo-search`** Python 包在 `requirements.txt` 中注释掉，作为"想深入的学员自行安装"的选项。

---

## 5. 项目文件结构（最终形态）

```
aigc-chatbot-python/              ← 学员自己在本地创建的工作目录
├── app.py                        # Streamlit 主应用（6 阶段增量扩充）
├── requirements.txt
├── .streamlit/
│   └── secrets.toml              # API 密钥（不进 Git）
├── oneflower/                    # RAG 知识库
│   ├── 易速鲜花员工手册.pdf
│   ├── 易速鲜花运营指南.docx
│   └── 花语大全.txt
├── rag/
│   ├── loader.py
│   ├── embeddings.py
│   ├── vectorstore.py
│   ├── vectorstore.json          # 构建后自动生成
│   └── reranker.py               # [进阶]
└── tools/
    ├── weather.py
    ├── news.py
    └── search.py                 # [选修]
```

---

## 6. 仓库结构（教学素材）

所有教学素材存放于本仓库的 `python/` 目录（与 `phases/` 同级），采用与 Node.js 版**一致的双目录结构**：

```
python/
├── phases/
│   ├── phase-1/
│   │   ├── starter/              # 学员起点（骨架 + TODO 注释）
│   │   │   ├── app.py
│   │   │   ├── requirements.txt
│   │   │   └── .streamlit/
│   │   │       └── secrets.toml.example
│   │   ├── completed/            # 参考答案（可直接运行）
│   │   │   └── app.py
│   │   └── README.md             # 本阶段学习指南 + 提示词模板
│   ├── phase-2/
│   │   ├── starter/
│   │   ├── completed/
│   │   └── README.md
│   ├── phase-3/
│   │   ├── starter/
│   │   ├── completed/
│   │   │   ├── app.py
│   │   │   └── rag/
│   │   └── README.md
│   ├── phase-4/
│   │   ├── starter/
│   │   ├── completed/
│   │   │   ├── app.py
│   │   │   ├── rag/
│   │   │   └── tools/
│   │   │       └── weather.py
│   │   └── README.md
│   ├── phase-5/
│   │   ├── starter/
│   │   ├── completed/
│   │   │   ├── app.py
│   │   │   ├── rag/
│   │   │   └── tools/
│   │   │       ├── weather.py
│   │   │       └── news.py
│   │   └── README.md
│   └── phase-6/
│       ├── starter/
│       ├── completed/
│       │   ├── app.py
│       │   ├── rag/
│       │   └── tools/
│       │       ├── weather.py
│       │       ├── news.py
│       │       └── search.py
│       └── README.md
└── docs/
    ├── student-textbook.md       # 学员教科书
    └── prompt-templates.md       # 施工团队提示词手册
```

每个 `completed/` 目录是独立可运行状态（含完整 `requirements.txt`）。

---

## 7. 施工交付物清单

| 交付物 | 路径 | 说明 |
|--------|------|------|
| 参考代码 | `python/phases/phase-N/completed/` | 每阶段独立可运行，Git 标签 `py-phase-N` |
| 学员起点 | `python/phases/phase-N/starter/` | 骨架代码 + TODO 注释 |
| 阶段指南 | `python/phases/phase-N/README.md` | 提示词模板 + 验收清单 |
| 学员教科书 | `python/docs/student-textbook.md` | 概念讲解 + 操作步骤 |
| 施工手册 | `python/docs/prompt-templates.md` | 内部用，提示词精确版 + 参考架构 |

---

## 8. 质量标准

**核心标准**：有代码基础的学员，按 `README.md` 中提示词输入 OpenCode，30 分钟内完成该阶段并看到预期效果。

| 风险 | 缓解措施 |
|------|----------|
| AI 生成代码有语法错误 | 把报错贴给 OpenCode "帮我修"；`completed/` 可对照 |
| MCP + Streamlit 事件循环冲突（Windows） | `news.py` 内置双路径；`nest_asyncio` 备选 |
| DuckDuckGo 国内访问不稳定 | 无结果时返回必应/百度链接；Phase 6 标注选修 |
| 嵌入 API 首次构建索引慢 | `@st.cache_data` 缓存；提前告知学员等待 |
| API 额度耗尽 | 改 `secrets.toml` 换 `Qwen/Qwen2.5-7B-Instruct`（免费） |
| `pip install` 慢 | 提供清华镜像命令：`pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt` |

---

## 9. 与 v1（Node.js）版对比

| 项目 | v1 Node.js | v2 Python/Streamlit |
|------|------------|---------------------|
| 目标学员 | 零基础 / 非技术 | 有代码经验 |
| 工作目录命名 | `aigc-chatbot/` | `aigc-chatbot-python/` |
| 主入口 | `server.js` + `public/` | `app.py`（单文件） |
| 配置 | `.env` | `.streamlit/secrets.toml` |
| 工具模块 | `tools/*.js` | `tools/*.py` |
| RAG 模块 | `rag/*.js` | `rag/*.py` |
| 知识库 | `oneflower/`（共用） | `oneflower/`（共用）|
| 搜索实现 | 直接 fetch DDG API | 直接 fetch DDG API（对等） |
| 新闻实现 | MCP 主路径 + RSS 降级 | MCP 主路径 + RSS 降级（策略对等） |
| 阶段数 | 6 | 6（功能对等） |
