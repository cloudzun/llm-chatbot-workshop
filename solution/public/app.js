/**
 * app.js — AIGC Chatbot 前端逻辑
 * Phase 1: 基础聊天 + Token 统计
 * Phase 2: 参数面板
 * Phase 3: RAG 知识库开关 + 来源展示
 * Phase 4: 天气卡片渲染
 * Phase 5: 新闻卡片渲染
 * Phase 6: 搜索结果展示
 */

/* ── marked.js 配置 ────────────────────────────────────────── */
marked.setOptions({
  breaks: true,
  gfm: true,
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(code, { language: lang }).value; } catch {}
    }
    return hljs.highlightAuto(code).value;
  }
});

/* ── DOM 引用 ─────────────────────────────────────────────── */
const chatMessages    = document.getElementById('chat-messages');
const userInput       = document.getElementById('user-input');
const sendBtn         = document.getElementById('send-btn');
const clearBtn        = document.getElementById('clear-btn');
const tokenPrompt     = document.getElementById('prompt-tokens');
const tokenCompletion = document.getElementById('completion-tokens');
const tokenTotal      = document.getElementById('total-tokens');
const ragToggle       = document.getElementById('rag-toggle');
const rerankToggle    = document.getElementById('rerank-toggle');
const buildIndexBtn   = document.getElementById('build-index-btn');
const toggleSettings  = document.getElementById('toggle-settings');
const settingsPanel   = document.getElementById('settings-panel');
const resetParams     = document.getElementById('reset-params');

/* ── 状态 ─────────────────────────────────────────────────── */
let conversationHistory = [];
let totalTokensUsed     = 0;
let isGenerating        = false;

/* ── Token 计数 ───────────────────────────────────────────── */
function updateTokens(usage) {
  if (!usage) return;
  tokenPrompt.textContent     = (usage.prompt_tokens || 0).toLocaleString();
  tokenCompletion.textContent = (usage.completion_tokens || 0).toLocaleString();
  totalTokensUsed += (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);
  tokenTotal.textContent      = totalTokensUsed.toLocaleString();
}

/* ── 参数面板（Phase 2）──────────────────────────────────── */
const defaultParams = {
  model:             'deepseek-ai/DeepSeek-V3.2',
  temperature:       '0.7',
  topP:              '0.9',
  maxTokens:         '1024',
  freqPenalty:       '0',
  presPenalty:       '0',
  systemPrompt:      '你是一个友好的AI助手。'
};

function syncSlider(inputId, displayId) {
  const el = document.getElementById(inputId);
  const disp = document.getElementById(displayId);
  if (!el || !disp) return;
  el.addEventListener('input', () => { disp.textContent = el.value; });
}
syncSlider('temperature', 'temp-value');
syncSlider('top-p',       'topp-value');
syncSlider('freq-penalty','freq-value');
syncSlider('pres-penalty','pres-value');

resetParams?.addEventListener('click', () => {
  document.getElementById('model-select').value  = defaultParams.model;
  document.getElementById('temperature').value   = defaultParams.temperature;
  document.getElementById('temp-value').textContent = defaultParams.temperature;
  document.getElementById('top-p').value         = defaultParams.topP;
  document.getElementById('topp-value').textContent = defaultParams.topP;
  document.getElementById('max-tokens').value    = defaultParams.maxTokens;
  document.getElementById('freq-penalty').value  = defaultParams.freqPenalty;
  document.getElementById('freq-value').textContent = defaultParams.freqPenalty;
  document.getElementById('pres-penalty').value  = defaultParams.presPenalty;
  document.getElementById('pres-value').textContent = defaultParams.presPenalty;
  document.getElementById('system-prompt').value = defaultParams.systemPrompt;
});

function getParams() {
  return {
    model:            document.getElementById('model-select')?.value   || defaultParams.model,
    temperature:      document.getElementById('temperature')?.value    || defaultParams.temperature,
    top_p:            document.getElementById('top-p')?.value          || defaultParams.topP,
    max_tokens:       document.getElementById('max-tokens')?.value     || defaultParams.maxTokens,
    frequency_penalty: document.getElementById('freq-penalty')?.value || defaultParams.freqPenalty,
    presence_penalty:  document.getElementById('pres-penalty')?.value || defaultParams.presPenalty,
    system_prompt:    document.getElementById('system-prompt')?.value  || defaultParams.systemPrompt,
    rerankEnabled:    rerankToggle?.checked || false
  };
}

toggleSettings?.addEventListener('click', () => {
  settingsPanel.classList.toggle('collapsed');
});

/* ── RAG 控件 ─────────────────────────────────────────────── */
buildIndexBtn?.addEventListener('click', async () => {
  buildIndexBtn.disabled = true;
  buildIndexBtn.textContent = '⏳ 构建中…';
  try {
    const res = await fetch('/api/rag/build-index', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      buildIndexBtn.textContent = `✅ 已构建 (${data.count} 片段)`;
      appendSystemMsg(`知识库索引已构建完成，共处理 ${data.count} 个文档片段。`);
    } else {
      buildIndexBtn.textContent = '❌ 构建失败';
      appendSystemMsg(`构建失败：${data.error}`);
    }
  } catch (e) {
    buildIndexBtn.textContent = '❌ 构建失败';
    appendSystemMsg(`构建失败：${e.message}`);
  }
  setTimeout(() => {
    buildIndexBtn.disabled = false;
    buildIndexBtn.textContent = '🏗️ 构建索引';
  }, 3000);
});

