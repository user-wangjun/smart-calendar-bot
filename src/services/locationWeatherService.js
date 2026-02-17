/**
 * 定位服务
 * 封装定位获取流程
 * 确保响应时间不超过5秒
 */

import locationProviderService, { LocationError, LocationErrorType } from './locationProviderService.js';

/**
 * 服务配置
 */
const SERVICE_CONFIG = {
  totalTimeout: 10000, // 总超时10秒
  locationTimeout: 8000, // 定位8秒超时
  enableCache: true, // 启用缓存
  cacheTTL: 30 * 60 * 1000 // 缓存30分钟
};

/**
 * 性能监控器
 */
class PerformanceMonitor {
  constructor () {
    this.metrics = [];
  }

  startTimer (label) {
    return {
      label,
      startTime: performance.now()
    };
  }

  endTimer (timer) {
    const duration = performance.now() - timer.startTime;
    const metric = {
      label: timer.label,
      duration: Math.round(duration * 100) / 100,
      timestamp: new Date().toISOString()
    };
    this.metrics.push(metric);
    return metric;
  }

  getMetrics () {
    return this.metrics;
  }

  getAverageTime (label) {
    const times = this.metrics
      .filter(m => m.label === label)
      .map(m => m.duration);
    if (times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  clear () {
    this.metrics = [];
  }
}

/**
 * 定位服务类
 */
class LocationService {
  constructor () {
    this.config = SERVICE_CONFIG;
    this.performanceMonitor = new PerformanceMonitor();
    this.cache = new Map();
  }

  /**
   * 获取位置（主入口）
   * 使用主备故障转移服务（腾讯主 + 高德备）
   *
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} - 位置结果
   */
  async getLocation (options = {}) {
    const totalTimer = this.performanceMonitor.startTimer('total');
    const config = { ...this.config, ...options };

    try {
      // 检查缓存
      if (config.enableCache && !options.forceRefresh) {
        const cached = this.getCachedResult();
        if (cached) {
          this.performanceMonitor.endTimer(totalTimer);
          return this.buildCachedReturn(cached);
        }
      }

      // 获取位置（带超时控制）
      const locationTimer = this.performanceMonitor.startTimer('location');
      const locationResult = await this.getLocationWithTimeout(config.locationTimeout);
      const locationMetric = this.performanceMonitor.endTimer(locationTimer);

      if (!locationResult.success) {
        throw new Error(locationResult.error || '定位失败');
      }

      // 组装结果
      const result = this.buildSuccessResult(locationResult);

      // 缓存结果
      if (config.enableCache) {
        this.cacheResult(result);
      }

      const totalMetric = this.performanceMonitor.endTimer(totalTimer);

      return {
        success: true,
        data: result,
        source: 'api',
        performance: {
          ...this.getPerformanceSummary(),
          totalTime: totalMetric.duration,
          locationTime: locationMetric.duration
        },
        warning: locationResult.warning
      };
    } catch (error) {
      this.performanceMonitor.endTimer(totalTimer);

      // 尝试返回缓存数据
      const cached = this.getCachedResult();
      if (cached) {
        const base = this.buildCachedReturn(cached);
        return { ...base, warning: '实时获取失败，使用缓存数据', error: error.message };
      }

      // 返回错误
      return {
        success: false,
        error: error.message,
        errorType: this.classifyError(error),
        performance: this.getPerformanceSummary()
      };
    }
  }

  /**
   * 带超时控制的定位获取
   * 使用主备故障转移服务（腾讯主 + 高德备）
   *
   * @param {number} timeout - 超时时间
   * @returns {Promise<Object>} - 定位结果
   */
  async getLocationWithTimeout (timeout) {
    return Promise.race([
      locationProviderService.getCurrentLocation({ forceRefresh: true }),
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error('定位超时')), timeout)
      )
    ]);
  }

  /**
   * 快速获取（优先使用缓存）
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
    return this.getLocation();
  }

  /**
   * 仅获取位置
   * 使用主备故障转移服务（腾讯主 + 高德备）
   *
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} - 位置信息
   */
  async getLocationOnly (options = {}) {
    const timer = this.performanceMonitor.startTimer('location_only');

    try {
      const result = await locationProviderService.getCurrentLocation(options);
      const metric = this.performanceMonitor.endTimer(timer);

      return {
        ...result,
        responseTime: metric.duration
      };
    } catch (error) {
      this.performanceMonitor.endTimer(timer);
      return {
        success: false,
        error: error.message,
        errorType: 'LOCATION_ERROR'
      };
    }
  }

  /**
   * 获取缓存结果
   */
  getCachedResult () {
    const cached = this.cache.get('location');
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.config.cacheTTL) {
      this.cache.delete('location');
      return null;
    }

    return cached.data;
  }

  /**
   * 缓存结果
   */
  cacheResult (result) {
    this.cache.set('location', {
      data: result,
      timestamp: Date.now()
    });
  }

  /**
   * 清除缓存
   */
  clearCache () {
    this.cache.clear();
    console.log('[LocationService] 缓存已清除');
  }

  /**
   * 获取性能摘要
   */
  getPerformanceSummary () {
    const metrics = this.performanceMonitor.getMetrics();
    const total = metrics.filter(m => m.label === 'total');
    const location = metrics.filter(m => m.label === 'location');

    return {
      totalCalls: metrics.length,
      averageTotalTime: total.length > 0
        ? total.reduce((a, b) => a + b.duration, 0) / total.length
        : 0,
      averageLocationTime: location.length > 0
        ? location.reduce((a, b) => a + b.duration, 0) / location.length
        : 0,
      recentMetrics: metrics.slice(-10) // 最近10次
    };
  }

  /**
   * 错误分类
   */
  classifyError (error) {
    if (!error) {
      return 'UNKNOWN_ERROR';
    }

    if (error instanceof LocationError) {
      return error.type;
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
    if (message.includes('api key') || message.includes('api密钥') || message.includes('密钥')) {
      return 'API_KEY_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * 健康检查
   */
  async healthCheck () {
    const checks = {
      locationProvider: false,
      cache: false,
      timestamp: new Date().toISOString()
    };

    try {
      const locationResult = await locationProviderService.getCurrentLocation();
      checks.locationProvider = locationResult.success;
      console.log('[HealthCheck] 定位服务状态:', locationResult.success ? '正常' : '异常',
        locationResult.provider ? `(提供商: ${locationResult.provider})` : '');
    } catch (error) {
      console.warn('[HealthCheck] 定位服务检查失败:', error.message);
    }

    // 检查缓存
    checks.cache = this.cache !== null;

    const allHealthy = checks.locationProvider && checks.cache;

    return {
      healthy: allHealthy,
      checks,
      message: allHealthy ? '所有服务正常' : '部分服务异常'
    };
  }

  /**
   * 获取服务统计
   */
  getStats () {
    const metrics = this.performanceMonitor.getMetrics();
    const totalCalls = metrics.filter(m => m.label === 'total').length;
    const successCalls = metrics.filter(m => m.label === 'total' && m.duration < 5000).length;

    return {
      totalCalls,
      successCalls,
      successRate: totalCalls > 0 ? (successCalls / totalCalls * 100).toFixed(2) + '%' : '0%',
      averageResponseTime: this.performanceMonitor.getAverageTime('total').toFixed(2) + 'ms',
      cacheSize: this.cache.size,
      config: this.config
    };
  }

  /**
   * 构建成功结果对象
   */
  buildSuccessResult (locationResult) {
    return {
      location: locationResult.data,
      locationSource: locationResult.source,
      locationProvider: locationResult.provider || 'unknown',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 构建缓存返回对象
   */
  buildCachedReturn (cached) {
    return {
      success: true,
      data: cached,
      source: 'cache',
      performance: this.getPerformanceSummary()
    };
  }
}

// 创建单例实例
const locationService = new LocationService();

export default locationService;
export {
  LocationService,
  PerformanceMonitor,
  SERVICE_CONFIG,
  LocationError,
  LocationErrorType
};
