# AI Chatbot 演练项目 — Python / Streamlit 版

> 本目录是 [aigc-chatbot](../) 的 Python 版本，适合有代码经验的学员。

## 课程结构

```
phases/
├── phase-1/   基础聊天（流式输出 + session_state）
├── phase-2/   参数调优（temperature / System Prompt）
├── phase-3/   RAG 知识问答（嵌入向量 + 余弦检索）
├── phase-4/   Function Calling（天气卡片）
├── phase-5/   MCP 新闻工具（asyncio + RSS 降级）
└── phase-6/   联网搜索※选修（DDG + 中文降级链接）
```

每个 phase 目录包含：
- `starter/`   — 学员起始代码（TODO 注释版）
- `completed/` — 完整参考实现
- `README.md`  — 阶段说明 + 给 OpenCode 的提示词

## 快速开始

```bash
# 进入任意阶段的 completed/ 目录
cd phases/phase-1/completed

# 安装依赖
pip install -r requirements.txt

# 配置 API Key
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
# 用编辑器打开 secrets.toml，填入真实 API Key

# 启动
streamlit run app.py
```

## 知识库准备（Phase 3+）

Phase 3 及以后需要 oneflower 知识库目录。在各 `completed/` 下创建软链接：

```bash
# Windows（管理员模式）:
mklink /D oneflower ..\..\..\OneFlower\OneFlower

# Mac / Linux:
ln -s ../../../OneFlower/OneFlower oneflower
```

## 技术栈

| 组件 | 选择 |
|------|------|
| 前端框架 | Streamlit ≥ 1.35 |
| AI SDK | openai（Python） |
| LLM 平台 | 硅基流动（SiliconFlow） |
| 默认模型 | deepseek-ai/DeepSeek-V3 |
| 嵌入模型 | BAAI/bge-m3（免费） |
| 重排序模型 | BAAI/bge-reranker-v2-m3（免费，Phase 3 进阶） |
| MCP SDK | mcp（pip install mcp） |
| 搜索 | DuckDuckGo Instant Answer（无需 Key） |

## 配套文档

| 文档 | 目标读者 |
|------|---------|
| [PRD.md](../v2-streamlit/PRD.md) | 产品 / 架构决策 |
| [prompt-templates.md](../v2-streamlit/prompt-templates.md) | 课程制作团队（施工手册） |
| [student-textbook.md](../v2-streamlit/student-textbook.md) | 学员（概念 + 操作指南） |
