/**
 * 浏览器原生定位服务
 * 使用 navigator.geolocation API 获取设备位置
 * 符合隐私政策要求，需用户授权
 */

/**
 * 浏览器定位错误类型
 */
const BrowserLocationErrorType = {
  PERMISSION_DENIED: 'PERMISSION_DENIED', // 用户拒绝位置权限
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE', // 位置信息不可用
  TIMEOUT: 'TIMEOUT', // 定位超时
  NOT_SUPPORTED: 'NOT_SUPPORTED', // 浏览器不支持
  UNKNOWN_ERROR: 'UNKNOWN_ERROR' // 未知错误
};

/**
 * 浏览器定位错误类
 */
class BrowserLocationError extends Error {
  constructor (message, type = BrowserLocationErrorType.UNKNOWN_ERROR, originalError = null) {
    super(message);
    this.name = 'BrowserLocationError';
    this.type = type;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage () {
    const messages = {
      [BrowserLocationErrorType.PERMISSION_DENIED]: '位置权限被拒绝，请在浏览器设置中允许访问位置信息',
      [BrowserLocationErrorType.POSITION_UNAVAILABLE]: '无法获取位置信息，请检查设备定位功能',
      [BrowserLocationErrorType.TIMEOUT]: '定位请求超时，请检查网络连接',
      [BrowserLocationErrorType.NOT_SUPPORTED]: '您的浏览器不支持地理定位功能',
      [BrowserLocationErrorType.UNKNOWN_ERROR]: '定位时发生未知错误'
    };
    return messages[this.type] || this.message;
  }
}

/**
 * 检查浏览器是否支持地理定位
 * @returns {boolean}
 */
function isGeolocationSupported () {
  return 'geolocation' in navigator && !!navigator.geolocation;
}

/**
 * 浏览器定位服务类
 */
class BrowserLocationService {
  constructor () {
    this.defaultOptions = {
      enableHighAccuracy: true, // 高精度定位
      timeout: 10000, // 10秒超时
      maximumAge: 60000 // 1分钟内缓存可接受
    };
  }

  /**
   * 获取当前位置（主入口）
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} - 位置信息
   */
  async getCurrentPosition (options = {}) {
    const config = { ...this.defaultOptions, ...options };

    // 检查浏览器支持
    if (!isGeolocationSupported()) {
      throw new BrowserLocationError(
        '浏览器不支持地理定位',
        BrowserLocationErrorType.NOT_SUPPORTED
      );
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        // 成功回调
        (position) => {
          const location = this.parsePosition(position);
          console.log('[BrowserLocation] 定位成功:', location);
          resolve({
            success: true,
            data: location,
            source: 'browser',
            provider: 'browser_gps'
          });
        },
        // 错误回调
        (error) => {
          const parsedError = this.parseError(error);
          // 将超时等预期内错误降级为warn，避免污染日志
          if (parsedError.type === BrowserLocationErrorType.TIMEOUT ||
              parsedError.type === BrowserLocationErrorType.PERMISSION_DENIED) {
            console.warn('[BrowserLocation] 定位未成功:', parsedError.message);
          } else {
            console.error('[BrowserLocation] 定位错误:', parsedError);
          }
          reject(parsedError);
        },
        // 选项
        config
      );
    });
  }

  /**
   * 解析浏览器返回的位置数据
   * @param {GeolocationPosition} position - 浏览器位置对象
   * @returns {Object} - 解析后的位置数据
   */
  parsePosition (position) {
    const coords = position.coords;

    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      speed: coords.speed,
      timestamp: position.timestamp,
      // 标记为浏览器GPS定位
      source: 'browser',
      provider: 'browser_gps'
    };
  }

  /**
   * 解析浏览器定位错误
   * @param {GeolocationPositionError} error - 浏览器错误对象
   * @returns {BrowserLocationError} - 解析后的错误
   */
  parseError (error) {
    let errorType = BrowserLocationErrorType.UNKNOWN_ERROR;
    let message = '定位失败';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorType = BrowserLocationErrorType.PERMISSION_DENIED;
        message = '用户拒绝了位置权限请求';
        break;
      case error.POSITION_UNAVAILABLE:
        errorType = BrowserLocationErrorType.POSITION_UNAVAILABLE;
        message = '位置信息不可用';
        break;
      case error.TIMEOUT:
        errorType = BrowserLocationErrorType.TIMEOUT;
        message = '定位请求超时';
        break;
      default:
        message = error.message || '未知错误';
    }

    return new BrowserLocationError(message, errorType, error);
  }

  /**
   * 检查位置权限状态
   * @returns {Promise<string>} - 权限状态 ('granted', 'denied', 'prompt', 'unknown')
   */
  async checkPermission () {
    try {
      // 使用 Permissions API 检查权限（如果支持）
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state;
      }
      return 'unknown';
    } catch (error) {
      console.warn('[BrowserLocation] 无法检查权限状态:', error);
      return 'unknown';
    }
  }

  /**
   * 请求位置权限（通过调用定位）
   * 浏览器会在首次调用时自动请求权限
   * @returns {Promise<Object>} - 权限请求结果
   */
  async requestPermission () {
    try {
      const result = await this.getCurrentPosition({ timeout: 5000 });
      return {
        granted: true,
        location: result.data
      };
    } catch (error) {
      return {
        granted: false,
        error,
        errorType: error.type
      };
    }
  }

  /**
   * 带超时的定位请求
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<Object>}
   */
  async getPositionWithTimeout (timeout = 10000) {
    return this.getCurrentPosition({ timeout });
  }

  /**
   * 智能定位：优先尝试高精度，失败后自动重试低精度
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>}
   */
  async getCurrentPositionWithRetry (options = {}) {
    const { timeout = 10000, ...otherOptions } = options;

    try {
      // 第一次尝试：高精度
      console.log('[BrowserLocation] 尝试高精度定位...');
      return await this.getCurrentPosition({
        ...otherOptions,
        enableHighAccuracy: true,
        timeout
      });
    } catch (error) {
      // 如果是超时，且没有显式禁用重试，则尝试低精度
      // 注意：只有超时才值得重试低精度，权限拒绝重试也没用
      if (error.type === BrowserLocationErrorType.TIMEOUT) {
        console.warn('[BrowserLocation] 高精度定位超时，自动尝试低精度/IP辅助定位...');
        return await this.getCurrentPosition({
          ...otherOptions,
          enableHighAccuracy: false,
          timeout
        });
      }
      throw error;
    }
  }

  /**
   * 获取服务状态
   * @returns {Object}
   */
  getServiceStatus () {
    return {
      supported: isGeolocationSupported(),
      defaultOptions: this.defaultOptions
    };
  }
}

// 创建单例实例
const browserLocationService = new BrowserLocationService();

export default browserLocationService;
export {
  BrowserLocationService,
  BrowserLocationError,
  BrowserLocationErrorType,
  isGeolocationSupported
};
