# AI Chatbot 演练项目 — 施工手册（Python / Streamlit 版）

> **版本**: v2-streamlit | **日期**: 2026-03-13
> **适用对象**: 课程制作团队
> **核心任务**: 制作教学素材（参考代码 + 提示词模板 + 教案）

---

> [!CAUTION]
> **你们的任务不是做一个 chatbot 成品。** 而是制作教学素材，让学员通过与 OpenCode 对话，自己把每个阶段做出来。交付物：
> 1. 每阶段的**参考代码**（`completed/`）
> 2. 每阶段的**提示词模板**（学员给 OpenCode 说什么）
> 3. 验证过的**阶段 README**

---

## 1. 工作流程

```
对于每个 Phase:
  ① 自己用 OpenCode 对话把这个阶段做出来
  ② 记录每条自然语言指令（原话）
  ③ 打磨指令，确保新手照着输入也能成功
  ④ 整理代码为参考答案，放入 completed/
  ⑤ 找有代码经验但不熟悉 Streamlit 的人测试
```

**验收标准**：有 Python 基础的学员按提示词输入 OpenCode，生成的代码能**直接运行**。

---

## 2. 环境准备

### 前置条件

```
Python >= 3.10
pip
OpenCode（已配置好硅基流动 API Key）
Node.js（Phase 5 MCP 需要 npx）
```

### 快速安装

```bash
# 项目初始化
pip install streamlit openai

# Phase 3 追加
pip install numpy pypdf python-docx

# Phase 4 追加
pip install requests

# Phase 5 追加
pip install mcp
# Windows 若报 EventLoop 错误：
pip install nest_asyncio

# Phase 6（选修）
# pip install duckduckgo-search

# 或一次性（清华镜像加速）：
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
```

### `.streamlit/secrets.toml`

```toml
LLM_API_KEY       = "sk-your-key"
LLM_BASE_URL      = "https://api.siliconflow.cn/v1"
LLM_DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3"
EMBEDDING_MODEL   = "BAAI/bge-m3"
RERANK_MODEL      = "BAAI/bge-reranker-v2-m3"
```

> [!NOTE]
> **不要将 `secrets.toml` 提交到 Git**。在 `.gitignore` 中添加 `.streamlit/secrets.toml`。

---

## 3. Phase 1：基础聊天

### 提示词模板

**第一步（项目初始化）**：
```
帮我创建一个 Python 项目，目录名为 aigc-chatbot-python。
创建以下文件：
- requirements.txt，包含 streamlit>=1.35 和 openai>=1.0
- .streamlit/secrets.toml，包含：
    LLM_API_KEY = "sk-xxx"（替换为真实 Key）
    LLM_BASE_URL = "https://api.siliconflow.cn/v1"
    LLM_DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3"
- .gitignore，加入 .streamlit/secrets.toml 和 __pycache__/

然后运行 pip install -r requirements.txt 安装依赖。
```

**第二步（聊天应用）**：
```
创建 app.py，用 Streamlit 实现一个 AI 聊天应用：
1. 用 openai 库连接 st.secrets 中配置的 LLM，base_url 设为 LLM_BASE_URL
2. 用 st.chat_message 显示对话历史，区分 user 和 assistant 角色
3. 用 st.chat_input 接收用户输入
4. 调用 chat.completions.create（stream=True），用 st.write_stream 逐字显示
5. 用 st.session_state 维护对话历史列表（每条含 role 和 content）
6. 侧边栏加「清空对话」按钮，点击后清空 session_state.messages
```

### 参考架构

