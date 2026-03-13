"""
搜索工具 — DuckDuckGo Instant Answer API（无需 Key）
中文查询无结果时降级到必应/百度链接
"""
import re
import requests
from urllib.parse import quote_plus


_DDG_API = "https://api.duckduckgo.com/"
_TIMEOUT = 8


def _is_chinese(text: str) -> bool:
    return bool(re.search(r"[\u4e00-\u9fff]", text))


def search_web(query: str) -> dict:
    """
    搜索互联网获取即时答案。

    Args:
        query: 搜索关键词

    Returns:
        {
          "heading": str,
          "abstract": str,
          "answer": str,
          "definition": str,
          "relatedTopics": [{"text": str, "url": str}],
          "fallback_links": [{"name": str, "url": str}]   # 无结果时提供
        }
    """
    chinese = _is_chinese(query)
    params: dict[str, str] = {
        "q": query,
        "format": "json",
        "no_html": "1",
        "skip_disambig": "1",
    }
    if chinese:
        params["kl"] = "cn-zh"

    result = {
        "heading": "",
        "abstract": "",
        "answer": "",
        "definition": "",
        "relatedTopics": [],
        "fallback_links": [],
    }

    try:
        resp = requests.get(
            _DDG_API, params=params, timeout=_TIMEOUT,
            headers={"User-Agent": "aigc-chatbot/2.0"},
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        result["fallback_links"] = _build_fallbacks(query, chinese)
        result["abstract"] = f"搜索请求失败：{e}"
        return result

    result["heading"]    = data.get("Heading", "")
    result["abstract"]   = data.get("Abstract", "")
    result["answer"]     = data.get("Answer", "")
    result["definition"] = data.get("Definition", "")

    for topic in data.get("RelatedTopics", [])[:5]:
        if isinstance(topic, dict) and topic.get("Text"):
            result["relatedTopics"].append({
                "text": topic["Text"],
                "url":  topic.get("FirstURL", ""),
            })

    # 无实质内容时提供备用链接
    if not result["abstract"] and not result["answer"]:
        result["fallback_links"] = _build_fallbacks(query, chinese)

    return result


def _build_fallbacks(query: str, chinese: bool) -> list[dict]:
    q_enc = quote_plus(query)
    if chinese:
        return [
            {"name": "必应搜索", "url": f"https://cn.bing.com/search?q={q_enc}"},
            {"name": "百度搜索", "url": f"https://www.baidu.com/s?wd={q_enc}"},
        ]
    return [
        {"name": "DuckDuckGo", "url": f"https://duckduckgo.com/?q={q_enc}"},
    ]
