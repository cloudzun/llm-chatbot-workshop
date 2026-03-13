/**
 * rag/loader.js
 * 加载目录下所有支持格式的文档，切分为语义片段（Chunk）
 * 支持格式：.txt .md .json .csv .docx .pdf
 * 注意：.docx 需要 mammoth，.pdf 需要 pdf-parse（均为可选依赖，缺失时跳过对应文件）
 */

import { readFile, readdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

// 可选依赖：缺失时跳过对应格式文件，不影响其他格式
let mammoth = null;
let pdfParse = null;
try { mammoth = _require('mammoth'); } catch {}
try { pdfParse = _require('pdf-parse'); } catch {}

const SUPPORTED_EXTENSIONS = new Set(['.txt', '.md', '.json', '.csv', '.docx', '.pdf']);

/**
 * 加载目录下所有文档并切分
 * @param {string} dirPath  文档目录路径
 * @param {number} chunkSize  每个片段的目标字符数（默认 500）
 * @param {number} overlap    片段间重叠字符数（默认 100）
 * @returns {Promise<Array<{content:string, source:string, index:number}>>}
 */
export async function loadAndChunkDocuments(dirPath, chunkSize = 500, overlap = 100) {
  let files;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    files = entries
      .filter(e => e.isFile() && SUPPORTED_EXTENSIONS.has(extname(e.name).toLowerCase()))
      .map(e => e.name);
  } catch (e) {
    throw new Error(`无法读取目录 "${dirPath}": ${e.message}`);
  }

  if (files.length === 0) {
    throw new Error(`目录 "${dirPath}" 中没有支持的文档文件（.txt/.md/.json/.csv/.docx/.pdf）`);
  }

  const chunks = [];
  for (const file of files) {
    const filePath = join(dirPath, file);
    const ext = extname(file).toLowerCase();
    let content = '';

    try {
      if (ext === '.pdf') {
        if (!pdfParse) {
          console.warn(`跳过 PDF "${file}"：请先运行 npm install pdf-parse`);
          continue;
        }
        const buf = await readFile(filePath);
        const result = await pdfParse(buf);
        content = result.text;
      } else if (ext === '.docx') {
        if (!mammoth) {
          console.warn(`跳过 DOCX "${file}"：请先运行 npm install mammoth`);
          continue;
        }
        const buf = await readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: buf });
        content = result.value;
      } else {
        content = await readFile(filePath, 'utf-8');
      }
    } catch (e) {
      console.warn(`跳过文件 "${file}": ${e.message}`);
      continue;
    }

    const fileChunks = splitText(content, chunkSize, overlap);
    fileChunks.forEach((chunkContent, index) => {
      chunks.push({ content: chunkContent, source: basename(file), index });
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