```python
import streamlit as st
from openai import OpenAI

# 初始化 OpenAI 客户端（单例，避免重复创建）
@st.cache_resource
def get_client():
    return OpenAI(
        api_key=st.secrets["LLM_API_KEY"],
        base_url=st.secrets["LLM_BASE_URL"]
    )

client = get_client()

st.title("🤖 AI 聊天助手")

# 初始化消息历史
if "messages" not in st.session_state:
    st.session_state.messages = []

# 侧边栏
with st.sidebar:
    if st.button("🗑️ 清空对话"):
        st.session_state.messages = []
        st.rerun()

# 渲染历史消息
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# 接收用户输入
if prompt := st.chat_input("输入你的问题..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        stream = client.chat.completions.create(
            model=st.secrets["LLM_DEFAULT_MODEL"],
            messages=st.session_state.messages,
            stream=True
        )
        response = st.write_stream(stream)

    st.session_state.messages.append({"role": "assistant", "content": response})
```

### 关键技术要点

| 要点 | 说明 |
|------|------|
| `@st.cache_resource` | 缓存 OpenAI 客户端，避免每次交互重新创建 |
| `st.session_state` | Streamlit 每次交互重新运行整个脚本，必须用 session_state 保持状态 |
| `st.write_stream` | 内置流式输出，自动处理 OpenAI stream 响应 |
| `st.secrets` | 读取 `.streamlit/secrets.toml`，密钥不暴露在代码里 |

### 验证清单

- [ ] `streamlit run app.py` 启动无报错
- [ ] 浏览器聊天界面正常显示
- [ ] 输入消息后 AI 逐字回复（流式）
- [ ] 多轮对话上下文保持（AI 能回忆上一句）
- [ ] 清空对话按钮生效

---

## 4. Phase 2：参数调优面板

### 提示词模板

```
在 app.py 的侧边栏"清空对话"按钮下方添加参数调优面板，用 st.divider 分隔：
1. st.subheader("⚙️ 模型参数")
2. st.selectbox 模型选择，选项：
   - "deepseek-ai/DeepSeek-V3"（默认，推荐）
   - "Qwen/Qwen2.5-7B-Instruct"（免费）
   - "deepseek-ai/DeepSeek-R1"（推理增强）
3. st.slider temperature，范围 0.0-2.0，默认 0.7，
   在滑块下加说明文字"越高越有创意，越低越严谨"
4. st.slider top_p，范围 0.0-1.0，默认 0.9
5. st.number_input max_tokens，范围 64-4096，默认 1024
6. st.divider 分隔后 st.text_area system_prompt，
   默认值"你是一个友好的 AI 助手。"，高度 100px
7. 将以上所有参数传入 chat.completions.create 调用中
```

### 参考架构（增量部分）

```python
with st.sidebar:
    if st.button("🗑️ 清空对话"):
        st.session_state.messages = []
        st.rerun()

    st.divider()
    st.subheader("⚙️ 模型参数")

    model = st.selectbox("模型", [
        "deepseek-ai/DeepSeek-V3",
        "Qwen/Qwen2.5-7B-Instruct",
        "deepseek-ai/DeepSeek-R1"
    ])

    temperature = st.slider("Temperature", 0.0, 2.0, 0.7, 0.05)
    st.caption("越高越有创意，越低越严谨")

    top_p = st.slider("Top-P", 0.0, 1.0, 0.9, 0.05)
    max_tokens = st.number_input("Max Tokens", 64, 4096, 1024)

    st.divider()
    system_prompt = st.text_area(
        "System Prompt", "你是一个友好的 AI 助手。", height=100
    )

# 调用时传入参数和 system 消息
messages_with_system = [
    {"role": "system", "content": system_prompt}
] + st.session_state.messages

stream = client.chat.completions.create(
    model=model,
    messages=messages_with_system,
    temperature=temperature,
    top_p=top_p,
    max_tokens=max_tokens,
    stream=True
)
```

### 教学活动

对比实验记录表（同一问题，不同 temperature）：

| temperature | 回答特点 | 是否每次相同 |
|-------------|---------|-------------|
| 0 | | |
| 0.7 | | |
| 1.5 | | |

### 验证清单

- [ ] 侧边栏所有控件正常显示
- [ ] temperature=0 时多次回答高度一致
- [ ] temperature=1.5 时回答明显更随机
- [ ] 切换到 DeepSeek-R1 能看到推理过程（如有）
- [ ] 修改 System Prompt 后 AI 行为改变

