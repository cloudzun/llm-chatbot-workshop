# AI Chatbot 演练 — 提示词模板全集

> **版本**: v1.0 | **适用工具**: OpenCode / OpenClaw  
> **使用说明**: 每条提示词独立输入，等 AI 完成后再输入下一条。遇到报错，把报错信息粘贴给 AI 说「帮我修这个错误」。

---

## 使用前检查清单

在开始任何阶段前，确认：
- [ ] 已安装 Node.js 18+（命令行运行 `node -v` 验证）
- [ ] 已安装 OpenCode 或 OpenClaw
- [ ] 已有硅基流动 API Key（https://siliconflow.cn）

---

## Phase 1：基础聊天

### 🟢 第 1 步：项目初始化

```
帮我创建一个新的 Node.js 项目，要求：
1. 项目目录名叫 aigc-chatbot
2. 安装 express 和 dotenv 两个依赖包
3. package.json 中加入 "type": "module"（使用 ES Modules 语法）
4. 创建 .env 文件，内容如下：
   LLM_API_KEY=sk-你的密钥填在这里
   LLM_BASE_URL=https://api.siliconflow.cn/v1
   LLM_DEFAULT_MODEL=deepseek-ai/DeepSeek-V3.2
   PORT=3000
5. 创建 .gitignore，忽略 node_modules 和 .env
```

✅ **验证方式**：目录下有 `package.json`、`.env`、`node_modules/`，运行 `cat package.json` 能看到 `"type": "module"`

🔧 **常见问题**：
- *AI 没有创建 node_modules*：手动运行 `npm install`
- *找不到 aigc-chatbot 目录*：用 `ls` 或在文件管理器中查找

---

### 🟢 第 2 步：创建后端

```
在 aigc-chatbot 目录下创建 server.js，实现一个 Express 后端服务器：

1. 使用 ES Modules 语法（import/export）
2. 从 dotenv 读取环境变量（LLM_API_KEY、LLM_BASE_URL、LLM_DEFAULT_MODEL、PORT）
3. 提供 public 目录下的静态文件
4. 创建 POST /api/chat 接口：
   - 接收请求体 { messages: [{role, content}, ...] }
   - 设置 SSE 响应头：Content-Type: text/event-stream，Cache-Control: no-cache，Connection: keep-alive
   - 调用 LLM API（LLM_BASE_URL + /chat/completions），使用 Bearer 认证
   - 在 messages 前加一条 system 消息："你是一个友好的AI助手。"
   - 开启流式输出（stream: true）和 stream_options: { include_usage: true }
   - 将 API 返回的 SSE 流原样转发给前端
   - 解析每行 data: 中的 JSON，如果有 usage 字段则记录下来
   - 流结束后，额外发送一条 data: 包含 { type: "usage", usage: {...} }
5. 监听 PORT，启动后打印提示信息
```

✅ **验证方式**：运行 `node server.js`，看到「服务已启动: http://localhost:3000」（此时前端还没有，访问会显示空页面）

🔧 **常见问题**：
- *SyntaxError: Cannot use import*：检查 package.json 是否有 `"type": "module"`
- *Error: Cannot find module 'express'*：运行 `npm install express dotenv`
- *EADDRINUSE port 3000*：改 .env 中 PORT=3001，或关闭已有进程

---

### 🟢 第 3 步：创建前端

```
在 aigc-chatbot/public 目录下创建 index.html、style.css、app.js，做一个聊天界面：

index.html 要求：
- 深色主题（背景 #0d1117）
- 顶部区域：左边"AI 聊天助手"标题，右边「清空对话」按钮
- 中间消息区：可滚动，用于显示聊天消息
- 底部输入区：文本输入框（支持 Enter 发送）+ 发送按钮（毛玻璃效果）
- 底部状态栏：显示「输入 Token: X | 输出 Token: X | 累计 Token: X」
- 引入 CDN 的 marked.js（Markdown 渲染）和 highlight.js（代码高亮）

style.css 要求：
- 用户消息：右对齐，蓝紫渐变背景（#4facfe → #00f2fe）
- AI 消息：左对齐，深灰背景（#1e2333），有浅灰圆角边框
- AI 消息正在输出时显示闪烁光标动画
- 按钮和输入框有 hover 效果

app.js 要求：
- 发送消息后，立即在界面显示用户消息
- 发送 POST 请求到 /api/chat，传入 messages 数组
- 用 ReadableStream 读取 SSE 响应，逐块解析
- AI 回复逐字追加到消息气泡中（流式效果）
- 解析到 { type: "usage" } 时更新页面底部 Token 统计
- 发送时禁用发送按钮，收到回复后恢复
- 维护对话历史（messages 数组），支持多轮对话
- 用 marked.js 渲染最终的 AI 回复内容（Markdown 格式）
- 清空按钮清除对话历史和界面消息
```

