<!--
  天气功能主页面
  整合当前天气、24小时预报、7天预报、风向风速和智能推荐
-->
<template>
  <div class="weather-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">🌤️ 天气预报</h1>
        <p class="page-subtitle">实时天气信息与生活建议</p>
      </div>
      <div class="header-right">
        <!-- 城市选择器 -->
        <div class="location-selector">
          <button class="btn-location" @click="openCitySelector">
            <span class="location-icon">📍</span>
            <span class="location-text">{{ currentCity }}</span>
            <span class="dropdown-icon">▼</span>
          </button>
        </div>

        <!-- 温度单位切换 -->
        <div class="unit-toggle">
          <button
            class="unit-btn"
            :class="{ active: tempUnit === 'C' }"
            @click="setTempUnit('C')"
          >
            °C
          </button>
          <button
            class="unit-btn"
            :class="{ active: tempUnit === 'F' }"
            @click="setTempUnit('F')"
          >
            °F
          </button>
        </div>

        <!-- 刷新按钮 -->
        <button class="btn-refresh" @click="refreshWeather" :disabled="isLoading">
          <span class="refresh-icon" :class="{ spinning: isLoading }">🔄</span>
          {{ isLoading ? '更新中...' : '刷新' }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading && !weatherData" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在获取天气数据...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>获取天气失败</h3>
      <p>{{ error }}</p>
      <button class="btn-retry" @click="refreshWeather">重试</button>
    </div>

    <!-- 天气内容 -->
    <div v-else-if="weatherData" class="weather-content">
      <!-- 当前天气卡片 -->
      <div class="current-weather-card">
        <div class="weather-main">
          <div class="weather-icon">{{ weatherData.current?.weatherIcon }}</div>
          <div class="weather-info">
            <div class="temperature">
              {{ displayTemperature(weatherData.current?.temperature) }}°{{ tempUnit }}
            </div>
            <div class="weather-desc">{{ weatherData.current?.weather }}</div>
            <div class="update-time">
              更新于 {{ formatTime(weatherData.updateTime) }}
            </div>
          </div>
        </div>

        <div class="weather-details">
          <div class="detail-item">
            <span class="detail-label">体感温度</span>
            <span class="detail-value">
              {{ weatherData.current?.feelsLike != null ? displayTemperature(weatherData.current.feelsLike) : '--' }}°{{ tempUnit }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">湿度</span>
            <span class="detail-value">{{ weatherData.current?.humidity ?? '--' }}%</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">风向</span>
            <span class="detail-value">{{ weatherData.current?.windDirection ?? '--' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">风力</span>
            <span class="detail-value">{{ weatherData.current?.windPower ?? '--' }}</span>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <div class="chart-container">
          <TemperatureChart :hourly-data="weatherData.hourly" />
        </div>
        <div class="chart-container">
          <PrecipitationChart :daily-data="weatherData.daily" />
        </div>
      </div>

      <!-- 风向风速 -->
      <div class="wind-section">
        <WindIndicator
          :wind-direction="weatherData.current?.windDirection"
          :wind-speed="weatherData.current?.windSpeed"
          :wind-power="weatherData.current?.windPower"
        />
      </div>

      <!-- 智能推荐 -->
      <div class="recommendations-section">
        <WeatherRecommendations :recommendations="recommendations" />
      </div>

      <!-- 7天预报 -->
      <div class="forecast-section">
        <h3 class="section-title">📅 未来7天预报</h3>
        <div class="forecast-list">
          <div
            v-for="(day, index) in weatherData.daily"
            :key="index"
            class="forecast-item"
          >
            <div class="forecast-date">
              <div class="day-name">{{ day.dayOfWeek }}</div>
              <div class="day-date">{{ day.displayDate }}</div>
            </div>
            <div class="forecast-weather">
              <span class="weather-icon">{{ day.weatherIcon }}</span>
              <span class="weather-text">{{ day.weather }}</span>
            </div>
            <div class="forecast-temp">
              <span class="temp-high">{{ displayTemperature(day.highTemp) }}°</span>
              <span class="temp-low">{{ displayTemperature(day.lowTemp) }}°</span>
            </div>
            <div class="forecast-precip">
              <span class="precip-icon">💧</span>
              <span class="precip-value">{{ day.precipitationProbability }}%</span>
            </div>
            <div class="forecast-wind">
              <span class="wind-icon">💨</span>
              <span class="wind-text">{{ day.windDirection }} {{ day.windPower }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 城市选择器弹窗 -->
    <ManualLocationSelector
      :visible="showCitySelector"
      @select="handleCitySelect"
      @close="closeCitySelector"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useWeatherStore } from '@/stores/weather.js';
import autoLocationWeatherService, { ServiceState } from '@/services/autoLocationWeatherService.js';
import cityDataService from '@/services/cityDataService.js';
import ManualLocationSelector from '@/components/ManualLocationSelector.vue';
import TemperatureChart from '@/components/weather/TemperatureChart.vue';
import PrecipitationChart from '@/components/weather/PrecipitationChart.vue';
import WindIndicator from '@/components/weather/WindIndicator.vue';
import WeatherRecommendations from '@/components/weather/WeatherRecommendations.vue';

/**
 * 使用天气Store
 */
const weatherStore = useWeatherStore();

/**
 * 本地状态
 */
const serviceState = ref('idle');
const statusMessage = ref('');
const showCitySelector = ref(false);

/**
 * 响应式状态（从Store获取）
 */
const weatherData = computed(() => weatherStore.weatherData);
const recommendations = computed(() => weatherStore.recommendations);
// isLoading基于服务状态，保证与首页一致的加载体验
const isLoading = computed(() => {
  return serviceState.value === ServiceState.LOCATING || 
         serviceState.value === ServiceState.GETTING_WEATHER ||
         weatherStore.isLoading;
});
const error = computed(() => weatherStore.error);
const currentCityCode = computed(() => weatherStore.currentCityCode);
const currentCity = computed(() => weatherStore.currentCity);
const tempUnit = computed({
  get: () => weatherStore.tempUnit,
  set: (val) => weatherStore.setTempUnit(val)
});

/**
 * 处理服务状态变化
 * 复用首页的状态处理逻辑
 */
const handleServiceStateChange = (state, data) => {
  serviceState.value = state;

  switch (state) {
    case ServiceState.LOCATING:
      statusMessage.value = '正在定位...';
      break;

    case ServiceState.GETTING_WEATHER:
      statusMessage.value = '获取天气中...';
      break;

    case ServiceState.SUCCESS:
      try {
        // 同步到Store，保持数据一致性
        weatherStore.syncFromDashboard({
          location: data.location,
          weather: data.weather,
          forecast: data.forecast,
          timestamp: data.timestamp
        });
        statusMessage.value = '';
      } catch (err) {
        console.error('[WeatherView] 同步数据失败:', err);
        weatherStore.setError('数据同步失败');
      }
      break;

    case ServiceState.ERROR:
      const errorMsg = data.error || '获取失败';
      weatherStore.setError(errorMsg);
      break;
  }
};

/**
 * 显示温度（根据单位转换）
 * @param {number} celsius - 摄氏度
 * @returns {number} 转换后的温度
 */
const displayTemperature = (celsius) => {
  return weatherStore.displayTemperature(celsius);
};

/**
 * 设置温度单位
 * @param {string} unit - 单位 ('C' 或 'F')
 */
const setTempUnit = (unit) => {
  weatherStore.setTempUnit(unit);
};

/**
 * 格式化时间
 * @param {string} timestamp - 时间戳
 * @returns {string} 格式化后的时间
 */
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 刷新天气（使用自动定位服务）
 * 复用首页的逻辑：定位 -> 获取天气
 */
const refreshWeather = async () => {
  console.log('[WeatherView] 刷新天气，使用自动定位服务');
  // 清除错误状态
  weatherStore.clearError();
  
  await autoLocationWeatherService.autoGetWeather({
    forceRefresh: true,
    useCache: true,
    preferBrowser: true
  });
};

/**
 * 打开城市选择器
 */
const openCitySelector = () => {
  showCitySelector.value = true;
};

/**
 * 关闭城市选择器
 */
const closeCitySelector = () => {
  showCitySelector.value = false;
};

/**
 * 处理城市选择
 * @param {Object} city - 城市信息
 */
const handleCitySelect = async (city) => {
  closeCitySelector();
  // 手动选择城市时，使用Store的方法（保持现有逻辑）
  await weatherStore.fetchWeatherByCity(city.adcode, city.name);
};

/**
 * 组件挂载/卸载
 */
onMounted(() => {
  // 注册状态监听
  autoLocationWeatherService.addListener(handleServiceStateChange);
  
  // 如果没有数据，自动刷新
  if (!weatherStore.hasWeatherData) {
    refreshWeather();
  }
});

onUnmounted(() => {
  // 移除监听
  autoLocationWeatherService.removeListener(handleServiceStateChange);
});
</script>

<style scoped>
.weather-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

/* 透明主题下的页面标题 */
.transparent .page-title {
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.transparent .page-subtitle {
  color: rgba(255, 255, 255, 0.85);
}

.transparent.dark .page-title {
  color: white;
}

.transparent.dark .page-subtitle {
  color: rgba(255, 255, 255, 0.75);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 位置选择器 */
.btn-location {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s;
}

.btn-location:hover {
  border-color: #3b82f6;
  background: #f9fafb;
}

/* 透明主题下的位置选择器 */
.transparent .btn-location {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.transparent .btn-location:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: #60a5fa;
}

.transparent.dark .btn-location {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.transparent.dark .btn-location:hover {
  background: rgba(30, 41, 59, 0.5);
  border-color: #60a5fa;
}

.location-icon {
  font-size: 16px;
}

.location-text {
  font-weight: 500;
}

.dropdown-icon {
  font-size: 10px;
  color: #9ca3af;
}

/* 单位切换 */
.unit-toggle {
  display: flex;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 2px;
}

.unit-btn {
  padding: 6px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  border-radius: 4px;
  transition: all 0.2s;
}

.unit-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 透明主题下的单位切换 */
.transparent .unit-toggle {
  background: rgba(255, 255, 255, 0.2);
}

.transparent .unit-btn {
  color: rgba(255, 255, 255, 0.8);
}

.transparent .unit-btn.active {
  background: rgba(255, 255, 255, 0.35);
  color: white;
}

.transparent.dark .unit-toggle {
  background: rgba(30, 41, 59, 0.4);
}

.transparent.dark .unit-btn {
  color: rgba(255, 255, 255, 0.7);
}

.transparent.dark .unit-btn.active {
  background: rgba(30, 41, 59, 0.6);
  color: white;
}

/* 刷新按钮 */
.btn-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #2563eb;
}

.btn-refresh:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 透明主题下的刷新按钮 - 保持蓝色但透明度提高 */
.transparent .btn-refresh {
  background: rgba(59, 130, 246, 0.8);
}

.transparent .btn-refresh:hover:not(:disabled) {
  background: rgba(37, 99, 235, 0.9);
}

.refresh-icon {
  font-size: 14px;
  display: inline-block;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-state h3 {
  margin: 0 0 8px 0;
  color: #111827;
}

.error-state p {
  margin: 0 0 16px 0;
  color: #6b7280;
}

.btn-retry {
  padding: 8px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-retry:hover {
  background: #2563eb;
}

/* 当前天气卡片 */
.current-weather-card {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  margin-bottom: 24px;
  transition: background 0.3s ease;
}

/* 透明主题下的当前天气卡片 - 无玻璃态模糊 */
.transparent .current-weather-card {
  background: rgba(59, 130, 246, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
}

/* 深色透明主题下的当前天气卡片 */
.transparent.dark .current-weather-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.weather-icon {
  font-size: 64px;
}

.weather-info {
  flex: 1;
}

.temperature {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.weather-desc {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.update-time {
  font-size: 12px;
  opacity: 0.7;
}

.weather-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  opacity: 0.8;
}

.detail-value {
  font-size: 16px;
  font-weight: 600;
}

/* 图表区域 */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.chart-container {
  min-width: 0;
}

.chart-container > * {
  box-shadow: none !important;
}

/* 风向风速 */
.wind-section {
  margin-bottom: 24px;
}

/* 智能推荐 */
.recommendations-section {
  margin-bottom: 24px;
}

/* 预报区域 */
.forecast-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: background 0.3s ease;
}

/* 透明主题下的预报区域 */
.transparent .forecast-section {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(31, 38, 135, 0.1);
}

.transparent.dark .forecast-section {
  background: rgba(30, 41, 59, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

/* 透明主题下的预报卡片 */
.transparent .forecast-item {
  background: rgba(255, 255, 255, 0.15);
}

.transparent.dark .forecast-item {
  background: rgba(51, 65, 85, 0.3);
}

/* 天气页面容器透明化 */
.transparent .weather-view {
  background: transparent;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.forecast-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.forecast-item {
  display: grid;
  grid-template-columns: 80px 1fr 100px 80px 120px;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 8px;
  background: #f9fafb;
  transition: background 0.2s;
}

.forecast-item:hover {
  background: #f3f4f6;
}

.forecast-date {
  text-align: center;
}

.day-name {
  font-weight: 600;
  color: #111827;
  font-size: 14px;
}

.day-date {
  font-size: 12px;
  color: #6b7280;
}

.forecast-weather {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weather-icon {
  font-size: 24px;
}

.weather-text {
  font-size: 14px;
  color: #374151;
}

.forecast-temp {
  display: flex;
  align-items: center;
  gap: 8px;
}

.temp-high {
  font-weight: 600;
  color: #111827;
}

.temp-low {
  color: #6b7280;
}

.forecast-precip,
.forecast-wind {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;
}

.precip-icon,
.wind-icon {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .weather-view {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: flex-start;
  }

  .weather-main {
    flex-direction: column;
    text-align: center;
  }

  .temperature {
    font-size: 36px;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .forecast-item {
    grid-template-columns: 60px 1fr 80px;
    gap: 8px;
  }

  .forecast-precip,
  .forecast-wind {
    display: none;
  }
}
</style>
