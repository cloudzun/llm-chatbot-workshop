# AI 聊天机器人开发实战教程（Python / Streamlit 版）

> **版本**: v1.0 | **日期**: 2026-06-01
> **面向对象**: 有一定 Python 基础的学员 & 零基础但愿意动手的学员
> **教学方式**: 与 AI 编程助手（OpenCode）对话，逐步构建
> **最终成果**: 一个具备知识问答、天气查询、新闻阅读、网络搜索能力的智能聊天机器人

---

> **给同学的一封信**
>
> 你不需要是一名资深 Python 工程师就能完成这门课。你要做的，是用中文告诉 AI 编程助手（OpenCode）你想要什么，它来帮你写代码。整个过程更像"指挥"而不是"编程"。
>
> 当然，如果你本来就是开发者，这门课会让你对 LLM 应用架构有更深的直觉——而不只是会 `pip install langchain`。
>
> 这个版本选择了 **Streamlit** 作为界面框架。它的最大特点是：整个应用就是一个 Python 脚本 `app.py`，没有前端、没有后端，没有 HTML/CSS/JavaScript——你的用户界面和 AI 调用逻辑全部在一个文件里。这让你能把全部注意力放在"AI 能力"本身，而不是被前后端联调分心。
>
> 我们将构建的这个 chatbot，覆盖了当前大多数 AI 应用产品的核心技术栈：API 调用、流式输出、参数调优、RAG 知识库、Function Calling、MCP 协议。完成它，你就拥有了拆解任何 AI 应用产品的基础认知框架。
>
> 开始吧。

---

## 课程全景地图

你将经历 6 个阶段，每个阶段都在上一个基础上**增加一种新能力**：

```
Phase 1 ──── 它能和你聊天（Streamlit + session_state + 流式输出）
   │
Phase 2 ──── 你能调控它的"性格"（temperature / System Prompt / 模型切换）
   │
Phase 3 ──── 它能读懂你上传的私有文档（RAG 知识库 + 嵌入向量 + 重排序）
   │
Phase 4 ──── 它能查询实时天气（Function Calling + 工具定义）
   │
Phase 5 ──── 它能阅读网络新闻（多工具 + RSS 新闻抓取）
   │
Phase 6 ──── 它能搜索互联网（DDG 搜索 + 多工具编排）
```

每个阶段对应 `python/phases/phase-N/` 目录，其中包含：
- `starter/` — 有 TODO 注释的起始代码，等待你补全
- `completed/` — 完整参考实现，遇到卡点时参考用
- `README.md` — 本阶段说明和 OpenCode 提示词

---

## 第 0 章：开始之前 — 环境准备

在动手之前，先确认你的电脑满足运行条件。

### 0.1 你需要的工具

| 工具 | 用途 | 获取方式 |
|------|------|---------|
| **Python 3.10+** | 运行 Streamlit 应用 | https://www.python.org（选最新稳定版） |
| **pip** | 安装 Python 包 | Python 安装时自带 |
| **OpenCode** | AI 编程助手，帮你写代码 | 讲师已提前安装配置 |
| **浏览器** | 使用你的 chatbot | Chrome / Edge 均可 |
| **硅基流动账号** | 提供 AI 大模型 API | https://cloud.siliconflow.cn |

> 💡 **建议使用虚拟环境（venv）**：每个阶段的 `completed/` 目录内都有 `requirements.txt`，进入目录后执行 `python -m venv .venv && .venv\Scripts\activate`（Windows）或 `python -m venv .venv && source .venv/bin/activate`（Mac/Linux）创建隔离环境，避免包版本冲突。

### 0.2 注册硅基流动账号并获取 API Key

1. 访问 https://cloud.siliconflow.cn，点击"注册"
2. 使用手机号或邮箱注册并登录
3. 进入控制台，左侧菜单找到「**API 密钥**」
4. 点击「创建新密钥」，给它起个名字（如 `aigc-chatbot`）
5. 点击「复制」——密钥只显示一次，**立刻粘贴到记事本里保存好**

> ⚠️ **安全警告**：API Key 是你的"通行证"，不要分享给他人，不要提交到 Git 仓库。每次被盗用都会消耗你的额度。

### 0.3 配置 API Key

Streamlit 有自己的密钥管理方式：**`.streamlit/secrets.toml`**。它不是 `.env` 文件，而是一个 TOML 格式的配置文件，放在项目的 `.streamlit/` 子目录下。

```toml
# .streamlit/secrets.toml
LLM_API_KEY    = "sk-你的密钥填在这里"
LLM_BASE_URL   = "https://api.siliconflow.cn/v1"
LLM_DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3"
```

在代码中读取：

```python
import streamlit as st

api_key = st.secrets["LLM_API_KEY"]
```

> ✨ **关键设计**：`secrets.toml` 中只存配置，代码中不写任何具体的服务商名称。将来要换成 OpenAI、本地 Ollama 或任何其他服务，只需修改 `secrets.toml`，**代码一字不改**。

务必把 `.streamlit/secrets.toml` 加入 `.gitignore`：

```
.streamlit/secrets.toml
__pycache__/
.venv/
rag/vectorstore.json
```

### 0.4 启动你的第一个 Streamlit 应用

安装 Streamlit：

```bash
pip install streamlit
```

在任意 `.py` 文件中写：

```python
import streamlit as st
st.write("Hello, Streamlit!")
```

启动：

```bash
streamlit run app.py
```

浏览器会自动打开，显示「Hello, Streamlit!」。每次修改并保存 `app.py`，页面会自动热重载。

### 0.5 认识你的工作环境

**OpenCode** 是你的 AI 编程搭档：

1. 打开 OpenCode（讲师会演示）
2. 在对话框中用**中文**描述你想实现的功能
3. OpenCode 会生成代码并直接写入你的项目文件
4. 遇到报错，把错误信息粘贴给 OpenCode，说「帮我修这个错误」

> 💡 **重要心态**：OpenCode 生成的代码可能每次都不一样，跟参考代码"长得不同"是正常的。只要能运行、功能正确，就是对的。不存在唯一答案。

---

## 第一章：让 AI 开口说话 — 基础聊天

### 🎯 完成本章你将获得

一个运行在本地的网页聊天界面，能与 AI 实时对话，具有流式逐字显示效果和多轮对话能力。整个应用只有**一个 Python 文件**。

---

### 📖 1.1 背景知识

#### 大语言模型 API 是什么？

你每天使用的 ChatGPT、文心一言、通义千问，背后都有一个"大脑"在工作——这个大脑就是**大语言模型（LLM，Large Language Model）**。

而 **API（应用程序编程接口）** 就是访问这个大脑的"窗口"：你把问题递进去，AI 大脑思考后把回答递出来。

```
你的程序 ──→ [API 窗口] ──→ AI 大脑（DeepSeek-V3）
         ←── [API 窗口] ←── （回答生成中...）
```

本课程使用**硅基流动（SiliconFlow）**平台。它提供了与 OpenAI **完全兼容**的接口格式，并且有**免费模型**可用。这意味着可以直接使用 OpenAI 的 Python SDK，只需把 `base_url` 改一下。

---

#### 消息的三种角色

每次调用 LLM API，你发送的不是"一句话"，而是一个**消息列表**（List of dicts）。每条消息有一个"角色"：

| 角色 | 英文 | 作用 | 例子 |
|------|------|------|------|
| 🎭 系统提示 | `system` | 定义 AI 的身份、行为规则（用户看不见） | "你是一个专业的花艺师" |
| 👤 用户 | `user` | 你说的话 | "推荐一束母亲节的花" |
| 🤖 助手 | `assistant` | AI 的回复 | "康乃馨搭配百合非常合适..." |

**多轮对话的实现原理**：AI 本身没有"记忆"，每次调用都是全新开始。我们的做法是：每次发消息时，把**所有历史消息**一起发过去：

```
第 1 轮: [system, user("你好")]
第 2 轮: [system, user("你好"), assistant("你好！"), user("今天天气怎样")]
第 3 轮: [system, ..., user("今天天气"), assistant("..."), user("再见")]
```

这就是为什么和 AI 聊很久之后 Token 消耗越来越多——因为每次都要把全部历史发过去。

---

#### Streamlit 执行模型：核心概念，必须理解

这是 Streamlit 与传统 Web 框架最大的区别，也是本课程**最重要的一个知识点**：

> **🔑 关键原理：每当用户和页面发生任何交互（点击按钮、输入文字、拖动滑块），整个 `app.py` 脚本会从第一行到最后一行重新执行一遍。**

这意味着：

```python
# ❌ 这样写是错的：每次交互后，messages 会被清空！
messages = []

if prompt := st.chat_input("输入问题"):
    messages.append({"role": "user", "content": prompt})
    # 下一次交互时 messages = [] 了... 历史丢失
```

