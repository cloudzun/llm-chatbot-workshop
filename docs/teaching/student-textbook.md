# AI 聊天机器人开发实战教程

> **版本**: v2.0 | **日期**: 2026-03-13  
> **面向对象**: 零代码基础学员 & 专业开发者  
> **教学方式**: 与 AI 编程助手（OpenCode / OpenClaw）对话，逐步构建  
> **最终成果**: 一个具备知识问答、天气查询、新闻阅读、网络搜索能力的智能聊天机器人

---

> **给同学的一封信**
>
> 你不需要会编程就能完成这门课。你要做的，是用中文告诉 AI 编程助手（OpenCode）你想要什么，它来帮你写代码。整个过程更像"指挥"而不是"编程"。
>
> 当然，如果你本来就是开发者，这门课会让你对 LLM 应用架构有更深的直觉——而不只是会 `pip install langchain`。
>
> 我们将构建的这个 chatbot，覆盖了当前大多数 AI 应用产品的核心技术栈：API 调用、流式输出、参数调优、RAG 知识库、Function Calling、MCP 协议。完成它，你就拥有了拆解任何 AI 应用产品的基础认知框架。
>
> 开始吧。

---

## 课程全景地图

你将经历 6 个阶段，每个阶段都在上一个的基础上**增加一种新能力**：

```
Phase 1 ──── 它能和你聊天
   │
Phase 2 ──── 你能调控它的"性格"（温度、模型、人设）
   │
Phase 3 ──── 它能读懂你上传的私有文档（RAG 知识库）
   │
Phase 4 ──── 它能查询实时天气（Function Calling）
   │
Phase 5 ──── 它能阅读网络新闻（MCP 协议）
   │
Phase 6 ──── 它能搜索互联网（多工具编排）
```

每个阶段你都将亲手完成——通过与 OpenCode 对话，不是复制粘贴。

---

## 第 0 章：开始之前 — 环境准备

在动手之前，先确认你的电脑满足运行条件。

### 0.1 你需要的工具

| 工具 | 用途 | 获取方式 |
|------|------|---------|
| **Node.js 18+** | 运行 JavaScript 服务器 | https://nodejs.org（选 LTS 版本） |
| **OpenCode** | AI 编程助手，帮你写代码 | 讲师已提前安装配置 |
| **浏览器** | 使用你的 chatbot | Chrome / Edge 均可 |
| **硅基流动账号** | 提供 AI 大模型 API | https://cloud.siliconflow.cn |

### 0.2 注册硅基流动账号并获取 API Key

1. 访问 https://cloud.siliconflow.cn，点击"注册"
2. 使用手机号或邮箱注册并登录
3. 进入控制台，左侧菜单找到「**API 密钥**」
4. 点击「创建新密钥」，给它起个名字（如 `aigc-chatbot`）
5. 点击「复制」——密钥只显示一次，**立刻粘贴到记事本里保存好**

> ⚠️ API Key 是你的"通行证"，不要分享给他人，不要提交到 Git 仓库。每次被盗用都会消耗你的额度。

### 0.3 检查你的环境

如果讲师提供了 `check-env.js` 脚本，打开终端（命令行窗口），进入项目根目录后运行：

```bash
node scripts/check-env.js
```

正常输出应该是每一项旁边有绿色 ✅。如果有 ❌，根据提示处理后再继续。

### 0.4 认识你的工作环境

**OpenCode** 是你的 AI 编程搭档。使用方式很简单：

1. 打开 OpenCode（讲师会演示）
2. 在对话框中用**中文**描述你想实现的功能
3. OpenCode 会生成代码并直接写入你的项目文件
4. 遇到报错，把错误信息粘贴给 OpenCode，说「帮我修这个错误」

> 💡 **重要心态**：OpenCode 生成的代码可能每次都不一样，跟参考代码"长得不同"是正常的。只要能运行、功能正确，就是对的。不存在唯一答案。

---

## 第一章：让 AI 开口说话 — 基础聊天

### 🎯 完成本章你将获得

一个运行在本地的网页聊天界面，能与 AI 实时对话，具有流式逐字显示效果和 Token 用量统计。

---

### 📖 1.1 背景知识

#### 大语言模型 API 是什么？

你每天使用的 ChatGPT、文心一言、通义千问，背后都有一个"大脑"在工作——这个大脑就是**大语言模型（LLM，Large Language Model）**。

而 **API（应用程序编程接口）** 就是访问这个大脑的"窗口"：你把问题递进去，内部 AI 大脑思考后把回答递出来。

```
你的程序 ──→ [API 窗口] ──→ AI 大脑（DeepSeek-V3.2）
         ←── [API 窗口] ←── (回答生成中...)
```

本课程使用**硅基流动（SiliconFlow）**平台。它提供了与 OpenAI 完全兼容的接口格式，并且有**免费模型**可用。

> ✨ **关键设计**：我们的项目把 API 地址、密钥、模型名都存在 `.env` 配置文件里，代码里不写任何具体的服务商名称。这意味着以后想换成 OpenAI、本地 Ollama 或任何其他服务，只需修改 `.env` 文件，**代码一字不改**。

---

#### 消息的三种角色

每次调用 LLM API，你发送的不是"一句话"，而是一个**消息列表**（messages 数组）。每条消息有一个"角色"：

| 角色 | 英文 | 作用 | 例子 |
|------|------|------|------|
| 🎭 系统提示 | `system` | 定义 AI 的身份、行为规则（用户看不见） | "你是一个专业的花艺师" |
| 👤 用户 | `user` | 你说的话 | "推荐一束母亲节的花" |
| 🤖 助手 | `assistant` | AI 的回复 | "康乃馨搭配百合非常合适..." |

**多轮对话的实现原理**：AI 本身没有"记忆"，每次调用都是全新开始。我们的做法是：每次发消息时，把**所有历史消息**一起发过去。

```
第 1 轮: [system, user("你好")]
第 2 轮: [system, user("你好"), assistant("你好！"), user("今天天气怎样")]
第 3 轮: [system, user("你好"), assistant("..."), user("今天天气"), assistant("..."), user("再见")]
```

这就是为什么和 AI 聊很久之后费 Token 越来越多——因为每次都要把全部历史发过去。

---

#### 流式输出（SSE）是什么？

你在 ChatGPT 里看到文字一个一个"打出来"的效果，就是**流式输出（Streaming）**。

技术上，这用的是 **SSE（Server-Sent Events，服务器推送事件）**：

- **非流式**：服务器等 AI 把整段话想完，一次性发给你 → 等好几秒，突然全出来
- **流式**：AI 每想到一个词就立刻推送一条消息 → 你实时看到文字"生长"

SSE 的数据格式很简单，每一条消息长这样：

```
data: {"choices":[{"delta":{"content":"你"}}]}\n\n
data: {"choices":[{"delta":{"content":"好"}}]}\n\n
data: {"choices":[{"delta":{"content":"，"}}]}\n\n
data: [DONE]\n\n
```

我们的后端把这个流直接"透传"给前端，前端逐条解析，就实现了流式显示。

---

#### Token 是什么？

AI 不是按"字"或"词"处理文本，而是按 **Token（词元）**——一种介于字和词之间的基本单位。

- 中文：约 **1.5 字/Token**（"你好世界" ≈ 3-4 Token）
- 英文：约 **0.75 词/Token**（"Hello World" ≈ 2 Token）

**为什么关心 Token？** 因为 AI 服务按 Token 计费，也有 Token 数量限制（模型的"上下文窗口"）。我们的界面会实时显示 Token 用量，让你有直观感受。

---

#### 为什么不让前端直接调用 API？

一个很自然的问题：为什么不从浏览器直接调硅基流动，非要搭个后端做"中转"？

答案：**安全**。

如果前端直接调用，你的 API Key 会出现在浏览器的网络请求里，任何人打开开发者工具都能看到并盗用。