✅ **验证方式**：
1. 刷新 http://localhost:3000，看到聊天界面
2. 输入「你好」，看到 AI 逐字回复
3. 底部 Token 数字更新

🔧 **常见问题**：
- *界面空白*：检查 `express.static('public')` 中的路径
- *AI 没有逐字效果*：检查 SSE 解析逻辑，确认用 `ReadableStream` 而非 `response.json()`
- *Token 不显示*：检查是否正确解析了 `{ type: "usage" }` 事件

---

## Phase 2：参数调优面板

### 🟢 提示词（一次完成）

```
修改 aigc-chatbot 项目，在聊天界面添加一个参数设置面板：

前端修改（public/index.html 和 style.css）：
1. 在聊天区左侧添加一个可折叠侧边栏，有展开/折叠按钮
2. 侧边栏包含以下控件，每项旁边有简短中文说明：
   - 模型选择下拉框：三个选项
     * DeepSeek-V3.2（默认选中，value=deepseek-ai/DeepSeek-V3.2）
     * Qwen2.5-7B免费（value=Qwen/Qwen2.5-7B-Instruct）
     * DeepSeek-R1推理（value=deepseek-ai/DeepSeek-R1）
   - Temperature 滑块：范围 0-2，步长 0.1，默认 0.7，旁边显示当前值
   - Top-P 滑块：范围 0-1，步长 0.05，默认 0.9，旁边显示当前值
   - Max Tokens 数字输入：默认 1024
   - Frequency Penalty 滑块：范围 -2 到 2，步长 0.1，默认 0
   - Presence Penalty 滑块：范围 -2 到 2，步长 0.1，默认 0
   - System Prompt 多行文本框：默认"你是一个友好的AI助手。"
   - 「恢复默认」按钮
3. 滑块值实时更新旁边的数字显示

前端修改（public/app.js）：
- 发送消息时，从侧边栏收集所有参数，组成 params 对象
- POST body 改为 { messages, params }

后端修改（server.js）：
- /api/chat 接口改为接收 { messages, params }
- 从 params 解构：model, temperature, top_p, max_tokens, frequency_penalty, presence_penalty, system_prompt（每项有默认值）
- 调用 LLM 时使用这些参数（注意 parseFloat 和 parseInt 类型转换）
```

✅ **验证方式**：
1. 参数面板能展开/折叠
2. 连续问同一问题：temperature=0 时答案稳定，temperature=1.5 时每次不同
3. 修改 system prompt 为「你是一位海盗，说话要像海盗」，再发消息，AI 语气变化

🔧 **常见问题**：
- *滑块值不更新*：确认有 `oninput` 事件监听器更新旁边的 `<span>`
- *参数不生效*：在后端加 `console.log(params)` 检查是否正确接收到

---

## Phase 3：RAG 知识问答

### 🟢 第 1 步：文档加载器

```
在 aigc-chatbot/rag 目录下创建 loader.js：

实现并导出 loadAndChunkDocuments(dirPath) 函数：
1. 读取 dirPath 目录下所有 .txt、.md、.json、.csv 文件
2. 对每个文件内容，按空行（两个或以上换行）切分为段落
3. 如果某段落超过 500 字，按句号/换行强制切分
4. 相邻片段保留约 100 字的重叠（把前一片段的最后 100 字加到当前片段开头）
5. 每个片段格式：{ content: "...", source: "文件名", index: 序号 }
6. 过滤掉少于 30 字的片段
7. 返回片段数组
```

