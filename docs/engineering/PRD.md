# AI Chatbot 渐进式演练项目 — 产品需求文档 (PRD)

> **版本**: v2.0 | **日期**: 2026-03-13  
> **定位**: Track A / Track B 补充演练场景  
> **项目性质**: 教学演练项目（非成品交付）

---

## 1. 项目定义

### 1.1 这个项目是什么

这是一个**教学演练项目**——学员在讲师指导下，通过与 AI 编程助手（OpenClaw / OpenCode）的自然语言对话，**亲手从零搭建**一个 AI 聊天机器人，并逐步为它添加新能力。

**不是**由施工团队做好一个成品交给学员使用。  
**而是**施工团队准备好教学素材和环境，**让学员自己通过与 AI 对话把项目做出来**。

### 1.2 学习目标

学员完成全部 6 个阶段后，将：

- 理解 AI 应用的核心架构（API 调用、RAG、Function Calling、MCP）
- 体验通过自然语言指令驱动 AI 编写代码的完整流程
- 拥有一个自己亲手搭建的、可运行的 AI 聊天机器人
- 具备独立构建简单 AI 应用的信心和基础认知

### 1.3 受众

| 角色 | 特征 | 体验方式 |
|------|------|----------|
| **非代码人员** | 产品经理、运营、管理者 | 全程用自然语言指令让 AI 生成代码，专注理解概念 |
| **专业开发者** | 前端/后端/全栈工程师 | 可选择手写代码或加深理解 AI 辅助开发的工作流 |

### 1.4 核心原则

- **学员自己动手**：所有代码由学员通过与 OpenClaw/OpenCode 对话产生，不是复制粘贴
- **渐进式迭代**：每个阶段在上一阶段的基础上增量添加一个新能力
- **所有外部服务免费**：零成本完成全部演练
- **通用接口设计**：基于 OpenAI 兼容格式，改 `.env` 即可切换供应商

---

## 2. 演练阶段设计

### 阶段总览

| 阶段 | 学员完成后获得的能力 | 新增知识点 | 外部服务 |
|------|---------------------|-----------|----------|
| **Phase 1** | 一个能聊天的 AI 界面 | LLM API、消息角色、流式输出、Token 统计 | 硅基流动 |
| **Phase 2** | 能调控 AI "性格"的参数面板 | temperature、top_p、Prompt Engineering | 同上 |
| **Phase 3** | 能读懂私有文档的知识问答 | RAG、Embedding、向量检索；[进阶] 重排序 | 硅基流动嵌入模型 |
| **Phase 4** | 能查实时天气 | Function Calling、工具定义、两次调用模式 | wttr.in（免费） |
| **Phase 5** | 能读新闻 | MCP 协议、Server/Client | RSS MCP Server（免费） |
| **Phase 6** | 能搜索互联网 | 多工具编排、搜索增强 | DuckDuckGo（免费） |

### 每阶段的教学结构

```
1. 概念讲解（讲师）     ~10 分钟
2. 现场演示（讲师）     ~5 分钟  — 展示最终效果
3. 学员动手（学员）     ~20-30 分钟 — 用 OpenCode 自然语言指令搭建
4. 验证与讨论（共同）   ~10 分钟
```

---

## 3. 技术环境

### 3.1 学员操作环境

- **本地计算机**：需安装 Node.js 18+
- **AI 编程助手**：OpenClaw 或 OpenCode（已预装或现场安装）
- **浏览器**：Chrome / Edge

### 3.2 大模型服务

| 项目 | 详情 |
|------|------|
| **平台** | 硅基流动 (SiliconFlow) |
| **API 格式** | 兼容 OpenAI Chat Completions |
| **默认模型** | `deepseek-ai/DeepSeek-V3.2` |
| **备选免费模型** | `Qwen/Qwen2.5-7B-Instruct` |
| **嵌入模型** | `BAAI/bge-m3`（免费） |
| **重排序模型** | `BAAI/bge-reranker-v2-m3`（免费，进阶用） |

### 3.3 `.env` 配置设计（通用性）

