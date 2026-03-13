"""
重排序模块（进阶）—— 调用硅基流动 Rerank API
"""
import requests
import streamlit as st


def rerank(query: str, chunks: list[dict], top_n: int = 3) -> list[dict]:
    """
    使用 bge-reranker 对候选片段重新排序。

    Args:
        query:  用户查询
        chunks: 候选片段（包含 content 字段）
        top_n:  返回数量

    Returns:
        重排后的 top_n 个片段（保留原始字段，追加 rerank_score）
    """
    api_key = st.secrets["LLM_API_KEY"]
    base_url = st.secrets["LLM_BASE_URL"].rstrip("/")
    model = st.secrets.get("RERANK_MODEL", "BAAI/bge-reranker-v2-m3")

    documents = [c["content"] for c in chunks]
    payload = {
        "model": model,
        "query": query,
        "documents": documents,
        "top_n": top_n,
    }
    resp = requests.post(
        f"{base_url}/rerank",
        json=payload,
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    results = []
    for item in data.get("results", []):
        idx = item["index"]
        chunk = dict(chunks[idx])
        chunk["rerank_score"] = round(item["relevance_score"], 4)
        results.append(chunk)

    return results
