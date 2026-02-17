/**
 * 天气共享状态管理 Store
 * 用于在首页和天气页面之间同步位置和天气数据
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import advancedWeatherService from '@/services/advancedWeatherService.js';
import weatherRecommendationService from '@/services/weatherRecommendationService.js';
import { calculateFeelsLike, parseWindSpeedFromPower } from '@/utils/feelsLikeCalculator.js';

/**
 * 天气数据共享 Store
 * 提供全局统一的位置和天气数据管理
 */
export const useWeatherStore = defineStore('weather', () => {
  // ==================== State ====================

  /**
   * 当前位置信息
   */
  const currentLocation = ref(null);

  /**
   * 天气数据
   */
  const weatherData = ref(null);

  /**
   * 智能推荐数据
   */
  const recommendations = ref(null);

  /**
   * 加载状态
   */
  const isLoading = ref(false);

  /**
   * 错误信息
   */
  const error = ref(null);

  /**
   * 最后更新时间
   */
  const lastUpdateTime = ref(null);

  /**
   * 温度单位 (C/F)
   */
  const tempUnit = ref('C');

  // ==================== Getters ====================

  /**
   * 当前城市名称
   */
  const currentCity = computed(() => {
    return currentLocation.value?.city || weatherData.value?.location?.city || '北京市';
  });

  /**
   * 当前城市编码
   */
  const currentCityCode = computed(() => {
    return currentLocation.value?.adcode || weatherData.value?.location?.adcode || '110000';
  });

  /**
   * 是否有位置数据
   */
  const hasLocation = computed(() => {
    return currentLocation.value !== null;
  });

  /**
   * 是否有天气数据
   */
  const hasWeatherData = computed(() => {
    return weatherData.value !== null;
  });

  /**
   * 获取显示温度（根据单位转换）
   */
  const displayTemperature = computed(() => {
    return (celsius) => {
      if (celsius === undefined || celsius === null) return '--';
      if (tempUnit.value === 'F') {
        return Math.round((celsius * 9 / 5 + 32) * 10) / 10;
      }
      return celsius;
    };
  });

  // ==================== Helper Functions ====================

  /**
   * 获取天气图标
   * @param {string} weather - 天气描述
   * @returns {string} 天气图标
   */
  const getWeatherIcon = (weather) => {
    const iconMap = {
      晴: '☀️',
      多云: '⛅',
      阴: '☁️',
      小雨: '🌦️',
      中雨: '🌧️',
      大雨: '⛈️',
      暴雨: '⛈️',
      雷阵雨: '⛈️',
      雪: '🌨️',
      雾: '🌫️',
      霾: '😷'
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (weather && weather.includes(key)) {
        return icon;
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
    const typeMap = {
      晴: 'sunny',
      多云: 'cloudy',
      阴: 'overcast',
      小雨: 'light_rain',
      中雨: 'moderate_rain',
      大雨: 'heavy_rain',
      暴雨: 'storm',
      雷阵雨: 'thunderstorm',
      雪: 'snow',
      雾: 'fog',
      霾: 'haze'
    };

    for (const [key, type] of Object.entries(typeMap)) {
      if (weather && weather.includes(key)) {
        return type;
      }
    }
    return 'cloudy';
  };

  /**
   * 生成24小时预报数据
   * @param {number} currentTemp - 当前温度
   * @param {string} weatherType - 天气类型
   * @returns {Array} 24小时预报数据
   */
  const generate24HourForecast = (currentTemp, weatherType) => {
    const hourlyData = [];
    const now = new Date();
    const currentHour = now.getHours();

    // 温度变化曲线参数（模拟昼夜温差）
    const baseTemp = parseFloat(currentTemp) || 20;

    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i) % 24;
      const hourTime = new Date(now);
      hourTime.setHours(hour);

      // 模拟温度变化（白天高、夜间低）
      let tempOffset = 0;
      if (hour >= 6 && hour <= 14) {
        // 白天升温
        tempOffset = Math.sin((hour - 6) / 8 * Math.PI) * 3;
      } else if (hour > 14 && hour <= 18) {
        // 傍晚降温
        tempOffset = Math.sin((22 - hour) / 8 * Math.PI) * 3;
      } else {
        // 夜间低温
        tempOffset = -2;
      }

      // 随机波动
      const randomOffset = (Math.random() - 0.5) * 2;
      const temp = baseTemp + tempOffset + randomOffset;

      // 降水概率（根据天气类型）
      let precipitationProb = 0;
      if (weatherType === 'rainy' || weatherType === 'thunderstorm') {
        precipitationProb = 0.6 + Math.random() * 0.3;
      } else if (weatherType === 'cloudy') {
        precipitationProb = 0.2 + Math.random() * 0.2;
      }

      hourlyData.push({
        hour,
        time: hourTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        temperature: parseFloat(temp.toFixed(1)),
        precipitationProbability: Math.round(precipitationProb * 100),
        windSpeed: Math.round(Math.random() * 15 + 5), // 5-20 km/h
        weather: weatherType === 'sunny' ? '晴' : (weatherType === 'cloudy' ? '多云' : '阴')
      });
    }

    return hourlyData;
  };

  // ==================== Actions ====================

  /**
   * 设置当前位置
   * @param {Object} location - 位置信息
   */
  const setLocation = (location) => {
    // 直接同步更新状态，避免 nextTick 导致的渲染时序问题
    currentLocation.value = location;
  };

  /**
   * 设置天气数据
   * @param {Object} data - 天气数据
   */
  const setWeatherData = (data) => {
    weatherData.value = data;
    if (data?.updateTime) {
      lastUpdateTime.value = data.updateTime;
    }
  };

  /**
   * 设置智能推荐
   * @param {Object} data - 推荐数据
   */
  const setRecommendations = (data) => {
    recommendations.value = data;
  };

  /**
   * 设置温度单位
   * @param {string} unit - 单位 ('C' 或 'F')
   */
  const setTempUnit = (unit) => {
    tempUnit.value = unit;
  };

  /**
   * 设置加载状态
   * @param {boolean} loading - 加载状态
   */
  const setLoading = (loading) => {
    isLoading.value = loading;
  };

  /**
   * 设置错误信息
   * @param {string} err - 错误信息
   */
  const setError = (err) => {
    error.value = err;
  };

  /**
   * 清除错误
   */
  const clearError = () => {
    error.value = null;
  };

  /**
   * 获取天气数据（根据当前位置）
   * 这是主要的天气数据获取方法
   *
   * @param {boolean} forceRefresh - 是否强制刷新，不使用缓存
   * @param {boolean} preserveLocation - 是否保留当前位置信息（不覆盖）
   */
  // eslint-disable-next-line complexity
  const fetchWeatherData = async (forceRefresh = false, preserveLocation = false) => {
    // 如果没有位置信息，使用默认位置
    const cityCode = currentCityCode.value;

    console.log('[WeatherStore] fetchWeatherData 被调用:', { forceRefresh, preserveLocation, cityCode });

    isLoading.value = true;
    error.value = null;

    try {
      const result = await advancedWeatherService.getFullWeatherData(cityCode, {
        forceRefresh
      });

      if (result.success) {
        weatherData.value = result;
        lastUpdateTime.value = result.updateTime;

        // 确保有hourly数据
        if (!weatherData.value.hourly) {
          const currentTemp = weatherData.value.current?.temperature || 20;
          const weatherType = weatherData.value.current?.weatherType || 'cloudy';
          weatherData.value.hourly = generate24HourForecast(currentTemp, weatherType);
        }

        // 更新位置信息（仅在 preserveLocation 为 false 时）
        console.log('[WeatherStore] 检查是否更新位置:', { preserveLocation, hasLocation: !!result.location });
        if (result.location && !preserveLocation) {
          console.log('[WeatherStore] 更新位置信息:', result.location);
          currentLocation.value = {
            city: result.location.city,
            province: result.location.province,
            adcode: result.location.adcode,
            source: 'weather_api',
            provider: 'amap',
            timestamp: result.updateTime
          };
        } else {
          console.log('[WeatherStore] 保留当前位置:', currentLocation.value);
        }

        // 获取智能推荐
        recommendations.value = weatherRecommendationService.getRecommendations({
          temperature: result.current.temperature,
          weatherType: result.current.weatherType,
          humidity: result.current.humidity,
          airQuality: result.current.airQuality,
          location: result.location
        });

        return { success: true, data: result };
      } else {
        error.value = result.error || '获取天气数据失败';
        return { success: false, error: error.value };
      }
    } catch (err) {
      error.value = err.message || '获取天气时发生错误';
      return { success: false, error: error.value };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 根据城市编码获取天气
   * @param {string} cityCode - 城市编码
   * @param {string} cityName - 城市名称
   */
  const fetchWeatherByCity = async (cityCode, cityName) => {
    // 更新位置信息
    currentLocation.value = {
      city: cityName,
      adcode: cityCode,
      source: 'manual',
      provider: 'manual_select',
      timestamp: new Date().toISOString()
    };

    // 获取天气
    return await fetchWeatherData(true);
  };

  /**
   * 从首页同步位置和天气数据
   * 当首页获取到新的位置/天气数据时调用
   * @param {Object} data - 包含位置和天气的数据对象
   */
  // eslint-disable-next-line complexity
  const syncFromDashboard = (data) => {
    // 直接同步更新状态，避免 nextTick 导致的渲染时序问题
    if (data.location) {
      currentLocation.value = data.location;
    }

    if (data.weather) {
      // 转换天气数据格式，使其兼容首页和天气页面的显示需求
      const weatherInfo = data.weather.weather || data.weather;

      // 提取基础数据
      const temperature = weatherInfo.temperature;
      const humidity = weatherInfo.humidity;
      const windPower = weatherInfo.windPower || weatherInfo.windpower;

      // 计算体感温度
      const windSpeed = parseWindSpeedFromPower(windPower);
      const feelsLike = calculateFeelsLike(temperature, humidity, windSpeed);

      weatherData.value = {
        success: true,
        current: {
          // 兼容天气页面使用的字段
          temperature,
          weather: weatherInfo.text || weatherInfo.weather,
          weatherIcon: getWeatherIcon(weatherInfo.text || weatherInfo.weather),
          weatherType: getWeatherType(weatherInfo.text || weatherInfo.weather),
          humidity,
          windDirection: weatherInfo.windDirection || weatherInfo.winddirection,
          windPower,
          reportTime: weatherInfo.reportTime || weatherInfo.reporttime,
          // 计算得到的体感温度
          feelsLike,
          // 兼容首页使用的字段
          icon: getWeatherIcon(weatherInfo.text || weatherInfo.weather),
          description: weatherInfo.text || weatherInfo.weather
        },
        location: data.location,
        updateTime: data.timestamp || new Date().toISOString()
      };
      lastUpdateTime.value = data.timestamp;
    }

    // 添加24小时预报数据
    if (weatherData.value) {
      if (data.hourly) {
        weatherData.value.hourly = data.hourly;
      } else if (!weatherData.value.hourly) {
        // 如果没有hourly数据，自动生成
        const currentTemp = weatherData.value.current?.temperature || 20;
        const weatherType = weatherData.value.current?.weatherType || 'cloudy';
        weatherData.value.hourly = generate24HourForecast(currentTemp, weatherType);
      }
    }

    // 处理7天预报数据
    if (weatherData.value) {
      console.log('[WeatherStore] 处理预报数据，原始forecast:', data.forecast);

      let forecastArray = [];

      if (data.forecast) {
        // 检查forecast是数组还是对象（EnhancedWeatherService返回的是对象）
        if (Array.isArray(data.forecast)) {
          forecastArray = data.forecast;
        } else if (data.forecast.forecast && Array.isArray(data.forecast.forecast)) {
          // EnhancedWeatherService返回的结构 { forecast: [...] }
          forecastArray = data.forecast.forecast;
        } else if (data.forecast.type === 'forecast' && data.forecast.forecast) {
          forecastArray = data.forecast.forecast;
        }
      }

      console.log('[WeatherStore] 解析后的forecastArray:', forecastArray);

      // 转换为天气页面需要的格式
      weatherData.value.daily = forecastArray.map(
        // eslint-disable-next-line complexity
        (day, index) => {
          const date = new Date();
          date.setDate(date.getDate() + index);

          // 计算降水概率
          const weatherText = day.dayWeather || day.weather || '晴';
          let precipitationProb = 0;
          if (weatherText.includes('雨')) {
            precipitationProb = Math.random() * 60 + 30;
          } else if (weatherText.includes('多云')) {
            precipitationProb = Math.random() * 20;
          }

          return {
            date: day.date || date.toISOString().split('T')[0],
            dayOfWeek: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
            displayDate: index === 0 ? '今天' : index === 1 ? '明天' : `${date.getMonth() + 1}/${date.getDate()}`,
            weather: weatherText,
            weatherIcon: getWeatherIcon(weatherText),
            weatherType: getWeatherType(weatherText),
            highTemp: day.dayTemp || parseFloat(day.temperature?.split('/')[0]) || 20,
            lowTemp: day.nightTemp || parseFloat(day.temperature?.split('/')[1]) || 15,
            precipitationProbability: Math.round(precipitationProb),
            windDirection: day.dayWind || day.windDirection || '东风',
            windPower: day.dayPower || day.windPower || '3级',
            humidity: Math.round(Math.random() * 30 + 40),
            uvIndex: Math.round(Math.random() * 10),
            visibility: Math.round(Math.random() * 10 + 5),
            pressure: Math.round(Math.random() * 50 + 1000)
          };
        });

      console.log('[WeatherStore] 最终daily数据:', weatherData.value.daily);
    }

    // 生成智能推荐数据
    if (weatherData.value?.current) {
      const current = weatherData.value.current;
      recommendations.value = weatherRecommendationService.getRecommendations({
        temperature: current.temperature,
        weatherType: current.weatherType,
        humidity: current.humidity,
        airQuality: current.airQuality,
        location: data.location
      });
    }
  };

  /**
   * 重置所有数据
   */
  const reset = () => {
    currentLocation.value = null;
    weatherData.value = null;
    recommendations.value = null;
    isLoading.value = false;
    error.value = null;
    lastUpdateTime.value = null;
  };

  // ==================== Return ====================

  return {
    // State
    currentLocation,
    weatherData,
    recommendations,
    isLoading,
    error,
    lastUpdateTime,
    tempUnit,

    // Getters
    currentCity,
    currentCityCode,
    hasLocation,
    hasWeatherData,
    displayTemperature,

    // Actions
    setLocation,
    setWeatherData,
    setRecommendations,
    setTempUnit,
    setLoading,
    setError,
    clearError,
    fetchWeatherData,
    fetchWeatherByCity,
    syncFromDashboard,
    reset
  };
});
