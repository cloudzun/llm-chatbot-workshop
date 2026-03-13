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

    # TODO 1: st.divider() 分隔线

    # TODO 2: st.subheader("⚙️ 模型参数")

    # TODO 3: st.selectbox 选择模型，选项：
    #   "deepseek-ai/DeepSeek-V3"（默认）
    #   "Qwen/Qwen2.5-7B-Instruct"
    #   "deepseek-ai/DeepSeek-R1"

    # TODO 4: st.slider temperature，范围 0.0-2.0，默认 0.7，步长 0.05
    #         在滑块下加 st.caption("越高越有创意，越低越严谨")

    # TODO 5: st.slider top_p，范围 0.0-1.0，默认 0.9

    # TODO 6: st.number_input max_tokens，范围 64-4096，默认 1024

    # TODO 7: st.divider() + st.text_area system_prompt，
    #         默认值 "你是一个友好的 AI 助手。"，height=100

# ── 聊天区 ────────────────────────────────────────────────
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

if prompt := st.chat_input("输入你的问题..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # TODO 8: 构造包含 system 消息的完整 messages 列表
    #         [{"role": "system", "content": system_prompt}] + st.session_state.messages

    with st.chat_message("assistant"):
        # TODO 9: 调用 client.chat.completions.create，
        #         传入 model, temperature, top_p, max_tokens 和上面构造的 messages
        pass

    # TODO 10: 将 AI 回复追加到 session_state.messages
