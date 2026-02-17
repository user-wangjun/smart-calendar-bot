<template>
  <div class="date-picker" v-if="isOpen">
    <div class="date-picker-overlay" @click="close"></div>
    <div class="date-picker-modal" @click.stop>
      <div class="date-picker-header">
        <h3 class="date-picker-title">选择日期</h3>
        <button class="date-picker-close" @click="close">✕</button>
      </div>

      <!-- 日历视图 -->
      <div class="date-picker-calendar">
        <!-- 月份导航 -->
        <div class="calendar-nav">
          <button class="calendar-nav-btn" @click="prevMonth">‹</button>
          <h4 class="calendar-nav-title">{{ currentYear }}年{{ currentMonth }}月</h4>
          <button class="calendar-nav-btn" @click="nextMonth">›</button>
        </div>

        <!-- 星期标题 -->
        <div class="calendar-weekdays">
          <div class="calendar-weekday" v-for="weekday in weekdays" :key="weekday">
            {{ weekday }}
          </div>
        </div>

        <!-- 日期格子 -->
        <div class="calendar-dates">
          <div 
            v-for="date in calendarDates" 
            :key="date.key"
            class="calendar-date"
            :class="{ 
              'today': date.isToday,
              'selected': date.isSelected,
              'other-month': date.isOtherMonth,
              'disabled': date.isDisabled
            }"
            @click="selectDate(date)"
          >
            <span class="date-number">{{ date.day }}</span>
            <span class="date-festival" v-if="date.festival">{{ date.festival }}</span>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="date-picker-footer">
        <button class="date-picker-btn secondary" @click="goToToday">
          今天
        </button>
        <button class="date-picker-btn primary" @click="confirm">
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  minDate: {
    type: Date,
    default: null
  },
  maxDate: {
    type: Date,
    default: null
  }
});

// Emits
const emit = defineEmits(['close', 'select']);

// 响应式数据
const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);
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
      isDisabled: true,
      festival: ''
    });
  }
  
  // 获取当月的所有日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const currentDate = new Date(currentYear.value, currentMonth.value - 1, i);
    const isToday = today.getFullYear() === currentYear.value && 
                    today.getMonth() + 1 === currentMonth.value && 
                    today.getDate() === i;
    const isSelected = selectedDateObj.value && 
                      selectedDateObj.value.getFullYear() === currentYear.value && 
                      selectedDateObj.value.getMonth() + 1 === currentMonth.value && 
                      selectedDateObj.value.getDate() === i;
    
    // 检查是否在允许的日期范围内
    let isDisabled = false;
    if (props.minDate && currentDate < props.minDate) {
      isDisabled = true;
    }
    if (props.maxDate && currentDate > props.maxDate) {
      isDisabled = true;
    }
    
    dates.push({
      key: `current-${i}`,
      day: i,
      isToday,
      isSelected,
      isOtherMonth: false,
      isDisabled,
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
      isDisabled: true,
      festival: ''
    });
  }
  
  return dates;
});

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
  if (date.isOtherMonth || date.isDisabled) return;
  
  selectedDateObj.value = new Date(currentYear.value, currentMonth.value - 1, date.day);
};

// 跳转到今天
const goToToday = () => {
  const today = new Date();
  currentYear.value = today.getFullYear();
  currentMonth.value = today.getMonth() + 1;
  selectedDateObj.value = today;
};

// 确认选择
const confirm = () => {
  if (selectedDateObj.value) {
    emit('select', selectedDateObj.value);
  }
  close();
};

// 关闭选择器
const close = () => {
  emit('close');
};

// 监听isOpen变化
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    // 初始化为今天
    goToToday();
  }
});
</script>

<style scoped>
/* 日期选择器样式 */
.date-picker {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.date-picker-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.date-picker-modal {
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.date-picker-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.date-picker-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.date-picker-close:hover {
  background: #f3f4f6;
  color: #ffffff;
}

/* 日历视图 */
.date-picker-calendar {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 月份导航 */
.calendar-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-nav-title {
  font-size: 18px;
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

/* 星期标题 */
.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.calendar-weekday {
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  padding: 8px;
}

/* 日期格子 */
.calendar-dates {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
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

.calendar-date:hover:not(.disabled) {
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

.calendar-date.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.calendar-date.disabled:hover {
  transform: none;
  background: #f9fafb;
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

/* 底部操作 */
.date-picker-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.date-picker-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.date-picker-btn.secondary {
  background: #f3f4f6;
  color: #ffffff;
}

.date-picker-btn.secondary:hover {
  background: #e5e7eb;
}

.date-picker-btn.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #ffffff;
}

.date-picker-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.date-picker-btn:active {
  transform: translateY(0);
}

/* 响应式优化 */
@media (max-width: 480px) {
  .date-picker-modal {
    width: 95%;
  }
  
  .date-picker-calendar {
    padding: 16px;
  }
  
  .date-picker-footer {
    padding: 12px 16px;
  }
  
  .date-picker-btn {
    padding: 10px 20px;
    font-size: 14px;
  }
}
</style>
