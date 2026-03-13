/**
 * Phase 1 参考代码 — 基础聊天
 *
 * 功能：
 *   ✅ Express 静态文件服务
 *   ✅ POST /api/chat — 代理转发到 LLM，SSE 流式输出
 *   ✅ 流结束后发送 token 用量数据
 *
 * 对应学员提示词模板：construction-manual.md → Phase 1
 * 下一阶段：phase-2-server.js 添加参数调优面板
 */

import express from 'express';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
// 静态文件从项目根目录的 public/ 提供
app.use(express.static(join(__dirname, '..', 'public')));

/**
 * POST /api/chat
 * 请求体: { messages: [{role, content}, ...] }
 * 响应:   SSE 流，转发 LLM 的内容 delta，
 *         流结束后额外发送 {type: "usage", usage: {...}}
 */
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  // 设置 SSE 响应头
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
        model: process.env.LLM_DEFAULT_MODEL,
        messages: [
          { role: 'system', content: '你是一个友好的AI助手。' },
          ...messages
        ],
        stream: true,
        stream_options: { include_usage: true }  // 流结束时返回 usage
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

    // 逐块读取并透传给前端
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const rawChunk = decoder.decode(value, { stream: true });

      // 从 chunk 中提取 usage 字段（LLM 通常在最后一条 data 中返回）
      for (const line of rawChunk.split('\n')) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.usage) usageData = parsed.usage;
          } catch {
            // 解析失败忽略（非 JSON 行）
          }
        }
      }

      // 原样转发给前端
      res.write(rawChunk);
    }

    // 流结束后，单独发送 token 用量统计
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
  console.log(`✅ Phase 1 — 基础聊天已启动: http://localhost:${PORT}`);
  console.log(`   模型: ${process.env.LLM_DEFAULT_MODEL}`);
});