```
❌ 不安全的做法:
   前端 → 直接带着 API Key → 硅基流动（Key 暴露在浏览器）

✅ 安全的做法:
   前端 → 后端（/api/chat）→ 带 Key → 硅基流动
                   ↑
              Key 只存在服务器
```

---

### 🛠️ 1.2 动手实操

本阶段分三步完成：初始化项目 → 后端服务器 → 前端界面。

---

#### 第一步：初始化项目

> **📋 给 OpenCode 的指令（直接复制使用）：**
>
> ```
> 帮我创建一个新的 Node.js 项目，要求：
> 1. 项目目录名叫 aigc-chatbot
> 2. 安装 express 和 dotenv 两个依赖包
> 3. package.json 中加入 "type": "module"（使用 ES Modules 语法）
> 4. 创建 .env 文件，内容如下：
>    LLM_API_KEY=sk-你的密钥填在这里
>    LLM_BASE_URL=https://api.siliconflow.cn/v1
>    LLM_DEFAULT_MODEL=deepseek-ai/DeepSeek-V3.2
>    PORT=3000
> 5. 创建 .gitignore，忽略 node_modules 和 .env
> ```

OpenCode 生成后，找到 `.env` 文件，把 `sk-你的密钥填在这里` 替换成你刚才保存的真实 API Key。

✅ **验证**：目录下看到 `package.json`、`.env`、`node_modules/` 三个存在即可。

---

#### 第二步：创建后端

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 aigc-chatbot 目录下创建 server.js，实现一个 Express 后端服务器：
>
> 1. 使用 ES Modules 语法（import/export）
> 2. 从 dotenv 读取环境变量（LLM_API_KEY、LLM_BASE_URL、LLM_DEFAULT_MODEL、PORT）
> 3. 提供 public 目录下的静态文件
> 4. 创建 POST /api/chat 接口：
>    - 接收请求体 { messages: [{role, content}, ...] }
>    - 设置 SSE 响应头：Content-Type: text/event-stream，Cache-Control: no-cache，Connection: keep-alive
>    - 调用 LLM API（LLM_BASE_URL + /chat/completions），使用 Bearer 认证
>    - 在 messages 前加一条 system 消息："你是一个友好的AI助手。"
>    - 开启流式输出（stream: true）和 stream_options: { include_usage: true }
>    - 将 API 返回的 SSE 流原样转发给前端
>    - 解析每行 data: 中的 JSON，如果有 usage 字段则记录下来
>    - 流结束后，额外发送一条 data: 包含 { type: "usage", usage: {...} }
> 5. 监听 PORT，启动后打印提示信息
> ```

✅ **验证**：运行 `node server.js`，终端显示「服务已启动: http://localhost:3000」（此时前端还没有，访问是空页面，没关系）。

---

#### 第三步：创建前端界面

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 aigc-chatbot/public 目录下创建 index.html、style.css、app.js，做一个聊天界面：
>
> index.html 要求：
> - 支持深色/浅色双主题（默认深色，背景 #0d1117）
> - 顶部区域：左边"AI 聊天助手"标题 + ☀️ 主题切换按钮，右边"清空对话"按钮
> - 中间消息区：可滚动，用于显示聊天消息
> - 底部输入区：文本输入框（支持 Enter 发送）+ 发送按钮（毛玻璃效果）
> - 底部状态栏：显示「输入 Token: X | 输出 Token: X | 累计 Token: X」
> - 引入 CDN 的 marked.js（Markdown 渲染）和 highlight.js（代码高亮）
>
> style.css 要求：
> - 深色主题（默认）和浅色主题（通过 [data-theme="light"] CSS 变量切换）
> - 用户消息：右对齐，蓝紫渐变背景（#4facfe → #00f2fe）
> - AI 消息：左对齐，深灰背景（#1e2333），有浅灰圆角边框
> - AI 消息正在输出时显示闪烁光标动画
> - 按钮和输入框有 hover 效果
>
> app.js 要求：
> - 发送消息后，立即在界面显示用户消息
> - 发送 POST 请求到 /api/chat，传入 messages 数组
> - 用 ReadableStream 读取 SSE 响应，逐块解析
> - AI 回复逐字追加到消息气泡中（流式效果）
> - 解析流式 delta 中的 reasoning_content 字段（DeepSeek-R1 等推理模型的思考过程），
>   用 &lt;details&gt;/&lt;summary&gt; 折叠块实时显示思考内容，正文回复单独显示
> - 解析到 { type: "usage" } 时更新页面底部 Token 统计
> - 发送时禁用发送按钮，收到回复后恢复
> - 维护对话历史（messages 数组），支持多轮对话
> - 用 marked.js 渲染最终的 AI 回复内容（Markdown 格式）
> - 清空按钮清除对话历史和界面消息
> - 主题切换：点击 ☀️/🌙 按钮切换深色/浅色，用 localStorage 记忆用户偏好
> ```

✅ **验证**：先关掉之前启动的服务器（Ctrl+C），再重新 `node server.js`。打开浏览器访问 http://localhost:3000，输入「你好」，看到 AI 逐字回复，底部 Token 数字更新。

---

### 🔍 1.3 理解关键代码

**后端透传流的原理**：
```
[硅基流动 API] → 返回 SSE 流
      ↓
[我们的后端 /api/chat] → 一边读一遍直接 res.write() 给前端
      ↓
[前端 ReadableStream] → 逐块接收并解析
```

后端不等待 AI 说完整句话，而是立即把收到的每一小块数据（chunk）转发给前端。这就是流式体验的来源。

**前端解析 SSE 的核心循环**：
```javascript
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();  // 读一块
  if (done) break;
  // 把每一块解码，提取其中的文字内容
  // 追加到 AI 消息气泡里
}
```

---

### 🧪 1.4 验收清单

完成本章前，逐项确认：

- [ ] 终端 `node server.js` 无报错，显示启动成功
- [ ] 浏览器打开 `localhost:3000` 看到聊天界面（不是空白）
- [ ] 输入「你好」，AI 有回复且文字是**逐渐出现**的（不是突然全出来）
- [ ] 底部 Token 统计栏显示了数字（不是 0）
- [ ] 输入「1+1等于几」再输入「你还记得我刚才问了什么吗」，AI 能回忆起上文（多轮对话）
- [ ] 点击清空按钮，消息区清空，Token 归零
- [ ] 点击 ☀️ 按钮，界面切换为浅色主题；刷新页面后主题不变（localStorage 记忆）
- [ ] 切换到 DeepSeek-R1 模型后发送消息，若模型返回思考过程，能看到折叠的「思考过程」块

---

### 🔧 1.5 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| `SyntaxError: Cannot use import` | 缺少 `"type": "module"` | 检查 `package.json`，加入 `"type": "module"` |
| `Cannot find module 'express'` | 未安装依赖 | 运行 `npm install` |
| `EADDRINUSE port 3000` | 端口被占用 | 关掉旧进程，或改 `.env` 中 `PORT=3001` |
| API 返回 401 错误 | API Key 错误 | 检查 `.env` 中 `LLM_API_KEY` 是否完整 |
| 界面空白（没有聊天框） | `public/` 目录路径错误 | 让 OpenCode 检查 `express.static()` 的路径参数 |
| AI 回复一次性出现（不是逐字） | SSE 解析未使用 ReadableStream | 把症状描述给 OpenCode，让它修复前端解析逻辑 |

> 💡 **万能修复咒语**：遇到任何报错，把**完整的错误信息**复制给 OpenCode，说：「我运行项目时遇到了这个错误，请帮我修复：[粘贴错误]」

---

### ✅ 1.6 知识自测

