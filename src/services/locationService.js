/**
 * 定位服务
 * 集成MCP Amap定位服务，提供用户位置信息获取功能
 */

import { calculateDistanceBetweenLocations } from '../utils/geoUtils.js';

class LocationService {
  constructor () {
    // MCP服务配置
    this.mcpService = 'mcp_amap-amap-sse_maps_geo';
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30分钟
    this.currentLocation = null;
    this.watchId = null;

    // 初始化事件监听器
    this.eventListeners = new Map();

    // 默认位置（北京）
    this.defaultLocation = {
      latitude: 39.9042,
      longitude: 116.4074,
      province: '北京市',
      city: '北京市',
      district: '东城区',
      address: '北京市东城区'
    };

    this.init();
  }

  /**
   * 初始化定位服务
   */
  async init () {
    console.log('初始化定位服务...');

    // 检查浏览器支持
    if (!('geolocation' in navigator)) {
      console.warn('浏览器不支持地理位置API');
      return;
    }

    // 加载缓存的位置
    await this.loadCachedLocation();

    // 设置位置变化监听
    this.setupLocationWatch();
  }

  /**
   * 获取当前位置
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 位置信息
   */
  async getCurrentLocation (options = {}) {
    // const {
    //   enableHighAccuracy = true,
    //   timeout = 10000,
    //   maximumAge = 0
    // } = options;

    try {
      // 检查缓存
      const cached = this.getCachedLocation();
      if (cached && !options.forceRefresh) {
        console.log('使用缓存的位置');
        return cached;
      }

      // 调用MCP定位服务
      const location = await this.callMCPGeoService();

      if (location.success) {
        this.currentLocation = location.data;
        this.cacheLocation(location.data);

        return {
          success: true,
          data: location.data,
          source: 'mcp',
          cached: false
        };
      }

      // 如果MCP服务失败，回退到浏览器API
      console.warn('MCP定位服务失败，使用浏览器API');
      return await this.getBrowserLocation(options);
    } catch (error) {
      console.error('获取位置失败:', error);

      // 返回默认位置
      return {
        success: false,
        data: this.defaultLocation,
        error: error.message,
        source: 'default'
      };
    }
  }

