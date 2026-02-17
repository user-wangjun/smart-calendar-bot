/**
 * 增强版定位服务
 * 基于腾讯地图JavaScript API GL，提供高精度定位和IP定位
 * 包含完善的错误处理和性能优化
 */

import tencentLocationService from './tencentLocationService.js';
import { calculateDistance } from '../utils/geoUtils.js';

/**
 * 定位错误类型枚举
 */
export const LocationErrorType = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE',
  BROWSER_NOT_SUPPORTED: 'BROWSER_NOT_SUPPORTED',
  IP_LOCATION_FAILED: 'IP_LOCATION_FAILED',
  API_LOAD_FAILED: 'API_LOAD_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * 定位错误类
 */
export class LocationError extends Error {
  constructor (type, message, originalError = null, retryable = false) {
    super(message);
    this.name = 'LocationError';
    this.type = type;
    this.originalError = originalError;
    this.retryable = retryable;
    this.timestamp = new Date().toISOString();
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage () {
    const messages = {
      [LocationErrorType.PERMISSION_DENIED]: '请允许访问您的位置信息以获取更精准的服务',
      [LocationErrorType.TIMEOUT_ERROR]: '定位请求超时，请检查网络连接',
      [LocationErrorType.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
      [LocationErrorType.POSITION_UNAVAILABLE]: '无法获取位置信息，请稍后重试',
      [LocationErrorType.BROWSER_NOT_SUPPORTED]: '您的浏览器不支持定位功能',
      [LocationErrorType.IP_LOCATION_FAILED]: 'IP定位失败，使用默认位置',
      [LocationErrorType.API_LOAD_FAILED]: '地图服务加载失败，请刷新页面重试',
      [LocationErrorType.UNKNOWN_ERROR]: '定位失败，请稍后重试'
    };
    return messages[this.type] || messages[LocationErrorType.UNKNOWN_ERROR];
  }
}

/**
 * 增强版定位服务类
 * 使用腾讯地图JavaScript API GL作为主要定位方案
 */
class LocationServiceEnhanced {
  constructor () {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30分钟缓存
    this.currentLocation = null;
    this.watchId = null;

    // 性能配置
    this.config = {
      gpsTimeout: 5000, // GPS定位5秒超时
      ipTimeout: 3000, // IP定位3秒超时
      totalTimeout: 8000, // 总超时8秒（预留缓冲）
      enableHighAccuracy: true,
      maximumAge: 5 * 60 * 1000 // 5分钟内缓存可接受
    };

    // 默认位置（北京）
    this.defaultLocation = {
      latitude: 39.9042,
      longitude: 116.4074,
      province: '北京市',
      city: '北京市',
      district: '东城区',
      address: '北京市东城区',
      source: 'default',
      accuracy: 10000,
      timestamp: Date.now()
    };

    this.init();
  }

  /**
   * 初始化定位服务
   */
  async init () {
    console.log('[LocationService] 初始化定位服务...');
    await this.loadCachedLocation();
  }

  /**
   * 获取当前位置（主入口）
   * 使用腾讯地图API进行定位，失败时自动回退到默认位置
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 位置信息
   */
  async getCurrentLocation (options = {}) {
    const startTime = Date.now();

    console.log('[LocationService] 开始获取位置...', options);

    try {
      // 检查缓存（如果强制刷新则跳过缓存）
      if (!options.forceRefresh) {
        const cached = this.getCachedLocation();
        if (cached) {
          console.log('[LocationService] 使用缓存位置:', cached.city);
          // 如果缓存是default位置，强制刷新
          if (cached.source === 'default') {
            console.log('[LocationService] 缓存为默认位置，强制刷新');
          } else {
            return {
              success: true,
              data: cached,
              source: 'cache',
              responseTime: Date.now() - startTime
            };
          }
        }
      } else {
        console.log('[LocationService] 强制刷新，跳过缓存');
      }

      // 使用腾讯地图定位服务
      console.log('[LocationService] 调用腾讯地图定位服务...');
      const result = await tencentLocationService.getCurrentLocation({
        ...this.config,
        ...options
      });

      console.log('[LocationService] 定位结果:', result);

      // 缓存成功的定位结果
      if (result.success && result.data) {
        this.cacheLocation(result.data);
      }

      return {
        ...result,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('[LocationService] 定位失败:', error);

      // 返回默认位置作为最后手段
      return {
        success: true,
        data: this.defaultLocation,
        source: 'default',
        responseTime: Date.now() - startTime,
        warning: '定位失败，使用默认位置',
        error: error instanceof LocationError ? error.getUserMessage() : error.message
      };
    }
  }

  /**
   * 仅获取位置（不获取天气）
   * 用于ModernDashboard等只需要位置信息的场景
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 位置信息
   */
  async getLocationOnly (options = {}) {
    return this.getCurrentLocation(options);
  }

  /**
   * 获取缓存位置
   */
  getCachedLocation () {
    const cached = this.cache.get('currentLocation');
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete('currentLocation');
      return null;
    }

    return cached.data;
  }

  /**
   * 缓存位置
   */
  cacheLocation (location) {
    this.cache.set('currentLocation', {
      data: location,
      timestamp: Date.now()
    });

    // 同时保存到localStorage
    try {
      localStorage.setItem('location_cache', JSON.stringify({
        data: location,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('[LocationService] localStorage缓存失败:', e);
    }
  }

  /**
   * 加载缓存位置
   */
  async loadCachedLocation () {
    try {
      const cached = localStorage.getItem('location_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        if (now - parsed.timestamp < this.cacheTimeout) {
          this.cache.set('currentLocation', parsed);
          console.log('[LocationService] 从localStorage加载缓存位置');
        }
      }
    } catch (e) {
      console.warn('[LocationService] 加载缓存位置失败:', e);
    }
  }

  /**
   * 计算两点间距离（Haversine公式）
   */
  calculateDistance (lat1, lon1, lat2, lon2) {
    return calculateDistance(lat1, lon1, lat2, lon2);
  }

  /**
   * 评估定位精度
   */
  evaluateAccuracy (accuracy) {
    if (accuracy <= 10) return 'excellent'; // GPS级
    if (accuracy <= 50) return 'good'; // Wi-Fi级
    if (accuracy <= 100) return 'fair'; // 基站级
    if (accuracy <= 1000) return 'poor'; // 粗糙
    return 'very_poor'; // 很差
  }
}

// 创建单例实例
const locationServiceEnhanced = new LocationServiceEnhanced();

export default locationServiceEnhanced;
export { LocationServiceEnhanced };