1. LLM API 的 `messages` 数组中，`system` / `user` / `assistant` 三种角色各自的作用是什么？
2. 为什么要用后端做代理，而不让前端直接调用 API？
3. 流式输出和非流式输出的区别是什么？SSE 的数据格式长什么样？
4. 如果你和 AI 聊了 10 轮对话，第 11 次请求会发送多少条消息给 API？

---

### 🏆 1.7 挑战任务

- 修改 `server.js` 里的 system prompt，让你的 AI 变成「只用文言文回答问题的诗人」，测试效果
- 尝试给聊天气泡加个头像图标（圆形，AI 显示机器人 emoji，用户显示人物 emoji）

---

## 第二章：调控 AI 的"性格" — 参数调优面板

### 🎯 完成本章你将获得

在聊天界面左侧增加一个可折叠的参数调控面板，可以实时调整 AI 的"创意程度"、回复风格、使用的模型，并能自定义 AI 的"人设"。

---

### 📖 2.1 背景知识

#### Temperature：AI 的创意旋钮

`temperature` 是所有参数中最重要的一个，它控制 AI 输出的**随机性**：

```
temperature = 0    ───  每次回答几乎相同，永远选"最有把握"的词
temperature = 0.7  ───  稳定但自然（默认值）
temperature = 1.5  ───  创意丰富，但可能"天马行空"
temperature = 2.0  ───  极度随机，可能语无伦次
```

**背后的原理**：LLM 每一步预测下一个词时，会给所有候选词打分（概率分布）。`temperature` 控制这个分布的"平坦度"：

- 低温度 → 分布变"尖"→ 高概率词被选中概率更高 → 输出更确定
- 高温度 → 分布变"平"→ 各词被选中概率趋于均等 → 输出更随机

**实用建议**：

| 场景 | 推荐 temperature |
|------|----------------|
| 数学计算、事实查询 | 0 ~ 0.3 |
| 日常对话、翻译 | 0.3 ~ 0.7 |
| 创意写作、头脑风暴 | 0.7 ~ 1.2 |
| 实验性创作 | 1.2 ~ 2.0 |

---

#### Top-P（核采样）：另一种控制方式

`top_p` 从不同角度控制随机性——它限制 AI 从哪些候选词中选择：

- `top_p = 0.1`：只从累计概率达到 10% 的最高概率词（极少数词）中选
- `top_p = 0.9`：从累计概率达到 90% 的候选词中选（覆盖大部分合理候选）
- `top_p = 1.0`：不限制，从所有词中选

> 💡 **重要提示**：`temperature` 和 `top_p` 择一调整即可，不建议同时大幅修改两个，否则效果难以预测。通常保持一个为默认值，只调另一个。

---

#### System Prompt（系统提示词）：给 AI 定"人设"

System Prompt 是你对 AI 的"形象设定"——在对话全程生效，但用户自己看不到它。

**弱 Prompt vs. 强 Prompt 对比**：

```
❌ 弱 Prompt: "你是助手"

✅ 强 Prompt: 
"你是易速鲜花的资深花艺顾问，从业20年，熟悉各类花卉的花语与保养方法。
 回答风格：温暖、专业，适当用花卉比喻人生道理。
 约束：每次回答不超过150字，主动推荐当季花卉，不回答与鲜花无关的话题。"
```

System Prompt 的威力：同样的 AI 模型，写作 Prompt 就变成写作大师，医学 Prompt 就变成医疗顾问，客服 Prompt 就变成专属客服机器人。

---

#### 其他参数

| 参数 | 作用 | 通俗理解 |
|------|------|---------|
| `max_tokens` | 限制单次回复最大长度 | "说这么多就够了，别啰嗦" |
| `frequency_penalty` | 降低重复词的概率（0~2） | 防止 AI 反复说同一句话 |
| `presence_penalty` | 鼓励 AI 引入新话题（0~2） | 让 AI 多样化，不局限一个主题 |

---

### 🛠️ 2.2 动手实操

> **📋 给 OpenCode 的指令：**
>
> ```
> 修改 aigc-chatbot 项目，在聊天界面添加一个参数设置面板：
>
> 前端修改（public/index.html 和 style.css）：
> 1. 在聊天区左侧添加一个可折叠侧边栏，有展开/折叠按钮
> 2. 侧边栏包含以下控件，每项旁边有简短中文说明：
>    - 模型选择下拉框：三个选项
>      * DeepSeek-V3.2（默认选中，value=deepseek-ai/DeepSeek-V3.2）
>      * Qwen2.5-7B免费（value=Qwen/Qwen2.5-7B-Instruct）
>      * DeepSeek-R1推理（value=deepseek-ai/DeepSeek-R1）
>    - Temperature 滑块：范围 0-2，步长 0.1，默认 0.7，旁边显示当前值
>    - Top-P 滑块：范围 0-1，步长 0.05，默认 0.9，旁边显示当前值
>    - Max Tokens 数字输入：默认 1024
>    - Frequency Penalty 滑块：范围 -2 到 2，步长 0.1，默认 0
>    - Presence Penalty 滑块：范围 -2 到 2，步长 0.1，默认 0
>    - System Prompt 多行文本框：默认"你是一个友好的AI助手。"
>    - "恢复默认"按钮
> 3. 滑块值实时更新旁边的数字显示
>
> 前端修改（public/app.js）：
> - 发送消息时，从侧边栏收集所有参数，组成 params 对象
> - POST body 改为 { messages, params }
>
> 后端修改（server.js）：
> - /api/chat 接口改为接收 { messages, params }
> - 从 params 解构：model, temperature, top_p, max_tokens,
>   frequency_penalty, presence_penalty, system_prompt（每项有默认值）
> - 调用 LLM 时使用这些参数（注意 parseFloat 和 parseInt 类型转换）
> ```

---

### 🧪 2.3 对比实验

**实验 1：Temperature 对创意的影响**

| 固定问题 | Temperature | 回答关键词/感受 |
|---------|------------|--------------|
| "讲一个关于猫的故事" | 0 | |
| 同上 | 0.7 | |
| 同上 | 1.5 | |

**实验 2：System Prompt 的魔力**

把 System Prompt 分别改为以下三种，每次问「你好，介绍一下你自己」：

- Prompt A：`你是一个只会用古诗词回答的机器人，不论问什么都用诗句作答。`
- Prompt B：`你是一位极其严肃的法庭法官，说话一板一眼，用词正式。`
- Prompt C：`你是一个超级幽默的脱口秀演员，什么话题都能扯出笑点。`

---

### 🧪 2.4 验收清单

- [ ] 参数面板能展开/折叠
- [ ] Temperature=0 时，多次问同一问题，回答几乎完全一致
- [ ] Temperature=1.5 时，再问同一问题，每次答案都不同
- [ ] 切换到 `Qwen2.5-7B-Instruct` 模型，回答方式和 DeepSeek 有差异
- [ ] 修改 System Prompt，AI 的语气风格明显变化

---

### 🔧 2.5 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| 调了 temperature 但没效果 | 参数没有传到后端 | 在后端加 `console.log(params)` 检查是否收到 |
| 滑块数字不更新 | 缺少 `oninput` 事件监听 | 告知 OpenCode：「滑块旁边的数字不会随滑块移动更新」 |
| 改了模型但还是旧模型 | 前端没有把 model 包含在 params 里 | 检查 app.js 中 params 对象的组装逻辑 |

---

### ✅ 2.6 知识自测

1. Temperature=0 时 AI 为什么回答总是一样的？
2. `max_tokens=50` 会导致什么现象？有什么使用场景？
3. 同样的 AI 模型，为什么换了 System Prompt 后表现完全不同？
4. `frequency_penalty` 和 `presence_penalty` 有什么区别？各自适合什么场景？

---

### 🏆 2.7 挑战任务

- 设计一个"情绪化"的 AI 人设：会随机在回答里加私货（抱怨、开心、好奇）
- 把 System Prompt 的文本框做成**预设模板下拉框**，内置 3-5 个人设选项