---

## 5. Phase 3：RAG 知识问答

### 提示词模板（分步）

**步骤1 — 文档加载器**：
```
创建 rag/loader.py，导出 load_and_chunk(directory: str) 函数：
- 读取目录下所有 .txt、.md 文件（用 pathlib），以及 .pdf（pypdf）和 .docx（python-docx）
- 将每个文件内容按段落切分成约 500 字的片段，相邻片段保留 100 字重叠
- 返回列表，每项格式：{"content": str, "source": 文件名, "index": 序号}
- 空文件或解析失败的文件打印警告后跳过
```

**步骤2 — 嵌入模块**：
```
创建 rag/embeddings.py，导出 get_embeddings(texts: list[str]) 函数：
- 用 openai 库的 client.embeddings.create，模型从 st.secrets["EMBEDDING_MODEL"] 读取
- 每次最多批量处理 100 条，超出时分批调用
- 返回 list[list[float]] 向量列表
- 注意：openai client 需作为参数传入或从外部获取，不要在模块内硬编码
```

**步骤3 — 向量存储**：
```
创建 rag/vectorstore.py，导出两个函数：
1. build_index(chunks, embeddings, save_path="rag/vectorstore.json")
   将文档片段和对应向量序列化保存为 JSON 文件
2. search(query_embedding, top_k=3, index_path="rag/vectorstore.json") -> list[dict]
   加载索引，用 numpy 计算余弦相似度，返回相似度最高的 top_k 个片段
   每项包含：content, source, index, score
```

**步骤4 — 集成到主应用**：
```
修改 app.py，添加 RAG 功能：
1. 侧边栏加"知识库设置"分区（st.subheader）
2. st.toggle "开启知识库模式"，存为 session_state.rag_enabled
3. st.button "构建索引"：点击后调用 load_and_chunk("oneflower")，
   获取嵌入后调用 build_index 保存，用 st.success 显示"已索引 N 个片段"
4. 用 @st.cache_data 缓存加载的索引内容，避免重复读文件
5. 对话时若 rag_enabled：
   a. 对用户问题调用 get_embeddings，再调用 search 取 top-3 片段
   b. 将片段内容拼入 system 消息："参考以下文档内容回答：\n\n{片段}"
6. AI 回复后用 st.expander("📚 引用来源", expanded=False) 显示每个片段的
   来源文件名 + 相似度分数 + 内容前 200 字
```

**[进阶] 步骤5 — 重排序**：
```
创建 rag/reranker.py，导出 rerank(query: str, chunks: list[dict], top_n=3) 函数：
- 用 requests 调用硅基流动的重排序接口：
  POST {LLM_BASE_URL}/rerank
  Body: {"model": RERANK_MODEL, "query": query, "documents": [c["content"] for c in chunks], "top_n": top_n}
  Header: Authorization: Bearer {LLM_API_KEY}
- 返回按相关性重排后的 top_n 个片段（保留原始片段信息）

修改 app.py：侧边栏加 st.toggle "启用重排序（进阶）"。
开启时，先粗检索 top-10，再重排序取 top-3。
```

### 关键技术要点

| 要点 | 说明 |
|------|------|
| RAG 本质 | 检索相关文档片段 → 拼入 system prompt → LLM 基于文档回答 |
| `@st.cache_data` | 缓存构建好的索引，参数变化时才重新计算 |
| 嵌入 API 批量 | `client.embeddings.create(input=[...])` 支持批量，减少 API 调用次数 |
| 余弦相似度 | `np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))` |
| 分批嵌入 | 一次不要超 100 条，防止 API 超时 |

### 验证清单

