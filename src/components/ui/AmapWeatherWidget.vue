<template>
  <div class="amap-weather-widget">
    <!-- 加载状态 -->
    <div v-if="loading" class="weather-loading">
      <LoadingSpinner size="medium" />
      <span class="loading-text">正在获取天气...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="weather-error">
      <div class="error-icon">⚠️</div>
      <div class="error-message">{{ error }}</div>
      <div v-if="warning" class="warning-message">{{ warning }}</div>
      <button @click="refreshWeather" class="retry-btn">
        重试
      </button>
    </div>

    <!-- 天气内容 -->
    <div v-else-if="weatherData" class="weather-content">
      <!-- 位置信息 -->
      <div class="location-header">
        <span class="location-icon">📍</span>
        <span class="location-name">{{ locationName }}</span>
        <span v-if="dataSource === 'cache'" class="cache-badge">缓存</span>
      </div>

      <!-- 主要天气信息 -->
      <div class="weather-main">
        <div class="weather-icon">{{ weatherIcon }}</div>
        <div class="temperature">{{ temperature }}°</div>
        <div class="weather-desc">{{ weatherDesc }}</div>
      </div>

      <!-- 详细天气信息 -->
      <div class="weather-details">
        <div class="detail-item">
          <span class="detail-label">湿度</span>
          <span class="detail-value">{{ humidity }}%</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">风向</span>
          <span class="detail-value">{{ windDirection }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">风力</span>
          <span class="detail-value">{{ windPower }}</span>
        </div>
      </div>

      <!-- 更新时间 -->
      <div class="update-time">
        更新时间: {{ updateTime }}
      </div>
    </div>

    <!-- 未配置API密钥 -->
    <div v-else class="weather-unconfigured">
      <div class="unconfigured-icon">🔑</div>
      <div class="unconfigured-text">请先配置高德API密钥</div>
      <button @click="openSettings" class="config-btn">
        去配置
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import amapLocationWeatherService from '@/services/amapLocationWeatherService.js';
import LoadingSpinner from './LoadingSpinner.vue';

const props = defineProps({
  apiKey: {
    type: String,
    default: ''
  },
  location: {
    type: [String, Object],
    default: null
  },
  autoRefresh: {
    type: Boolean,
    default: true
  },
  refreshInterval: {
    type: Number,
    default: 30 * 60 * 1000 // 30分钟
  }
});

const emit = defineEmits(['weather-update', 'error', 'ready']);

// 状态
const loading = ref(false);
const error = ref(null);
const warning = ref(null);
const weatherData = ref(null);
const locationData = ref(null);
const dataSource = ref(null);
const refreshTimer = ref(null);

// 计算属性
const locationName = computed(() => {
  if (locationData.value) {
    return locationData.value.city || locationData.value.name || '未知位置';
  }
  if (weatherData.value?.location) {
    return weatherData.value.location.city || '未知位置';
  }
  return '未知位置';
});

const temperature = computed(() => {
  return weatherData.value?.weather?.temperature || '--';
});

const weatherDesc = computed(() => {
  return weatherData.value?.weather?.text || '未知';
});

const humidity = computed(() => {
  return weatherData.value?.weather?.humidity || '--';
});

const windDirection = computed(() => {
  return weatherData.value?.weather?.windDirection || '--';
});

const windPower = computed(() => {
  return weatherData.value?.weather?.windPower || '--';
});

const updateTime = computed(() => {
  const time = weatherData.value?.weather?.reportTime;
  if (!time) return '--';
  const date = new Date(time);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
});

const weatherIcon = computed(() => {
  const code = weatherData.value?.weather?.code || '0';
  const iconMap = {
    '0': '☀️', // 晴
    '1': '🌤️', // 多云
    '2': '☁️', // 阴
    '3': '🌦️', // 阵雨
    '4': '⛈️', // 雷阵雨
    '5': '⛈️', // 雷阵雨伴有冰雹
    '6': '🌨️', // 雨夹雪
    '7': '🌧️', // 小雨
    '8': '🌧️', // 中雨
    '9': '🌧️', // 大雨
    '10': '🌧️', // 暴雨
    '11': '🌧️', // 大暴雨
    '12': '🌧️', // 特大暴雨
    '13': '🌨️', // 阵雪
    '14': '🌨️', // 小雪
    '15': '🌨️', // 中雪
    '16': '🌨️', // 大雪
    '17': '🌨️', // 暴雪
    '18': '🌫️', // 雾
    '19': '🌧️', // 冻雨
    '20': '🌫️', // 沙尘暴
    '29': '🌫️', // 浮尘
    '30': '🌫️', // 扬沙
    '31': '🌫️', // 强沙尘暴
    '53': '😷', // 霾
  };
  return iconMap[code] || '🌡️';
});

// 方法
const fetchWeather = async () => {
  loading.value = true;
  error.value = null;
  warning.value = null;

  try {
    // 设置API密钥
    if (props.apiKey) {
      amapLocationWeatherService.setApiKey(props.apiKey);
    }

    // 检查API密钥
    if (!amapLocationWeatherService.isApiKeyValid()) {
      throw new Error('高德API密钥未配置或无效');
    }

    let result;
    
    // 根据传入的位置参数决定如何获取天气
    if (props.location) {
      // 使用指定位置
      result = await amapLocationWeatherService.getWeatherOnly(props.location);
    } else {
      // 自动获取位置和天气
      result = await amapLocationWeatherService.getLocationAndWeather();
    }

    if (result.success) {
      weatherData.value = result.data.weather;
      locationData.value = result.data.location;
      dataSource.value = result.source;
      
      if (result.warning) {
        warning.value = result.warning;
      }

      emit('weather-update', {
        weather: result.data.weather,
        location: result.data.location,
        source: result.source,
        performance: result.performance
      });
    } else {
      throw new Error(result.error || '获取天气失败');
    }
  } catch (err) {
    error.value = err.message || '获取天气失败';
    emit('error', { message: err.message, error: err });
  } finally {
    loading.value = false;
    emit('ready');
  }
};

const refreshWeather = () => {
  fetchWeather();
};

const openSettings = () => {
  // 触发打开设置事件，由父组件处理
  emit('open-settings');
};

const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer.value = setInterval(() => {
      fetchWeather();
    }, props.refreshInterval);
  }
};

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
};

