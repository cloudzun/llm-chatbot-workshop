# AI Chatbot 演练项目 — 学员手册（Python / Streamlit 版）

> **版本**: v2-streamlit | **目标读者**: 有 Python 基础、初次接触 AI 应用开发的学员
> **学习方式**: 用自然语言驱动 OpenCode，自己把应用做出来

---

## 开始之前

### 你会学到什么

六个阶段，每阶段约 45 分钟：

| 阶段 | 核心能力 | 你做的事 |
|------|---------|---------|
| Phase 1 | 流式聊天应用 | 与 AI 的第一次实时对话 |
| Phase 2 | 模型参数调优 | 通过滑块观察 AI 行为变化 |
| Phase 3 | RAG 知识问答 | 让 AI 读公司文档回答问题 |
| Phase 4 | Function Calling | AI 主动查天气并展示图卡 |
| Phase 5 | MCP 工具集成 | AI 订阅实时新闻 RSS 源 |
| Phase 6 | 搜索引擎（选修）| AI 联网搜索，会降级处理 |

### 你需要准备

```
□ Python 3.10 或更高版本
□ pip（Python 包管理器）
□ OpenCode（已安装完成）
□ 硅基流动 API Key（老师会提供或指导注册）
□ Node.js（Phase 5 需要，Phase 1-4 不需要）
```

### 什么是 OpenCode？

一句话：**AI 编程助手，你用中文描述需求，它帮你写代码**。

如果你用过 GitHub Copilot 或 Cursor，OpenCode 做的是类似的事情，不同在于它更面向终端+文件级别的代码生成。我们整个课程都用它来完成编码任务。

---

## Phase 1：用 Streamlit 造一个 AI 聊天窗口

### 什么是 Streamlit？

你其实已经见过类似的东西了——ChatGPT 的网页、DeepSeek 的对话界面。Streamlit 是一个 Python 框架，让你**用很少的代码创建这样的网页应用**，完全不需要学 HTML / JavaScript。

每次你修改代码，保存后浏览器会自动刷新——这让它成为 AI 实验的绝佳工具。

### 核心概念

**session_state — Streamlit 的记忆**

Streamlit 有个特殊之处：每次用户点击按钮、输入文字，**整个 `app.py` 都会从第一行重新执行一遍**。这意味着如果你把消息列表存在普通变量里，每次执行都会重置。

`st.session_state` 是一个特殊字典，它的内容在每次重新执行之间**保持不变**。你可以把它理解成"跨次执行的全局变量"：

```python
# 首次运行时初始化
if "messages" not in st.session_state:
    st.session_state.messages = []

# 后续运行时可读取
print(st.session_state.messages)  # 上次留下的消息还在
```

**流式输出 — 逐字出现的效果**

标准 API 调用会等 AI 生成完毕再返回整段文字（慢，体验差）。流式（`stream=True`）会让 AI 像人打字一样，一边生成一边发送。Streamlit 内置 `st.write_stream()` 可以直接消费流，自动处理这些细节。

**st.secrets — 密钥安全存储**

`st.secrets` 会从 `.streamlit/secrets.toml` 文件读取配置，这个文件不提交到 Git，保护你的 API Key：

```toml
LLM_API_KEY = "sk-your-key"
```

读取：
```python
api_key = st.secrets["LLM_API_KEY"]
```

### 动手实践

**步骤 1**：打开 OpenCode，把下面这段话输入进去：

> 帮我创建一个 Python 项目，目录名为 aigc-chatbot-python。
> 创建以下文件：
> - requirements.txt，包含 streamlit>=1.35 和 openai>=1.0
> - .streamlit/secrets.toml，包含 LLM_API_KEY、LLM_BASE_URL（值：https://api.siliconflow.cn/v1）和 LLM_DEFAULT_MODEL（值：deepseek-ai/DeepSeek-V3）
> - .gitignore，加入 .streamlit/secrets.toml 和 __pycache__/
>
> 然后运行 pip install -r requirements.txt 安装依赖。

**步骤 2**：把 `secrets.toml` 里的 `sk-xxx` 替换成老师给的真实 API Key。