```python
# ✅ 正确做法：用 st.session_state 持久化
if "messages" not in st.session_state:
    st.session_state.messages = []          # 只在第一次执行时初始化

if prompt := st.chat_input("输入问题"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    # 下一次交互时 session_state.messages 还在 ✓
```

**`st.session_state`** 是 Streamlit 提供的"持久存储格子"——它在脚本重新执行之间保持不变。可以把它理解成一个"跨脚本执行的全局字典"。

这也是为什么在 Streamlit 应用里，你会看到大量 `if "xxx" not in st.session_state:` 的初始化代码。

---

#### `@st.cache_resource`：单例模式

每次脚本重新执行，如果每次都重新创建 OpenAI 客户端，会浪费资源（重复建立网络连接）。使用 `@st.cache_resource` 装饰器，让函数只在**应用启动时执行一次**，之后所有执行都复用同一个对象：

```python
@st.cache_resource
def get_client():
    return OpenAI(
        api_key=st.secrets["LLM_API_KEY"],
        base_url=st.secrets["LLM_BASE_URL"],
    )

client = get_client()   # 全局只创建一次，之后复用
```

类比：餐厅只需要**一台**咖啡机，不需要每来一个客人就买一台新的。

---

#### 流式输出：`st.write_stream()`

你在 ChatGPT 里看到文字一个一个"打出来"的效果，就是**流式输出（Streaming）**。

OpenAI SDK 开启 `stream=True` 后，返回的是一个可迭代的"流对象"——AI 每想到一个词就推送一条数据，不等全部想完。

在 Streamlit 里，`st.write_stream()` 接管了这个流，自动处理逐字显示：

```python
stream = client.chat.completions.create(
    model="deepseek-ai/DeepSeek-V3",
    messages=messages,
    stream=True,
)
# st.write_stream 自动处理流，逐字显示，返回完整字符串
response: str = st.write_stream(stream)
```

`st.write_stream()` 有两个作用：一是在界面上逐字显示，二是等流结束后返回**完整的回复字符串**，方便你存入历史记录。

---

#### API Key 在哪里？安全吗？

在 Streamlit 应用里，你的 API Key 存在 `.streamlit/secrets.toml`，**只在服务器（你的本地电脑）上**。Streamlit 永远不会把 `secrets` 中的内容发送给浏览器。与 Node.js 版本相比，你不再需要专门做"后端代理"——Streamlit Server 本身就是后端。

```
✅ Streamlit 的安全模型:
   浏览器（用户界面） ◄──── Streamlit Server（app.py 在这里运行）──→ 硅基流动 API
                                    ↑
                          API Key 只在这里，从不暴露给浏览器
```

---

### 🛠️ 1.2 动手实操

进入 `python/phases/phase-1/starter/` 目录，你会看到包含 TODO 注释的 `app.py`。你的任务是通过 OpenCode 填补这些 TODO。

---

#### 第一步：初始化项目结构

> **📋 给 OpenCode 的指令（直接复制使用）：**
>
> ```
> 帮我在当前目录初始化一个 Streamlit 聊天机器人项目，要求：
>
> 1. 创建 requirements.txt，包含：streamlit、openai 两个包
> 2. 创建 .streamlit/secrets.toml，内容如下（保留格式，不要修改 key 名）：
>    LLM_API_KEY    = "sk-你的密钥填在这里"
>    LLM_BASE_URL   = "https://api.siliconflow.cn/v1"
>    LLM_DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3"
> 3. 创建 .gitignore，忽略以下内容：
>    .streamlit/secrets.toml
>    __pycache__/
>    .venv/
>    *.pyc
> ```

OpenCode 生成后，打开 `.streamlit/secrets.toml`，把 `sk-你的密钥填在这里` 替换成你真实的 API Key。

然后安装依赖：

```bash
pip install -r requirements.txt
```

---

#### 第二步：实现聊天界面

> **📋 给 OpenCode 的指令：**
>
> ```
> 在当前目录创建 app.py，实现一个 Streamlit 聊天机器人，要求：
>
> 1. 导入 streamlit 和 openai
> 2. 使用 @st.cache_resource 装饰器创建 get_client() 函数，返回 OpenAI 客户端，
>    api_key 和 base_url 从 st.secrets 读取（key 名：LLM_API_KEY、LLM_BASE_URL）
> 3. 调用 get_client() 获得全局 client 对象
> 4. 页面标题设为 "🤖 AI 聊天助手"
> 5. 用 st.session_state 维护 messages 列表（初始为空列表），确保多轮对话历史不丢失
> 6. 在侧边栏（st.sidebar）放一个 "🗑️ 清空对话" 按钮，点击时清空 messages 并调用 st.rerun()
> 7. 遍历 st.session_state.messages，用 st.chat_message 展示历史消息
> 8. 用 st.chat_input("输入你的问题...") 接收用户输入（walrus operator := 语法）：
>    a. 把用户消息加入 messages
>    b. 用 st.chat_message("user") 展示用户消息
>    c. 调用 client.chat.completions.create，model 从 st.secrets["LLM_DEFAULT_MODEL"] 读取，
>       messages 使用 st.session_state.messages，stream=True
>    d. 在 st.chat_message("assistant") 块内用 st.write_stream(stream) 显示流式回复，
>       变量名 response 接收返回值（完整字符串）
>    e. 把 assistant 回复加入 messages
> ```

---

### 🔍 1.3 理解关键代码

完成后打开 `completed/app.py` 对照理解以下关键段落：

**`@st.cache_resource` 只执行一次**：

```python
@st.cache_resource
def get_client() -> OpenAI:
    return OpenAI(
        api_key=st.secrets["LLM_API_KEY"],
        base_url=st.secrets["LLM_BASE_URL"],
    )

client = get_client()   # 首次调用时执行函数体，之后直接返回缓存对象
```

**`session_state` 的惰性初始化**：

```python
if "messages" not in st.session_state:
    st.session_state.messages: list[dict] = []
```

这段代码每次脚本执行都会运行，但 `if` 保证了 `messages` 只在**不存在时**才初始化为空列表，之后的执行直接跳过。

**流式输出的完整流程**：

```python
stream = client.chat.completions.create(
    model=st.secrets["LLM_DEFAULT_MODEL"],
    messages=st.session_state.messages,
    stream=True,                             # 开启流式
)
response: str = st.write_stream(stream)      # 逐字显示,返回完整字符串
st.session_state.messages.append({"role": "assistant", "content": response})
```

注意：一定要先 `st.write_stream` 消费完流，再把 `response` 存入 `session_state`。如果顺序反了，`response` 会是 `None`（流还没消费完）。

---

### 🧪 1.4 验收清单

完成本章前，逐项确认：

- [ ] `streamlit run app.py` 无报错，浏览器自动打开聊天界面
- [ ] 输入「你好」，AI 有回复且文字是**逐渐出现**的（流式效果）
- [ ] 输入「1+1等于几」再输入「你还记得我刚才问了什么吗」，AI 能回忆起上文（多轮对话）
- [ ] 点击侧边栏「清空对话」按钮，历史消息消失，能重新开始对话
- [ ] 关掉浏览器再重新打开，对话历史消失（session_state 不持久化到磁盘）
- [ ] 检查 `.streamlit/secrets.toml` 是否在 `.gitignore` 中被忽略

---

### 🔧 1.5 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| `FileNotFoundError: secrets.toml` | `.streamlit/` 目录不存在或文件名写错 | 确认当前工作目录下有 `.streamlit/secrets.toml` |
| `KeyError: 'LLM_API_KEY'` | `secrets.toml` 中 key 名拼写错误 | 检查 `secrets.toml`，key 名区分大小写 |
| `AuthenticationError: 401` | API Key 无效或过期 | 重新登录硅基流动控制台，生成新密钥 |
| 每次发送后历史消息消失 | 没有用 `session_state` 存储 messages | 检查代码，确保 `messages` 存在 `st.session_state` 中 |
| AI 回复一次性出现（不逐字） | 未使用 `st.write_stream` | 确保在 `st.chat_message` 块内调用 `st.write_stream(stream)` |
| 页面报 `StreamlitAPIException` | 在 `st.chat_message` 外调用展示函数 | 保证所有 `st.markdown` / `st.write` 在对应的 `with st.chat_message(...)` 块内 |

> 💡 **万能修复咒语**：遇到任何报错，把**完整的错误信息**（包括 Traceback）复制给 OpenCode，说：「我运行 Streamlit 时遇到了这个错误，请帮我修复：[粘贴错误]」

---

### ✅ 1.6 知识自测

