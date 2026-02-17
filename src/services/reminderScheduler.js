/**
 * 提醒调度器服务
 * 处理事件提醒的调度和通知
 */
class ReminderScheduler {
  constructor () {
    this.scheduledReminders = new Map();
    this.reminderHistory = new Map(); // 存储已通知的提醒历史
    this.isRunning = false;
    this.checkInterval = null;
    this.notificationService = null;
  }

  /**
   * 初始化调度器
   */
  initialize (notificationService) {
    this.notificationService = notificationService;
    this.isRunning = true;
    this.loadPersistedReminders();
    this.startScheduler();
    console.log('⏰ 提醒调度器已初始化');
  }

  /**
   * 从本地存储加载持久化的提醒
   */
  loadPersistedReminders () {
    try {
      const saved = localStorage.getItem('scheduledReminders');
      if (saved) {
        const reminders = JSON.parse(saved);
        const now = new Date();

        reminders.forEach(reminder => {
          // 只加载未过期且未通知的提醒
          const reminderTime = new Date(reminder.reminderTime);
          if (reminderTime > now && !reminder.notified) {
            // 转换日期字符串为Date对象
            reminder.eventTime = new Date(reminder.eventTime);
            reminder.reminderTime = reminderTime;
            this.scheduledReminders.set(reminder.id, reminder);
          }
        });

        console.log(`📥 已加载 ${this.scheduledReminders.size} 个持久化提醒`);
      }
    } catch (error) {
      console.error('加载持久化提醒失败:', error);
    }
  }

  /**
   * 保存提醒到本地存储
   */
  persistReminders () {
    try {
      const reminders = Array.from(this.scheduledReminders.values())
        .filter(r => !r.notified)
        .map(r => ({
          ...r,
          eventTime: r.eventTime.toISOString(),
          reminderTime: r.reminderTime.toISOString()
        }));

      localStorage.setItem('scheduledReminders', JSON.stringify(reminders));
    } catch (error) {
      console.error('持久化提醒失败:', error);
    }
  }

  /**
   * 从事件初始化提醒
   * 只为启用了提醒的事件创建提醒
   */
  initializeFromEvents (events) {
    events.forEach(event => {
      // 只有启用了提醒且设置了开始时间的事件才创建提醒
      if (event.startDate && event.enableReminder) {
        const minutesBefore = event.reminderMinutes || 15;
        this.addReminder(event, minutesBefore);
      }
    });
  }

  /**
   * 启动调度器
   */
  startScheduler () {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // 每分钟检查一次
    this.checkInterval = setInterval(() => {
      this.checkReminders();
    }, 60000);

    // 立即检查一次
    this.checkReminders();
  }

  /**
   * 启动定时检查（startScheduler的别名）
   */
  startChecking () {
    this.startScheduler();
  }

  /**
   * 停止调度器
   */
  stop () {
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.scheduledReminders.clear();
  }

  /**
   * 添加提醒
   */
  addReminder (event, minutesBefore = 15) {
    if (!event.startDate) return;

    const eventTime = new Date(event.startDate);
    const reminderTime = new Date(eventTime.getTime() - minutesBefore * 60000);
    const now = new Date();

    // 如果是准时提醒且事件时间已过，不添加
    if (minutesBefore === 0) {
      // 准时提醒：检查事件时间是否已过
      if (eventTime <= now) return;
    } else {
      // 提前提醒：检查提醒时间是否已过
      if (reminderTime <= now) return;
    }

    const reminderId = `${event.id}_reminder_${Date.now()}`;
    const reminder = {
      id: reminderId,
      eventId: event.id,
      eventTitle: event.title,
      eventTime,
      reminderTime,
      minutesBefore,
      type: event.type || 'reminder',
      priority: event.priority || 'medium',
      enableNotification: event.enableNotification !== false,
      enableSound: event.enableSound !== false,
      notified: false
    };

    this.scheduledReminders.set(reminderId, reminder);
    this.persistReminders();
    console.log(`➕ 已添加提醒: ${event.title} (${minutesBefore}分钟前)`);
  }

