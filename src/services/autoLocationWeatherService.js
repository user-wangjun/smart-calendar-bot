/**
 * 自动定位天气服务
 * 封装定位+天气的完整流程，实现定位成功后自动获取天气
 * 包含缓存机制、错误处理、定时更新等功能
 */

import browserLocationService from './browserLocationService.js';
import amapLocationService from './amapLocationService.js';
import tencentLocationService from './tencentLocationService.js';
import amapWeatherService from './amapWeatherService.js';

/**
 * 服务配置
 */
const SERVICE_CONFIG = {
  locationCacheTTL: 30 * 60 * 1000, // 定位缓存30分钟
  weatherCacheTTL: 10 * 60 * 1000, // 天气缓存10分钟
  autoRefreshInterval: 30 * 60 * 1000, // 自动刷新间隔30分钟
  locationTimeout: 15000, // 定位超时15秒 (增加超时时间以提高成功率)
  weatherTimeout: 8000, // 天气API超时8秒
  minAccuracy: 1000 // 最小可接受精度(米)
};

/**
 * 服务状态
 */
const ServiceState = {
  IDLE: 'idle', // 空闲
  LOCATING: 'locating', // 定位中
  GETTING_WEATHER: 'getting_weather', // 获取天气中
  SUCCESS: 'success', // 成功
  ERROR: 'error' // 错误
};

/**
 * 自动定位天气服务类
 */
class AutoLocationWeatherService {
  constructor () {
    this.config = SERVICE_CONFIG;
    this.state = ServiceState.IDLE;
    this.locationCache = null;
    this.weatherCache = null;
    this.autoRefreshTimer = null;
    this.listeners = [];
  }

  /**
   * 获取当前状态
   */
  getState () {
    return this.state;
  }

  /**
   * 添加状态监听器
   */
  addListener (callback) {
    this.listeners.push(callback);
  }

