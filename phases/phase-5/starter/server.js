/**
 * Phase 4 参考代码 — Function Calling：天气查询
 *
 * 在 Phase 3 基础上新增：
 *   ✅ 工具定义：get_weather（JSON Schema 描述）
 *   ✅ 流式"工具检测"模式：
 *       - 第一次流式请求：检测是否有 tool_calls
 *       - 若有 → 执行天气查询 → 第二次流式请求（附带工具结果）
 *       - 若无 → 直接转发内容流（纯聊天路径）
 *   ✅ 响应中发送 type:"metadata" 含工具调用信息（前端渲染天气卡片）
 *
 * 依赖模块（项目根目录下）：
 *   rag/loader.js, rag/vectorstore.js, tools/weather.js
 *
 * 对应学员提示词模板：construction-manual.md → Phase 4
 * 下一阶段：phase-5-server.js 添加 MCP 新闻工具
 */

import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

import { loadAndChunkDocuments } from './rag/loader.js';
import { buildIndex, search } from './rag/vectorstore.js';
import { getWeather } from './tools/weather.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.static(join(__dirname, 'public')));

// ─── 工具定义（Phase 4 只有天气）────────────────────────────────────────────

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
  }
];

// 工具名 → 执行函数 的映射
const toolHandlers = {
  get_weather: async (args) => {
    try {
      return await getWeather(args.city);
    } catch (e) {
      return { error: `天气查询失败: ${e.message}` };
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

    // ── Function Calling：流式检测工具调用 ──────────────────────────────
    // 发送带工具定义的第一次请求（流式），
    // 读取流时检测 delta.tool_calls。
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

    // 收集工具调用信息（index → {id, name, arguments}）
    const toolCallsMap = {};
    let hasToolCalls = false;
    let contentStarted = false;
    let usageData = null;
    const contentBuffer = [];  // 若无工具调用，缓存内容 chunk

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
        const finish = data.choices?.[0]?.finish_reason;

        if (!delta) continue;

        // 检测工具调用
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

        // 普通内容（无工具调用时直接转发）
        if (delta.content && !hasToolCalls) {
          contentStarted = true;
          res.write(`data: ${line.slice(6)}\n\n`);  // 直接转发原始 JSON 行内容
        }

        // 实际上我们把整行转发，但要注意可能有工具调用
        if (!hasToolCalls && delta.content) {
          // 已在上面处理，避免重复写
        }
      }

      // 如果本批次全是普通内容且未检测到工具调用，直接透传整个 rawChunk
      if (!hasToolCalls && !lines.some(l => {
        if (!l.startsWith('data: ') || l === 'data: [DONE]') return false;
        try { return !!JSON.parse(l.slice(6)).choices?.[0]?.delta?.tool_calls; } catch { return false; }
      })) {
        // 已在逐行处理时透传，此处不再重复
      }
    }

    // ── 无工具调用：已实时透传，收尾 ────────────────────────────────────
    if (!hasToolCalls) {
      if (usageData) sendEvent({ type: 'usage', usage: usageData });
      res.end();
      return;
    }

    // ── 有工具调用：执行工具，发起第二次 LLM 请求 ───────────────────────
    const toolCallsList = Object.values(toolCallsMap);

    // 发送工具调用元数据通知前端（用于渲染卡片）
    sendEvent({
      type: 'metadata',
      toolCalls: toolCallsList.map(tc => ({
        name: tc.name,
        arguments: (() => { try { return JSON.parse(tc.arguments); } catch { return tc.arguments; } })()
      }))
    });

    // 执行工具
    const toolResults = [];
    for (const tc of toolCallsList) {
      const handler = toolHandlers[tc.name];
      const result = handler
        ? await handler(JSON.parse(tc.arguments || '{}'))
        : { error: `未知工具: ${tc.name}` };
      toolResults.push({ toolCallId: tc.id, name: tc.name, result });
    }

    // 构建第二次请求的消息列表
    const assistantToolCallMsg = {
      role: 'assistant',
      tool_calls: toolCallsList.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments }
      }))
    };

    const toolResultMsgs = toolResults.map(tr => ({
      role: 'tool',
      tool_call_id: tr.toolCallId,
      content: JSON.stringify(tr.result)
    }));

    // 第二次流式请求：将工具结果告知 LLM，让它生成最终回答
    const secondResp = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: llmHeaders,
      body: JSON.stringify({
        ...baseRequest,
        messages: [
          ...builtMessages,
          assistantToolCallMsg,
          ...toolResultMsgs
        ],
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
  console.log(`✅ Phase 4 — Function Calling（天气查询）已启动: http://localhost:${PORT}`);
});
