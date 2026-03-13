/**
 * rag/reranker.js
 * [进阶] 重排序模块
 * 调用 RERANK_MODEL（默认 BAAI/bge-reranker-v2-m3）对粗检索结果精排
 * 若 RERANK_ENABLED=false（默认），search() 中不会调用此模块
 */

/**
 * 对候选文档进行重排序
 * @param {string}   query      用户查询
 * @param {string[]} documents  候选文档片段内容数组
 * @returns {Promise<Array<{index:number, relevance_score:number}>|null>}
 *   返回按相关性降序排列的结果，或 null（禁用时）
 */
export async function rerank(query, documents) {
  if (process.env.RERANK_ENABLED !== 'true') return null;
  if (!documents || documents.length === 0) return null;

  const model = process.env.RERANK_MODEL || 'BAAI/bge-reranker-v2-m3';

  const response = await fetch(`${process.env.LLM_BASE_URL}/rerank`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LLM_API_KEY}`
    },
    body: JSON.stringify({
      model,
      query,
      documents,
      top_n: Math.min(3, documents.length),
      return_documents: false
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Rerank API 错误 (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = await response.json();

  // 标准格式：{ results: [{ index, relevance_score }] }
  if (data.results && Array.isArray(data.results)) {
    return data.results.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  return null;
}
