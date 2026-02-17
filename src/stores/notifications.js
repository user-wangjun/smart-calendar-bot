import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 通知状态管理
 * 管理应用通知的显示、读取状态和数量统计
 */
export const useNotificationsStore = defineStore('notifications', () => {
  // 状态
  const notifications = ref([]);
  const isPanelOpen = ref(false);
  const loading = ref(false);
  const error = ref(null);

  // 计算属性
  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.isRead).length;
  });

  const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  });

  /**
   * 添加通知
   * @param {Object} notificationData - 通知数据
   * @returns {Object} 新创建的通知对象
   */
  const addNotification = (notificationData) => {
    const newNotification = {
      id: Date.now(),
      title: notificationData.title || '通知',
      message: notificationData.message || '',
      type: notificationData.type || 'info',
      isRead: false,
      timestamp: new Date().toISOString(),
      data: notificationData.data || null
    };
    notifications.value.unshift(newNotification);
    saveToLocalStorage();
    return newNotification;
  };

  /**
   * 标记通知为已读
   * @param {number} notificationId - 通知ID
   */
  const markAsRead = (notificationId) => {
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      saveToLocalStorage();
    }
  };

  /**
   * 标记所有通知为已读
   */
  const markAllAsRead = () => {
    notifications.value.forEach(n => {
      n.isRead = true;
    });
    saveToLocalStorage();
  };

  /**
   * 删除通知
   * @param {number} notificationId - 通知ID
   */
  const removeNotification = (notificationId) => {
    notifications.value = notifications.value.filter(n => n.id !== notificationId);
    saveToLocalStorage();
  };

  /**
   * 清空所有通知
   */
  const clearAllNotifications = () => {
    notifications.value = [];
    saveToLocalStorage();
  };

  /**
   * 切换通知面板显示状态
   */
  const togglePanel = () => {
    isPanelOpen.value = !isPanelOpen.value;
  };

  /**
   * 关闭通知面板
   */
  const closePanel = () => {
    isPanelOpen.value = false;
  };

  /**
   * 从本地存储加载数据
   */
  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        const loadedNotifications = JSON.parse(saved);

        const sampleTitles = ['会议提醒', '天气预警', 'AI助手更新'];
        const isSampleNotification = (n) => sampleTitles.includes(n.title);

        notifications.value = loadedNotifications.filter(n => !isSampleNotification(n));

        if (notifications.value.length !== loadedNotifications.length) {
          saveToLocalStorage();
        }
      }
    } catch (err) {
      error.value = '加载通知数据失败';
      console.error('加载通知数据失败:', err);
    }
  };

  /**
   * 保存数据到本地存储
   */
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications.value));
    } catch (err) {
      error.value = '保存通知数据失败';
      console.error('保存通知数据失败:', err);
    }
  };

  /**
   * 添加示例通知（用于演示）
   */
  const addSampleNotifications = () => {
    const samples = [
      {
        title: '会议提醒',
        message: '您有一个会议在15分钟后开始',
        type: 'reminder'
      },
      {
        title: '天气预警',
        message: '今日有雷暴，请注意出行安全',
        type: 'warning'
      },
      {
        title: 'AI助手更新',
        message: 'AI助手已完成升级，新增更多功能',
        type: 'info'
      }
    ];

    samples.forEach(sample => addNotification(sample));
  };

  // 初始化时加载数据
  loadFromLocalStorage();

  return {
    notifications,
    isPanelOpen,
    loading,
    error,
    unreadCount,
    sortedNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    togglePanel,
    closePanel,
    loadFromLocalStorage,
    saveToLocalStorage
  };
});