- [ ] `pip install numpy pypdf python-docx` 依赖安装完成
- [ ] 点击「构建索引」成功，显示片段数
- [ ] 开启 RAG，问「易速鲜花退换货政策」，答案引用了文档
- [ ] 关闭 RAG，同样提问，AI 无法给出具体答案
- [ ] 展开「引用来源」能看到文件名和相似度分数
- [ ] [进阶] 重排序开关切换，结果顺序有变化

---

## 6. Phase 4：Function Calling — 天气

### 提示词模板

```
添加天气查询功能：

1. 创建 tools/weather.py，导出 get_weather(city: str) 函数：
   - 调用 requests.get(f"https://wttr.in/{city}?format=j1", timeout=10)
   - 解析返回的 JSON，提取当前天气：
     temp_C（温度）、FeelsLikeC（体感）、humidity（湿度）、weatherDesc（天气描述）
   - 返回 dict：{"city": city, "temp": ..., "feels_like": ..., "humidity": ..., "description": ...}
   - 异常时抛出带描述的 RuntimeError

2. 修改 app.py，实现 Function Calling 两阶段调用：
   a. 定义 tools 列表，包含 get_weather 工具的 JSON Schema：
      name="get_weather"，description="获取指定城市的实时天气"
      参数：city（string，必填，城市名，英文）
   b. 第1次调用：非流式（stream=False），传入 tools 参数
   c. 检查 finish_reason：
      - 若等于 "tool_calls"：解析 tool_calls[0]，执行 get_weather，
        将结果序列化后作为 role="tool" 的消息追加到 messages，
        再进行第2次流式调用生成最终回复
      - 否则：直接将第1次的 message content 流式显示
   d. 天气结果在 st.chat_message("assistant") 内用 st.columns(3) + st.metric 展示：
      温度 | 体感温度 | 湿度，下方再 st.write_stream 显示文字描述
```

### 参考架构（Function Calling 核心逻辑）

```python
import json
from tools.weather import get_weather

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的实时天气数据。用户询问天气、气温、下雨等问题时调用。",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名（英文），如 Beijing、Shanghai"
                    }
                },
                "required": ["city"]
            }
        }
    }
]

# 第1次调用（非流式，判断是否需要工具）
first_response = client.chat.completions.create(
    model=model,
    messages=messages_with_system,
    tools=TOOLS,
    stream=False
)

choice = first_response.choices[0]

if choice.finish_reason == "tool_calls":
    # 解析工具调用
    tool_call = choice.message.tool_calls[0]
    args = json.loads(tool_call.function.arguments)
    
    # 执行工具
    weather_data = get_weather(args["city"])
    
    # 展示天气卡片
    with st.chat_message("assistant"):
        cols = st.columns(3)
        cols[0].metric("🌡️ 温度", f"{weather_data['temp']}°C")
        cols[1].metric("🤔 体感", f"{weather_data['feels_like']}°C")
        cols[2].metric("💧 湿度", f"{weather_data['humidity']}%")
    
    # 追加工具结果，第2次调用
    messages_with_system.append(choice.message)
    messages_with_system.append({
        "role": "tool",
        "tool_call_id": tool_call.id,
        "content": json.dumps(weather_data, ensure_ascii=False)
    })
    
    with st.chat_message("assistant"):
        stream = client.chat.completions.create(
            model=model,
            messages=messages_with_system,
            stream=True
        )
        response = st.write_stream(stream)
else:
    # 普通对话，直接使用第1次结果
    response = choice.message.content
    with st.chat_message("assistant"):
        st.markdown(response)
```

### 验证清单

- [ ] 问「北京天气」返回实时数据，显示温度卡片
- [ ] 问「上海今天冷吗」也能识别城市并查询
- [ ] 问「帮我写一首诗」不触发工具，正常聊天
- [ ] 天气工具和 RAG 可同时开启，互不干扰

---

## 7. Phase 5：MCP — 新闻

### 提示词模板