✅ **验证方式**：在项目根目录运行以下测试代码：
```javascript
import { loadAndChunkDocuments } from './rag/loader.js';
const chunks = loadAndChunkDocuments('./OneFlower/OneFlower');
console.log(`共 ${chunks.length} 个片段`);
console.log(chunks[0]);
```

---

### 🟢 第 2 步：嵌入模块

```
在 aigc-chatbot/rag 目录下创建 embeddings.js：

实现并导出 getEmbeddings(texts) 函数：
1. 接收字符串或字符串数组 texts
2. 调用 process.env.LLM_BASE_URL + /embeddings 接口
3. 请求体：{ model: process.env.EMBEDDING_MODEL, input: texts }
4. Headers：Authorization: Bearer process.env.LLM_API_KEY
5. 解析响应，按 index 排序后返回向量数组（每个向量是 number[]）
6. 确保 .env 中有 EMBEDDING_MODEL=BAAI/bge-m3
```

---

### 🟢 第 3 步：向量存储

```
在 aigc-chatbot/rag 目录下创建 vectorstore.js：

实现并导出两个函数：

buildIndex(chunks)：
1. 将 chunks 分批（每批 8 个）调用 getEmbeddings 生成向量
2. 将 { chunk, vector } 数组写入 rag/vectorstore.json 文件

search(query, topK=3, rerankEnabled=false)：
1. 对 query 调用 getEmbeddings 得到查询向量
2. 读取 rag/vectorstore.json
3. 用余弦相似度（点积/（模长×模长））计算每个片段与 query 的相似度
4. 按相似度降序排列，取前 topK
5. 如果 rerankEnabled=true 且存在 reranker.js，调用重排序后返回
6. 返回 [{ chunk, score }, ...] 格式
```

---

### 🟢 第 4 步：后端集成

```
修改 aigc-chatbot/server.js，添加 RAG 功能：

1. 新增路由 POST /api/rag/build-index：
   - 调用 loader.js 加载 process.env.KNOWLEDGE_DIR 目录下的文档（默认 ./OneFlower/OneFlower）
   - 调用 vectorstore.js 的 buildIndex 构建索引
   - 返回 { success: true, count: 片段数量 }

2. 修改 POST /api/chat，新增 ragEnabled 参数：
   - 请求体改为 { messages, params, ragEnabled }
   - 当 ragEnabled=true 时：
     a. 取最后一条 user 消息作为查询
     b. 调用 search 获取 Top-3 相关片段
     c. 将片段内容拼入 system_prompt（格式自定）
   - 在流开始前，先发送一条 SSE 事件：{ type: "metadata", ragSources: [...] }
   - 将检索到的来源信息附在 ragSources 中（包含 score 和 source）
```

---

### 🟢 第 5 步：前端集成

```
修改 aigc-chatbot/public 下的前端文件，添加 RAG 界面：

index.html / style.css：
1. 在顶部工具栏添加「🔍 知识库模式」开关（toggle）
2. 旁边添加「构建索引」按钮
3. AI 消息下方，如果有 ragSources，显示可折叠的「参考来源」区域：
   - 每条来源显示：文件名 + 相似度分数 + 前50字内容预览
   - 使用 details/summary 折叠组件
4. [进阶] 添加「启用重排序」开关，标注「(进阶)」

app.js：
1. 发送时，将 ragEnabled（开关状态）加入 POST body
2. 解析 SSE 中 { type: "metadata" } 事件，提取 ragSources
3. 在 AI 消息气泡下方渲染来源区域
4. 构建索引按钮点击时，POST /api/rag/build-index，显示结果
```

✅ **验证方式**：
1. 点「构建索引」，显示「索引构建成功，共 X 个片段」
2. 开启知识库模式，问「易速鲜花有哪些鲜花产品？」，回答引用文档内容
3. 关闭知识库模式，同样问题，AI 说不确定
4. 消息下方显示参考来源区域

---

## Phase 4：Function Calling — 天气查询

### 🟢 提示词（推荐分两步）

**第 1 步：创建天气工具**