**步骤 3**：继续在 OpenCode 输入：

> 创建 app.py，用 Streamlit 实现一个 AI 聊天应用：
> 1. 用 openai 库连接 st.secrets 中配置的 LLM
> 2. 用 st.chat_message 显示对话历史，区分 user 和 assistant 角色
> 3. 用 st.chat_input 接收用户输入
> 4. 调用 chat.completions.create（stream=True），用 st.write_stream 逐字显示
> 5. 用 st.session_state 维护对话历史
> 6. 侧边栏加「清空对话」按钮

**步骤 4**：在终端运行：

```bash
cd aigc-chatbot-python
streamlit run app.py
```

浏览器会自动打开，看到聊天界面。

### 验证

和 AI 聊几句，确认：
- AI 有流式输出效果（逐字出现）
- 多轮对话 AI 能记住上一句话
- 点「清空对话」后历史清空

---

## Phase 2：给 AI 加上调参旋钮

### 什么是 Temperature？

想象你在厨房调味：

- **Temperature = 0**：机器人厨师，每次都做完全一样的菜。适合需要可重复性的任务（代码、数学题、翻译）。
- **Temperature = 0.7**：有些创意，但不失控。适合写作、聊天。
- **Temperature = 1.5+**：很随机，充满创意，有时候有点乱。适合脑洞大开的头脑风暴。

技术上说，temperature 控制模型输出概率分布的"尖锐程度"。高温让低概率词更有机会被选中，造成更多变性。

### 什么是 System Prompt？

System Prompt 是在对话开始前发给 AI 的"角色设定"，用户看不到，但 AI 会一直遵守：

```python
{"role": "system", "content": "你是一个专业的法律顾问"}
```

这比在用户消息里说"你是法律顾问"要稳定得多——AI 不容易被后续对话"说服"忘记这个设定。

### 动手实践

在 OpenCode 输入：

> 在 app.py 的侧边栏添加参数调优面板，用 st.divider 分隔：
> 1. st.selectbox 模型选择：DeepSeek-V3、Qwen/Qwen2.5-7B-Instruct（免费）、DeepSeek-R1
> 2. st.slider temperature，范围 0.0-2.0，默认 0.7，加说明"越高越有创意"
> 3. st.slider top_p，范围 0.0-1.0，默认 0.9
> 4. st.number_input max_tokens，范围 64-4096，默认 1024
> 5. st.text_area system_prompt，默认"你是一个友好的 AI 助手。"
> 6. 将以上参数传入 chat.completions.create 调用中

### 探索活动

用同一个问题做对比实验，把观察结果填到下表：

**问题**：「世界上最快乐的颜色是什么？」

| temperature | 回答大概内容 | 每次一样吗？ |
|-------------|------------|------------|
| 0 | | |
| 0.7 | | |
| 1.5 | | |

---

## Phase 3：让 AI 读你的文档（RAG）

### 什么是 RAG？

**RAG = Retrieval-Augmented Generation（检索增强生成）**

问题：AI 只知道训练时见过的信息，不知道你公司今天的政策文件是什么。

解决方案：

```
1. 把文档切碎成小片段（"文档块"）
2. 把每个片段转换成向量（一串数字，表示语义）
3. 用户提问时，把问题也转成向量
4. 找出向量最接近的 Top-3 片段
5. 把这些片段塞进 system 消息："参考以下内容回答：..."
6. AI 基于文档片段作答
```

### 什么是嵌入（Embedding）？

类比：把文字翻译成坐标。

- "苹果"和"梨"的坐标很近（都是水果）
- "苹果"和"火箭"的坐标很远（毫不相关）
- "易速鲜花退货政策"和包含"退货"的文档片段坐标接近

**嵌入 API** 输入文本，输出一个几百维的数字数组。我们用余弦相似度来算两段文本有多"相关"：

$$\cos(\theta) = \frac{A \cdot B}{|A| \cdot |B|}$$

值越接近 1 = 越相似；值越接近 0 = 越不同。

### 动手实践

**步骤 1**：
```bash
pip install numpy pypdf python-docx
```

