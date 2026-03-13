# AI 聊天机器人开发实战教程

> **面向**: 零基础学员 & 专业开发者  
> **方式**: 与 AI 编程助手（OpenCode）对话，逐步构建  
> **成果**: 一个自己亲手搭建的 AI 聊天机器人

---

## 写在前面

你即将亲手打造一个 AI 聊天机器人。不需要编程经验——你通过与 AI 编程助手对话，用自然语言描述想要的功能，AI 帮你编写代码。

我们用 **Streamlit**——一个 Python 框架，**几十行代码就能做出完整应用**，让你把精力集中在理解 AI 概念上，而不是纠结界面开发。

6 个阶段，每一轮给你的机器人增加一个新能力：

```
阶段1: 它能聊天           ← 今天从这里开始
阶段2: 你能调控它的"性格"
阶段3: 它能读懂你的文档（RAG）
阶段4: 它能查天气（API调用）
阶段5: 它能读新闻（MCP协议）
阶段6: 它能搜索互联网
```

---

# 第一章: 让 AI 开口说话

## 🎯 学习目标

- 理解大语言模型 (LLM) 是如何通过 API 调用的
- 知道"消息角色"（System / User / Assistant）的含义
- 拥有一个能实时显示 AI 回复的聊天界面

## 📖 概念讲解

### 什么是 LLM API？

你用 ChatGPT 时，背后有个"大脑"——**大语言模型 (LLM)**。**API** 就是一个"窗口"：问题递进去，回答递出来。

```
你的程序  →  [API窗口]  →  AI大脑  →  [API窗口]  →  回答
```

我们用**硅基流动**平台的 API（兼容 OpenAI 格式，免费模型可用）。

> ✨ **通用设计**：所有配置写在 `secrets.toml` 文件里。以后换其他 AI 服务，只改配置文件就行。

### 消息角色

| 角色 | 作用 | 例子 |
|------|------|------|
| 🎭 `system` | AI 的身份设定 | "你是专业花艺顾问" |
| 👤 `user` | 你说的话 | "推荐母亲节的花" |
| 🤖 `assistant` | AI 的回复 | "推荐康乃馨搭配百合…" |

### 流式输出

文字一个一个"打"出来的效果 = **流式输出 (Streaming)**。体验更好！

## 🛠️ 动手实操

### 准备工作

**① 注册硅基流动**：访问 https://cloud.siliconflow.cn → 注册 → 创建 API 密钥

**② 创建项目** — 在 OpenCode 中输入：

> *"帮我创建一个 Python 项目目录 aigc-chatbot。创建 requirements.txt 包含 streamlit 和 openai。创建 .streamlit/secrets.toml 文件，包含 LLM_API_KEY、LLM_BASE_URL（值为 https://api.siliconflow.cn/v1）、LLM_DEFAULT_MODEL（值为 deepseek-ai/DeepSeek-V3.2）。然后帮我安装依赖。"*

**③ 创建聊天应用** — 在 OpenCode 中输入：

> *"创建 app.py，用 Streamlit 做一个 AI 聊天应用：用 openai 库连接 secrets 中配置的 LLM API，用 st.chat_message 显示对话历史，用 st.chat_input 接收输入，调用 chat.completions.create 流式生成回复，用 st.write_stream 逐字显示。在 session_state 中维护对话历史。侧边栏放清空对话按钮。"*

**④ 运行！**

```bash
streamlit run app.py
```

浏览器自动打开——试着聊两句吧！🎉

## 🔍 代码解读

```python
# 连接 AI 服务
client = OpenAI(
    api_key=st.secrets["LLM_API_KEY"],
    base_url=st.secrets["LLM_BASE_URL"]
)

# 流式调用 AI
response = client.chat.completions.create(
    model=st.secrets["LLM_DEFAULT_MODEL"],
    messages=st.session_state.messages,  # 发送所有历史消息
    stream=True                          # 流式输出
)

# 一行代码实现逐字显示！
result = st.write_stream(response)
```

**为什么发送所有历史消息？** AI 没有"记忆"，每次从零开始。发送历史让 AI "记住"上下文。

## ✅ 自测

1. 想让 AI 扮演诗人，修改哪个角色的消息？
2. 为什么 API Key 不直接写在代码里，而是放 secrets.toml？
3. `stream=True` 的作用是什么？

## 🏆 挑战

- 修改代码让 AI 变成"只用文言文回答"的机器人
- 在 secrets.toml 中换成 `Qwen/Qwen2.5-7B-Instruct`（免费），对比效果

---