  /**
   * 删除提醒
   */
  removeReminder (eventId) {
    // 移除该事件的所有提醒
    let removedCount = 0;
    for (const [reminderId, reminder] of this.scheduledReminders.entries()) {
      if (reminder.eventId === eventId) {
        this.scheduledReminders.delete(reminderId);
        removedCount++;
      }
    }

    // 同时从历史记录中移除
    for (const [reminderId, reminder] of this.reminderHistory.entries()) {
      if (reminder.eventId === eventId) {
        this.reminderHistory.delete(reminderId);
      }
    }

    if (removedCount > 0) {
      this.persistReminders();
      console.log(`➖ 已移除 ${removedCount} 个提醒`);
    }

    return removedCount;
  }

  /**
   * 删除单个提醒（通过提醒ID）
   */
  removeReminderById (reminderId) {
    const reminder = this.scheduledReminders.get(reminderId);
    if (reminder) {
      this.scheduledReminders.delete(reminderId);
      return reminder;
    }

    // 如果在历史记录中，也从历史记录删除
    const historyReminder = this.reminderHistory.get(reminderId);
    if (historyReminder) {
      this.reminderHistory.delete(reminderId);
      return historyReminder;
    }

    return null;
  }

  /**
   * 更新提醒
   */
  updateReminder (event, minutesBefore = 15) {
    this.removeReminder(event.id);
    this.addReminder(event, minutesBefore);
  }

  /**
   * 检查提醒
   */
  checkReminders () {
    if (!this.isRunning || !this.notificationService) return;

    const now = new Date();

    for (const [reminderId, reminder] of this.scheduledReminders.entries()) {
      if (reminder.notified) continue;

      // 检查是否到达提醒时间
      if (now >= reminder.reminderTime) {
        // 发送通知
        this.sendReminderNotification(reminder);
        reminder.notified = true;

        // 移除已通知的提醒
        this.scheduledReminders.delete(reminderId);
      }
    }
  }

  /**
   * 发送提醒通知
   * 同时触发浏览器推送通知和响铃
   */
  sendReminderNotification (reminder) {
    if (!this.notificationService) return;

    const timeUntilEvent = this.getTimeUntilEvent(reminder.eventTime);
    const title = this.getReminderTitle(reminder);
    const message = this.getReminderMessage(reminder, timeUntilEvent);

    // 根据优先级选择铃声类型
    const soundType = this.getSoundType(reminder.priority);

    // 调用通知服务发送通知（同时包含推送通知和响铃）
    this.notificationService.sendNotification(title, message, {
      tag: reminder.id,
      requireInteraction: true,
      enableNotification: reminder.enableNotification,
      enableSound: reminder.enableSound,
      soundType,
      actions: [
        {
          action: 'view',
          title: '查看详情'
        },
        {
          action: 'dismiss',
          title: '忽略'
        }
      ],
      data: {
        eventId: reminder.eventId,
        eventTitle: reminder.eventTitle,
        eventTime: reminder.eventTime.toISOString(),
        priority: reminder.priority
      }
    });

    // 记录提醒日志
    this.logReminder(reminder);
  }

  /**
   * 根据优先级获取铃声类型
   */
  getSoundType (priority) {
    const soundTypes = {
      high: 'urgent',
      medium: 'default',
      low: 'gentle'
    };
    return soundTypes[priority] || 'default';
  }

  /**
   * 获取提醒标题
   */
  getReminderTitle (reminder) {
    const typeIcons = {
      meeting: '👥',
      appointment: '📞',
      reminder: '⏰',
      task: '✅'
    };

    const icon = typeIcons[reminder.type] || '📅';
    return `${icon} ${reminder.eventTitle}`;
  }

  /**
   * 获取提醒消息
   */
  getReminderMessage (reminder, timeUntilEvent) {
    const eventTimeStr = reminder.eventTime.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // 检查是否是准时提醒
    if (reminder.minutesBefore === 0) {
      return `事件现在开始! (${eventTimeStr})`;
    }

    return `事件将在${timeUntilEvent}后开始 (${eventTimeStr})`;
  }

  /**
   * 获取距离事件开始的时间
   */
  getTimeUntilEvent (eventTime) {
    const now = new Date();
    const diffMs = eventTime.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins <= 0) return '现在';
    if (diffMins === 1) return '1分钟';
    if (diffMins < 60) return `${diffMins}分钟`;

    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;

