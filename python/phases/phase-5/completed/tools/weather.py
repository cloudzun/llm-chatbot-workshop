"""
天气查询工具（从 Phase 4 复制）
"""
import requests


def get_weather(city: str) -> dict:
    url = f"https://wttr.in/{city}?format=j1"
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "aigc-chatbot/2.0"})
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        raise RuntimeError(f"天气查询失败（{city}）：{e}") from e

    try:
        current = data["current_condition"][0]
        return {
            "city": city,
            "temp": int(current["temp_C"]),
            "feels_like": int(current["FeelsLikeC"]),
            "humidity": int(current["humidity"]),
            "description": current["weatherDesc"][0]["value"],
        }
    except (KeyError, IndexError, ValueError) as e:
        raise RuntimeError(f"天气数据解析失败：{e}") from e
