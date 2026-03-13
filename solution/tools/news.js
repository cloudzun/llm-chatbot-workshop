/**
 * tools/news.js
 * Phase 5 — 新闻获取工具
 *
 * 主路径：通过 MCP 协议连接 feed-mcp RSS Server
 * 降级路径：直接 fetch RSS XML 并简单解析（若 MCP 不可用）
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// ─── 预置 RSS 源 ──────────────────────────────────────────────
const RSS_FEEDS = {
  tech:    'https://hnrss.org/newest?count=10',          // Hacker News (英文科技)
  general: 'https://feeds.bbci.co.uk/news/rss.xml',     // BBC News
  world:   'https://feeds.bbci.co.uk/news/world/rss.xml',
  finance: 'https://feeds.bbci.co.uk/news/business/rss.xml',
  default: 'https://hnrss.org/newest?count=10'
};

// MCP 客户端单例（懒初始化）
let mcpClient = null;
let mcpInitFailed = false;

/**
 * 初始化 MCP Client（连接 feed-mcp RSS Server）
 */
async function initMCP() {
  if (mcpInitFailed) return null;
  if (mcpClient) return mcpClient;

  try {
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', 'feed-mcp@latest'],
      env: { ...process.env }
    });
    mcpClient = new Client({ name: 'aigc-chatbot', version: '1.0.0' }, { capabilities: {} });
    await mcpClient.connect(transport);
    console.log('[News] MCP RSS Server 已连接');
    return mcpClient;
  } catch (e) {
    console.warn('[News] MCP 初始化失败，将使用直接 RSS 解析:', e.message);
    mcpInitFailed = true;
    mcpClient = null;
    return null;
  }
}

/**
 * 获取新闻条目
 * @param {string} topic  主题关键词（tech/general/finance/world）
 * @returns {Promise<{topic:string, items:Array<{title,link,description}>}>}
 */
export async function getNews(topic = 'general') {
  const feedUrl = RSS_FEEDS[topic.toLowerCase()] || RSS_FEEDS.default;

  // 尝试 MCP 路径
  const client = await initMCP();
  if (client) {
    try {
      const result = await client.callTool({
        name: 'get_feed',
        arguments: { url: feedUrl }
      });
      const items = parseMCPFeedResult(result);
      if (items.length > 0) return { topic, source: feedUrl, items };
    } catch (e) {
      console.warn('[News] MCP callTool 失败，降级到直接解析:', e.message);
    }
  }

  // 降级路径：直接 fetch + 解析 RSS XML
  return fetchAndParseRSS(feedUrl, topic);
}

/**
 * 解析 MCP 返回结果（兼容 feed-mcp 的 content 数组格式）
 */
function parseMCPFeedResult(result) {
  try {
    if (Array.isArray(result.content)) {
      const text = result.content.find(c => c.type === 'text')?.text || '';
      return parseRSSXML(text);
    }
    if (typeof result === 'string') return parseRSSXML(result);
    if (Array.isArray(result)) return result.slice(0, 8).map(formatItem);
  } catch {}
  return [];
}

/**
 * 直接 fetch RSS 并解析
 */
async function fetchAndParseRSS(feedUrl, topic) {
  const response = await fetch(feedUrl, {
    headers: { 'User-Agent': 'aigc-chatbot/1.0', 'Accept': 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) throw new Error(`RSS 获取失败 (${response.status}): ${feedUrl}`);

  const xml = await response.text();
  const items = parseRSSXML(xml);
  return { topic, source: feedUrl, items };
}

/**
 * 简单 RSS XML 解析（不依赖外部库）
 */
function parseRSSXML(xml) {
  const items = [];
  const itemMatches = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)];

  for (const match of itemMatches.slice(0, 8)) {
    const itemXml = match[1];

    const title = extractCDATA(itemXml, 'title');
    const link  = extractTag(itemXml, 'link') || extractTag(itemXml, 'guid');
    const desc  = extractCDATA(itemXml, 'description');
    const pubDate = extractTag(itemXml, 'pubDate');

    if (title) {
      items.push({
        title:       decodeHtmlEntities(title.trim()),
        link:        link?.trim() || '',
        description: decodeHtmlEntities(stripHtmlTags(desc || '')).slice(0, 150),
        pubDate:     pubDate?.trim() || ''
      });
    }
  }

  return items;
}

function extractCDATA(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? (m[1] ?? m[2] ?? '') : '';
}

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function stripHtmlTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g,  '<')
    .replace(/&gt;/g,  '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&nbsp;/g, ' ');
}

function formatItem(item) {
  return {
    title:       item.title || item.name || '(无标题)',
    link:        item.url || item.link || '',
    description: item.summary || item.description || ''
  };
}
