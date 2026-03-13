# AI Chatbot 渐进式演练项目 — 施工手册

> **版本**: v2.0 | **日期**: 2026-03-13  
> **适用对象**: 课程制作团队  
> **核心任务**: 制作教学素材（参考代码 + 提示词模板 + 教案），而非成品APP

---

## 读前须知

> [!CAUTION]
> **这不是一个软件开发项目的施工手册。** 你们的任务不是做一个 chatbot 成品，而是制作一套教学素材，让学员能在讲师指导下，通过与 AI 编程助手（OpenCode）对话，**自己一步步把 chatbot 搭出来**。
> 
> 你们需要交付的是：
> 1. 每个阶段的**参考代码**（学员做对了应该长什么样）
> 2. 每个阶段的**提示词模板**（学员应该给 OpenCode 说什么）
> 3. **讲师教案**（讲师怎么带这个环节）

---

## 1. 工作流程

### 1.1 总体步骤

```
对于每个 Phase (1→6):
  ① 自己先用 OpenCode 对话把这个阶段做出来
  ② 记录你输入的每一条自然语言指令
  ③ 打磨这些指令，确保一个新手照着输入也能成功
  ④ 整理代码为参考答案
  ⑤ 编写讲师教案
  ⑥ 验证：找一个非技术人员测试，看能否跟着做出来
```

### 1.2 验收标准

**每个阶段的核心验收**：一个零基础的人，按提示词模板输入 OpenCode，生成的代码能**直接运行**并看到预期效果。

---

## 2. 环境准备

### 2.1 前置条件

```
Node.js >= 18
OpenCode 或 OpenClaw（已安装配置好）
硅基流动账号 + API Key
```

### 2.2 `.env` 标准模板

```env
# === LLM API 配置（OpenAI 兼容，可替换任意供应商） ===
LLM_API_KEY=sk-your-key-here
LLM_BASE_URL=https://api.siliconflow.cn/v1
LLM_DEFAULT_MODEL=deepseek-ai/DeepSeek-V3.2

# === 嵌入模型 ===
EMBEDDING_MODEL=BAAI/bge-m3

# === 重排序（进阶，可选） ===
RERANK_MODEL=BAAI/bge-reranker-v2-m3
RERANK_ENABLED=false

# === 服务 ===
PORT=3000
```

> [!IMPORTANT]
> 所有环境变量使用 `LLM_` 通用前缀，确保学员日后切换供应商只改 `.env`，不改代码。施工时请**严格遵守**这一点，不要在代码中硬编码任何供应商地址。

---

## 3. 各阶段施工指南

对于每个阶段，本手册提供：
- **学员提示词模板**：学员应该输入 OpenCode 的指令
- **关键技术要点**：AI 生成代码时需要注意的坑
- **验证检查清单**：怎么判断这一步做对了
- **参考架构**：做对了的代码大致长什么样

---

### Phase 1: 基础聊天

#### 学员提示词模板

**第一步（项目初始化）**：
```
帮我创建一个新的 Node.js 项目，项目名叫 aigc-chatbot，安装 express 
和 dotenv 依赖。创建一个 .env 文件，里面放 LLM_API_KEY、
LLM_BASE_URL（值为 https://api.siliconflow.cn/v1）、
LLM_DEFAULT_MODEL（值为 deepseek-ai/DeepSeek-V3.2）和 PORT=3000
```

**第二步（后端）**：
```
在 server.js 中创建一个 Express 服务器。它需要：
1) 提供 public 目录下的静态文件
2) 提供一个 POST /api/chat 接口，接收 messages 数组
3) 用流式方式调用 .env 中配置的 LLM API（LLM_BASE_URL、LLM_API_KEY、LLM_DEFAULT_MODEL）
4) 将 SSE 流转发给前端
5) 解析响应中的 usage 字段，在流结束后发送 token 用量数据
6) system prompt 设为 "你是一个友好的AI助手"
```