  /**
   * 移除状态监听器
   */
  removeListener (callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * 通知状态变化
   */
  notifyStateChange (state, data = {}) {
    this.listeners.forEach(callback => {
      try {
        callback(state, data);
      } catch (error) {
        console.error('[AutoLocationWeather] 监听器错误:', error);
      }
    });
  }

  /**
   * 主入口：自动获取定位和天气
   * 智能策略：优先浏览器定位，失败自动切换到IP定位
   *
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} - 完整结果
   */
  async autoGetWeather (options = {}) {
    const {
      forceRefresh = false,
      useCache = true,
      preferBrowser = true // 优先使用浏览器定位
    } = options;

    // 检查缓存
    if (!forceRefresh && useCache) {
      const cachedResult = this.getCachedResult();
      if (cachedResult) {
        console.log('[AutoLocationWeather] 使用缓存数据');
        this.notifyStateChange(ServiceState.SUCCESS, cachedResult);
        return {
          success: true,
          data: cachedResult,
          source: 'cache'
        };
      }
    }

    try {
      // 步骤1：获取位置
      this.state = ServiceState.LOCATING;
      this.notifyStateChange(ServiceState.LOCATING, { message: '正在定位...' });

      const locationResult = await this.getLocation(preferBrowser);

      if (!locationResult.success) {
        // 定位失败，提示用户手动选择城市
        this.state = ServiceState.ERROR;
        this.notifyStateChange(ServiceState.ERROR, {
          error: locationResult.error || '定位失败',
          requireManualLocation: true,
          message: '无法自动获取您的位置，请手动选择城市'
        });

        return {
          success: false,
          error: locationResult.error || '定位失败',
          requireManualLocation: true,
          data: this.getDefaultResult()
        };
      }

      // 步骤2：获取天气（自动触发）
      this.state = ServiceState.GETTING_WEATHER;
      this.notifyStateChange(ServiceState.GETTING_WEATHER, {
        message: '定位成功，获取天气中...',
        location: locationResult.data
      });

      const weatherResult = await this.getWeatherByLocation(locationResult.data);

      if (!weatherResult.success) {
        throw new Error(weatherResult.error || '获取天气失败');
      }

      // 组装结果
      // 注意：getFullWeather 返回的结构是 { success, current, forecast }
      // 而不是 { success, data: { current, forecast } }
      console.log('[AutoLocationWeather] 组装结果前，weatherResult:', weatherResult);

      const result = {
        location: locationResult.data,
        weather: weatherResult.current,
        forecast: weatherResult.forecast,
        timestamp: new Date().toISOString()
      };

      console.log('[AutoLocationWeather] 组装后的完整结果:', result);

      // 缓存结果
      this.cacheResult(result);

      // 更新状态
      this.state = ServiceState.SUCCESS;
      this.notifyStateChange(ServiceState.SUCCESS, result);

      // 启动自动刷新
      this.startAutoRefresh();

      return {
        success: true,
        data: result,
        source: 'api'
      };
    } catch (error) {
      console.error('[AutoLocationWeather] 错误:', error.message);
      console.error('[AutoLocationWeather] 错误详情:', error);

      // 尝试使用缓存
      const cachedResult = this.getCachedResult();
      if (cachedResult) {
        this.state = ServiceState.SUCCESS;
        this.notifyStateChange(ServiceState.SUCCESS, {
          ...cachedResult,
          warning: '实时获取失败，使用缓存数据'
        });
        return {
          success: true,
          data: cachedResult,
          source: 'cache',
          warning: '实时获取失败，使用缓存数据',
          error: error.message
        };
      }

      // 返回错误
      this.state = ServiceState.ERROR;
      this.notifyStateChange(ServiceState.ERROR, { error: error.message });

      return {
        success: false,
        error: error.message,
        data: this.getDefaultResult()
      };
    }
  }

  /**
   * 获取位置
   * 智能策略：按优先级尝试多种定位方式
   * 优先级：浏览器GPS -> 高德定位 -> 腾讯定位 -> IP定位 -> 失败提示手动定位
   *
   * @param {boolean} preferBrowser - 是否优先浏览器定位
   * @returns {Promise<Object>} - 位置结果
   */
  // eslint-disable-next-line complexity
  async getLocation (preferBrowser = true) {
    const errors = [];

    // 策略1：浏览器原生GPS定位
    if (preferBrowser) {
      try {
        console.log('[AutoLocationWeather] 尝试浏览器GPS定位');
        const browserResult = await Promise.race([
          browserLocationService.getCurrentPositionWithRetry({
            timeout: this.config.locationTimeout
          }),
          new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error('浏览器定位超时')), this.config.locationTimeout * 2 + 1000)
          )
        ]);

        if (browserResult.success) {
          const location = browserResult.data;

          // 检查精度
          if (location.accuracy && location.accuracy > this.config.minAccuracy) {
            console.log('[AutoLocationWeather] 浏览器定位精度不足:', location.accuracy, '米，尝试其他定位方式');
            errors.push(`浏览器GPS定位精度不足: ${location.accuracy}米`);
          } else {
            console.log('[AutoLocationWeather] 浏览器GPS定位成功，精度:', location.accuracy, '米');

            // 获取详细位置信息
            let locationDetail = null;
            try {
              locationDetail = await amapWeatherService.getLocationDetailByCoords(
                location.latitude,
                location.longitude
              );
            } catch (geoError) {
              console.warn('[AutoLocationWeather] 获取位置详情失败:', geoError.message);
            }

            return {
              success: true,
              data: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                city: locationDetail?.city || '北京市',
                province: locationDetail?.province || '',
                district: locationDetail?.district || '',
                adcode: locationDetail?.adcode || '110000',
                source: 'browser',
                provider: 'browser_gps',
                timestamp: new Date().toISOString()
              }
            };
          }
        }
      } catch (error) {
        console.log('[AutoLocationWeather] 浏览器GPS定位失败:', error.message);
        errors.push(`浏览器GPS: ${error.message}`);
      }
    }

    // 策略2：高德定位服务
    try {
      console.log('[AutoLocationWeather] 尝试高德定位服务');
      const amapResult = await amapLocationService.getCurrentLocation({
        timeout: this.config.locationTimeout
      });

      if (amapResult.success) {
        console.log('[AutoLocationWeather] 高德定位成功:', amapResult.data.city);
        return {
          success: true,
          data: {
            latitude: amapResult.data.latitude,
            longitude: amapResult.data.longitude,
            accuracy: amapResult.data.accuracy,
            city: amapResult.data.city,
            province: amapResult.data.province,
            district: amapResult.data.district,
            adcode: amapResult.data.adcode,
            source: 'amap',
            provider: 'amap_location',
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      console.log('[AutoLocationWeather] 高德定位失败:', error.message);
      errors.push(`高德定位: ${error.message}`);
    }

    // 策略3：腾讯定位服务
    try {
      console.log('[AutoLocationWeather] 尝试腾讯定位服务');
      const tencentResult = await tencentLocationService.getCurrentLocation({
        timeout: this.config.locationTimeout
      });

      if (tencentResult.success) {
        console.log('[AutoLocationWeather] 腾讯定位成功:', tencentResult.data.city);
        return {
          success: true,
          data: {
            latitude: tencentResult.data.latitude,
            longitude: tencentResult.data.longitude,
            accuracy: tencentResult.data.accuracy,
            city: tencentResult.data.city,
            province: tencentResult.data.province,
            district: tencentResult.data.district,
            adcode: '', // 腾讯定位可能不返回adcode
            source: 'tencent',
            provider: 'tencent_location',
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      console.log('[AutoLocationWeather] 腾讯定位失败:', error.message);
      errors.push(`腾讯定位: ${error.message}`);
    }

    // 策略4：IP定位（最后备选）
    try {
      console.log('[AutoLocationWeather] 尝试IP定位');
      const ipLocationResult = await amapWeatherService.getLocationByIP();

      if (ipLocationResult.success) {
        console.log('[AutoLocationWeather] IP定位成功:', ipLocationResult.city);
        return {
          success: true,
          data: {
            city: ipLocationResult.city,
            province: ipLocationResult.province,
            adcode: ipLocationResult.adcode,
            source: 'ip',
            provider: 'amap_ip',
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      console.log('[AutoLocationWeather] IP定位失败:', error.message);
      errors.push(`IP定位: ${error.message}`);
    }

    // 所有定位方式均失败
    console.error('[AutoLocationWeather] 所有定位方式均失败');
    return {
      success: false,
      error: '定位失败，请手动选择城市',
      errorDetails: errors,
      requireManualLocation: true
    };
  }

  /**
   * 根据位置获取天气
   *
   * @param {Object} location - 位置信息
   * @returns {Promise<Object>} - 天气结果
   */
  async getWeatherByLocation (location) {
    try {
      let result;

      console.log('[AutoLocationWeather] getWeatherByLocation 被调用，位置:', location);

      if (location.latitude && location.longitude) {
        // 使用坐标获取天气
        result = await Promise.race([
          amapWeatherService.getWeatherByCoords(
            location.latitude,
            location.longitude,
            { forceRefresh: true }
          ),
          new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error('天气API超时')), this.config.weatherTimeout)
          )
        ]);
      } else if (location.adcode) {
        // 使用城市编码获取天气
        result = await Promise.race([
          amapWeatherService.getFullWeather(location.adcode, { forceRefresh: true }),
          new Promise((_resolve, reject) =>
            setTimeout(() => reject(new Error('天气API超时')), this.config.weatherTimeout)
          )
        ]);
      } else {
        throw new Error('无效的位置信息');
      }

      console.log('[AutoLocationWeather] getWeatherByLocation 返回结果:', result);
      return result;
    } catch (error) {
      console.error('[AutoLocationWeather] 获取天气失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取缓存结果
   */
  getCachedResult () {
    const now = Date.now();

    // 检查定位缓存
    if (this.locationCache) {
      if (now - this.locationCache.timestamp > this.config.locationCacheTTL) {
        this.locationCache = null;
      }
    }

    // 检查天气缓存
    if (this.weatherCache) {
      if (now - this.weatherCache.timestamp > this.config.weatherCacheTTL) {
        this.weatherCache = null;
      }
    }

    // 如果都有缓存，返回完整结果
    if (this.locationCache && this.weatherCache) {
      return {
        location: this.locationCache.data,
        weather: this.weatherCache.data.current,
        forecast: this.weatherCache.data.forecast,
        timestamp: this.weatherCache.timestamp
      };
    }

    return null;
  }

  /**
   * 缓存结果
   */
  cacheResult (result) {
    const now = Date.now();

    this.locationCache = {
      data: result.location,
      timestamp: now
    };

    this.weatherCache = {
      data: {
        current: result.weather,
        forecast: result.forecast
      },
      timestamp: now
    };
  }

  /**
   * 启动自动刷新
   */
  startAutoRefresh () {
    // 清除现有定时器
    this.stopAutoRefresh();

    // 启动新定时器
    this.autoRefreshTimer = setInterval(() => {
      this.autoGetWeather({ forceRefresh: true });
    }, this.config.autoRefreshInterval);
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh () {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  /**
   * 获取默认结果
   */
  getDefaultResult () {
    return {
      location: {
        city: '未知位置',
        source: 'default'
      },
      weather: {
        text: '未知',
        temperature: 22,
        humidity: 50,
        windDirection: '',
        windPower: ''
      },
      forecast: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取服务统计
   */
  getStats () {
    return {
      state: this.state,
      hasLocationCache: !!this.locationCache,
      hasWeatherCache: !!this.weatherCache,
      autoRefreshActive: !!this.autoRefreshTimer,
      config: this.config
    };
  }

  /**
   * 清除所有缓存
   */
  clearCache () {
    this.locationCache = null;
    this.weatherCache = null;
  }
}

// 创建单例实例
const autoLocationWeatherService = new AutoLocationWeatherService();

export default autoLocationWeatherService;
export { AutoLocationWeatherService, ServiceState };
