/**
 * rag/loader.js
 * 加载 oneflower 目录下所有文本/Markdown 文件，切分为语义片段（Chunk）
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename } from 'path';

const SUPPORTED_EXTENSIONS = new Set(['.txt', '.md', '.json', '.csv']);

/**
 * 加载目录下所有文档并切分
 * @param {string} dirPath  文档目录路径
 * @param {number} chunkSize  每个片段的目标字符数（默认 500）
 * @param {number} overlap    片段间重叠字符数（默认 100）
 * @returns {Array<{content:string, source:string, index:number}>}
 */
export function loadAndChunkDocuments(dirPath, chunkSize = 500, overlap = 100) {
  let files;
  try {
    files = readdirSync(dirPath).filter(f => {
      const ext = extname(f).toLowerCase();
      const fullPath = join(dirPath, f);
      return SUPPORTED_EXTENSIONS.has(ext) && statSync(fullPath).isFile();
    });
  } catch (e) {
    throw new Error(`无法读取目录 "${dirPath}": ${e.message}`);
  }

  if (files.length === 0) {
    throw new Error(`目录 "${dirPath}" 中没有支持的文档文件（.txt/.md/.json/.csv）`);
  }

  const chunks = [];
  for (const file of files) {
    const filePath = join(dirPath, file);
    let content;
    try {
      content = readFileSync(filePath, 'utf-8');
    } catch (e) {
      console.warn(`跳过文件 "${file}": ${e.message}`);
      continue;
    }

    const fileChunks = splitText(content, chunkSize, overlap);
    fileChunks.forEach((chunkContent, index) => {
      chunks.push({
        content: chunkContent,
        source: basename(file),
        index
      });
    });
  }

  console.log(`[RAG Loader] 已加载 ${files.length} 个文件，共 ${chunks.length} 个片段`);
  return chunks;
}

/**
 * 将文本按段落切分，控制每片段不超过 chunkSize 字符，片段间保留 overlap 字符重叠
 */
function splitText(text, chunkSize, overlap) {
  const chunks = [];
  // 按空行（\n\n）优先切分，保留语义完整性
  const paragraphs = text.split(/\n{2,}/);
  let current = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (current.length > 0 && (current.length + trimmed.length + 2) > chunkSize) {
      // 当前已满 → 保存，并保留 overlap 部分
      chunks.push(current.trim());
      const overlapText = current.length > overlap ? current.slice(-overlap) : current;
      current = overlapText + '\n\n' + trimmed;
    } else {
      current += (current ? '\n\n' : '') + trimmed;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  // 对过长的单段强制按 chunkSize 截断
  const result = [];
  for (const chunk of chunks) {
    if (chunk.length <= chunkSize * 1.5) {
      result.push(chunk);
    } else {
      for (let i = 0; i < chunk.length; i += chunkSize - overlap) {
        const slice = chunk.slice(i, i + chunkSize);
        if (slice.trim()) result.push(slice.trim());
      }
    }
  }

  return result;
}