1. Streamlit 的脚本在什么时候会重新执行？这对状态管理意味着什么？
2. `st.session_state` 的作用是什么？为什么不能直接用普通 Python 变量存储对话历史？
3. `@st.cache_resource` 装饰器的作用是什么？如果去掉它会有什么后果？
4. `st.write_stream(stream)` 做了哪两件事？为什么要用它而不是直接 `print`？
5. Streamlit 的 `secrets.toml` 和 Node.js 的 `.env` 各自的安全机制是什么？

---

### 🏆 1.7 挑战任务

- 修改 `secrets.toml` 里的 `LLM_DEFAULT_MODEL` 为 `deepseek-ai/DeepSeek-R1`，体验推理模型的回复风格（注意：R1 可能较慢）
- 在侧边栏添加一个数字，显示「当前对话共 X 轮」，随着对话增加而更新

---

## 第二章：调控 AI 的"性格" — 参数调优面板

### 🎯 完成本章你将获得

在聊天界面左侧的侧边栏中，添加参数调控面板：可以实时切换模型、调整 AI 的"创意程度"（temperature）、设置回复长度（max_tokens）以及自定义 AI 的"人设"（system prompt）。

---

### 📖 2.1 背景知识

#### Temperature：AI 的创意旋钮

`temperature` 是最重要的参数，它控制 AI 输出的**随机性**：

```
temperature = 0    ───  每次回答几乎相同，永远选"最有把握"的词
temperature = 0.7  ───  稳定但自然（默认值，日常使用）
temperature = 1.5  ───  创意丰富，但可能"天马行空"
temperature = 2.0  ───  极度随机，可能语无伦次
```

**背后的原理**：LLM 每步预测下一个 Token 时，会给所有候选词计算概率分布。`temperature` 控制这个分布的"平坦度"：

- 低温度 → 分布变"尖"→ 最高概率词被选概率更高 → 输出更确定
- 高温度 → 分布变"平"→ 各词被选概率趋于均等 → 输出更随机

**实用建议**：

| 场景 | 推荐 temperature |
|------|----------------|
| 数学计算、事实查询 | 0 ~ 0.3 |
| 日常对话、翻译 | 0.3 ~ 0.7 |
| 创意写作、头脑风暴 | 0.7 ~ 1.2 |
| 实验性创作 | 1.2 ~ 2.0 |

---

#### Top-P（核采样）

`top_p` 从不同维度控制随机性——限制 AI 的候选词范围：

- `top_p = 0.1`：只从累计概率达到 10% 的最高概率词中选（非常保守）
- `top_p = 0.9`：从累计概率达到 90% 的候选词中选（覆盖大部分合理词汇）
- `top_p = 1.0`：不限制（默认）

> 💡 **使用建议**：`temperature` 和 `top_p` 择一调整即可，不建议同时大幅修改两个，否则效果难以预测。

---

#### System Prompt（系统提示词）：给 AI 定"人设"

System Prompt 是提前给 AI 设定的"角色说明"——在整个对话全程生效，但对话时用户看不到它。

**弱 Prompt vs. 强 Prompt 对比**：

```
❌ 弱 Prompt: "你是助手"

✅ 强 Prompt:
"你是易速鲜花的资深花艺顾问，从业 20 年，熟悉各类花卉的花语与保养方法。
 回答风格：温暖、专业，适当用花卉比喻人生道理。
 约束：每次回答不超过 150 字，主动推荐当季花卉，不回答与鲜花无关的话题。"
```

System Prompt 的威力：同样的 AI 模型，写作 Prompt 就变成写作大师，医学 Prompt 就变成医疗顾问，客服 Prompt 就变成专属客服机器人。

**在 Streamlit 中如何使用**：把 system 消息拼在 messages 最前面，但不存入 `session_state.messages`（因为每次对话都可能更改 system prompt，只在调用 API 时临时拼入）：

```python
messages_with_system = [
    {"role": "system", "content": system_prompt}
] + st.session_state.messages   # 拼接，原 session_state 不变
```

---

#### 其他常用参数

| 参数 | 作用 | 通俗理解 |
|------|------|---------|
| `max_tokens` | 限制单次回复最大长度 | "说这么多就够了，别啰嗦" |
| `model` | 切换使用的大模型 | 换一个"大脑" |

---

#### Streamlit Widgets：即用即取

Streamlit 的控件（`st.slider`、`st.selectbox`、`st.text_area` 等）返回的是**当前值**。每次脚本重新执行时，控件返回最新用户设置的值：

```python
# 每次脚本执行，temperature 都是滑块当前位置的值
temperature = st.slider("Temperature", 0.0, 2.0, 0.7, 0.05)
```

这意味着参数面板天然是"实时生效"的——用户拖动滑块，下次发消息时就会用新值，无需额外的事件绑定代码。

---

### 🛠️ 2.2 动手实操

进入 `python/phases/phase-2/starter/` 目录。本阶段在第一章基础上，主要修改侧边栏和调用参数。

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 phase-1 的 app.py 基础上，升级为带参数调控面板的版本，要求：
>
> 1. 在 st.sidebar 中，"清空对话" 按钮下方添加一个分隔线（st.divider），
>    然后添加标题 "⚙️ 模型参数"
>
> 2. 添加以下控件（所有控件在 with st.sidebar: 块内）：
>    - 模型选择下拉框（st.selectbox，变量名 model）：
>      选项：["deepseek-ai/DeepSeek-V3", "Qwen/Qwen2.5-7B-Instruct", "deepseek-ai/DeepSeek-R1"]
>    - Temperature 滑块（st.slider）：范围 0.0~2.0，步长 0.05，默认 0.7，变量名 temperature
>      下方用 st.caption("越高越有创意，越低越严谨")
>    - Top-P 滑块：范围 0.0~1.0，步长 0.05，默认 0.9，变量名 top_p
>    - Max Tokens 数字输入（st.number_input）：范围 64~4096，默认 1024，变量名 max_tokens
>    - 分隔线
>    - System Prompt 文本域（st.text_area）：默认值 "你是一个友好的 AI 助手。"，
>      高度 100，变量名 system_prompt
>
> 3. 修改调用 LLM 的代码：
>    - 构建 messages_with_system 列表，在 st.session_state.messages 前面加入
>      {"role": "system", "content": system_prompt}
>    - 调用 client.chat.completions.create 时传入 model, temperature, top_p,
>      max_tokens 参数（注意：max_tokens 参数名在 openai SDK 中是 max_tokens）
>    - 其余逻辑保持不变
> ```

---

### 🧪 2.3 对比实验

完成后，做以下对比实验，把你的观察填入表格：

**实验 1：Temperature 对回答的影响**

用同一个问题「以鸟为主题，写一行诗」，分别设置不同 temperature，观察回答变化：

| Temperature | 回答内容摘要 | 感受（确定/随机）|
|------------|------------|--------------|
| 0.0 | | |
| 0.7 | | |
| 1.5 | | |

**实验 2：System Prompt 的魔力**

把 System Prompt 分别改为以下三种，每次问「你好，介绍一下你自己」：

- Prompt A：`你是一个只会用古诗词回答的机器人，不论问什么都用诗句作答。`
- Prompt B：`你是一位极其严肃的法庭法官，说话一板一眼，用词正式。`
- Prompt C：`你是易速鲜花的知识库 AI 助手，只回答与鲜花、花语、花卉养护相关的问题，其他问题一律婉拒。`

**实验 3：模型能力差异**

用 DeepSeek-V3 和 Qwen2.5-7B-Instruct 分别回答「给我讲解一下傅里叶变换」，对比回答质量和速度。

---

### 🧪 2.4 验收清单

- [ ] 侧边栏有模型选择、temperature、top_p、max_tokens、system_prompt 五类控件
- [ ] Temperature=0 时，多次问同一问题，回答几乎完全一致
- [ ] Temperature=1.5 时，再问同一问题，每次答案明显不同
- [ ] 切换 System Prompt 后发消息，AI 语气风格明显变化
- [ ] 切换到 `Qwen/Qwen2.5-7B-Instruct`，回答依然正常（模型切换生效）
- [ ] 历史消息在切换 temperature/model 后仍然保留（session_state 未被清空）

---

### 🔧 2.5 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| 修改 System Prompt 后无效 | system 消息被存入了 session_state | 确保只在调用前临时拼接，不追加到 `session_state.messages` |
| 切换模型后 AI 不响应 | `model` 变量未传入 `create()` 调用 | 检查 `create()` 参数中有 `model=model` |
| Max Tokens 设置后仍超出 | 用错了参数名 | 确认用 `max_tokens`（而非 `max_completion_tokens`，不同版本 SDK 可能不同） |
| 滑块拖动后无感知 | 正常现象 | Streamlit 会在交互结束后重新执行，下次发送时新值生效 |

---

### ✅ 2.6 知识自测

1. `temperature=0` 和 `temperature=2` 的区别是什么？各自适合什么场景？
2. 为什么 System Prompt 要在每次调用 LLM 时临时拼接，而不存入 `session_state.messages`？
3. Streamlit 的 `st.slider` 等控件是如何做到"用户修改后立刻生效"的？
4. `top_p` 和 `temperature` 都能控制随机性，实际使用时应该如何选择？

---

### 🏆 2.7 挑战任务

- 在侧边栏增加一个「Frequency Penalty」滑块（范围 -2~2，默认 0），并在调用时传入，观察它对"重复内容"的影响
- 把 System Prompt 改为花艺顾问人设，然后问 AI「母亲节送什么花好」，观察回答质量

---

## 第三章：让 AI 读懂你的文档 — RAG 知识库

### 🎯 完成本章你将获得

让 AI 能够回答关于你本地文档（PDF、Word、TXT）中的问题，而不仅仅依赖训练数据。开启知识库模式，AI 会先在文档中"找答案"，再用自己的语言表达出来。

---

### 📖 3.1 背景知识

#### RAG 是什么？

**RAG（Retrieval-Augmented Generation，检索增强生成）** 解决了一个核心问题：AI 的知识有截止日期，也不知道你内部文档的内容。

通俗类比：

```
不用 RAG（纯模型）= 闭卷考试 → AI 只能靠训练时学到的知识作答
使用 RAG         = 开卷考试 → AI 先查阅你提供的"参考书"，再作答
```

RAG 的完整流程：

```
[你的问题] ──→ 向量化 ──→ 在知识库中搜索相似片段
                                    ↓