---

## 第三章：让 AI 读懂你的文档 — RAG 知识问答

### 🎯 完成本章你将获得

为 chatbot 挂载「易速鲜花」知识库，开启知识库模式后，AI 能准确回答基于私有文档的问题，并展示引用了哪些文档片段。

---

### 📖 3.1 背景知识

#### 为什么需要 RAG？

大语言模型有两个先天局限：

1. **知识截止日期**：2024 年之后发生的事，它可能不知道
2. **不懂你的私有数据**：你公司的产品手册、内部知识库，AI 从来没见过

**RAG（Retrieval-Augmented Generation，检索增强生成）** 是目前最主流的解决方案。

本质上极其简单，一句话说清楚：

> **先检索，再生成**。找到最相关的文档片段，把它们塞进 System Prompt，让 AI 基于这些内容回答。

```
没有 RAG：用户提问 → AI 凭训练记忆回答（可能"幻觉"）

有了 RAG：用户提问 → 搜索知识库 → 找到相关片段 → 
          把片段放进 System Prompt → AI 基于文档回答
```

这和"开卷考试"是一个道理：AI 不需要死记硬背一切，用到的时候查就行。

---

#### 向量嵌入（Embedding）：让计算机理解"语义"

普通的文字搜索（关键词匹配）有缺陷——搜索"鲜花保养"找不到写着"花卉养护方法"的段落，因为字面上不同。

**向量嵌入（Embedding）** 解决了这个问题：把文字转换成一串数字（向量），语义相近的文字会生成相近的向量。

```
"鲜花保养"  → [0.23, 0.87, 0.45, 0.12, 0.61, ...]
"花卉养护"  → [0.25, 0.85, 0.43, 0.14, 0.60, ...]  ← 数字很接近！
"今天天气"  → [0.91, 0.12, 0.67, 0.88, 0.03, ...]  ← 数字差很远
```

我们用硅基流动的 `BAAI/bge-m3` 模型生成向量——这个模型**完全免费**，专门做中文语义理解，效果很好。

---

#### 余弦相似度：量化两段话有多"相关"

拿到向量之后，怎么判断两段话有多相关？用**余弦相似度**：

```
similarity = (A · B) / (|A| × |B|)
```

- 结果为 **1**：两段话完全一样（方向完全相同）
- 结果为 **0**：两段话毫不相关（方向垂直）
- 结果为 **-1**：两段话语义完全相反

在实际检索中，我们对所有文档片段计算与问题的余弦相似度，取分数最高的 Top-3。

---

#### 文档切分（Chunking）：为什么不把全文给 AI？

一整份文档可能有几万字，但 AI 的"思考空间"（Context 窗口）有限，成本也随长度增加。

解决办法：把文档切成 **500 字左右的小片段（Chunk）**，并保留相邻片段间约 100 字的**重叠**（避免一个句子被切断，导致语义丢失）。

```
原文: ─────────────────────────────────────────────────
       [片段1, 500字] 
                  [50字重叠]
                   [片段2, 500字]
                              [50字重叠]
                               [片段3, 500字]
```

---

#### RAG 的完整流程图

```
【索引构建阶段（一次性）】
文档 → 切分 Chunks → 生成向量 → 存入 vectorstore.json

【查询阶段（每次对话）】
用户提问 → 生成问题向量 → 余弦相似度计算 → Top-3 片段
                                              ↓
                              注入 System Prompt: "请基于以下内容回答..."
                                              ↓
                                      调用 LLM → 回答
```

---

#### [进阶] 重排序（Reranking）：精排 vs 粗排

向量检索是"粗排"——速度快，但只考虑整体语义相似度，可能漏掉真正相关的片段。

**重排序** 是"精排"——用一个专门的模型，逐一判断"问题"与每个候选片段的真实相关性，给出更准确的排序：

```
普通 RAG：提问 → 向量相似度 Top-3 → 给 AI
重排序 RAG：提问 → 向量 Top-10（粗排，快）→ 重排序精排 Top-3（慢但准）→ 给 AI
```

硅基流动提供免费的重排序模型 `BAAI/bge-reranker-v2-m3`，通过 `.env` 中的 `RERANK_ENABLED=true` 开启。

---

### 🛠️ 3.2 动手实操

本阶段分 5 个步骤（加 1 个可选进阶步骤）。

---

#### 第一步：文档加载器

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 aigc-chatbot/rag 目录下创建 loader.js：
>
> 安装文档解析依赖：npm install mammoth pdf-parse
>
> 实现并导出 async function loadAndChunkDocuments(dirPath) 函数：
> 1. 读取 dirPath 目录下所有 .txt、.md、.json、.csv、.docx、.pdf 文件
>    - .txt/.md/.json/.csv：直接读取文本
>    - .docx：使用 mammoth 库（mammoth.extractRawText({ buffer })）提取纯文本
>    - .pdf：使用 pdf-parse 库（const result = await pdfParse(buf); content = result.text）
>    - 若 mammoth 或 pdf-parse 未安装则跳过对应文件并打印警告（不中断构建）
> 2. 对每个文件内容，按空行（两个或以上换行）切分为段落
> 3. 如果某段落超过 500 字，按句号/换行强制切分
> 4. 相邻片段保留约 100 字的重叠
> 5. 每个片段格式：{ content: "...", source: "文件名", index: 序号 }
> 6. 过滤掉少于 30 字的片段
> 7. 返回片段数组
> ```

---

#### 第二步：向量嵌入模块

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 aigc-chatbot/rag 目录下创建 embeddings.js：
>
> 实现并导出 getEmbeddings(texts) 函数：
> 1. 接收字符串或字符串数组 texts
> 2. 调用 process.env.LLM_BASE_URL + /embeddings 接口
> 3. 请求体：{ model: process.env.EMBEDDING_MODEL, input: texts }
>    （注意是 input，不是 inputs，否则会报错）
> 4. Headers：Authorization: Bearer process.env.LLM_API_KEY
> 5. 解析响应，按 index 字段排序，返回向量数组（每个向量是 number[]）
>
> 同时请在 .env 文件中追加：
>    EMBEDDING_MODEL=BAAI/bge-m3
> ```

---