# 第二章: 调控 AI 的"性格"

## 🎯 学习目标

- 理解 temperature、top_p 等参数
- 能通过调参感受 AI 输出变化
- 掌握 Prompt Engineering 基础

## 📖 概念讲解

### Temperature：创意旋钮

| 值 | 行为 | 场景 |
|----|------|------|
| 0 | 每次回答几乎相同 | 数学、事实查询 |
| 0.7 | 稳定中有变化 | 日常对话 |
| 1.5+ | 非常随机 | 创意写作 |

**类比**：厨师做菜。temperature=0 严格按食谱；=1.5 随性发挥。

### System Prompt：AI 的"人设"

```
❌ 弱: "你是助手"
✅ 强: "你是易速鲜花的资深花艺师，有20年经验。
       说话时喜欢用花的寓意来比喻。回答控制在100字以内。"
```

## 🛠️ 动手实操

在 OpenCode 中输入：

> *"在 app.py 的侧边栏添加参数面板：模型选择下拉框（DeepSeek-V3.2默认、Qwen2.5-7B免费、DeepSeek-R1推理）、temperature 滑块（0到2，默认0.7）、top_p 滑块（0到1，默认0.9）、max_tokens 数字输入（默认1024）、system prompt 文本框。把这些参数用到 chat.completions.create 调用中。每个参数旁加简短中文说明。"*

## 🧪 实验

同一问题"给我讲个关于猫的故事"，分别用 temperature = 0 / 0.7 / 1.5，记录差异。

## ✅ 自测

1. AI 回答数学题，temperature 应设高还是低？
2. `max_tokens=10` 会怎样？
3. temperature 和 top_p 建议同时大幅调整吗？

---

# 第三章: 让 AI 读懂你的文档 — RAG

## 🎯 学习目标

- 理解 RAG（检索增强生成）原理
- 知道什么是向量嵌入和相似度
- 为 Chatbot 挂载"易速鲜花"知识库

## 📖 概念讲解

### 为什么需要 RAG？

LLM 不懂你公司的私有文档。**RAG** = 先从文档里**搜到**相关内容，再让 AI **基于这些内容**回答。

```
传统: 提问 → AI 凭记忆（可能瞎说）
RAG: 提问 → 搜索文档 → 把内容给 AI → AI 基于文档回答
```

**类比**：闭卷考试 vs **开卷考试**。

### 向量嵌入

把文字变成一串数字（向量），含义相近的文字 → 数字也相近。

```
"鲜花保养"  → [0.23, 0.87, ...]
"花卉养护"  → [0.25, 0.85, ...]  ← 很接近！
"今天天气"  → [0.91, 0.12, ...]  ← 差很远
```

### RAG 的本质

一句话：**把搜到的文档片段拼进 System Prompt**。就这么简单。

## 🛠️ 动手实操

确保 `oneflower/` 目录有易速鲜花文档，然后在 OpenCode 中分步输入：

**步骤1**：*"创建 rag/loader.py，读取 oneflower 目录下所有 .txt 和 .md 文件，按段落切分成500字片段（保留100字重叠），返回列表"*

**步骤2**：*"创建 rag/embeddings.py，用 openai 库调用 secrets 中的 EMBEDDING_MODEL 嵌入模型，接收文本列表，返回向量列表"*

**步骤3**：*"创建 rag/vectorstore.py，实现 build_index（批量生成向量存JSON）和 search（余弦相似度检索 top-3）"*

**步骤4**：*"修改 app.py，侧边栏加'知识库模式'开关和'构建索引'按钮。开启时检索知识库并注入 system prompt。AI 回复下方用 st.expander 显示引用来源和分数。"*

## 🔬 [进阶] 重排序

> 有技术基础的学员试试：

向量检索是"粗搜"——重排序是"精排"。在 OpenCode 中输入：

> *"创建 rag/reranker.py，调用 secrets 中 RERANK_MODEL 的 /rerank 接口，对 top-10 粗检索结果精排出 top-3。侧边栏加'启用重排序'开关。"*

## ✅ 自测

1. RAG 解决了 LLM 的哪两个局限？
2. 为什么要切分文档而不是整篇塞给 AI？
3. 余弦相似度 = 0.95 说明什么？

---

# 第四章: 让 AI 查天气 — Function Calling

## 🎯 学习目标

- 理解 Function Calling（工具调用）
- 知道 AI 如何"决定"何时调用工具
- 为 Chatbot 添加天气查询

## 📖 概念讲解

### Function Calling：给 AI 装上"手脚"

