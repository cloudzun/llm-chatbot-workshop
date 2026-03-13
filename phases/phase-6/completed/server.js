/**
 * server.js — AIGC Chatbot 后端主文件
 * 包含 Phase 1~6 全部功能：
 *   Phase 1: 基础聊天（SSE 流式输出 + Token 统计）
 *   Phase 2: 参数调优（temperature / top_p / model 等）
 *   Phase 3: RAG 知识问答（向量检索 + 可选重排序）
 *   Phase 4: Function Calling — 天气查询（wttr.in）
 *   Phase 5: MCP 对接 — 新闻阅读（RSS via feed-mcp）
 *   Phase 6: DuckDuckGo 搜索
 */

import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, normalize, resolve } from 'path';
import { readdir, stat, access } from 'fs/promises';

config();

import { loadAndChunkDocuments } from './rag/loader.js';
import { buildIndex, search } from './rag/vectorstore.js';
import { getWeather } from './tools/weather.js';
import { searchDuckDuckGo } from './tools/search.js';
import { getNews } from './tools/news.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(join(__dirname, 'public')));

// ─── 工具定义（Phase 4/5/6）─────────────────────────────────────────────────

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: '获取指定城市的当前天气信息。当用户询问天气、温度、气候相关问题时调用。',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: '城市名称，使用英文，如 Beijing、Shanghai、Shenzhen'
          }
        },
        required: ['city']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_news',
      description: '获取最新新闻资讯。当用户询问新闻、热点、最新消息、发生了什么时调用。',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: '新闻主题，可选值：tech（科技）、general（综合）、finance（财经）、world（国际）'
          }
        },
        required: ['topic']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: '搜索互联网获取信息。当用户问题需要最新或外部实时信息，且天气/新闻工具无法满足时调用。',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '搜索关键词，简洁精准'
          }
        },
        required: ['query']
      }
    }
  }
];

const toolHandlers = {
  get_weather: async (args) => {
    try {
      return await getWeather(args.city);
    } catch (e) {
      return { error: `天气查询失败: ${e.message}` };
    }
  },
  get_news: async (args) => {
    try {
      return await getNews(args.topic || 'general');
    } catch (e) {
      return { error: `新闻获取失败: ${e.message}` };
    }
  },
  search_web: async (args) => {
    try {
      return await searchDuckDuckGo(args.query);
    } catch (e) {
      return { error: `搜索失败: ${e.message}` };
    }
  }
};

// ─── RAG 索引构建接口（Phase 3）─────────────────────────────────────────────

let currentKnowledgeDir = null;

