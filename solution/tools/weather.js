/**
 * tools/weather.js
 * Phase 4 — 天气查询工具（wttr.in，免费无需 API Key）
 */

/**
 * 查询城市当前天气
 * @param {string} city  城市名称（英文效果最佳）
 * @returns {Promise<object>}  格式化天气信息
 */
export async function getWeather(city) {
  if (!city?.trim()) throw new Error('城市名称不能为空');

  const url = `https://wttr.in/${encodeURIComponent(city.trim())}?format=j1`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'aigc-chatbot/1.0' },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`wttr.in 请求失败 (${response.status})，城市名可能不正确`);
  }

  const data = await response.json();
  const current = data.current_condition?.[0];
  if (!current) throw new Error('天气数据解析失败');

  // 优先使用中文描述，回退到英文
  const desc =
    current.lang_zh?.[0]?.value ||
    current.weatherDesc?.[0]?.value ||
    '未知';

  return {
    city,
    temperature:      `${current.temp_C}°C`,
    feelsLike:        `${current.FeelsLikeC}°C`,
    weather:          desc,
    humidity:         `${current.humidity}%`,
    windSpeed:        `${current.windspeedKmph} km/h`,
    visibility:       `${current.visibility} km`,
    uvIndex:          current.uvIndex,
    observation_time: current.observation_time
  };
}
