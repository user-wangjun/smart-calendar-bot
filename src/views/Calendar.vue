<template>
  <div class="calendar-container">
    <!-- Header -->
    <header class="calendar-header">
      <div class="header-main">
        <div class="header-icon-wrapper">
          <CalendarDays class="header-icon" />
        </div>
        <div class="header-text">
          <h1 class="header-title">日历视图</h1>
          <p class="header-subtitle">管理您的日程安排和待办事项</p>
        </div>
      </div>
      <div class="header-actions">
        <BaseButton variant="outline" @click="jumpToToday" :icon="RotateCcw">
          回到今天
        </BaseButton>
        <BaseButton variant="primary" :icon="Plus" @click="openAddModal">
          新建日程
        </BaseButton>
      </div>
    </header>

    <!-- Calendar Controls -->
    <BaseCard class="controls-card">
      <div class="controls-content">
        <div class="month-navigator">
          <button
            @click="prevMonth"
            class="nav-button"
            aria-label="上个月"
          >
            <ChevronLeft class="nav-icon" />
          </button>
          <h2 class="current-month">
            {{ currentYear }}年 {{ currentMonth + 1 }}月
          </h2>
          <button
            @click="nextMonth"
            class="nav-button"
            aria-label="下个月"
          >
            <ChevronRight class="nav-icon" />
          </button>
        </div>

        <!-- View Filters -->
        <div class="view-filters">
          <div class="filter-group">
            <button
              v-for="view in viewOptions"
              :key="view.value"
              @click="currentView = view.value"
              class="filter-button"
              :class="{ active: currentView === view.value }"
            >
              <component :is="view.icon" class="filter-icon" />
              {{ view.label }}
            </button>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Calendar Grid -->
    <div class="calendar-grid-wrapper">
      <!-- Weekday Headers -->
      <div class="weekday-headers">
        <div
          v-for="day in weekDays"
          :key="day"
          class="weekday-header"
        >
          {{ day }}
        </div>
      </div>

      <!-- Days Grid -->
      <div class="days-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="day-cell"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'has-events': getEventsForDay(day.date).length > 0,
            'holiday-statutory': day.holidays && day.holidays.some(h => h.type === 'statutory'),
            'holiday-traditional': day.holidays && day.holidays.some(h => h.type === 'traditional')
          }"
          @click="handleDayClick(day)"
        >
          <!-- 节假日名称 -->
          <div v-if="day.holidays && day.holidays.length > 0" class="holiday-name">
            {{ day.holidays[0].name }}
          </div>
          
          <!-- Date Number -->
          <div class="day-header">
            <span class="day-number" :class="{ 'today-badge': day.isToday }">
              {{ day.date.getDate() }}
            </span>
            <button
              class="add-event-btn"
              @click.stop="openAddModal(day.date)"
              aria-label="添加事件"
            >
              <Plus class="add-icon" />
            </button>
          </div>
          
          <!-- 农历日期 -->
          <div v-if="day.lunar" class="lunar-date">
            {{ day.lunar.monthText }}{{ day.lunar.dayText }}
          </div>

          <!-- Events -->
          <div class="day-events">
            <div
              v-for="event in getEventsForDay(day.date).slice(0, 3)"
              :key="event.id"
              class="event-tag"
              :class="getEventColorClass(event.type)"
              @click.stop="openEditModal(event)"
            >
              <span class="event-time">{{ formatTime(event.startDate) }}</span>
              <span class="event-title">{{ event.title }}</span>
            </div>
            <div
              v-if="getEventsForDay(day.date).length > 3"
              class="more-events"
              @click.stop="handleDayClick(day)"
            >
              +{{ getEventsForDay(day.date).length - 3 }} 更多
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Event Type Legend -->
    <div class="legend-bar">
      <span class="legend-title">图例：</span>
      <div class="legend-items">
        <div class="legend-item">
          <div class="legend-dot type-event"></div>
          <span>日程</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot type-task"></div>
          <span>待办</span>
        </div>
        <div class="legend-item">
          <div class="legend-dot type-anniversary"></div>
          <span>纪念日</span>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <BaseModal
      v-model="showModal"
      :title="editingEvent ? '编辑日程' : '新建日程'"
      @close="closeModal"
    >
      <div class="event-modal-content">
        <div class="modal-body">
          <!-- 事件标题 -->
          <div class="event-field">
            <label class="event-label">
              标题 <span class="required">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              class="event-input"
              placeholder="例如：周五下午开会"
            />
          </div>

          <!-- 日期选择 -->
          <div class="event-field">
            <label class="event-label">
              日期 <span class="required">*</span>
            </label>
            <input
              v-model="form.date"
              type="date"
              class="event-input"
            />
          </div>

          <!-- 时间选择 -->
          <div class="event-field-row">
            <div class="event-field half">
              <label class="event-label">开始时间</label>
              <input
                v-model="form.startTime"
                type="time"
                class="event-input"
              />
            </div>
            <div class="event-field half">
              <label class="event-label">结束时间</label>
              <input
                v-model="form.endTime"
                type="time"
                class="event-input"
              />
            </div>
          </div>

          <!-- 类型和优先级 -->
          <div class="event-field-row">
            <div class="event-field half">
              <label class="event-label">类型</label>
              <select v-model="form.type" class="event-select">
                <option value="event">日程</option>
                <option value="task">待办</option>
                <option value="anniversary">纪念日</option>
              </select>
            </div>
            <div class="event-field half">
              <label class="event-label">优先级</label>
              <select v-model="form.priority" class="event-select">
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
          </div>

          <!-- 描述 -->
          <div class="event-field">
            <label class="event-label">备注</label>
            <textarea
              v-model="form.description"
              class="event-textarea"
              rows="3"
              placeholder="添加详细描述..."
            ></textarea>
          </div>

          <!-- 提醒设置 -->
          <div class="event-field reminder-section">
            <label class="event-label">提醒设置</label>
            <div class="reminder-config">
              <div class="reminder-toggle">
                <label class="toggle-wrapper">
                  <input
                    type="checkbox"
                    v-model="form.enableReminder"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label">{{ form.enableReminder ? '已启用' : '未启用' }}</span>
              </div>
              
              <div v-if="form.enableReminder" class="reminder-time-config">
                <label class="sub-label">提醒时间</label>
                <div class="time-selector">
                  <select v-model="form.reminderPreset" class="event-select reminder-select" @change="handlePresetChange">
                    <option value="0">准时提醒</option>
                    <option value="5">5分钟</option>
                    <option value="15">15分钟</option>
                    <option value="30">30分钟</option>
                    <option value="60">1小时</option>
                    <option value="120">2小时</option>
                    <option value="custom">自定义</option>
                  </select>
                  
                  <div v-if="form.reminderPreset === 'custom'" class="custom-time-input">
                    <input
                      type="number"
                      v-model.number="form.reminderMinutes"
                      min="1"
                      max="1440"
                      class="event-input custom-minutes"
                      placeholder="分钟数"
                    />
                    <span class="time-unit">分钟</span>
                  </div>
                </div>

                <label class="sub-label">提醒方式</label>
                <div class="reminder-type-selector">
                  <label class="reminder-type-option">
                    <input type="checkbox" v-model="form.enableNotification" class="type-checkbox" />
                    <span class="type-icon">🔔</span>
                    <span class="type-text">推送通知</span>
                  </label>
                  <label class="reminder-type-option">
                    <input type="checkbox" v-model="form.enableSound" class="type-checkbox" />
                    <span class="type-icon">🔊</span>
                    <span class="type-text">响铃提醒</span>
                  </label>
                </div>

                <div class="test-reminder-section">
                  <button type="button" class="test-reminder-btn" @click="testReminder">
                    🧪 测试提醒
                  </button>
                  <span class="test-hint">点击测试当前提醒设置</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            v-if="editingEvent"
            class="btn-delete"
            @click="deleteEvent"
          >
            删除
          </button>
          <div class="actions-spacer"></div>
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-save" @click="saveEvent">
            {{ editingEvent ? '保存' : '创建日程' }}
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useEventsStore } from '@/stores/events';
import { reminderScheduler } from '@/services/reminderScheduler';
import { notificationService } from '@/services/notificationService';
import BaseButton from '@/components/base/BaseButton.vue';
import BaseCard from '@/components/base/BaseCard.vue';
import BaseModal from '@/components/base/BaseModal.vue';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  LayoutGrid,
  Calendar as CalendarIcon
} from 'lucide-vue-next';
import lunarCalendar from '@/utils/lunarCalendar';

