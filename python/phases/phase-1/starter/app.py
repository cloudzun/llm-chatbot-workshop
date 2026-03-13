import streamlit as st

# TODO 1: 在这里导入 openai 库的 OpenAI 类

# TODO 2: 用 @st.cache_resource 创建一个 get_client() 函数，
#          从 st.secrets 读取 API Key 和 base_url 并返回 OpenAI 客户端
#          （@st.cache_resource 确保客户端只创建一次）

# TODO 3: 调用 get_client() 获取 client 对象

st.title("🤖 AI 聊天助手")

# TODO 4: 用 st.session_state 初始化消息列表
#         提示：if "messages" not in st.session_state: ...

# TODO 5: 在 st.sidebar 中加「🗑️ 清空对话」按钮
#         点击后清空 st.session_state.messages，然后 st.rerun()

# TODO 6: 遍历 st.session_state.messages，用 st.chat_message 渲染每条历史消息

# TODO 7: 用 st.chat_input("输入你的问题...") 接收用户输入
#         （用 if prompt := st.chat_input(...): 语法）
#         a. 把用户消息追加到 session_state.messages
#         b. 用 st.chat_message("user") 显示用户消息
#         c. 在 st.chat_message("assistant") 内调用 client.chat.completions.create(stream=True)
#         d. 用 st.write_stream() 显示流式输出
#         e. 把 AI 回复追加到 session_state.messages
