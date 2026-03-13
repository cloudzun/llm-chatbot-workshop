# LLM 智能机器人工作坊

> 通过与 AI 编程助手对话，从零开始一步一步搭建具备 RAG 知识问答、Function Calling、MCP 协议和多工具编排能力的智能聊天机器人。

**你会学到什么**: LLM API 调用 · 流式输出 · RAG 检索增强 · Function Calling · MCP 协议  
**怎么学**: 打开教材，和 AI 编程助手（OpenCode / Cursor / Copilot）对话，用自然语言驱动代码生成  
**适合谁**: 零代码基础学员 / 希望深度理解 LLM 应用架构的开发者

---

## 工作坊概览

这不是一个克隆即可运行的项目，而是一段**学习旅程**。

你将通过 6 个阶段，每次只向 AI 编程助手描述你想要的功能，让 AI 帮你生成代码，亲手构建出一个完整的智能机器人：

| 阶段 | 你将建造什么 | 核心技术 |
|------|------------|---------|
| Phase 1 | 基础流式聊天界面 | LLM API、SSE、Express 后端代理 |
| Phase 2 | 参数调优控制面板 | temperature、top_p、system prompt |
| Phase 3 | 知识库问答（RAG） | Embedding、向量检索、余弦相似度 |
| Phase 4 | 实时天气查询 | Function Calling、工具定义 Schema |
| Phase 5 | RSS 新闻阅读 | MCP 协议、stdio 子进程通信 |
| Phase 6 | 互联网搜索 | 多工具编排、DuckDuckGo API |

---

## 从这里开始

### 第一步：准备环境

需要：
- Node.js 18+（[下载](https://nodejs.org)）
- [硅基流动](https://cloud.siliconflow.cn) 账号（注册免费，获取 API Key）

```bash
# 克隆工作坊仓库
git clone https://github.com/cloudzun/llm-chatbot-workshop.git
cd llm-chatbot-workshop

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 用文本编辑器打开 .env，填入你的 LLM_API_KEY
```

### 第二步：检查环境

```bash
node scripts/check-env.js
```

所有项目显示 ✅ 后继续。

### 第三步：打开主教材，开始构建

📖 **[docs/teaching/student-textbook.md](docs/teaching/student-textbook.md)** — 你的主要向导

教材里每个阶段都有：
- 概念讲解（这个技术是什么、为什么需要它）
- 现成的 AI 提示词（直接复制到 AI 编程助手对话框）
- 验收清单（怎么判断这个阶段完成了）

---

## 仓库结构

```
aigc-chatbot/
├── .env.example            ← 从这里复制配置模板
├── package.json            ← npm install / npm start（运行成品用）
│
├── docs/                   ← 学习材料（重点在这里）
│   ├── teaching/
│   │   ├── student-textbook.md    ← 📖 主教材，学员从这里开始
│   │   ├── instructor-guide.md   ← 讲师教案与带练要点
│   │   └── prompt-templates.md   ← AI 提示词快速索引
│   └── engineering/
│       ├── construction-manual.md ← 完整施工步骤（供参考）
│       └── PRD.md                 ← 课程设计文档
│
├── scripts/
│   └── check-env.js        ← 环境检查脚本（第一步运行）
│
├── OneFlower/              ← 示例知识库（易速鲜花，Phase 3 RAG 使用）
│
├── reference/              ← 各阶段参考代码（卡壳时对照）
│   ├── README.md
│   ├── phase-1-server.js
│   ├── phase-2-server.js
│   ├── phase-3-server.js
│   ├── phase-4-server.js
│   └── phase-5-server.js
│
└── solution/               ← 完整成品（Phase 1~6 全量实现，学完后可对照）
    ├── server.js
    ├── public/             ← 前端（HTML/CSS/JS）
    ├── rag/                ← RAG 模块
    ├── tools/              ← 工具函数（天气/新闻/搜索）
    └── mcp/                ← MCP 配置
```

---

## 参考资料与分阶段代码

`reference/` 里保存了每个阶段结束时的标准答案。**遇到问题先自己思考，实在卡住再来这里对比逻辑。**

> 课程的价值在于你亲手和 AI 协作生成代码的过程，而不是复制答案。

`solution/` 是完整成品，对应最终 Phase 6，用 `npm start` 运行（在项目根目录）：

```bash
npm start
# 打开浏览器访问 http://localhost:3000
```

---

## 教学文档索引

| 文档 | 用途 | 主要读者 |
|------|------|---------|
| [学员教材](docs/teaching/student-textbook.md) | 完整的自学或带练手册，含概念讲解与嵌入式 AI 指令 | 学员 |
| [讲师教案](docs/teaching/instructor-guide.md) | 课堂节奏、带练要点、常见问题 Q&A | 讲师 |
| [AI 提示词索引](docs/teaching/prompt-templates.md) | 各阶段 AI 编程助手提示词的快速参考 | 讲师 / 学员 |
| [施工手册](docs/engineering/construction-manual.md) | 从零构建的完整步骤与技术决策记录 | 课程研发团队 |
| [产品需求文档](docs/engineering/PRD.md) | 课程功能定义与技术约束 | 课程研发团队 |

---

## 本课程使用的免费资源

| 资源 | 用途 | 费用 |
|------|------|------|
| `BAAI/bge-m3` | 向量嵌入 | 完全免费 |
| `BAAI/bge-reranker-v2-m3` | 重排序 | 完全免费 |
| `Qwen/Qwen2.5-7B-Instruct` | 轻量对话模型 | 完全免费 |
| wttr.in | 天气数据 | 完全免费，无需注册 |
| feed-mcp / hnrss.org | RSS 新闻 | 完全免费 |
| DuckDuckGo Instant Answer | 网络搜索 | 完全免费，无需 Key |

---

## 许可证

MIT License — 欢迎用于教学、个人项目和二次开发。