```
添加新闻查询功能：

1. pip install mcp

2. 创建 tools/news.py，导出 get_news(topic: str = "general") 函数：
   - 主路径：使用 MCP Python SDK 连接 feed-mcp RSS Server：
     from mcp import ClientSession, StdioServerParameters
     from mcp.client.stdio import stdio_client
     用 asyncio 运行，通过 npx -y feed-mcp 启动子进程
     调用 get_feed 工具，传入对应 RSS URL
   - 降级路径：MCP 失败时，直接 requests.get 抓 RSS XML，
     用正则解析 <item> 标签，提取 title / link / pubDate / description
   - RSS 源（国内可访问，每次最多返回 10 条）：
     tech:    https://hnrss.org/frontpage
     general: https://www.oschina.net/news/rss
     world:   https://rss.dw.com/xml/rss-zh-all
     finance: https://36kr.com/feed
   - 返回 {"topic": topic, "source": url, "items": [{title, link, pubDate, summary}]}

3. 修改 app.py，在 TOOLS 列表中追加 get_news 工具定义：
   name="get_news"，description="获取最新新闻资讯。用户询问新闻、热点事件、今日头条时调用。"
   参数：topic（可选，枚举值 tech/general/finance/world，默认 general）

4. 新闻结果在 st.chat_message("assistant") 内用 st.expander 逐条展示：
   标题（加粗）+ 摘要 + 来源链接
```

### 参考架构（`tools/news.py`）

```python
import asyncio
import re
import requests

# RSS 源（国内可访问）
RSS_FEEDS = {
    "tech":    "https://hnrss.org/frontpage",
    "general": "https://www.oschina.net/news/rss",
    "world":   "https://rss.dw.com/xml/rss-zh-all",
    "finance": "https://36kr.com/feed",
}
MAX_ITEMS = 10

# MCP 初始化状态
_mcp_failed = False


async def _fetch_via_mcp(feed_url: str) -> list[dict]:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    server_params = StdioServerParameters(command="npx", args=["-y", "feed-mcp"])
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool("get_feed", {"url": feed_url})
            # 解析 MCP 返回内容
            text = ""
            if hasattr(result, "content"):
                for block in result.content:
                    if hasattr(block, "text"):
                        text += block.text
            return _parse_rss_xml(text)


def _fetch_via_rss(feed_url: str) -> list[dict]:
    resp = requests.get(feed_url, timeout=10,
                        headers={"User-Agent": "aigc-chatbot/2.0"})
    resp.raise_for_status()
    return _parse_rss_xml(resp.text)


def _parse_rss_xml(xml: str) -> list[dict]:
    items = []
    for m in re.finditer(r"<item[^>]*>([\s\S]*?)</item>", xml, re.I):
        item_xml = m.group(1)
        title   = _extract(item_xml, "title")
        link    = _extract(item_xml, "link") or _extract(item_xml, "guid")
        pub     = _extract(item_xml, "pubDate")
        desc    = re.sub(r"<[^>]+>", "", _extract(item_xml, "description"))[:200]
        if title:
            items.append({"title": title.strip(), "link": link.strip(),
                          "pubDate": pub.strip(), "summary": desc.strip()})
        if len(items) >= MAX_ITEMS:
            break
    return items


def _extract(xml: str, tag: str) -> str:
    m = re.search(rf"<{tag}[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))",
                  xml, re.I)
    return (m.group(1) or m.group(2) or "") if m else ""


def get_news(topic: str = "general") -> dict:
    global _mcp_failed
    feed_url = RSS_FEEDS.get(topic.lower(), RSS_FEEDS["general"])

    if not _mcp_failed:
        try:
            # Windows + Streamlit 可能有事件循环冲突，使用 nest_asyncio 解决
            try:
                import nest_asyncio
                nest_asyncio.apply()
            except ImportError:
                pass
            items = asyncio.run(_fetch_via_mcp(feed_url))
            if items:
                return {"topic": topic, "source": feed_url, "items": items}
        except Exception as e:
            print(f"[News] MCP 失败，降级到直接 RSS：{e}")
            _mcp_failed = True

    items = _fetch_via_rss(feed_url)
    return {"topic": topic, "source": feed_url, "items": items}
```

