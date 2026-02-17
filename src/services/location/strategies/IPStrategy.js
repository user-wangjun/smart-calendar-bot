/**
 * IP定位策略 (降级方案 B)
 * 调用腾讯地图IP定位 API
 * 严格1秒超时
 */
import tencentLocationService from '../../tencentLocationService.js';
import { validateCoordinates } from '../../../utils/geoUtils.js';

export default class IPStrategy {
  constructor () {
    this.name = 'ip';
    this.timeout = 1000; // 1秒超时
  }

  /**
   * 执行定位
   * @returns {Promise<Object>}
   */
  async execute () {
    try {
      const timeoutPromise = new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error('IP定位超时(1s)')), this.timeout);
      });

      // 调用现有服务的IP定位方法 (虽然是私有方法，但在JS中可访问)
      // 如果未来重构，建议将IP定位公开为公共方法
      const ipPromise = tencentLocationService._getIPLocation();

      const result = await Promise.race([ipPromise, timeoutPromise]);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'IP定位失败');
      }

      const { latitude, longitude, city, province } = result.data;

      if (!validateCoordinates(latitude, longitude)) {
        throw new Error(`无效坐标: ${latitude}, ${longitude}`);
      }

      return {
        success: true,
        data: {
          latitude,
          longitude,
          altitude: 0,
          accuracy: 1000, // IP定位精度较低，给个默认值
          speed: 0,
          provider: 'ip',
          type: 'Wi-Fi', // 视为网络定位
          city,
          province,
          timestamp: Date.now()
        },
        source: 'tencent_ip'
      };
    } catch (error) {
      console.warn('[IPStrategy] 定位失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
