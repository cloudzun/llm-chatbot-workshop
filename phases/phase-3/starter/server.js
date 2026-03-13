/**
 * Phase 2 参考代码 — 参数调优面板
 *
 * 在 Phase 1 基础上新增：
 *   ✅ POST /api/chat 接收 params 对象（model/temperature/top_p 等）
 *   ✅ 支持自定义 system prompt
 *   ✅ 所有参数有安全的默认值回退
 *
 * 对应学员提示词模板：construction-manual.md → Phase 2
 * 下一阶段：phase-3-server.js 添加 RAG 知识问答
 */

import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

/**
 * POST /api/chat
 * 请求体: {
 *   messages: [{role, content}, ...],
 *   params: {
 *     model, temperature, top_p, max_tokens,
 *     frequency_penalty, presence_penalty, system_prompt
 *   }
 * }
 */
app.post('/api/chat', async (req, res) => {
  const { messages, params = {} } = req.body;

  // 从 params 解构参数，均有默认值（与 .env 配置一致）
  const {
    model             = process.env.LLM_DEFAULT_MODEL,
    temperature       = 0.7,
    top_p             = 0.9,
    max_tokens        = 1024,
    frequency_penalty = 0,
    presence_penalty  = 0,
    system_prompt     = '你是一个友好的AI助手。'
  } = params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await fetch(`${process.env.LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLM_API_KEY}`
      },
      body: JSON.stringify({
        model,
        // 注意：滑块传来的是字符串，需要强制转为数字
        temperature:       parseFloat(temperature),
        top_p:             parseFloat(top_p),
        max_tokens:        parseInt(max_tokens),
        frequency_penalty: parseFloat(frequency_penalty),
        presence_penalty:  parseFloat(presence_penalty),
        messages: [
          { role: 'system', content: system_prompt },
          ...messages
        ],
        stream: true,
        stream_options: { include_usage: true }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      res.write(`data: ${JSON.stringify({ error: `API 错误 (${response.status}): ${errText.slice(0, 200)}` })}\n\n`);
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
      res.write(`data: ${JSON.stringify({ type: 'usage', usage: usageData })}\n\n`);
    }

    res.end();

  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Phase 2 — 参数调优面板已启动: http://localhost:${PORT}`);
  console.log(`   模型: ${process.env.LLM_DEFAULT_MODEL}`);
});