/* ── 清空对话 ─────────────────────────────────────────────── */
clearBtn?.addEventListener('click', () => {
  conversationHistory = [];
  chatMessages.innerHTML = '';
  tokenPrompt.textContent     = '—';
  tokenCompletion.textContent = '—';
});

/* ── 发送消息 ─────────────────────────────────────────────── */
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// 自动调整输入框高度
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
});

async function handleSend() {
  const content = userInput.value.trim();
  if (!content || isGenerating) return;

  isGenerating = true;
  sendBtn.disabled = true;

  // 添加用户消息
  conversationHistory.push({ role: 'user', content });
  appendMessage('user', content);
  userInput.value = '';
  userInput.style.height = 'auto';

  // 创建 AI 消息（带思考动画）
  const { wrapper, contentEl } = createAssistantBubble();
  showThinking(contentEl);
  scrollToBottom();

  let fullContent = '';
  let thinkingRemoved = false;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationHistory,
        params: getParams(),
        ragEnabled: ragToggle?.checked || false
      })
    });

    if (!response.ok) {
      throw new Error(`服务器错误: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        if (line === 'data: [DONE]') continue;

        let data;
        try {
          data = JSON.parse(line.slice(6));
        } catch {
          continue;
        }

        // ── 错误 ────────────────────────────────────────────
        if (data.error) {
          if (!thinkingRemoved) { removeThinking(contentEl); thinkingRemoved = true; }
          contentEl.textContent = `❌ ${data.error}`;
          contentEl.classList.remove('typing-cursor');
          continue;
        }

        // ── 元数据（RAG 来源 + 工具调用）───────────────────
        if (data.type === 'metadata') {
          if (!thinkingRemoved) { removeThinking(contentEl); thinkingRemoved = true; }
          if (data.toolCalls?.length > 0) {
            renderToolCallsBlock(wrapper, data.toolCalls);
          }
          if (data.ragSources?.length > 0) {
            setTimeout(() => renderRagSources(wrapper, data.ragSources), 100);
          }
          continue;
        }

        // ── Token 用量 ───────────────────────────────────────
        if (data.type === 'usage') {
          updateTokens(data.usage);
          continue;
        }

        // ── 内容 delta ───────────────────────────────────────
        const delta = data.choices?.[0]?.delta?.content;
        if (delta !== undefined && delta !== null && delta !== '') {
          if (!thinkingRemoved) { removeThinking(contentEl); thinkingRemoved = true; }
          if (!contentEl.classList.contains('typing-cursor')) {
            contentEl.classList.add('typing-cursor');
          }
          fullContent += delta;
          renderMarkdownSafe(contentEl, fullContent);
          scrollToBottom();
        }

        // finish_reason
        if (data.choices?.[0]?.finish_reason === 'stop') {
          contentEl.classList.remove('typing-cursor');
        }
      }
    }

    // 保存到历史
    if (fullContent) {
      conversationHistory.push({ role: 'assistant', content: fullContent });
    }

  } catch (error) {
    if (!thinkingRemoved) { removeThinking(contentEl); thinkingRemoved = true; }
    contentEl.textContent = `抱歉，发生了错误：${error.message}`;
  } finally {
    contentEl.classList.remove('typing-cursor');
    isGenerating = false;
    sendBtn.disabled = false;
    scrollToBottom();
  }
}

/* ── DOM 工具函数 ─────────────────────────────────────────── */

function appendMessage(role, content) {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'message-content';

  if (role === 'user') {
    bubble.textContent = content;
  } else {
    renderMarkdownSafe(bubble, content);
  }

  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

function createAssistantBubble() {
  const wrapper = document.createElement('div');
  wrapper.className = 'message assistant';
  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  wrapper.appendChild(contentEl);
  chatMessages.appendChild(wrapper);
  return { wrapper, contentEl };
}

function showThinking(el) {
  el.innerHTML = `
    <div class="thinking-indicator">
      <span></span><span></span><span></span>
    </div>`;
}

function removeThinking(el) {
  const ind = el.querySelector('.thinking-indicator');
  if (ind) ind.remove();
  el.innerHTML = '';
}

function appendSystemMsg(text) {
  const div = document.createElement('div');
  div.style.cssText = 'text-align:center;font-size:12px;color:var(--text-muted);padding:6px 0;';
  div.textContent = text;
  chatMessages.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderMarkdownSafe(el, content) {
  try {
    el.innerHTML = marked.parse(content || '');
    // 高亮代码块
    el.querySelectorAll('pre code').forEach(block => {
      try { hljs.highlightElement(block); } catch {}
    });
  } catch {
    el.textContent = content;
  }
}

/* ── 工具调用卡片渲染（Phase 4/5/6）─────────────────────── */
function renderToolCallsBlock(wrapper, toolCalls) {
  const block = document.createElement('div');
  block.className = 'tool-calls-block';

  const header = document.createElement('div');
  header.className = 'tool-calls-header';
  header.innerHTML = `⚙️ 工具调用 (${toolCalls.length}) <span style="margin-left:auto;font-size:10px">▼</span>`;

  const body = document.createElement('div');
  body.className = 'tool-calls-body';

  for (const tc of toolCalls) {
    const item = document.createElement('div');
    item.className = 'tool-item';

    const nameEl = document.createElement('div');
    nameEl.className = 'tool-item-name';
    nameEl.textContent = `🔧 ${tc.name}`;

    const resultEl = document.createElement('div');
    resultEl.className = 'tool-item-result';

    // 特殊渲染天气和新闻
    if (tc.name === 'get_weather' && !tc.result?.error) {
      resultEl.innerHTML = renderWeatherCard(tc.result);
    } else if (tc.name === 'get_news' && Array.isArray(tc.result?.items)) {
      resultEl.innerHTML = renderNewsList(tc.result.items);
    } else {
      resultEl.textContent = typeof tc.result === 'object'
        ? JSON.stringify(tc.result, null, 2)
        : String(tc.result);
    }

    item.appendChild(nameEl);
    item.appendChild(resultEl);
    body.appendChild(item);
  }

  header.addEventListener('click', () => {
    body.style.display = body.style.display === 'none' ? '' : 'none';
    header.querySelector('span:last-child').textContent = body.style.display === 'none' ? '▶' : '▼';
  });

  block.appendChild(header);
  block.appendChild(body);
  wrapper.appendChild(block);
}

/* ── 天气卡片（Phase 4）──────────────────────────────────── */
const weatherIconMap = {
  'Sunny': '☀️', 'Clear': '🌙', 'Partly cloudy': '⛅',
  'Cloudy': '☁️', 'Overcast': '☁️',
  'Mist': '🌫️', 'Fog': '🌫️',
  'Rain': '🌧️', 'Drizzle': '🌦️', 'Shower': '🌦️',
  'Snow': '❄️', 'Blizzard': '🌨️',
  'Thunder': '⛈️', 'Sleet': '🌨️'
};
function getWeatherIcon(desc) {
  for (const [key, icon] of Object.entries(weatherIconMap)) {
    if (desc.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '🌡️';
}

function renderWeatherCard(w) {
  const icon = getWeatherIcon(w.weather || '');
  return `
    <div class="weather-card">
      <div class="weather-icon">${icon}</div>
      <div class="weather-info">
        <div class="weather-temp">${w.temperature}</div>
        <div class="weather-desc">${w.weather} · 体感 ${w.feelsLike}</div>
        <div class="weather-meta">
          <span>💧 ${w.humidity}</span>
          <span>💨 ${w.windSpeed}</span>
          <span>📍 ${w.city}</span>
        </div>
      </div>
    </div>`;
}

/* ── 新闻列表（Phase 5）──────────────────────────────────── */
function renderNewsList(items) {
  if (!items?.length) return '<div style="color:var(--text-muted);font-size:12px">暂无新闻</div>';
  return `<div class="news-list">${items.map(item => `
    <div class="news-item">
      <div class="news-title">${escapeHtml(item.title || '')}</div>
      ${item.description ? `<div class="news-desc">${escapeHtml(item.description.slice(0, 120))}…</div>` : ''}
      ${item.link ? `<a class="news-link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener">阅读全文 →</a>` : ''}
    </div>`).join('')}</div>`;
}

/* ── RAG 来源展示（Phase 3）──────────────────────────────── */
function renderRagSources(wrapper, sources) {
  if (!sources?.length) return;

  const block = document.createElement('div');
  block.className = 'rag-sources-block';

  const header = document.createElement('div');
  header.className = 'rag-sources-header';
  header.innerHTML = `📚 知识库来源 (${sources.length}) <span style="margin-left:auto;font-size:10px">▼</span>`;

  const body = document.createElement('div');
  body.className = 'rag-sources-body';
  body.style.display = 'none'; // 默认折叠

  for (const src of sources) {
    const item = document.createElement('div');
    item.className = 'rag-source-item';
    item.innerHTML = `
      <div class="rag-source-meta">📄 ${escapeHtml(src.source)} · 相似度: ${(src.score || 0).toFixed(3)}</div>
      <div class="rag-source-preview">${escapeHtml(src.preview || '')}…</div>`;
    body.appendChild(item);
  }

  header.addEventListener('click', () => {
    body.style.display = body.style.display === 'none' ? '' : 'none';
    header.querySelector('span:last-child').textContent = body.style.display === 'none' ? '▶' : '▼';
  });

  block.appendChild(header);
  block.appendChild(body);
  wrapper.appendChild(block);
}

/* ── 安全辅助函数 ─────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
