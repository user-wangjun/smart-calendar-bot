/**
 * 体感温度计算器
 * 根据温度、湿度、风速计算体感温度
 */

/**
 * 计算体感温度
 * 综合使用风热指数和湿热指数，根据温度范围选择合适的公式
 *
 * @param {number} temperature - 气温（摄氏度）
 * @param {number} humidity - 相对湿度（%）
 * @param {number} windSpeed - 风速（km/h，可选，默认0）
 * @returns {number} 体感温度（摄氏度）
 */
export function calculateFeelsLike (temperature, humidity, windSpeed = 0) {
  // 参数校验
  if (temperature == null || humidity == null) {
    return null;
  }

  const T = parseFloat(temperature);
  const R = parseFloat(humidity);
  const V = parseFloat(windSpeed) || 0;

  if (isNaN(T) || isNaN(R)) {
    return null;
  }

  // 根据温度选择合适的计算公式
  if (T <= 10 && V > 5) {
    // 低温环境：使用风热指数（Wind Chill）
    return calculateWindChill(T, V);
  } else if (T >= 27 && R >= 40) {
    // 高温高湿环境：使用湿热指数（Heat Index）
    return calculateHeatIndex(T, R);
  } else {
    // 一般环境：使用简化综合公式
    return calculateGeneralFeelsLike(T, R, V);
  }
}

/**
 * 风热指数计算（Wind Chill）
 * 适用于低温有风环境
 *
 * @param {number} T - 气温（摄氏度）
 * @param {number} V - 风速（km/h）
 * @returns {number} 体感温度
 */
function calculateWindChill (T, V) {
  // 风速必须 >= 5 km/h 且温度 <= 10°C
  if (V < 5 || T > 10) {
    return T;
  }

  // 加拿大环境部风热指数公式
  const feelsLike = 13.12 +
    0.6215 * T -
    11.37 * Math.pow(V, 0.16) +
    0.3965 * T * Math.pow(V, 0.16);

  return Math.round(feelsLike * 10) / 10;
}

/**
 * 湿热指数计算（Heat Index）
 * 适用于高温高湿环境
 *
 * @param {number} T - 气温（摄氏度）
 * @param {number} R - 相对湿度（%）
 * @returns {number} 体感温度
 */
function calculateHeatIndex (T, R) {
  // 转换为华氏度（原始公式使用华氏度）
  const Tf = T * 9 / 5 + 32;

  // 简化湿热指数公式
  let feelsLikeF = 0.5 * (Tf + 61.0 + ((Tf - 68.0) * 1.2) + (R * 0.094));

  // 如果温度>=80°F且湿度>=40%，使用完整公式
  if (Tf >= 80 && R >= 40) {
    feelsLikeF = -42.379 +
      2.04901523 * Tf +
      10.14333127 * R -
      0.22475541 * Tf * R -
      6.83783e-3 * Tf * Tf -
      5.481717e-2 * R * R +
      1.22874e-3 * Tf * Tf * R +
      8.5282e-4 * Tf * R * R -
      1.99e-6 * Tf * Tf * R * R;

    // 调整项
    if (R < 13 && Tf >= 80 && Tf <= 112) {
      const adjustment = ((13 - R) / 4) * Math.sqrt((17 - Math.abs(Tf - 95)) / 17);
      feelsLikeF -= adjustment;
    } else if (R > 85 && Tf >= 80 && Tf <= 87) {
      const adjustment = ((R - 85) / 10) * ((87 - Tf) / 5);
      feelsLikeF += adjustment;
    }
  }

  // 转换回摄氏度
  const feelsLikeC = (feelsLikeF - 32) * 5 / 9;
  return Math.round(feelsLikeC * 10) / 10;
}

/**
 * 一般环境体感温度计算
 * 使用简化的综合公式
 *
 * @param {number} T - 气温（摄氏度）
 * @param {number} R - 相对湿度（%）
 * @param {number} V - 风速（km/h）
 * @returns {number} 体感温度
 */
function calculateGeneralFeelsLike (T, R, V) {
  // 湿度修正：湿度越高，体感温度越高（夏季）或越低（冬季）
  let humidityEffect = 0;
  if (T > 20) {
    // 夏季：湿度增加体感温度
    humidityEffect = (R - 50) * 0.02;
  } else if (T < 10) {
    // 冬季：湿度降低体感温度（湿冷）
    humidityEffect = (R - 50) * (-0.01);
  }

  // 风速修正：风速越大，体感温度越低
  let windEffect = 0;
  if (V > 5) {
    windEffect = -Math.pow(V, 0.5) * 0.3;
  }

  // 综合计算
  const feelsLike = T + humidityEffect + windEffect;

  return Math.round(feelsLike * 10) / 10;
}

/**
 * 根据风力等级估算风速
 * 中国气象部门采用的风力等级标准
 *
 * @param {string} windPower - 风力等级（如 "3级"、"4-5级"）
 * @returns {number} 风速（km/h）
 */
export function parseWindSpeedFromPower (windPower) {
  if (!windPower) return 0;

  // 提取数字
  const match = windPower.match(/(\d+)(?:-(\d+))?/);
  if (!match) return 0;

  const minLevel = parseInt(match[1]);
  const maxLevel = match[2] ? parseInt(match[2]) : minLevel;
  const avgLevel = (minLevel + maxLevel) / 2;

  // 风力等级对应风速（km/h）的近似值
  // 0级: 0-1 km/h, 1级: 1-5 km/h, 2级: 6-11 km/h, 3级: 12-19 km/h
  // 4级: 20-28 km/h, 5级: 29-38 km/h, 6级: 39-49 km/h
  const windSpeedMap = {
    0: 0, // 无风
    1: 3, // 软风
    2: 8, // 轻风
    3: 15, // 微风
    4: 24, // 和风
    5: 33, // 清风
    6: 44, // 强风
    7: 55, // 疾风
    8: 66, // 大风
    9: 77, // 烈风
    10: 88, // 狂风
    11: 99, // 暴风
    12: 110 // 飓风
  };

  return windSpeedMap[Math.floor(avgLevel)] || 0;
}

/**
 * 获取体感温度描述
 *
 * @param {number} feelsLike - 体感温度
 * @returns {string} 描述文字
 */
export function getFeelsLikeDescription (feelsLike) {
  if (feelsLike == null) return '';

  if (feelsLike <= -20) return '极寒';
  if (feelsLike <= -10) return '寒冷';
  if (feelsLike <= 0) return '很冷';
  if (feelsLike <= 10) return '冷';
  if (feelsLike <= 15) return '凉爽';
  if (feelsLike <= 20) return '舒适';
  if (feelsLike <= 26) return '温暖';
  if (feelsLike <= 30) return '热';
  if (feelsLike <= 35) return '炎热';
  return '酷热';
}

export default {
  calculateFeelsLike,
  parseWindSpeedFromPower,
  getFeelsLikeDescription
};