**第三步（前端）**：
```
在 public 目录下创建 index.html、style.css 和 app.js。做一个好看的
深色主题聊天界面：
- 顶部有标题"AI 聊天助手"和清空对话按钮
- 中间是消息区（用户消息右对齐蓝紫渐变，AI消息左对齐深灰）
- 底部有输入框和发送按钮（毛玻璃效果）
- 底部还有 Token 用量统计栏（显示输入/输出/累计 token 数）
- 支持流式逐字显示 AI 回复
- 支持 Markdown 渲染
```

#### 关键技术要点

| 要点 | 说明 |
|------|------|
| SSE 流转发 | 后端需设置 `Content-Type: text/event-stream` 等响应头 |
| Token 统计 | OpenAI 兼容 API 在流式最后一条 chunk 的 `usage` 字段返回数据 |
| API Key 安全 | API Key 只在后端使用，前端通过 `/api/chat` 代理访问 |
| ES Modules | `package.json` 中加 `"type": "module"` 以使用 `import` 语法 |

#### 验证检查清单

- [ ] `npm start` 运行无报错
- [ ] 浏览器打开 `localhost:3000` 显示聊天界面
- [ ] 输入"你好"，AI 有回复且逐字显示
- [ ] Token 统计栏显示了数字
- [ ] 点清空按钮，对话被清除

---

### Phase 2: 参数调优面板

#### 学员提示词模板

```
在聊天界面左侧添加一个可折叠的参数设置面板：
1) 模型选择下拉框（DeepSeek-V3.2 默认选中、Qwen2.5-7B 免费、DeepSeek-R1 推理模型）
2) temperature 滑块（0到2，步长0.1，默认0.7，旁边显示当前值）
3) top_p 滑块（0到1，步长0.1，默认0.9）
4) max_tokens 数字输入框（默认1024）
5) frequency_penalty 和 presence_penalty 滑块（-2到2，默认0）
6) system prompt 文本框（默认"你是一个友好的AI助手"）
7) 恢复默认按钮
每个参数旁边有简短中文说明。
发送消息时把这些参数带到后端。
修改后端 /api/chat 接口接收并使用这些参数。
```

#### 关键技术要点

| 要点 | 说明 |
|------|------|
| 参数透传 | 前端收集参数 → POST body 中传 `params` 对象 → 后端解构并传给 API |
| 类型转换 | 滑块返回字符串，需 `parseFloat()` / `parseInt()` |
| 模型显示名 | 下拉框 `value` 用 API 模型名，显示文本用友好名称 |

#### 验证检查清单

- [ ] 参数面板能展开/折叠
- [ ] 调 temperature=0 后多次提同一问题，回答几乎相同
- [ ] 调 temperature=1.5 后回答变得更随机
- [ ] 切换模型后回答风格有变化
- [ ] 修改 System Prompt 后 AI 行为改变

#### 教学活动建议

让学员做对比实验并记录：
- 同一问题（"讲个故事"），temperature 分别为 0 / 0.7 / 1.5
- 同一问题（"你好"），三种不同 System Prompt

---

### Phase 3: RAG 知识问答

#### 学员提示词模板（分步）

**步骤1 — 文档加载器**：
```
创建 rag/loader.js，实现 loadAndChunkDocuments 函数：
读取 oneflower 目录下所有 .txt 和 .md 文件，
按段落切分成500字左右的片段（保留100字重叠），
返回 [{content, source, index}] 数组
```

**步骤2 — 嵌入模块**：
```
创建 rag/embeddings.js，实现 getEmbeddings 函数：
调用 .env 中配置的 EMBEDDING_MODEL 嵌入模型（通过 LLM_BASE_URL 和 LLM_API_KEY），
接收文本或文本数组，返回向量数组
```

**步骤3 — 向量存储**：
```
创建 rag/vectorstore.js，实现：
- buildIndex：批量生成向量并存为 vectorstore.json
- search：用余弦相似度检索最相关的 top-3 片段
```

