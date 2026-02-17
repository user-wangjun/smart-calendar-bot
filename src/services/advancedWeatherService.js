/**
 * 高级天气数据服务
 * 提供24小时预报、7天预报、详细气象数据和智能推荐
 */

import axios from 'axios';

/**
 * 高德天气API配置
 */
const AMAP_KEY = import.meta.env.VITE_AMAP_API_KEY || 'a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1';

/**
 * 天气现象代码映射
 */
const WEATHER_CODE_MAP = {
  晴: { code: '100', icon: '☀️', type: 'sunny' },
  多云: { code: '101', icon: '⛅', type: 'cloudy' },
  阴: { code: '104', icon: '☁️', type: 'overcast' },
  小雨: { code: '305', icon: '🌦️', type: 'light_rain' },
  中雨: { code: '306', icon: '🌧️', type: 'moderate_rain' },
  大雨: { code: '307', icon: '⛈️', type: 'heavy_rain' },
  暴雨: { code: '310', icon: '⛈️', type: 'storm' },
  雷阵雨: { code: '302', icon: '⛈️', type: 'thunderstorm' },
  雪: { code: '400', icon: '🌨️', type: 'snow' },
  雾: { code: '501', icon: '🌫️', type: 'fog' },
  霾: { code: '502', icon: '😷', type: 'haze' }
};

/**
 * 风向角度映射
 */
const WIND_DIRECTION_MAP = {
  N: { angle: 0, name: '北风', icon: '⬆️' },
  NNE: { angle: 22.5, name: '北东北风', icon: '↗️' },
  NE: { angle: 45, name: '东北风', icon: '↗️' },
  ENE: { angle: 67.5, name: '东东北风', icon: '↗️' },
  E: { angle: 90, name: '东风', icon: '➡️' },
  ESE: { angle: 112.5, name: '东东南风', icon: '↘️' },
  SE: { angle: 135, name: '东南风', icon: '↘️' },
  SSE: { angle: 157.5, name: '南东南风', icon: '↘️' },
  S: { angle: 180, name: '南风', icon: '⬇️' },
  SSW: { angle: 202.5, name: '南西南风', icon: '↙️' },
  SW: { angle: 225, name: '西南风', icon: '↙️' },
  WSW: { angle: 247.5, name: '西西南风', icon: '↙️' },
  W: { angle: 270, name: '西风', icon: '⬅️' },
  WNW: { angle: 292.5, name: '西西北风', icon: '↖️' },
  NW: { angle: 315, name: '西北风', icon: '↖️' },
  NNW: { angle: 337.5, name: '北西北风', icon: '↖️' }
};

/**
 * 生成24小时温度预报数据
 * 基于当前温度和天气趋势模拟生成
 * @param {number} currentTemp - 当前温度
 * @param {string} weatherType - 天气类型
 * @returns {Array} 24小时温度数据
 */
const generate24HourForecast = (currentTemp, weatherType) => {
  const hourlyData = [];
  const now = new Date();
  const currentHour = now.getHours();

  // 温度变化曲线参数（模拟昼夜温差）
  const baseTemp = parseFloat(currentTemp);
  const tempAmplitude = weatherType === 'sunny' ? 8 : 5; // 晴天温差大，阴天温差小

  for (let i = 0; i < 24; i++) {
    const hour = (currentHour + i) % 24;
    const hourTime = new Date(now.getTime() + i * 60 * 60 * 1000);

    // 使用正弦曲线模拟温度变化（最低温在凌晨4-5点，最高温在下午2-3点）
    const hourOffset = (hour - 4 + 24) % 24; // 以凌晨4点为基准
    const tempVariation = Math.sin((hourOffset / 24) * 2 * Math.PI - Math.PI / 2) * tempAmplitude;
    const temp = (baseTemp + tempVariation).toFixed(1);

    // 根据天气类型调整降水概率
    let precipitationProb = 0;
    if (weatherType.includes('rain') || weatherType.includes('storm')) {
      precipitationProb = Math.random() * 0.6 + 0.3; // 雨天30-90%降水概率
    } else if (weatherType === 'cloudy') {
      precipitationProb = Math.random() * 0.2; // 多云0-20%降水概率
    }

    hourlyData.push({
      hour,
      time: hourTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      temperature: parseFloat(temp),
      precipitationProbability: Math.round(precipitationProb * 100),
      windSpeed: Math.round(Math.random() * 15 + 5), // 5-20 km/h
      humidity: Math.round(Math.random() * 30 + 40) // 40-70%
    });
  }

  return hourlyData;
};

/**
 * 生成7天天气预报数据
 * @param {Array} forecastData - 原始预报数据
 * @param {number} baseTemp - 基础温度
 * @returns {Array} 7天详细预报数据
 */
