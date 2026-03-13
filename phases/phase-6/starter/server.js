/**
 * Phase 5 参考代码 — MCP 对接：新闻阅读
 *
 * 在 Phase 4 基础上新增：
 *   ✅ 工具列表中添加 get_news 工具
 *   ✅ toolHandlers 中添加 MCP 新闻工具处理器
 *
 * 依赖模块（项目根目录下）：
 *   rag/loader.js, rag/vectorstore.js
 *   tools/weather.js, tools/news.js
 *
 * 对应学员提示词模板：construction-manual.md → Phase 5
 * 下一阶段：项目根目录 server.js 添加 DuckDuckGo 搜索（Phase 6 完整版）
 */

import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

import { loadAndChunkDocuments } from './rag/loader.js';
import { buildIndex, search } from './rag/vectorstore.js';
import { getWeather } from './tools/weather.js';
import { getNews } from './tools/news.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.static(join(__dirname, 'public')));

// ─── 工具定义（Phase 5：天气 + 新闻）───────────────────────────────────────

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
  }
};

// ─── RAG 索引构建接口 ────────────────────────────────────────────────────────

app.post('/api/rag/build-index', async (req, res) => {
  const dir = process.env.KNOWLEDGE_DIR || './OneFlower/OneFlower';
  try {
    const chunks = loadAndChunkDocuments(dir);
    if (chunks.length === 0) {
      return res.status(400).json({ error: `目录 "${dir}" 中未找到可读文档` });
    }
    await buildIndex(chunks);
    res.json({ success: true, count: chunks.length, dir });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 主聊天接口 ──────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { messages, params = {}, ragEnabled = false } = req.body;

  const {
    model             = process.env.LLM_DEFAULT_MODEL,
    temperature       = 0.7,
    top_p             = 0.9,
    max_tokens        = 1024,
    frequency_penalty = 0,
    presence_penalty  = 0,
    system_prompt     = '你是一个友好的AI助手。',
    rerankEnabled     = false
  } = params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    // ── RAG 检索 ─────────────────────────────────────────────────────────
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
              .map((r, i) =>
                `[片段${i + 1} | 来源: ${r.chunk.source} | 相似度: ${r.score.toFixed(3)}]\n${r.chunk.content}`
              )
              .join('\n\n---\n\n');
            systemContent +=
              `\n\n请基于以下知识库内容回答用户问题。如果知识库中没有相关信息，请如实说明。\n\n【知识库内容】\n${context}`;
          }
        } catch (e) {
          console.error('RAG 检索失败:', e.message);
        }
      }
    }

    if (ragSources.length > 0) {
      sendEvent({ type: 'metadata', ragSources });
    }

    const builtMessages = [
      { role: 'system', content: systemContent },
      ...messages
    ];

    const baseRequest = {
      model,
      temperature:       parseFloat(temperature),
      top_p:             parseFloat(top_p),
      max_tokens:        parseInt(max_tokens),
      frequency_penalty: parseFloat(frequency_penalty),
      presence_penalty:  parseFloat(presence_penalty)
    };

    const llmHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LLM_API_KEY}`
    };

    // ── 流式工具检测 ─────────────────────────────────────────────────────
    const firstResp = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: llmHeaders,
      body: JSON.stringify({
        ...baseRequest,
        messages: builtMessages,
        tools,
        tool_choice: 'auto',
        stream: true,
        stream_options: { include_usage: true }
      })
    });

    if (!firstResp.ok) {
      const errText = await firstResp.text();
      sendEvent({ error: `API 错误 (${firstResp.status}): ${errText.slice(0, 200)}` });
      res.end();
      return;
    }

    const reader = firstResp.body.getReader();
    const decoder = new TextDecoder();
    const toolCallsMap = {};
    let hasToolCalls = false;
    let usageData = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const rawChunk = decoder.decode(value, { stream: true });
      const lines = rawChunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        if (line === 'data: [DONE]') continue;

        let data;
        try { data = JSON.parse(line.slice(6)); } catch { continue; }

        if (data.usage) usageData = data.usage;

        const delta = data.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.tool_calls) {
          hasToolCalls = true;
          for (const tc of delta.tool_calls) {
            if (!toolCallsMap[tc.index]) {
              toolCallsMap[tc.index] = { id: tc.id, name: '', arguments: '' };
            }
            if (tc.function?.name)      toolCallsMap[tc.index].name      += tc.function.name;
            if (tc.function?.arguments) toolCallsMap[tc.index].arguments += tc.function.arguments;
          }
        }

        if (delta.content && !hasToolCalls) {
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
      }
    }

    if (!hasToolCalls) {
      if (usageData) sendEvent({ type: 'usage', usage: usageData });
      res.end();
      return;
    }

    // ── 执行工具 ─────────────────────────────────────────────────────────
    const toolCallsList = Object.values(toolCallsMap);

    sendEvent({
      type: 'metadata',
      toolCalls: toolCallsList.map(tc => ({
        name: tc.name,
        arguments: (() => { try { return JSON.parse(tc.arguments); } catch { return tc.arguments; } })()
      }))
    });

    const toolResults = [];
    for (const tc of toolCallsList) {
      const handler = toolHandlers[tc.name];
      const result = handler
        ? await handler(JSON.parse(tc.arguments || '{}'))
        : { error: `未知工具: ${tc.name}` };
      toolResults.push({ toolCallId: tc.id, name: tc.name, result });
    }

    // ── 第二次 LLM 请求（流式，附带工具结果）───────────────────────────
    const assistantMsg = {
      role: 'assistant',
      tool_calls: toolCallsList.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments }
      }))
    };

    const toolMsgs = toolResults.map(tr => ({
      role: 'tool',
      tool_call_id: tr.toolCallId,
      content: JSON.stringify(tr.result)
    }));

    const secondResp = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: llmHeaders,
      body: JSON.stringify({
        ...baseRequest,
        messages: [...builtMessages, assistantMsg, ...toolMsgs],
        stream: true,
        stream_options: { include_usage: true }
      })
    });

    if (!secondResp.ok) {
      const errText = await secondResp.text();
      sendEvent({ error: `第二次 API 错误 (${secondResp.status}): ${errText.slice(0, 200)}` });
      res.end();
      return;
    }

    const reader2 = secondResp.body.getReader();
    let usageData2 = null;

    while (true) {
      const { done, value } = await reader2.read();
      if (done) break;

      const rawChunk = decoder.decode(value, { stream: true });

      for (const line of rawChunk.split('\n')) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.usage) usageData2 = parsed.usage;
          } catch { /* ignore */ }
        }
      }

      res.write(rawChunk);
    }

    if (usageData2) sendEvent({ type: 'usage', usage: usageData2 });
    res.end();

  } catch (error) {
    sendEvent({ error: error.message });
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Phase 5 — MCP 新闻工具已启动: http://localhost:${PORT}`);
});
