/**
 * 腾讯地图定位服务
 * 使用浏览器原生定位 + 腾讯地图WebService API进行逆地理编码
 */

// import { LocationError, LocationErrorType } from './locationServiceEnhanced.js';
import envConfig from '../config/env.js';

/**
 * 腾讯地图定位服务类
 */
class TencentLocationService {
  constructor () {
    this.apiKey = envConfig.get('TENCENT_MAP_KEY') || '';

    // 性能配置
    this.config = {
      gpsTimeout: 5000, // GPS定位5秒超时
      ipTimeout: 3000, // IP定位3秒超时
      totalTimeout: 8000, // 总超时8秒
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
  }

  /**
   * 获取当前位置（主入口）
   * 优先使用浏览器GPS定位，失败时回退到IP定位
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 位置信息
   */
  async getCurrentLocation (options = {}) {
    const startTime = Date.now();
    const config = { ...this.config, ...options };

    console.log('[TencentLocationService] 开始定位...');

    try {
      // 首先尝试GPS定位
      const gpsResult = await this._getGPSLocation(config);
      if (gpsResult.success) {
        // GPS定位成功，进行逆地理编码
        const addressResult = await this._reverseGeocode(gpsResult.latitude, gpsResult.longitude);
        if (addressResult.success) {
          return {
            success: true,
            data: {
              latitude: gpsResult.latitude,
              longitude: gpsResult.longitude,
              ...addressResult.data,
              source: 'tencent_gps',
              accuracy: gpsResult.accuracy,
              timestamp: Date.now()
            },
            source: 'tencent_gps',
            responseTime: Date.now() - startTime
          };
        } else {
          // 逆地理编码失败，但仍返回GPS坐标
          console.log('[TencentLocationService] 逆地理编码失败，返回GPS坐标');
          return {
            success: true,
            data: {
              latitude: gpsResult.latitude,
              longitude: gpsResult.longitude,
              province: '未知',
              city: '未知位置',
              district: '未知',
              address: `${gpsResult.latitude.toFixed(4)}, ${gpsResult.longitude.toFixed(4)}`,
              source: 'tencent_gps_coords',
              accuracy: gpsResult.accuracy,
              timestamp: Date.now()
            },
            source: 'tencent_gps_coords',
            responseTime: Date.now() - startTime
          };
        }
      }

      // GPS定位失败，尝试IP定位（需要域名白名单）
      console.log('[TencentLocationService] GPS定位失败，尝试IP定位...');
      const ipResult = await this._getIPLocation();
      if (ipResult.success) {
        return {
          success: true,
          data: {
            ...ipResult.data,
            source: 'tencent_ip',
            timestamp: Date.now()
          },
          source: 'tencent_ip',
          responseTime: Date.now() - startTime
        };
      }

      // GPS和IP定位都失败，返回默认位置
      console.warn('[TencentLocationService] 所有定位方式都失败，使用默认位置');
      return {
        success: true,
        data: {
          ...this.defaultLocation,
          timestamp: Date.now()
        },
        source: 'default',
        warning: '定位失败，使用默认位置',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('[TencentLocationService] 定位失败:', error);
      throw error;
    }
  }

  /**
   * 使用浏览器原生API获取GPS定位
   * @private
   */
  _getGPSLocation (config) {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('[TencentLocationService] 浏览器不支持地理定位');
        resolve({ success: false });
        return;
      }

      console.log('[TencentLocationService] 请求GPS定位...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('[TencentLocationService] GPS定位成功');
          resolve({
            success: true,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMsg = error.message;
          if (error.code === 1) {
            errorMsg = '用户拒绝了定位权限，请在浏览器设置中允许位置访问';
          } else if (error.code === 2) {
            errorMsg = '无法获取位置信息，请检查GPS是否开启';
          } else if (error.code === 3) {
            errorMsg = '定位超时，请检查网络连接';
          }
          console.log('[TencentLocationService] GPS定位失败:', errorMsg);
          resolve({ success: false, error: errorMsg, code: error.code });
        },
        {
          enableHighAccuracy: config.enableHighAccuracy,
          timeout: config.gpsTimeout,
          maximumAge: config.maximumAge
        }
      );
    });
  }

