import json
import streamlit as st
from openai import OpenAI
from pathlib import Path

# Phase 3 代码基础上继续（省略相同部分）

@st.cache_resource
def get_client():
    return OpenAI(
        api_key=st.secrets["LLM_API_KEY"],
        base_url=st.secrets["LLM_BASE_URL"],
    )

client = get_client()

# TODO 1: 创建 tools/weather.py，导出 get_weather(city: str) 函数
#         调用 https://wttr.in/{city}?format=j1，解析 temp_C/FeelsLikeC/humidity/weatherDesc

# TODO 2: 在这里定义 TOOLS 列表（Function Calling 工具 JSON Schema）
#   [{
#     "type": "function",
#     "function": {
#       "name": "get_weather",
#       "description": "...",
#       "parameters": {...}
#     }
#   }]
TOOLS = []  # 替换这行

# TODO 3: TOOL_HANDLERS = {"get_weather": get_weather}
TOOL_HANDLERS = {}  # 替换这行

st.title("🤖 AI 聊天助手（天气版）")

if "messages" not in st.session_state:
    st.session_state.messages = []

# sidebar（参考 Phase 3 代码）...

for msg in st.session_state.messages:
    if msg["role"] in ("user", "assistant") and msg.get("content"):
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

if prompt := st.chat_input("输入你的问题..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    system_prompt = "你是一个友好的 AI 助手。"
    messages_with_system = [{"role": "system", "content": system_prompt}] + st.session_state.messages

    # TODO 4: 第1次调用（非流式），传入 tools=TOOLS，stream=False
    first_resp = None  # 替换这行

    # TODO 5: 检查 choice.finish_reason
    #   若 == "tool_calls"：
    #     a. 解析 tool_call.function.name 和 arguments（json.loads）
    #     b. 调用对应处理函数
    #     c. 用 st.columns(3) + st.metric 展示天气卡片
    #     d. 追加 assistant 消息（含 tool_calls）和 tool 结果消息
    #     e. 第2次流式调用生成自然语言回复
    #   否则：
    #     直接显示第1次的文字回复（st.markdown）

    pass  # 替换为实际逻辑
