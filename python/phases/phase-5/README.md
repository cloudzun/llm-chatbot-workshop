# Phase 5：MCP 新闻工具

本阶段在 Phase 4 基础上，用 MCP Python SDK 连接 feed-mcp RSS 服务器，实现新闻查询功能，并提供降级机制（直接 RSS 抓取）。

## 新增功能

- `tools/news.py`：MCP 主路径 + RSS 直接降级
- `get_news` 工具加入 TOOLS 列表，AI 自动选择调用时机
- 新闻以 `st.expander` 逐条展示（标题可折叠）

## 前置条件

```bash
# 安装 mcp SDK
pip install mcp

# Windows 若遇到 asyncio 嵌套报错：
pip install nest_asyncio

# 需要 Node.js（供 npx 启动 feed-mcp）
node --version   # 确认已安装
```

## 给 OpenCode 的提示词

```
添加新闻查询功能：

1. pip install mcp（Windows 加 nest_asyncio）

2. 创建 tools/news.py，导出 get_news(topic: str = "general") 函数：
   主路径：用 MCP Python SDK 启动 npx feed-mcp 子进程，
           异步获取 RSS，解析 <item> 标签
   降级：MCP 失败时直接 requests.get RSS URL，正则解析 XML
   RSS 源：hnrss.org(tech) / oschina.net(general) / dw.com(world) / 36kr.com(finance)
   最多返回 10 条

3. 修改 app.py，在 TOOLS 中追加 get_news 工具定义，
   在 _render_tool_result 中用 st.expander 展示每条新闻
```

## 验证清单

- [ ] `pip install mcp` 完成
- [ ] 「今天有什么科技新闻」返回新闻标题列表
- [ ] 展开可见摘要和原文链接
- [ ] 天气和新闻工具共存，AI 正确选择调用对象
- [ ] MCP 失败时自动降级（日志打印降级信息）