  /**
   * 使用腾讯地图WebService API进行逆地理编码
   * @private
   */
  async _reverseGeocode (latitude, longitude) {
    if (!this.apiKey) {
      console.warn('[TencentLocationService] API密钥未配置，跳过逆地理编码');
      return {
        success: true,
        data: {
          province: '未知',
          city: '未知',
          district: '未知',
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }
      };
    }

    try {
      // 构建基础URL，不包含output和callback参数，由_jsonpRequest统一处理
      const baseUrl = `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=${this.apiKey}`;

      console.log('[TencentLocationService] 请求逆地理编码...');

      const result = await this._jsonpRequest(baseUrl, 5000);

      if (result.status === 0 && result.result) {
        const address = result.result.address_component;
        return {
          success: true,
          data: {
            province: address.province || '未知',
            city: address.city || address.province || '未知',
            district: address.district || '未知',
            address: result.result.formatted_addresses?.recommend || result.result.address || '未知'
          }
        };
      } else {
        throw new Error(result.message || '逆地理编码失败');
      }
    } catch (error) {
      console.error('[TencentLocationService] 逆地理编码失败:', error);
      return {
        success: true,
        data: {
          province: '未知',
          city: '未知',
          district: '未知',
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }
      };
    }
  }

  /**
   * 使用腾讯地图WebService API进行IP定位
   * @private
   */
  async _getIPLocation () {
    if (!this.apiKey) {
      console.warn('[TencentLocationService] API密钥未配置，跳过IP定位');
      return { success: false };
    }

    try {
      // 构建基础URL，不包含output和callback参数，由_jsonpRequest统一处理
      const baseUrl = `https://apis.map.qq.com/ws/location/v1/ip?key=${this.apiKey}`;

      console.log('[TencentLocationService] 请求IP定位...');

      const result = await this._jsonpRequest(baseUrl, 3000);

      if (result.status === 0 && result.result) {
        const location = result.result.location;
        const address = result.result.ad_info;

        return {
          success: true,
          data: {
            latitude: location.lat,
            longitude: location.lng,
            province: address.province || '未知',
            city: address.city || address.province || '未知',
            district: address.district || '未知',
            address: `${address.province || ''}${address.city || ''}${address.district || ''}`
          }
        };
      } else {
        throw new Error(result.message || 'IP定位失败');
      }
    } catch (error) {
      console.error('[TencentLocationService] IP定位失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * JSONP请求封装
   * 统一处理callback参数和output参数，避免重复添加
   * @private
   */
  _jsonpRequest (url, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const callbackName = 'tencentMapCallback_' + Date.now();
      const script = document.createElement('script');

      // 移除URL中已有的output和callback参数，避免重复
      let cleanUrl = url;
      cleanUrl = cleanUrl.replace(/&?output=jsonp/gi, '');
      cleanUrl = cleanUrl.replace(/&?callback=[^&]*/gi, '');

      // 添加回调函数名和output参数到URL
      const separator = cleanUrl.includes('?') ? '&' : '?';
      script.src = `${cleanUrl}${separator}output=jsonp&callback=${callbackName}`;

      // 设置超时
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('请求超时'));
      }, timeout);

      // 清理函数
      const cleanup = () => {
        clearTimeout(timeoutId);
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        delete window[callbackName];
      };

      // 定义回调函数
      window[callbackName] = (data) => {
        cleanup();
        resolve(data);
      };

      // 错误处理
      script.onerror = () => {
        cleanup();
        reject(new Error('脚本加载失败'));
      };

      document.head.appendChild(script);
    });
  }
}

// 创建单例实例
const tencentLocationService = new TencentLocationService();

export default tencentLocationService;
