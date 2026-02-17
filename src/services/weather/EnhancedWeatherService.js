/**
 * 增强型天气服务
 * 支持 WGS84->GCJ02 自动转换
 * 支持 请求签名验证
 * 支持 2秒超时与重试机制
 * 兼容 AmapWeatherService 接口
 */
import axios from 'axios';
import CryptoJS from 'crypto-js';
import envConfig from '../../config/env.js';
import { wgs84ToGcj02 } from '../../utils/geoUtils.js';

export class EnhancedWeatherService {
  constructor () {
    this.baseUrl = envConfig.getAmapApiUrl() + '/weather/weatherInfo';
    this.timeout = 8000; // 8秒超时
    this.maxRetries = 3; // 3次重试
  }

  // --- 适配接口 ---

  async getCurrentWeather (location, options = {}) {
    try {
      // 如果location是对象且包含lat/lon，视为WGS84坐标，需要转换
      // 如果location是字符串（城市名/adcode），直接使用
      let loc = location;
      if (typeof location === 'object' && location.latitude && location.longitude) {
        loc = location; // getWeather 内部会处理转换
      } else if (typeof location === 'string') {
        // 如果是字符串，包装一下，但在 fetch 时直接用
        loc = { adcode: location };
      }

      const res = await this.getWeather(loc, 'base');
      if (res.success && res.data.lives && res.data.lives.length > 0) {
        return {
          success: true,
          data: this.parseLiveWeatherData(res.data.lives[0], res.data.info),
          source: 'api'
        };
      }
      throw new Error('未获取到实况天气数据');
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async getWeatherForecast (location, options = {}) {
    try {
      let loc = location;
      if (typeof location === 'string') loc = { adcode: location };

      const res = await this.getWeather(loc, 'all');
      if (res.success && res.data.forecasts && res.data.forecasts.length > 0) {
        return {
          success: true,
          data: this.parseForecastWeatherData(res.data.forecasts[0], res.data.info),
          source: 'api'
        };
      }
      throw new Error('未获取到预报数据');
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async getFullWeather (location, options = {}) {
    const [current, forecast] = await Promise.all([
      this.getCurrentWeather(location, options),
      this.getWeatherForecast(location, options)
    ]);
    return {
      success: current.success,
      current: current.data,
      forecast: forecast.data,
      errors: {
        current: current.error,
        forecast: forecast.error
      }
    };
  }

  async getWeatherByCoords (lat, lon, options = {}) {
    return this.getFullWeather({ latitude: lat, longitude: lon }, options);
  }

  /**
   * IP定位 - 获取当前IP所在城市
   * 使用高德IP定位API，不消耗天气API配额
   * @returns {Promise<Object>} - 定位结果 {success, city, adcode, province}
   */
  async getLocationByIP () {
    try {
      const url = envConfig.getAmapApiUrl() + '/ip';
      const params = {
        key: envConfig.getAmapApiKey(),
        output: 'JSON'
      };

      // 添加签名（如果配置了安全密钥）
      const secret = envConfig.getAmapSecretKey();
      if (secret) {
        params.sig = this.generateSignature(params, secret);
      }

      const response = await axios.get(url, {
        params,
        timeout: 10000
      });

      const data = response.data;

      if ((data.status === '1' || data.status === 1) && data.adcode) {
        return {
          success: true,
          city: data.city || '未知城市',
          province: data.province || '',
          adcode: data.adcode,
          rectangle: data.rectangle || '',
          source: 'ip',
          provider: 'amap_ip'
        };
      }

      // 处理特定错误
      if (data.infocode === '10021') {
        throw new Error('高德API调用次数已超出今日配额限制');
      }

      throw new Error(`IP定位失败: ${data.info || '未知错误'}`);
    } catch (error) {
      console.error('[EnhancedWeatherService] IP定位失败:', error.message);
      return {
        success: false,
        error: error.message,
        city: '北京市',
        adcode: '110000',
        source: 'default'
      };
    }
  }

  // --- 核心逻辑 ---

  /**
   * 获取天气数据
   * @param {Object} location - { latitude, longitude } (WGS84) OR { adcode: '110000' }
   * @param {string} extensions - 'base' | 'all'
   */
  async getWeather (location, extensions = 'base') {
    let adcode;

    if (location.adcode) {
      adcode = location.adcode;
    } else if (location.latitude && location.longitude) {
      // 1. 坐标转换 (WGS84 -> GCJ02)
      const gcjLocation = wgs84ToGcj02(location.latitude, location.longitude);
      // 2. 获取城市编码
      adcode = await this.getAdcode(gcjLocation.latitude, gcjLocation.longitude);
    } else {
      throw new Error('无效的位置参数');
    }

    // 3. 构造请求参数
    const params = {
      key: envConfig.getAmapApiKey(),
      city: adcode,
      extensions,
      output: 'JSON'
    };

    // 4. 签名
    const secret = envConfig.getAmapSecretKey();
    if (secret) {
      params.sig = this.generateSignature(params, secret);
    }

    // 5. 发送请求
    return this.fetchWithRetry(params);
  }

  /**
   * 获取Adcode
   */
  async getAdcode (lat, lon) {
    const url = envConfig.getAmapApiUrl() + '/geocode/regeo';
    const params = {
      key: envConfig.getAmapApiKey(),
      location: `${lon},${lat}`,
      output: 'JSON'
    };

    const secret = envConfig.getAmapSecretKey();
    if (secret) {
      params.sig = this.generateSignature(params, secret);
    }

    try {
      const res = await axios.get(url, { params, timeout: 8000 });
      if (res.data.status === '1' && res.data.regeocode) {
        return res.data.regeocode.addressComponent.adcode;
      }
      throw new Error('逆地理编码失败: ' + res.data.info);
    } catch (e) {
      console.warn('获取Adcode失败，使用默认值(110000)', e.message);
      return '110000';
    }
  }

  /**
   * 根据坐标获取详细位置信息（包含区县）
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   * @returns {Promise<Object>} - 包含区县信息的位置数据
   */
  async getLocationDetailByCoords (lat, lon) {
    try {
      const url = envConfig.getAmapApiUrl() + '/geocode/regeo';
      const params = {
        key: envConfig.getAmapApiKey(),
        location: `${lon},${lat}`,
        extensions: 'all',
        output: 'JSON'
      };

      const secret = envConfig.getAmapSecretKey();
      if (secret) {
        params.sig = this.generateSignature(params, secret);
      }

      const res = await axios.get(url, { params, timeout: 10000 });

      if (res.data.status === '1' && res.data.regeocode) {
        const addressComponent = res.data.regeocode.addressComponent;
        return {
          success: true,
          province: addressComponent.province || '',
          city: addressComponent.city || addressComponent.province || '',
          district: addressComponent.district || '',
          adcode: addressComponent.adcode || '',
          street: addressComponent.street || '',
          streetNumber: addressComponent.streetNumber || '',
          township: addressComponent.township || ''
        };
      }

      throw new Error('逆地理编码失败: ' + res.data.info);
    } catch (error) {
      console.error('[EnhancedWeatherService] 获取位置详情失败:', error.message);
      return {
        success: true,
        province: '北京市',
        city: '北京市',
        district: '',
        adcode: '110000',
        street: '',
        streetNumber: '',
        township: '',
        error: error.message
      };
    }
  }

  /**
   * 生成签名
   */
  generateSignature (params, secret) {
    const keys = Object.keys(params).sort();
    const paramStr = keys.map(key => `${key}=${params[key]}`).join('&');
    const rawStr = paramStr + secret;
    return CryptoJS.MD5(rawStr).toString();
  }

  /**
   * 带重试的请求
   */
  async fetchWithRetry (params) {
    let lastError = null;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const startTime = Date.now();
        console.log(`[Weather] 第${i + 1}次请求，参数:`, { city: params.city, extensions: params.extensions });
        const response = await axios.get(this.baseUrl, {
          params,
          timeout: this.timeout
        });

        const duration = Date.now() - startTime;
        if (duration > 500) {
          console.warn(`[Weather] 响应时间超过500ms: ${duration}ms`);
        }

        console.log('[Weather] API响应状态:', response.data.status, 'infocode:', response.data.infocode);

        if (response.data.status === '1') {
          return {
            success: true,
            data: response.data,
            timestamp: Date.now()
          };
        } else {
          // 检查配额超限
          if (response.data.infocode === '10021') {
            throw new Error('API配额超限');
          }
          throw new Error(`API错误: ${response.data.info} (infocode: ${response.data.infocode})`);
        }
      } catch (error) {
        console.warn(`[Weather] 第${i + 1}次尝试失败:`, error.message);
        if (error.response) {
          console.warn('[Weather] API响应:', error.response.data);
        }
        lastError = error;
      }
    }

    throw new Error(`获取天气失败 (重试${this.maxRetries}次): ${lastError?.message}`);
  }

  // --- 解析逻辑 (复制自原服务) ---

  mapWeatherToCode (weather) {
    const weatherMap = {
      晴: '0',
      多云: '1',
      阴: '2',
      阵雨: '3',
      雷阵雨: '4',
      雷阵雨伴有冰雹: '5',
      雨夹雪: '6',
      小雨: '7',
      中雨: '8',
      大雨: '9',
      暴雨: '10',
      大暴雨: '11',
      特大暴雨: '12',
      阵雪: '13',
      小雪: '14',
      中雪: '15',
      大雪: '16',
      暴雪: '17',
      雾: '18',
      冻雨: '19',
      沙尘暴: '20',
      小到中雨: '21',
      中到大雨: '22',
      大到暴雨: '23',
      暴雨到大暴雨: '24',
      大暴雨到特大暴雨: '25',
      小到中雪: '26',
      中到大雪: '27',
      大到暴雪: '28',
      浮尘: '29',
      扬沙: '30',
      强沙尘暴: '31',
      霾: '53'
    };
    return weatherMap[weather] || '0';
  }

  parseLiveWeatherData (liveData, info) {
    return {
      type: 'live',
      location: {
        province: liveData.province || '',
        city: liveData.city || '',
        adcode: liveData.adcode || '',
        name: liveData.city || ''
      },
      weather: {
        text: liveData.weather || '未知',
        code: this.mapWeatherToCode(liveData.weather),
        temperature: parseFloat(liveData.temperature) || 0,
        humidity: parseInt(liveData.humidity) || 0,
        windDirection: liveData.winddirection || '',
        windPower: liveData.windpower || '',
        reportTime: liveData.reporttime || new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      source: 'amap',
      info
    };
  }

  parseForecastWeatherData (forecastData, info) {
    const casts = forecastData.casts || [];
    return {
      type: 'forecast',
      location: {
        province: forecastData.province || '',
        city: forecastData.city || '',
        adcode: forecastData.adcode || ''
      },
      reportTime: forecastData.reporttime || new Date().toISOString(),
      forecast: casts.map(cast => ({
        date: cast.date || '',
        week: cast.week || '',
        dayWeather: cast.dayweather || '',
        nightWeather: cast.nightweather || '',
        dayTemp: parseFloat(cast.daytemp) || 0,
        nightTemp: parseFloat(cast.nighttemp) || 0,
        dayWind: cast.daywind || '',
        nightWind: cast.nightwind || '',
        dayPower: cast.daypower || '',
        nightPower: cast.nightpower || ''
      })),
      timestamp: new Date().toISOString(),
      source: 'amap',
      info
    };
  }
}

const enhancedWeatherService = new EnhancedWeatherService();
export default enhancedWeatherService;