然后在 `.streamlit/secrets.toml` 加：
```toml
EMBEDDING_MODEL = "BAAI/bge-m3"
```

**步骤 2**：在 OpenCode 输入（文档加载器）：

> 创建 rag/loader.py，导出 load_and_chunk(directory) 函数：
> - 读取目录下所有 .txt、.pdf 和 .docx 文件
> - 按约 500 字一段切分，相邻段保留 100 字重叠
> - 返回列表，每项有 content、source（文件名）、index（序号）

**步骤 3**：在 OpenCode 输入（向量存储）：

> 创建 rag/embeddings.py 和 rag/vectorstore.py：
> - embeddings.py 导出 get_embeddings(texts) 函数，调用硅基流动嵌入 API，每批最多100条
> - vectorstore.py 导出 build_index(chunks, embeddings) 保存为 JSON，
>   以及 search(query_embedding, top_k=3) 用 numpy 余弦相似度检索

**步骤 4**：在 OpenCode 输入（集成到主应用）：

> 修改 app.py，添加 RAG 功能：
> 1. 侧边栏加"知识库设置"，st.toggle 开启/关闭知识库，st.button 构建索引
> 2. 用 @st.cache_data 缓存索引
> 3. 开启 RAG 时，检索 top-3 片段，拼入 system prompt
> 4. AI 回复后用 st.expander 显示引用来源（文件名+相似度+片段前200字）

### 上手体验

老师会给你一个 `oneflower/` 文件夹，包含：

- `易速鲜花员工手册.pdf`
- `易速鲜花运营指南.docx`
- `花语大全.txt`

试一试这些问题，分别在 RAG 开启和关闭时问：

| 问题 | RAG 关闭 | RAG 开启 |
|------|---------|---------|
| 「易速鲜花的退换货政策是什么？」 | | |
| 「玫瑰花的花语是什么？」 | | |
| 「员工调休如何申请？」 | | |

---

## Phase 4：让 AI 主动查天气（Function Calling）

### 什么是 Function Calling？

到目前为止，AI 只能"想"——脑子里的知识，加上你喂给它的文档。但有些事情"想"没用，比如「明天下不下雨」，AI 的训练数据里没有今天的天气。

Function Calling 让 AI 可以"做"——它可以决定调用你写的 Python 函数，把结果带回来继续回答。

### 两阶段调用 — 就像请示上司

把整个过程想象成一次工作汇报：

```
你（第1次请求）→  AI：「帮我查北京天气」
AI              →  你：「我需要查天气，请调用 get_weather("Beijing")」
你执行函数      →  得到温度、湿度等数据
你（第2次请求）→  AI：「工具结果是这些数据，请继续」
AI              →  你：「北京今天晴，22°C，适合外出...」
```

技术上就是：
1. **第1次调用**（非流式）：给 AI 描述它能用的工具，看它是否要调用
2. **检查 `finish_reason`**：如果是 `"tool_calls"`，执行对应函数
3. **第2次调用**（流式）：把函数结果作为 `role="tool"` 消息传回去

### 动手实践

在 OpenCode 输入：

> 添加天气查询功能：
> 1. 创建 tools/weather.py，调用 https://wttr.in/{city}?format=j1 获取天气数据
> 2. 修改 app.py 实现两阶段 Function Calling：
>    - 定义 get_weather 工具的 JSON Schema
>    - 第1次非流式调用检查是否要调用工具
>    - 若是，执行工具，用 st.columns(3) + st.metric 展示温度/体感/湿度
>    - 第2次流式调用生成文字描述

### 理解 JSON Schema 工具描述

AI 不是靠读代码来理解一个函数的——它看的是 JSON 格式的描述。你需要告诉它：

```json
{
  "name": "get_weather",
  "description": "获取指定城市的实时天气。当用户询问天气时调用。",
  "parameters": {
    "city": {
      "type": "string",
      "description": "城市名（英文），如 Beijing"
    }
  }
}
```

**`description` 非常重要**——这是 AI 决定要不要调用这个工具的依据。好的描述 = 更准确的工具选择。