const eventsStore = useEventsStore();

const currentDate = ref(new Date());
const currentView = ref('month');
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const viewOptions = [
  { value: 'month', label: '月视图', icon: LayoutGrid },
  { value: 'week', label: '周视图', icon: CalendarIcon }
];

const showModal = ref(false);
const editingEvent = ref(null);
const form = ref({
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  type: 'event',
  priority: 'medium',
  description: '',
  enableReminder: false,
  reminderPreset: '15',
  reminderMinutes: 15,
  enableNotification: true,
  enableSound: true
});

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

const calendarDays = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days = [];

  // Padding for previous month
  const firstDayOfWeek = firstDay.getDay();
  for (let i = firstDayOfWeek; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    const calendarInfo = lunarCalendar.getCalendarInfo(d);
    days.push({ 
      date: d, 
      isCurrentMonth: false, 
      isToday: isSameDate(d, new Date()),
      lunar: calendarInfo.lunar,
      holidays: calendarInfo.holidays
    });
  }

  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    const calendarInfo = lunarCalendar.getCalendarInfo(d);
    days.push({ 
      date: d, 
      isCurrentMonth: true, 
      isToday: isSameDate(d, new Date()),
      lunar: calendarInfo.lunar,
      holidays: calendarInfo.holidays
    });
  }

  // Padding for next month to complete 6 weeks (42 cells)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const calendarInfo = lunarCalendar.getCalendarInfo(d);
    days.push({ 
      date: d, 
      isCurrentMonth: false, 
      isToday: isSameDate(d, new Date()),
      lunar: calendarInfo.lunar,
      holidays: calendarInfo.holidays
    });
  }

  return days;
});

