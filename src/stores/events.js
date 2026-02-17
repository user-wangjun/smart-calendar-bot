import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { reminderScheduler } from '@/services/reminderScheduler';

/**
 * 事件状态管理
 * 管理日历事件的增删改查操作
 */
export const useEventsStore = defineStore('events', () => {
  // 状态
  const events = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // 计算属性
  const eventsByDate = computed(() => {
    const grouped = {};
    events.value.forEach(event => {
      const dateKey = event.startDate.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  });

  const upcomingEvents = computed(() => {
    const today = new Date();
    return events.value
      .filter(event => new Date(event.startDate) >= today)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5);
  });

  const todoTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events.value
      .filter(event => event.type === 'task' && !event.completed)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  });

  const todayTodoTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return events.value
      .filter(event => {
        const eventDate = new Date(event.startDate);
        return event.type === 'task' &&
               !event.completed &&
               eventDate >= today &&
               eventDate < tomorrow;
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  });

  /**
   * 添加事件
   * @param {Object} eventData - 事件数据
   * @returns {Object} 新创建的事件对象
   */
  const addEvent = (eventData) => {
    const newEvent = {
      id: Date.now(),
      ...eventData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    events.value.push(newEvent);
    saveToLocalStorage();
    if (newEvent.enableReminder) {
      reminderScheduler.addReminder(newEvent, newEvent.reminderMinutes || 15);
    }
    return newEvent;
  };

  /**
   * 更新事件
   * @param {number} eventId - 事件ID
   * @param {Object} eventData - 更新的事件数据
   */
  const updateEvent = (eventId, eventData) => {
    const index = events.value.findIndex(event => event.id === eventId);
    if (index !== -1) {
      events.value[index] = {
        ...events.value[index],
        ...eventData,
        updatedAt: new Date().toISOString()
      };
      saveToLocalStorage();
      reminderScheduler.updateReminder(events.value[index], eventData.reminderMinutes || 15);
    }
  };

  /**
   * 删除事件
   * @param {number} eventId - 事件ID
   */
  const deleteEvent = (eventId) => {
    reminderScheduler.removeReminder(eventId);
    events.value = events.value.filter(event => event.id !== eventId);
    saveToLocalStorage();
  };

  /**
   * 获取指定日期的事件
   * @param {string} date - 日期字符串
   * @returns {Array} 事件列表
   */
  const getEventsByDate = (date) => {
    return eventsByDate.value[date] || [];
  };

  /**
   * 从本地存储加载数据
   */
  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('calendar_events');
      if (saved) {
        events.value = JSON.parse(saved);
      }
      reminderScheduler.initializeFromEvents(events.value);
    } catch (err) {
      error.value = '加载事件数据失败';
      console.error('加载事件数据失败:', err);
    }
  };

  /**
   * 保存数据到本地存储
   */
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('calendar_events', JSON.stringify(events.value));
    } catch (err) {
      error.value = '保存事件数据失败';
      console.error('保存事件数据失败:', err);
    }
  };

  /**
   * 切换待办事项完成状态
   * @param {number} eventId - 事件ID
   */
  const toggleTaskComplete = (eventId) => {
    const index = events.value.findIndex(event => event.id === eventId);
    if (index !== -1) {
      events.value[index] = {
        ...events.value[index],
        completed: !events.value[index].completed,
        updatedAt: new Date().toISOString()
      };
      saveToLocalStorage();
    }
  };

  /**
   * 清空所有事件
   */
  const clearAllEvents = () => {
    events.value = [];
    saveToLocalStorage();
  };

  // 初始化时加载数据
  loadFromLocalStorage();

  return {
    events,
    loading,
    error,
    eventsByDate,
    upcomingEvents,
    todoTasks,
    todayTodoTasks,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleTaskComplete,
    getEventsByDate,
    loadFromLocalStorage,
    saveToLocalStorage,
    clearAllEvents
  };
});
