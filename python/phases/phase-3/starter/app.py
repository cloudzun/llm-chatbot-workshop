import streamlit as st
from openai import OpenAI

# Phase 2 代码（略去重复部分，仅标注 RAG 相关 TODO）
# 可从 phase-2/starter/app.py 复制后在此处继续

@st.cache_resource
def get_client():
    return OpenAI(
        api_key=st.secrets["LLM_API_KEY"],
        base_url=st.secrets["LLM_BASE_URL"],
    )

client = get_client()
st.title("🤖 AI 聊天助手（RAG 版）")

if "messages" not in st.session_state:
    st.session_state.messages = []

with st.sidebar:
    if st.button("🗑️ 清空对话"):
        st.session_state.messages = []
        st.rerun()
    # ... Phase 2 参数面板 ...

    # TODO 1: st.divider() + st.subheader("📚 知识库设置")

    # TODO 2: st.toggle "开启知识库模式" → rag_enabled

    # TODO 3: st.text_input 知识库目录，默认 "oneflower"

    # TODO 4: st.button "🔨 构建索引"
    #   点击后：
    #   a. 调用 load_and_chunk(kb_dir) 加载文档
    #   b. 用 st.spinner 显示等待提示
    #   c. 调用 get_embeddings(texts, client) 获取向量
    #   d. 调用 build_index(chunks, embeddings) 保存
    #   e. st.success 显示索引了多少片段

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("输入你的问题..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # TODO 5: 若 rag_enabled 且索引文件存在：
    #   a. 调用 get_embeddings([prompt], client)[0] 获取查询向量
    #   b. 调用 search(query_emb, top_k=3) 检索相关片段
    #   c. 拼接片段内容，追加到 system_prompt 中

    # TODO 6: 调用 client.chat.completions.create（流式）

    # TODO 7: AI 回复后若有 rag_refs，用 st.expander 显示每个片段的来源和分数
    pass