// 监听API密钥变化
watch(() => props.apiKey, (newKey) => {
  if (newKey) {
    amapLocationWeatherService.setApiKey(newKey);
    fetchWeather();
  }
});

// 监听位置变化
watch(() => props.location, () => {
  fetchWeather();
});

// 生命周期
onMounted(() => {
  fetchWeather();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.amap-weather-widget {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 加载状态 */
.weather-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-text {
  font-size: 14px;
  opacity: 0.9;
}

/* 错误状态 */
.weather-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
}

.error-message {
  font-size: 16px;
  font-weight: 500;
}

.warning-message {
  font-size: 12px;
  opacity: 0.8;
}

.retry-btn {
  padding: 8px 24px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 天气内容 */
.weather-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.location-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.location-icon {
  font-size: 18px;
}

.location-name {
  font-weight: 500;
}

.cache-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

/* 主要天气信息 */
.weather-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
}

.weather-icon {
  font-size: 48px;
}

.temperature {
  font-size: 48px;
  font-weight: 300;
  line-height: 1;
}

.weather-desc {
  font-size: 18px;
  opacity: 0.9;
}

/* 详细天气信息 */
.weather-details {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  opacity: 0.7;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
}

/* 更新时间 */
.update-time {
  text-align: center;
  font-size: 12px;
  opacity: 0.6;
}

/* 未配置状态 */
.weather-unconfigured {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.unconfigured-icon {
  font-size: 48px;
}

.unconfigured-text {
  font-size: 16px;
  opacity: 0.9;
}

.config-btn {
  padding: 10px 28px;
  background: white;
  border: none;
  border-radius: 20px;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.config-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
