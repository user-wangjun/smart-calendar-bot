/**
 * 高德地图定位服务
 * 集成高德开放平台IP定位和地理编码API
 * API文档: https://lbs.amap.com/api/webservice/guide/api/ipconfig
 */

import axios from 'axios';

/**
 * 高德定位服务类
 */
class AmapLocationService {
  constructor () {
    this.apiKey = null;
    this.currentLocation = null;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 设置API密钥
   * @param {string} key - 高德开放平台申请的Web服务API密钥
   */
  setApiKey (key) {
    this.apiKey = key;
  }

  /**
   * 获取当前配置的API密钥
   * @returns {string|null} - API密钥
   */
  getApiKey () {
    return this.apiKey;
  }

  /**
   * 验证API密钥是否有效
   * @returns {boolean} - 是否有效
   */
  isApiKeyValid () {
    return !!this.apiKey && this.apiKey.length > 10;
  }

  /**
   * 获取当前位置（主入口）
   * 优先使用浏览器定位，失败时使用IP定位
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} - 位置信息
   */
  async getCurrentLocation (options = {}) {
    const {
      forceRefresh = false,
      enableHighAccuracy = true,
      timeout = 10000
    } = options;

    try {
      // 检查缓存
      if (!forceRefresh) {
        const cached = this.getCachedLocation();
        if (cached) {
          return {
            success: true,
            data: cached,
            source: 'cache'
          };
        }
      }

      // 检查API密钥
      if (!this.isApiKeyValid()) {
        throw new Error('高德定位API密钥未配置或无效');
      }

      // 尝试浏览器定位
      let locationResult = null;
      let locationSource = null;

      if (navigator.geolocation) {
        try {
          const browserLocation = await this.getBrowserLocation({
            enableHighAccuracy,
            timeout
          });
          if (browserLocation.success) {
            locationResult = browserLocation.data;
            locationSource = 'browser';
          }
        } catch (error) {
          console.warn('[高德定位] 浏览器定位失败，尝试IP定位:', error.message);
        }
      }

      // 如果浏览器定位失败，使用IP定位
      if (!locationResult) {
        const ipLocation = await this.getIPLocation();
        if (ipLocation.success) {
          locationResult = ipLocation.data;
          locationSource = 'ip';
        }
      }

      if (locationResult) {
        // 缓存位置信息
        this.cacheLocation(locationResult);
        this.currentLocation = locationResult;

        return {
          success: true,
          data: locationResult,
          source: locationSource
        };
      }

      throw new Error('无法获取位置信息');
    } catch (error) {
      console.error('[高德定位] 获取位置失败:', error);

      // 尝试使用缓存
      const cached = this.getCachedLocation();
      if (cached) {
        return {
          success: true,
          data: cached,
          source: 'cache',
          warning: '实时获取失败，使用缓存数据'
        };
      }

      // 返回默认位置（北京）
      return {
        success: true,
        data: this.getDefaultLocation(),
        source: 'default',
        warning: '使用默认位置'
      };
    }
  }

  /**
   * 使用浏览器Geolocation API获取位置
   * @param {Object} options - 定位选项
   * @returns {Promise<Object>} - 位置信息
   */
  async getBrowserLocation (options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理定位'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;

            // 通过逆地理编码获取详细地址
            let addressInfo = await this.getAddressByCoords(latitude, longitude);

            // 如果逆地理编码失败，尝试使用IP定位获取城市
            if (!addressInfo || !addressInfo.city) {
              console.warn('[高德定位] 逆地理编码未返回城市信息，尝试IP定位');
              try {
                const ipLocation = await this.getIPLocation();
                if (ipLocation.success && ipLocation.data.city) {
                  addressInfo = {
                    city: ipLocation.data.city,
                    province: ipLocation.data.province,
                    district: '',
                    adcode: ipLocation.data.adcode,
                    formattedAddress: ipLocation.data.city
                  };
                }
              } catch (ipError) {
                console.warn('[高德定位] IP定位也失败了:', ipError.message);
              }
            }

            resolve({
              success: true,
              data: {
                latitude,
                longitude,
                accuracy,
                city: addressInfo.city || '未知',
                district: addressInfo.district || '',
                province: addressInfo.province || '',
                address: addressInfo.formattedAddress || '',
                adcode: addressInfo.adcode || '',
                source: 'browser',
                timestamp: new Date().toISOString()
              }
            });
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          let errorMessage = '定位失败';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '用户拒绝了定位请求';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置信息不可用';
              break;
            case error.TIMEOUT:
              errorMessage = '定位超时';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: options.enableHighAccuracy ?? true,
          timeout: options.timeout ?? 10000,
          maximumAge: 60000
        }
      );
    });
  }

  /**
   * 使用高德IP定位API获取位置
   * @returns {Promise<Object>} - 位置信息
   */
  async getIPLocation () {
    try {
      const url = 'https://restapi.amap.com/v3/ip';
      const response = await axios.get(url, {
        params: {
          key: this.apiKey,
          output: 'JSON'
        },
        timeout: 10000
      });

      const data = response.data;

      if ((data.status === '1' || data.status === 1) && data.rectangle) {
        // 解析矩形区域获取中心点坐标
        const coords = this.parseRectangle(data.rectangle);

        // 处理可能为数组的字段
        const normalizeField = (field) => {
          if (Array.isArray(field)) {
            return field[0] || '';
          }
          return field || '';
        };

        const city = normalizeField(data.city) || '未知';
        const province = normalizeField(data.province);
        const adcode = normalizeField(data.adcode);

        return {
          success: true,
          data: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            city,
            province,
            adcode,
            source: 'ip',
            timestamp: new Date().toISOString()
          }
        };
      }

      throw new Error(`IP定位失败: ${data.info || '未知错误'}`);
    } catch (error) {
      console.error('[AmapLocationService] IP定位错误:', error);
      throw error;
    }
  }

  /**
   * 通过坐标获取地址信息（逆地理编码）
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   * @returns {Promise<Object>} - 地址信息
   */
  async getAddressByCoords (latitude, longitude) {
    try {
      const url = 'https://restapi.amap.com/v3/geocode/regeo';
      const response = await axios.get(url, {
        params: {
          key: this.apiKey,
          location: `${longitude},${latitude}`,
          extensions: 'all',
          output: 'JSON'
        },
        timeout: 10000
      });

      const data = response.data;

      if ((data.status === '1' || data.status === 1) && data.regeocode) {
        const addressComponent = data.regeocode.addressComponent || {};

        // 处理可能为数组的字段（高德API有时会返回数组）
        const normalizeField = (field) => {
          if (Array.isArray(field)) {
            return field[0] || '';
          }
          return field || '';
        };

        const province = normalizeField(addressComponent.province);
        const city = normalizeField(addressComponent.city) || province;
        const district = normalizeField(addressComponent.district);

        return {
          province,
          city,
          district,
          street: normalizeField(addressComponent.street),
          streetNumber: normalizeField(addressComponent.streetNumber),
          township: normalizeField(addressComponent.township),
          adcode: normalizeField(addressComponent.adcode),
          formattedAddress: data.regeocode.formatted_address || ''
        };
      }

      throw new Error('逆地理编码失败');
    } catch (error) {
      console.error('[高德定位] 逆地理编码失败:', error);
      return {};
    }
  }

  /**
   * 通过地址获取坐标（地理编码）
   * @param {string} address - 地址
   * @returns {Promise<Object>} - 坐标信息
   */
  async getCoordsByAddress (address) {
    try {
      const url = 'https://restapi.amap.com/v3/geocode/geo';
      const response = await axios.get(url, {
        params: {
          key: this.apiKey,
          address,
          output: 'JSON'
        },
        timeout: 10000
      });

      const data = response.data;

      if ((data.status === '1' || data.status === 1) && data.geocodes && data.geocodes.length > 0) {
        const geocode = data.geocodes[0];
        const location = geocode.location.split(',');

        // 处理可能为数组的字段
        const normalizeField = (field) => {
          if (Array.isArray(field)) {
            return field[0] || '';
          }
          return field || '';
        };

        return {
          success: true,
          data: {
            longitude: parseFloat(location[0]),
            latitude: parseFloat(location[1]),
            province: normalizeField(geocode.province),
            city: normalizeField(geocode.city),
            district: normalizeField(geocode.district),
            adcode: normalizeField(geocode.adcode),
            formattedAddress: geocode.formatted_address || ''
          }
        };
      }

      throw new Error('地理编码失败');
    } catch (error) {
      console.error('[高德定位] 地理编码失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 解析矩形区域字符串获取中心点
   * @param {string} rectangle - 矩形区域字符串，格式："minLon,minLat;maxLon,maxLat"
   * @returns {Object} - 中心点坐标
   */
  parseRectangle (rectangle) {
    try {
      // 确保 rectangle 是字符串类型
      if (typeof rectangle !== 'string') {
        console.warn('[高德定位] rectangle 不是字符串类型:', typeof rectangle, rectangle);
        return { longitude: 116.4074, latitude: 39.9042 }; // 默认北京
      }

      const parts = rectangle.split(';');
      if (parts.length === 2) {
        const [minLon, minLat] = parts[0].split(',').map(Number);
        const [maxLon, maxLat] = parts[1].split(',').map(Number);

        // 检查解析结果是否为有效数字
        if (!isNaN(minLon) && !isNaN(minLat) && !isNaN(maxLon) && !isNaN(maxLat)) {
          return {
            longitude: (minLon + maxLon) / 2,
            latitude: (minLat + maxLat) / 2
          };
        }
      }

      console.warn('[高德定位] rectangle 格式不正确:', rectangle);
    } catch (error) {
      console.error('[高德定位] 解析矩形区域失败:', error);
    }

    return { longitude: 116.4074, latitude: 39.9042 }; // 默认北京
  }

  /**
   * 获取默认位置（北京）
   * @returns {Object} - 默认位置信息
   */
  getDefaultLocation () {
    return {
      latitude: 39.9042,
      longitude: 116.4074,
      city: '北京市',
      province: '北京市',
      district: '',
      address: '北京市',
      adcode: '110000',
      source: 'default',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 缓存位置信息
   * @param {Object} location - 位置信息
   */
  cacheLocation (location) {
    this.cache.set('currentLocation', {
      data: location,
      timestamp: Date.now()
    });
  }

  /**
   * 获取缓存的位置信息
   * @returns {Object|null} - 缓存的位置信息
   */
  getCachedLocation () {
    const cached = this.cache.get('currentLocation');
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete('currentLocation');
      return null;
    }

    return cached.data;
  }

  /**
   * 清除缓存
   */
  clearCache () {
    this.cache.clear();
    this.currentLocation = null;
    console.log('[高德定位] 缓存已清除');
  }

  /**
   * 测试API连接
   * @returns {Promise<Object>} - 测试结果
   */
  async testConnection () {
    try {
      if (!this.isApiKeyValid()) {
        return {
          success: false,
          error: 'API密钥未配置或无效'
        };
      }

      const result = await this.getIPLocation();

      return {
        success: result.success,
        data: result.data,
        error: result.success ? null : result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || '连接测试失败'
      };
    }
  }

  /**
   * 获取服务状态
   * @returns {Object} - 服务状态
   */
  getServiceStatus () {
    return {
      apiKeyConfigured: this.isApiKeyValid(),
      currentLocation: this.currentLocation,
      hasCachedData: !!this.getCachedLocation(),
      cacheSize: this.cache.size
    };
  }
}

// 创建单例实例
const amapLocationService = new AmapLocationService();

export default amapLocationService;
export { AmapLocationService };
