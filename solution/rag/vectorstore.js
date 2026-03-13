/**
 * rag/vectorstore.js
 * 内存向量存储 + JSON 文件持久化 + 余弦相似度检索
 * 可选：调用 reranker 对粗检索结果精排（Phase 3 进阶）
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { getEmbeddings } from './embeddings.js';
import { rerank } from './reranker.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_PATH = `${__dirname}/vectorstore.json`;

// 内存中的向量库状态
let store = { chunks: [], vectors: [] };

/**
 * 构建向量索引（批量嵌入所有 chunks）
 * @param {Array<{content:string, source:string, index:number}>} chunks
 */
export async function buildIndex(chunks) {
  console.log(`[VectorStore] 开始为 ${chunks.length} 个片段生成向量…`);

  const BATCH_SIZE = 8; // 每批最多 8 条，避免 API 请求过大
  const vectors = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchVectors = await getEmbeddings(batch.map(c => c.content));
    vectors.push(...batchVectors);
    process.stdout.write(`\r[VectorStore] 进度: ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}`);
  }
  console.log('\n[VectorStore] 向量生成完成，写入磁盘…');

  store = { chunks, vectors };

  // 持久化到 JSON 文件
  const dir = dirname(STORE_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(store));
  console.log(`[VectorStore] 已保存到 ${STORE_PATH}`);
}

/**
 * 检索与查询最相关的 top-k 片段
 * @param {string}  query         用户提问
 * @param {number}  topK          返回片段数（默认 3）
 * @param {boolean} rerankEnabled 是否启用重排序精排
 * @returns {Promise<Array<{score:number, chunk:{content:string, source:string, index:number}}>>}
 */
export async function search(query, topK = 3, rerankEnabled = false) {
  // 懒加载：若内存为空则从磁盘读取
  if (store.vectors.length === 0) {
    if (!existsSync(STORE_PATH)) {
      throw new Error('向量索引尚未构建，请先点击"构建索引"按钮');
    }
    store = JSON.parse(readFileSync(STORE_PATH, 'utf-8'));
    console.log(`[VectorStore] 已从磁盘加载 ${store.chunks.length} 个片段`);
  }

  const [queryVector] = await getEmbeddings(query);

  // 粗检索（余弦相似度）
  const COARSE_K = rerankEnabled ? Math.min(10, store.vectors.length) : topK;
  const scored = store.vectors
    .map((vec, i) => ({
      score: cosineSimilarity(queryVector, vec),
      chunk: store.chunks[i]
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, COARSE_K);

  // 精排（可选）
  if (rerankEnabled) {
    try {
      const reranked = await rerank(query, scored.map(r => r.chunk.content));
      if (reranked) {
        return reranked
          .slice(0, topK)
          .map(r => ({ score: r.relevance_score, chunk: scored[r.index].chunk }));
      }
    } catch (e) {
      console.warn('[VectorStore] 重排序失败，使用向量检索结果:', e.message);
    }
  }

  return scored.slice(0, topK);
}

/**
 * 余弦相似度（值域 [-1, 1]，越接近 1 越相似）
 */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
