"""
向量嵌入模块 — 调用硅基流动 Embedding API
"""
import streamlit as st


def get_embeddings(texts: list[str], client=None) -> list[list[float]]:
    """
    批量获取文本嵌入向量（每批最多 100 条）。

    Args:
        texts:  待嵌入的文本列表
        client: openai.OpenAI 实例（传入以复用）

    Returns:
        list[list[float]]，与 texts 等长
    """
    if client is None:
        from openai import OpenAI
        client = OpenAI(
            api_key=st.secrets["LLM_API_KEY"],
            base_url=st.secrets["LLM_BASE_URL"],
        )

    model = st.secrets["EMBEDDING_MODEL"]
    batch_size = 100
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i: i + batch_size]
        response = client.embeddings.create(model=model, input=batch)
        # response.data 按 index 排序返回
        batch_embeddings = [item.embedding for item in sorted(response.data, key=lambda x: x.index)]
        all_embeddings.extend(batch_embeddings)

    return all_embeddings
