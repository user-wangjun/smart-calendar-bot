# 心知天气API集成文档

## 概述

本文档说明如何在智能日历助手中集成和使用心知天气API。心知天气是一个提供全球天气数据的服务，支持实时天气查询。

## API配置

### 环境变量配置

在项目根目录的`.env`文件中添加以下配置：

```bash
# 心知天气API配置
VITE_WEATHER_API_KEY=SApZUJMOei5TsgFCi
VITE_WEATHER_API_URL=http://api.seniverse.com/v3
VITE_WEATHER_API_TIMEOUT=30000
VITE_WEATHER_API_MAX_RETRIES=3
```

### 获取API密钥

1. 访问[心知天气官网](https://www.seniverse.com/)
2. 注册账号并登录
3. 在控制台创建应用
4. 获取API密钥
5. 将密钥添加到`.env`文件中

## API接口说明

### 当前天气接口

**接口地址：** `http://api.seniverse.com/v3/weather/now.json`

**请求方式：** GET

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|--------|--------|--------|
| location | string | 是 | 查询的城市名称或经纬度 | beijing, 39.9042:116.4074 |
| key | string | 是 | API密钥 | your_api_key |
| language | string | 否 | 语言 | zh（中文）、en（英文） |
| unit | string | 否 | 温度单位 | c（摄氏度）、f（华氏度） |

**响应示例：**

```json
{
  "results": [
    {
      "location": {
        "id": "WX4FBXXFKE4F",
        "name": "北京",
        "country": "CN",
        "path": "北京,北京,中国",
        "timezone": "Asia/Shanghai",
        "timezone_offset": "+08:00"
      },
      "now": {
        "text": "晴",
        "code": "0",
        "temperature": "25",
        "humidity": "45",
        "wind_direction": "东北",
        "wind_direction_degree": "45",
        "wind_speed": "12",
        "wind_scale": "3级",
        "pressure": "1013",
        "visibility": "16",
        "last_update": "2024-01-29T14:00:00+08:00"
      }
    }
  ]
}
```

## 使用示例

### 基础使用

```javascript
import weatherService from '@/services/weatherService.js';

// 获取北京天气
const result = await weatherService.getCurrentWeather('beijing');

if (result.success) {
  console.log('天气数据:', result.data);
  console.log('温度:', result.data.weather.temperature);
  console.log('天气状况:', result.data.weather.text);
  console.log('湿度:', result.data.weather.humidity);
} else {
  console.error('获取天气失败:', result.error);
}
```

### 使用经纬度查询

```javascript
// 使用经纬度查询天气
const location = {
  latitude: 39.9042,
  longitude: 116.4074
};

const result = await weatherService.getCurrentWeather(location);

if (result.success) {
  console.log('位置:', result.data.location.name);
  console.log('温度:', result.data.weather.temperature);
}
```

### 强制刷新（不使用缓存）

```javascript
const result = await weatherService.getCurrentWeather('beijing', {
  forceRefresh: true,
  useCache: false
});
```

### 设置自动刷新

```javascript
// 每30分钟自动刷新一次
weatherService.setAutoRefresh('beijing', 30 * 60 * 1000);

// 清除自动刷新
weatherService.clearAutoRefresh();
```

### Vue组件中使用

```vue
<template>
  <WeatherWidget
    :location="currentCity"
    :auto-refresh="true"
    :refresh-interval="30 * 60 * 1000"
    @weather-update="handleWeatherUpdate"
    @error="handleWeatherError"
  />
</template>

<script setup>
import { ref } from 'vue';
import WeatherWidget from '@/components/ui/WeatherWidget.vue';

const currentCity = ref('beijing');

const handleWeatherUpdate = (weatherData) => {
  console.log('天气已更新:', weatherData);
};

const handleWeatherError = (error) => {
  console.error('天气错误:', error);
};
</script>
```

## 天气代码说明

心知天气使用数字代码表示不同的天气状况：

| 代码 | 天气 | 图标 |
|------|--------|------|
| 0 | 晴 | ☀️ |
| 1 | 多云 | ⛅ |
| 2 | 阴 | ☁️ |
| 3 | 阵雨 | 🌧️ |
| 4 | 雷阵雨 | ⛈️ |
| 5 | 雷阵雨伴有冰雹 | ⛈️ |
| 6 | 雨夹雪 | 🌨️ |
| 7 | 小雨 | 🌦️ |
| 8 | 中雨 | 🌧️ |
| 9 | 大雨 | 🌧️ |
| 10 | 暴雨 | 🌧️ |
| 11 | 大暴雨 | 🌧️ |
| 12 | 特大暴雨 | 🌧️ |
| 13 | 阵雪 | 🌨️ |
| 14 | 小雪 | 🌨️ |
| 15 | 中雪 | ❄️ |
| 16 | 大雪 | ❄️ |
| 17 | 暴雪 | ❄️ |
| 18 | 雾 | 🌫️ |
| 19 | 冻雨 | 🌨️ |
| 20 | 沙尘暴 | 🌪️ |
| 21 | 小到中雨 | 🌧️ |
| 22 | 中到大雨 | 🌧️ |
| 23 | 大到暴雨 | 🌧️ |
| 24 | 暴雨到大暴雨 | 🌧️ |
| 25 | 大暴雨到特大暴雨 | 🌧️ |
| 26 | 小到中雪 | 🌨️ |
| 27 | 中到大雪 | ❄️ |
| 28 | 大到暴雪 | ❄️ |
| 29 | 浮尘 | 🌫️ |
| 30 | 扬沙 | 🌫️ |
| 31 | 强沙尘暴 | 🌪️ |
| 32 | 霾 | 😶 |
| 33 | 无 | ☀️ |
| 99 | 未知 | ❓ |

## 缓存机制

### 缓存策略

天气服务使用两级缓存策略：

1. **内存缓存**：快速访问，容量限制100条
2. **本地存储缓存**：持久化存储，页面刷新后仍然有效

### 缓存配置

```javascript
import weatherCacheManager from '@/services/weatherCache.js';

// 设置默认缓存超时时间（毫秒）
weatherCacheManager.setDefaultCacheTimeout(30 * 60 * 1000); // 30分钟

// 设置自定义缓存
weatherCacheManager.setCache('current', 'beijing', weatherData, 60 * 60 * 1000);

// 获取缓存
const cached = weatherCacheManager.getCache('current', 'beijing');

// 检查缓存是否存在且有效
const hasValidCache = weatherCacheManager.hasValidCache('current', 'beijing');

// 清除特定缓存
weatherCacheManager.removeCache('current', 'beijing');

// 清除所有缓存
weatherCacheManager.clearAllCache();

// 清除过期缓存
weatherCacheManager.clearExpiredCache();

// 获取缓存统计
const stats = weatherCacheManager.getCacheStats();
console.log('缓存统计:', stats);
```

## 错误处理

### 错误类型

```javascript
import { WeatherErrorType } from '@/services/weatherErrorHandler.js';

// 网络错误
WeatherErrorType.NETWORK_ERROR

// API错误
WeatherErrorType.API_ERROR

// 数据解析错误
WeatherErrorType.PARSE_ERROR

// 超时错误
WeatherErrorType.TIMEOUT_ERROR

// 认证错误
WeatherErrorType.AUTH_ERROR

// 速率限制错误
WeatherErrorType.RATE_LIMIT_ERROR

// 位置错误
WeatherErrorType.LOCATION_ERROR

// 未知错误
WeatherErrorType.UNKNOWN_ERROR
```

### 错误处理示例

```javascript
try {
  const result = await weatherService.getCurrentWeather('beijing');
  
  if (result.success) {
    // 处理成功响应
    console.log('天气数据:', result.data);
  } else {
    // 处理业务错误
    console.error('业务错误:', result.error);
    
    // 显示用户友好的错误消息
    alert(result.error);
  }
} catch (error) {
  // 处理系统错误
  console.error('系统错误:', error);
  
  // 获取用户友好的错误消息
  if (error.getUserMessage) {
    alert(error.getUserMessage());
  } else {
    alert('获取天气失败，请稍后再试');
  }
}
```

### 重试机制

天气服务内置自动重试机制：

- **最大重试次数**：3次（可配置）
- **重试延迟**：1秒，指数退避（可配置）
- **可重试错误**：网络错误、超时、速率限制
- **不可重试错误**：认证错误、位置错误

```javascript
import weatherErrorHandler from '@/services/weatherErrorHandler.js';

// 配置重试参数
weatherErrorHandler.setMaxRetries(5);
weatherErrorHandler.setRetryDelay(2000);

// 使用重试机制
const result = await weatherErrorHandler.retry(
  async () => {
    return await weatherService.getCurrentWeather('beijing');
  },
  {
    context: '获取天气数据',
    maxRetries: 3
  }
);
```

## 设置管理

### 天气设置配置

```javascript
import { useSettingsStore } from '@/stores/settings.js';

const settingsStore = useSettingsStore();

// 获取天气设置
const weatherSettings = settingsStore.getWeatherSettings();

console.log('默认城市:', weatherSettings.defaultCity);
console.log('常用城市:', weatherSettings.favoriteCities);
console.log('缓存时长:', weatherSettings.cacheTimeout);
console.log('自动刷新:', weatherSettings.autoRefresh);
console.log('刷新间隔:', weatherSettings.refreshInterval);
console.log('温度单位:', weatherSettings.temperatureUnit);

// 设置默认城市
settingsStore.setDefaultCity('shanghai');

// 添加常用城市
settingsStore.addFavoriteCity('广州');

// 移除常用城市
settingsStore.removeFavoriteCity('beijing');

// 设置缓存超时时间（分钟）
settingsStore.setWeatherCacheTimeout(60);

// 设置自动刷新
settingsStore.setWeatherAutoRefresh(true);

// 设置刷新间隔（分钟）
settingsStore.setWeatherRefreshInterval(60);

// 设置温度单位
settingsStore.setTemperatureUnit('c');

// 批量设置天气配置
settingsStore.setWeatherSettings({
  defaultCity: 'beijing',
  favoriteCities: ['beijing', '上海', '广州'],
  cacheTimeout: 30,
  autoRefresh: true,
  refreshInterval: 30,
  temperatureUnit: 'c'
});
```

## 服务状态监控

```javascript
// 获取服务状态
const status = weatherService.getServiceStatus();

console.log('API密钥已配置:', status.apiKeyConfigured);
console.log('当前位置:', status.currentLocation);
console.log('有缓存数据:', status.hasCachedData);
console.log('自动刷新已启用:', status.autoRefreshEnabled);
console.log('缓存统计:', status.cacheStats);
console.log('错误统计:', status.errorStats);

// 获取缓存统计
const cacheStats = weatherService.getCacheStats();
console.log('总缓存数:', cacheStats.totalCaches);
console.log('有效缓存:', cacheStats.validCaches);
console.log('过期缓存:', cacheStats.expiredCaches);
console.log('缓存大小:', cacheStats.totalSize);

// 获取错误统计
const errorStats = weatherService.getErrorStats();
console.log('错误统计:', errorStats);
```

## 最佳实践

### 1. API密钥安全

- ✅ 将API密钥存储在环境变量中
- ✅ 不要将API密钥提交到版本控制系统
- ✅ 使用`.env.example`文件提供示例配置
- ❌ 不要在前端代码中硬编码API密钥
- ❌ 不要在客户端日志中输出API密钥

### 2. 缓存策略

- ✅ 合理设置缓存时长，平衡实时性和API调用次数
- ✅ 使用缓存优先策略，减少API调用
- ✅ 定期清理过期缓存，释放存储空间
- ❌ 不要缓存过长时间，确保数据时效性

### 3. 错误处理

- ✅ 捕获所有可能的错误类型
- ✅ 提供用户友好的错误消息
- ✅ 实现自动重试机制处理临时性错误
- ✅ 记录错误日志用于调试
- ❌ 不要直接向用户展示技术性错误信息

### 4. 性能优化

- ✅ 使用内存缓存提高访问速度
- ✅ 实现自动刷新减少手动操作
- ✅ 合理设置请求超时时间
- ✅ 使用指数退避策略进行重试
- ❌ 不要过于频繁地请求API

### 5. 用户体验

- ✅ 提供加载状态提示
- ✅ 显示数据来源（实时/缓存）
- ✅ 提供手动刷新功能
- ✅ 支持多城市切换
- ✅ 显示更新时间信息

## 故障排查

### 问题1：API密钥无效

**症状：** 返回认证错误（401/403）

**解决方案：**
1. 检查`.env`文件中的API密钥是否正确
2. 确认API密钥是否已激活
3. 检查API密钥是否已过期
4. 重新生成API密钥并更新配置

### 问题2：网络连接失败

**症状：** 返回网络错误或超时

**解决方案：**
1. 检查网络连接是否正常
2. 检查防火墙设置
3. 尝试使用VPN或代理
4. 增加请求超时时间

### 问题3：位置未找到

**症状：** 返回位置错误（404）

**解决方案：**
1. 确认城市名称拼写正确
2. 尝试使用拼音或英文城市名
3. 使用经纬度坐标查询
4. 检查心知天气是否支持该地区

### 问题4：缓存不生效

**症状：** 每次都请求API，不使用缓存

**解决方案：**
1. 检查localStorage是否可用
2. 清除浏览器缓存
3. 检查缓存键是否正确生成
4. 确认缓存超时时间设置合理

### 问题5：自动刷新不工作

**症状：** 天气数据不自动更新

**解决方案：**
1. 检查是否正确调用了`setAutoRefresh`
2. 确认刷新间隔设置合理
3. 检查浏览器标签页是否活跃
4. 查看控制台是否有错误信息

## API限制

心知天气API有以下限制：

- **免费版**：每天1000次请求
- **付费版**：根据套餐确定
- **请求频率**：建议不超过每秒10次
- **并发连接**：建议不超过5个

## 更新日志

### v1.0.0 (2024-01-29)

- ✅ 初始版本发布
- ✅ 集成心知天气API
- ✅ 实现缓存机制
- ✅ 实现错误处理和重试
- ✅ 创建天气UI组件
- ✅ 创建天气设置组件
- ✅ 添加单元测试

## 技术支持

如有问题或建议，请联系：

- **项目仓库**：[GitHub](https://github.com/your-repo)
- **心知天气文档**：[https://www.seniverse.com/doc](https://www.seniverse.com/doc)
- **心知天气支持**：support@seniverse.com

## 许可证

MIT License