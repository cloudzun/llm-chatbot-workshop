# AI Chatbot 渐进式演练项目 — 施工手册

> **版本**: v2 (Streamlit) | **日期**: 2026-03-13  
> **适用对象**: 课程制作团队  
> **核心任务**: 制作教学素材（参考代码 + 提示词模板 + 教案），不是做成品

---

> [!CAUTION]
> **你们的任务不是做一个 chatbot 成品。** 而是制作教学素材，让学员通过与 OpenCode 对话，自己把每个阶段做出来。你们需要交付：
> 1. 每阶段的**参考代码**（标准答案，Git 标签）
> 2. 每阶段的**提示词模板**（学员给 OpenCode 说什么）
> 3. 验证过的**讲师教案**

---

## 1. 工作流程

```
对于每个 Phase:
  ① 自己用 OpenCode 对话把这个阶段做出来
  ② 记录你输入的每条自然语言指令
  ③ 打磨指令，确保新手照着输入也能成功
  ④ 整理代码为参考答案，打 Git 标签
  ⑤ 找一个非技术人员测试，验证提示词有效性
```

**验收标准**：零基础学员按提示词输入 OpenCode，生成的代码能**直接运行**。

---

## 2. 环境准备

### 前置条件

```
Python >= 3.10
pip（Python 包管理器）
OpenCode 或 OpenClaw（已安装）
硅基流动账号 + API Key
```

### `requirements.txt`（逐阶段递增）

```
# Phase 1-2
streamlit
openai

# Phase 3 追加
numpy               # 余弦相似度计算

# Phase 5 追加
mcp                  # MCP SDK

# Phase 6 追加
duckduckgo-search    # DuckDuckGo 搜索
```

### `.streamlit/secrets.toml`

```toml
LLM_API_KEY = "sk-your-key"
LLM_BASE_URL = "https://api.siliconflow.cn/v1"
LLM_DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3.2"
EMBEDDING_MODEL = "BAAI/bge-m3"
RERANK_MODEL = "BAAI/bge-reranker-v2-m3"
```

> [!IMPORTANT]
> 使用 Streamlit 的 `st.secrets` 管理配置。通用命名，换供应商只改此文件。

---

## 3. Phase 1: 基础聊天

### 学员提示词模板

**第一步（项目初始化）**：
```
帮我创建一个 Python 项目目录 aigc-chatbot。
创建 requirements.txt 包含 streamlit 和 openai。
创建 .streamlit/secrets.toml 文件，包含：
  LLM_API_KEY = "sk-xxx"
  LLM_BASE_URL = "https://api.siliconflow.cn/v1"
  LLM_DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3.2"
然后 pip install -r requirements.txt
```

**第二步（聊天应用）**：
```
创建 app.py，用 Streamlit 做一个 AI 聊天应用：
1) 用 openai 库连接 .streamlit/secrets.toml 中配置的 LLM API
2) 用 st.chat_message 显示对话历史
3) 用 st.chat_input 接收用户输入
4) 调用 chat.completions.create 流式生成回复
5) 用 st.write_stream 实现逐字显示
6) 在 session_state 中维护对话历史
7) 侧边栏放一个"清空对话"按钮
```

### 参考架构

```python
import streamlit as st
from openai import OpenAI

client = OpenAI(
    api_key=st.secrets["LLM_API_KEY"],
    base_url=st.secrets["LLM_BASE_URL"]
)

st.title("🤖 AI 聊天助手")

if "messages" not in st.session_state:
    st.session_state.messages = []

# 显示历史消息
for msg in st.session_state.messages:
    st.chat_message(msg["role"]).write(msg["content"])

# 用户输入
if prompt := st.chat_input("输入你的问题..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    st.chat_message("user").write(prompt)
    
    response = client.chat.completions.create(
        model=st.secrets["LLM_DEFAULT_MODEL"],
        messages=st.session_state.messages,
        stream=True
    )
    with st.chat_message("assistant"):
        result = st.write_stream(response)
    st.session_state.messages.append({"role": "assistant", "content": result})
```

### 关键技术要点

| 要点 | 说明 |
|------|------|
| `st.session_state` | Streamlit 每次交互会重新运行脚本，需用 session_state 保持状态 |
| `st.write_stream` | 内置流式输出，自动处理 OpenAI 的 stream 响应 |
| `st.secrets` | 读取 `.streamlit/secrets.toml`，不暴露密钥 |
| `openai` Python SDK | 天然兼容硅基流动等 OpenAI 格式 API |

### 验证清单