```
在 aigc-chatbot/tools 目录下创建 weather.js：

实现并导出 getWeather(city) 函数：
1. 调用 https://wttr.in/{city}?format=j1 获取天气数据（GET 请求，不需要 API Key）
2. 从响应 JSON 中提取：
   - temp_C（当前温度）
   - FeelsLikeC（体感温度）
   - weatherDesc[0].value（天气描述）
   - humidity（湿度）
   - windspeedKmph（风速）
3. 返回 { city, temperature, feelsLike, description, humidity, windSpeed } 对象
4. 如果请求失败，抛出包含错误信息的 Error
```

**第 2 步：集成到后端**

```
修改 aigc-chatbot/server.js，添加 Function Calling 支持：

1. 在文件顶部定义 tools 数组，包含一个 get_weather 工具：
   - type: "function"
   - name: "get_weather"
   - description: "获取指定城市的当前天气信息。当用户询问天气、温度、气候相关问题时调用。"
   - parameters: 包含 city 字段（string 类型），city 为必填

2. 定义 toolHandlers 对象：{ get_weather: async (args) => getWeather(args.city) }

3. 修改 POST /api/chat 的 LLM 调用逻辑，改为流式工具检测模式：
   第一次流式请求（含 tools 定义和 tool_choice: "auto"）：
   - 逐行读取 SSE 流
   - 检测 delta.tool_calls，如果有则累积工具名和参数（注意分片拼接）
   - 如果没有 tool_calls，直接将内容 delta 转发给前端（纯聊天路径）
   
   如果检测到 tool_calls：
   a. 先发送 SSE 事件 { type: "metadata", toolCalls: [...] } 通知前端
   b. 执行工具：根据工具名调用 toolHandlers 中对应的函数
   c. 第二次流式请求：messages 附加 assistant 的 tool_calls 消息 + tool 结果消息
   d. 将第二次流式响应转发给前端

4. 注意：前端不需要改动，只要后端 metadata 事件格式正确即可

前端补充（可选，让天气数据更直观）：
修改 public/app.js，解析 { type: "metadata", toolCalls: [...] }，
当 toolCalls 中有 get_weather 工具且结果包含温度数据时，
在 AI 消息气泡前渲染一个天气卡片（显示城市、温度、天气描述、图标）
```

✅ **验证方式**：
1. 问「上海今天天气如何」，看到包含实时温度的回复
2. 问「推荐一首古诗」，正常聊天不触发天气工具
3. （可选）天气数据以卡片形式展示在消息上方

🔧 **常见问题**：
- *工具参数为空*：检查 LLM streaming 中对 `tool_calls` 的分片拼接逻辑
- *第二次请求报错*：确认 `tool_call_id` 与 `assistant` 消息中的 `id` 一致
- *wttr.in 超时*：换城市重试，或临时写一个 mock 函数测试

---

## Phase 5：MCP 对接 — 新闻阅读

### 🟢 提示词（推荐分两步）

**第 1 步：创建 MCP 新闻工具**

```
在 aigc-chatbot 项目中接入 MCP 新闻功能：

1. 安装依赖：npm install @modelcontextprotocol/sdk

2. 创建 mcp/mcp-config.json：
   {
     "mcpServers": {
       "rss-news": {
         "command": "npx",
         "args": ["-y", "feed-mcp@latest"]
       }
     }
   }

3. 创建 tools/news.js，实现并导出 getNews(topic) 函数：
   - 使用 MCP SDK 的 Client 和 StdioClientTransport
   - 连接到 feed-mcp（通过 npx 启动）
   - 调用工具获取 RSS 新闻（先用 list tools 查看 feed-mcp 暴露的工具名称）
   - 根据 topic 参数选择 RSS 源：
     * tech: https://hnrss.org/frontpage
     * finance: https://feeds.finance.yahoo.com/rss/2.0/headline
     * world, general: https://feeds.bbci.co.uk/news/world/rss.xml
   - 返回新闻条目数组：[{ title, link, pubDate, summary }]
   - 添加备用方案：如果 MCP 连接失败，直接 fetch RSS XML 并用正则提取标题
```

**第 2 步：集成到工具列表**