### 关键技术要点

| 要点 | 说明 |
|------|------|
| `asyncio.run()` | 在同步函数中运行异步代码 |
| `nest_asyncio` | Streamlit 已有事件循环时，允许嵌套调用（Windows 常见） |
| `_mcp_failed` 单例状态 | 一次失败后直接走降级路径，不再重试 MCP |
| `StdioServerParameters` | 通过 stdio 启动 npx 子进程，Windows 需要 Node.js 环境 |

### 验证清单

- [ ] 问「今天有什么科技新闻」返回新闻标题列表
- [ ] 展开每条新闻能看到摘要和链接
- [ ] 天气工具和新闻工具共存正常分派
- [ ] MCP 失败时自动降级，日志打印降级信息

---

## 8. Phase 6：搜索引擎（选修）

### 提示词模板

```
添加网络搜索功能（选修）：

1. 创建 tools/search.py，导出 search_web(query: str) 函数：
   - 调用 DuckDuckGo Instant Answer API（无需 Key）：
     GET https://api.duckduckgo.com/?q={query}&format=json&no_html=1&skip_disambig=1
     中文查询时附加 kl=cn-zh 参数
   - 提取：Heading、Abstract、Answer、Definition、RelatedTopics（前5条）
   - 若无内容（Abstract 和 Answer 均为空）：返回备用搜索链接：
     中文查询：返回必应(cn.bing.com)和百度链接
     英文查询：返回 DuckDuckGo 搜索页链接
   - 返回 {heading, abstract, answer, definition, relatedTopics: [{text, url}]}

2. 在 app.py 的 TOOLS 列表中追加 search_web 工具：
   name="search_web"
   description="搜索互联网获取信息。当用户询问定义、概念、人物、
   特定知识，且天气工具和新闻工具均不适用时调用。
   不用于天气查询（用 get_weather），不用于热点新闻（用 get_news）。"
   参数：query（string，搜索关键词）

3. 搜索结果用 st.expander 显示摘要和相关链接（可点击）
```

### 验收（四工具测试矩阵）

| 问题 | 期望工具 | 通过？ |
|------|---------|-------|
| 「深圳今天天气」 | get_weather | |
| 「今日财经新闻」 | get_news | |
| 「什么是量子纠缠」 | search_web | |
| 「帮我写一首诗」 | 无工具，直接回答 | |
| 「易速鲜花如何保鲜」（开启RAG） | RAG 检索 | |

---

## 9. 代码管理

```bash
# 每阶段打标签
git tag py-phase-1-basic-chat
git tag py-phase-2-param-tuning
git tag py-phase-3-rag
git tag py-phase-4-weather
git tag py-phase-5-mcp-news
git tag py-phase-6-search
```

---

## 10. 讲师教案规范

| 环节 | 时长 |
|------|------|
| 开场演示（展示该阶段最终效果） | 2 min |
| 概念讲解（类比 + 架构图） | 10 min |
| 带练示范（讲师在 OpenCode 中操作） | 5 min |
| 学员实操 | 20-25 min |
| 验证答疑 | 10 min |

### 常见问题预案

| 问题 | 应对 |
|------|------|
| 代码报语法错误 | 把报错贴给 OpenCode："帮我修这个错误" |
| `streamlit run` 失败 | 检查 Python 版本（需 3.10+）、`pip install` 是否完整 |
| `ModuleNotFoundError` | `pip install` 对应包 |
| API Key 失效 | 重新去硅基流动创建密钥，更新 secrets.toml |
| MCP 启动超时 | 检查 Node.js 是否安装；或直接走降级路径 |
| 嵌入 API 慢 | 提前提示：首次构建索引需要 1-2 分钟 |
| Windows 事件循环报错 | `pip install nest_asyncio`，在 news.py 顶部加 `import nest_asyncio; nest_asyncio.apply()` |
