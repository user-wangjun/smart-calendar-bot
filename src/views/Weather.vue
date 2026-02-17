<template>
  <div class="weather-page">
    <div class="weather-container">
      <!-- 天气组件 -->
      <WeatherWidget
        :location="currentCity"
        :auto-refresh="autoRefresh"
        :refresh-interval="refreshInterval * 60 * 1000"
        @weather-update="handleWeatherUpdate"
        @error="handleWeatherError"
      />

      <!-- 天气设置按钮 -->
      <div class="settings-section">
        <button
          @click="showSettings = true"
          class="settings-button"
        >
          ⚙️ 天气设置
        </button>
      </div>

      <!-- 定位信息卡片 -->
      <div class="location-section">
        <h3 class="section-title">当前位置</h3>
        <div class="location-card">
          <div v-if="locationLoading" class="location-loading">
            <LoadingSpinner size="small" />
            <span>正在获取位置...</span>
          </div>
          <div v-else-if="locationError" class="location-error">
            <span class="error-icon">⚠️</span>
            <span class="error-text">{{ locationError }}</span>
            <button @click="retryLocation" class="retry-btn">重试</button>
          </div>
          <div v-else-if="currentLocation" class="location-info">
            <div class="location-icon">📍</div>
            <div class="location-details">
              <div class="location-city">{{ currentLocation.city || currentLocation.name || '未知位置' }}</div>
              <div class="location-coords" v-if="currentLocation.latitude">
                {{ currentLocation.latitude.toFixed(4) }}, {{ currentLocation.longitude.toFixed(4) }}
              </div>
              <div class="location-source">来源: {{ getLocationSourceText(currentLocation.source) }}</div>
            </div>
          </div>
          <div v-else class="location-empty">
            <span>尚未获取位置信息</span>
            <button @click="getLocation" class="location-btn">获取位置</button>
          </div>
        </div>
      </div>

      <!-- 城市选择 -->
      <div class="city-section">
        <h3 class="section-title">常用城市</h3>
        <div class="city-list">
          <div
            v-for="city in favoriteCities"
            :key="city"
            class="city-item"
            :class="{ 'active': city === currentCity }"
            @click="selectCity(city)"
          >
            {{ city }}
          </div>
        </div>
        <button @click="useCurrentLocation" class="use-location-btn" :disabled="!currentLocation">
          📍 使用当前位置
        </button>
      </div>
    </div>

    <!-- 设置对话框 -->
    <div v-if="showSettings" class="settings-modal" @click.self="showSettings = false">
      <div class="settings-content">
        <div class="settings-header">
          <h2>天气设置</h2>
          <button @click="showSettings = false" class="close-button">✕</button>
        </div>
        <WeatherSettings />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';
import locationWeatherService from '@/services/locationWeatherService.js';
import WeatherWidget from '@/components/ui/WeatherWidget.vue';
import WeatherSettings from '@/components/ui/WeatherSettings.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';

const settingsStore = useSettingsStore();

const showSettings = ref(false);
const currentCity = ref('beijing');
const currentLocation = ref(null);
const locationLoading = ref(false);
const locationError = ref(null);

const weatherSettings = computed(() => settingsStore.getWeatherSettings());

const favoriteCities = computed(() => weatherSettings.value.favoriteCities || ['beijing', '上海', '广州']);
const autoRefresh = computed(() => weatherSettings.value.autoRefresh || false);
const refreshInterval = computed(() => weatherSettings.value.refreshInterval || 30);

const selectCity = (city) => {
  currentCity.value = city;
};

const handleWeatherUpdate = (weatherData) => {
  console.log('天气数据已更新:', weatherData);
};

const handleWeatherError = (error) => {
  console.error('天气错误:', error);
};

/**
 * 获取当前位置
 */
const getLocation = async () => {
  locationLoading.value = true;
  locationError.value = null;

  try {
    const result = await locationWeatherService.getLocationOnly();

    if (result.success) {
      currentLocation.value = result.data;
      console.log('获取位置成功:', result.data);
    } else {
      locationError.value = result.error || '获取位置失败';
    }
  } catch (error) {
    locationError.value = error.message || '获取位置时发生错误';
    console.error('获取位置失败:', error);
  } finally {
    locationLoading.value = false;
  }
};

/**
 * 重试获取位置
 */
const retryLocation = () => {
  getLocation();
};

/**
 * 使用当前位置获取天气
 */
const useCurrentLocation = async () => {
  if (!currentLocation.value) return;

  const location = currentLocation.value;

  // 如果有城市名，使用城市名
  if (location.city && location.city !== '未知') {
    currentCity.value = location.city;
  } else if (location.name && location.name !== '未知') {
    currentCity.value = location.name;
  } else if (location.latitude && location.longitude) {
    // 否则使用坐标
    currentCity.value = `${location.latitude}:${location.longitude}`;
  }

  console.log('使用当前位置:', currentCity.value);
};

/**
 * 获取位置来源文本
 */
const getLocationSourceText = (source) => {
  const sourceMap = {
    'gps': 'GPS定位',
    'browser': '浏览器定位',
    'ip': 'IP定位',
    'curl-ipapi': 'IP定位',
    'cache': '缓存',
    'default': '默认位置'
  };
  return sourceMap[source] || source || '未知';
};

onMounted(() => {
  currentCity.value = weatherSettings.value.defaultCity || 'beijing';

  // 自动获取位置
  getLocation();
});

onUnmounted(() => {
  showSettings.value = false;
});
</script>

<style scoped>
.weather-page {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
}

.weather-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

/* 主内容区 */
.weather-container > :first-child {
  grid-column: 1 / -1;
}

/* 设置按钮 */
.settings-section {
  grid-column: 2;
  grid-row: 1;
}

.settings-button {
  width: 100%;
  padding: 12px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-base);
  font-weight: 500;
  transition: all var(--transition-base);
}

.settings-button:hover {
  background-color: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 定位信息区域 */
.location-section {
  grid-column: 2;
  grid-row: 2;
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 20px;
  border: var(--border-sm);
}

.location-card {
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.location-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
}

.location-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.error-icon {
  font-size: 24px;
}

.error-text {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.retry-btn {
  padding: 6px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.location-info {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.location-icon {
  font-size: 32px;
}

.location-details {
  flex: 1;
}

.location-city {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.location-coords {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

.location-source {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: 4px;
}

.location-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
}

.location-btn {
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

/* 城市选择 */
.city-section {
  grid-column: 2;
  grid-row: 3;
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 20px;
  border: var(--border-sm);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.city-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.city-item {
  padding: 12px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--text-base);
  color: var(--text-primary);
}

.city-item:hover {
  border-color: var(--primary-color);
  transform: translateX(4px);
  background-color: var(--bg-hover);
}

.city-item.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.use-location-btn {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  background-color: var(--success-color, #10b981);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-base);
  font-weight: 500;
  transition: all var(--transition-base);
}

.use-location-btn:hover:not(:disabled) {
  background-color: var(--success-hover, #059669);
  transform: translateY(-2px);
}

.use-location-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 设置对话框 */
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.settings-content {
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.settings-header h2 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--text-primary);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
}

.close-button:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .weather-container {
    grid-template-columns: 1fr;
  }

  .settings-section {
    grid-column: 1;
    grid-row: 2;
  }

  .location-section {
    grid-column: 1;
    grid-row: 3;
  }

  .city-section {
    grid-column: 1;
    grid-row: 4;
  }
}

@media (max-width: 768px) {
  .weather-page {
    padding: 10px;
  }

  .settings-content {
    width: 95%;
    max-height: 90vh;
  }
}
</style>
