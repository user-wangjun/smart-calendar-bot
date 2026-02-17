<template>
  <BaseCard class="today-calendar" glass :animate-in="true">
    <div class="calendar-content">
      <div class="date-main">
        <div class="date-left">
          <div class="day-number">{{ calendarInfo.solar.day }}</div>
          <div class="date-info">
            <div class="year-month">{{ calendarInfo.solar.year }}年{{ calendarInfo.solar.month }}月</div>
            <div class="weekday">{{ calendarInfo.solar.weekDayText }}</div>
          </div>
        </div>
        
        <div class="date-right">
          <div v-if="calendarInfo.holidays.length > 0" class="holiday-badge">
            <span v-for="(holiday, index) in calendarInfo.holidays" :key="index" class="holiday-tag">
              {{ holiday.name }}
            </span>
          </div>
          <div class="lunar-info">
            <div class="lunar-year">
              {{ calendarInfo.lunar.yearGanZhi }}年
              <span class="zodiac">{{ calendarInfo.lunar.yearAnimal }}</span>
            </div>
            <div class="lunar-date">{{ calendarInfo.lunar.monthText }}{{ calendarInfo.lunar.dayText }}</div>
          </div>
        </div>
      </div>

      <div class="location-section">
        <div class="location-header">
          <div class="location-icon-wrapper">
            <MapPin class="location-icon" />
          </div>
          <div class="location-text-wrapper">
            <div class="location-title">当前位置</div>
            <div v-if="currentLocation" class="location-city">
              {{ currentLocation.city || '未知城市' }}
              <span v-if="currentLocation.district" class="location-district">{{ currentLocation.district }}</span>
            </div>
            <div v-else class="location-empty">正在获取位置...</div>
          </div>
        </div>
        <div v-if="currentLocation" class="location-meta">
          <BaseBadge v-if="currentLocation.provider || currentLocation.source" :variant="getSourceBadgeVariant(currentLocation.source)">
            {{ getProviderDisplayName(currentLocation.provider || currentLocation.source) }}
          </BaseBadge>
          <span v-if="currentLocation.province && currentLocation.province !== currentLocation.city" class="location-province">
            {{ currentLocation.province }}
          </span>
        </div>
      </div>

      <div class="huangli-section">
        <div class="huangli-item">
          <div class="huangli-title suitable">宜</div>
          <div class="huangli-items">
            <span v-for="(item, index) in calendarInfo.huangli.suitable" :key="index" class="huangli-tag suitable-tag">
              {{ item }}
            </span>
          </div>
        </div>
        <div class="huangli-item">
          <div class="huangli-title avoid">忌</div>
          <div class="huangli-items">
            <span v-for="(item, index) in calendarInfo.huangli.avoid" :key="index" class="huangli-tag avoid-tag">
              {{ item }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWeatherStore } from '@/stores/weather.js';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseBadge from '@/components/base/BaseBadge.vue';
import { MapPin } from 'lucide-vue-next';
import lunarCalendar from '@/utils/lunarCalendar';

const weatherStore = useWeatherStore();

const currentDate = ref(new Date());
let timer = null;

const currentLocation = computed(() => weatherStore.currentLocation);

const calendarInfo = computed(() => {
  return lunarCalendar.getCalendarInfo(currentDate.value);
});

const updateDate = () => {
  currentDate.value = new Date();
};

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

const getSourceBadgeVariant = (source) => {
  const src = source || '';
  if (src === 'amap' || src.includes('amap')) return 'primary';
  if (src === 'tencent' || src.includes('tencent')) return 'info';
  if (src === 'browser') return 'success';
  if (src === 'ip') return 'warning';
  if (src.includes('cache')) return 'default';
  return 'default';
};

onMounted(() => {
  updateDate();
  const now = new Date();
  const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const msUntilMidnight = nextDay - now;
  
  timer = setTimeout(() => {
    updateDate();
    timer = setInterval(updateDate, 86400000);
  }, msUntilMidnight);
});

onUnmounted(() => {
  if (timer) {
    clearTimeout(timer);
    clearInterval(timer);
  }
});
</script>

<style scoped>
.today-calendar {
  width: 100%;
}

.calendar-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.location-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.location-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.location-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.location-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: #3b82f6;
}

.location-text-wrapper {
  flex: 1;
  min-width: 0;
}

.location-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.location-city {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.location-district {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 0.125rem 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 0.25rem;
}

.location-empty {
  font-size: 1rem;
  color: var(--text-muted);
}

.location-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.location-province {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
}

.date-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.date-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.day-number {
  font-size: 4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.year-month {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.weekday {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.date-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.holiday-badge {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.holiday-tag {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
  color: white;
}

.lunar-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.lunar-year {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.zodiac {
  font-size: 1rem;
  margin-left: 0.25rem;
}

.lunar-date {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.huangli-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.huangli-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.huangli-title {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.huangli-title.suitable {
  color: #10b981;
}

.huangli-title.avoid {
  color: #ef4444;
}

.huangli-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.huangli-tag {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.huangli-tag.suitable-tag {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.huangli-tag.suitable-tag:hover {
  background: rgba(16, 185, 129, 0.15);
  transform: translateY(-1px);
}

.huangli-tag.avoid-tag {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.huangli-tag.avoid-tag:hover {
  background: rgba(239, 68, 68, 0.15);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .date-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .date-right {
    align-items: flex-start;
  }

  .day-number {
    font-size: 3rem;
  }

  .location-section {
    padding: 0.75rem;
  }

  .location-city {
    font-size: 1.125rem;
  }

  .huangli-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .date-left {
    flex-direction: column;
    align-items: flex-start;
  }

  .day-number {
    font-size: 2.5rem;
  }

  .location-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .location-icon-wrapper {
    width: 2rem;
    height: 2rem;
  }

  .location-icon {
    width: 1rem;
    height: 1rem;
  }

  .location-city {
    font-size: 1rem;
  }

  .huangli-tag {
    font-size: 0.6875rem;
    padding: 0.25rem 0.5rem;
  }
}
</style>
