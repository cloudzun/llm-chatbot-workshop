"""
向量存储与检索模块 — 使用 numpy 余弦相似度
"""
import json
from pathlib import Path

import numpy as np


_DEFAULT_PATH = Path(__file__).parent / "vectorstore.json"


def build_index(
    chunks: list[dict],
    embeddings: list[list[float]],
    save_path: str | Path = _DEFAULT_PATH,
) -> None:
    """将文档片段和嵌入向量持久化保存为 JSON。"""
    data = [
        {**chunk, "embedding": emb}
        for chunk, emb in zip(chunks, embeddings)
    ]
    Path(save_path).write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def search(
    query_embedding: list[float],
    top_k: int = 3,
    index_path: str | Path = _DEFAULT_PATH,
) -> list[dict]:
    """
    余弦相似度检索，返回最相关的 top_k 个片段。

    Returns:
        list of {"content", "source", "index", "score"}
    """
    data = json.loads(Path(index_path).read_text(encoding="utf-8"))
    q = np.array(query_embedding, dtype=np.float32)
    q = q / (np.linalg.norm(q) + 1e-9)

    scored: list[tuple[float, dict]] = []
    for item in data:
        vec = np.array(item["embedding"], dtype=np.float32)
        vec = vec / (np.linalg.norm(vec) + 1e-9)
        score = float(np.dot(q, vec))
        scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = []
    for score, item in scored[:top_k]:
        results.append({
            "content": item["content"],
            "source": item["source"],
            "index": item["index"],
            "score": round(score, 4),
        })
    return results
