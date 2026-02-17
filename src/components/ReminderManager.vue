<template>
  <div class="reminder-manager">
    <!-- 提醒列表标题 -->
    <div class="reminder-header">
      <h3 class="reminder-title">⏰ 提醒管理</h3>
      <div class="reminder-stats">
        <span class="stat-item">总计: {{ reminders.length }}</span>
        <span class="stat-item">即将到期: {{ upcomingReminders.length }}</span>
      </div>
    </div>

    <!-- 提醒列表 -->
    <div class="reminder-list" v-if="reminders.length > 0">
      <div
        v-for="reminder in reminders"
        :key="reminder.id"
        class="reminder-item"
        :class="{ 'expiring-soon': isExpiringSoon(reminder) }"
      >
        <div class="reminder-info">
          <div class="reminder-icon">{{ getReminderIcon(reminder.type) }}</div>
          <div class="reminder-details">
            <div class="reminder-title-text">{{ reminder.eventTitle }}</div>
            <div class="reminder-time">
              <span class="event-time">{{ formatEventTime(reminder.eventTime) }}</span>
              <span class="reminder-before">
                {{ reminder.minutesBefore === 0 ? '准时提醒' : `提前 ${reminder.minutesBefore} 分钟` }}
              </span>
            </div>
            <div class="reminder-status" :class="getStatusClass(reminder)">
              {{ getStatusText(reminder) }}
            </div>
          </div>
        </div>
        
        <div class="reminder-actions">
          <button
            class="btn-view"
            @click="viewEventDetails(reminder.eventId)"
            title="查看事件详情"
          >
            👁️
          </button>
          <button
            class="btn-delete"
            @click="confirmDeleteReminder(reminder)"
            title="删除提醒"
            :disabled="reminder.notified"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📅</div>
      <div class="empty-text">暂无提醒设置</div>
      <p class="empty-hint">在日历页面添加事件时会自动创建提醒</p>
    </div>

    <!-- 删除确认对话框 -->
    <div
      v-if="showDeleteConfirm"
      class="modal-overlay"
      @click.self="cancelDelete"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">⚠️ 确认删除</h3>
          <button class="modal-close" @click="cancelDelete">✕</button>
        </div>
        <div class="modal-body">
          <p class="confirm-message">
            确定要删除提醒 "{{ reminderToDelete?.eventTitle }}" 吗？
          </p>
          <p class="confirm-hint">
            此操作不会影响原始事件，只会删除提醒设置。
          </p>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="cancelDelete">
            取消
          </button>
          <button class="btn-confirm" @click="deleteReminder">
            确认删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEventsStore } from '@/stores/events';
import { reminderScheduler } from '@/services/reminderScheduler';

// 路由和状态管理
const router = useRouter();
const eventsStore = useEventsStore();

// 状态
const reminders = ref([]);
const showDeleteConfirm = ref(false);
const reminderToDelete = ref(null);
const refreshInterval = ref(null);

// 计算属性
const upcomingReminders = computed(() => {
  const now = new Date();
  return reminders.value.filter(reminder => 
    !reminder.notified && new Date(reminder.reminderTime) > now
  );
});

// 生命周期
onMounted(() => {
  loadReminders();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});

// 方法
/**
 * 加载提醒列表
 */
const loadReminders = () => {
  const status = reminderScheduler.getStatus();
  reminders.value = status.upcomingReminders.map(reminder => ({
    ...reminder,
    eventDetails: getEventDetails(reminder.eventId)
  }));
};

/**
 * 获取事件详情
 */
const getEventDetails = (eventId) => {
  return eventsStore.events.find(event => event.id === eventId) || null;
};

/**
 * 获取提醒图标
 */
const getReminderIcon = (type) => {
  const icons = {
    meeting: '👥',
    appointment: '📞',
    reminder: '⏰',
    task: '✅'
  };
  return icons[type] || '📅';
};

/**
 * 格式化事件时间
 */