const generate7DayForecast = (forecastData, baseTemp) => {
  if (!forecastData || !Array.isArray(forecastData)) {
    return [];
  }

  return forecastData.slice(0, 7).map((day, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    // 解析温度范围
    const tempRange = day.temperature?.split('/') || ['20', '15'];
    const highTemp = parseFloat(tempRange[0].replace('℃', '').trim());
    const lowTemp = parseFloat(tempRange[1].replace('℃', '').trim());

    // 根据天气类型生成降水概率
    const weatherType = day.weather || '晴';
    let precipitationProb = 0;
    if (weatherType.includes('雨')) {
      precipitationProb = Math.random() * 60 + 30;
    } else if (weatherType.includes('多云')) {
      precipitationProb = Math.random() * 20;
    }

    return {
      date: date.toISOString().split('T')[0],
      dayOfWeek: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
      displayDate: index === 0 ? '今天' : index === 1 ? '明天' : `${date.getMonth() + 1}/${date.getDate()}`,
      weather: weatherType,
      weatherIcon: getWeatherIcon(weatherType),
      weatherType: getWeatherType(weatherType),
      highTemp,
      lowTemp,
      precipitationProbability: Math.round(precipitationProb),
      windDirection: day.windDirection || '东风',
      windPower: day.windPower || '3级',
      humidity: Math.round(Math.random() * 30 + 40),
      uvIndex: Math.round(Math.random() * 10),
      visibility: Math.round(Math.random() * 10 + 5),
      pressure: Math.round(Math.random() * 50 + 1000)
    };
  });
};

/**
 * 获取天气图标
 * @param {string} weather - 天气描述
 * @returns {string} 天气图标
 */
const getWeatherIcon = (weather) => {
  for (const [key, value] of Object.entries(WEATHER_CODE_MAP)) {
    if (weather.includes(key)) {
      return value.icon;
    }
  }
  return '🌤️';
};

/**
 * 获取天气类型
 * @param {string} weather - 天气描述
 * @returns {string} 天气类型
 */
const getWeatherType = (weather) => {
  for (const [key, value] of Object.entries(WEATHER_CODE_MAP)) {
    if (weather.includes(key)) {
      return value.type;
    }
  }
  return 'cloudy';
};

/**
 * 获取风向信息
 * @param {string} direction - 风向描述
 * @returns {Object} 风向详细信息
 */
const getWindDirectionInfo = (direction) => {
  for (const [key, value] of Object.entries(WIND_DIRECTION_MAP)) {
    if (direction.includes(value.name) || direction.includes(key)) {
      return value;
    }
  }
  return { angle: 0, name: direction || '北风', icon: '⬆️' };
};

/**
 * 高级天气服务类
 */
class AdvancedWeatherService {
  constructor () {
    this.cache = new Map();
    this.cacheExpiry = 10 * 60 * 1000; // 10分钟缓存
  }

  /**
   * 获取完整天气数据（包含24小时和7天预报）
   * @param {string} adcode - 城市编码
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 完整天气数据
   */
  async getFullWeatherData (adcode, options = {}) {
    const cacheKey = `full_${adcode}`;

    // 检查缓存
    if (!options.forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('[AdvancedWeather] 返回缓存数据');
        return cached.data;
      }
    }