app.post('/api/rag/build-index', async (req, res) => {
  const dir = currentKnowledgeDir
    || (process.env.KNOWLEDGE_DIR ? resolve(process.env.KNOWLEDGE_DIR) : null)
    || join(__dirname, '..', 'OneFlower', 'OneFlower');
  try {
    const chunks = await loadAndChunkDocuments(dir);
    if (chunks.length === 0) {
      return res.status(400).json({ error: `目录 "${dir}" 中未找到可读文档` });
    }
    await buildIndex(chunks);
    res.json({ success: true, count: chunks.length, dir });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── RAG 目录浏览接口 ────────────────────────────────────────────

app.get('/api/rag/list-folders', async (req, res) => {
  try {
    const requestPath = req.query.path || '';
    if (!requestPath) {
      const drives = [];
      for (let i = 65; i <= 90; i++) {
        const drive = String.fromCharCode(i) + ':\\';
        try { await stat(drive); drives.push(drive); } catch {}
      }
      return res.json({ currentPath: '', parentPath: '', canGoUp: false,
        folders: drives.map(d => ({ name: d, path: d })) });
    }
    const normalizedPath = normalize(requestPath);
    const entries = await readdir(normalizedPath, { withFileTypes: true });
    const folders = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('$'))
      .map(e => ({ name: e.name, path: join(normalizedPath, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh'));
    const parentPath = normalize(join(normalizedPath, '..'));
    const isRoot = parentPath === normalizedPath;
    res.json({ currentPath: normalizedPath, parentPath: isRoot ? '' : parentPath,
      canGoUp: !isRoot, folders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rag/set-knowledge-dir', async (req, res) => {
  try {
    const { path: dirPath } = req.body;
    if (!dirPath) return res.status(400).json({ error: '请提供路径' });
    await access(dirPath);
    currentKnowledgeDir = dirPath;
    res.json({ success: true, path: dirPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 主聊天接口（Phase 1～6）────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { messages, params = {}, ragEnabled = false } = req.body;

  const {
    model = process.env.LLM_DEFAULT_MODEL,
    temperature = 0.7,
    top_p = 0.9,
    max_tokens = 1024,
    frequency_penalty = 0,
    presence_penalty = 0,
    system_prompt = '你是一个友好的AI助手。',
    rerankEnabled = false
  } = params;

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    // ── Phase 3: RAG 检索 ──────────────────────────────────────────────────
    let systemContent = system_prompt;
    let ragSources = [];

    if (ragEnabled) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        try {
          const results = await search(lastUserMsg.content, 3, rerankEnabled);
          ragSources = results;
          if (results.length > 0) {
            const context = results
              .map((r, i) => `[片段${i + 1} | 来源: ${r.chunk.source} | 相似度: ${r.score.toFixed(3)}]\n${r.chunk.content}`)
              .join('\n\n---\n\n');
            systemContent +=
              `\n\n请基于以下知识库内容回答用户问题。如果知识库中没有相关信息，请如实说明，不要编造。\n\n【知识库内容】\n${context}`;
          }
        } catch (e) {
          console.error('RAG search error:', e.message);
        }
      }
    }

    const builtMessages = [
      { role: 'system', content: systemContent },
      ...messages
    ];

    const baseRequestBody = {
      model,
      temperature: parseFloat(temperature),
      top_p: parseFloat(top_p),
      max_tokens: parseInt(max_tokens),
      frequency_penalty: parseFloat(frequency_penalty),
      presence_penalty: parseFloat(presence_penalty)
    };

    const llmHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LLM_API_KEY}`
    };

    // ── Phase 4/5/6: 流式请求含工具检测 ─────────────────────────────────────
    // 策略：
    //   单次流式请求，检测 delta.tool_calls。
    //   若有 tool_calls → 累积工具调用后执行，再发起第二次流式请求。
    //   若无 tool_calls → 直接将内容流转发给客户端（零额外延迟）。

    const firstStreamResp = await fetch(
      `${process.env.LLM_BASE_URL}/chat/completions`,
      {
        method: 'POST',
        headers: llmHeaders,
        body: JSON.stringify({
          ...baseRequestBody,
          messages: builtMessages,
          tools,
          tool_choice: 'auto',
          stream: true,
          stream_options: { include_usage: true }
        })
      }
    );

    if (!firstStreamResp.ok) {
      const errText = await firstStreamResp.text();
      sendEvent({ error: `LLM API 错误 (${firstStreamResp.status}): ${errText.slice(0, 300)}` });
      res.end();
      return;
    }

    const reader = firstStreamResp.body.getReader();
    const decoder = new TextDecoder();

    // 工具调用状态
    const toolCallsMap = {};  // index → { id, function: { name, arguments } }
    let hasToolCalls = false;
    let contentStarted = false;
    let finishReason = null;
    let usageData = null;

    // 读取第一次流
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const rawChunk = decoder.decode(value, { stream: true });
      const lines = rawChunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        if (line === 'data: [DONE]') continue;

        let data;
        try {
          data = JSON.parse(line.slice(6));
        } catch {
          continue;
        }

        if (data.usage) usageData = data.usage;

        const choice = data.choices?.[0];
        if (!choice) continue;

        if (choice.finish_reason) finishReason = choice.finish_reason;

        const delta = choice.delta;
        if (!delta) continue;

        if (delta.tool_calls) {
          // ── 工具调用路径：累积，不写给客户端 ──
          hasToolCalls = true;
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallsMap[idx]) {
              toolCallsMap[idx] = { id: '', type: 'function', function: { name: '', arguments: '' } };
            }
            if (tc.id) toolCallsMap[idx].id = tc.id;
            if (tc.function?.name) toolCallsMap[idx].function.name += tc.function.name;
            if (tc.function?.arguments) toolCallsMap[idx].function.arguments += tc.function.arguments;
          }
        } else if (delta.content !== undefined && delta.content !== null && delta.content !== '') {
          // ── 普通内容路径：直接转发给客户端 ──
          if (!contentStarted && ragSources.length > 0) {
            // 在第一个内容块前推送 RAG 元数据
            sendEvent({
              type: 'metadata',
              ragSources: ragSources.map(r => ({
                source: r.chunk.source,
                score: r.score,
                preview: r.chunk.content.slice(0, 200)
              })),
              toolCalls: []
            });
          }
          contentStarted = true;
          res.write(`${line}\n\n`);
        }
      }
    }

    // ── 处理工具调用分支 ────────────────────────────────────────────────────
    if (hasToolCalls && Object.keys(toolCallsMap).length > 0) {
      const toolCallsList = Object.values(toolCallsMap);

      // 执行工具
      const toolResults = [];
      for (const tc of toolCallsList) {
        const handler = toolHandlers[tc.function.name];
        let result;
        try {
          const args = JSON.parse(tc.function.arguments || '{}');
          result = handler ? await handler(args) : { error: `未知工具: ${tc.function.name}` };
        } catch (e) {
          result = { error: e.message };
        }
        toolResults.push({
          tool_call_id: tc.id,
          name: tc.function.name,
          result
        });
      }

      // 向前端推送工具调用元数据
      sendEvent({
        type: 'metadata',
        ragSources: ragSources.map(r => ({
          source: r.chunk.source,
          score: r.score,
          preview: r.chunk.content.slice(0, 200)
        })),
        toolCalls: toolResults.map(t => ({ name: t.name, result: t.result }))
      });

      // 构造第二次请求消息
      const augmentedMessages = [
        ...builtMessages,
        {
          role: 'assistant',
          content: null,
          tool_calls: toolCallsList.map(tc => ({
            id: tc.id,
            type: tc.type,
            function: { name: tc.function.name, arguments: tc.function.arguments }
          }))
        },
        ...toolResults.map(t => ({
          role: 'tool',
          tool_call_id: t.tool_call_id,
          content: JSON.stringify(t.result)
        }))
      ];

      // 第二次流式请求（不传 tools，避免循环调用）
      const finalStreamResp = await fetch(
        `${process.env.LLM_BASE_URL}/chat/completions`,
        {
          method: 'POST',
          headers: llmHeaders,
          body: JSON.stringify({
            ...baseRequestBody,
            messages: augmentedMessages,
            stream: true,
            stream_options: { include_usage: true }
          })
        }
      );

      const reader2 = finalStreamResp.body.getReader();
      let usageData2 = null;

      while (true) {
        const { done, value } = await reader2.read();
        if (done) break;
        const rawChunk = decoder.decode(value, { stream: true });

        // 提取 usage 数据
        for (const line of rawChunk.split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.usage) usageData2 = d.usage;
            } catch { /* ignore */ }
          }
        }

        res.write(rawChunk);
      }

      if (usageData2) {
        sendEvent({ type: 'usage', usage: usageData2 });
      }
    } else {
      // 无工具调用：usage 来自第一次流
      if (usageData) {
        sendEvent({ type: 'usage', usage: usageData });
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    try {
      sendEvent({ error: error.message });
      res.end();
    } catch { /* ignore write-after-end */ }
  }
});

// ─── 启动服务器 ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🤖 AIGC Chatbot 已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   模型: ${process.env.LLM_DEFAULT_MODEL || '(未配置)'}`);
  console.log(`   按 Ctrl+C 停止\n`);
});