AI 只能用"大脑"回答。问实时天气——它不知道！Function Calling 让 AI 能"伸手"拿数据。

### 两次调用模式

```
第1次: "用户问天气" → AI: "请调用 get_weather(city='Beijing')"
                                ↓ 系统执行 wttr.in
第2次: "天气数据: 15°C" → AI: "北京今天15度，晴朗！"
```

**类比**：你让秘书安排晚餐。第一次——"我查查那餐厅有没有位"。帮她查完后，第二次——"有位，帮您订了7点的"。

## 🛠️ 动手实操

在 OpenCode 中输入：

> *"添加天气查询功能：1) 创建 tools/weather.py，用 requests 调用 wttr.in API（https://wttr.in/{city}?format=j1），返回温度、天气、湿度等；2) 修改 app.py 实现 Function Calling——定义 get_weather 工具 Schema，第一次非流式调用判断是否需工具，如需要则执行后第二次流式调用生成回答；3) 天气结果用 st.metric 或 st.info 展示"*

## ✅ 自测

1. Function Calling 为什么需要两次调用？
2. 问"写首诗"，AI 会调用天气工具吗？为什么？

---

# 第五章: 让 AI 读新闻 — MCP 协议

## 🎯 学习目标

- 理解 MCP（Model Context Protocol）
- 知道 Server/Client 关系
- 为 Chatbot 接入新闻

## 📖 概念讲解

### MCP：AI 世界的"USB接口"

以前每种设备不同接口——USB 出现后一个接口通吃。**MCP** 就是 AI 的"USB"——统一标准连接各种工具。

| 角色 | 负责 | 类比 |
|------|------|------|
| **MCP Server** | 提供能力（读RSS） | USB设备 |
| **MCP Client** | 调用能力 | 电脑USB口 |

## 🛠️ 动手实操

> *"接入 MCP 新闻：1) pip install mcp；2) 创建 tools/news.py 用 MCP Python SDK 连接 feed-mcp 获取 RSS 新闻；3) 在 app.py 工具列表添加 get_news 工具；4) 新闻用 st.expander 展示标题和摘要"*

## ✅ 自测

1. MCP 和直接调 API 有什么区别？
2. MCP Server 和 Client 谁提供能力？

---

# 第六章: 让 AI 搜索互联网

## 🎯 学习目标

- 掌握多工具编排
- 完成"全能助手"

## 📖 概念讲解

### 多工具编排

你的 Chatbot 现在有多种能力。AI 靠**工具描述**（description）自主判断用哪个：

```
"北京天气"  → 🌤️ 天气工具
"今日新闻"  → 📰 新闻工具
"鲜花保养"  → 📚 知识库
"量子计算"  → 🔍 搜索
"写首诗"    → 🧠 直接回答
```

## 🛠️ 动手实操

> *"添加搜索功能：1) pip install duckduckgo-search；2) 创建 tools/search.py 用 DDGS 库搜索；3) 在工具列表添加 search_web 工具，描述为'搜索互联网，当其他工具无法满足时调用'；4) 测试多工具正确分派"*

## 🎉 全局回顾

| 阶段 | 能力 | AI 概念 |
|------|------|---------|
| 1 | 🗣️ 能对话 | LLM API、流式输出 |
| 2 | 🎛️ 可调参数 | Temperature、Prompt Engineering |
| 3 | 📖 懂文档 | RAG、Embedding |
| 4 | 🌤️ 查天气 | Function Calling |
| 5 | 📰 读新闻 | MCP 协议 |
| 6 | 🔍 搜互联网 | 多工具编排 |

这就是市面上大多数 AI 应用的核心架构！🎉

---

# 附录

## A. 硅基流动注册指南

1. 访问 https://cloud.siliconflow.cn → 注册
2. 控制台 → API 密钥 → 创建新密钥 → 复制保存

## B. 常见问题

| 问题 | 解决 |
|------|------|
| streamlit 启动失败 | 检查 `pip install streamlit` 是否成功 |
| API Key 无效 | 重新创建密钥 |
| AI 不回复 | 检查网络；secrets.toml 中配置是否正确 |
| 代码报错 | 把报错信息贴给 OpenCode："帮我修这个错" |

## C. 术语表

| 术语 | 含义 |
|------|------|
| LLM | 大语言模型 |
| RAG | 检索增强生成——结合文档检索提升回答 |
| Embedding | 将文本转为数字向量 |
| Function Calling | AI 调用外部工具的能力 |
| MCP | AI 连接工具的统一标准协议 |
| Temperature | 控制 AI 回答随机性的参数 |