**步骤4 — 后端集成**：
```
修改 server.js：
1) 新增 POST /api/rag/build-index 接口触发索引构建
2) 修改 /api/chat 接口，新增 ragEnabled 参数，
   开启时自动检索知识库并将文档片段注入 system prompt
```

**步骤5 — 前端**：
```
修改前端：
1) 添加"知识库模式"开关
2) 添加"构建索引"按钮
3) AI 回复下方可展开显示参考来源和相似度分数
```

**[进阶] 步骤6 — 重排序**：
```
创建 rag/reranker.js，实现重排序功能：
调用 .env 中 RERANK_MODEL 的 /rerank 接口，
接收 query 和 documents 数组，返回按相关性排序的结果。
如果 RERANK_ENABLED 不为 true 则返回 null。
修改 search 函数：先粗检索 Top-10，再重排序精排出 Top-3。
前端添加"启用重排序"开关，标注为进阶功能。
```

#### 关键技术要点

| 要点 | 说明 |
|------|------|
| 嵌入 API | `POST /embeddings`，body 中传 `model` 和 `input` |
| 批量处理 | 文档片段多时需分批调用嵌入 API（每批 10 条） |
| RAG 本质 | 就是把检索到的文档片段拼进 System Prompt |
| 向量存储 | 用 JSON 文件即可，不需要向量数据库 |
| 重排序 API | `POST /rerank`，传 `query` + `documents` + `top_n` |

#### 验证检查清单

- [ ] 点"构建索引"成功，控制台显示片段数
- [ ] 开启知识库模式，问"易速鲜花的退换货政策"，回答引用了文档内容
- [ ] 关闭知识库模式，同样问题，AI 回答"不了解"
- [ ] 参考来源区域正确显示了引用的文档片段
- [ ] [进阶] 开启重排序后，检索结果排序变化

---

### Phase 4: API 对接 — 天气查询

#### 学员提示词模板

```
添加天气查询功能：
1) 创建 tools/weather.js，封装 wttr.in API
   （URL: https://wttr.in/{city}?format=j1），
   返回温度、体感温度、天气描述、湿度、风速
2) 修改 server.js 支持 Function Calling：
   - 定义 get_weather 工具（JSON Schema 描述）
   - 第一次调用 LLM 判断是否需要工具（非流式）
   - 如果需要工具，执行天气查询，将结果返回给 LLM
   - 第二次调用 LLM 生成最终回复（流式）
   - 如果不需要工具，直接流式回复
3) 前端：检测到天气数据时渲染天气卡片组件
```

#### 关键技术要点

| 要点 | 说明 |
|------|------|
| 两次调用 | 第一次非流式（判断工具） → 执行工具 → 第二次流式（最终回答） |
| finish_reason | 当 LLM 返回 `finish_reason: "tool_calls"` 时表示需要调用工具 |
| 分支处理 | 不需要工具时走原来的流式路径，需要工具时走两次调用 |
| wttr.in | 免费、不需 API Key、返回 JSON |

#### 验证检查清单

- [ ] 问"北京天气"，返回真实天气数据
- [ ] 问"写首诗"，正常聊天（不会调用天气工具）
- [ ] 天气信息以卡片形式展示

---

### Phase 5: MCP 对接 — 新闻阅读

#### 学员提示词模板

```
接入 MCP 新闻功能：
1) 安装 @modelcontextprotocol/sdk
2) 创建 mcp/mcp-config.json 配置 RSS MCP Server（用 feed-mcp）
3) 创建 tools/news.js 封装 MCP Client：
   - 初始化 StdioClientTransport 连接到 feed-mcp
   - 实现 getNews 函数获取 RSS 新闻条目
4) 在 server.js 工具列表中添加 get_news 工具，
   根据话题选择合适的 RSS 源
5) 前端添加新闻列表卡片渲染
```

#### 关键技术要点

| 要点 | 说明 |
|------|------|
| MCP SDK | `npm install @modelcontextprotocol/sdk` |
| 进程管理 | MCP Server 通过 stdio 通信，需管理子进程生命周期 |
| RSS 源 | 预配置几个可用的（如 hnrss.org），避免源不可用 |
| 工具名称 | 需根据实际 MCP Server 文档确认工具名称和参数 |

