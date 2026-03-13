import streamlit as st
from openai import OpenAI


@st.cache_resource
def get_client() -> OpenAI:
    return OpenAI(
        api_key=st.secrets["LLM_API_KEY"],
        base_url=st.secrets["LLM_BASE_URL"],
    )


client = get_client()

st.title("🤖 AI 聊天助手")

if "messages" not in st.session_state:
    st.session_state.messages: list[dict] = []

# ── 侧边栏 ────────────────────────────────────────────────
with st.sidebar:
    if st.button("🗑️ 清空对话"):
        st.session_state.messages = []
        st.rerun()

    st.divider()
    st.subheader("⚙️ 模型参数")

    model = st.selectbox(
        "模型",
        [
            "deepseek-ai/DeepSeek-V3",
            "Qwen/Qwen2.5-7B-Instruct",
            "deepseek-ai/DeepSeek-R1",
        ],
    )

    temperature = st.slider("Temperature", 0.0, 2.0, 0.7, 0.05)
    st.caption("越高越有创意，越低越严谨")

    top_p = st.slider("Top-P", 0.0, 1.0, 0.9, 0.05)
    max_tokens = st.number_input("Max Tokens", 64, 4096, 1024)

    st.divider()
    system_prompt = st.text_area(
        "System Prompt", "你是一个友好的 AI 助手。", height=100
    )

# ── 聊天区 ────────────────────────────────────────────────
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("输入你的问题..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    messages_with_system = [
        {"role": "system", "content": system_prompt}
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

    st.session_state.messages.append({"role": "assistant", "content": response})
