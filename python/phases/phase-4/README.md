# Phase 4：Function Calling — 天气查询

本阶段在 Phase 3 基础上，实现 Function Calling 两阶段调用——让 AI 能够主动调用 Python 函数查询实时天气，并以卡片形式展示结果。

## 新增功能

- `tools/weather.py`：调用 wttr.in 获取实时天气（无需 API Key）
- Function Calling 两阶段调用：非流式判断 → 执行工具 → 流式生成文字
- `st.columns` + `st.metric` 温度/体感/湿度卡片展示

## 给 OpenCode 的提示词

```
添加天气查询功能：

1. 创建 tools/weather.py，导出 get_weather(city: str) 函数：
   调用 https://wttr.in/{city}?format=j1，解析返回的 JSON，
   提取 temp_C、FeelsLikeC、humidity、weatherDesc，
   返回 dict，异常时抛出 RuntimeError

2. 修改 app.py，实现 Function Calling 两阶段调用：
   a. 定义 TOOLS 列表，包含 get_weather 的 JSON Schema
   b. 第1次非流式调用，传入 tools 参数
   c. finish_reason == "tool_calls" 时：
      执行 get_weather，用 st.columns(3) + st.metric 展示天气卡片，
      追加 tool 结果消息，第2次流式调用生成文字描述
   d. 否则直接显示第1次的文字回复
```

## 验证清单

- [ ] 「深圳今天天气」返回实时数据，显示温度/体感/湿度卡片
- [ ] 「上海今天冷吗」也能识别城市并查询
- [ ] 「帮我写一首诗」不触发工具，正常聊天
- [ ] 天气工具和 RAG 可以同时开启，互不干扰