  /**
   * 调用MCP地理编码服务
   * @returns {Promise<Object>} - 定位结果
   */
  async callMCPGeoService () {
    try {
      // 检查MCP服务是否可用
      if (!this.isMCPServiceAvailable()) {
        return {
          success: false,
          error: 'MCP服务不可用'
        };
      }

      // 使用MCP工具获取位置
      const result = await this.invokeMCPTool('get_current_location', {});

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('MCP定位服务调用失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 使用浏览器地理位置API
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 位置信息
   */
  async getBrowserLocation (options = {}) {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('浏览器不支持地理位置'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('定位超时'));
      }, options.timeout || 10000);

      navigator.geolocation.getCurrentPosition(
        // 成功回调
        (position) => {
          clearTimeout(timeoutId);

          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };

          // 获取地址信息（逆地理编码）
          this.reverseGeocode(location).then(address => {
            resolve({
              success: true,
              data: {
                ...location,
                ...address
              },
              source: 'browser'
            });
          }).catch(() => {
            // 如果逆地理编码失败，只返回坐标
            resolve({
              success: true,
              data: location,
              source: 'browser'
            });
          });
        },

        // 错误回调
        (error) => {
          clearTimeout(timeoutId);

          let errorMessage = '定位失败';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '用户拒绝了定位请求';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置信息不可用';
              break;
            case error.TIMEOUT:
              errorMessage = '定位请求超时';
              break;
            case error.UNKNOWN_ERROR:
              errorMessage = '发生未知错误';
              break;
          }

          reject(new Error(errorMessage));
        },

        // 定位选项
        {
          enableHighAccuracy: options.enableHighAccuracy !== false,
          timeout: options.timeout || 10000,
          maximumAge: options.maximumAge || 0
        }
      );
    });
  }

  /**
   * 逆地理编码（坐标转地址）
   * @param {Object} location - 位置坐标
   * @returns {Promise<Object>} - 地址信息
   */
  async reverseGeocode (location) {
    try {
      // 调用MCP逆地理编码服务
      const result = await this.invokeMCPTool('reverse_geocode', {
        latitude: location.latitude,
        longitude: location.longitude
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('逆地理编码失败:', error);
      return {
        success: false,
        province: '未知',
        city: '未知',
        district: '未知',
        address: '未知位置'
      };
    }
  }

  /**
   * 设置位置监听
   */
  setupLocationWatch () {
    if (!('geolocation' in navigator)) {
      return;
    }

    // 清除旧的监听
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
    }

    // 设置新的监听
    this.watchId = navigator.geolocation.watchPosition(
      // 位置变化回调
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        this.currentLocation = location;
        this.cacheLocation(location);

        // 触发位置更新事件
        this.emit('location:updated', location);
      },

      // 错误回调
      (error) => {
        console.error('位置监听错误:', error);
        this.emit('location:error', error);
      },

      // 监听选项
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    console.log('位置监听已设置');
  }

  /**
   * 停止位置监听
   */
  stopLocationWatch () {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('位置监听已停止');
    }
  }

  /**
   * 缓存位置信息
   * @param {Object} location - 位置数据
   */
  cacheLocation (location) {
    const cacheKey = 'current_location';
    const cacheData = {
      ...location,
      cachedAt: Date.now()
    };

    this.cache.set(cacheKey, cacheData);

    // 同时保存到localStorage作为备份
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('保存位置缓存失败:', error);
    }
  }

  /**
   * 获取缓存的位置
   * @returns {Object|null>} - 缓存的位置
   */
  getCachedLocation () {
    const cacheKey = 'current_location';
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // 检查缓存是否过期
    const age = Date.now() - cached.cachedAt;
    if (age > this.cacheTimeout) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  /**
   * 加载缓存的位置
   */
  async loadCachedLocation () {
    const cached = this.getCachedLocation();

    if (cached) {
      this.currentLocation = cached;
      console.log('已加载缓存位置:', cached);
    }
  }

  /**
   * 清除位置缓存
   */
  clearLocationCache () {
    const cacheKey = 'current_location';
    this.cache.delete(cacheKey);
    localStorage.removeItem(cacheKey);
    this.currentLocation = null;
    console.log('位置缓存已清除');
  }

  /**
   * 刷新位置
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 刷新结果
   */
  async refreshLocation (options = {}) {
    console.log('刷新位置信息...');

    try {
      // 强制刷新，不使用缓存
      const result = await this.getCurrentLocation({
        ...options,
        forceRefresh: true
      });

      return result;
    } catch (error) {
      console.error('刷新位置失败:', error);
      return {
        success: false,
        error: error.message,
        data: this.defaultLocation
      };
    }
  }

  /**
   * 计算距离
   * @param {Object} location1 - 位置1
   * @param {Object} location2 - 位置2
   * @returns {number} - 距离（米）
   */
  calculateDistance (location1, location2) {
    return calculateDistanceBetweenLocations(location1, location2);
  }

  /**
   * 检查MCP服务是否可用
   * @returns {boolean} - 是否可用
   */
  isMCPServiceAvailable () {
    // 检查MCP工具是否注册
    return typeof window !== 'undefined' &&
           window.mcp &&
           window.mcp[this.mcpService];
  }

  /**
   * 调用MCP工具
   * @param {string} toolName - 工具名称
   * @param {Object} params - 参数
   * @returns {Promise<any>} - 工具执行结果
   */
  async invokeMCPTool (toolName, params = {}) {
    if (!this.isMCPServiceAvailable()) {
      throw new Error('MCP服务不可用');
    }

    const service = window.mcp[this.mcpService];

    if (!service || !service.callTool) {
      throw new Error(`MCP工具 ${toolName} 不可用`);
    }

    return await service.callTool(toolName, params);
  }

  /**
   * 获取位置统计
   * @returns {Promise<Object>} - 位置统计
   */
  async getLocationStats () {
    const cached = this.getCachedLocation();

    return {
      hasLocation: !!this.currentLocation,
      isCached: !!cached,
      cacheAge: cached ? Date.now() - cached.cachedAt : null,
      watching: this.watchId !== null,
      accuracy: this.currentLocation?.accuracy || null,
      source: this.currentLocation?.source || 'unknown'
    };
  }

  /**
   * 简单事件发射器
   */

  on (event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off (event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit (event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`位置服务事件监听器错误 [${event}]:`, error);
        }
      });
    }
  }
}

// 创建全局单例
const locationService = new LocationService();

export default locationService;