#### 第三步：向量存储与检索

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 aigc-chatbot/rag 目录下创建 vectorstore.js：
>
> 实现并导出两个函数：
>
> buildIndex(chunks)：
> 1. 将 chunks 分批（每批 8 个）调用 getEmbeddings 生成向量
> 2. 将 { chunk, vector } 对象数组写入 rag/vectorstore.json
>
> search(query, topK=3, rerankEnabled=false)：
> 1. 对 query 调用 getEmbeddings 得到查询向量
> 2. 读取 rag/vectorstore.json
> 3. 用余弦相似度计算每个片段与 query 的相似度
>    （余弦相似度 = 点积 / (|A| × |B|)）
> 4. 按相似度降序排列，取前 topK
> 5. 返回 [{ chunk, score }, ...] 格式
> ```

---

#### 第四步：后端集成

> **📋 给 OpenCode 的指令：**
>
> ```
> 修改 aigc-chatbot/server.js，添加 RAG 功能：
>
> 1. 新增路由 POST /api/rag/build-index：
>    - 路径优先级：① 通过 set-knowledge-dir 动态设置的目录（见下）
>                  ② resolve(process.env.KNOWLEDGE_DIR)（用 resolve() 解决相对路径问题）
>                  ③ 默认 join(__dirname, '..', 'OneFlower', 'OneFlower')
>    - 调用 await loadAndChunkDocuments(dir)（注意 loader 现在是 async 函数）
>    - 调用 vectorstore.js 的 buildIndex 构建索引
>    - 返回 { success: true, count: 片段数量, dir: 实际使用的路径 }
>
> 2. 新增路由 GET /api/rag/list-folders：
>    - 接收 ?path= 参数，返回该目录下的子目录列表
>    - path 为空时列出 Windows 盘符（C:\、D:\ 等）
>    - 返回 { currentPath, parentPath, canGoUp, folders: [{name, path}] }
>
> 3. 新增路由 POST /api/rag/set-knowledge-dir：
>    - 接收 { path } 参数，验证目录存在后设为当前知识库目录
>    - 返回 { success: true, path }
>
> 4. 修改 POST /api/chat，新增 ragEnabled 参数：
>    - 请求体改为 { messages, params, ragEnabled }
>    - 当 ragEnabled=true 时：
>      a. 取最后一条 user 消息作为查询词
>      b. 调用 search 获取 Top-3 相关片段
>      c. 把片段内容拼入 system_prompt（格式：
>         "请基于以下知识库内容回答，如无相关信息请如实说明：[片段内容]"）
>    - 在流开始前，先发送一条 SSE 事件：
>      { type: "metadata", ragSources: [{chunk, score}, ...] }
>
> 同时在 .env 中追加：
>    KNOWLEDGE_DIR=./OneFlower/OneFlower
> ```

---

#### 第五步：前端集成

> **📋 给 OpenCode 的指令：**
>
> ```
> 修改 aigc-chatbot/public 下的前端文件，添加 RAG 界面：
>
> index.html / style.css：
> 1. 在顶部工具栏添加"📚 知识库模式"开关（toggle 样式）
> 2. 旁边添加 📁 选择目录 按钮 + "当前目录：（未设置）"标签
> 3. 旁边添加"🔨 构建索引"按钮
> 4. 添加目录浏览弹窗（Modal）：
>    - 显示当前路径 + 返回上级按钮
>    - 列出子目录（可双击进入）
>    - 底部有"确认选择"按钮
> 5. AI 消息下方，如果有 ragSources，显示可折叠的"参考来源"区域：
>    - 用 details/summary 折叠组件
>    - 每条来源显示：文件名 + 相似度分数 + 前 80 字内容预览
>
> app.js：
> 1. 发送时，将 ragEnabled（开关状态）加入 POST body
> 2. 解析 SSE 中 { type: "metadata" } 事件，提取 ragSources
> 3. 在 AI 消息气泡下方渲染来源区域
> 4. 构建索引按钮点击时，POST /api/rag/build-index，显示成功/失败结果
> 5. 📁 按钮打开目录浏览弹窗：
>    - 首次打开调用 GET /api/rag/list-folders 获取盘符列表
>    - 单击进入子目录，支持返回上级
>    - "确认选择"调用 POST /api/rag/set-knowledge-dir，更新当前目录标签
> ```

---

#### [进阶] 第六步：重排序模块

> **📋 给 OpenCode 的指令（进阶，可跳过）：**
>
> ```
> 创建 rag/reranker.js，实现重排序功能：
> 1. 调用 process.env.LLM_BASE_URL + /rerank 接口
> 2. 请求体：{ model: process.env.RERANK_MODEL, query, documents, top_n: 3 }
> 3. 如果 process.env.RERANK_ENABLED !== 'true'，直接返回 null
> 4. 返回按相关性排序的文档列表
>
> 修改 vectorstore.js 的 search 函数：
> - 先粗检索 Top-10（而不是 Top-3）
> - 如果 rerankEnabled=true，调用 reranker.js 精排，返回 Top-3
> - 否则直接返回相似度 Top-3
>
> 修改前端：在参数面板添加"启用重排序"开关（标注"进阶"）
>
> 同时在 .env 追加：
>    RERANK_MODEL=BAAI/bge-reranker-v2-m3
>    RERANK_ENABLED=false
> ```

---

### 🧪 3.3 验收清单

- [ ] 点击「构建索引」，显示「索引构建成功，共 X 个片段」（X > 0）
- [ ] `rag/vectorstore.json` 文件出现在磁盘上
- [ ] 📁 选择目录能打开浏览弹窗，选择后当前目录标签更新
- [ ] 知识库目录中放入 .docx 或 .pdf 文件后重新构建，文件被成功索引（片段数增加）
- [ ] **开启**知识库模式，询问「易速鲜花有哪些鲜花产品？」→ AI 回答引用了文档内容
- [ ] **关闭**知识库模式，同样问题 → AI 说"我没有这方面的信息"
- [ ] AI 消息下方有可折叠的「参考来源」区域，能看到文件名和相似度
- [ ] [进阶] 开启重排序后，检索到的来源片段排列顺序有变化

---

### 🔧 3.4 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| 构建索引失败，"目录不存在" | KNOWLEDGE_DIR 路径错误 | 用 📁 选择目录 选择正确路径，或检查 `.env` 中 `KNOWLEDGE_DIR` |
| 嵌入 API 报 400 错误 | 请求体字段名错误 | 确认是 `input` 不是 `inputs` |
| .docx/.pdf 文件未被索引 | mammoth/pdf-parse 未安装 | 运行 `npm install mammoth pdf-parse` |
| 知识库模式开启但回答没引用文档 | vectorstore.json 为空或未加载 | 重新点构建索引；检查后端 ragEnabled 是否正确接收 |
| 参考来源分数很低（< 0.3） | 文档内容与问题语义差距大 | 换用文档中真实存在的信息来提问 |

---

### ✅ 3.5 知识自测

1. RAG 的核心思路用一句话描述是什么？
2. 为什么要把文档切分成小片段，而不是把整个文档给 AI？
3. 余弦相似度 = 0.9 和 = 0.3 分别意味着什么？
4. 重排序（Reranking）与向量检索的区别是什么？各有什么优劣？

---

### 🏆 3.6 挑战任务

- 把你自己的一份文档（产品说明书、公司 FAQ、读书笔记）放进知识库，测试问答效果
- 调整 chunkSize（200 字 vs 500 字 vs 1000 字），观察回答质量的差异，找到最佳值

---

## 第四章：让 AI 查天气 — Function Calling

### 🎯 完成本章你将获得

chatbot 具备实时天气查询能力。当你问"北京今天天气"时，AI 会自动调用天气 API，以天气卡片的形式呈现真实气象数据。

---

### 📖 4.1 背景知识

#### Function Calling（工具调用）是什么？

到目前为止，我们的 AI 只能用"脑子里的知识"回答。但如果用户问"北京现在多少度"——实时数据不在它的训练集里，它只能猜。

**Function Calling（函数调用/工具调用）** 让 AI 能够"伸手"去获取外部实时数据：

```
之前：用户问天气 → AI: "我的知识截止于某某时间，无法获取实时天气" ❌

现在：用户问天气 → AI: "我需要调用天气工具查询"
                → [系统执行 wttr.in API]
                → AI 看到返回的天气数据
                → AI: "北京今天晴天，15℃，感觉像12℃。建议穿外套。" ✅
```

**一个关键认知**：AI 不是"直接调用"工具。它只是**声明**"我需要调用什么工具、传什么参数"，实际调用是由我们的后端代码执行的。这个区别很重要：

```
LLM 的职责: 决策 + 语言理解 + 最终回答生成
我们的代码: 工具注册 + 实际工具执行 + 结果传回 LLM
```

---

#### 工具定义：用 JSON 描述工具

要让 AI 知道有什么工具可以用，我们需要用 JSON Schema 格式描述它：

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "获取指定城市的当前天气。当用户询问天气、温度、气候时调用。",
    "parameters": {
      "type": "object",
      "properties": {
        "city": {
          "type": "string",
          "description": "城市名称，使用英文，如 Beijing、Shanghai"
        }
      },
      "required": ["city"]
    }
  }
}
```

**`description` 字段极其重要**：AI 完全靠这段描述来决定"什么时候调用这个工具"。描述越精确，AI 的判断越准确。

---

#### 两次调用模式：完整流程图

