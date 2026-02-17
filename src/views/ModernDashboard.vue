<template>
  <div class="dashboard-container">
    <!-- Header Section -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-title-wrapper">
          <div class="header-icon-wrapper">
            <Hand class="header-icon" />
          </div>
          <div class="header-text">
            <h1 class="header-title">欢迎使用智能日历</h1>
            <p class="header-subtitle">基于 AI 的智能日程管理助手</p>
          </div>
        </div>
        <div class="header-actions">
          <BaseButton
            variant="primary"
            @click="goToCalendar"
            :icon="Calendar"
            size="md"
          >
            开始使用
          </BaseButton>
          <BaseButton
            variant="secondary"
            @click="openAIChat"
            :icon="MessageSquare"
            size="md"
          >
            AI 对话
          </BaseButton>
        </div>
      </div>
    </header>

    <!-- Dashboard Grid -->
    <div class="dashboard-grid">
      <!-- 今日日历卡片 -->
      <TodayCalendar class="card-calendar" style="animation-delay: 0.05s" />
      
      <!-- 天气卡片 -->
      <BaseCard
        class="card-weather"
        style="animation-delay: 0.2s"
      >
        <template #header>
          <div class="card-header-content">
            <div class="card-title-wrapper">
              <div class="card-icon-bg icon-weather">
                <Cloud class="card-icon" />
              </div>
              <h3 class="card-title">当前天气</h3>
            </div>
            <BaseButton
              variant="ghost"
              size="xs"
              :loading="weatherLoading"
              @click="refreshWeatherOnly"
              title="刷新天气"
            >
              <RefreshCw class="refresh-icon" :class="{ 'animate-spin': weatherLoading }" />
            </BaseButton>
          </div>
        </template>

        <div class="weather-content">
          <!-- 加载 -->
          <div v-if="weatherLoading" class="weather-loading">
            <div class="loading-left">
              <BaseSkeleton class="skeleton-temp" />
              <BaseSkeleton class="skeleton-weather" />
            </div>
            <BaseSkeleton circle class="skeleton-icon" />
          </div>

          <!-- 错误 -->
          <div v-else-if="weatherError" class="weather-error">
            <p class="error-message">{{ weatherError }}</p>
            <BaseButton size="sm" variant="outline" @click="refreshWeatherOnly">重试</BaseButton>
          </div>

          <!-- 成功 -->
          <div v-else-if="currentWeather" class="weather-info">
            <div class="weather-main">
              <div class="weather-temp-wrapper">
                <span class="weather-temp">
                  {{ currentWeather.temperature !== undefined ? currentWeather.temperature : '--' }}°
                </span>
                <div class="weather-desc-wrapper">
                  <span class="weather-desc">{{ currentWeather.weather || currentWeather.description || '未知' }}</span>
                  <component
                    :is="getWeatherIcon(currentWeather.weather)"
                    class="weather-icon"
                  />
                </div>
              </div>
            </div>

            <div class="weather-details">
              <div class="detail-item">
                <Droplets class="detail-icon icon-humidity" />
                <span class="detail-label">湿度</span>
                <span class="detail-value">{{ currentWeather.humidity }}%</span>
              </div>
              <div class="detail-item detail-border">
                <Wind class="detail-icon icon-wind" />
                <span class="detail-label">风向</span>
                <span class="detail-value">{{ currentWeather.windDirection || '-' }}</span>
              </div>
              <div class="detail-item detail-border">
                <Zap class="detail-icon icon-power" />
                <span class="detail-label">风力</span>
                <span class="detail-value">{{ currentWeather.windPower || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="weather-empty">
            暂无天气数据
          </div>
        </div>

        <!-- 装饰背景 -->
        <div class="weather-decorative-bg">
          <CloudSun class="weather-decorative-icon" />
        </div>
      </BaseCard>

      <!-- 今日日程卡片 -->
      <BaseCard
        class="card-events"
        style="animation-delay: 0.3s"
        hoverable
        @click="goToCalendar"
      >
        <template #header>
          <div class="card-header-content">
            <div class="card-title-wrapper">
              <div class="card-icon-bg icon-events">
                <Calendar class="card-icon" />
              </div>
              <h3 class="card-title">今日日程</h3>
            </div>
            <BaseButton variant="ghost" size="xs" @click.stop="goToCalendar">
              <ChevronRight class="arrow-icon" />
            </BaseButton>
          </div>
        </template>

        <div class="events-content">
          <div v-if="todayEvents.length === 0" class="events-empty">
            <div class="events-empty-icon-wrapper">
              <CalendarCheck class="events-empty-icon" />
            </div>
            <p class="events-empty-text">今日暂无事项</p>
            <BaseButton size="xs" variant="ghost" class="add-btn" @click.stop="goToCalendar">添加</BaseButton>
          </div>
          <div v-else class="events-list">
            <div
              v-for="(event, index) in todayEvents"
              :key="event.id"
              class="event-item"
              @click.stop="goToCalendar"
            >
              <div class="event-indicator"></div>
              <div class="event-details">
                <h4 class="event-title">{{ event.title }}</h4>
                <p class="event-time">
                  <Clock class="event-time-icon" />
                  {{ formatTime(event.startDate) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 天气预报卡片 -->
      <BaseCard
        v-if="weatherForecast && weatherForecast.length > 0"
        class="card-forecast"
        style="animation-delay: 0.4s"
      >
        <template #header>
          <div class="card-title-wrapper">
            <div class="card-icon-bg icon-forecast">
              <CalendarDays class="card-icon" />
            </div>
            <h3 class="card-title">未来预报</h3>
          </div>
        </template>

        <div class="forecast-content">
          <div
            v-for="(day, index) in weatherForecast"
            :key="index"
            class="forecast-item"
          >
            <span class="forecast-date">{{ formatForecastDate(day.date) }}</span>
            <component
              :is="getWeatherIcon(day.dayWeather)"
              class="forecast-weather-icon"
            />
            <span class="forecast-weather">{{ day.dayWeather }}</span>
            <div class="forecast-temp">
              <span class="temp-high">{{ day.dayTemp }}°</span>
              <span class="temp-divider">/</span>
              <span class="temp-low">{{ day.nightTemp }}°</span>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 待办事项卡片 -->
      <BaseCard
        class="card-todos"
        style="animation-delay: 0.5s"
        hoverable
      >
        <template #header>
          <div class="card-header-content">
            <div class="card-title-wrapper">
              <div class="card-icon-bg icon-todos">
                <ListTodo class="card-icon" />
              </div>
              <h3 class="card-title">今日待办</h3>
            </div>
            <BaseButton variant="ghost" size="xs" @click="goToCalendar">
              <ChevronRight class="arrow-icon" />
            </BaseButton>
          </div>
        </template>

        <div class="todos-content">
          <div v-if="todayTodoTasks.length === 0" class="todos-empty">
            <div class="todos-empty-icon-wrapper">
              <CheckCircle2 class="todos-empty-icon" />
            </div>
            <p class="todos-empty-text">今日暂无待办</p>
            <BaseButton size="xs" variant="ghost" class="add-btn" @click="goToCalendar">添加</BaseButton>
          </div>
          <div v-else class="todos-list">
            <div
              v-for="(task, index) in todayTodoTasks.slice(0, 3)"
              :key="task.id"
              class="todo-item"
              :class="{ 'todo-completed': task.completed }"
            >
              <button 
                class="todo-checkbox"
                @click="toggleTaskComplete(task.id)"
              >
                <CheckCircle2 v-if="task.completed" class="check-icon" />
                <Circle v-else class="circle-icon" />
              </button>
              <div class="todo-details" @click="goToCalendar">
                <h4 class="todo-title">{{ task.title }}</h4>
                <p class="todo-time">
                  <Clock class="todo-time-icon" />
                  {{ formatTime(task.startDate) }}
                </p>
              </div>
              <div class="todo-priority" :class="`priority-${task.priority || 'medium'}`">
                {{ getPriorityLabel(task.priority) }}
              </div>
            </div>
            <div v-if="todayTodoTasks.length > 3" class="more-todos" @click="goToCalendar">
              +{{ todayTodoTasks.length - 3 }} 更多
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Modals -->
    <ManualLocationSelector
      :visible="showLocationSelector"
      @select="handleManualCitySelect"
      @close="closeLocationSelector"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useEventsStore } from '@/stores/events';
import { useChatStore } from '@/stores/chat';
import { useWeatherStore } from '@/stores/weather.js';

import autoLocationWeatherService, { ServiceState } from '@/services/autoLocationWeatherService.js';
import amapWeatherService from '@/services/amapWeatherService.js';

// Components
import BaseButton from '@/components/base/BaseButton.vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseBadge from '@/components/base/BaseBadge.vue';
import BaseSkeleton from '@/components/base/BaseSkeleton.vue';
import ManualLocationSelector from '@/components/ManualLocationSelector.vue';
import TodayCalendar from '@/components/TodayCalendar.vue';

// Icons
import {
  Calendar,
  MessageSquare,
  MapPin,
  RefreshCw,
  AlertCircle,
  Navigation,
  Clock,
  Cloud,
  Droplets,
  Wind,
  Zap,
  CloudSun,
  ChevronRight,
  CalendarCheck,
  CalendarDays,
  ListTodo,
  CheckCircle2,
  Circle,
  Hand,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog
} from 'lucide-vue-next';

const router = useRouter();
const eventsStore = useEventsStore();
const chatStore = useChatStore();
const weatherStore = useWeatherStore();

// 统一的状态管理
const serviceState = ref('idle');
const statusMessage = ref('');

// 位置相关状态（从Store同步）
const currentLocation = computed({
  get: () => weatherStore.currentLocation,
  set: (val) => weatherStore.setLocation(val)
});
const locationError = ref(null);
const locationErrorDetail = ref(null);

// 天气相关状态（从Store同步）
const currentWeather = computed(() => weatherStore.weatherData?.current || null);
const weatherError = computed(() => weatherStore.error);
const weatherForecast = computed(() => weatherStore.weatherData?.daily || []);
const lastUpdateTime = computed(() => weatherStore.lastUpdateTime);
const weatherLoading = computed(() => weatherStore.isLoading);

// 手动位置选择器状态
const showLocationSelector = ref(false);

// 计算属性：是否正在加载
const isLoading = computed(() => {
  return serviceState.value === ServiceState.LOCATING ||
         serviceState.value === ServiceState.GETTING_WEATHER;
});

// 推荐相关状态
const recommendations = ref([]);
const recommendationsLoading = ref(false);
const recommendationsError = ref(null);

const todayEvents = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return eventsStore.getEventsByDate ? eventsStore.getEventsByDate(today).slice(0, 3) : [];
});

const todayTodoTasks = computed(() => eventsStore.todayTodoTasks);
const toggleTaskComplete = (taskId) => eventsStore.toggleTaskComplete(taskId);

const getPriorityLabel = (priority) => {
  const priorityMap = {
    'high': '高',
    'medium': '中',
    'low': '低'
  };
  return priorityMap[priority] || '中';
};

const goToCalendar = () => router.push('/calendar');
const openAIChat = () => router.push('/ai-assistant');

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * 获取天气图标
 */
const getWeatherIcon = (weather) => {
  if (!weather) return Sun;
  const weatherMap = {
    '晴': Sun,
    '多云': Cloud,
    '阴': Cloud,
    '小雨': CloudRain,
    '中雨': CloudRain,
    '大雨': CloudRain,
    '雪': CloudSnow,
    '雷阵雨': CloudLightning,
    '雾': CloudFog,
    '霾': CloudFog
  };

  for (const [key, icon] of Object.entries(weatherMap)) {
    if (weather.includes(key)) return icon;
  }
  return Sun;
};

/**
 * 获取提供商显示名称
 */
const getProviderDisplayName = (provider) => {
  const providerMap = {
    'amap': '高德定位',
    'tencent': '腾讯定位',
    'browser': '浏览器定位',
    'ip': 'IP定位',
    'cache': '缓存位置',
    'cache_fallback': '缓存位置',
    'default': '默认位置',
    'default_fallback': '默认位置',
    'unknown': '未知来源'
  };
  return providerMap[provider] || provider || '未知';
};

/**
 * 获取来源标签样式变体
 */
const getSourceBadgeVariant = (source) => {
  const src = source || '';
  if (src === 'amap' || src.includes('amap')) return 'primary';
  if (src === 'tencent' || src.includes('tencent')) return 'info';
  if (src === 'browser') return 'success';
  if (src === 'ip') return 'warning';
  if (src.includes('cache')) return 'default';
  return 'default';
};

/**
 * 格式化精度
 */
const formatAccuracy = (accuracy) => {
  if (!accuracy) return '未知';
  if (accuracy < 10) return '<10m';
  if (accuracy < 50) return '<50m';
  if (accuracy < 100) return '<100m';
  return '>100m';
};

/**
 * 格式化更新时间（相对时间）
 */
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '未知';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;

  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 处理服务状态变化
 */
const handleServiceStateChange = (state, data) => {
  // 直接同步更新状态，避免 nextTick 导致的渲染时序问题
  serviceState.value = state;

  switch (state) {
    case ServiceState.LOCATING:
      statusMessage.value = data.message || '正在定位...';
      locationError.value = null;
      break;

    case ServiceState.GETTING_WEATHER:
      statusMessage.value = data.message || '获取天气中...';
      break;

    case ServiceState.SUCCESS:
      try {
        if (data.location) {
          const locationData = {
            city: data.location.city || '未知城市',
            province: data.location.province || '',
            district: data.location.district || '',
            adcode: data.location.adcode || '',
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            accuracy: data.location.accuracy,
            source: data.location.source || 'unknown',
            provider: data.location.provider || 'unknown',
            timestamp: data.timestamp || new Date().toISOString()
          };
          weatherStore.setLocation(locationData);
        }

        weatherStore.syncFromDashboard({
          location: data.location,
          weather: data.weather,
          forecast: data.forecast,
          timestamp: data.timestamp
        });

        statusMessage.value = '';
      } catch (parseError) {
        console.error('[Dashboard] 解析天气数据失败:', parseError);
        weatherStore.setError('数据解析失败');
      }
      break;

    case ServiceState.ERROR:
      const errorMsg = data.error || '获取失败';
      locationError.value = errorMsg;

      if (errorMsg.includes('配额') || errorMsg.includes('CUQPS')) {
        locationErrorDetail.value = 'API配额超限';
      } else if (errorMsg.includes('权限')) {
        locationErrorDetail.value = '请允许位置权限';
      } else {
        locationErrorDetail.value = '网络或服务异常';
      }
      break;
  }
};

const refreshLocationWeather = async (force = false) => {
  locationError.value = null;
  locationErrorDetail.value = null;

  const result = await autoLocationWeatherService.autoGetWeather({
    forceRefresh: force,
    useCache: true,
    preferBrowser: true
  });

  return result;
};

/**
 * 只刷新天气数据，不重新定位
 * 使用当前已有的位置信息获取最新天气
 */
const refreshWeatherOnly = async () => {
  // 如果没有位置信息，执行完整刷新（定位+天气）
  if (!currentLocation.value?.adcode) {
    console.log('[Dashboard] 无位置信息，执行完整刷新');
    return await refreshLocationWeather(true);
  }

  console.log('[Dashboard] 只刷新天气，使用当前位置:', currentLocation.value.city);
  console.log('[Dashboard] 当前位置详情:', JSON.stringify(currentLocation.value));

  try {
    // 只刷新天气，不触发定位，保留当前位置信息
    const result = await weatherStore.fetchWeatherData(true, true);

    if (result.success) {
      console.log('[Dashboard] 天气刷新成功');
      console.log('[Dashboard] 刷新后位置:', JSON.stringify(currentLocation.value));
      // 清除可能存在的错误状态
      locationError.value = null;
      locationErrorDetail.value = null;
    } else {
      console.warn('[Dashboard] 天气刷新失败:', result.error);
    }

    return result;
  } catch (error) {
    console.error('[Dashboard] 刷新天气时出错:', error);
    return { success: false, error: error.message };
  }
};

const openLocationSelector = () => {
  showLocationSelector.value = true;
};

const closeLocationSelector = () => {
  showLocationSelector.value = false;
};

const handleManualCitySelect = async (locationData) => {
  // 支持三级选择结果（包含区县）
  const adcode = locationData.districtAdcode || locationData.cityAdcode;
  const name = locationData.district || locationData.city;

  await weatherStore.fetchWeatherByCity(adcode, name);

  // 更新位置信息，包含区县
  weatherStore.setLocation({
    ...weatherStore.currentLocation,
    province: locationData.province,
    city: locationData.city,
    district: locationData.district,
    adcode: adcode,
    source: 'manual',
    provider: 'manual'
  });

  locationError.value = null;
  locationErrorDetail.value = null;
};

const formatForecastDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return '今天';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '明天';
  }

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[date.getDay()];
};



