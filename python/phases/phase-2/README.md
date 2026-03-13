# Phase 2：参数调优面板

本阶段在 Phase 1 基础上，为侧边栏添加模型参数控制面板，让学员直观感受不同参数对 AI 行为的影响。

## 新增功能

- 模型选择（DeepSeek-V3 / Qwen2.5-7B / DeepSeek-R1）
- Temperature 滑块（0.0 - 2.0）
- Top-P 滑块（0.0 - 1.0）
- Max Tokens 数字输入（64 - 4096）
- System Prompt 文本框（角色设定）

## 给 OpenCode 的提示词

```
在 app.py 的侧边栏"清空对话"按钮下方添加参数调优面板，用 st.divider 分隔：
1. st.subheader("⚙️ 模型参数")
2. st.selectbox 模型选择，选项：
   - "deepseek-ai/DeepSeek-V3"（默认）
   - "Qwen/Qwen2.5-7B-Instruct"（免费）
   - "deepseek-ai/DeepSeek-R1"（推理增强）
3. st.slider temperature，范围 0.0-2.0，默认 0.7，
   在滑块下加说明文字"越高越有创意，越低越严谨"
4. st.slider top_p，范围 0.0-1.0，默认 0.9
5. st.number_input max_tokens，范围 64-4096，默认 1024
6. st.divider 分隔后 st.text_area system_prompt，
   默认值"你是一个友好的 AI 助手。"，高度 100px
7. 将以上所有参数传入 chat.completions.create 调用中
```

## 验证清单

- [ ] 侧边栏所有控件正常显示、可交互
- [ ] temperature=0 时多次问同一问题，回答高度一致
- [ ] temperature=1.5 时回答明显更多样
- [ ] 切换到 DeepSeek-R1 可看到推理标记（如有）
- [ ] 修改 System Prompt 后 AI 行为变化（如设为"你是个诗人"）