### 试一试

| 输入 | 预期结果 |
|------|---------|
| 「深圳今天天气怎么样？」 | 显示温度卡片 + 文字描述 |
| 「上海明天会下雨吗？」 | 查询上海天气并分析 |
| 「帮我写一首秋天的诗」 | 直接写诗，不查天气 |

---

## Phase 5：让 AI 订阅新闻（MCP）

### 什么是 MCP？

**MCP（Model Context Protocol）** 是 Anthropic 提出的一个开放标准，目标是：**让 AI 应用和外部工具能够标准化通信**。

对比一下：
- Function Calling（Phase 4）：工具**直接写在你的代码里**，API Key 同源
- MCP：工具**运行在独立进程**（甚至远程服务器），通过标准协议通信

理解 MCP 运行方式：

```
你的 Python app
    │  stdio（标准 I/O 管道）
    ▼
feed-mcp（Node.js 子进程，通过 npx 启动）
    │  HTTP
    ▼
RSS 新闻源（hnrss.org、36kr.com 等）
```

### 为什么需要降级处理？

`npx feed-mcp` 需要 Node.js 环境，网络可能超时，或者 Windows 上出现各种兼容问题。

**降级策略**：

```
尝试 MCP → 成功 → 使用 MCP 结果
          → 失败 → 直接 requests.get(RSS URL) → 解析 XML
```

一旦 MCP 失败，`_mcp_failed = True` 标记为全局状态，后续请求直接走降级路径，不再重试。

### Windows 特殊注意事项

Streamlit 本身有一个事件循环，而 `asyncio.run()` 会尝试创建新的事件循环，两者冲突导致报错。解决方法：

```python
pip install nest_asyncio
```

```python
import nest_asyncio
nest_asyncio.apply()  # 允许事件循环嵌套
```

### 动手实践

**步骤 1**：
```bash
pip install mcp
# Windows：pip install nest_asyncio
```

**步骤 2**：在 OpenCode 输入：

> 创建 tools/news.py，导出 get_news(topic) 函数：
> - 主路径：用 MCP Python SDK 连接 feed-mcp，通过 npx 启动子进程，异步获取 RSS
> - 降级路径：直接 requests.get RSS URL，正则解析 XML 的 <item> 标签
> - RSS 源：hnrss.org（tech）、oschina.net（general）、rss.dw.com（world）、36kr.com（finance）
> - 最多返回 10 条
> - 修改 app.py，追加 get_news 工具并在结果中用 st.expander 逐条展示

### 验证

- 「今天有什么财经新闻？」→ 显示 36kr 新闻列表
- 「最新的科技热点是什么？」→ 显示 Hacker News 标题
- 天气和新闻工具同时存在时，AI 能正确选择对应工具

---

## Phase 6（选修）：联网搜索 + 智能降级

### 什么是 DuckDuckGo Instant Answer？

DuckDuckGo 提供一个**免费、无需 API Key** 的即时答案接口：

```
GET https://api.duckduckgo.com/?q=量子纠缠&format=json
```

限制：对中文关键词的覆盖率不高，有时返回空结果。

### 降级策略

```
调用 DDG API →
  有 Abstract/Answer      → 返回结构化结果
  无内容（中文查询）      → 返回必应和百度的搜索链接
  无内容（英文查询）      → 返回 DuckDuckGo 搜索链接
```

这个策略的核心思路：**与其返回"抱歉没找到"，不如给用户一个可以自己去查的链接**。

### 动手实践

在 OpenCode 输入：

> 创建 tools/search.py，导出 search_web(query) 函数，调用 DuckDuckGo Instant Answer API：
> - 中文查询时加 kl=cn-zh 参数
> - 提取 Heading、Abstract、Answer、RelatedTopics 前5条
> - 无内容时返回必应/百度备用链接
> 
> 添加到 app.py 的工具列表，description 要说明什么时候用它、什么时候不用它。

### 四工具协调

当 AI 同时有四个工具可用时，Description 写法决定了它能否正确派发：

