import json
import streamlit as st
from openai import OpenAI
from pathlib import Path

from rag.loader import load_and_chunk
from rag.embeddings import get_embeddings
from rag.vectorstore import build_index, search
from tools.weather import get_weather
from tools.news import get_news


@st.cache_resource
def get_client() -> OpenAI:
    return OpenAI(
        api_key=st.secrets["LLM_API_KEY"],
        base_url=st.secrets["LLM_BASE_URL"],
    )


client = get_client()

# ── Function Calling 工具定义 ─────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": (
                "获取指定城市的实时天气数据。"
                "当用户询问天气、气温、湿度、是否下雨等问题时调用。"
                "不用于新闻、搜索或其他话题。"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名（英文），如 Beijing、Shanghai",
                    }
                },
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_news",
            "description": (
                "获取最新新闻资讯。"
                "当用户询问新闻、热点事件、今日头条、最新动态时调用。"
                "不用于天气查询。"
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "enum": ["tech", "general", "world", "finance"],
                        "description": "新闻类别：tech 科技、general 综合、world 国际、finance 财经",
                    }
                },
                "required": [],
            },
        },
    },
]

TOOL_HANDLERS = {
    "get_weather": get_weather,
    "get_news": get_news,
}

st.title("🤖 AI 聊天助手（MCP 新闻版）")

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
    kb_dir = st.text_input("知识库目录", value="oneflower")
    if st.button("🔨 构建索引"):
        with st.spinner("正在构建嵌入索引..."):
            chunks = load_and_chunk(kb_dir)
            if chunks:
                texts = [c["content"] for c in chunks]
                embs = get_embeddings(texts, client)
                build_index(chunks, embs)
                st.success(f"✅ 已索引 {len(chunks)} 个片段")
                st.cache_data.clear()
            else:
                st.error(f"未在 {kb_dir} 找到文档")


# ── 工具结果渲染 ─────────────────────────────────────────

def _render_tool_result(fn_name: str, result: dict) -> None:
    if fn_name == "get_weather":
        cols = st.columns(3)
        cols[0].metric("🌡️ 温度", f"{result['temp']}°C")
        cols[1].metric("🤔 体感", f"{result['feels_like']}°C")
        cols[2].metric("💧 湿度", f"{result['humidity']}%")
    elif fn_name == "get_news":
        items = result.get("items", [])
        for item in items:
            with st.expander(item["title"], expanded=False):
                if item.get("summary"):
                    st.write(item["summary"])
                if item.get("link"):
                    st.markdown(f"[阅读原文]({item['link']})")
                if item.get("pubDate"):
                    st.caption(item["pubDate"])


# ── 聊天区 ────────────────────────────────────────────────
for msg in st.session_state.messages:
    if msg["role"] in ("user", "assistant") and msg.get("content"):
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

if prompt := st.chat_input("输入你的问题..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # RAG 检索
    sys_content = system_prompt
    rag_refs: list[dict] = []
    if rag_enabled and Path("rag/vectorstore.json").exists():
        q_emb = get_embeddings([prompt], client)[0]
        rag_refs = search(q_emb, top_k=3)
        if rag_refs:
            ctx = "\n\n".join(f"[{r['source']}]\n{r['content']}" for r in rag_refs)
            sys_content += f"\n\n参考以下文档内容回答：\n\n{ctx}"

    messages_with_system = [
        {"role": "system", "content": sys_content}
    ] + st.session_state.messages

    # 第1次非流式调用
    first_resp = client.chat.completions.create(
        model=model,
        messages=messages_with_system,
        tools=TOOLS,
        temperature=temperature,
        top_p=top_p,
        max_tokens=max_tokens,
        stream=False,
    )
    choice = first_resp.choices[0]

    if choice.finish_reason == "tool_calls":
        tool_call = choice.message.tool_calls[0]
        fn_name = tool_call.function.name
        fn_args = json.loads(tool_call.function.arguments)

        with st.chat_message("assistant"):
            try:
                result = TOOL_HANDLERS[fn_name](**fn_args)
                _render_tool_result(fn_name, result)
            except RuntimeError as e:
                result = {"error": str(e)}
                st.error(str(e))

        st.session_state.messages.append(choice.message.model_dump(exclude_unset=True))
        st.session_state.messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result, ensure_ascii=False),
        })

        messages_for_second = [
            {"role": "system", "content": sys_content}
        ] + st.session_state.messages

        with st.chat_message("assistant"):
            stream = client.chat.completions.create(
                model=model,
                messages=messages_for_second,
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
                stream=True,
            )
            response: str = st.write_stream(stream)

    else:
        response = choice.message.content or ""
        with st.chat_message("assistant"):
            st.markdown(response)
            if rag_refs:
                with st.expander("📚 引用来源", expanded=False):
                    for ref in rag_refs:
                        st.markdown(
                            f"**{ref['source']}** （相关度：{ref['score']:.4f}）\n\n"
                            f"{ref['content'][:200]}..."
                        )
                        st.divider()

    st.session_state.messages.append({"role": "assistant", "content": response})
