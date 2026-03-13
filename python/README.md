# AI 聊天机器人实战工作坊 — Python / Streamlit 版

> **目标**：从零构建一个具备知识问答、天气查询、新闻阅读、网络搜索能力的 AI chatbot
> **技术路线**：Python · Streamlit · OpenAI API · SiliconFlow · RAG · Function Calling
> **难度**：零代码基础可上手，有代码经验者可深入理解每个技术决策

---

## 项目结构

```
python/                             ← 本仓库根目录
├── README.md                       ← 本文件
├── docs/
│   ├── student-textbook.md         ← 学员教材（详细知识点 + 操作步骤）
│   └── instructor-guide.md         ← 讲师指南（教学计划 + 常见问题处理）
├── oneflower/                      ← 示例知识库文档
│   ├── 易速鲜花员工手册.pdf
│   ├── 易速鲜花运营指南.docx
│   └── 花语大全.txt
└── phases/
    ├── phase-1/   基础聊天（流式输出 + session_state）
    ├── phase-2/   参数调优（temperature / System Prompt）
    ├── phase-3/   RAG 知识问答（嵌入向量 + 余弦检索 + 重排序）
    ├── phase-4/   Function Calling（天气卡片）
    ├── phase-5/   多工具协作（天气 + 新闻 RSS）
    └── phase-6/   联网搜索（DDG + 四工具编排）
```

每个 `phase-N/` 目录包含：

```
phase-N/
├── starter/        学员起始代码（含 TODO 注释）
├── completed/      完整参考实现
└── README.md       阶段说明 + 给 OpenCode 的提示词
```

---

## 快速开始

### 前置条件

- Python 3.10+
- 有效的[硅基流动](https://cloud.siliconflow.cn) API Key

### 运行任意阶段的完整版

```bash
# 1. 进入目标阶段
cd phases/phase-1/completed

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置 API Key
mkdir -p .streamlit
cat > .streamlit/secrets.toml << 'EOF'
LLM_API_KEY       = "sk-你的密钥"
LLM_BASE_URL      = "https://api.siliconflow.cn/v1"
LLM_DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3"
EOF

# 4. 启动
streamlit run app.py
```

浏览器会自动打开，应用运行在 `http://localhost:8501`。

### 知识库准备（Phase 3 及以上）

Phase 3~6 需要 `oneflower/` 知识库目录。在各 `phase-N/completed/` 下创建软链接：

```bash
# Windows（管理员终端）
cd phases\phase-3\completed
mklink /D oneflower ..\..\..\oneflower

# Mac / Linux
cd phases/phase-3/completed
ln -s ../../../oneflower oneflower
```

或直接复制（无管理员权限时）：

```bash
# Windows
xcopy /E /I oneflower ..\..\..\oneflower

# Mac / Linux
cp -r ../../../oneflower oneflower
```

构建完软链接/拷贝后，在应用侧边栏点击「🔨 构建索引」即可。

---

## 技术栈

| 组件 | 选择 | 说明 |
|------|------|------|
| 应用框架 | [Streamlit](https://streamlit.io) ≥ 1.35 | 单文件 Python → 完整 Web 应用 |
| AI SDK | openai（Python） | 兼容 OpenAI 协议的所有服务 |
| LLM 平台 | 硅基流动（SiliconFlow） | OpenAI 兼容接口，有免费模型 |
| 默认 LLM | deepseek-ai/DeepSeek-V3 | 通用，快速，适合对话 |
| 嵌入模型 | BAAI/bge-m3 | 中文语义嵌入，免费 |
| 重排序 | BAAI/bge-reranker-v2-m3 | 精排序提升 RAG 质量，免费 |
| 天气 API | [wttr.in](https://wttr.in) | 无需 Key，免费天气数据 |
| 新闻 | RSS + feedparser | 无需 Key |
| 搜索 | DuckDuckGo Instant Answer | 无需 Key |

---

## 各阶段能力矩阵

| 功能 | P1 | P2 | P3 | P4 | P5 | P6 |
|-----|----|----|----|----|----|----|
| 流式对话 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 多轮历史 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 参数调控面板 | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| RAG 知识库 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 重排序 | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Function Calling | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 天气工具 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 新闻工具 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 网络搜索 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 配套文档

| 文档 | 目标读者 | 内容 |
|------|---------|------|
| [docs/student-textbook.md](docs/student-textbook.md) | 学员 | 知识点讲解 + 操作步骤 + 验收清单 |
| [docs/instructor-guide.md](docs/instructor-guide.md) | 讲师 / 助教 | 教学计划 + 常见问题处理 + 时间表 |

---

## 常见问题

**Q: 可以换用 OpenAI 官方 API 吗？**

可以，只需修改 `secrets.toml` 中的 `LLM_API_KEY`、`LLM_BASE_URL`（改为 `https://api.openai.com/v1`）和 `LLM_DEFAULT_MODEL`，代码无需改动。

**Q: 可以用本地 Ollama 模型吗？**

可以。修改 `secrets.toml`：
```toml
LLM_API_KEY       = "ollama"
LLM_BASE_URL      = "http://localhost:11434/v1"
LLM_DEFAULT_MODEL = "qwen2.5:7b"
```
注意：Function Calling 需要模型支持工具调用（建议 `qwen2.5:14b` 或更大规格）。

**Q: secrets.toml 被提交到 Git 了怎么办？**

立即在硅基流动控制台吊销该 Key，并生成新密钥。然后用 `git filter-branch` 或 [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) 从历史记录中彻底删除。

---

## 授权

本项目代码采用 [MIT License](../LICENSE)，教材文档采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 授权。

---

*📚 学员教材: [docs/student-textbook.md](docs/student-textbook.md) | 🎓 讲师指南: [docs/instructor-guide.md](docs/instructor-guide.md)*
