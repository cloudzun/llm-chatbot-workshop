/**
 * Phase 3 参考代码 — RAG 知识问答
 *
 * 在 Phase 2 基础上新增：
 *   ✅ POST /api/rag/build-index — 载入文档并构建向量索引
 *   ✅ POST /api/chat 接收 ragEnabled 参数
 *   ✅ ragEnabled=true 时：检索知识库 → 将文档片段注入 system prompt
 *   ✅ 响应中附带 RAG 来源信息（发送 type:"metadata" 事件）
 *   ✅ [进阶] rerankEnabled 参数控制是否启用重排序
 *
 * 依赖模块（项目根目录下）：
 *   rag/loader.js, rag/vectorstore.js
 *
 * 对应学员提示词模板：construction-manual.md → Phase 3
 * 下一阶段：phase-4-server.js 添加 Function Calling 天气查询
 */

import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

// 使用项目根目录的 RAG 模块
import { loadAndChunkDocuments } from './rag/loader.js';
import { buildIndex, search } from './rag/vectorstore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.static(join(__dirname, 'public')));

// ─── RAG 索引构建接口 ────────────────────────────────────────────────────────

/**
 * POST /api/rag/build-index
 * 读取知识库目录，生成向量索引并存储到 rag/vectorstore.json
 */
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

/**
 * POST /api/chat
 * 请求体: {
 *   messages, params, ragEnabled, rerankEnabled(进阶)
 * }
 */
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
    // ── RAG 检索：将知识库片段注入 system prompt ──────────────────────────
    let systemContent = system_prompt;
    let ragSources = [];

    if (ragEnabled) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        try {
          // search 返回 [{chunk: {content, source}, score}]
          const results = await search(lastUserMsg.content, 3, rerankEnabled);
          ragSources = results;

          if (results.length > 0) {
            // 核心：把检索到的文档片段拼进 system prompt
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

    // 先发送 RAG 来源元数据（前端用于展示参考来源）
    if (ragSources.length > 0) {
      sendEvent({ type: 'metadata', ragSources });
    }

    // ── 调用 LLM ─────────────────────────────────────────────────────────
    const response = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLM_API_KEY}`
      },
      body: JSON.stringify({
        model,
        temperature:       parseFloat(temperature),
        top_p:             parseFloat(top_p),
        max_tokens:        parseInt(max_tokens),
        frequency_penalty: parseFloat(frequency_penalty),
        presence_penalty:  parseFloat(presence_penalty),
        messages: [
          { role: 'system', content: systemContent },
          ...messages
        ],
        stream: true,
        stream_options: { include_usage: true }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      sendEvent({ error: `API 错误 (${response.status}): ${errText.slice(0, 200)}` });
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let usageData = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const rawChunk = decoder.decode(value, { stream: true });

      for (const line of rawChunk.split('\n')) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.usage) usageData = parsed.usage;
          } catch { /* ignore */ }
        }
      }

      res.write(rawChunk);
    }

    if (usageData) {
      sendEvent({ type: 'usage', usage: usageData });
    }

    res.end();

  } catch (error) {
    sendEvent({ error: error.message });
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Phase 3 — RAG 知识问答已启动: http://localhost:${PORT}`);
  console.log(`   知识库目录: ${process.env.KNOWLEDGE_DIR || './OneFlower/OneFlower'}`);
});
