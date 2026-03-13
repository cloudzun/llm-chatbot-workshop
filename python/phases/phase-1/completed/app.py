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

with st.sidebar:
    if st.button("🗑️ 清空对话"):
        st.session_state.messages = []
        st.rerun()

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("输入你的问题..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        stream = client.chat.completions.create(
            model=st.secrets["LLM_DEFAULT_MODEL"],
            messages=st.session_state.messages,
            stream=True,
        )
        response: str = st.write_stream(stream)

    st.session_state.messages.append({"role": "assistant", "content": response})