> [!WARNING]
> MCP 生态变化快，施工时需实际验证 `feed-mcp` 的最新版本和接口。如果不可用，准备备选方案（如 `mcp-rss-news-agent`）。

#### 验证检查清单

- [ ] MCP Server 成功启动（控制台无报错）
- [ ] 问"今天有什么新闻"，返回新闻条目
- [ ] 天气和新闻功能可以共存

---

### Phase 6: 搜索引擎 — DuckDuckGo

#### 学员提示词模板

```
添加 DuckDuckGo 搜索功能：
1) 创建 tools/search.js，封装 DuckDuckGo Instant Answer API
   （URL: https://api.duckduckgo.com/?q={query}&format=json&no_html=1），
   提取 abstract、heading、relatedTopics、answer、definition
2) 在 server.js 工具列表中添加 search_web 工具，
   描述为"搜索互联网获取信息，当用户的问题需要最新或外部信息
   且其他工具无法满足时调用"
3) 测试多工具场景，确保天气、新闻、搜索、RAG 能正确分派
```

#### 关键技术要点

| 要点 | 说明 |
|------|------|
| 工具描述区分度 | 每个工具的 `description` 要写得足够有区分度，AI 才能正确选择 |
| DuckDuckGo 限制 | 只返回摘要/定义，非完整搜索结果列表 |
| 多工具测试 | 需测试各种问题类型，确保工具选择正确 |

#### 验证检查清单

- [ ] 问"什么是量子计算"，触发搜索工具
- [ ] 问"北京天气"仍正确触发天气工具
- [ ] 问"今天新闻"仍正确触发新闻工具
- [ ] 开启 RAG 问"鲜花保养"，走知识库
- [ ] 问"写首诗"，不调用任何工具

---

## 4. 代码管理

### 4.1 分支/标签策略

```
git tag phase-1-basic-chat
git tag phase-2-param-tuning
git tag phase-3-rag
git tag phase-4-weather-api
git tag phase-5-mcp-news
git tag phase-6-duckduckgo
```

### 4.2 原则

- 每个 Phase 完成后打标签
- 每个标签对应一个**独立可运行**的状态
- Phase N+1 必须在 Phase N 的代码基础上**增量添加**
- 不重构前一阶段代码

---

## 5. 讲师教案编写指南

每阶段教案应包含：

| 环节 | 内容 | 时长 |
|------|------|------|
| **开场演示** | 直接展示本阶段完成后的效果，激发兴趣 | 2分钟 |
| **概念讲解** | 用类比和图示讲解核心概念（参见教科书） | 10分钟 |
| **带练示范** | 讲师在 OpenCode 中输入提示词，现场生成代码 | 5分钟 |
| **学员实操** | 学员按教科书指引自己操作 | 20-30分钟 |
| **验证答疑** | 学员展示结果，集中解答问题 | 10分钟 |

### 常见问题预案

| 问题 | 应对 |
|------|------|
| AI 生成的代码报错 | 让学员把报错信息粘贴给 OpenCode，说"帮我修" |
| 生成的代码跟参考不一样 | 正常现象！只要能运行且功能正确就对了 |
| API Key 无效 | 重新去硅基流动控制台创建密钥 |
| 端口被占用 | `PORT=3001` 或关掉占用进程 |
| 某个 npm 包安装失败 | 检查网络，或用 `npm config set registry https://registry.npmmirror.com` |

---

## 6. 提示词模板整理规范

每个提示词模板需要标注：

```markdown
🟢 零代码路径（给 OpenCode 的指令）：
   [自然语言指令]

🔵 代码路径（手写）：
   [关键代码或指向参考代码的说明]

✅ 验证方式：
   [怎么确认这一步做对了]

🔧 常见问题：
   [这一步容易踩的坑和解决方法]
```