```
修改 aigc-chatbot/server.js，将新闻工具加入工具列表：

1. 导入 getNews 函数
2. 在 tools 数组中添加 get_news 工具：
   - name: "get_news"
   - description: "获取最新新闻资讯。当用户询问新闻、热点、最新消息、发生了什么时调用。"
   - parameters: topic 字段（可选值：tech/general/finance/world）

3. 在 toolHandlers 中添加：get_news: async (args) => getNews(args.topic || 'general')

（其余逻辑不变，复用 Phase 4 已有的工具调用流程）

前端补充（可选）：
修改 public/app.js，当 toolCalls 中有 get_news 工具结果时，
渲染新闻列表卡片（每条新闻显示标题和链接）
```

✅ **验证方式**：
1. 问「今天有什么科技新闻」，返回新闻条目（非空）
2. 问「北京天气」，仍然触发天气工具（两个工具共存）
3. 问「写首诗」，不触发任何工具

🔧 **常见问题**：
- *feed-mcp 工具名不对*：在 getNews 函数里先打印 `await client.listTools()` 查看实际名称
- *子进程权限报错*：在 mcp-config.json 中尝试用完整路径替代 `npx`
- *RSS 源超时*：备用方案使用 `hnrss.org/frontpage`，通常最稳定

---

## Phase 6：DuckDuckGo 搜索 + 多工具编排

### 🟢 提示词（一次完成）

```
在 aigc-chatbot 项目中添加 DuckDuckGo 搜索工具：

1. 创建 tools/search.js，实现并导出 searchDuckDuckGo(query) 函数：
   - 调用 https://api.duckduckgo.com/?q={encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1
   - 从响应中提取：Abstract、Heading、RelatedTopics（前5条的Text）、Answer、Definition
   - 过滤空字段，返回 { heading, abstract, answer, definition, relatedTopics } 对象

2. 修改 server.js，在工具列表中添加 search_web：
   - name: "search_web"  
   - description: "搜索互联网获取信息。当用户的问题需要最新或外部实时信息，
     且天气工具和新闻工具均无法满足时调用。适合查询：定义、概念解释、
     特定事件、人物/组织介绍等。不适合用于聊天对话。"
   - parameters: query 字段（string，搜索关键词）
   
3. 在 toolHandlers 中添加：search_web: async (args) => searchDuckDuckGo(args.query)

最后，测试多工具分派准确性：
- "北京天气" → 应调用 get_weather
- "今天新闻" → 应调用 get_news  
- "什么是量子纠缠" → 应调用 search_web
- "写一首关于月亮的诗" → 不调用工具
```

✅ **验证方式**（完整四工具测试矩阵）：

| 测试问题 | 期望工具 | 通过？ |
|---------|---------|-------|
| 「深圳今天天气」 | get_weather | |
| 「今日财经新闻」 | get_news | |
| 「ChatGPT 是什么」 | search_web | |
| 「帮我写一首短诗」 | （无工具，直接回复）| |
| 「易速鲜花如何保鲜」（开启RAG） | RAG 检索 | |

🔧 **常见问题**：
- *工具选择混乱*：检查各工具 description 是否有足够区分度，优化描述文字
- *DuckDuckGo 返回空*：某些查询词 DDG 没有结果，换更通用的关键词测试
- *多工具互相干扰*：确认 tools 数组中每个工具的 name 唯一

---

## 附录：常用修复提示词

### 修复错误
```
我在运行项目时遇到了这个错误：

[粘贴完整错误信息]

请帮我修复这个问题。相关文件是 [文件名]。
```

### 修复样式
```
我的聊天界面有以下问题：[描述问题]
请修改 public/style.css 和/或 public/index.html 来修复它。
不要改动 app.js 和 server.js。
```

### 添加 console.log 调试
```
我需要调试 /api/chat 接口，请在 server.js 中添加适当的 console.log，
打印出：收到的请求体、调用 LLM 前的 messages 数组、以及工具调用结果。
调试完成后我会让你删除这些日志。
```

### 代码解释
```
请解释 server.js 中以下这段代码的作用，用简单的中文说明，
不需要写新代码：

[粘贴代码片段]
```
