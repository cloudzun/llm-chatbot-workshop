"""
文档加载与切分模块
"""
import re
from pathlib import Path


def load_and_chunk(directory: str, chunk_size: int = 500, overlap: int = 100) -> list[dict]:
    """
    读取目录下所有 .txt / .md / .pdf / .docx 文件，切分为片段。

    Returns:
        list of {"content": str, "source": str, "index": int}
    """
    chunks: list[dict] = []
    path = Path(directory)

    for filepath in sorted(path.rglob("*")):
        if not filepath.is_file():
            continue
        suffix = filepath.suffix.lower()
        text = ""

        try:
            if suffix in (".txt", ".md"):
                text = filepath.read_text(encoding="utf-8", errors="ignore")
            elif suffix == ".pdf":
                from pypdf import PdfReader
                reader = PdfReader(str(filepath))
                text = "\n".join(page.extract_text() or "" for page in reader.pages)
            elif suffix == ".docx":
                from docx import Document
                doc = Document(str(filepath))
                text = "\n".join(p.text for p in doc.paragraphs)
            else:
                continue
        except Exception as e:
            print(f"[Loader] 跳过 {filepath.name}：{e}")
            continue

        if not text.strip():
            continue

        file_chunks = _split_text(text, chunk_size, overlap)
        for i, chunk in enumerate(file_chunks):
            chunks.append({
                "content": chunk,
                "source": filepath.name,
                "index": len(chunks),
            })

    return chunks


def _split_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """按自然段落优先切分，保证 chunk_size 和滑动 overlap。"""
    # 先按段落分割，再合并到目标大小
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 1 <= chunk_size:
            current = (current + "\n" + para).strip()
        else:
            if current:
                chunks.append(current)
            # 如果单个段落超长，强制按字符切
            if len(para) > chunk_size:
                for start in range(0, len(para), chunk_size - overlap):
                    chunks.append(para[start:start + chunk_size])
                current = ""
            else:
                current = para

    if current:
        chunks.append(current)

    return chunks