Function Calling 需要两次 LLM 调用：

```
第一次调用（检测阶段）：
  [你的消息] + [工具定义列表]
      ↓
  发送给 LLM
      ↓
  LLM 返回: "请调用 get_weather，参数 city='Beijing'"  （finish_reason = "tool_calls"）
      ↓
  后端代码执行: 请求 wttr.in → 得到天气数据

第二次调用（生成阶段）：
  [你的消息] + [第一次 LLM 的 tool_calls 声明] + [工具执行结果]
      ↓
  发送给 LLM（这次不带工具定义，因为已经执行完了）
      ↓
  LLM 基于天气数据生成自然语言回答（流式返回）
```

**如果用户问的不是天气**（如"写首诗"），第一次调用时 LLM 会直接返回内容（`finish_reason = "stop"`），我们跳过工具执行，直接把这次的流式内容发给前端。

---

#### wttr.in API：免费天气数据

我们使用 `wttr.in`，一个完全免费、无需注册、无需 API Key 的天气服务：

```
请求:  GET https://wttr.in/Beijing?format=j1
返回:  JSON 格式的天气数据，包含温度、湿度、风速等
```

---

### 🛠️ 4.2 动手实操

---

#### 第一步：创建天气工具模块

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 aigc-chatbot/tools 目录下创建 weather.js：
>
> 实现并导出 getWeather(city) 函数：
> 1. 调用 https://wttr.in/{city}?format=j1 获取天气数据（GET 请求，无需 API Key）
> 2. 从响应 JSON 中提取：
>    - temp_C（当前温度）
>    - FeelsLikeC（体感温度）
>    - weatherDesc[0].value（天气描述）
>    - humidity（湿度）
>    - windspeedKmph（风速）
> 3. 返回 { city, temperature, feelsLike, description, humidity, windSpeed } 对象
> 4. 如果请求失败，抛出包含错误信息的 Error
> ```

---

#### 第二步：集成 Function Calling 到后端

> **📋 给 OpenCode 的指令：**
>
> ```
> 修改 aigc-chatbot/server.js，添加 Function Calling 支持：
>
> 1. 在文件顶部定义 tools 数组，包含一个 get_weather 工具：
>    - type: "function"
>    - name: "get_weather"
>    - description: "获取指定城市的当前天气信息。当用户询问天气、温度、气候相关问题时调用。"
>    - parameters: 包含 city 字段（string 类型，必填）
>
> 2. 定义 toolHandlers 对象：
>    { get_weather: async (args) => getWeather(args.city) }
>
> 3. 修改 POST /api/chat 的 LLM 调用逻辑，改为流式工具检测模式：
>    第一次流式请求（含 tools 定义和 tool_choice: "auto"）：
>    - 逐行读取 SSE 流
>    - 检测 delta.tool_calls，如果有则累积工具名和参数（注意分片拼接）
>    - 如果没有 tool_calls，直接将内容 delta 转发给前端（纯聊天路径）
>
>    如果检测到 tool_calls：
>    a. 先发送 SSE 事件 { type: "metadata", toolCalls: [...] } 通知前端
>    b. 执行工具：根据工具名调用 toolHandlers 中对应的函数
>    c. 第二次流式请求：messages 附加 assistant 的 tool_calls 消息 + tool 结果消息
>    d. 将第二次流式响应转发给前端
>
> 可选：修改前端 app.js，当 metadata 中有天气工具结果时，在 AI 消息上方渲染天气卡片
> （显示城市名、温度、体感温度、天气描述）
> ```

---

### 🧪 4.3 验收清单

- [ ] 问「上海今天天气怎么样」→ AI 返回包含真实温度的天气信息
- [ ] 问「北京和成都哪里更冷」→ AI 分别查询了两个城市然后对比
- [ ] 问「给我写一首关于秋天的诗」→ AI **不调用**天气工具，直接写诗
- [ ] 天气信息以卡片形式展示（如果做了前端）

---

### 🔧 4.4 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| 工具调用参数是空的 | tool_calls 分片拼接逻辑有问题 | 让 OpenCode 检查 `delta.tool_calls` 的累积代码 |
| 第二次 LLM 请求报错 | `tool_call_id` 不匹配 | 确认 assistant 消息里的 id 与 tool 结果消息里的 `tool_call_id` 一致 |
| wttr.in 超时 | 网络问题 | 换城市重试；或临时用 mock 数据测试工具调用逻辑 |
| 问天气后 AI 说"没有工具结果" | 工具定义没有传给 LLM | 检查 `body: JSON.stringify()` 里是否包含 tools 数组 |

---

### ✅ 4.5 知识自测

1. Function Calling 为什么需要两次 API 调用？每次调用分别做什么？
2. LLM 是"调用"工具还是"声明要调用"工具？区别是什么？
3. 工具的 `description` 字段如果写得不够精确，会发生什么问题？
4. 如果用户问"写首诗"，后端应该走哪条逻辑路径？

---

### 🏆 4.6 挑战任务

- 给天气卡片加上天气图标（用 emoji 判断：晴/多云/雨/雪）
- 添加汇率查询工具：调用 `https://open.er-api.com/v6/latest/USD`（免费，无需 Key）

---

## 第五章：让 AI 读新闻 — MCP 协议

### 🎯 完成本章你将获得

通过 MCP 协议接入 RSS 新闻源。当你问"今天科技新闻有什么"时，chatbot 会实时获取并汇总最新新闻条目。

---

### 📖 5.1 背景知识

#### MCP 是什么？从一个类比开始

回想电脑接口的历史：以前每种设备（打印机、鼠标、U盘、相机）用的接口都不一样，你需要一堆不同的线。**USB** 的出现统一了接口标准，从此任何设备只要符合 USB 规范，就能接到任何电脑。

**MCP（Model Context Protocol，模型上下文协议）** 对 AI 工具生态做了同样的事：

```
没有 MCP（现在）:
  天气工具 ──→ 专为 Claude 写的接入代码
  数据库工具 ──→ 专为 GPT-4 写的接入代码
  搜索工具 ──→ 专为 Gemini 写的接入代码
  每个 AI 每个工具都要写定制代码...

有了 MCP（将来）:
  所有工具 ──→ 遵循 MCP 协议 ──→ 接入任何 AI 应用
  开发一次，到处运行
```

MCP 由 Anthropic（Claude 的母公司）提出，目前已成为行业事实标准，OpenAI、Google 等主要 AI 厂商都在跟进。

---

#### MCP 的两个角色

| 角色 | 职责 | 类比 |
|------|------|------|
| **MCP Server** | 封装具体能力，暴露工具列表 | USB 设备（一个 U 盘） |
| **MCP Client** | 发现并调用 Server 提供的工具 | 电脑上的 USB 控制器 |

**你的 chatbot 是 MCP Client**，RSS 新闻服务（`feed-mcp`）是 **MCP Server**。

通信方式：**stdio（标准输入输出）**——两个进程之间通过终端管道传递消息：

```
你的后端（MCP Client）
    ↓ 通过 stdio
  npx feed-mcp（MCP Server 进程）
    ↓ HTTP
  RSS 订阅源（BBC、HackerNews 等）
```

---

#### Phase 4 vs Phase 5：直接 API 和 MCP 的区别

| 对比维度 | Phase 4（直接调用 API） | Phase 5（MCP 协议） |
|----------|----------------------|-------------------|
| 接入方式 | 自己写 `fetch` 调用 | 通过 MCP 协议标准化调用 |
| 代码量 | 少（一个文件） | 多一点（有 SDK 初始化） |
| 生态 | 只能用这一个 API | 符合 MCP 的工具可以随意替换 |
| 未来价值 | 学会一个工具 | 学会一种接口标准 |

---

### 🛠️ 5.2 动手实操

---

