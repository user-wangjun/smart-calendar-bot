/**
 * 系统定位策略 (降级方案 A)
 * 封装 navigator.geolocation
 * 智能定位策略：先高精度，超时自动降级为低精度
 */
import { validateCoordinates } from '../../../utils/geoUtils.js';

export default class SystemStrategy {
  constructor () {
    this.name = 'system';
    this.highAccuracyTimeout = 15000; // 高精度定位 15秒超时
    this.lowAccuracyTimeout = 10000; // 低精度定位 10秒超时
  }

  /**
   * 尝试单次定位
   * @param {boolean} enableHighAccuracy - 是否启用高精度
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise<GeolocationPosition>}
   */
  tryGetPosition (enableHighAccuracy, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('定位超时'));
      }, timeout);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve(pos);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge: 60000 // 1分钟内的缓存可接受
        }
      );
    });
  }

  /**
   * 执行定位（智能策略）
   * 先尝试高精度，失败后自动降级为低精度
   * @returns {Promise<Object>}
   */
  async execute () {
    if (!navigator.geolocation) {
      return { success: false, error: '浏览器不支持地理定位' };
    }

    let position = null;
    let lastError = null;

    try {
      // 第一次尝试：高精度定位
      console.log('[SystemStrategy] 尝试高精度定位...');
      position = await this.tryGetPosition(true, this.highAccuracyTimeout);
      console.log('[SystemStrategy] 高精度定位成功');
    } catch (error) {
      lastError = error;

      // 如果是超时或位置不可用，尝试低精度定位
      if (error.code === 3 || error.code === 2 || error.message === '定位超时') {
        console.warn('[SystemStrategy] 高精度定位失败，尝试低精度定位...');
        try {
          position = await this.tryGetPosition(false, this.lowAccuracyTimeout);
          console.log('[SystemStrategy] 低精度定位成功');
        } catch (lowError) {
          lastError = lowError;
        }
      }
    }

    if (position) {
      const { latitude, longitude, altitude, accuracy, altitudeAccuracy, speed, heading } = position.coords;

      // 数据校验
      if (!validateCoordinates(latitude, longitude)) {
        return {
          success: false,
          error: `无效坐标: ${latitude}, ${longitude}`
        };
      }

      return {
        success: true,
        data: {
          latitude,
          longitude,
          altitude: altitude || 0,
          accuracy,
          altitudeAccuracy: altitudeAccuracy || 0,
          speed: speed || 0,
          heading: heading || 0,
          provider: 'system',
          type: position.coords.accuracy < 100 ? 'GPS' : 'Network',
          timestamp: position.timestamp
        },
        source: 'system'
      };
    }

    // 所有尝试都失败
    let msg = lastError?.message || '定位失败';
    if (lastError?.code === 1) msg = '用户拒绝定位权限';
    if (lastError?.code === 2) msg = '位置不可用，请检查设备定位功能';
    if (lastError?.code === 3) msg = '定位超时，请检查网络连接后重试';

    console.warn('[SystemStrategy] 所有定位尝试均失败:', msg);
    return {
      success: false,
      error: msg
    };
  }
}