const formatEventTime = (eventTime) => {
  const date = new Date(eventTime);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * 检查是否即将到期
 */
const isExpiringSoon = (reminder) => {
  const now = new Date();
  const reminderTime = new Date(reminder.reminderTime);
  const timeDiff = reminderTime.getTime() - now.getTime();
  return timeDiff <= 30 * 60 * 1000 && timeDiff > 0; // 30分钟内
};

/**
 * 获取状态类名
 */
const getStatusClass = (reminder) => {
  if (reminder.notified) return 'status-notified';
  if (isExpiringSoon(reminder)) return 'status-expiring';
  return 'status-pending';
};

/**
 * 获取状态文本
 */
const getStatusText = (reminder) => {
  if (reminder.notified) return '已通知';
  if (isExpiringSoon(reminder)) return '即将到期';
  return '等待中';
};

/**
 * 查看事件详情
 */
const viewEventDetails = (eventId) => {
  const event = getEventDetails(eventId);
  if (event) {
    // 导航到日历页面并选中对应日期
    const eventDate = new Date(event.startDate).toISOString().split('T')[0];
    router.push({
      path: '/calendar',
      query: { date: eventDate }
    });
  }
};

/**
 * 确认删除提醒
 */
const confirmDeleteReminder = (reminder) => {
  reminderToDelete.value = reminder;
  showDeleteConfirm.value = true;
};

/**
 * 取消删除
 */
const cancelDelete = () => {
  showDeleteConfirm.value = false;
  reminderToDelete.value = null;
};

/**
 * 删除提醒
 */
const deleteReminder = () => {
  if (reminderToDelete.value) {
    reminderScheduler.removeReminder(reminderToDelete.value.eventId);
    loadReminders(); // 重新加载列表
    
    // 显示成功提示
    showSuccessMessage('提醒已删除');
  }
  cancelDelete();
};

/**
 * 显示成功消息
 */
const showSuccessMessage = (message) => {
  // 创建临时成功提示
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">✅</span>
      <span class="toast-text">${message}</span>
    </div>
  `;
  
  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    .success-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
      animation: slideInRight 0.3s ease;
      max-width: 300px;
    }
    
    .toast-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .toast-icon {
      font-size: 16px;
    }
    
    .toast-text {
      font-size: 14px;
      line-height: 1.4;
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(toast);
  
  // 3秒后自动移除
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
    if (style.parentElement) {
      style.remove();
    }
  }, 3000);
};

/**
 * 开始自动刷新
 */
const startAutoRefresh = () => {
  refreshInterval.value = setInterval(() => {
    loadReminders();
  }, 30000); // 每30秒刷新一次
};

/**
 * 停止自动刷新
 */
const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
};
</script>

<style scoped>
.reminder-manager {
  padding: 20px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color);
}

.reminder-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.reminder-stats {
  display: flex;
  gap: 15px;
}

.stat-item {
  font-size: 14px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: 6px;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.reminder-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reminder-item.expiring-soon {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fef3c7, #fbbf24);
}

.reminder-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.reminder-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  border-radius: 50%;
  color: white;
}

.reminder-details {
  flex: 1;
}

.reminder-title-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.reminder-time {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 6px;
}

.event-time {
  font-size: 14px;
  color: var(--text-secondary);
}

.reminder-before {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
}

.reminder-status {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-pending {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-expiring {
  background: #fef3c7;
  color: #d97706;
}

.status-notified {
  background: #d1fae5;
  color: #065f46;
}

.reminder-actions {
  display: flex;
  gap: 8px;
}

.btn-view, .btn-delete {
  padding: 8px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
}

.btn-view:hover {
  background: var(--primary-light);
  transform: scale(1.1);
}

.btn-delete:hover {
  background: #fee2e2;
  color: #dc2626;
  transform: scale(1.1);
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.empty-hint {
  font-size: 14px;
  color: var(--text-tertiary);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideInUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.2s ease;
  padding: 4px;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.confirm-message {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 12px;
  font-weight: 500;
}

.confirm-hint {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-confirm {
  background: #ef4444;
  color: white;
}

.btn-confirm:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reminder-manager {
    padding: 15px;
  }
  
  .reminder-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .reminder-item {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .reminder-actions {
    align-self: flex-end;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>