知识库文档 ──→ 分块 ──→ 向量化 ──→ 存储为向量索引
                                    ↓
[检索到的相关片段] + [你的问题] ──→ 拼入 Prompt ──→ LLM 生成回答
```

---

#### 嵌入向量（Embedding）是什么？

传统搜索靠"关键词匹配"——问「苹果的价格」只能找到包含「苹果」和「价格」的文本。

嵌入向量把文本转换成一串**数字**（高维向量），语义相似的文本，向量离得近：

```
"苹果的价格"  → [0.12, -0.34, 0.78, ...]  ←── 这两个向量在高维空间中距离很近
"水果多少钱"  → [0.11, -0.31, 0.80, ...]

"明天天气"    → [-0.92, 0.45, -0.21, ...] ← 距离很远
```

本课程使用 **BAAI/bge-m3** 嵌入模型（硅基流动免费提供），它对中文语义理解很好。

---

#### 余弦相似度：怎么衡量"近不近"

向量之间的相似度用**余弦相似度**衡量——它计算两个向量的"夹角"：

```
cosine_similarity = (A · B) / (||A|| × ||B||)

值域：-1 ~ 1
  1.0 = 完全相同方向（语义极度相似）
  0.0 = 垂直（语义无关）
 -1.0 = 反向（语义相反）
```

实际应用中，相关片段的相似度通常在 0.7~0.9 之间。

用 NumPy 计算：

```python
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

---

#### 文档分块（Chunking）

文档通常很长，不能整篇塞入 Prompt（Token 数量有限，也命中率低）。我们把文档切成**小块（chunks）**：

```
原始文档（2000 字）
     ↓
chunk 0: 第 1~300 字
chunk 1: 第 251~550 字  ← 与 chunk 0 有 50 字重叠（overlap）
chunk 2: 第 501~800 字  ← 与 chunk 1 有 50 字重叠
...
```

**为什么要重叠（overlap）？** 防止关键信息恰好被切在块边界两侧——重叠保证了语义连贯性。

本课程默认：每块 300 字，重叠 50 字。

---

#### 重排序（Reranking）：相关性再精炼

向量检索很快，但不一定精准（向量相似 ≠ 语义最相关）。**重排序（Reranking）** 是第二道过滤：

1. 向量检索先找出 Top-K（如 10）个候选片段（快速粗筛）
2. Reranker 模型精细比对「问题 vs. 每个候选片段」，给出更准确的相关性分数（精细精排）
3. 取 Top-N（如 3）个最终结果

本课程使用 **BAAI/bge-reranker-v2-m3**（硅基流动免费提供）。

```
粗筛（向量检索）: 从 1000 个块中取 Top 10  ← 速度优先
精排（Reranker）: 从 10 个中取 Top 3       ← 精度优先
```

---

#### 项目目录结构

Phase 3 开始，项目会有更多文件：

```
phase-3/completed/
├── app.py                  # 主界面
├── requirements.txt
├── .streamlit/secrets.toml
├── rag/                    # RAG 模块
│   ├── loader.py           # 文档加载 + 分块
│   ├── embeddings.py       # 调用嵌入 API
│   ├── vectorstore.py      # 向量存储 + 余弦检索
│   ├── reranker.py         # 重排序
│   └── vectorstore.json    # 构建好的索引（运行后生成）
└── oneflower/              # 示例知识库（运行前从 python/oneflower/ 复制）
    ├── 易速鲜花员工手册.pdf
    ├── 易速鲜花运营指南.docx
    └── 花语大全.txt
```

> ⚠️ **知识库目录说明**：`oneflower/` 目录位于本 repo 的 `python/oneflower/`。运行各阶段的 completed 版本时，需要在对应的 `phase-N/completed/` 目录下创建软链接，或直接将 `python/oneflower/` 复制一份到该目录下。
>
> **Windows（管理员终端）**：
> ```cmd
> cd python\phases\phase-3\completed
> mklink /D oneflower ..\..\..\oneflower
> ```
>
> **Mac/Linux**：
> ```bash
> cd python/phases/phase-3/completed
> ln -s ../../../oneflower oneflower
> ```

---

### 🛠️ 3.2 动手实操

进入 `python/phases/phase-3/starter/` 目录。本阶段需要创建 `rag/` 子模块，分四步完成。

---

#### 第一步：文档加载器

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 rag/ 目录下创建 loader.py，实现文档加载和分块功能，要求：
>
> 1. 支持三种文件格式：
>    - .txt：直接读取，encoding 先尝试 utf-8，失败时用 gbk
>    - .pdf：使用 pypdf 库（PdfReader），逐页提取文本
>    - .docx：使用 python-docx 库（Document），逐段落拼接文本
>    - 其他格式：跳过（打印警告但不报错）
>
> 2. 实现 split_text(text, chunk_size=300, overlap=50) 函数：
>    - 按 chunk_size 步进切分文本，相邻块之间有 overlap 个字符的重叠
>    - 返回字符串列表
>
> 3. 实现 load_and_chunk(kb_dir: str) -> list[dict] 函数：
>    - 读取 kb_dir 目录下所有支持的文件
>    - 每个块返回一个字典 {"source": "文件名.扩展名", "content": "文本内容"}
>    - 返回所有块组成的列表
>
> requirements.txt 中需要加入：pypdf、python-docx
> ```

---

#### 第二步：嵌入模块

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 rag/ 目录下创建 embeddings.py，实现文本嵌入，要求：
>
> 1. 实现 get_embeddings(texts: list[str], client: OpenAI) -> list[list[float]] 函数
> 2. 使用 client.embeddings.create()，model 为 "BAAI/bge-m3"
> 3. 支持批处理：texts 按 batch_size=32 分批发送，避免单次请求过大
> 4. 返回所有文本对应的嵌入向量列表（与输入 texts 一一对应）
> ```

---

#### 第三步：向量存储

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 rag/ 目录下创建 vectorstore.py，实现向量存储和检索，要求：
>
> 1. 索引文件路径固定为 "rag/vectorstore.json"
>
> 2. 实现 build_index(chunks: list[dict], embeddings: list[list[float]]) 函数：
>    - 将 chunks 和 embeddings 对应存储到 vectorstore.json
>    - JSON 格式：[{"source": ..., "content": ..., "embedding": [...]}, ...]
>
> 3. 实现 search(query_embedding: list[float], top_k: int = 5) -> list[dict] 函数：
>    - 读取 vectorstore.json
>    - 用 numpy 计算 query_embedding 与所有块向量的余弦相似度
>    - 返回相似度最高的 top_k 个结果，每个结果字典中增加 "score" 字段
>    - 结果按相似度从高到低排序
>
> requirements.txt 中需要加入：numpy
> ```

---

#### 第四步：重排序模块

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 rag/ 目录下创建 reranker.py，实现重排序功能，要求：
>
> 1. 实现 rerank(query: str, candidates: list[dict], top_n: int = 3,
>              api_key: str = None, base_url: str = None) -> list[dict] 函数
> 2. 直接使用 requests 库调用硅基流动的重排序 API：
>    - URL: base_url.rstrip('/') + '/rerank'（base_url 从 st.secrets 读取）
>    - model: "BAAI/bge-reranker-v2-m3"
>    - 请求体：{"query": query, "documents": [c["content"] for c in candidates], "top_n": top_n}
>    - Authorization header: "Bearer {api_key}"
> 3. 解析响应，将 rerank_score 存入对应的 candidates 字典
> 4. 按 rerank_score 降序返回 top_n 个候选
>
> requirements.txt 中需要加入：requests
> ```