#### 第一步：创建 MCP 客户端与新闻工具

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 aigc-chatbot 项目中接入 MCP 新闻功能：
>
> 1. 安装依赖：npm install @modelcontextprotocol/sdk
>
> 2. 创建 mcp/mcp-config.json：
>    {
>      "mcpServers": {
>        "rss-news": {
>          "command": "npx",
>          "args": ["-y", "feed-mcp@latest"]
>        }
>      }
>    }
>
> 3. 创建 tools/news.js，实现并导出 getNews(topic) 函数：
>    - 使用 MCP SDK 的 Client 和 StdioClientTransport
>    - 通过 npx 启动 feed-mcp 子进程（stdio 通信）
>    - 调用 MCP 工具获取 RSS 新闻条目
>    - 根据 topic 参数选择 RSS 源：
>      * tech: https://hnrss.org/frontpage
>      * finance: https://feeds.finance.yahoo.com/rss/2.0/headline
>      * world, general: https://feeds.bbci.co.uk/news/world/rss.xml
>    - 返回新闻条目数组：[{ title, link, pubDate, summary }]
>    - 如果 MCP 连接失败，备用方案：直接 fetch RSS XML，用正则提取 <title> 标签内容
> ```

---

#### 第二步：将新闻工具加入工具列表

> **📋 给 OpenCode 的指令：**
>
> ```
> 修改 aigc-chatbot/server.js，将新闻工具加入工具列表：
>
> 1. 导入 getNews 函数
> 2. 在 tools 数组中添加 get_news 工具：
>    - name: "get_news"
>    - description: "获取最新新闻资讯。当用户询问新闻、热点事件、
>      最新消息、发生了什么时调用。"
>    - parameters: topic 字段（可选值：tech/general/finance/world）
>
> 3. 在 toolHandlers 添加：
>    get_news: async (args) => getNews(args.topic || 'general')
>
> 可选：修改前端 app.js，当 metadata 中有新闻工具结果时，
> 渲染新闻列表卡片（每条显示标题和链接）
> ```

---

### 🧪 5.3 验收清单

- [ ] 问「今天科技新闻有什么」→ 返回新闻条目（标题列表，不是空的）
- [ ] 问「今天国际新闻」→ 返回国际新闻（不是科技新闻）
- [ ] 问「北京天气」→ **仍然**正确调用天气工具（两工具共存）
- [ ] 问「写一首诗」→ 不调用任何工具

---

### 🔧 5.4 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| `feed-mcp` 工具名报错 | feed-mcp 版本变化，工具名不同 | 在 getNews 里先打印 `client.listTools()` 查看实际工具名 |
| MCP 子进程启动超时 | npx 下载 feed-mcp 包较慢 | 等待或检查网络，`npx -y` 会自动安装 |
| 新闻列表为空 | RSS 源暂时不可用 | 换用备用源 `hnrss.org/frontpage` |
| 两个工具互相冲突 | description 描述重叠 | 明确区分：get_news 用于"新闻/热点"，get_weather 用于"天气/温度" |

---

### ✅ 5.5 知识自测

1. MCP 解决了什么问题？为什么说它是 AI 工具生态的"USB 接口"？
2. MCP Server 和 MCP Client 分别承担什么职责？
3. stdio 通信是什么意思？MCP 怎么用 stdio 让两个进程交互？
4. 什么情况适合用直接 API 调用（Phase 4 方式），什么情况更适合用 MCP？

---

### 🏆 5.6 挑战任务

- 添加你感兴趣的 RSS 源（技术博客、播客节目、GitHub Trending）
- 让 AI 把返回的新闻条目做一段**摘要总结**，而不是直接罗列标题

---

## 第六章：让 AI 搜索互联网 — 多工具编排

### 🎯 完成本章你将获得

chatbot 拥有第四种工具（网络搜索），并能够根据用户意图**自动选择**正确的工具：天气查天气、新闻查新闻、百科问题搜索 DuckDuckGo、私有文档走 RAG、闲聊直接回答。

---

### 📖 6.1 背景知识

#### 多工具编排：AI 的自主判断

当用户发来一条消息，谁来决定"用哪个工具"？

答案：**LLM 自己决定**。它通过阅读每个工具的 `description` 字段，推断当前问题最适合用哪个工具（或者直接回答，不用任何工具）。

这意味着 `description` 的措辞直接决定工具的调用准确性：

```
❌ 模糊的描述：
   get_weather: "获取信息"         ← AI 不知道什么时候该用
   get_news: "获取最新内容"        ← 和天气描述重叠

✅ 精确、有区分度的描述：
   get_weather: "获取指定城市的当前天气、温度、湿度。
                当用户询问天气、气温、气候时调用。"
   get_news:    "获取最新新闻资讯。当用户询问新闻、热点、
                发生了什么事情时调用。"
   search_web:  "搜索互联网获取百科信息。当用户询问定义、
                概念解释、历史事件、人物介绍，且其他工具
                无法满足时调用。不用于天气、新闻查询。"
```

---

#### DuckDuckGo Instant Answer API

DuckDuckGo 提供**完全免费、不需要 API Key** 的即时回答接口：

```
请求:  GET https://api.duckduckgo.com/?q=量子计算&format=json&no_html=1
返回:  
  {
    "Heading": "量子计算",
    "Abstract": "量子计算是...",
    "RelatedTopics": [...]
  }
```

**注意局限**：这不是完整的搜索结果列表，而是"快速答案"——适合查定义、人物、概念等百科类问题，不返回最新新闻资讯（那个用 get_news 工具）。

---

#### 四工具协作：完整决策逻辑

```
用户消息
  ↓
❶ RAG 检索（如果 ragEnabled=true）：把相关文档片段注入 System Prompt
  ↓
❷ 调用 LLM（带工具定义列表）：LLM 判断是否需要工具
  ↓
  ├─ 不需要工具 → 直接流式回答（走普通聊天路径）
  │
  └─ 需要工具 → 执行工具 → 第二次 LLM 调用
                   ├─ get_weather: 调用 wttr.in
                   ├─ get_news:    调用 MCP feed-mcp
                   └─ search_web:  调用 DuckDuckGo