```env
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://api.siliconflow.cn/v1
LLM_DEFAULT_MODEL=deepseek-ai/DeepSeek-V3.2
EMBEDDING_MODEL=BAAI/bge-m3
PORT=3000
```

> [!IMPORTANT]
> 所有 API 调用通过 `.env` 中的通用变量（`LLM_*` 前缀）读取。学员日后替换为 OpenAI、Azure、Ollama 等任何 OpenAI 兼容服务时，只需改此文件。

### 3.4 技术栈

```
前端: HTML + CSS + JavaScript（原生）
后端: Node.js + Express
```

---

## 4. 各阶段详细设计

### Phase 1: 基础聊天

**学员目标**：通过与 OpenCode 对话，搭建出一个能与 AI 聊天的网页

**学员需要告诉 AI 做的事**：
1. 创建 Node.js 项目，安装 express + dotenv
2. 创建 `.env` 配置文件
3. 创建后端 `server.js`：提供 `/api/chat` 接口，代理转发到 LLM API（流式）
4. 创建前端聊天界面：深色主题、消息气泡、流式显示、Token 用量统计栏
5. 运行并测试

**预期产出**：
- 能在浏览器里和 AI 对话
- AI 回复逐字出现（流式效果）
- 底部显示每次对话消耗的 Token 数量

**知识点**：Chat Completions API、消息角色（system/user/assistant）、SSE 流式输出、Token 概念

---

### Phase 2: 参数调优面板

**学员目标**：给聊天界面添加参数控制面板，体验不同参数对 AI 输出的影响

**学员需要告诉 AI 做的事**：
1. 在界面添加可折叠侧边栏
2. 添加 temperature、top_p、max_tokens 等滑块控件
3. 添加模型选择下拉框（DeepSeek-V3.2 / Qwen2.5-7B / DeepSeek-R1）
4. 添加 System Prompt 编辑框
5. 修改后端接收并使用这些参数

**预期产出**：
- 能通过滑块调整参数，实时感受输出变化
- 能切换不同模型对比效果
- 能自定义 System Prompt 改变 AI "人设"

**知识点**：Temperature、Top-P、Prompt Engineering

**教学活动**：对比实验（同一问题，不同 temperature）

---

### Phase 3: RAG 知识问答

**学员目标**：让 Chatbot 能基于"易速鲜花"文档回答问题

**学员需要告诉 AI 做的事**：
1. 创建文档加载器（读取 `oneflower/` 目录，切分为片段）
2. 创建嵌入模块（调用 BAAI/bge-m3 生成向量）
3. 创建向量存储（余弦相似度检索，JSON 持久化）
4. 修改后端：添加"构建索引"接口 + RAG 模式增强 System Prompt
5. 修改前端：添加"知识库模式"开关 + 显示参考来源
6. **[进阶]** 添加重排序模块（`BAAI/bge-reranker-v2-m3`）

**预期产出**：
- 开启知识库模式后，Chatbot 能准确回答易速鲜花相关问题
- 能看到 AI 引用了哪些文档片段
- [进阶] 开启重排序后检索精度提升

**知识点**：RAG、Embedding、余弦相似度、文档切分；[进阶] Reranking

---

### Phase 4: API 对接 — 天气查询

**学员目标**：让 Chatbot 能实时查天气

**学员需要告诉 AI 做的事**：
1. 创建天气工具模块（封装 wttr.in API）
2. 在后端定义 Function Calling 工具描述
3. 实现"两次调用"模式（判断工具 → 执行 → 返回结果给 LLM）
4. 前端添加天气卡片渲染

**预期产出**：
- 问"北京天气怎么样"，Chatbot 返回实时天气
- 问非天气问题，正常聊天（不会误触发工具）

**知识点**：Function Calling、工具定义 Schema、两次调用模式

---

### Phase 5: MCP 对接 — 新闻阅读

**学员目标**：通过 MCP 协议让 Chatbot 读取新闻

**学员需要告诉 AI 做的事**：
1. 安装 MCP SDK
2. 创建 MCP Client 封装（连接 RSS MCP Server）
3. 配置 RSS 新闻源
4. 在工具列表中添加 `get_news` 工具
5. 前端添加新闻卡片渲染