onMounted(() => {
  if (eventsStore.loadFromLocalStorage) {
    eventsStore.loadFromLocalStorage();
  }

  autoLocationWeatherService.addListener(handleServiceStateChange);
  refreshLocationWeather();

  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  autoLocationWeatherService.removeListener(handleServiceStateChange);
  autoLocationWeatherService.stopAutoRefresh();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    const stats = autoLocationWeatherService.getStats();
    if (!stats.hasWeatherCache && serviceState.value !== ServiceState.LOCATING && serviceState.value !== ServiceState.GETTING_WEATHER) {
      refreshLocationWeather();
    }
  }
};
</script>

<style scoped>
/* 仪表盘容器 - 移除玻璃质感，保留适当透明 */
.dashboard-container {
  min-height: 100vh;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  transition: background-color 0.3s ease;
}

.dark .dashboard-container {
  background: rgba(15, 23, 42, 0.15);
}

/* 透明主题下的仪表盘容器 - 更高透明度 */
.transparent .dashboard-container {
  background: rgba(255, 255, 255, 0.1);
}

.transparent.dark .dashboard-container {
  background: rgba(15, 23, 42, 0.15);
}

/* 头部区域 - 移除玻璃质感，保留适当透明 */
.dashboard-header {
  margin-bottom: 2rem;
  animation: slideUp 0.5s ease-out;
  background: rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-xl);
  padding: 1rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.dark .dashboard-header {
  background: rgba(30, 41, 59, 0.12);
  border-color: rgba(255, 255, 255, 0.15);
}

