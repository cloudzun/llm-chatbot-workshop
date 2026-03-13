# Phase 1：基础聊天应用

本阶段目标：用 Streamlit + OpenAI SDK 实现一个支持流式输出的多轮对话聊天界面。

## 学习目标

- 理解 Streamlit 的执行模型（每次交互重新运行脚本）
- 掌握 `st.session_state` 的作用（保持跨次执行的状态）
- 实现流式输出（逐字显示 AI 回复）
- 用 `st.secrets` 安全管理 API Key

## 目录结构

```
phase-1/
├── starter/        # 学员起始代码（TODO 注释版）
│   ├── app.py
│   ├── requirements.txt
│   └── .streamlit/
│       └── secrets.toml.example
└── completed/      # 完整参考实现
    ├── app.py
    ├── requirements.txt
    └── .streamlit/
        └── secrets.toml.example
```

## 快速开始

```bash
# 复制 secrets 模板，填入真实 API Key
cp .streamlit/secrets.toml.example .streamlit/secrets.toml

# 安装依赖
pip install -r requirements.txt

# 运行（在 starter/ 或 completed/ 目录下执行）
streamlit run app.py
```

## 给 OpenCode 的提示词

**初始化项目**：
```
帮我创建一个 Python 项目，目录名为 aigc-chatbot-python。
创建以下文件：
- requirements.txt，包含 streamlit>=1.35 和 openai>=1.0
- .streamlit/secrets.toml，包含：
    LLM_API_KEY = "sk-xxx"
    LLM_BASE_URL = "https://api.siliconflow.cn/v1"
    LLM_DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3"
- .gitignore，加入 .streamlit/secrets.toml 和 __pycache__/
然后运行 pip install -r requirements.txt 安装依赖。
```

**创建应用**：
```
创建 app.py，用 Streamlit 实现一个 AI 聊天应用：
1. 用 openai 库连接 st.secrets 中配置的 LLM，base_url 设为 LLM_BASE_URL
2. 用 st.chat_message 显示对话历史，区分 user 和 assistant 角色
3. 用 st.chat_input 接收用户输入
4. 调用 chat.completions.create（stream=True），用 st.write_stream 逐字显示
5. 用 st.session_state 维护对话历史列表（每条含 role 和 content）
6. 侧边栏加「清空对话」按钮，点击后清空 session_state.messages
```

## 验证清单

- [ ] `streamlit run app.py` 启动无报错
- [ ] 聊天界面正常显示
- [ ] 输入消息后 AI 逐字回复（流式）
- [ ] 多轮对话上下文保持（AI 能记住上一句）
- [ ] 清空对话按钮生效

## 关键知识点

| 知识点 | 说明 |
|--------|------|
| `@st.cache_resource` | 缓存 OpenAI 客户端，避免每次交互重复创建连接 |
| `st.session_state` | Streamlit 重新运行时保持状态的机制 |
| `st.write_stream()` | 内置处理 OpenAI stream 响应，自动流式渲染 |
| `st.secrets` | 从 `.streamlit/secrets.toml` 读取配置，密钥不写死在代码里 |
