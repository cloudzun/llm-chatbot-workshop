# Phase 6（选修）：联网搜索 + 智能降级

本阶段在 Phase 5 基础上，添加 DuckDuckGo Instant Answer 搜索工具，实现四工具协作（天气 / 新闻 / 搜索 / RAG），并处理中文查询无结果时的降级逻辑。

## 新增功能

- `tools/search.py`：DDG Instant Answer API（无需 Key）
- 中文查询无结果时返回必应/百度备用链接
- `search_web` 加入 TOOLS 列表，结果用 `st.expander` 展示

## 给 OpenCode 的提示词

```
创建 tools/search.py，导出 search_web(query: str) 函数：
- 调用 https://api.duckduckgo.com/?q={query}&format=json&no_html=1
- 中文查询附加 kl=cn-zh
- 提取 Heading、Abstract、Answer、Definition、RelatedTopics 前5条
- 无内容时（中文）返回必应和百度链接；（英文）返回 DuckDuckGo 链接

修改 app.py：在 TOOLS 列表中追加 search_web 工具，
description 要说明什么时候用它（知识/定义），什么时候不用（天气/新闻）。
搜索结果用 st.expander 展示摘要和相关链接。
```

## 四工具测试矩阵

| 问题 | 期望工具 | 通过 |
|------|---------|------|
| 「深圳今天天气」 | get_weather | |
| 「今日财经新闻」 | get_news | |
| 「什么是量子纠缠」 | search_web | |
| 「帮我写一首诗」 | 无工具，直接回答 | |
| 「易速鲜花如何保鲜」（开启RAG） | RAG 检索 | |

## 验证清单

- [ ] 「什么是量子纠缠」返回搜索摘要或备用链接
- [ ] 中文查询无结果时显示必应/百度链接（可点击）
- [ ] 四个工具共存，AI 正确派发到对应工具
- [ ] 打开 RAG 同时关注一条新闻，两者互不干扰
