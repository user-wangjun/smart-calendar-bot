import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockAxios = jest.fn();
mockAxios.get = mockGet;
mockAxios.post = mockPost;

jest.unstable_mockModule('axios', () => ({
  default: mockAxios
}));

let AmapLocationService;

beforeEach(async () => {
  const module = await import('../src/services/amapLocationService.js');
  AmapLocationService = module.AmapLocationService;
});

describe('高德定位服务综合测试', () => {
  let locationService;

  beforeEach(() => {
    locationService = new AmapLocationService();
    locationService.setApiKey('test-api-key-12345');
    mockGet.mockReset();
    mockPost.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API密钥管理测试', () => {
    it('应该正确设置和获取API密钥', () => {
      const testKey = 'my-test-key-12345';
      locationService.setApiKey(testKey);
      expect(locationService.getApiKey()).toBe(testKey);
    });

    it('应该验证有效的API密钥', () => {
      locationService.setApiKey('valid-api-key-12345');
      expect(locationService.isApiKeyValid()).toBe(true);
    });

    it('应该拒绝无效的短密钥', () => {
      locationService.setApiKey('short');
      expect(locationService.isApiKeyValid()).toBe(false);
    });

    it('应该拒绝空密钥', () => {
      locationService.setApiKey('');
      expect(locationService.isApiKeyValid()).toBe(false);
    });
  });

  describe('IP定位测试', () => {
    it('应该成功通过IP获取位置', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          status: '1',
          province: '北京市',
          city: '北京市',
          adcode: '110000',
          rectangle: '116.0119343,39.66127144;116.7829835,40.2164962'
        }
      });

      const result = await locationService.getIPLocation();

      expect(result.success).toBe(true);
      expect(result.data.city).toBe('北京市');
      expect(result.data.adcode).toBe('110000');
      expect(result.data.source).toBe('ip');
    });

    it('IP定位失败应该返回错误', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          status: '0',
          info: 'Invalid Key'
        }
      });

      await expect(locationService.getIPLocation()).rejects.toThrow('IP定位失败');
    });

    it('网络错误应该被正确处理', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network Error'));

      await expect(locationService.getIPLocation()).rejects.toThrow('Network Error');
    });
  });

  describe('地理编码测试', () => {
    it('应该通过地址获取坐标', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          status: '1',
          geocodes: [{
            location: '116.4074,39.9042',
            province: '北京市',
            city: '北京市',
            district: '东城区',
            adcode: '110101',
            formatted_address: '北京市东城区'
          }]
        }
      });

      const result = await locationService.getCoordsByAddress('北京天安门');

      expect(result.success).toBe(true);
      expect(result.data.longitude).toBe(116.4074);
      expect(result.data.latitude).toBe(39.9042);
      expect(result.data.adcode).toBe('110101');
    });

    it('地理编码失败应该返回错误', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          status: '1',
          geocodes: []
        }
      });

      const result = await locationService.getCoordsByAddress('');

      expect(result.success).toBe(false);
    });
  });

  describe('逆地理编码测试', () => {
    it('应该通过坐标获取地址', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          status: '1',
          regeocode: {
            addressComponent: {
              province: '北京市',
              city: '北京市',
              district: '东城区',
              street: '东华门街道',
              streetNumber: '1号',
              township: '东华门街道',
              adcode: '110101'
            },
            formatted_address: '北京市东城区东华门街道1号'
          }
        }
      });

      const result = await locationService.getAddressByCoords(39.9042, 116.4074);

      expect(result.province).toBe('北京市');
      expect(result.city).toBe('北京市');
      expect(result.adcode).toBe('110101');
      expect(result.formattedAddress).toBe('北京市东城区东华门街道1号');
    });

    it('逆地理编码失败应该返回空对象', async () => {
      mockGet.mockRejectedValueOnce(new Error('API Error'));

      const result = await locationService.getAddressByCoords(0, 0);

      expect(result).toEqual({});
    });
  });

  describe('矩形区域解析测试', () => {
    it('应该正确解析矩形区域获取中心点', () => {
      const rectangle = '116.0119343,39.66127144;116.7829835,40.2164962';
      const result = locationService.parseRectangle(rectangle);

      expect(result.longitude).toBeCloseTo(116.397, 2);
      expect(result.latitude).toBeCloseTo(39.939, 2);
    });

    it('无效矩形应该返回默认坐标', () => {
      const result = locationService.parseRectangle('invalid');

      expect(result.longitude).toBe(116.4074);
      expect(result.latitude).toBe(39.9042);
    });
  });

  describe('默认位置测试', () => {
    it('应该返回正确的默认位置', () => {
      const defaultLocation = locationService.getDefaultLocation();

      expect(defaultLocation.latitude).toBe(39.9042);
      expect(defaultLocation.longitude).toBe(116.4074);
      expect(defaultLocation.city).toBe('北京市');
      expect(defaultLocation.source).toBe('default');
    });
  });

  describe('缓存机制测试', () => {
    it('应该正确缓存位置', () => {
      const mockLocation = {
        city: '上海市',
        latitude: 31.2304,
        longitude: 121.4737
      };

      locationService.cacheLocation(mockLocation);
      const cached = locationService.getCachedLocation();

      expect(cached).toEqual(mockLocation);
    });

    it('过期缓存应该返回null', () => {
      locationService.cache.set('currentLocation', {
        data: { city: '北京' },
        timestamp: Date.now() - 6 * 60 * 1000 // 6分钟前
      });

      const cached = locationService.getCachedLocation();
      expect(cached).toBeNull();
    });

    it('应该正确清除缓存', () => {
      locationService.cacheLocation({ city: '北京' });
      locationService.clearCache();

      expect(locationService.getCachedLocation()).toBeNull();
      expect(locationService.cache.size).toBe(0);
    });
  });

  describe('服务状态测试', () => {
    it('应该返回正确的服务状态', () => {
      const status = locationService.getServiceStatus();

      expect(status).toHaveProperty('apiKeyConfigured');
      expect(status).toHaveProperty('currentLocation');
      expect(status).toHaveProperty('hasCachedData');
      expect(status).toHaveProperty('cacheSize');
    });
  });

  describe('连接测试', () => {
    it('未配置密钥时连接测试应该失败', async () => {
      locationService.setApiKey('');

      const result = await locationService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('API密钥');
    });

    it('API调用成功时连接测试应该成功', async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          status: '1',
          rectangle: '116.0,39.6;116.7,40.2'
        }
      });

      const result = await locationService.testConnection();

      expect(result.success).toBe(true);
    });
  });

  describe('浏览器定位测试', () => {
    it('浏览器不支持地理定位应该返回错误', async () => {
      // 模拟浏览器不支持
      const originalGeolocation = global.navigator.geolocation;
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true
      });

      await expect(locationService.getBrowserLocation())
        .rejects.toThrow('浏览器不支持地理定位');

      Object.defineProperty(global.navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true
      });
    });
  });
});