    if (remainingMins === 0) return `${diffHours}小时`;
    return `${diffHours}小时${remainingMins}分钟`;
  }

  /**
   * 记录提醒日志
   */
  logReminder (reminder) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      reminderId: reminder.id,
      eventId: reminder.eventId,
      eventTitle: reminder.eventTitle,
      eventTime: reminder.eventTime.toISOString(),
      reminderTime: reminder.reminderTime.toISOString(),
      type: reminder.type,
      priority: reminder.priority,
      status: 'notified',
      notifiedAt: new Date().toISOString()
    };

    // 保存到历史记录
    this.reminderHistory.set(reminder.id, logEntry);

    // 保存到本地存储
    const logs = this.getReminderLogs();
    logs.unshift(logEntry);

    // 只保留最近100条日志
    if (logs.length > 100) {
      logs.splice(100);
    }

    localStorage.setItem('reminderLogs', JSON.stringify(logs));
  }

  /**
   * 获取提醒日志
   */
  getReminderLogs () {
    try {
      const logs = localStorage.getItem('reminderLogs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.warn('读取提醒日志失败:', error);
      return [];
    }
  }

  /**
   * 获取即将到来的提醒
   */
  getUpcomingReminders (limit = 10) {
    const now = new Date();
    const upcoming = [];

    for (const reminder of this.scheduledReminders.values()) {
      if (!reminder.notified && reminder.reminderTime > now) {
        upcoming.push({
          ...reminder,
          timeUntil: this.getTimeUntilEvent(reminder.eventTime),
          isExpiringSoon: this.isExpiringSoon(reminder)
        });
      }
    }

    // 按提醒时间排序
    return upcoming
      .sort((a, b) => a.reminderTime - b.reminderTime)
      .slice(0, limit);
  }

  /**
   * 获取所有提醒（包括历史和待处理）
   */
  getAllReminders (limit = 50) {
    const allReminders = [];

    // 获取待处理的提醒
    for (const reminder of this.scheduledReminders.values()) {
      allReminders.push({
        ...reminder,
        status: reminder.notified ? 'notified' : 'pending',
        timeUntil: this.getTimeUntilEvent(reminder.eventTime),
        isExpiringSoon: this.isExpiringSoon(reminder)
      });
    }

    // 获取历史提醒（最近的通知）
    const recentHistory = Array.from(this.reminderHistory.values())
      .sort((a, b) => new Date(b.notifiedAt) - new Date(a.notifiedAt))
      .slice(0, 20);

    allReminders.push(...recentHistory);

    // 按时间排序
    return allReminders
      .sort((a, b) => new Date(b.reminderTime) - new Date(a.reminderTime))
      .slice(0, limit);
  }

  /**
   * 获取调度器状态
   */
  getStatus () {
    return {
      isRunning: this.isRunning,
      scheduledCount: this.scheduledReminders.size,
      checkInterval: this.checkInterval !== null,
      upcomingReminders: this.getUpcomingReminders(5)
    };
  }

  /**
   * 检查提醒是否即将到期
   */
  isExpiringSoon (reminder, minutes = 30) {
    const now = new Date();
    const reminderTime = new Date(reminder.reminderTime);
    const timeDiff = reminderTime.getTime() - now.getTime();
    return timeDiff <= minutes * 60 * 1000 && timeDiff > 0;
  }

  /**
   * 清理过期提醒
   */
  cleanupExpiredReminders () {
    const now = new Date();
    let removedCount = 0;

    for (const [reminderId, reminder] of this.scheduledReminders.entries()) {
      // 移除过期的事件提醒（事件时间已过1小时）
      if (reminder.eventTime < new Date(now.getTime() - 3600000)) {
        this.scheduledReminders.delete(reminderId);
        removedCount++;
      }
    }

    // 同时清理历史记录中的过期数据（保留最近7天）
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    for (const [reminderId, historyEntry] of this.reminderHistory.entries()) {
      if (new Date(historyEntry.notifiedAt) < sevenDaysAgo) {
        this.reminderHistory.delete(reminderId);
      }
    }

    return removedCount;
  }

  /**
   * 重新调度所有提醒
   */
  rescheduleAll (events, minutesBefore = 15) {
    this.scheduledReminders.clear();

    events.forEach(event => {
      this.addReminder(event, minutesBefore);
    });

    return this.getStatus();
  }
}

// 创建单例实例
export const reminderScheduler = new ReminderScheduler();
export default ReminderScheduler;
