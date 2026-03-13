/**
 * rag/embeddings.js
 * 调用 LLM_BASE_URL/embeddings 接口生成文本向量
 * 默认使用 BAAI/bge-m3（硅基流动免费提供）
 */

/**
 * 批量获取文本的向量嵌入
 * @param {string|string[]} texts  单条文本或文本数组
 * @returns {Promise<number[][]>}  向量数组，与输入一一对应
 */
export async function getEmbeddings(texts) {
  const input = Array.isArray(texts) ? texts : [texts];
  if (input.length === 0) return [];

  const response = await fetch(`${process.env.LLM_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LLM_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.EMBEDDING_MODEL || 'BAAI/bge-m3',
      input
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding API 错误 (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = await response.json();

  if (!data.data || !Array.isArray(data.data)) {
    throw new Error(`Embedding API 返回格式异常: ${JSON.stringify(data).slice(0, 200)}`);
  }

  // 按 index 排序确保顺序一致
  return data.data
    .sort((a, b) => a.index - b.index)
    .map(item => item.embedding);
}