---

#### 第五步：集成到 app.py

> **📋 给 OpenCode 的指令：**
>
> ```
> 修改 app.py，集成 RAG 功能，要求：
>
> 1. 在 rag/ 目录下创建 __init__.py（空文件即可）
> 2. 在 app.py 中引入 rag 模块：
>    from rag.loader import load_and_chunk
>    from rag.embeddings import get_embeddings
>    from rag.vectorstore import build_index, search
>
> 3. 在侧边栏已有参数控件下方，添加一个分隔线和标题 "📚 知识库设置"，
>    然后添加：
>    - rag_enabled = st.toggle("开启知识库模式", value=False)
>    - use_rerank = st.toggle("启用重排序（进阶）", value=False)
>    - kb_dir = st.text_input("知识库目录", value="oneflower")
>    - 一个按钮 "🔨 构建索引"：点击时执行：
>        a. 调用 load_and_chunk(kb_dir) 读取文档并分块
>        b. 调用 get_embeddings(texts, client) 获取嵌入向量
>        c. 调用 build_index(chunks, embeddings) 保存索引
>        d. 成功后 st.success 显示已索引片段数量
>        e. 调用 st.cache_data.clear() 强制刷新缓存
>
> 4. 在聊天处理逻辑中，用户提交后执行 RAG 检索：
>    - 如果 rag_enabled=True 且 rag/vectorstore.json 存在：
>        a. 对用户问题调用 get_embeddings，获取查询向量
>        b. 如果 use_rerank=True：先 search(top_k=10)，再用 reranker.rerank 取 top 3
>           否则直接 search(top_k=3)
>        c. 把检索到的片段拼接成 rag_context 字符串
>        d. 在 system_prompt 末尾追加："\n\n参考以下文档内容回答用户问题，若文档中没有相关信息请如实说明：\n\n{rag_context}"
>
> 5. LLM 调用完成后，如果有 rag_refs，在 assistant 回复下方展示引用来源：
>    用 st.expander("📚 引用来源") 展开折叠块，显示来源文件名、相关度分数、内容摘要（前200字）
> ```

---

### 🔍 3.3 理解关键代码

**RAG 流程一览**：

```python
# Step 1: 对用户问题做嵌入
query_emb = get_embeddings([prompt], client)[0]

# Step 2: 检索（粗筛）
candidates = search(query_emb, top_k=10)

# Step 3: 重排序（精排，可选）
rag_refs = rerank(prompt, candidates, top_n=3)

# Step 4: 拼入 Prompt
rag_context = "\n\n".join(f"[{r['source']}]\n{r['content']}" for r in rag_refs)
sys_content = system_prompt + "\n\n参考以下文档...\n\n" + rag_context

# Step 5: 带上下文调用 LLM
response = st.write_stream(client.chat.completions.create(
    messages=[{"role": "system", "content": sys_content}] + st.session_state.messages,
    ...
))
```

**`@st.cache_data` 与 `@st.cache_resource` 的区别**：

| 装饰器 | 缓存内容 | 适合场景 |
|--------|---------|---------|
| `@st.cache_resource` | 全局单例，不可序列化的对象 | 数据库连接、API 客户端 |
| `@st.cache_data` | 可序列化的数据 | 数据加载结果、API 响应 |

向量索引文件很大，你可以用 `@st.cache_data` 缓存读取结果，避免每次查询都重新读文件。

---

### 🧪 3.4 验收清单

- [ ] 进入 `phase-3/completed/` 目录，已建好 oneflower 软链接或拷贝
- [ ] 安装依赖：`pip install -r requirements.txt`（包含 pypdf、python-docx、numpy、requests）
- [ ] 启动应用，侧边栏有「知识库设置」区域
- [ ] 点击「构建索引」，看到成功提示和片段数量（通常 30~100 个）
- [ ] 开启「知识库模式」，问「易速鲜花有多少种玫瑰」，回复能引用文档内容
- [ ] 关闭「知识库模式」，问同一问题，AI 只依赖自身知识作答（内容不同）
- [ ] 开启「重排序」，注意引用来源的 score 字段标注为 `rerank_score`

---

### 🔧 3.5 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| `ModuleNotFoundError: pypdf` | 未安装 | `pip install pypdf python-docx` |
| 构建索引后问题没有 RAG 上下文 | `rag_enabled toggle` 没有开启 | 确认侧边栏中「开启知识库模式」是绿色 toggle on 状态 |
| 索引已构建但检索结果为空 | vectorstore.json 路径错误 | 确认在 `phase-3/completed/` 目录运行 `streamlit run app.py` |
| 重排序报 401 错误 | reranker.py 中 headers 未带 API Key | 检查 Authorization header |
| PDF 文本乱码 | 某些扫描版 PDF 无文本层 | 只能用 OCR 处理，当前课程暂不支持扫描版 PDF |
| `oneflower` 目录找不到 | 软链接/拷贝未完成 | 按 3.2 节指引操作 |

---

### ✅ 3.6 知识自测

1. RAG 的全称是什么？它解决了 LLM 的哪个根本局限？
2. 嵌入向量的核心特性是什么？为什么"语义相近的文本，向量也相近"？
3. 文档分块时为什么需要设置"重叠（overlap）"？
4. 重排序的流程是什么？它为什么能比单纯向量检索更准确？
5. `@st.cache_data` 和 `@st.cache_resource` 的区别是什么？

---

### 🏆 3.7 挑战任务

- 往 `oneflower/` 目录加入你自己的 TXT 文档（比如一份产品说明书），重新构建索引，测试 AI 能否正确回答相关问题
- 修改 `vectorstore.py`，让 `search()` 支持一个 `threshold` 参数，只返回相似度高于阈值的片段

---

## 第四章：连接真实世界 — Function Calling

### 🎯 完成本章你将获得

让 AI 能主动调用你写的 Python 函数，获取实时信息后再生成回答。本章实现：AI 识别到用户问天气时，自动调用天气 API，并以可视化卡片展示温度、体感、湿度数据。

---

### 📖 4.1 背景知识

#### Function Calling 是什么？

LLM 的知识是静态的（截止训练日期），它不知道"今天北京的天气"。**Function Calling（工具调用）** 让 AI 能够"提出请求"——告诉你程序"我需要调用某个函数获取数据"，你的程序执行后把结果返回，AI 再生成最终回答。

类比：

```
没有 Function Calling = 闭门造车，靠记忆回答
有了 Function Calling = AI 像一个聪明的助手，能说"帮我查一下这个数据"
```

**重要澄清**：AI 自己不执行函数。它只是在响应中告诉你"该调用哪个函数、传什么参数"，你的代码（Python 程序）负责真正执行，然后把结果作为新消息返回给 AI。

---

#### 两次调用的完整流程

```
第 1 次调用（非流式）：
   发送: [system, user("北京今天天气怎样"), 工具定义列表]
   返回: finish_reason = "tool_calls"
         message.tool_calls = [{name: "get_weather", arguments: '{"city":"Beijing"}'}]

   你的程序: 解析 tool_calls，调用 Python 函数 get_weather(city="Beijing")
             得到: {"temp": 28, "feels_like": 30, "humidity": 65}

第 2 次调用（流式）：
   发送: [system, user, assistant（含 tool_call）, tool（天气结果 JSON）]
   返回: "北京今天天气晴朗，气温 28°C，体感温度 30°C，湿度 65%..."
```

注意第 1 次调用是**非流式**的——因为需要获取完整的 tool_call 决策（知道调用哪个函数、传什么参数），不能等流式逐字输出。

---

#### 工具定义（Tool Schema）

告诉 AI"有哪些工具可以调用"，需要用 JSON Schema 格式：

```python
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": (
                "获取指定城市的实时天气数据。"
                "当用户询问天气、气温、湿度、是否下雨等问题时调用。"
                "不用于新闻、搜索或其他话题。"        # ← 这很重要！
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名（英文），如 Beijing、Shanghai",
                    }
                },
                "required": ["city"],
            },
        },
    }
]
```

> 💡 **工具描述的重要性**：`description` 字段是 AI 决定是否调用这个工具的**唯一依据**。描述越清晰、越明确地说明适用场景和不适用场景，AI 的工具选择就越准确。含混的描述会导致工具被滥用或漏用。