const isSameDate = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

/**
 * 格式化日期为本地日期字符串（避免时区转换问题）
 * @param {Date} date - 日期对象
 * @returns {string} - 格式化的日期字符串 YYYY-MM-DD
 */
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEventsForDay = (date) => {
  const dateStr = formatDateLocal(date);
  return eventsStore.getEventsByDate(dateStr);
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const getEventColorClass = (type) => {
  switch (type) {
    case 'event':
      return 'type-event';
    case 'task':
      return 'type-task';
    case 'anniversary':
      return 'type-anniversary';
    default:
      return 'type-default';
  }
};

const prevMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
};

const jumpToToday = () => {
  currentDate.value = new Date();
};

const handleDayClick = (day) => {
  console.log('Selected day:', day);
};

const openAddModal = (date = null) => {
  editingEvent.value = null;
  const now = new Date();
  const targetDate = date instanceof Date ? date : now;

  // 设置默认日期和时间
  const defaultDate = formatDateLocal(targetDate);
  const defaultStartTime = String(now.getHours() + 1).padStart(2, '0') + ':00';
  const defaultEndTime = String(now.getHours() + 2).padStart(2, '0') + ':00';

  form.value = {
    title: '',
    date: defaultDate,
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    type: 'event',
    priority: 'medium',
    description: '',
    enableReminder: false,
    reminderPreset: '15',
    reminderMinutes: 15,
    enableNotification: true,
    enableSound: true
  };
  showModal.value = true;
};