/* 透明主题下的头部区域 - 更高透明度 */
.transparent .dashboard-header {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.18);
}

.transparent.dark .dashboard-header {
  background: rgba(30, 41, 59, 0.15);
  border-color: rgba(255, 255, 255, 0.1);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-title-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon-wrapper {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.header-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: white;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--main-text-primary);
  margin: 0;
}

.dark .header-title {
  color: var(--dark-text-primary);
}

.header-subtitle {
  font-size: 0.875rem;
  color: var(--main-text-muted);
  margin: 0;
}

.dark .header-subtitle {
  color: var(--dark-text-muted);
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* 网格布局 */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 卡片基础样式 */
.card-calendar,
.card-location,
.card-events {
  grid-column: span 1;
}

.card-weather {
  grid-column: span 1;
}

.card-forecast,
.card-todos {
  grid-column: span 1;
}

@media (min-width: 768px) {
  .card-calendar {
    grid-column: span 2;
  }
  
  .card-weather {
    grid-column: span 1;
  }
  
  .card-forecast,
  .card-todos {
    grid-column: span 2;
  }
}

@media (min-width: 1024px) {
  .card-calendar {
    grid-column: span 4;
  }
  
  .card-weather {
    grid-column: span 2;
  }
  
  .card-forecast,
  .card-todos {
    grid-column: span 2;
  }
}

/* 卡片头部 */
.card-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-icon-bg {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-location {
  background: rgba(59, 130, 246, 0.1);
}

.icon-weather {
  background: rgba(14, 165, 233, 0.1);
}

.icon-events {
  background: rgba(139, 92, 246, 0.1);
}

.icon-forecast {
  background: rgba(99, 102, 241, 0.1);
}

.icon-todos {
  background: rgba(59, 130, 246, 0.1);
}

.card-icon {
  width: 1rem;
  height: 1rem;
  color: #3b82f6;
}

.icon-weather .card-icon {
  color: #0ea5e9;
}

.icon-events .card-icon {
  color: #8b5cf6;
}

.icon-forecast .card-icon {
  color: #6366f1;
}

.icon-todos .card-icon {
  color: #3b82f6;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--main-text-primary);
  margin: 0;
}

.dark .card-title {
  color: var(--dark-text-primary);
}

.refresh-icon,
.arrow-icon {
  width: 0.875rem;
  height: 0.875rem;
}

/* 位置卡片内容 */
.location-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 120px;
  position: relative;
  z-index: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-title {
  height: 2rem;
  width: 75%;
}

.skeleton-subtitle {
  height: 1rem;
  width: 50%;
}

.error-state {
  text-align: center;
  padding: 0.5rem 0;
}

.error-icon-wrapper {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

.error-icon {
  width: 2rem;
  height: 2rem;
  color: #ef4444;
}

.error-text {
  font-size: 0.875rem;
  color: var(--main-text-secondary);
  margin-bottom: 0.75rem;
}

.dark .error-text {
  color: var(--dark-text-secondary);
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.location-info {
  position: relative;
  z-index: 1;
}

.location-city {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--main-text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.dark .location-city {
  color: var(--dark-text-primary);
}

.location-district {
  font-size: 1rem;
  font-weight: 500;
  color: var(--main-text-secondary);
  padding: 0.125rem 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 0.25rem;
}

.dark .location-district {
  color: var(--dark-text-secondary);
  background: rgba(59, 130, 246, 0.2);
}

.location-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.location-province {
  font-size: 0.75rem;
  color: var(--main-text-muted);
  display: flex;
  align-items: center;
}

.dark .location-province {
  color: var(--dark-text-muted);
}

.location-meta {
  font-size: 0.75rem;
  color: var(--main-text-muted);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.dark .location-meta {
  color: var(--dark-text-muted);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.meta-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 1rem 0;
  color: var(--main-text-muted);
}

.dark .empty-state {
  color: var(--dark-text-muted);
}

.empty-icon-wrapper {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.75rem;
}

.dark .empty-icon-wrapper {
  background: rgba(30, 41, 59, 0.18);
}

.empty-icon {
  width: 2rem;
  height: 2rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.875rem;
}

/* 装饰背景 */
.decorative-bg {
  position: absolute;
  right: -1rem;
  bottom: -1rem;
  opacity: 0.05;
  pointer-events: none;
  transition: transform 0.5s ease;
}

:deep(.base-card):hover .decorative-bg {
  transform: scale(1.1);
}

.dark .decorative-bg {
  opacity: 0.1;
}

.decorative-icon {
  width: 8rem;
  height: 8rem;
}

/* 天气卡片 */
.weather-content {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0.5rem;
  position: relative;
  z-index: 1;
}

.weather-loading {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.loading-left {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-temp {
  height: 4rem;
  width: 8rem;
}

.skeleton-weather {
  height: 1.5rem;
  width: 6rem;
}

.skeleton-icon {
  width: 6rem;
  height: 6rem;
}

.weather-error {
  width: 100%;
  text-align: center;
  padding: 1rem 0;
}

.error-message {
  color: #ef4444;
  margin-bottom: 0.75rem;
}

.weather-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

@media (min-width: 640px) {
  .weather-info {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.weather-main {
  text-align: center;
}

@media (min-width: 640px) {
  .weather-main {
    text-align: left;
  }
}

.weather-temp-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .weather-temp-wrapper {
    justify-content: flex-start;
  }
}

.weather-temp {
  font-size: 3rem;
  font-weight: 800;
  color: var(--main-text-primary);
  line-height: 1;
}

.dark .weather-temp {
  color: var(--dark-text-primary);
}

.weather-desc-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.weather-desc {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--main-text-secondary);
}

.dark .weather-desc {
  color: var(--dark-text-secondary);
}

.weather-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: #f59e0b;
}

.weather-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.dark .weather-details {
  background: rgba(30, 41, 59, 0.2);
  border-color: rgba(255, 255, 255, 0.15);
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.detail-border {
  border-left: 1px solid var(--main-border-primary);
  padding-left: 1rem;
}

.dark .detail-border {
  border-left-color: var(--dark-border-primary);
}

.detail-icon {
  width: 1rem;
  height: 1rem;
}

.icon-humidity {
  color: #3b82f6;
}

.icon-wind {
  color: #14b8a6;
}

.icon-power {
  color: #f59e0b;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--main-text-muted);
}

.dark .detail-label {
  color: var(--dark-text-muted);
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--main-text-primary);
}

.dark .detail-value {
  color: var(--dark-text-primary);
}

.weather-empty {
  width: 100%;
  text-align: center;
  color: var(--main-text-muted);
}

.dark .weather-empty {
  color: var(--dark-text-muted);
}

.weather-decorative-bg {
  position: absolute;
  right: -2rem;
  top: -2rem;
  opacity: 0.05;
  pointer-events: none;
}

.dark .weather-decorative-bg {
  opacity: 0.1;
}

.weather-decorative-icon {
  width: 12rem;
  height: 12rem;
}

/* 日程卡片 */
.events-content {
  flex: 1;
}

.events-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--main-text-muted);
  padding: 1.5rem 0;
}

.dark .events-empty {
  color: var(--dark-text-muted);
}

.events-empty-icon-wrapper {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.dark .events-empty-icon-wrapper {
  background: rgba(30, 41, 59, 0.18);
}

.events-empty-icon {
  width: 2rem;
  height: 2rem;
  opacity: 0.3;
}

.events-empty-text {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.add-btn {
  color: #3b82f6;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.event-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .event-item {
  background: rgba(30, 41, 59, 0.18);
  border-color: rgba(255, 255, 255, 0.1);
}

.event-item:hover {
  background: rgba(255, 255, 255, 0.28);
  transform: translateX(4px);
}

.dark .event-item:hover {
  background: rgba(30, 41, 59, 0.28);
}

.event-indicator {
  width: 0.25rem;
  height: 2.5rem;
  border-radius: 9999px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  flex-shrink: 0;
}

.event-details {
  flex: 1;
  min-width: 0;
}

.event-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--main-text-primary);
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .event-title {
  color: var(--dark-text-primary);
}

.event-time {
  font-size: 0.75rem;
  color: var(--main-text-muted);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.dark .event-time {
  color: var(--dark-text-muted);
}

.event-time-icon {
  width: 0.75rem;
  height: 0.75rem;
}

/* 预报卡片 */
.forecast-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.forecast-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  transition: all 0.3s ease;
}

.dark .forecast-item {
  background: rgba(30, 41, 59, 0.15);
  border-color: rgba(255, 255, 255, 0.1);
}

.forecast-item:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.dark .forecast-item:hover {
  background: rgba(30, 41, 59, 0.25);
}

.forecast-date {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--main-text-muted);
  margin-bottom: 0.5rem;
}

.dark .forecast-date {
  color: var(--dark-text-muted);
}

.forecast-weather-icon {
  width: 2rem;
  height: 2rem;
  margin-bottom: 0.5rem;
  color: #f59e0b;
  transition: transform 0.3s ease;
}

.forecast-item:hover .forecast-weather-icon {
  transform: scale(1.1);
}

.forecast-weather {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--main-text-primary);
  margin-bottom: 0.25rem;
}

.dark .forecast-weather {
  color: var(--dark-text-primary);
}

.forecast-temp {
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.temp-high {
  color: #3b82f6;
  font-weight: 600;
}

.temp-divider {
  color: var(--main-text-muted);
}

.dark .temp-divider {
  color: var(--dark-text-muted);
}

.temp-low {
  color: var(--main-text-muted);
}

.dark .temp-low {
  color: var(--dark-text-muted);
}

/* 待办事项卡片 */
.todos-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.todos-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--main-text-muted);
  padding: 1.5rem 0;
}

.dark .todos-empty {
  color: var(--dark-text-muted);
}

.todos-empty-icon-wrapper {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.dark .todos-empty-icon-wrapper {
  background: rgba(30, 41, 59, 0.18);
}

.todos-empty-icon {
  width: 2rem;
  height: 2rem;
  color: #22c55e;
  opacity: 0.6;
}

.todos-empty-text {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.add-btn {
  color: #3b82f6;
}

.todos-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(59, 130, 246, 0.15);
  transition: all 0.2s ease;
  cursor: pointer;
}

.dark .todo-item {
  background: rgba(30, 41, 59, 0.18);
  border-color: rgba(59, 130, 246, 0.2);
}

.todo-item:hover {
  background: rgba(255, 255, 255, 0.28);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateX(4px);
}

.dark .todo-item:hover {
  background: rgba(30, 41, 59, 0.28);
}

.todo-completed {
  opacity: 0.6;
}

.todo-completed .todo-title {
  text-decoration: line-through;
}

.todo-checkbox {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  border: 2px solid #3b82f6;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.todo-checkbox:hover {
  background: rgba(59, 130, 246, 0.1);
}

.check-icon,
.circle-icon {
  width: 1rem;
  height: 1rem;
  color: #3b82f6;
}

.todo-details {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--main-text-primary);
  margin: 0 0 0.25rem 0;
}

.dark .todo-title {
  color: var(--dark-text-primary);
}

.todo-time {
  font-size: 0.75rem;
  color: var(--main-text-muted);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.dark .todo-time {
  color: var(--dark-text-muted);
}

.todo-time-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.todo-priority {
  flex-shrink: 0;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.priority-high {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.priority-medium {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.priority-low {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.more-todos {
  text-align: center;
  padding: 0.75rem;
  color: #3b82f6;
  font-size: 0.875rem;
  cursor: pointer;
  border-radius: 0.75rem;
  transition: background 0.2s ease;
}

.more-todos:hover {
  background: rgba(59, 130, 246, 0.1);
}

/* 动画 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .dashboard-header,
  .event-item,
  .forecast-item,
  .recommendation-item {
    animation: none !important;
    transition: none !important;
  }
  
  .event-item:hover,
  .forecast-item:hover {
    transform: none !important;
  }
}

/* 响应式调整 */
@media (max-width: 767px) {
  .dashboard-container {
    padding: 1rem;
  }
  
  .header-title {
    font-size: 1.25rem;
  }
  
  .weather-temp {
    font-size: 2.5rem;
  }
  
  .weather-details {
    padding: 0.75rem;
  }
  
  .forecast-content {
    gap: 0.5rem;
  }
  
  .forecast-item {
    padding: 0.75rem;
  }
}
</style>
