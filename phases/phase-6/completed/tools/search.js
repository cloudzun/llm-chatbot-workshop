/**
 * tools/search.js
 * Phase 6 — DuckDuckGo Instant Answer API（免费，无需 API Key）
 *
 * 注意：DuckDuckGo Instant Answer 返回的是"即时摘要"，
 * 适合百科、定义类问题；不是完整的搜索结果列表。
 *
 * 中文优化：DDG 对中文词条支持有限，当无结果时自动返回
 * 必应/百度的搜索链接，引导用户直接搜索。
 */

/**
 * 使用 DuckDuckGo 搜索，中文查询无结果时返回备用搜索链接
 * @param {string} query  搜索关键词
 * @returns {Promise<object>}  搜索摘要信息
 */
export async function searchDuckDuckGo(query) {
  if (!query?.trim()) throw new Error('搜索关键词不能为空');
  const q = query.trim();
  const isChinese = /[\u4e00-\u9fff]/.test(q);

  try {
    const url = new URL('https://api.duckduckgo.com/');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'json');
    url.searchParams.set('no_html', '1');
    url.searchParams.set('skip_disambig', '1');
    if (isChinese) url.searchParams.set('kl', 'cn-zh'); // 中文地区偏好

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'aigc-chatbot/1.0' },
      signal: AbortSignal.timeout(8000)
    });

    if (response.ok) {
      const data = await response.json();
      const relatedTopics = (data.RelatedTopics || [])
        .filter(t => t.Text && t.FirstURL)
        .slice(0, 5)
        .map(t => ({ text: t.Text, url: t.FirstURL }));

      const hasContent = data.Abstract || data.Answer || data.Definition || relatedTopics.length > 0;

      if (hasContent) {
        return {
          heading:        data.Heading || q,
          abstract:       data.Abstract || '',
          abstractSource: data.AbstractSource || '',
          abstractURL:    data.AbstractURL || '',
          answer:         data.Answer || '',
          definition:     data.Definition || '',
          relatedTopics
        };
      }
    }
  } catch (e) {
    console.warn('[Search] DuckDuckGo 请求失败:', e.message);
  }

  // 未能获取摘要（中文查询常见）：返回备用搜索链接
  const fallbackLinks = isChinese
    ? [
        { text: `在必应搜索"${q}"`,         url: `https://cn.bing.com/search?q=${encodeURIComponent(q)}` },
        { text: `在百度搜索"${q}"`,         url: `https://www.baidu.com/s?wd=${encodeURIComponent(q)}` },
        { text: `在 DuckDuckGo 搜索"${q}"`, url: `https://duckduckgo.com/?q=${encodeURIComponent(q)}` }
      ]
    : [
        { text: `Search DuckDuckGo for "${q}"`, url: `https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
        { text: `Search Bing for "${q}"`,       url: `https://www.bing.com/search?q=${encodeURIComponent(q)}` }
      ];

  return {
    heading: q,
    abstract: isChinese
      ? `DuckDuckGo 即时答案 API 对中文词条支持有限，未找到"${q}"的结构化摘要。请通过以下链接直接搜索：`
      : `No instant answer found for "${q}" via DuckDuckGo. Try these links:`,
    answer: '',
    definition: '',
    relatedTopics: fallbackLinks
  };
}