- [ ] `streamlit run app.py` 启动无报错
- [ ] 浏览器聊天界面正常显示
- [ ] 输入消息后 AI 逐字回复
- [ ] 多轮对话上下文保持
- [ ] "清空对话"按钮生效

---

## 4. Phase 2: 参数调优面板

### 学员提示词模板

```
在 app.py 的侧边栏添加参数调优面板：
1) st.selectbox 模型选择（DeepSeek-V3.2默认、Qwen2.5-7B免费、DeepSeek-R1推理）
2) st.slider temperature（0.0到2.0，默认0.7）
3) st.slider top_p（0.0到1.0，默认0.9）
4) st.number_input max_tokens（默认1024）
5) st.text_area system_prompt（默认"你是一个友好的AI助手"）
6) 把这些参数传入 chat.completions.create 调用
7) 每个参数旁加简短中文说明
```

### 参考架构（增量部分）

```python
with st.sidebar:
    st.header("⚙️ 参数设置")
    
    model = st.selectbox("模型", [
        "deepseek-ai/DeepSeek-V3.2",
        "Qwen/Qwen2.5-7B-Instruct",
        "deepseek-ai/DeepSeek-R1"
    ], format_func=lambda x: {
        "deepseek-ai/DeepSeek-V3.2": "DeepSeek-V3.2 (默认)",
        "Qwen/Qwen2.5-7B-Instruct": "Qwen 2.5-7B (免费)",
        "deepseek-ai/DeepSeek-R1": "DeepSeek-R1 (推理)"
    }.get(x, x))
    
    temperature = st.slider("Temperature — 越高越有创意", 0.0, 2.0, 0.7)
    top_p = st.slider("Top-P — 核采样概率", 0.0, 1.0, 0.9)
    max_tokens = st.number_input("最大生成长度", 1, 4096, 1024)
    system_prompt = st.text_area("System Prompt", "你是一个友好的AI助手。")

# 调用时使用参数
response = client.chat.completions.create(
    model=model,
    messages=[{"role": "system", "content": system_prompt}] + st.session_state.messages,
    temperature=temperature,
    top_p=top_p,
    max_tokens=max_tokens,
    stream=True
)
```

### 验证清单

- [ ] 侧边栏显示所有参数控件
- [ ] temperature=0 多次回答几乎相同
- [ ] temperature=1.5 回答明显更随机
- [ ] 切换模型后有效果差异
- [ ] 修改 System Prompt 改变 AI 行为

### 教学活动

对比实验记录表：同一问题、不同 temperature (0 / 0.7 / 1.5)

---

## 5. Phase 3: RAG 知识问答

### 学员提示词模板（分步）

**步骤1 — 文档加载器**：
```
创建 rag/loader.py，实现 load_and_chunk 函数：
读取 oneflower 目录下所有 .txt 和 .md 文件，
按段落切分成约500字的片段（保留100字重叠），
返回列表 [{"content": ..., "source": ..., "index": ...}]
```

**步骤2 — 嵌入模块**：
```
创建 rag/embeddings.py，实现 get_embeddings 函数：
用 openai 库调用 secrets 中配置的 EMBEDDING_MODEL，
接收文本列表，返回向量列表
```

**步骤3 — 向量存储**：
```
创建 rag/vectorstore.py，实现：
- build_index：为所有文档片段生成向量，存为 JSON
- search：用 numpy 计算余弦相似度，返回 top-3 最相关片段
```

**步骤4 — 集成到主应用**：
```
修改 app.py：
1) 侧边栏加"知识库模式"开关（st.toggle）
2) 加"构建索引"按钮（st.button），点击后加载文档并构建向量索引
3) 开启RAG时，先检索相关片段，拼入 system prompt
4) 在 AI 回复下方用 st.expander 显示引用的文档片段和相似度分数
```

**[进阶] 步骤5 — 重排序**：
```
创建 rag/reranker.py：
用 requests 调用 secrets 中配置的 RERANK_MODEL 的 /rerank 接口，
对粗检索的 top-10 结果重排序，返回 top-3。
在侧边栏加"启用重排序"开关，标注为进阶功能。
```

### 关键技术要点

| 要点 | 说明 |
|------|------|
| RAG 本质 | 检索文档片段 → 拼入 system prompt → LLM 基于文档回答 |
| 嵌入 API | `client.embeddings.create(model=..., input=[...])` |
| 向量存储 | JSON 文件即可，不需要向量数据库 |
| `@st.cache_data` | 缓存索引构建结果，避免重复计算 |
| 重排序 API | `POST /rerank`，传 query + documents + top_n |

### 验证清单

