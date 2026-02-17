<template>
  <div class="amap-weather-page">
    <div class="weather-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">🌤️ 高德天气</h1>
        <p class="page-subtitle">基于高德地图API的实时天气服务</p>
      </div>

      <!-- 天气组件 -->
      <div class="weather-main-section">
        <AmapWeatherWidget
          :api-key="apiKey"
          :location="currentLocation"
          :auto-refresh="autoRefresh"
          :refresh-interval="refreshInterval"
          @weather-update="handleWeatherUpdate"
          @error="handleWeatherError"
          @open-settings="showSettings = true"
        />
      </div>

      <!-- 功能按钮区 -->
      <div class="action-section">
        <button @click="getCurrentLocation" class="action-btn location-btn" :disabled="locating">
          <span v-if="locating">定位中...</span>
          <span v-else>📍 获取当前位置</span>
        </button>
        <button @click="refreshWeather" class="action-btn refresh-btn">
          🔄 刷新天气
        </button>
        <button @click="showSettings = true" class="action-btn settings-btn">
          ⚙️ 设置
        </button>
      </div>

      <!-- 位置信息卡片 -->
      <div class="info-section">
        <h3 class="section-title">📍 位置信息</h3>
        <div class="info-card">
          <div v-if="locationLoading" class="info-loading">
            <LoadingSpinner size="small" />
            <span>正在获取位置...</span>
          </div>
          <div v-else-if="locationError" class="info-error">
            <span class="error-icon">⚠️</span>
            <span>{{ locationError }}</span>
            <button @click="getCurrentLocation" class="retry-btn">重试</button>
          </div>
          <div v-else-if="currentLocationData" class="info-content">
            <div class="info-row">
              <span class="info-label">城市:</span>
              <span class="info-value">{{ currentLocationData.city || '未知' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">省份:</span>
              <span class="info-value">{{ currentLocationData.province || '未知' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">坐标:</span>
              <span class="info-value">
                {{ currentLocationData.latitude?.toFixed(4) }}, {{ currentLocationData.longitude?.toFixed(4) }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">来源:</span>
              <span class="info-value">{{ getLocationSourceText(currentLocationData.source) }}</span>
            </div>
          </div>
          <div v-else class="info-empty">
            点击"获取当前位置"按钮获取位置信息
          </div>
        </div>
      </div>

      <!-- 城市选择 -->
      <div class="city-section">
        <h3 class="section-title">🏙️ 快速选择城市</h3>
        <div class="city-grid">
          <button
            v-for="city in commonCities"
            :key="city.code"
            class="city-btn"
            :class="{ active: selectedCity === city.code }"
            @click="selectCity(city)"
          >
            {{ city.name }}
          </button>
        </div>
      </div>

      <!-- 预报天气 -->
      <div v-if="forecastData" class="forecast-section">
        <h3 class="section-title">📅 未来天气预报</h3>
        <div class="forecast-list">
          <div
            v-for="(day, index) in forecastData.forecast"
            :key="index"
            class="forecast-item"
          >
            <div class="forecast-date">{{ formatDate(day.date) }}</div>
            <div class="forecast-weather">
              <span class="weather-icon">{{ getWeatherIcon(day.dayWeather) }}</span>
              <span class="weather-text">{{ day.dayWeather }}</span>
            </div>
            <div class="forecast-temp">
              {{ day.nightTemp }}° / {{ day.dayTemp }}°
            </div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="help-section">
        <h3 class="section-title">📖 使用说明</h3>
        <div class="help-content">
          <ol>
            <li>首次使用需要在设置中配置高德Web服务API密钥</li>
            <li>点击"获取当前位置"按钮获取您的位置信息</li>
            <li>天气数据会自动刷新，也可手动点击"刷新天气"</li>
            <li>支持通过城市列表快速切换查看不同城市天气</li>
          </ol>
          <div class="help-note">
            <strong>注意：</strong>API密钥仅存储在本地，不会上传到服务器
          </div>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>高德天气设置</h2>
          <button @click="showSettings = false" class="close-btn">✕</button>
        </div>
        <AmapWeatherSettings
          @settings-saved="onSettingsSaved"
          @settings-reset="onSettingsReset"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AmapWeatherWidget from '@/components/ui/AmapWeatherWidget.vue';
import AmapWeatherSettings from '@/components/ui/AmapWeatherSettings.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';
import amapLocationWeatherService from '@/services/amapLocationWeatherService.js';

// 状态
const apiKey = ref('');
const currentLocation = ref(null);
const currentLocationData = ref(null);
const locationLoading = ref(false);
const locationError = ref(null);
const locating = ref(false);
const selectedCity = ref(null);
const forecastData = ref(null);
const showSettings = ref(false);
const autoRefresh = ref(true);
const refreshInterval = ref(30 * 60 * 1000);

// 常用城市列表（使用高德城市编码）
const commonCities = [
  { name: '北京', code: '110000' },
  { name: '上海', code: '310000' },
  { name: '广州', code: '440100' },
  { name: '深圳', code: '440300' },
  { name: '杭州', code: '330100' },
  { name: '南京', code: '320100' },
  { name: '成都', code: '510100' },
  { name: '武汉', code: '420100' },
  { name: '西安', code: '610100' },
  { name: '重庆', code: '500000' }
];

// 从环境变量获取API密钥
const getApiKeyFromEnv = () => {
  // Vite环境变量
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_AMAP_API_KEY || '';
  }
  return '';
};

// 方法
const loadSettings = () => {
  try {
    // 优先从环境变量读取API密钥
    const envApiKey = getApiKeyFromEnv();
    if (envApiKey) {
      apiKey.value = envApiKey;
      amapLocationWeatherService.setApiKey(envApiKey);
    }

    // 从本地存储读取其他设置
    const saved = localStorage.getItem('amapWeatherSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      // 如果环境变量没有配置密钥，使用本地存储的密钥
      if (!apiKey.value && settings.apiKey) {
        apiKey.value = settings.apiKey;
        amapLocationWeatherService.setApiKey(settings.apiKey);
      }
      autoRefresh.value = settings.autoRefresh ?? true;
      refreshInterval.value = (settings.refreshInterval || 30) * 60 * 1000;
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
};

const getCurrentLocation = async () => {
  locationLoading.value = true;
  locationError.value = null;
  locating.value = true;

  try {
    const result = await amapLocationWeatherService.getLocationOnly();
    
    if (result.success) {
      currentLocationData.value = result.data;
      currentLocation.value = result.data;
      selectedCity.value = null; // 清除城市选择
      
      // 获取预报天气
      await getForecast(result.data);
    } else {
      locationError.value = result.error || '获取位置失败';
    }
  } catch (error) {
    locationError.value = error.message || '获取位置时发生错误';
  } finally {
    locationLoading.value = false;
    locating.value = false;
  }
};

const refreshWeather = () => {
  // 触发重新获取天气
  const temp = currentLocation.value;
  currentLocation.value = null;
  setTimeout(() => {
    currentLocation.value = temp;
  }, 100);
};

const selectCity = async (city) => {
  selectedCity.value = city.code;
  currentLocation.value = city.code;
  currentLocationData.value = {
    city: city.name,
    adcode: city.code,
    source: 'manual'
  };
  
  // 获取预报天气
  await getForecast({ adcode: city.code });
};

const getForecast = async (location) => {
  try {
    const result = await amapLocationWeatherService.getWeatherForecast(location);
    if (result.success && result.data.type === 'forecast') {
      forecastData.value = result.data;
    }
  } catch (error) {
    console.error('获取预报失败:', error);
  }
};

const handleWeatherUpdate = (data) => {
  console.log('天气数据更新:', data);
};

const handleWeatherError = (error) => {
  console.error('天气组件错误:', error);
};

const onSettingsSaved = () => {
  loadSettings();
  showSettings.value = false;
  // 刷新天气
  refreshWeather();
};

const onSettingsReset = () => {
  // 设置重置后的处理
};

const getLocationSourceText = (source) => {
  const sourceMap = {
    'gps': 'GPS定位',
    'browser': '浏览器定位',
    'ip': 'IP定位',
    'manual': '手动选择',
    'cache': '缓存',
    'default': '默认位置'
  };
  return sourceMap[source] || source || '未知';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[date.getDay()];
  return `${month}/${day} ${weekday}`;
};

const getWeatherIcon = (weather) => {
  const iconMap = {
    '晴': '☀️',
    '多云': '🌤️',
    '阴': '☁️',
    '阵雨': '🌦️',
    '雷阵雨': '⛈️',
    '小雨': '🌧️',
    '中雨': '🌧️',
    '大雨': '🌧️',
    '暴雨': '🌧️',
    '雪': '🌨️',
    '雾': '🌫️',
    '霾': '😷'
  };
  
  for (const key in iconMap) {
    if (weather.includes(key)) {
      return iconMap[key];
    }
  }
  return '🌡️';
};

// 生命周期
onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.amap-weather-page {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.weather-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 页面标题 */
.page-header {
  text-align: center;
  padding: 20px 0;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* 天气主区域 */
.weather-main-section {
  width: 100%;
}

/* 功能按钮区 */
.action-section {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.location-btn {
  background: #3b82f6;
  color: white;
}

.location-btn:hover:not(:disabled) {
  background: #2563eb;
}

.refresh-btn {
  background: #10b981;
  color: white;
}

.refresh-btn:hover {
  background: #059669;
}

.settings-btn {
  background: #6b7280;
  color: white;
}

.settings-btn:hover {
  background: #4b5563;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 信息区域 */
.info-section,
.city-section,
.forecast-section,
.help-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.info-card {
  min-height: 100px;
}

.info-loading,
.info-error,
.info-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  color: #6b7280;
  text-align: center;
}

.info-error .error-icon {
  font-size: 32px;
}

.retry-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #6b7280;
  font-size: 14px;
}

.info-value {
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
}

/* 城市选择 */
.city-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.city-btn {
  padding: 10px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.city-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.city-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* 预报天气 */
.forecast-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.forecast-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.forecast-date {
  font-size: 14px;
  color: #6b7280;
  min-width: 80px;
}

.forecast-weather {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.weather-icon {
  font-size: 24px;
}

.weather-text {
  font-size: 14px;
  color: #1f2937;
}

.forecast-temp {
  font-size: 14px;
  color: #6b7280;
  min-width: 80px;
  text-align: right;
}

/* 使用说明 */
.help-content {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.6;
}

.help-content ol {
  margin: 0 0 16px 0;
  padding-left: 20px;
}

.help-content li {
  margin-bottom: 8px;
}

.help-note {
  padding: 12px;
  background: #fef3c7;
  border-radius: 8px;
  color: #92400e;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .amap-weather-page {
    padding: 10px;
  }

  .page-title {
    font-size: 24px;
  }

  .action-section {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }

  .city-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .forecast-item {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .forecast-date,
  .forecast-temp {
    min-width: auto;
  }
}
</style>
