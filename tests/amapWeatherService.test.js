import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

import axios from 'axios';

const getAmapApiKeyMock = jest.fn(() => 'test-api-key-12345');
const getAmapApiUrlMock = jest.fn(() => 'https://restapi.amap.com/v3');
const getAmapSecretKeyMock = jest.fn(() => '');

let EnhancedWeatherService;

beforeEach(async () => {
  jest.unstable_mockModule('../src/config/env.js', () => ({
    default: {
      getAmapApiKey: getAmapApiKeyMock,
      getAmapApiUrl: getAmapApiUrlMock,
      getAmapSecretKey: getAmapSecretKeyMock
    }
  }));

  const module = await import('../src/services/weather/EnhancedWeatherService.js');
  EnhancedWeatherService = module.EnhancedWeatherService;
});

// Spy on axios
jest.spyOn(axios, 'get');

describe('高德天气服务综合测试 (EnhancedWeatherService)', () => {
  let weatherService;

  beforeEach(() => {
    weatherService = new EnhancedWeatherService();
    jest.clearAllMocks();
    getAmapApiKeyMock.mockReturnValue('test-api-key-12345'); // Reset key
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('天气数据获取测试', () => {
    const mockLiveWeatherResponse = {
      data: {
        status: '1',
        info: 'OK',
        lives: [{
          province: '北京',
          city: '北京市',
          adcode: '110000',
          weather: '晴',
          temperature: '25',
          humidity: '45',
          winddirection: '北',
          windpower: '3',
          reporttime: '2024-01-15 14:30:00'
        }]
      }
    };

    it('应该成功获取实况天气', async () => {
      axios.get.mockResolvedValueOnce(mockLiveWeatherResponse);

      const result = await weatherService.getCurrentWeather('110000');

      expect(result.success).toBe(true);
      expect(result.data.weather.text).toBe('晴');
      expect(result.data.weather.temperature).toBe(25);
      expect(result.data.location.city).toBe('北京市');
    });

    it('应该成功获取预报天气', async () => {
      const mockForecastResponse = {
        data: {
          status: '1',
          info: 'OK',
          forecasts: [{
            city: '北京市',
            adcode: '110000',
            province: '北京',
            reporttime: '2024-01-15 08:00:00',
            casts: [
              {
                date: '2024-01-15',
                week: '1',
                dayweather: '晴',
                nightweather: '多云',
                daytemp: '26',
                nighttemp: '15',
                daywind: '北',
                nightwind: '南',
                daypower: '3',
                nightpower: '2'
              }
            ]
          }]
        }
      };

      axios.get.mockResolvedValueOnce(mockForecastResponse);

      const result = await weatherService.getWeatherForecast('110000');

      expect(result.success).toBe(true);
      expect(result.data.type).toBe('forecast');
      expect(result.data.forecast).toHaveLength(1);
    });

    it('未配置API密钥应该返回错误', async () => {
      getAmapApiKeyMock.mockReturnValue(''); // Mock empty key

      // Since envConfig logic might log warning but return empty key, and service might use it.
      // But service check: if (!this.config.AMAP_API_KEY) in envConfig?
      // No, EnhancedWeatherService uses envConfig.getAmapApiKey().
      // If it returns empty, request is sent with empty key.
      // API will return error.

      // However, check EnhancedWeatherService.js:
      // const params = { key: envConfig.getAmapApiKey(), ... }
      // It doesn't check if key is empty.
      // So axios request proceeds.
      // We need to mock axios response for invalid key.

      axios.get.mockResolvedValueOnce({
        data: {
          status: '0',
          info: 'INVALID_USER_KEY',
          infocode: '10001'
        }
      });

      const result = await weatherService.getCurrentWeather('北京');
      // result should be { success: false, error: ... }
      // Because fetchWithRetry checks status === '1'.

      expect(result.success).toBe(false);
      // expect(result.error).toMatch(/API密钥/); // Error message depends on API response
      // 错误消息可能是 "API错误" 或 "获取天气失败 (重试3次)"
      expect(result.error).toMatch(/API错误|获取天气失败/);
    });

    it('API返回错误状态应该处理错误', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          status: '0',
          info: 'Invalid Key',
          infocode: '10001'
        }
      });

      const result = await weatherService.getCurrentWeather('110000');

      expect(result.success).toBe(false);
    });

    it('网络错误应该返回友好错误', async () => {
      // fetchWithRetry catches error and retries.
      // If mockRejectedValueOnce is used, it fails once.
      // EnhancedWeatherService retries 3 times.
      // So we need to reject 3 times?
      // Or mock implementation to always reject?

      axios.get.mockRejectedValue(new Error('Network Error'));

      const result2 = await weatherService.getCurrentWeather('110000');

      expect(result2.success).toBe(false);
      expect(result2.error).toBeDefined();
    });
  });

  describe('天气数据解析测试', () => {
    it('应该正确解析实况天气数据', () => {
      const liveData = {
        province: '广东省',
        city: '广州市',
        adcode: '440100',
        weather: '多云',
        temperature: '28',
        humidity: '65',
        winddirection: '东南',
        windpower: '2',
        reporttime: '2024-01-15 16:00:00'
      };

      const result = weatherService.parseLiveWeatherData(liveData, 'OK');

      expect(result.type).toBe('live');
      expect(result.location.city).toBe('广州市');
      expect(result.weather.temperature).toBe(28);
      expect(result.weather.humidity).toBe(65);
    });

    it('应该正确解析预报天气数据', () => {
      const forecastData = {
        city: '深圳市',
        adcode: '440300',
        province: '广东省',
        reporttime: '2024-01-15 08:00:00',
        casts: [
          {
            date: '2024-01-15',
            week: '1',
            dayweather: '晴',
            nightweather: '晴',
            daytemp: '27',
            nighttemp: '18',
            daywind: '东',
            nightwind: '东',
            daypower: '2',
            nightpower: '2'
          }
        ]
      };

      const result = weatherService.parseForecastWeatherData(forecastData, 'OK');

      expect(result.type).toBe('forecast');
      expect(result.location.city).toBe('深圳市');
      expect(result.forecast).toHaveLength(1);
      expect(result.forecast[0].dayTemp).toBe(27);
    });

    it('应该正确映射天气代码', () => {
      expect(weatherService.mapWeatherToCode('晴')).toBe('0');
      expect(weatherService.mapWeatherToCode('多云')).toBe('1');
      expect(weatherService.mapWeatherToCode('小雨')).toBe('7');
      expect(weatherService.mapWeatherToCode('暴雨')).toBe('10');
      expect(weatherService.mapWeatherToCode('雪')).toBe('0'); // 未知天气返回默认
    });
  });

  describe('地理编码测试 (getAdcode)', () => {
    it('应该通过坐标获取城市编码', async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          status: '1',
          regeocode: {
            addressComponent: { adcode: '440100' }
          }
        }
      });

      // getAdcode is private-ish (not starting with _) but used internally.
      // But we can call it for testing if we want, or test public method getWeatherByCoords.

      const adcode = await weatherService.getAdcode(23.1291, 113.2644);
      expect(adcode).toBe('440100');
    });
  });
});
