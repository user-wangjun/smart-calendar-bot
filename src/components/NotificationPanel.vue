<template>
  <Transition name="dropdown">
    <div v-if="isPanelOpen" class="notification-panel" ref="panelRef">
      <div class="panel-header">
        <h3 class="panel-title">通知</h3>
        <div class="panel-actions">
          <button v-if="unreadCount > 0" class="action-btn" @click="markAllAsRead">
            全部已读
          </button>
          <button v-if="notifications.length > 0" class="action-btn" @click="clearAll">
            清空
          </button>
        </div>
      </div>

      <div class="panel-content">
        <div v-if="notifications.length === 0" class="empty-state">
          <Bell class="empty-icon" />
          <p>暂无通知</p>
        </div>

        <div v-else class="notification-list">
          <div
            v-for="notification in sortedNotifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'is-unread': !notification.isRead }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon" :class="notification.type">
              <component :is="getNotificationIcon(notification.type)" class="w-4 h-4" />
            </div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
            </div>
            <button class="delete-btn" @click.stop="removeNotification(notification.id)">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useNotificationsStore } from '@/stores/notifications';
import { Bell, X, AlertCircle, Info, Clock, CheckCircle } from 'lucide-vue-next';

const notificationsStore = useNotificationsStore();

const panelRef = ref(null);

const notifications = computed(() => notificationsStore.notifications);
const isPanelOpen = computed(() => notificationsStore.isPanelOpen);
const unreadCount = computed(() => notificationsStore.unreadCount);
const sortedNotifications = computed(() => notificationsStore.sortedNotifications);

const getNotificationIcon = (type) => {
  const iconMap = {
    info: Info,
    warning: AlertCircle,
    reminder: Clock,
    success: CheckCircle
  };
  return iconMap[type] || Bell;
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
};

const handleNotificationClick = (notification) => {
  if (!notification.isRead) {
    notificationsStore.markAsRead(notification.id);
  }
};

const markAllAsRead = () => {
  notificationsStore.markAllAsRead();
};

const removeNotification = (notificationId) => {
  notificationsStore.removeNotification(notificationId);
};

const clearAll = () => {
  if (confirm('确定要清空所有通知吗？')) {
    notificationsStore.clearAllNotifications();
  }
};

const handleClickOutside = (event) => {
  if (panelRef.value && !panelRef.value.contains(event.target)) {
    notificationsStore.closePanel();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.notification-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  max-height: 480px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dark .notification-panel {
  background: var(--dark-bg-elevated);
  border-color: var(--dark-border-color);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.dark .panel-header {
  border-bottom-color: var(--dark-border-color);
}

.panel-title {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
}

.panel-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--bg-tertiary);
  color: var(--primary-color);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--text-muted);
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: var(--text-sm);
}

.notification-list {
  display: flex;
  flex-direction: column;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  transition: background-color 0.2s ease;
  position: relative;
}

.notification-item:hover {
  background-color: var(--bg-tertiary);
}

.notification-item.is-unread {
  background-color: rgba(59, 130, 246, 0.05);
}

.notification-item.is-unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--primary-color);
}

.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon.info {
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
}

.notification-icon.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.notification-icon.reminder {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.notification-icon.success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  margin-bottom: 2px;
}

.notification-item.is-unread .notification-title {
  font-weight: var(--font-semibold);
}

.notification-message {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-time {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.delete-btn {
  padding: var(--spacing-xs);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: var(--bg-tertiary);
  color: var(--error-color);
}
</style>