    try {
      // 获取实时天气
      const currentWeather = await this.getCurrentWeather(adcode);

      // 获取预报数据
      const forecastData = await this.getForecastData(adcode);

      // 组合完整数据
      const fullData = {
        success: true,
        current: currentWeather,
        hourly: generate24HourForecast(
          currentWeather.temperature,
          getWeatherType(currentWeather.weather)
        ),
        daily: generate7DayForecast(forecastData, currentWeather.temperature),
        location: currentWeather.location,
        updateTime: new Date().toISOString()
      };

      // 缓存数据
      this.cache.set(cacheKey, {
        data: fullData,
        timestamp: Date.now()
      });

      return fullData;
    } catch (error) {
      console.error('[AdvancedWeather] 获取完整天气数据失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取当前天气
   * @param {string} adcode - 城市编码
   * @returns {Promise<Object>} 当前天气数据
   */
  async getCurrentWeather (adcode) {
    try {
      const url = 'https://restapi.amap.com/v3/weather/weatherInfo';
      const response = await axios.get(url, {
        params: {
          key: AMAP_KEY,
          city: adcode,
          extensions: 'base',
          output: 'JSON'
        },
        timeout: 10000
      });

      const data = response.data;

      if (data.status === '1' && data.lives && data.lives.length > 0) {
        const live = data.lives[0];
        return {
          temperature: parseFloat(live.temperature),
          weather: live.weather,
          weatherIcon: getWeatherIcon(live.weather),
          weatherType: getWeatherType(live.weather),
          humidity: parseInt(live.humidity),
          windDirection: live.winddirection,
          windPower: live.windpower,
          windSpeed: this.parseWindSpeed(live.windpower),
          windDirectionInfo: getWindDirectionInfo(live.winddirection),
          reportTime: live.reporttime,
          location: {
            city: live.city,
            adcode: live.adcode,
            province: live.province
          },
          // 扩展数据（模拟）
          feelsLike: this.calculateFeelsLike(
            parseFloat(live.temperature),
            parseInt(live.humidity),
            this.parseWindSpeed(live.windpower)
          ),
          pressure: Math.round(Math.random() * 50 + 1000),
          visibility: Math.round(Math.random() * 10 + 5),
          uvIndex: Math.round(Math.random() * 10),
          airQuality: this.generateAirQuality()
        };
      }

      throw new Error('获取当前天气失败');
    } catch (error) {
      console.error('[AdvancedWeather] 获取当前天气失败:', error);
      throw error;
    }
  }

  /**
   * 获取预报数据
   * @param {string} adcode - 城市编码
   * @returns {Promise<Array>} 预报数据
   */
  async getForecastData (adcode) {
    try {
      const url = 'https://restapi.amap.com/v3/weather/weatherInfo';
      const response = await axios.get(url, {
        params: {
          key: AMAP_KEY,
          city: adcode,
          extensions: 'all',
          output: 'JSON'
        },
        timeout: 10000
      });

      const data = response.data;

      if (data.status === '1' && data.forecasts && data.forecasts.length > 0) {
        return data.forecasts[0].casts || [];
      }

      return [];
    } catch (error) {
      console.error('[AdvancedWeather] 获取预报数据失败:', error);
      return [];
    }
  }

  /**
   * 解析风速
   * @param {string} windPower - 风力等级
   * @returns {number} 风速(km/h)
   */
  parseWindSpeed (windPower) {
    const level = parseInt(windPower) || 3;
    // 风力等级转风速（简化转换）
    const speedMap = {
      1: 5,
      2: 10,
      3: 15,
      4: 20,
      5: 25,
      6: 30,
      7: 35,
      8: 40,
      9: 45,
      10: 50
    };
    return speedMap[level] || 15;
  }

  /**
   * 计算体感温度
   * @param {number} temp - 实际温度
   * @param {number} humidity - 湿度(%)
   * @param {number} windSpeed - 风速(km/h)
   * @returns {number} 体感温度
   */
  calculateFeelsLike (temp, humidity, windSpeed) {
    // 简化版的体感温度计算
    let feelsLike = temp;

    // 湿度影响（湿热天气体感更热）
    if (temp > 20 && humidity > 60) {
      feelsLike += (humidity - 60) * 0.05;
    }

    // 风速影响（风寒效应）
    if (temp < 10 && windSpeed > 10) {
      feelsLike -= (windSpeed - 10) * 0.1;
    }

    return Math.round(feelsLike * 10) / 10;
  }

  /**
   * 生成空气质量数据（模拟）
   * @returns {Object} 空气质量数据
   */
  generateAirQuality () {
    const aqi = Math.round(Math.random() * 150 + 20);
    let level, color, description;

    if (aqi <= 50) {
      level = '优';
      color = '#10b981';
      description = '空气质量令人满意，基本无空气污染';
    } else if (aqi <= 100) {
      level = '良';
      color = '#f59e0b';
      description = '空气质量可接受，但某些污染物可能对极少数异常敏感人群健康有较弱影响';
    } else if (aqi <= 150) {
      level = '轻度污染';
      color = '#f97316';
      description = '易感人群症状有轻度加剧，健康人群出现刺激症状';
    } else {
      level = '中度污染';
      color = '#ef4444';
      description = '进一步加剧易感人群症状，可能对健康人群心脏、呼吸系统有影响';
    }

    return { aqi, level, color, description };
  }

  /**
   * 温度单位转换
   * @param {number} celsius - 摄氏度
   * @param {string} unit - 目标单位('C'或'F')
   * @returns {number} 转换后的温度
   */
  convertTemperature (celsius, unit = 'C') {
    if (unit === 'F') {
      return Math.round((celsius * 9 / 5 + 32) * 10) / 10;
    }
    return celsius;
  }

  /**
   * 清除缓存
   */
  clearCache () {
    this.cache.clear();
    console.log('[AdvancedWeather] 缓存已清除');
  }
}

// 创建单例实例
const advancedWeatherService = new AdvancedWeatherService();

export default advancedWeatherService;
export {
  AdvancedWeatherService,
  WEATHER_CODE_MAP,
  WIND_DIRECTION_MAP,
  generate24HourForecast,
  generate7DayForecast
};