const openEditModal = (event) => {
  editingEvent.value = event;
  
  // 将 event 的 startDate 和 endDate 拆分为 date、startTime、endTime
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : startDate;

  // 确定提醒时间的预设值
  let reminderPreset = '15';
  let reminderMinutes = event.reminderMinutes || 15;
  const presetValues = ['5', '15', '30', '60', '120'];
  
  if (presetValues.includes(String(reminderMinutes))) {
    reminderPreset = String(reminderMinutes);
  } else {
    reminderPreset = 'custom';
  }

  form.value = {
    title: event.title || '',
    date: formatDateLocal(startDate),
    startTime: startDate.toTimeString().slice(0, 5),
    endTime: endDate.toTimeString().slice(0, 5),
    type: event.type || 'event',
    priority: event.priority || 'medium',
    description: event.description || '',
    enableReminder: event.enableReminder || false,
    reminderPreset: reminderPreset,
    reminderMinutes: reminderMinutes,
    enableNotification: event.enableNotification !== false,
    enableSound: event.enableSound !== false
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingEvent.value = null;
};

/**
 * 处理预设时间选择变化
 * 当选择预设值时，同步更新reminderMinutes
 */
const handlePresetChange = () => {
  if (form.value.reminderPreset !== 'custom') {
    form.value.reminderMinutes = parseInt(form.value.reminderPreset);
  }
};

/**
 * 测试提醒功能
 * 立即发送一个测试通知和响铃
 */
const testReminder = async () => {
  const title = form.value.title || '测试提醒';
  const message = `这是一个测试提醒，将在事件开始前 ${form.value.reminderMinutes} 分钟提醒您`;

  try {
    const result = await notificationService.sendNotification(title, message, {
      enableNotification: form.value.enableNotification,
      enableSound: form.value.enableSound,
      soundType: form.value.priority === 'high' ? 'urgent' : form.value.priority === 'low' ? 'gentle' : 'default',
      tag: 'test-reminder'
    });

    console.log('测试提醒结果:', result);
  } catch (error) {
    console.error('测试提醒失败:', error);
  }
};

const saveEvent = () => {
  // 计算实际的提醒分钟数
  const actualReminderMinutes = form.value.reminderPreset === 'custom' 
    ? form.value.reminderMinutes 
    : parseInt(form.value.reminderPreset);

  const eventData = {
    title: form.value.title,
    startDate: `${form.value.date}T${form.value.startTime}:00`,
    endDate: `${form.value.date}T${form.value.endTime}:00`,
    type: form.value.type,
    priority: form.value.priority,
    description: form.value.description,
    enableReminder: form.value.enableReminder,
    reminderMinutes: actualReminderMinutes,
    enableNotification: form.value.enableNotification,
    enableSound: form.value.enableSound
  };

  if (editingEvent.value) {
    const updatedEvent = { ...editingEvent.value, ...eventData };
    eventsStore.updateEvent(editingEvent.value.id, eventData);
    // 更新提醒调度器
    reminderScheduler.removeReminder(editingEvent.value.id);
    if (eventData.enableReminder) {
      reminderScheduler.addReminder(updatedEvent, actualReminderMinutes);
    }
  } else {
    const newEvent = eventsStore.addEvent(eventData);
    // 添加新提醒到调度器
    if (eventData.enableReminder) {
      reminderScheduler.addReminder(newEvent, actualReminderMinutes);
    }
  }
  closeModal();
};

const deleteEvent = () => {
  if (confirm('确定删除此日程吗？')) {
    // 删除提醒调度器中的提醒
    reminderScheduler.removeReminder(editingEvent.value.id);
    eventsStore.deleteEvent(editingEvent.value.id);
    closeModal();
  }
};



onMounted(() => {
  eventsStore.loadFromLocalStorage();
  
  // 初始化通知服务
  notificationService.initialize();
  
  // 初始化提醒调度器
  reminderScheduler.initialize(notificationService);
  
  // 从现有事件加载提醒
  reminderScheduler.initializeFromEvents(eventsStore.events);
  
  // 启动定时检查器
  reminderScheduler.startChecking();
  
  console.log('📅 日历服务已初始化，提醒调度器已启动');
});
</script>

<style scoped>
/* 日历容器 */
.calendar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  animation: slideUp 0.4s ease-out;
}

