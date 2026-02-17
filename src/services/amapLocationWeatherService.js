/**
 * 高德定位+天气集成服务
 * 封装完整的高德定位到天气获取流程
 * 提供统一的API接口供前端调用
 */

import amapLocationService from './amapLocationService.js';
import amapWeatherService from './amapWeatherService.js';

/**
 * 服务配置
 */
const SERVICE_CONFIG = {
  totalTimeout: 15000, // 总超时15秒
  locationTimeout: 8000, // 定位8秒超时
  weatherTimeout: 7000, // 天气7秒超时
  enableCache: true, // 启用缓存
  cacheTTL: 30 * 60 * 1000 // 缓存30分钟
};

/**
 * 从环境变量获取高德API密钥
 * @returns {string|null} - API密钥
 */
const getAmapApiKeyFromEnv = () => {
  // Vite环境变量
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_AMAP_API_KEY || null;
  }
  return null;
};

/**
 * 高德定位+天气集成服务类
 */
class AmapLocationWeatherService {
  constructor () {
    this.config = SERVICE_CONFIG;
    this.cache = new Map();
    this.metrics = [];

    // 初始化时从环境变量读取API密钥
    const envApiKey = getAmapApiKeyFromEnv();
    if (envApiKey) {
      this.setApiKey(envApiKey);
    }
  }

  /**
   * 设置API密钥（同时设置定位和天气服务）
   * @param {string} key - 高德开放平台Web服务API密钥
   */
  setApiKey (key) {
    amapLocationService.setApiKey(key);
    amapWeatherService.setApiKey(key);
  }

  /**
   * 获取当前配置的API密钥
   * @returns {string|null} - API密钥
   */
  getApiKey () {
    return amapLocationService.getApiKey() || amapWeatherService.getApiKey();
  }

  /**
   * 验证API密钥是否有效
   * @returns {boolean} - 是否有效
   */
  isApiKeyValid () {
    return amapLocationService.isApiKeyValid() && amapWeatherService.isApiKeyValid();
  }

  /**
   * 获取位置和天气（主入口）
   * 完整流程：定位 → 天气 → 返回结果
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} - 完整结果
   */
  async getLocationAndWeather (options = {}) {
    const startTime = performance.now();
    const config = { ...this.config, ...options };

    try {
      // 检查API密钥
      if (!this.isApiKeyValid()) {
        throw new Error('高德API密钥未配置或无效，请先配置密钥');
      }

      // 检查缓存
      if (config.enableCache && !options.forceRefresh) {
        const cached = this.getCachedResult();
        if (cached) {
          return {
            success: true,
            data: cached,
            source: 'cache',
            responseTime: 0
          };
        }
      }

      // 步骤1: 获取位置
      const locationStartTime = performance.now();
      const locationResult = await this.getLocationWithTimeout(config.locationTimeout);
      const locationTime = performance.now() - locationStartTime;

      if (!locationResult.success) {
        throw new Error(locationResult.error || '定位失败');
      }

      // 步骤2: 获取天气
      const weatherStartTime = performance.now();
      const weatherResult = await this.getWeatherWithTimeout(
        locationResult.data,
        config.weatherTimeout
      );
      const weatherTime = performance.now() - weatherStartTime;

      // 组装结果
      const result = {
        location: locationResult.data,
        weather: weatherResult.success ? weatherResult.data : null,
        locationSource: locationResult.source,
        weatherSource: weatherResult.source,
        timestamp: new Date().toISOString()
      };

      // 缓存结果
      if (config.enableCache) {
        this.cacheResult(result);
      }

      const totalTime = performance.now() - startTime;
      this.recordMetrics('success', totalTime, locationTime, weatherTime);

      return {
        success: true,
        data: result,
        source: 'api',
        performance: {
          totalTime: Math.round(totalTime),
          locationTime: Math.round(locationTime),
          weatherTime: Math.round(weatherTime)
        }
      };
    } catch (error) {
      const totalTime = performance.now() - startTime;
      this.recordMetrics('error', totalTime, 0, 0);

      // 尝试返回缓存数据
      const cached = this.getCachedResult();
      if (cached) {
        return {
          success: true,
          data: cached,
          source: 'cache',
          warning: '实时获取失败，使用缓存数据',
          error: error.message,
          performance: { totalTime: Math.round(totalTime) }
        };
      }

      // 返回错误
      return {
        success: false,
        error: error.message,
        errorType: this.classifyError(error),
        performance: { totalTime: Math.round(totalTime) }
      };
    }
  }