- [ ] "构建索引"成功，显示片段数
- [ ] 开启 RAG，问"易速鲜花退换货"，回答引用了文档
- [ ] 关闭 RAG，同样问题 AI 回答不了
- [ ] 引用来源展开显示正确
- [ ] [进阶] 重排序开关可切换，结果有变化

---

## 6. Phase 4: API 对接 — 天气

### 学员提示词模板

```
添加天气查询功能：
1) 创建 tools/weather.py，封装 wttr.in API
   （requests.get(f"https://wttr.in/{city}?format=j1")），
   返回温度、天气描述、湿度等
2) 修改 app.py 实现 Function Calling：
   - 定义 get_weather 工具的 JSON Schema
   - 第一次调用 LLM（非流式），判断是否需要工具
   - 如果 finish_reason 是 tool_calls，执行天气查询
   - 将结果作为 tool 消息传回 LLM
   - 第二次调用 LLM（流式），生成最终回复
   - 如果不需要工具，直接流式回复
3) 天气结果用 st.info 或 st.metric 美观展示
```

### 关键技术要点

| 要点 | 说明 |
|------|------|
| 两次调用 | 第一次非流式判断 → 执行工具 → 第二次流式回答 |
| `tool_calls` | 检查 `response.choices[0].finish_reason == "tool_calls"` |
| 分支逻辑 | 需要工具 vs 不需要工具的两条路径 |

### 验证清单

- [ ] 问"北京天气"返回实时数据
- [ ] 问"写首诗"正常聊天
- [ ] 天气信息格式美观

---

## 7. Phase 5: MCP 对接 — 新闻

### 学员提示词模板

```
接入 MCP 新闻功能：
1) pip install mcp
2) 创建 tools/news.py，用 MCP Python SDK：
   - 用 StdioClientTransport 连接 feed-mcp（npx -y feed-mcp）
   - 实现 get_news 函数获取 RSS 新闻条目
3) 在 app.py 的工具列表中添加 get_news 工具定义
4) 新闻结果用 st.expander 逐条展示标题和摘要
```

### 关键技术要点

| 要点 | 说明 |
|------|------|
| MCP Python SDK | `from mcp import ClientSession, StdioServerParameters` |
| 异步 | MCP SDK 是异步的，需 `asyncio` 配合 |
| 进程管理 | feed-mcp 通过 npx 启动，需要 Node.js 环境 |

> [!WARNING]
> MCP Python SDK 和 feed-mcp 需实测最新版本。准备备选方案。

### 验证清单

- [ ] 问"今天新闻"返回条目
- [ ] 天气和新闻共存正常

---

## 8. Phase 6: 搜索引擎 — DuckDuckGo

### 学员提示词模板

```
添加搜索功能：
1) pip install duckduckgo-search
2) 创建 tools/search.py，用 duckduckgo-search 库搜索
3) 在工具列表中添加 search_web 工具，
   描述为"搜索互联网，当其他工具无法满足时调用"
4) 测试多工具场景，确保天气/新闻/搜索/RAG正确分派
```

### 关键技术要点

| 要点 | 说明 |
|------|------|
| `duckduckgo-search` | Python 包，比直接调 API 更方便，`from duckduckgo_search import DDGS` |
| 工具描述 | 每个工具的 description 要有区分度 |

### 验证清单

- [ ] 问"量子计算"触发搜索
- [ ] 天气/新闻/搜索/RAG 分派正确
- [ ] 无工具需求时正常聊天

---

## 9. 代码管理

```
git tag phase-1-basic-chat
git tag phase-2-param-tuning
git tag phase-3-rag
git tag phase-4-weather-api
git tag phase-5-mcp-news
git tag phase-6-duckduckgo
```

每个标签 = 独立可运行状态，Phase N+1 在 Phase N 上增量添加。

---

## 10. 讲师教案规范

每阶段教案：

| 环节 | 时长 |
|------|------|
| 开场演示（展示最终效果） | 2min |
| 概念讲解（类比+图示） | 10min |
| 带练示范（讲师在 OpenCode 中操作） | 5min |
| 学员实操 | 20-30min |
| 验证答疑 | 10min |

### 常见问题预案

| 问题 | 应对 |
|------|------|
| 代码报错 | 把报错贴给 OpenCode："帮我修这个错误" |
| 代码跟参考不同 | 正常！能运行+功能对就行 |
| `streamlit run` 失败 | 检查 Python 版本、pip install 是否成功 |
| API Key 无效 | 重新去硅基流动创建密钥 |
| 网络慢 | 用国内 pip 镜像：`pip install -i https://pypi.tuna.tsinghua.edu.cn/simple` |