/* 头部区域 */
.calendar-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .calendar-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.header-main {
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

/* 控制卡片 */
.controls-card {
  margin-bottom: 1.5rem;
  animation: slideUp 0.4s ease-out 0.1s both;
}

.controls-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .controls-content {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

/* 月份导航 */
.month-navigator {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: var(--main-bg-secondary);
  border: 1px solid var(--main-border-primary);
  color: var(--main-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .nav-button {
  background: var(--dark-bg-secondary);
  border-color: var(--dark-border-primary);
  color: var(--dark-text-secondary);
}

.nav-button:hover {
  background: var(--main-bg-tertiary);
  color: #3b82f6;
  border-color: #3b82f6;
}

.dark .nav-button:hover {
  background: var(--dark-bg-tertiary);
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.current-month {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--main-text-primary);
  margin: 0;
  min-width: 140px;
  text-align: center;
}

.dark .current-month {
  color: var(--dark-text-primary);
}

/* 视图过滤器 */
.view-filters {
  display: flex;
  align-items: center;
}

.filter-group {
  display: flex;
  background: var(--main-bg-secondary);
  padding: 0.25rem;
  border-radius: 0.75rem;
  border: 1px solid var(--main-border-primary);
}

.dark .filter-group {
  background: var(--dark-bg-secondary);
  border-color: var(--dark-border-primary);
}

.filter-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--main-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .filter-button {
  color: var(--dark-text-muted);
}

.filter-button:hover {
  color: var(--main-text-primary);
}

.dark .filter-button:hover {
  color: var(--dark-text-primary);
}

.filter-button.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .filter-button.active {
  background: var(--dark-bg-tertiary);
  color: #60a5fa;
}

.filter-icon {
  width: 1rem;
  height: 1rem;
}

/* 日历网格 - 优化版（更高透明度） */
.calendar-grid-wrapper {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -2px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.18);
  overflow: hidden;
  animation: slideUp 0.4s ease-out 0.2s both;
}

.dark .calendar-grid-wrapper {
  background: rgba(31, 41, 55, 0.2);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 星期头部 - 优化版（更高透明度） */
.weekday-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(243, 244, 246, 0.25);
}

.dark .weekday-headers {
  border-bottom-color: rgba(255, 255, 255, 0.06);
  background: rgba(30, 41, 59, 0.25);
}

.weekday-header {
  padding: 1rem 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--main-text-secondary);
  position: relative;
  z-index: 1;
}

.dark .weekday-header {
  color: var(--dark-text-secondary);
}

/* 日期网格 */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: 1px;
  background: var(--main-border-primary);
}

.dark .days-grid {
  background: var(--dark-border-primary);
}

.day-cell {
  background: rgba(255, 255, 255, 0.3);
  padding: 0.5rem;
  min-height: 120px;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.dark .day-cell {
  background: rgba(31, 41, 55, 0.3);
}

.day-cell:hover {
  background: rgba(243, 244, 246, 0.4);
  z-index: 1;
}

.dark .day-cell:hover {
  background: rgba(30, 41, 59, 0.4);
}

.day-cell.other-month {
  background: rgba(243, 244, 246, 0.2);
  opacity: 0.6;
}

.dark .day-cell.other-month {
  background: rgba(30, 41, 59, 0.2);
}

.day-cell.today {
  background: rgba(59, 130, 246, 0.1);
}

.dark .day-cell.today {
  background: rgba(59, 130, 246, 0.15);
}

.day-cell.holiday-statutory {
  background: rgba(59, 130, 246, 0.15);
}

.dark .day-cell.holiday-statutory {
  background: rgba(59, 130, 246, 0.2);
}

.day-cell.holiday-traditional {
  background: rgba(239, 68, 68, 0.15);
}

.dark .day-cell.holiday-traditional {
  background: rgba(239, 68, 68, 0.2);
}

.holiday-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: #ef4444;
  text-align: center;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .holiday-name {
  color: #f87171;
}

.day-cell.holiday-statutory .holiday-name {
  color: #3b82f6;
}

.dark .day-cell.holiday-statutory .holiday-name {
  color: #60a5fa;
}

.lunar-date {
  font-size: 0.7rem;
  color: var(--main-text-muted);
  margin-bottom: 0.25rem;
}

.dark .lunar-date {
  color: var(--dark-text-muted);
}

.day-cell.other-month .lunar-date {
  opacity: 0.5;
}

/* 日期头部 */
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.day-number {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--main-text-primary);
  transition: all 0.2s ease;
}

.dark .day-number {
  color: var(--dark-text-primary);
}

.day-cell.other-month .day-number {
  color: var(--main-text-muted);
}

.dark .day-cell.other-month .day-number {
  color: var(--dark-text-muted);
}

.day-number.today-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
}

.add-event-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  background: transparent;
  border: none;
  color: var(--main-text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}

.day-cell:hover .add-event-btn {
  opacity: 1;
}

.add-event-btn:hover {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.add-icon {
  width: 1rem;
  height: 1rem;
}

/* 事件列表 */
.day-events {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.event-tag {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  white-space: nowrap;
  overflow: hidden;
}

.event-tag:hover {
  transform: translateX(2px);
}

.event-time {
  font-weight: 600;
  flex-shrink: 0;
}

.event-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.type-event {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border-left-color: #3b82f6;
}

.dark .type-event {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.type-task {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border-left-color: #10b981;
}

.dark .type-task {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.type-anniversary {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border-left-color: #ef4444;
}

.dark .type-anniversary {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.type-default {
  background: var(--main-bg-tertiary);
  color: var(--main-text-secondary);
  border-left-color: var(--main-text-muted);
}

.dark .type-default {
  background: var(--dark-bg-tertiary);
  color: var(--dark-text-secondary);
  border-left-color: var(--dark-text-muted);
}

.more-events {
  font-size: 0.75rem;
  color: var(--main-text-muted);
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: color 0.2s ease;
}

.dark .more-events {
  color: var(--dark-text-muted);
}

.more-events:hover {
  color: #3b82f6;
}

/* 图例 - 优化版（更高透明度） */
.legend-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  animation: slideUp 0.4s ease-out 0.3s both;
}

.dark .legend-bar {
  background: rgba(31, 41, 55, 0.25);
  border-color: rgba(255, 255, 255, 0.08);
}

.legend-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--main-text-secondary);
}

.dark .legend-title {
  color: var(--dark-text-secondary);
}

.legend-items {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--main-text-secondary);
}

.dark .legend-item {
  color: var(--dark-text-secondary);
}

.legend-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.legend-dot.type-event {
  background: #3b82f6;
}

.legend-dot.type-task {
  background: #10b981;
}

.legend-dot.type-anniversary {
  background: #ef4444;
}

/* 事件弹窗样式 */
.event-modal-content {
  width: 100%;
}

.event-field {
  margin-bottom: 16px;
}

.event-field.half {
  flex: 1;
  margin-bottom: 0;
}

.event-field-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.event-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.event-label .required {
  color: #ef4444;
  margin-left: 2px;
}

.event-input,
.event-select,
.event-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--main-border-primary);
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #333;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.dark .event-input,
.dark .event-select,
.dark .event-textarea {
  background: var(--dark-bg-secondary);
  border-color: var(--dark-border-primary);
  color: white;
}

