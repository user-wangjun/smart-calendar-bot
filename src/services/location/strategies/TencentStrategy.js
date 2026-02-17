/**
 * 腾讯定位策略
 * 封装腾讯地图 WebService API / JS SDK
 * 严格执行3秒超时和数据校验
 */
import tencentLocationService from '../../tencentLocationService.js';
import { validateCoordinates } from '../../../utils/geoUtils.js';

export default class TencentStrategy {
  constructor () {
    this.name = 'tencent';
    this.timeout = 3000; // 3秒超时
  }

  /**
   * 执行定位
   * @returns {Promise<Object>}
   */
  async execute () {
    try {
      // 构造超时Promise
      const timeoutPromise = new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error('腾讯定位超时(3s)')), this.timeout);
      });

      // 调用原有服务，传入严格配置
      // 注意：原有服务的timeout参数可能被其内部逻辑覆盖，这里我们在外部再次强制超时
      const locationPromise = tencentLocationService.getCurrentLocation({
        timeout: this.timeout,
        enableHighAccuracy: true
      });

      const result = await Promise.race([locationPromise, timeoutPromise]);

      if (!result.success || !result.data) {
        throw new Error(result.error || '腾讯定位返回失败');
      }

      const { latitude, longitude, accuracy, timestamp } = result.data;

      // 数据有效性验证
      if (!validateCoordinates(latitude, longitude)) {
        throw new Error(`无效坐标: ${latitude}, ${longitude}`);
      }

      if (accuracy <= 0) {
        throw new Error(`无效精度: ${accuracy}`);
      }

      // 构造标准返回格式
      return {
        success: true,
        data: {
          latitude,
          longitude,
          altitude: result.data.altitude || 0, // 腾讯API可能不返回海拔
          accuracy,
          speed: result.data.speed || 0,
          provider: 'tencent',
          type: result.source === 'tencent_gps' ? 'GPS' : 'Network', // 映射位置类型
          timestamp: timestamp || Date.now()
        },
        source: 'tencent'
      };
    } catch (error) {
      console.warn('[TencentStrategy] 定位失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