  /**
   * 带超时控制的定位获取
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<Object>} - 定位结果
   */
  async getLocationWithTimeout (timeout) {
    return Promise.race([
      amapLocationService.getCurrentLocation({ forceRefresh: true }),
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error('定位超时')), timeout)
      )
    ]);
  }

  /**
   * 带超时控制的天气获取
   * @param {Object} location - 位置信息
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<Object>} - 天气结果
   */
  async getWeatherWithTimeout (location, timeout) {
    return Promise.race([
      amapWeatherService.getCurrentWeather(location),
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error('天气获取超时')), timeout)
      )
    ]);
  }

  /**
   * 快速获取（优先使用缓存）
   * @returns {Promise<Object>} - 结果
   */
  async getQuick () {
    // 首先尝试缓存
    const cached = this.getCachedResult();
    if (cached) {
      return {
        success: true,
        data: cached,
        source: 'cache',
        responseTime: 0
      };
    }

    // 缓存未命中，执行完整流程
    return this.getLocationAndWeather();
  }

  /**
   * 仅获取位置
   * @returns {Promise<Object>} - 位置结果
   */
  async getLocationOnly () {
    const startTime = performance.now();

    try {
      if (!amapLocationService.isApiKeyValid()) {
        throw new Error('高德定位API密钥未配置或无效');
      }

      const result = await amapLocationService.getCurrentLocation();
      const duration = performance.now() - startTime;

      return {
        ...result,
        responseTime: Math.round(duration)
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        success: false,
        error: error.message,
        responseTime: Math.round(duration)
      };
    }
  }

  /**
   * 仅获取天气（需要传入位置）
   * @param {string|Object} location - 位置信息
   * @returns {Promise<Object>} - 天气结果
   */
  async getWeatherOnly (location) {
    const startTime = performance.now();

    try {
      if (!amapWeatherService.isApiKeyValid()) {
        throw new Error('高德天气API密钥未配置或无效');
      }

      const result = await amapWeatherService.getCurrentWeather(location);
      const duration = performance.now() - startTime;

      return {
        ...result,
        responseTime: Math.round(duration)
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        success: false,
        error: error.message,
        responseTime: Math.round(duration)
      };
    }
  }

  /**
   * 获取预报天气
   * @param {string|Object} location - 位置信息
   * @returns {Promise<Object>} - 预报结果
   */
  async getWeatherForecast (location) {
    try {
      if (!amapWeatherService.isApiKeyValid()) {
        throw new Error('高德天气API密钥未配置或无效');
      }

      const result = await amapWeatherService.getCurrentWeather(location, {
        extensions: 'all'
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 通过城市名获取天气
   * @param {string} cityName - 城市名称
   * @returns {Promise<Object>} - 天气结果
   */
  async getWeatherByCityName (cityName) {
    try {
      if (!amapWeatherService.isApiKeyValid()) {
        throw new Error('高德天气API密钥未配置或无效');
      }

      return await amapWeatherService.getCurrentWeather(cityName);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 缓存结果
   * @param {Object} result - 结果数据
   */
  cacheResult (result) {
    this.cache.set('locationWeather', {
      data: result,
      timestamp: Date.now()
    });
  }

  /**
   * 获取缓存结果
   * @returns {Object|null} - 缓存的结果
   */
  getCachedResult () {
    const cached = this.cache.get('locationWeather');
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheTTL) {
      this.cache.delete('locationWeather');
      return null;
    }

    return cached.data;
  }

  /**
   * 清除缓存
   */
  clearCache () {
    this.cache.clear();
    amapLocationService.clearCache();
    amapWeatherService.clearCache();
    console.log('[高德集成服务] 缓存已清除');
  }

  /**
   * 记录性能指标
   * @param {string} status - 状态
   * @param {number} totalTime - 总时间
   * @param {number} locationTime - 定位时间
   * @param {number} weatherTime - 天气时间
   */
  recordMetrics (status, totalTime, locationTime, weatherTime) {
    this.metrics.push({
      status,
      totalTime,
      locationTime,
      weatherTime,
      timestamp: new Date().toISOString()
    });

    // 只保留最近100条记录
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * 获取性能统计
   * @returns {Object} - 性能统计
   */
  getPerformanceStats () {
    const totalCalls = this.metrics.length;
    if (totalCalls === 0) {
      return {
        totalCalls: 0,
        successRate: '0%',
        averageTotalTime: 0,
        averageLocationTime: 0,
        averageWeatherTime: 0
      };
    }

    const successCalls = this.metrics.filter(m => m.status === 'success').length;
    const avgTotal = this.metrics.reduce((a, b) => a + b.totalTime, 0) / totalCalls;
    const avgLocation = this.metrics.reduce((a, b) => a + b.locationTime, 0) / totalCalls;
    const avgWeather = this.metrics.reduce((a, b) => a + b.weatherTime, 0) / totalCalls;

    return {
      totalCalls,
      successCalls,
      successRate: ((successCalls / totalCalls) * 100).toFixed(2) + '%',
      averageTotalTime: Math.round(avgTotal),
      averageLocationTime: Math.round(avgLocation),
      averageWeatherTime: Math.round(avgWeather),
      recentMetrics: this.metrics.slice(-10)
    };
  }

  /**
   * 错误分类
   * @param {Error} error - 错误对象
   * @returns {string} - 错误类型
   */
  classifyError (error) {
    if (!error) {
      return 'UNKNOWN_ERROR';
    }

    const message = (error.message || '').toLowerCase();

    if (message.includes('timeout') || message.includes('超时')) {
      return 'TIMEOUT_ERROR';
    }
    if (message.includes('network') || message.includes('网络')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('permission') || message.includes('权限')) {
      return 'PERMISSION_ERROR';
    }
    if (message.includes('key') || message.includes('密钥')) {
      return 'API_KEY_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} - 检查结果
   */
  async healthCheck () {
    const checks = {
      location: false,
      weather: false,
      apiKey: this.isApiKeyValid(),
      timestamp: new Date().toISOString()
    };

    if (!checks.apiKey) {
      return {
        healthy: false,
        checks,
        message: 'API密钥未配置或无效'
      };
    }

    try {
      // 检查定位服务
      const locationResult = await amapLocationService.testConnection();
      checks.location = locationResult.success;
    } catch (error) {
      console.warn('[高德集成服务] 定位服务检查失败:', error.message);
    }

    try {
      // 检查天气服务
      const weatherResult = await amapWeatherService.testConnection();
      checks.weather = weatherResult.success;
    } catch (error) {
      console.warn('[高德集成服务] 天气服务检查失败:', error.message);
    }

    const allHealthy = checks.location && checks.weather;

    return {
      healthy: allHealthy,
      checks,
      message: allHealthy ? '所有服务正常' : '部分服务异常'
    };
  }

  /**
   * 获取服务统计
   * @returns {Object} - 服务统计
   */
  getStats () {
    return {
      apiKeyConfigured: this.isApiKeyValid(),
      performance: this.getPerformanceStats(),
      cacheSize: this.cache.size,
      locationStatus: amapLocationService.getServiceStatus(),
      weatherStatus: amapWeatherService.getServiceStatus()
    };
  }
}

// 创建单例实例
const amapLocationWeatherService = new AmapLocationWeatherService();

export default amapLocationWeatherService;
export { AmapLocationWeatherService, SERVICE_CONFIG };
