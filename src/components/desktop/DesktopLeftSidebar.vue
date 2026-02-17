<template>
  <div class="desktop-left-sidebar-content">
    <!-- 顶部：当前日期与时间显示 -->
    <section class="date-time-section">
      <div class="date-display">
        <div class="year-month">{{ year }}年{{ month }}月</div>
        <div class="day-weekday">
          <span class="day">{{ day }}日</span>
          <span class="weekday">{{ weekday }}</span>
        </div>
      </div>
      <div class="festival-info" v-if="festival">
        <span class="festival-icon">🎉</span>
        <span class="festival-text">{{ festival }}</span>
      </div>
      <div class="realtime-display">
        <span class="time">{{ time }}</span>
      </div>
    </section>

    <!-- 日历视图 -->
    <section class="calendar-section">
      <div class="calendar-header">
        <button class="calendar-nav-btn" @click="prevMonth">‹</button>
        <h3 class="calendar-title">{{ year }}年{{ month }}月</h3>
        <button class="calendar-nav-btn" @click="nextMonth">›</button>
      </div>
      <div class="calendar-grid">
        <!-- 星期标题 -->
        <div class="calendar-weekday" v-for="weekday in weekdays" :key="weekday">
          {{ weekday }}
        </div>
        <!-- 日期格子 -->
        <div 
          v-for="date in calendarDates" 
          :key="date.key"
          class="calendar-date"
          :class="{ 
            'today': date.isToday,
            'selected': date.isSelected,
            'other-month': date.isOtherMonth
          }"
          @click="selectDate(date)"
        >
          <span class="date-number">{{ date.day }}</span>
          <span class="date-festival" v-if="date.festival">{{ date.festival }}</span>
        </div>
      </div>
    </section>

    <!-- 日期选择器 -->
    <section class="date-picker-section">
      <h3 class="section-title">快速跳转</h3>
      <div class="date-picker-controls">
        <input 
          type="date" 
          class="date-picker-input"
          v-model="selectedDate"
          @change="handleDateChange"
        />
        <button class="date-picker-btn" @click="goToToday">
          今天
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 日期时间数据
const year = ref('');
const month = ref('');
const day = ref('');
const weekday = ref('');
const time = ref('');
const festival = ref('');

// 日历数据
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);
const selectedDate = ref('');
const selectedDateObj = ref(null);

// 星期标题
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

// 计算属性：日历日期
const calendarDates = computed(() => {
  const dates = [];
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1);
  const lastDay = new Date(currentYear.value, currentMonth.value, 0);
  const today = new Date();
  
  // 获取当月第一天是星期几
  const firstDayOfWeek = firstDay.getDay();
  
  // 获取上个月的最后几天
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value - 1, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    dates.push({
      key: `prev-${i}`,
      day: prevMonthLastDay - i,
      isToday: false,
      isSelected: false,
      isOtherMonth: true,
      festival: ''
    });
  }
  
  // 获取当月的所有日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const isToday = today.getFullYear() === currentYear.value && 
                    today.getMonth() + 1 === currentMonth.value && 
                    today.getDate() === i;
    const isSelected = selectedDateObj.value && 
                      selectedDateObj.value.getFullYear() === currentYear.value && 
                      selectedDateObj.value.getMonth() + 1 === currentMonth.value && 
                      selectedDateObj.value.getDate() === i;
    
    dates.push({
      key: `current-${i}`,
      day: i,
      isToday,
      isSelected,
      isOtherMonth: false,
      festival: getFestival(currentYear.value, currentMonth.value, i)
    });
  }
  
  // 获取下个月的前几天
  const totalCells = dates.length;
  const remainingCells = 42 - totalCells; // 6行 × 7列 = 42
  for (let i = 1; i <= remainingCells; i++) {
    dates.push({
      key: `next-${i}`,
      day: i,
      isToday: false,
      isSelected: false,
      isOtherMonth: true,
      festival: ''
    });
  }
  
  return dates;
});

// 更新当前时间
const updateTime = () => {
  const now = new Date();
  year.value = now.getFullYear();
  month.value = now.getMonth() + 1;
  day.value = now.getDate();
  
  const weekdaysFull = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  weekday.value = weekdaysFull[now.getDay()];
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  time.value = `${hours}:${minutes}:${seconds}`;
  
  // 检查节日
  checkFestival(now);
};

// 检查节日
const checkFestival = (date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 简单的节日列表
  const festivals = {
    '1-1': '元旦节',
    '1-15': '小年',
    '2-10': '春节',
    '3-8': '妇女节',
    '5-1': '劳动节',
    '6-1': '儿童节',
    '10-1': '国庆节',
    '12-25': '圣诞节'
  };
  
  const key = `${month}-${day}`;
  if (festivals[key]) {
    festival.value = festivals[key];
  } else {
    festival.value = '';
  }
};

// 获取节日
const getFestival = (year, month, day) => {
  const festivals = {
    '1-1': '元旦',
    '1-15': '小年',
    '2-10': '春节',
    '3-8': '妇女节',
    '5-1': '劳动节',
    '6-1': '儿童节',
    '10-1': '国庆',
    '12-25': '圣诞'
  };
  
  const key = `${month}-${day}`;
  return festivals[key] || '';
};

// 上个月
const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

// 下个月
const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

// 选择日期
const selectDate = (date) => {
  if (date.isOtherMonth) return;
  
  selectedDateObj.value = new Date(currentYear.value, currentMonth.value - 1, date.day);
  const monthStr = String(currentMonth.value).padStart(2, '0');
  const dayStr = String(date.day).padStart(2, '0');
  selectedDate.value = `${currentYear.value}-${monthStr}-${dayStr}`;
};

