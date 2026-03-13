# LLM Chatbot Workshop

> 从零构建一个具备 RAG 知识问答、Function Calling、MCP 协议和多工具编排能力的 AI 聊天机器人

**技术栈**: Node.js 18+ · Express · SiliconFlow API · OpenAI 兼容接口  
**教学方式**: 通过与 OpenCode AI 编程助手对话，用自然语言驱动代码生成  
**适合对象**: 零代码基础学员 / 希望深度理解 LLM 应用架构的开发者

---

## 课程演进路径

| 阶段 | 新增能力 | 关键技术 |
|------|---------|---------|
| Phase 1 | 基础流式聊天 | LLM API、SSE、后端代理 |
| Phase 2 | 参数调优面板 | temperature / top_p / system prompt |
| Phase 3 | RAG 知识问答 | Embedding、向量检索、余弦相似度 |
| Phase 4 | 实时天气查询 | Function Calling、工具定义 Schema |
| Phase 5 | RSS 新闻阅读 | MCP 协议、stdio 通信 |
| Phase 6 | 互联网搜索 | 多工具编排、DuckDuckGo API |

---

## 快速开始

### 前置要求

- Node.js 18+（[下载](https://nodejs.org)）
- [硅基流动](https://cloud.siliconflow.cn) 账号与 API Key

### 安装

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/llm-chatbot-workshop.git
cd llm-chatbot-workshop

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 LLM_API_KEY
```

### 配置 `.env`

```env
LLM_API_KEY=sk-你的硅基流动密钥
LLM_BASE_URL=https://api.siliconflow.cn/v1
LLM_DEFAULT_MODEL=deepseek-ai/DeepSeek-V3.2
EMBEDDING_MODEL=BAAI/bge-m3
RERANK_MODEL=BAAI/bge-reranker-v2-m3
RERANK_ENABLED=false
KNOWLEDGE_DIR=./OneFlower/OneFlower
PORT=3000
```

### 检查环境

```bash
node scripts/check-env.js
```

所有项目显示 ✅ 后继续。

### 启动

```bash
npm start
# 或
node server.js
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

---

## 目录结构

```
├── server.js               # 后端主入口（Phase 1~6 全量功能）
├── scripts/
│   └── check-env.js        # 学员环境检查脚本
├── public/                 # 前端静态文件
│   ├── index.html
│   ├── style.css
│   └── app.js
├── rag/                    # RAG 模块（Phase 3）
│   ├── loader.js           # 文档加载与切分
│   ├── embeddings.js       # 向量嵌入（bge-m3）
│   ├── vectorstore.js      # 向量存储与检索
│   └── reranker.js         # 重排序（可选，bge-reranker）
├── tools/                  # 外部工具（Phase 4~6）
│   ├── weather.js          # 天气查询（wttr.in）
│   ├── news.js             # 新闻阅读（MCP + feed-mcp RSS）
│   └── search.js           # 网络搜索（DuckDuckGo）
├── mcp/
│   └── mcp-config.json     # MCP 服务器配置
├── reference/              # 各阶段参考代码（教学用）
│   ├── README.md
│   ├── phase-1-server.js
│   ├── phase-2-server.js
│   ├── phase-3-server.js
│   ├── phase-4-server.js
│   └── phase-5-server.js
├── docs/
│   ├── engineering/        # 工程类文档
│   │   ├── PRD.md          # 产品需求文档
│   │   └── construction-manual.md  # 施工手册（OpenCode 指令集）
│   └── teaching/           # 教学类文档
│       ├── student-textbook.md      # 学员教程（主教材）
│       ├── instructor-guide.md      # 讲师教案
│       └── prompt-templates.md     # OpenCode 指令模板库
└── OneFlower/              # 示例知识库（易速鲜花资料）
```

---

## 教学文档

| 文档 | 用途 | 主要读者 |
|------|------|---------|
| [学员教程](docs/teaching/student-textbook.md) | 完整的自学手册，含概念讲解、嵌入式指令、验收清单 | 学员 |
| [讲师教案](docs/teaching/instructor-guide.md) | 课堂节奏安排、带练要点、常见问题 Q&A | 讲师 |
| [指令模板库](docs/teaching/prompt-templates.md) | 各阶段 OpenCode 提示词的快速参考索引 | 讲师 / 学员 |
| [施工手册](docs/engineering/construction-manual.md) | 项目从零构建的完整步骤与技术决策记录 | 课程研发团队 |
| [产品需求文档](docs/engineering/PRD.md) | 课程整体设计目标、功能定义、技术约束 | 课程研发团队 |

---

## API 接口文档

### `POST /api/chat`

发送对话请求（支持流式 SSE 响应）。

**请求体**：
```json
{
  "messages": [{"role": "user", "content": "你好"}],
  "params": {
    "model": "deepseek-ai/DeepSeek-V3.2",
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 1024,
    "system_prompt": "你是一个友好的AI助手。"
  },
  "ragEnabled": false
}
```

**SSE 事件流**：
- `data: {"choices":[{"delta":{"content":"..."}}]}` — 文字增量
- `data: {"type":"metadata","ragSources":[...]}` — RAG 来源（ragEnabled 时）
- `data: {"type":"metadata","toolCalls":[...]}` — 工具调用事件
- `data: {"type":"usage","usage":{...}}` — Token 用量
- `data: [DONE]` — 流结束

### `POST /api/rag/build-index`

构建/重建向量索引。

**响应**：`{"success": true, "count": 42}`

---

## 参考代码说明

`reference/` 目录下的文件是**各阶段的完整参考实现**（标准答案），按阶段增量演进。

请参阅 [reference/README.md](reference/README.md) 了解各文件的功能对应关系。

> ⚠️ 参考代码供学员卡壳时对比逻辑，不提倡直接复制——课程的价值在于通过 AI 编程助手自己生成代码的过程。

---

## 使用的免费资源

| 资源 | 用途 | 限制 |
|------|------|------|
| `BAAI/bge-m3` | 向量嵌入 | 完全免费 |
| `BAAI/bge-reranker-v2-m3` | 重排序 | 完全免费 |
| `Qwen/Qwen2.5-7B-Instruct` | 轻量对话模型 | 完全免费 |
| wttr.in | 天气数据 API | 完全免费，无需注册 |
| feed-mcp / hnrss.org | RSS 新闻 | 完全免费 |
| DuckDuckGo Instant Answer | 网络搜索 | 完全免费，无需 Key |

---

## 许可证

MIT License — 欢迎用于教学、个人项目和二次开发。