```

这就是所谓的 **Agent Pattern（智能体模式）的雏形**——AI 根据情境自主选择行动，而不是被硬编码的规则驱动。

---

### 🛠️ 6.2 动手实操

> **📋 给 OpenCode 的指令：**
>
> ```
> 在 aigc-chatbot 项目中添加 DuckDuckGo 搜索工具：
>
> 1. 创建 tools/search.js，实现并导出 searchDuckDuckGo(query) 函数：
>    - 调用 https://api.duckduckgo.com/?q={encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1
>    - 从响应中提取：Abstract、Heading、RelatedTopics（前5条的Text）、Answer、Definition
>    - 过滤空字段，返回 { heading, abstract, answer, definition, relatedTopics } 对象
>
> 2. 修改 server.js，在 tools 数组中添加 search_web：
>    - name: "search_web"
>    - description: "搜索互联网获取信息。当用户的问题需要最新或外部实时信息，
>      且天气工具和新闻工具均不适用时调用。适合：定义查询、概念解释、
>      人物/组织介绍、特定知识问答。不适合：天气、新闻、私人对话。"
>    - parameters: query 字段（string，搜索关键词）
>
> 3. 在 toolHandlers 添加：
>    search_web: async (args) => searchDuckDuckGo(args.query)
> ```

---

### 🧪 6.3 多工具测试矩阵

完成后，依次测试以下问题，填写实际结果：

| 测试问题 | 期望调用的工具 | 实际行为 | 是否符合 |
|---------|--------------|---------|---------|
| 「深圳今天天气怎么样」 | `get_weather` | | |
| 「今日财经新闻有哪些」 | `get_news` | | |
| 「什么是量子纠缠」 | `search_web` | | |
| 「帮我写一首关于春天的诗」 | （无工具，直接回复）| | |
| 「易速鲜花的鲜花怎么保养」（开启 RAG）| RAG 知识库 | | |

**目标**：至少 4/5 行「是否符合」为 ✅。如果有某个工具总是被误触发，调整它的 `description` 描述，让边界更清晰。

---

### 🧪 6.4 验收清单

- [ ] 上方测试矩阵全部填写完成
- [ ] 至少 4/5 测试通过
- [ ] 天气、新闻、搜索三个工具全部成功调用过至少一次
- [ ] 「写首诗」类问题不触发任何工具
- [ ] RAG 和工具可以同时开启，互不干扰

---

### 🔧 6.5 常见问题排查

| 症状 | 原因 | 修复方法 |
|------|------|---------|
| DuckDuckGo 总是返回空结果 | 某些查询词没有结果 | 换用英文查询；或换更通用的词 |
| 搜索工具和新闻工具总是混用 | 描述区分度不够 | 在 search_web 的 description 中明确写 "不用于查询新闻热点" |
| RAG 开启后天气工具不工作 | 两者冲突 | 检查 RAG 注入逻辑是否改变了 system_prompt 导致工具判断混乱 |

---

### ✅ 6.6 知识自测

1. 为什么 `description` 字段的措辞能决定工具是否被正确调用？
2. DuckDuckGo Instant Answer API 和完整搜索引擎（如 Google 搜索结果页）有什么区别？
3. 回顾整个课程的技术发展脉络：Phase 1 → Phase 6，你是如何一步步扩展 AI 的"边界"的？

---

### 🏆 6.7 终极挑战

- **接入新工具**：找一个你感兴趣的免费 API（汇率、笑话生成、星座运势、地震信息...），把它包装成一个新工具
- **场景化改造**：把整个 chatbot 改造成一个特定领域的专家助手（旅游顾问、学习导师、健身教练）——重写 System Prompt，调整工具描述，让它更聚焦
- **思考题**：当前的工具调用模式每次只能调一个工具。如果用户说「查一下北京天气，再查今天新闻，做个早报」，系统应该怎么改才能支持？（提示：Agent Loop、并行工具调用）

---

## 总结：你构建了什么

恭喜你完成了所有 6 个阶段！🎉

回顾一下你从零开始亲手搭建的东西：

| 阶段 | 你赋予它的能力 | 背后的技术 |
|------|--------------|-----------|
| Phase 1 | 🗣️ 能对话 | LLM API、SSE 流式输出、后端代理 |
| Phase 2 | 🎛️ 能调参数 | 推理参数（temperature/top_p）、Prompt Engineering |
| Phase 3 | 📖 能理解私有文档 | RAG、向量嵌入、余弦相似度、[进阶] Reranking |
| Phase 4 | 🌤️ 能查实时数据 | Function Calling、工具定义 Schema、两次调用模式 |
| Phase 5 | 📰 能读新闻 | MCP 协议、Server/Client、stdio 通信、RSS |
| Phase 6 | 🔍 能搜索互联网 | 多工具编排、工具描述工程 |

这正是市面上大多数 AI 应用产品（智能客服、AI 助手、企业知识库、Agent 工具）的核心架构。

---

## 附录 A：硅基流动注册与 API Key 获取

1. 访问 https://cloud.siliconflow.cn，点击「注册」
2. 使用手机号或邮箱注册并登录
3. 进入控制台，左侧菜单找到「API 密钥」
4. 点击「创建新密钥」，给密钥命名
5. 点击「复制」保存好（密钥只显示一次！）
6. 把密钥填入 `.env` 文件的 `LLM_API_KEY=` 后面

---

## 附录 B：`.env` 完整配置说明

```env
# === LLM API 配置 ===
LLM_API_KEY=sk-你的密钥              # 必填
LLM_BASE_URL=https://api.siliconflow.cn/v1
LLM_DEFAULT_MODEL=deepseek-ai/DeepSeek-V3.2

# === 嵌入模型（Phase 3 RAG）===
EMBEDDING_MODEL=BAAI/bge-m3

# === 重排序（Phase 3 进阶）===
RERANK_MODEL=BAAI/bge-reranker-v2-m3
RERANK_ENABLED=false

# === 知识库目录（Phase 3）===
KNOWLEDGE_DIR=./OneFlower/OneFlower

# === 服务端口 ===
PORT=3000
```

---

## 附录 C：可用免费模型列表

| 模型 | 适用场景 | 费用 |
|------|---------|------|
| `deepseek-ai/DeepSeek-V3.2` | 通用对话（**默认，推荐**） | 付费（额度充足） |
| `Qwen/Qwen2.5-7B-Instruct` | 快速测试，轻量对话 | **免费** |
| `deepseek-ai/DeepSeek-R1` | 需要深度推理的问题 | 付费 |
| `BAAI/bge-m3` | 向量嵌入（RAG 用） | **免费** |
| `BAAI/bge-reranker-v2-m3` | 重排序（RAG 进阶用） | **免费** |

---

## 附录 D：全程错误参考手册

| 错误信息 | 含义 | 解决方法 |
|---------|------|---------|
| `SyntaxError: Cannot use import statement` | 未启用 ES Modules | `package.json` 加 `"type": "module"` |
| `Error: Cannot find module 'express'` | 未安装依赖 | 运行 `npm install` |
| `EADDRINUSE 3000` | 端口被占用 | 改 `PORT=3001`，或关掉旧进程 |
| `401 Unauthorized` | API Key 无效 | 检查 `.env` 中 Key 是否完整且正确 |
| `400 Bad Request`（嵌入接口） | 请求参数错误 | 检查是否用了 `input`（非 `inputs`）|
| `fetch failed` / `ENOTFOUND` | 网络连接失败 | 检查网络；wttr.in 可能暂时不可用 |
| 前端空白页 | `express.static` 路径错误 | 确认 `public/` 目录存在且路径正确 |
| AI 回复不是流式 | `ReadableStream` 未正确使用 | 检查前端是否用了 `response.body.getReader()` |

**万能公式**：遇到任何错误，把**完整的错误信息**复制给 OpenCode：
```
我运行项目时遇到了这个错误，请帮我修复：[粘贴完整错误信息]
```

---

## 附录 E：核心术语表

| 中文 | 英文 | 一句话解释 |
|------|------|-----------|
| 大语言模型 | LLM | 能理解和生成自然语言的 AI 模型（DeepSeek、GPT 等） |
| 应用程序接口 | API | 访问外部服务功能的"窗口" |
| 服务器推送事件 | SSE | 服务器主动向客户端推送数据的机制，用于实现流式输出 |
| 词元 | Token | LLM 处理文本的最小单元，约等于半个词 |
| 系统提示词 | System Prompt | 对话全程生效的 AI 人设/规则设定（用户看不见）|
| 温度 | Temperature | 控制 AI 输出随机性的参数（0=确定，2=随机）|
| 检索增强生成 | RAG | 先检索相关文档，再让 AI 基于文档回答 |
| 向量嵌入 | Embedding | 把文字转化为可以计算相似度的数字向量 |
| 余弦相似度 | Cosine Similarity | 衡量两个向量（两段文字）有多相似的数值（0~1）|
| 工具调用 | Function Calling | AI 声明需要调用外部函数来获取信息 |
| 模型上下文协议 | MCP | AI 接入外部工具的标准化协议，AI 世界的"USB 接口" |
| 提示词工程 | Prompt Engineering | 通过优化提示词来引导 AI 行为的技巧/艺术 |
| 上下文窗口 | Context Window | LLM 单次处理的最大 token 数量（AI 的"短期记忆"容量）|
| 幻觉 | Hallucination | AI 自信地生成错误或捏造信息的现象 |
| 重排序 | Reranking | RAG 的进阶技术，用专门模型对候选文档做精确相关性排序 |