---

#### wttr.in — 免费天气 API

本课程使用 [wttr.in](https://wttr.in) 获取天气数据，无需注册、无需 API Key：

```
GET https://wttr.in/{city}?format=j1
```

返回 JSON，我们从中提取：
- `current_condition[0].temp_C` — 摄氏温度
- `current_condition[0].FeelsLikeC` — 体感温度
- `current_condition[0].humidity` — 湿度百分比

---

### 🛠️ 4.2 动手实操

进入 `python/phases/phase-4/starter/` 目录。本阶段在 Phase 3 基础上创建 `tools/` 子模块，分两步完成。

---

#### 第一步：天气工具函数

> **📋 给 OpenCode 的指令：**
>
> ```
> 创建 tools/ 目录，在其中创建 weather.py，实现天气查询工具，要求：
>
> 1. 创建 tools/__init__.py（空文件）
> 2. 实现 get_weather(city: str) -> dict 函数：
>    - 调用 https://wttr.in/{city}?format=j1 获取 JSON 数据（10秒超时）
>    - 从响应中提取：
>        temp      = int(current_condition[0]["temp_C"])
>        feels_like = int(current_condition[0]["FeelsLikeC"])
>        humidity  = int(current_condition[0]["humidity"])
>        desc      = current_condition[0]["weatherDesc"][0]["value"]
>    - 返回 {"city": city, "temp": temp, "feels_like": feels_like,
>             "humidity": humidity, "desc": desc}
>    - 若请求失败（超时、HTTP 错误），抛出 RuntimeError("无法获取天气数据")
> 3. requirements.txt 中确保有 requests 包
> ```

---

#### 第二步：集成 Function Calling 到 app.py

> **📋 给 OpenCode 的指令：**
>
> ```
> 修改 app.py，集成 Function Calling，要求：
>
> 1. 在文件顶部引入：
>    import json
>    from tools.weather import get_weather
>
> 2. 在 client 定义后，添加工具定义常量 TOOLS（列表，只含一个 get_weather 工具）：
>    - name: "get_weather"
>    - description: "获取指定城市的实时天气数据。当用户询问天气、气温、湿度、是否下雨等问题时调用。不用于新闻、搜索或其他话题。"
>    - parameters: {"type": "object", "properties": {"city": {"type": "string", "description": "城市名（英文），如 Beijing、Shanghai"}}, "required": ["city"]}
>
> 3. 添加工具分发字典：TOOL_HANDLERS = {"get_weather": get_weather}
>
> 4. 修改聊天处理逻辑（替换原来的单次流式调用）：
>
>    Step A：第 1 次非流式调用（传入 tools=TOOLS，stream=False）
>    - 获取 choice = first_resp.choices[0]
>
>    Step B：判断 choice.finish_reason：
>    如果 == "tool_calls"：
>      a. 解析 tool_call：fn_name = choice.message.tool_calls[0].function.name
>         fn_args = json.loads(choice.message.tool_calls[0].function.arguments)
>      b. 在 st.chat_message("assistant") 块内：
>         - 调用 TOOL_HANDLERS[fn_name](**fn_args) 得到 result
>         - 如果 fn_name == "get_weather"：
>             st.columns(3) 展示三个 st.metric：温度、体感温度、湿度
>         - 捕获 RuntimeError，st.error 显示
>      c. 把 choice.message 追加到 session_state.messages
>      d. 把工具结果追加到 session_state.messages：
>         {"role": "tool", "tool_call_id": tool_call.id, "content": json.dumps(result)}
>      e. 重新构建 messages_for_second（含 system），执行第 2 次流式调用
>         在新的 st.chat_message("assistant") 块内 st.write_stream 显示文字回复
>
>    否则（没有工具调用）：
>      - response = choice.message.content
>      - 在 st.chat_message("assistant") 块内 st.markdown(response)
>      - 如有 RAG 引用，同样展示来源
>
>    Step C：不论哪条分支，最后把文字回复追加到 session_state.messages
> ```

---

### 🔍 4.3 理解关键代码

**为什么第一次调用是非流式？**

```python
# 必须非流式，因为需要完整解析 tool_calls 字段
first_resp = client.chat.completions.create(
    model=model,
    messages=messages_with_system,
    tools=TOOLS,
    stream=False,          # ← 关键：非流式
)
choice = first_resp.choices[0]

if choice.finish_reason == "tool_calls":
    # AI 决定调用工具
    tool_call = choice.message.tool_calls[0]
    fn_args = json.loads(tool_call.function.arguments)   # 解析参数 JSON
    result = TOOL_HANDLERS[tool_call.function.name](**fn_args)  # 执行函数
    # ...
```

**第二次调用的 messages 结构**：

```python
# messages 必须包含：原始消息 + assistant 回复（含 tool_call 信息） + tool 结果
messages_for_second = [
    {"role": "system", "content": sys_content},
    *st.session_state.messages,   # 包含了刚追加的 assistant 和 tool 消息
]
```

---

### 🧪 4.4 验收清单

- [ ] 问「北京今天天气怎样」，能看到三格数字卡片（温度/体感/湿度）和文字描述
- [ ] 问「上海明天会下雨吗」，同样触发天气查询
- [ ] 问「今天新闻有什么」，不触发天气工具（AI 直接回答，不调用 get_weather）
- [ ] 问「1+1等于几」，不触发工具，正常对话
- [ ] 天气卡片展示后，AI 的文字回复引用了卡片中的数据
- [ ] RAG 功能仍然可用（构建索引、开启知识库模式，花艺问题能检索到文档内容）

---

### 🔧 4.5 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| 天气问题没有触发工具 | 工具 description 不够清晰 | 检查 TOOLS 中 description 是否明确说明天气问题触发场景 |
| `json.JSONDecodeError` 解析 tool arguments | AI 返回为空或格式错误 | 加 try/except，打印原始 tool_call.function.arguments 排查 |
| 第 2 次调用报 "tool message not found" | messages 追加顺序错误 | 确保先追加 assistant（含 tool_call），再追加 tool 结果消息 |
| wttr.in 请求超时 | 网络问题 | 用 `requests.get(..., timeout=10)`，超时时发送友好提示 |
| st.metric 不显示 | 不在 `st.chat_message` 块内 | 确保 `cols = st.columns(3)` 在 `with st.chat_message("assistant"):` 内 |

---

### ✅ 4.6 知识自测

1. Function Calling 流程中需要调用 LLM API 几次？每次的目的是什么？
2. 为什么第一次调用必须是非流式（stream=False）？
3. 工具的 `description` 字段有什么作用？写得不好会有什么后果？
4. 工具调用后，发送给 LLM 的 messages 列表里，`tool` 角色的消息包含什么内容？

---

### 🏆 4.7 挑战任务

- 在 `tools/` 目录新增 `calc.py`，实现一个 `calculate(expression: str) -> dict` 函数（用 Python `eval` 计算简单数学表达式），并注册成工具，测试「2 的 10 次方是多少」
- 修改天气卡片，额外显示天气描述文字（如 "Partly cloudy"）

---

## 第五章：订阅实时新闻 — 多工具协作

### 🎯 完成本章你将获得

在天气工具基础上，新增**新闻工具**，让 AI 能读取 RSS 新闻源并呈现为可展开的新闻列表。同时掌握多工具场景下的 Function Calling 编排逻辑。

---

### 📖 5.1 背景知识

#### 多工具调度

只有一个工具时，AI 的选择是"用"或"不用"天气工具。有了多个工具，AI 需要**正确选择**合适的工具：

| 用户问题 | 期望工具 |
|---------|---------|
| 北京天气怎样 | `get_weather` |
| 今天有什么新闻 | `get_news` |
| 帮我写首诗 | 不调用工具（直接回答）|
| 今天天气好不好，适合出门看新闻吗 | 可能同时需要两个（部分模型支持 parallel_tool_calls）|

AI 区分工具的唯一依据是各工具的 **`description` 字段**。这就是为什么天气工具的描述里要明确写「不用于新闻、搜索」——防止新闻问题误触发天气工具。

---

#### RSS 新闻抓取

**RSS（Really Simple Syndication）** 是网站提供的机器可读新闻格式，无需 API Key，直接 HTTP 请求即可获取。

常用科技类 RSS：
```
https://feeds.a.dj.com/rss/RSSWorldNews.xml      （华尔街日报）
https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml
https://hnrss.org/frontpage                      （Hacker News，适合科技话题）
```

用 `feedparser` 库可以轻松解析：

```python
import feedparser

feed = feedparser.parse("https://hnrss.org/frontpage")
for entry in feed.entries[:5]:
    print(entry.title, entry.link)
```

当然，如果网络不通，需要降级到**备用方案**（如预设的静态新闻列表）。生产级应用都需要这类容错设计。

---

#### RSS 的 Python 实现注意事项

- `feedparser` 是第三方库，需要 `pip install feedparser`
- RSS 解析结果中，详细正文通常在 `entry.summary` 或 `entry.content[0].value`（不同来源不同）
- 部分 RSS 源需要 HTTP 重定向跟踪，`feedparser` 默认处理
- **降级策略**：如果 feedparser 抛异常或返回空，fallback 到硬编码的示例新闻列表，确保演示课程时不会因网络问题失败

---

### 🛠️ 5.2 动手实操

进入 `python/phases/phase-5/starter/` 目录。本阶段在 Phase 4 基础上新增 `tools/news.py`。

---

#### 第一步：新闻工具函数

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 tools/ 目录下创建 news.py，实现新闻获取工具，要求：
>
> 1. 实现 get_news(topic: str = "general") -> dict 函数：
>    - topic 参数：tech / general / world / finance
>    - 按 topic 映射到不同 RSS URL：
>        tech:    "https://hnrss.org/frontpage"
>        general: "https://feeds.a.dj.com/rss/RSSWorldNews.xml"
>        world:   "https://feeds.a.dj.com/rss/RSSWorldNews.xml"
>        finance: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml"
>    - 用 feedparser.parse(url) 获取，取前 5 条
>    - 每条提取：title、link、summary（摘要，取前200字）、pubDate
>    - 返回 {"topic": topic, "items": [...]}
>    - 若 feedparser 失败或返回空，返回预设的 fallback 新闻列表（3 条静态示例数据）
>
> requirements.txt 中加入：feedparser
> ```

---

#### 第二步：注册新工具并更新 app.py

> **📋 给 OpenCode 的指令：**
>
> ```
> 修改 app.py，添加新闻工具，要求：
>
> 1. 引入 from tools.news import get_news
>
> 2. 在 TOOLS 列表中新增 get_news 工具定义：
>    - name: "get_news"
>    - description: "获取最新新闻资讯。当用户询问新闻、热点事件、今日头条、最新动态时调用。不用于天气查询。"
>    - parameters: {"type": "object", "properties": {"topic": {"type": "string", "enum": ["tech", "general", "world", "finance"], "description": "新闻类别：tech 科技、general 综合、world 国际、finance 财经"}}, "required": []}
>
> 3. 在 TOOL_HANDLERS 中加入 "get_news": get_news
>
> 4. 在工具结果渲染函数（或 tool_calls 处理分支）中，新增对 get_news 的渲染：
>    - 遍历 result["items"]，每条新闻用 st.expander(item["title"]) 展开：
>        内部显示：摘要文本（st.write）、"阅读原文" 超链接（st.markdown）、发布时间（st.caption）
> ```

---

### 🔍 5.3 理解关键代码

**多工具时 AI 如何选择？**

AI 在收到带有多个工具定义的请求后，根据 `description` 中描述的适用场景，结合用户问题语义，选择最匹配的工具。这个判断在 LLM 内部完成，开发者无需写如何判断的逻辑——只需确保 description 写得足够清晰、互斥。

**新闻结果的渲染方式**：

```python
elif fn_name == "get_news":
    items = result.get("items", [])
    for item in items:
        with st.expander(item["title"], expanded=False):
            if item.get("summary"):
                st.write(item["summary"])
            if item.get("link"):
                st.markdown(f"[阅读原文]({item['link']})")
            if item.get("pubDate"):
                st.caption(item["pubDate"])
```

用 `st.expander` 折叠每条新闻，界面整洁不拥挤，用户可按需展开。

---

### 🧪 5.4 验收清单

- [ ] 问「今天科技圈有什么新闻」，看到新闻列表（多个折叠卡片）
- [ ] 问「最新的财经动态」，`topic=finance` 的新闻被正确请求
- [ ] 问「北京天气怎样」，仍触发天气工具而非新闻工具
- [ ] 问「给我讲个笑话」，不触发任何工具（直接回答）
- [ ] 网络不通时（可断开网络测试），新闻工具返回 fallback 数据而不崩溃
- [ ] 新闻展开后能看到摘要和「阅读原文」链接

---

### 🔧 5.5 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| 新闻问题仍触发天气工具 | 两个工具的 description 边界不清 | 确保 get_weather 的 description 里有「不用于新闻」，get_news 里有「不用于天气」 |
| feedparser 解析结果为空 | RSS URL 在当前网络不可用 | 检查 fallback 逻辑是否生效；换可用的 RSS URL |
| 新闻折叠卡片没出现 | 渲染逻辑不在 `with st.chat_message("assistant"):` 块内 | 检查缩进 |
| `ModuleNotFoundError: feedparser` | 未安装 | `pip install feedparser` |

---

### ✅ 5.6 知识自测

1. 有多个工具时，AI 如何知道该调用哪个？开发者需要写"选择逻辑"吗？
2. RSS 新闻抓取为什么不需要 API Key？
3. 为什么要为网络请求失败准备 fallback 数据？在生产环境中还有哪些常见 fallback 策略？
4. `st.expander` 的作用是什么？还有哪些 Streamlit 组件可以用来展示复杂内容？

---

### 🏆 5.7 挑战任务

- 修改新闻工具，让摘要中包含 Markdown 格式（加粗关键词），提升阅读体验
- 在侧边栏增加一个「新闻语言」单选框，让 AI 在展示新闻时用中文或英文总结

---

## 第六章：接入搜索引擎 — 多工具编排

### 🎯 完成本章你将获得

新增**网络搜索工具**，整合天气、新闻、搜索、RAG 四个工具，让 AI 成为一个真正能解决开放问题的智能助手。体验多工具编排下的复杂决策树。

---

### 📖 6.1 背景知识

#### DuckDuckGo Instant Answer API

**DuckDuckGo** 提供免费的 Instant Answer API，无需注册和 API Key：

```
GET https://api.duckduckgo.com/?q={query}&format=json&no_html=1&skip_disambig=1
```

返回的 `AbstractText` 字段包含搜索摘要，`RelatedTopics` 包含相关链接。

**局限性**：DDG Instant Answer 更适合"知识性问题"（人物、地点、事件），对实时新闻、中文内容支持有限。

---

#### 中文搜索降级策略

当 DDG 返回空摘要时（尤其是中文查询），我们的策略是：

```python
if not ddg_result:
    # 降级：返回百度/必应搜索链接，让用户自行访问
    return {
        "query": query,
        "summary": f"未找到直接摘要，建议搜索：https://www.baidu.com/s?wd={query}",
        "source": "fallback"
    }
```

这是实际工程中常见的"优雅降级"模式：即使无法提供完整功能，也要给用户有用的信息，而不是空白或报错。

---

#### 四工具决策树

有了四个工具后，AI 面对的决策更复杂：

```
用户问题
   │
   ├─ 涉及天气/气温/天气预报? ──→ get_weather
   │
   ├─ 涉及新闻/热点/最新动态? ──→ get_news
   │
   ├─ 涉及文档内容（知识库）? ──→ 不调用工具（通过 RAG 上下文已注入）
   │
   └─ 其他开放性问题/事实查询? ──→ search_web
```

> ⚠️ **注意**：RAG 不是"工具"，它的检索发生在调用 LLM **之前**，已经被注入 system prompt。所以 AI 决策时不用"选择是否检索 RAG"，RAG 结果对 AI 是透明的。

---

#### 多工具能力矩阵

| 问题类型 | 天气 | 新闻 | 搜索 | RAG | 实际处理方式 |
|---------|-----|-----|-----|-----|------------|
| 今天北京天气 | ✅ | ❌ | ❌ | ❌ | get_weather |
| 今日科技新闻 | ❌ | ✅ | ❌ | ❌ | get_news |
| 鲜花配送政策 | ❌ | ❌ | ❌ | ✅ | RAG（在 system 里）|
| 马斯克最新动态 | ❌ | ⚠️ | ✅ | ❌ | search_web |
| 帮我写一首诗 | ❌ | ❌ | ❌ | ❌ | 直接回答 |

---

### 🛠️ 6.2 动手实操

进入 `python/phases/phase-6/starter/` 目录。本阶段在 Phase 5 基础上新增 `tools/search.py`。

---

#### 第一步：搜索工具函数

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 tools/ 目录下创建 search.py，实现网络搜索工具，要求：
>
> 1. 实现 search_web(query: str) -> dict 函数：
>    - 调用 DuckDuckGo Instant Answer API：
>      URL = f"https://api.duckduckgo.com/?q={query}&format=json&no_html=1&skip_disambig=1"
>      Headers: {"User-Agent": "Mozilla/5.0 (compatible; aigc-chatbot/1.0)"}
>    - 解析响应：优先取 AbstractText，若为空则取 RelatedTopics[0].Text（如果存在）
>    - 同时收集 RelatedTopics 中的链接（最多 5 个），格式：[{"text": ..., "url": ...}]
>    - 若 AbstractText 和 RelatedTopics 都为空，降级：
>        返回 {"query": query, "summary": f"请访问 https://www.baidu.com/s?wd={query} 查看搜索结果", "links": [], "source": "fallback"}
>    - 成功时返回：{"query": query, "summary": ..., "links": [...], "source": "duckduckgo"}
>    - 任何异常都捕获并降级返回，不抛出
> ```

---

#### 第二步：注册搜索工具并更新 app.py

> **📋 给 OpenCode 的指令：**
>
> ```
> 修改 app.py，添加搜索工具，要求：
>
> 1. 引入 from tools.search import search_web
>
> 2. 在 TOOLS 列表末尾新增 search_web 工具定义：
>    - name: "search_web"
>    - description: "搜索互联网获取通用信息、人物、事件、最新动态。
>      适合回答开放性问题和事实性查询。当天气工具和新闻工具都不适合时使用。
>      不用于查询天气或新闻摘要。"
>    - parameters: {"type": "object", "properties": {"query": {"type": "string", "description": "搜索关键词"}}, "required": ["query"]}
>
> 3. 在 TOOL_HANDLERS 中加入 "search_web": search_web
>
> 4. 在工具结果渲染逻辑中，新增对 search_web 的渲染：
>    - 显示 summary（st.markdown）
>    - 若 links 非空，显示相关链接列表：用 st.markdown 显示每个可点击的链接
>    - 若 source == "fallback"，用 st.info 提示用户"直接访问搜索链接"
> ```

---

### 🧪 6.3 测试矩阵

用以下问题逐一测试，验证 AI 的工具选择是否正确：

| 测试问题 | 期望工具 | 实际触发 | 是否符合预期 |
|---------|---------|---------|------------|
| 上海今天天气如何 | get_weather | | |
| 最新人工智能新闻 | get_news | | |
| OpenAI 最近有什么新产品 | search_web | | |
| 易速鲜花的营业时间 | 无工具（RAG）| | |
| 帮我写一个 Python 冒泡排序 | 无工具 | | |
| 马斯克是谁 | search_web | | |
| 今天有没有下雨 | get_weather | | |

---

### 🧪 6.4 验收清单

- [ ] 天气问题触发 get_weather，新闻问题触发 get_news，开放性问题触发 search_web
- [ ] 搜索结果中能看到摘要文字和相关链接
- [ ] 询问知识库内容时（需先构建索引），不触发工具，AI 从 RAG 上下文回答
- [ ] 普通对话（写诗、算术）不触发任何工具
- [ ] DDG 无结果时，显示百度搜索降级链接，不报错

---

### 🔧 6.5 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| 搜索问题触发了新闻工具 | search_web 和 get_news 描述重叠 | 在 get_news description 里加「仅用于 RSS 新闻聚合」，search_web 加「适合开放性问题」 |
| DDG 搜索结果总为空 | DDG Instant Answer 对部分查询无结果 | 检查降级逻辑是否正常触发百度/必应链接 |
| 搜索结果链接无法点击 | Streamlit 中 `[text](url)` 格式写错 | 确保使用 `st.markdown` 而不是 `st.write` 显示链接 |
| 所有问题都触发 search_web | search_web description 过于宽泛 | 给 description 加明确边界，或把 search_web 排在 TOOLS 列表最后（AI 倾向先考虑靠前的工具）|

---

### ✅ 6.6 知识自测

1. 四个工具场景下，AI 依靠什么做工具选择决策？开发者能给 AI 写"选择逻辑"吗？
2. RAG 和 Function Calling 的区别是什么？它们在流程中处于哪个位置？
3. "优雅降级"在软件工程中是什么概念？本章的哪个设计体现了这个思想？
4. 工具描述中设计"负面约束"（如"不用于天气查询"）有什么好处？

---

### 🏆 6.7 挑战任务

- 把 TOOLS 列表中的工具顺序调换（weather 放最后），观察工具选择行为是否改变
- 新增一个 `translate(text: str, target_lang: str) -> dict` 工具，让 AI 能把用户问题翻译成指定语言后再搜索（二步工具链）

---

## 附录 A：快速参考卡

### Streamlit 核心 API

| API | 用途 |
|-----|-----|
| `st.session_state["key"]` | 读写跨执行的状态值 |
| `@st.cache_resource` | 缓存全局单例（客户端、数据库连接）|
| `@st.cache_data` | 缓存可序列化数据（查询结果、文件读取）|
| `st.write_stream(stream)` | 流式显示 LLM 回复，返回完整字符串 |
| `st.chat_message("role")` | 聊天气泡容器（作为 context manager 使用）|
| `st.chat_input("placeholder")` | 聊天输入框，返回用户输入或 None |
| `st.sidebar` | 侧边栏容器 |
| `st.spinner("message")` | 加载动画 |
| `st.expander("title")` | 折叠展开块 |
| `st.columns(n)` | 多列布局 |
| `st.metric("label", value)` | 数据指标卡片 |
| `st.toggle("label")` | 开关控件，返回 bool |
| `st.slider(...)` | 滑块，返回当前值 |
| `st.selectbox(...)` | 下拉选择框 |
| `st.text_area(...)` | 多行文本输入 |
| `st.rerun()` | 强制重新执行脚本 |

### 项目目录结构（完整版）

```
python/                                 ← 本 repo 根目录
├── README.md
├── docs/
│   ├── student-textbook.md             ← 本文档
│   └── instructor-guide.md
├── oneflower/                          ← 知识库原始文件
│   ├── 易速鲜花员工手册.pdf
│   ├── 易速鲜花运营指南.docx
│   └── 花语大全.txt
└── phases/
    ├── phase-1/
    │   ├── starter/
    │   │   ├── app.py                  （含 TODO 注释）
    │   │   ├── requirements.txt
    │   │   └── .streamlit/secrets.toml.example
    │   ├── completed/
    │   │   ├── app.py
    │   │   └── requirements.txt
    │   └── README.md
    ├── phase-2/ ... phase-6/           （同样结构）
    └── phase-6/completed/
        ├── app.py
        ├── requirements.txt
        ├── rag/
        │   ├── loader.py
        │   ├── embeddings.py
        │   ├── vectorstore.py
        │   └── reranker.py
        ├── tools/
        │   ├── weather.py
        │   ├── news.py
        │   └── search.py
        └── oneflower/                  ← 软链接 → ../../../oneflower
```

### 各阶段能力矩阵

| 功能 | P1 | P2 | P3 | P4 | P5 | P6 |
|-----|----|----|----|----|----|----|
| 流式对话 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 多轮历史 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 参数调控 | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| RAG 知识库 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 重排序 | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Function Calling | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 天气工具 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 新闻工具 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 网络搜索 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 附录 B：secrets.toml 配置参考

```toml
# .streamlit/secrets.toml
# ⚠️ 此文件不要提交到 Git！

# ── LLM 配置 ─────────────────────────────────────
LLM_API_KEY       = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
LLM_BASE_URL      = "https://api.siliconflow.cn/v1"
LLM_DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3"

# ── 可选：切换到其他服务商 ────────────────────────
# 使用 OpenAI 官方:
# LLM_API_KEY   = "sk-openai-xxxxxxxx"
# LLM_BASE_URL  = "https://api.openai.com/v1"
# LLM_DEFAULT_MODEL = "gpt-4o-mini"

# 使用本地 Ollama:
# LLM_API_KEY   = "ollama"
# LLM_BASE_URL  = "http://localhost:11434/v1"
# LLM_DEFAULT_MODEL = "qwen2.5:7b"
```

---

## 附录 C：常用模型参考

| 模型 | 特点 | 适合场景 |
|------|------|---------|
| `deepseek-ai/DeepSeek-V3` | 通用、快速、免费 | 日常对话、代码、知识问答 |
| `Qwen/Qwen2.5-7B-Instruct` | 轻量、免费 | 简单对话、测试 |
| `deepseek-ai/DeepSeek-R1` | 推理强、慢 | 数学、逻辑、复杂分析 |
| `BAAI/bge-m3` | 嵌入模型 | RAG 阶段文本向量化 |
| `BAAI/bge-reranker-v2-m3` | 重排序模型 | RAG 精排（Phase 3 进阶）|

> 💡 所有模型可在硅基流动控制台的"模型广场"查看最新列表和免费额度。

---

*文档版本: v1.0 | 配套代码: `python/phases/` | 知识库示例: `python/oneflower/`*
