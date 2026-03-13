"""
新闻工具 — MCP 主路径 + RSS 直接抓取降级
"""
import asyncio
import re
import requests

# RSS 源（国内可访问）
RSS_FEEDS: dict[str, str] = {
    "tech":    "https://hnrss.org/frontpage",
    "general": "https://www.oschina.net/news/rss",
    "world":   "https://rss.dw.com/xml/rss-zh-all",
    "finance": "https://36kr.com/feed",
}
MAX_ITEMS = 10

# 一旦 MCP 失败，后续请求不再重试
_mcp_failed = False


# ── 内部辅助 ─────────────────────────────────────────────

def _extract_tag(xml: str, tag: str) -> str:
    m = re.search(
        rf"<{tag}[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))",
        xml, re.I,
    )
    if not m:
        return ""
    return (m.group(1) or m.group(2) or "").strip()


def _parse_rss_xml(xml: str) -> list[dict]:
    items: list[dict] = []
    for m in re.finditer(r"<item[^>]*>([\s\S]*?)</item>", xml, re.I):
        item_xml = m.group(1)
        title = _extract_tag(item_xml, "title")
        link  = _extract_tag(item_xml, "link") or _extract_tag(item_xml, "guid")
        pub   = _extract_tag(item_xml, "pubDate")
        desc  = re.sub(r"<[^>]+>", "", _extract_tag(item_xml, "description"))[:200]
        if title:
            items.append({
                "title":   title,
                "link":    link,
                "pubDate": pub,
                "summary": desc,
            })
        if len(items) >= MAX_ITEMS:
            break
    return items


def _rss_fallback(feed_url: str) -> list[dict]:
    resp = requests.get(
        feed_url, timeout=10, headers={"User-Agent": "aigc-chatbot/2.0"}
    )
    resp.raise_for_status()
    return _parse_rss_xml(resp.text)


async def _mcp_fetch(feed_url: str) -> list[dict]:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    server_params = StdioServerParameters(
        command="npx", args=["-y", "feed-mcp"]
    )
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool("get_feed", {"url": feed_url})
            text = ""
            if hasattr(result, "content"):
                for block in result.content:
                    if hasattr(block, "text"):
                        text += block.text
            return _parse_rss_xml(text)


# ── 公开接口 ──────────────────────────────────────────────

def get_news(topic: str = "general") -> dict:
    """
    获取最新新闻资讯。

    Args:
        topic: "tech" | "general" | "world" | "finance"（默认 general）

    Returns:
        {"topic": str, "source": str, "items": list[{title, link, pubDate, summary}]}
    """
    global _mcp_failed
    feed_url = RSS_FEEDS.get(topic.lower(), RSS_FEEDS["general"])

    if not _mcp_failed:
        try:
            # nest_asyncio 解决 Streamlit/Windows 事件循环嵌套问题
            try:
                import nest_asyncio
                nest_asyncio.apply()
            except ImportError:
                pass
            items = asyncio.run(_mcp_fetch(feed_url))
            if items:
                return {"topic": topic, "source": feed_url, "items": items}
        except Exception as e:
            print(f"[News] MCP 失败，降级到直接 RSS：{e}")
            _mcp_failed = True

    items = _rss_fallback(feed_url)
    return {"topic": topic, "source": feed_url, "items": items}
