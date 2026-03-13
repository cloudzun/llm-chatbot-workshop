/**
 * tools/search.js
 * Phase 6 — DuckDuckGo Instant Answer API（免费，无需 API Key）
 *
 * 注意：DuckDuckGo Instant Answer 返回的是"即时摘要"，
 * 适合百科、定义类问题；不是完整的搜索结果列表。
 */

/**
 * 使用 DuckDuckGo 搜索
 * @param {string} query  搜索关键词
 * @returns {Promise<object>}  搜索摘要信息
 */
export async function searchDuckDuckGo(query) {
  if (!query?.trim()) throw new Error('搜索关键词不能为空');

  const url = new URL('https://api.duckduckgo.com/');
  url.searchParams.set('q', query.trim());
  url.searchParams.set('format', 'json');
  url.searchParams.set('no_html', '1');
  url.searchParams.set('skip_disambig', '1');

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': 'aigc-chatbot/1.0' },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo API 请求失败 (${response.status})`);
  }

  const data = await response.json();

  const relatedTopics = (data.RelatedTopics || [])
    .filter(t => t.Text && t.FirstURL)
    .slice(0, 5)
    .map(t => ({ text: t.Text, url: t.FirstURL }));

  return {
    heading:         data.Heading || query,
    abstract:        data.Abstract || '',
    abstractSource:  data.AbstractSource || '',
    abstractURL:     data.AbstractURL || '',
    answer:          data.Answer || '',
    definition:      data.Definition || '',
    relatedTopics
  };
}