// 处理日期变化
const handleDateChange = (event) => {
  const date = new Date(event.target.value);
  currentYear.value = date.getFullYear();
  currentMonth.value = date.getMonth() + 1;
  selectedDateObj.value = date;
};

// 跳转到今天
const goToToday = () => {
  const today = new Date();
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth() + 1;
  selectedDateObj.value = today;
  
  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
  const dayStr = String(today.getDate()).padStart(2, '0');
  selectedDate.value = `${today.getFullYear()}-${monthStr}-${dayStr}`;
};

// 定时器
let timeInterval = null;

// 组件挂载
onMounted(() => {
  // 更新时间
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
  
  // 初始化选中日期为今天
  goToToday();
});

// 组件卸载
onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
/* PC端左侧栏样式 */
.desktop-left-sidebar-content {
  padding: var(--spacing-lg);
}

/* 日期时间部分 */
.date-time-section {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  box-shadow: var(--shadow-md);
}

.date-display {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.year-month {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--text-inverse);
  letter-spacing: 2px;
}

.day-weekday {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.day {
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  color: var(--text-inverse);
}

.weekday {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  color: rgba(255, 255, 255, 0.9);
}

.festival-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.festival-icon {
  font-size: var(--text-xl);
}

.festival-text {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  color: var(--text-inverse);
}

.realtime-display {
  margin-top: var(--spacing-sm);
}

.time {
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
  color: var(--text-inverse);
  font-family: var(--font-mono);
}

/* 日历部分 */
.calendar-section {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  border: var(--border-sm);
  box-shadow: var(--shadow-sm);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.calendar-nav-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-base);
}

.calendar-nav-btn:hover {
  background: var(--primary-color);
  color: var(--text-inverse);
  transform: scale(1.1);
}

.calendar-nav-btn:active {
  transform: scale(0.95);
}

.calendar-title {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-xs);
}

.calendar-weekday {
  text-align: center;
  padding: var(--spacing-sm);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.calendar-date {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  background: var(--bg-primary);
  border: var(--border-sm);
}

.calendar-date:hover {
  background: var(--bg-secondary);
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.calendar-date.today {
  background: var(--primary-color);
  color: var(--text-inverse);
  border-color: var(--primary-color);
  font-weight: var(--font-bold);
}

.calendar-date.selected {
  background: var(--primary-color);
  color: var(--text-inverse);
  border-color: var(--primary-color);
  font-weight: var(--font-bold);
  box-shadow: var(--shadow-md);
}

.calendar-date.other-month {
  opacity: 0.3;
  cursor: not-allowed;
}

.date-number {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
}

.date-festival {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: var(--text-xs);
  color: var(--error-color);
  font-weight: var(--font-bold);
}

/* 日期选择器部分 */
.date-picker-section {
  margin-top: var(--spacing-lg);
}

.section-title {
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.date-picker-controls {
  display: flex;
  gap: var(--spacing-sm);
}

.date-picker-input {
  flex: 1;
  padding: var(--spacing-sm);
  border: var(--border-sm);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition-base);
}

.date-picker-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-picker-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: var(--border-sm);
  border-radius: var(--radius-md);
  background: var(--primary-color);
  color: var(--text-inverse);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-base);
}

.date-picker-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.date-picker-btn:active {
  transform: translateY(0);
}

/* 响应式适配 */
@media (max-width: var(--breakpoint-lg)) {
  .desktop-left-sidebar-content {
    padding: var(--spacing-md);
  }
  
  .date-time-section {
    padding: var(--spacing-md);
  }
  
  .calendar-section {
    padding: var(--spacing-md);
  }
  
  .year-month {
    font-size: var(--text-xl);
  }
  
  .day {
    font-size: var(--text-lg);
  }
}
</style>

.time {
  font-size: 48px;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}

/* 日历部分 */
.calendar-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.calendar-nav-btn {
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.calendar-nav-btn:hover {
  background: #e5e7eb;
}

.calendar-nav-btn:active {
  transform: scale(0.95);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-weekday {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  padding: 8px;
}

.calendar-date {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px;
}

.calendar-date:hover {
  background: #e5e7eb;
  transform: scale(1.05);
}

.calendar-date.today {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
}

.calendar-date.today .date-number {
  color: #ffffff;
}

.calendar-date.selected {
  background: #10b981;
  color: #ffffff;
}

.calendar-date.selected .date-number {
  color: #ffffff;
}

.calendar-date.other-month {
  opacity: 0.5;
}

.date-number {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.date-festival {
  font-size: 10px;
  font-weight: 500;
  color: #6b7280;
}

.calendar-date.today .date-festival,
.calendar-date.selected .date-festival {
  color: rgba(255, 255, 255, 0.9);
}

/* 日期选择器部分 */
.date-picker-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px;
}

.date-picker-controls {
  display: flex;
  gap: 12px;
}

.date-picker-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  color: #111827;
  background: #f9fafb;
  transition: all 0.3s ease;
}

.date-picker-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.date-picker-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.date-picker-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.date-picker-btn:active {
  transform: translateY(0);
}

/* 响应式优化 */
@media (max-width: 1200px) {
  .date-time-section {
    padding: 20px;
  }
  
  .year-month {
    font-size: 28px;
  }
  
  .day {
    font-size: 24px;
  }
  
  .time {
    font-size: 40px;
  }
  
  .calendar-section,
  .date-picker-section {
    padding: 20px;
  }
}

@media (max-width: 1024px) {
  .desktop-left-sidebar-content {
    padding: 20px;
  }
  
  .date-time-section {
    padding: 16px;
  }
  
  .year-month {
    font-size: 24px;
  }
  
  .day {
    font-size: 20px;
  }
  
  .time {
    font-size: 32px;
  }
}
</style>