| 工具 | 描述要点 |
|------|---------|
| `get_weather` | "询问天气、气温、下雨时调用，只查天气，不做其他" |
| `get_news` | "询问新闻、热点、头条时调用，不用于天气" |
| `search_web` | "天气和新闻工具都不适用时，用于查知识、定义、人物" |
| RAG | 不是工具，是 prompt 增强，始终在后台配合 |

---

## 补充读物

### 为什么选 Python + Streamlit，而不是 JavaScript？

在这门课里，我们选 Streamlit 而不是 Node.js + React，原因如下：

1. **你已经会 Python**：AI 数据处理的主要生态（numpy、pypdf）都在 Python 侧
2. **状态可见**：`session_state` 的读写行为完全透明，容易调试
3. **科学家的选择**：探索性的 AI 原型、数据仪表板，Streamlit 是业界首选

这不是说 JavaScript 不好——Node.js 版 chatbot（v1）完全是另一条路，各有适用场景。

### Streamlit 执行模型（更深入）

```
用户操作（输入消息 / 点击按钮）
    ↓
整个 app.py 从头执行一遍
    ↓
st.session_state 保留上次的值
st.cache_resource/@st.cache_data 返回缓存
其他变量全部重置
    ↓
Streamlit 比较新旧渲染树，只更新变化的部分
    ↓
用户看到更新后的页面
```

### RAG vs Fine-tuning

经常有人问：为什么不直接把文档"训练进去"（Fine-tuning），而要搞这么复杂的检索？

| 对比维度 | RAG | Fine-tuning |
|---------|-----|------------|
| 文档更新 | 重建索引（分钟级）| 重新训练（小时/天级）|
| 成本 | 低（只用嵌入 API）| 高（GPU 算力）|
| 幻觉风险 | 低（有原文依据） | 高（模型"记住"但不精确）|
| 可溯源 | 可以显示引用片段 | 不可溯源 |

大部分企业应用场景，RAG 是更实用的选择。Fine-tuning 适合调整模型的**风格和能力**，不适合喂给它**实时变化的知识**。

### 调试技巧

```python
# 在 st.chat_message 里加调试信息
with st.expander("🔍 调试信息", expanded=False):
    st.json(st.session_state.messages)
    st.write("当前 rag_enabled:", st.session_state.get("rag_enabled", False))
```

```python
# 查看 API 实际发了什么
import streamlit as st
with st.sidebar:
    if st.checkbox("显示请求详情"):
        st.json(messages_with_system[-3:])
```

---

## 附录：速查表

### Streamlit 核心组件

```python
st.title("标题")
st.markdown("# 大标题\n**加粗**")
st.chat_message("user")       # 对话气泡（role = user / assistant）
st.chat_input("提示文字")      # 对话输入框
st.write_stream(stream)        # 流式输出
st.session_state               # 跨执行状态字典
st.sidebar                     # 侧边栏上下文
st.columns(n)                  # n 列布局
st.metric("标签", "值")        # 数字卡片
st.expander("标题")            # 折叠面板
st.toggle("开关")
st.slider("label", min, max, default)
st.selectbox("label", options)
st.button("文字")
st.divider()                   # 分隔线
st.cache_resource              # 缓存外部连接（单例）
st.cache_data                  # 缓存函数返回值（可序列化）
st.secrets["KEY"]              # 读取 secrets.toml
st.rerun()                     # 强制重新运行脚本
```

### 常见报错索引

| 报错关键字 | 原因 | 解决 |
|-----------|------|------|
| `ModuleNotFoundError` | 包未安装 | `pip install 包名` |
| `KeyError: 'LLM_API_KEY'` | secrets.toml 缺少该键 | 检查文件拼写 |
| `AuthenticationError` | API Key 无效 | 重新生成密钥 |
| `This event loop is already running` | asyncio 嵌套 | `pip install nest_asyncio` |
| `503 Service Unavailable` | API 服务限速 | 等待后重试 |
| `JSONDecodeError` | RSS 返回非标准 XML | 换另一个 RSS 源 |
| `FileNotFoundError: vectorstore.json` | 未构建索引 | 点侧边栏「构建索引」按钮 |