.event-input:focus,
.event-select:focus,
.event-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.event-textarea {
  resize: vertical;
  min-height: 80px;
}

/* 提醒设置样式 */
.reminder-section {
  background: var(--main-bg-secondary);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.dark .reminder-section {
  background: var(--dark-bg-secondary);
}

.reminder-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-wrapper {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  cursor: pointer;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 26px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(22px);
}

.toggle-label {
  font-size: 14px;
  color: var(--main-text-secondary);
  font-weight: 500;
}

.dark .toggle-label {
  color: var(--dark-text-secondary);
}

.reminder-time-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--main-border-primary);
}

.dark .reminder-time-config {
  border-top-color: var(--dark-border-primary);
}

.sub-label {
  font-size: 13px;
  color: var(--main-text-muted);
}

.dark .sub-label {
  color: var(--dark-text-muted);
}

.time-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reminder-select {
  width: 100%;
}

.custom-time-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-minutes {
  width: 100px;
  flex-shrink: 0;
}

.time-unit {
  font-size: 14px;
  color: var(--main-text-secondary);
  white-space: nowrap;
}

.dark .time-unit {
  color: var(--dark-text-secondary);
}

/* 提醒方式选择器样式 */
.reminder-type-selector {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.reminder-type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--main-bg-primary);
  border: 1px solid var(--main-border-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
}

.dark .reminder-type-option {
  background: var(--dark-bg-primary);
  border-color: var(--dark-border-primary);
}

.reminder-type-option:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.type-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.type-icon {
  font-size: 16px;
}

.type-text {
  font-size: 13px;
  color: var(--main-text-secondary);
  font-weight: 500;
}

.dark .type-text {
  color: var(--dark-text-secondary);
}

/* 测试提醒按钮样式 */
.test-reminder-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--main-border-primary);
}

.dark .test-reminder-section {
  border-top-color: var(--dark-border-primary);
}

.test-reminder-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.test-reminder-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.test-reminder-btn:active {
  transform: translateY(0);
}

.test-hint {
  font-size: 12px;
  color: var(--main-text-muted);
}

.dark .test-hint {
  color: var(--dark-text-muted);
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--main-border-primary);
  margin-top: 8px;
}

.dark .modal-footer {
  border-top-color: var(--dark-border-primary);
}

.btn-cancel,
.btn-save,
.btn-delete {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.dark .btn-cancel {
  background: var(--dark-bg-secondary);
  color: var(--dark-text-primary);
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.dark .btn-cancel:hover {
  background: var(--dark-bg-tertiary);
}

.btn-save {
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-delete {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-delete:hover {
  background: #fee2e2;
}

.actions-spacer {
  flex: 1;
}

/* 响应式调整 */

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

/* 响应式调整 */
@media (max-width: 767px) {
  .calendar-container {
    padding: 1rem;
  }

  .days-grid {
    grid-auto-rows: minmax(80px, auto);
  }

  .day-cell {
    min-height: 80px;
    padding: 0.25rem;
  }

  .day-number {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
  }

  .event-tag {
    padding: 0.125rem 0.25rem;
    font-size: 0.625rem;
  }

  .weekday-header {
    padding: 0.75rem 0.25rem;
    font-size: 0.75rem;
  }

  .holiday-name {
    font-size: 0.6rem;
  }
  
  .lunar-date {
    font-size: 0.6rem;
  }

  .event-field-row {
    flex-direction: column;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .calendar-container,
  .controls-card,
  .calendar-grid-wrapper,
  .legend-bar {
    animation: none;
    opacity: 1;
  }
}
</style>