**预期产出**：
- 问"今天有什么新闻"，返回最新 RSS 新闻条目

**知识点**：MCP 协议、Server/Client 模式、RSS

---

### Phase 6: 搜索引擎 — DuckDuckGo

**学员目标**：赋予 Chatbot 联网搜索能力，并体验多工具编排

**学员需要告诉 AI 做的事**：
1. 创建搜索工具模块（封装 DuckDuckGo Instant Answer API）
2. 在工具列表中添加 `search_web` 工具
3. 测试多工具场景（天气/新闻/搜索/RAG 正确分派）

**预期产出**：
- Chatbot 拥有天气、新闻、搜索、知识库四种工具
- 能根据问题类型自动选择合适的工具

**知识点**：多工具编排、工具描述的区分度

---

## 5. 施工团队需要交付的内容

> [!IMPORTANT]
> 施工团队**不是在做一个成品 APP**。施工团队的任务是制作**教学素材**，让讲师能带着学员一步步搭建。

| 交付物 | 说明 |
|--------|------|
| **每阶段的参考代码** | 每个 Phase 完成后的"标准答案"代码（Git 标签），用于讲师演示和学员对照 |
| **每阶段的提示词模板** | 学员应该给 OpenCode 输入的自然语言指令（含零代码路径和代码路径） |
| **讲师教案** | 每阶段的讲解要点、演示脚本、常见问题应对 |
| **学生教科书** | 知识点讲解 + 操作指南 + 练习题（已有初稿） |
| **易速鲜花示例文档** | `oneflower/` 目录下的知识库文件 |
| **环境检查脚本** | 一键检测学员电脑是否满足运行条件 |

### 参考代码的定位

参考代码**不是给学员复制的**，而是：
1. 让讲师知道每个阶段"做对了"应该是什么样
2. 学员卡住时可以对照参考
3. 确保课程设计是可行的（验证过的）

### 代码管理

```
git tag phase-1-basic-chat
git tag phase-2-param-tuning
git tag phase-3-rag
git tag phase-4-weather-api
git tag phase-5-mcp-news
git tag phase-6-duckduckgo
```

---

## 6. 质量验收标准

每个 Phase 的验收标准是：**一个零基础学员，按照教科书的指引，通过与 OpenCode 对话，能在 30 分钟内完成该阶段的搭建并看到预期效果。**

| 检验维度 | 标准 |
|----------|------|
| **提示词有效性** | 学员按教科书中的提示词输入 OpenCode，生成的代码能直接运行 |
| **知识讲解清晰度** | 非技术人员读完概念讲解后能回答自测练习 |
| **错误容忍度** | AI 生成的代码若有小错，教科书中有排查指引 |
| **阶段衔接性** | Phase N 的代码能无缝在 Phase N-1 的基础上增量添加 |

---

## 7. 项目目录结构（最终形态参考）

```
aigc-chatbot/
├── server.js                 # Express 后端
├── package.json
├── .env                      # 通用 API 配置（OpenAI 兼容）
├── public/                   # 前端
│   ├── index.html
│   ├── style.css
│   └── app.js
├── oneflower/                # RAG知识库 — 易速鲜花
├── rag/                      # RAG 模块
│   ├── loader.js
│   ├── embeddings.js
│   ├── vectorstore.js
│   └── reranker.js           # [进阶]
├── tools/                    # 工具模块
│   ├── weather.js
│   ├── search.js
│   └── news.js
└── mcp/
    └── mcp-config.json
```

---

## 8. 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| AI 生成的代码有错误 | 教科书提供常见错误排查；参考代码可对照 |
| 不同学员的 AI 生成代码不一致 | 提供关键验证点（能运行 + 功能正确即可） |
| 硅基流动额度耗尽 | `.env` 切换为免费模型或其他供应商 |
| 学员环境差异大 | 环境检查脚本 + 安装指南 |
| OpenCode 版本变化 | 提示词模板定期更新 |
