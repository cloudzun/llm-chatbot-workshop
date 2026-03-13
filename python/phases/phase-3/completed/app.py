import streamlit as st
from openai import OpenAI
from pathlib import Path

from rag.loader import load_and_chunk
from rag.embeddings import get_embeddings
from rag.vectorstore import build_index, search


@st.cache_resource
def get_client() -> OpenAI:
    return OpenAI(
        api_key=st.secrets["LLM_API_KEY"],
        base_url=st.secrets["LLM_BASE_URL"],
    )


client = get_client()

st.title("🤖 AI 聊天助手（RAG 版）")

if "messages" not in st.session_state:
    st.session_state.messages: list[dict] = []

# ── 侧边栏 ────────────────────────────────────────────────
with st.sidebar:
    if st.button("🗑️ 清空对话"):
        st.session_state.messages = []
        st.rerun()

    st.divider()
    st.subheader("⚙️ 模型参数")
    model = st.selectbox("模型", [
        "deepseek-ai/DeepSeek-V3",
        "Qwen/Qwen2.5-7B-Instruct",
        "deepseek-ai/DeepSeek-R1",
    ])
    temperature = st.slider("Temperature", 0.0, 2.0, 0.7, 0.05)
    st.caption("越高越有创意，越低越严谨")
    top_p = st.slider("Top-P", 0.0, 1.0, 0.9, 0.05)
    max_tokens = st.number_input("Max Tokens", 64, 4096, 1024)
    st.divider()
    system_prompt = st.text_area("System Prompt", "你是一个友好的 AI 助手。", height=100)

    st.divider()
    st.subheader("📚 知识库设置")
    rag_enabled = st.toggle("开启知识库模式", value=False)
    use_rerank = st.toggle("启用重排序（进阶）", value=False)
    kb_dir = st.text_input("知识库目录", value="oneflower")

    if st.button("🔨 构建索引"):
        with st.spinner("正在读取文档并构建嵌入索引..."):
            chunks = load_and_chunk(kb_dir)
            if not chunks:
                st.error(f"未在 {kb_dir} 目录找到可读文档")
            else:
                texts = [c["content"] for c in chunks]
                embeddings = get_embeddings(texts, client)
                build_index(chunks, embeddings)
                st.success(f"✅ 已索引 {len(chunks)} 个片段")
                st.cache_data.clear()


@st.cache_data(show_spinner=False)
def _load_index_cached() -> bool:
    """检测索引文件是否存在（触发缓存失效逻辑用）。"""
    return Path("rag/vectorstore.json").exists()


# ── 聊天区 ────────────────────────────────────────────────
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("输入你的问题..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # RAG 检索
    rag_context = ""
    rag_refs: list[dict] = []
    if rag_enabled and Path("rag/vectorstore.json").exists():
        query_emb = get_embeddings([prompt], client)[0]
        if use_rerank:
            from rag.reranker import rerank
            candidates = search(query_emb, top_k=10)
            try:
                rag_refs = rerank(prompt, candidates, top_n=3)
            except Exception as e:
                st.warning(f"重排序失败，回退到余弦检索：{e}")
                rag_refs = candidates[:3]
        else:
            rag_refs = search(query_emb, top_k=3)

        if rag_refs:
            rag_context = "\n\n".join(
                f"[{r['source']}]\n{r['content']}" for r in rag_refs
            )

    sys_content = system_prompt
    if rag_context:
        sys_content += f"\n\n参考以下文档内容回答用户问题，若文档中没有相关信息请如实说明：\n\n{rag_context}"

    messages_with_system = [
        {"role": "system", "content": sys_content}
    ] + st.session_state.messages

    with st.chat_message("assistant"):
        stream = client.chat.completions.create(
            model=model,
            messages=messages_with_system,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
            stream=True,
        )
        response: str = st.write_stream(stream)

        if rag_refs:
            with st.expander("📚 引用来源", expanded=False):
                for ref in rag_refs:
                    score_key = "rerank_score" if "rerank_score" in ref else "score"
                    st.markdown(
                        f"**{ref['source']}** "
                        f"（相关度：{ref.get(score_key, 0):.4f}）\n\n"
                        f"{ref['content'][:200]}..."
                    )
                    st.divider()

    st.session_state.messages.append({"role": "assistant", "content": response})
