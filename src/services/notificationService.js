import { useSettingsStore } from '../stores/settings.js';
import { useUserProfileStore } from '../stores/userProfile.js';
import { useEventsStore } from '../stores/events.js';

/**
 * 高级通知服务
 * 提供浏览器通知、Web Push、邮件提醒、智能提醒时间优化等功能
 */
export class NotificationService {
  constructor () {
    this.settingsStore = null;
    this.userProfileStore = null;
    this.eventsStore = null;

    this.notificationConfig = {
      enabled: true,
      browserNotifications: true,
      soundEnabled: true,
      webPush: false,
      emailNotifications: false,
      smsNotifications: false,
      smartTiming: true,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      },
      priorityLevels: {
        low: { sound: false, vibration: false, popup: false },
        medium: { sound: true, vibration: false, popup: true },
        high: { sound: true, vibration: true, popup: true }
      }
    };

    this.scheduledNotifications = new Map();
    this.notificationHistory = [];
    this.permissionStatus = 'default';
    this.serviceWorkerRegistration = null;
    this.pushSubscription = null;
    this.audioContext = null;

    this.initialized = false;
  }

  /**
   * 初始化通知服务
   */
  async initialize () {
    if (this.initialized) return;

    try {
      // 尝试加载 stores（可能还未准备好）
      try {
        this.settingsStore = useSettingsStore();
        this.userProfileStore = useUserProfileStore();
        this.eventsStore = useEventsStore();
      } catch (storeError) {
        console.warn('Stores 未准备好，使用默认配置');
      }

      // 加载配置
      await this.loadConfiguration();

      // 请求通知权限
      await this.requestNotificationPermission();

      // 注册Service Worker（用于Web Push）
      if (this.notificationConfig.webPush) {
        await this.registerServiceWorker();
      }

      // 启动事件监听器
      this.setupEventListeners();

      // 启动定时任务
      this.startScheduledTasks();

      // 恢复计划的通知
      await this.restoreScheduledNotifications();

      this.initialized = true;
      console.log('🔔 通知服务初始化完成，权限状态:', this.permissionStatus);
    } catch (error) {
      console.error('❌ 通知服务初始化失败:', error);
      // 即使失败也标记为已初始化，避免重复尝试
      this.initialized = true;
    }
  }

  /**
   * 请求通知权限
   */
  async requestNotificationPermission () {
    if (!('Notification' in window)) {
      console.warn('浏览器不支持通知功能');
      this.permissionStatus = 'unsupported';
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus = permission;

      console.log(`📋 通知权限状态: ${permission}`);

      if (permission === 'granted') {
        console.log('✅ 通知权限已授予');
      } else if (permission === 'denied') {
        console.warn('⚠️ 通知权限被拒绝');
        this.notificationConfig.browserNotifications = false;
      }
    } catch (error) {
      console.error('请求通知权限失败:', error);
      this.permissionStatus = 'error';
    }
  }

  /**
   * 注册Service Worker
   */
  async registerServiceWorker () {
    if (!('serviceWorker' in navigator)) {
      console.warn('浏览器不支持Service Worker');
      return;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker注册成功');

      // 等待Service Worker就绪
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker已就绪');
    } catch (error) {
      console.error('❌ Service Worker注册失败:', error);
      this.notificationConfig.webPush = false;
    }
  }

  /**
   * 订阅Web Push通知
   */
  async subscribeToPushNotifications () {
    if (!this.serviceWorkerRegistration) {
      console.error('Service Worker未注册');
      return null;
    }

    try {
      const publicVapidKey = 'YOUR_PUBLIC_VAPID_KEY'; // 需要替换为实际的公钥

      this.pushSubscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicVapidKey)
      });

      console.log('✅ Web Push订阅成功');

      // 将订阅信息发送到服务器
      await this.sendPushSubscriptionToServer(this.pushSubscription);

      return this.pushSubscription;
    } catch (error) {
      console.error('❌ Web Push订阅失败:', error);
      return null;
    }
  }

  /**
   * 显示浏览器通知
   */
  async showBrowserNotification (options) {
    console.log('🔔 showBrowserNotification 被调用', {
      browserNotificationsEnabled: this.notificationConfig.browserNotifications,
      permissionStatus: this.permissionStatus,
      options
    });

    // 只检查权限状态，不要检查 notificationConfig.browserNotifications，
    // 因为 sendNotification 中已经根据 enableNotification 参数判断了
    if (this.permissionStatus !== 'granted') {
      console.warn('❌ 通知权限未授予，无法显示通知');
      return false;
    }

    try {
      const {
        title,
        body,
        icon = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=calendar%20notification%20icon%20simple%20design&image_size=square_hd',
        badge = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=calendar%20badge%20icon%20small&image_size=square',
        tag = 'calendar-notification',
        requireInteraction = false,
        silent = false,
        vibrate = [],
        actions = [],
        data = {}
      } = options;

      // 检查是否在安静时间内
      if (this.isInQuietHours()) {
        console.log('🌙 当前在安静时间内，不显示通知');
        return false;
      }

      console.log('📱 准备创建浏览器通知:', { title, body });

      const notification = new Notification(title, {
        body,
        icon,
        badge,
        tag,
        requireInteraction,
        silent,
        vibrate,
        actions: actions.length > 0 ? actions : undefined,
        data: {
          ...data,
          timestamp: Date.now(),
          type: 'calendar'
        }
      });

      // 添加事件监听器
      notification.onclick = (event) => {
        console.log('📱 通知被点击', event);
        window.focus();
        notification.close();

        // 记录点击事件
        this.recordNotificationEvent('clicked', options);
      };

      notification.onshow = () => {
        console.log('✅ 通知已成功显示:', title);
        this.recordNotificationEvent('shown', options);
      };

      notification.onclose = () => {
        console.log('📱 通知已关闭', title);
        this.recordNotificationEvent('closed', options);
      };

      notification.onerror = (error) => {
        console.error('❌ 通知显示失败:', error);
        this.recordNotificationEvent('error', { ...options, error: error.message });
      };

      return true;
    } catch (error) {
      console.error('❌ 显示浏览器通知时发生异常:', error);
      this.recordNotificationEvent('error', { ...options, error: error.message });
      return false;
    }
  }

  /**
   * 统一发送通知方法（供reminderScheduler调用）
   * @param {string} title - 通知标题
   * @param {string} message - 通知内容
   * @param {Object} options - 配置选项
   * @param {boolean} options.enableNotification - 是否启用推送通知
   * @param {boolean} options.enableSound - 是否启用响铃
   * @param {string} options.soundType - 铃声类型: 'default' | 'urgent' | 'gentle'
   * @returns {Promise<Object>} 发送结果
   */
  async sendNotification (title, message, options = {}) {
    console.log('📧 sendNotification 被调用', { title, message, options });

    const {
      enableNotification = true,
      enableSound = true,
      soundType = 'default',
      tag = `reminder-${Date.now()}`,
      requireInteraction = true,
      actions = [],
      data = {}
    } = options;

    const results = {
      notification: false,
      sound: false
    };

    // 发送浏览器推送通知 - 只检查 enableNotification 参数，不检查 this.notificationConfig.browserNotifications
    if (enableNotification) {
      console.log('✅ 推送通知已启用，准备发送');

      // 确保已请求权限
      if (this.permissionStatus !== 'granted') {
        console.log('🔐 通知权限未授予，尝试请求...');
        await this.requestNotificationPermission();
      }

      if (this.permissionStatus === 'granted') {
        console.log('✅ 通知权限已授予，显示通知');
        results.notification = await this.showBrowserNotification({
          title,
          body: message,
          tag,
          requireInteraction,
          actions,
          data,
          silent: !enableSound
        });
      } else {
        console.warn('⚠️ 通知权限仍未授予，无法显示通知');
      }
    } else {
      console.log('⏸️ 推送通知未启用');
    }

    // 播放提醒铃声
    if (enableSound) {
      console.log('🔊 播放提醒铃声');
      results.sound = this.playReminderSound(soundType);
    }

    console.log('📢 通知发送结果:', results);
    return results;
  }

  /**
   * 播放提醒铃声（优先使用自定义铃声）
   * @param {string} type - 铃声类型: 'default' | 'urgent' | 'gentle'
   * @returns {boolean} 是否成功播放
   */
  playReminderSound (type = 'default') {
    try {
      console.log('🔊 playReminderSound 被调用，类型:', type);

      // 检查是否在安静时间内
      if (this.isInQuietHours()) {
        console.log('🌙 当前在安静时间内，不播放铃声');
        return false;
      }

      // 首先检查是否有自定义铃声
      if (this.settingsStore && this.settingsStore.ringtoneSettings) {
        const { useCustomRingtone, customRingtone } = this.settingsStore.ringtoneSettings;
        if (useCustomRingtone && customRingtone) {
          console.log('🎵 使用自定义铃声');
          return this.playCustomRingtone(customRingtone);
        }
      }

      // 如果没有自定义铃声，使用默认的 Web Audio API 生成铃声
      console.log('🎵 使用默认铃声');
      return this.playDefaultRingtone(type);
    } catch (error) {
      console.error('❌ 播放提醒铃声失败:', error);
      return false;
    }
  }

  /**
   * 播放自定义铃声
   * @param {string} customRingtone - 自定义铃声数据（base64或URL）
   * @returns {boolean} 是否成功播放
   */
  playCustomRingtone (customRingtone) {
    try {
      const audio = new Audio(customRingtone);
      audio.volume = 0.8;
      audio.play()
        .then(() => {
          console.log('✅ 自定义铃声播放成功');
        })
        .catch((error) => {
          console.warn('⚠️ 自定义铃声播放失败，尝试使用默认铃声:', error);
          this.playDefaultRingtone('default');
        });
      return true;
    } catch (error) {
      console.error('❌ 播放自定义铃声失败:', error);
      return false;
    }
  }

  /**
   * 播放默认铃声（使用Web Audio API生成）
   * @param {string} type - 铃声类型: 'default' | 'urgent' | 'gentle'
   * @returns {boolean} 是否成功播放
   */
  playDefaultRingtone (type = 'default') {
    try {
      // 创建或复用 AudioContext
      if (!this.audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          console.warn('❌ 浏览器不支持 Web Audio API');
          return false;
        }
        this.audioContext = new AudioContext();
        console.log('🎵 AudioContext 已创建');
      }

      // 如果 AudioContext 被暂停，尝试恢复
      if (this.audioContext.state === 'suspended') {
        console.log('🎵 AudioContext 被暂停，尝试恢复...');
        this.audioContext.resume();
      }

      // 根据类型选择不同的铃声模式
      const soundPatterns = {
        default: {
          frequencies: [880, 988, 880, 988, 1047],
          durations: [0.15, 0.15, 0.15, 0.15, 0.3],
          intervals: [0, 0.2, 0.4, 0.6, 0.8]
        },
        urgent: {
          frequencies: [1047, 1175, 1047, 1175, 1319, 1175, 1047],
          durations: [0.1, 0.1, 0.1, 0.1, 0.15, 0.1, 0.2],
          intervals: [0, 0.12, 0.24, 0.36, 0.5, 0.65, 0.8]
        },
        gentle: {
          frequencies: [523, 659, 784],
          durations: [0.3, 0.3, 0.5],
          intervals: [0, 0.35, 0.7]
        }
      };

      const pattern = soundPatterns[type] || soundPatterns.default;
      const now = this.audioContext.currentTime;

      pattern.frequencies.forEach((freq, index) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, now + pattern.intervals[index]);

        // 音量包络 - 渐入渐出效果
        const startTime = now + pattern.intervals[index];
        const duration = pattern.durations[index];
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + duration - 0.02);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });

      console.log(`✅ 成功播放默认提醒铃声: ${type}`);
      return true;
    } catch (error) {
      console.error('❌ 播放默认铃声失败:', error);
      return false;
    }
  }

  /**
   * 请求权限并发送通知
   * @param {string} title - 通知标题
   * @param {string} message - 通知内容
   * @param {Object} options - 配置选项
   * @returns {Promise<Object>} 发送结果
   */
  async requestPermissionAndNotify (title, message, options = {}) {
    // 先请求通知权限
    if (this.permissionStatus !== 'granted') {
      await this.requestNotificationPermission();
    }

    return this.sendNotification(title, message, options);
  }

  /**
   * 切换声音开关
   * @param {boolean} enabled - 是否启用
   */
  setSoundEnabled (enabled) {
    this.notificationConfig.soundEnabled = enabled;
    this.saveConfiguration();
  }

  /**
   * 切换通知开关
   * @param {boolean} enabled - 是否启用
   */
  setNotificationEnabled (enabled) {
    this.notificationConfig.browserNotifications = enabled;
    this.saveConfiguration();
  }

  /**
   * 保存配置到本地存储
   */
  saveConfiguration () {
    try {
      localStorage.setItem('notification_config', JSON.stringify(this.notificationConfig));
    } catch (error) {
      console.error('保存通知配置失败:', error);
    }
  }

  /**
   * 发送Web Push通知
   */
  async sendWebPushNotification (options) {
    if (!this.notificationConfig.webPush || !this.pushSubscription) {
      console.warn('Web Push未启用或未订阅');
      return false;
    }

    try {
      const payload = {
        title: options.title,
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/badge-72x72.png',
        tag: options.tag || 'calendar-push',
        data: {
          ...options.data,
          type: 'web-push',
          timestamp: Date.now()
        }
      };

      // 发送到服务器端点
      const response = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          subscription: this.pushSubscription,
          payload
        })
      });

      if (response.ok) {
        console.log('✅ Web Push通知发送成功');
        this.recordNotificationEvent('web-push-sent', options);
        return true;
      } else {
        console.error('❌ Web Push通知发送失败:', response.status);
        return false;
      }
    } catch (error) {
      console.error('发送Web Push通知失败:', error);
      return false;
    }
  }

  /**
   * 发送邮件通知
   */
  async sendEmailNotification (options) {
    if (!this.notificationConfig.emailNotifications) {
      return false;
    }

    try {
      const emailData = {
        to: this.userProfileStore.profile.email,
        subject: options.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">${options.title}</h2>
            <p style="font-size: 16px; line-height: 1.5;">${options.body}</p>
            ${options.eventDetails ? this.formatEventDetails(options.eventDetails) : ''}
            <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                此邮件由智能日历自动发送，请勿回复。
              </p>
            </div>
          </div>
        `,
        text: `${options.title}\n\n${options.body}`
      };

      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        console.log('✅ 邮件通知发送成功');
        this.recordNotificationEvent('email-sent', options);
        return true;
      } else {
        console.error('❌ 邮件通知发送失败:', response.status);
        return false;
      }
    } catch (error) {
      console.error('发送邮件通知失败:', error);
      return false;
    }
  }

  /**
   * 智能事件提醒
   */
  async scheduleEventReminder (event, options = {}) {
    try {
      const {
        reminderTime = 15, // 提前15分钟
        notificationType = 'browser',
        priority = 'medium'
      } = options;

      // 计算提醒时间
      const eventStartTime = new Date(event.startDate);
      const reminderTimestamp = eventStartTime.getTime() - (reminderTime * 60 * 1000);
      const now = Date.now();

      // 如果事件已经开始，不发送提醒
      if (eventStartTime <= now) {
        console.log('⏰ 事件已开始，跳过提醒');
        return null;
      }

      // 如果提醒时间已过，立即发送提醒
      if (reminderTimestamp <= now) {
        console.log('⚡ 立即发送过期提醒');
        await this.sendEventReminder(event, { reminderTime, notificationType, priority });
        return null;
      }

      // 智能时间优化
      let optimizedReminderTime = reminderTimestamp;
      if (this.notificationConfig.smartTiming) {
        optimizedReminderTime = await this.optimizeReminderTime(event, reminderTimestamp);
      }

      // 创建提醒定时器
      const reminderId = `reminder-${event.id}-${Date.now()}`;
      const timeout = optimizedReminderTime - now;

      const timer = setTimeout(async () => {
        await this.sendEventReminder(event, { reminderTime, notificationType, priority });
        this.scheduledNotifications.delete(reminderId);
      }, timeout);

      // 保存提醒信息
      this.scheduledNotifications.set(reminderId, {
        eventId: event.id,
        timer,
        originalTime: reminderTimestamp,
        optimizedTime: optimizedReminderTime,
        options
      });

      console.log(`⏰ 事件提醒已安排: ${event.title} (${new Date(optimizedReminderTime).toLocaleString()})`);

      // 保存到本地存储
      this.saveScheduledReminders();

      return reminderId;
    } catch (error) {
      console.error('安排事件提醒失败:', error);
      throw error;
    }
  }

  /**
   * 发送事件提醒
   */
  async sendEventReminder (event, options) {
    try {
      const {
        reminderTime,
        notificationType,
        priority
      } = options;

      const notificationOptions = {
        title: `⏰ 事件提醒: ${event.title}`,
        body: this.formatEventReminderBody(event, reminderTime),
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: `event-reminder-${event.id}`,
        requireInteraction: priority === 'high',
        silent: priority === 'low',
        vibrate: this.notificationConfig.priorityLevels[priority].vibration ? [200, 100, 200] : [],
        data: {
          type: 'event-reminder',
          eventId: event.id,
          eventType: event.type,
          priority,
          timestamp: Date.now()
        },
        eventDetails: event
      };

      // 根据通知类型发送
      const results = {};

      if (notificationType === 'browser' || notificationType === 'all') {
        results.browser = await this.showBrowserNotification(notificationOptions);
      }

      if (notificationType === 'web-push' || notificationType === 'all') {
        results.webPush = await this.sendWebPushNotification(notificationOptions);
      }

      if (notificationType === 'email' || notificationType === 'all') {
        results.email = await this.sendEmailNotification(notificationOptions);
      }

      // 记录提醒历史
      this.recordReminderHistory(event, options, results);

      console.log(`📢 事件提醒已发送: ${event.title}`, results);
      return results;
    } catch (error) {
      console.error('发送事件提醒失败:', error);
      throw error;
    }
  }

  /**
   * 优化提醒时间
   */
  async optimizeReminderTime (event, originalTime) {
    try {
      const eventTime = new Date(event.startDate);
      const now = Date.now();

      // 考虑用户的活动模式
      const userActivityPattern = await this.getUserActivityPattern();

      // 避免在安静时间发送提醒
      if (this.isInQuietHours(originalTime)) {
        // 提前到安静时间开始前
        const quietStart = this.parseTime(this.notificationConfig.quietHours.start);
        const adjustedTime = new Date(originalTime);
        adjustedTime.setHours(quietStart.hour - 1, quietStart.minute, 0, 0);
        return adjustedTime.getTime();
      }

      // 考虑事件重要性
      let optimization = 0;

      if (event.priority === 'high') {
        // 重要事件，稍微提前提醒
        optimization = -5 * 60 * 1000; // 提前5分钟
      } else if (event.priority === 'low') {
        // 低优先级事件，可以稍微延后
        optimization = 10 * 60 * 1000; // 延后10分钟
      }

      // 考虑用户习惯（如果用户通常在某个时间段活跃）
      if (userActivityPattern.mostActiveHour) {
        const reminderHour = new Date(originalTime).getHours();
        const activeHour = userActivityPattern.mostActiveHour;

        if (Math.abs(reminderHour - activeHour) > 3) {
          // 如果提醒时间远离用户活跃时间，适当调整
          optimization += (activeHour - reminderHour) * 30 * 60 * 1000; // 向活跃时间靠近半小时
        }
      }

      const optimizedTime = originalTime + optimization;

      // 确保优化后的时间合理（不早于现在，不晚于事件开始）
      return Math.max(now + 60000, Math.min(optimizedTime, eventTime.getTime() - 60000));
    } catch (error) {
      console.error('优化提醒时间失败:', error);
      return originalTime; // 返回原始时间作为fallback
    }
  }

  /**
   * 检查是否在安静时间内
   */
  isInQuietHours (timestamp = Date.now()) {
    if (!this.notificationConfig.quietHours.enabled) {
      return false;
    }

    try {
      const time = new Date(timestamp);
      const currentHour = time.getHours();
      const currentMinute = time.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      const quietStart = this.parseTime(this.notificationConfig.quietHours.start);
      const quietEnd = this.parseTime(this.notificationConfig.quietHours.end);

      const quietStartTime = quietStart.hour * 60 + quietStart.minute;
      const quietEndTime = quietEnd.hour * 60 + quietEnd.minute;

      // 处理跨天的情况（如22:00到次日08:00）
      if (quietStartTime > quietEndTime) {
        return currentTime >= quietStartTime || currentTime <= quietEndTime;
      } else {
        return currentTime >= quietStartTime && currentTime <= quietEndTime;
      }
    } catch (error) {
      console.error('检查安静时间失败:', error);
      return false;
    }
  }

  /**
   * 解析时间字符串
   */
  parseTime (timeString) {
    const [hour, minute] = timeString.split(':').map(Number);
    return { hour, minute };
  }

  /**
   * 获取用户活动模式
   */
  async getUserActivityPattern () {
    // 这里应该分析用户的历史活动数据
    // 简化实现，返回默认模式
    return {
      mostActiveHour: 9, // 假设用户最活跃时间是上午9点
      leastActiveHour: 3, // 凌晨3点最不活跃
      weekendPattern: 'similar' // 周末模式类似
    };
  }

  /**
   * 格式化事件提醒正文
   */
  formatEventReminderBody (event, reminderTime) {
    const eventTime = new Date(event.startDate);
    const timeUntil = this.formatTimeUntil(eventTime, reminderTime);

    let body = `${event.description || '无描述'}\n\n`;
    body += `📅 时间: ${eventTime.toLocaleString()}\n`;
    body += `⏰ 距离开始: ${timeUntil}\n`;

    if (event.location) {
      body += `📍 地点: ${event.location}\n`;
    }

    if (event.attendees && event.attendees.length > 0) {
      body += `👥 参与者: ${event.attendees.join(', ')}\n`;
    }

    return body.trim();
  }

  /**
   * 格式化事件详情
   */
  formatEventDetails (event) {
    if (!event) return '';

    let details = '<div style="margin-top: 15px;">';
    details += `<p><strong>📅 时间:</strong> ${new Date(event.startDate).toLocaleString()}</p>`;

    if (event.endDate) {
      details += `<p><strong>⏰ 结束:</strong> ${new Date(event.endDate).toLocaleString()}</p>`;
    }

    if (event.location) {
      details += `<p><strong>📍 地点:</strong> ${event.location}</p>`;
    }

    if (event.priority) {
      const priorityColors = {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#ef4444'
      };
      details += `<p><strong>🔥 优先级:</strong> <span style="color: ${priorityColors[event.priority]};">${this.translatePriority(event.priority)}</span></p>`;
    }

    details += '</div>';
    return details;
  }

  /**
   * 格式化剩余时间
   */
  formatTimeUntil (eventTime, reminderTime) {
    const diff = eventTime.getTime() - reminderTime;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天 ${hours % 24}小时`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  }

  /**
   * 翻译优先级
   */
  translatePriority (priority) {
    const translations = {
      low: '低',
      medium: '中',
      high: '高'
    };
    return translations[priority] || priority;
  }

  /**
   * 记录通知事件
   */
  recordNotificationEvent (type, data) {
    const event = {
      type,
      timestamp: Date.now(),
      data: {
        title: data.title,
        tag: data.tag,
        priority: data.priority,
        ...data.data
      }
    };

    this.notificationHistory.push(event);

    // 限制历史记录数量
    if (this.notificationHistory.length > 1000) {
      this.notificationHistory = this.notificationHistory.slice(-1000);
    }

    // 保存到本地存储
    this.saveNotificationHistory();
  }

  /**
   * 记录提醒历史
   */
  recordReminderHistory (event, options, results) {
    const history = {
      eventId: event.id,
      eventTitle: event.title,
      reminderTime: options.reminderTime,
      notificationType: options.notificationType,
      priority: options.priority,
      timestamp: Date.now(),
      results,
      success: Object.values(results).some(result => result === true)
    };

    // 保存到本地存储
    this.saveReminderHistory(history);
  }

  /**
   * 获取通知统计
   */
  getNotificationStats (timeRange = 7 * 24 * 60 * 60 * 1000) {
    const cutoffTime = Date.now() - timeRange;
    const recentHistory = this.notificationHistory.filter(
      item => item.timestamp >= cutoffTime
    );

    const stats = {
      total: recentHistory.length,
      byType: {},
      successRate: 0,
      byPriority: {},
      mostActiveHour: null
    };

    // 按类型统计
    recentHistory.forEach(item => {
      stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;

      if (item.data?.priority) {
        stats.byPriority[item.data.priority] = (stats.byPriority[item.data.priority] || 0) + 1;
      }
    });

    // 计算成功率
    const successfulNotifications = recentHistory.filter(item =>
      item.type !== 'error'
    ).length;

    stats.successRate = stats.total > 0 ? (successfulNotifications / stats.total) : 0;

    return stats;
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners () {
    // 监听事件变化
    this.eventsStore.$subscribe((mutation, state) => {
      this.handleEventsChange(state.events);
    });

    // 监听设置变化
    this.settingsStore.$subscribe((mutation, state) => {
      this.handleSettingsChange(state.settings);
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.handleNetworkChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleNetworkChange(false);
    });
  }

  /**
   * 处理事件变化
   */
  async handleEventsChange (events) {
    // 清除现有的事件提醒
    this.clearEventReminders();

    // 为未来的事件安排提醒
    const futureEvents = events.filter(event =>
      new Date(event.startDate) > new Date()
    );

    for (const event of futureEvents) {
      if (event.reminders && event.reminders.length > 0) {
        for (const reminder of event.reminders) {
          if (reminder.enabled) {
            await this.scheduleEventReminder(event, {
              reminderTime: reminder.time,
              notificationType: reminder.type || 'browser',
              priority: event.priority || 'medium'
            });
          }
        }
      } else {
        // 默认提醒（15分钟前）
        await this.scheduleEventReminder(event, {
          reminderTime: 15,
          notificationType: 'browser',
          priority: event.priority || 'medium'
        });
      }
    }
  }

  /**
   * 处理设置变化
   */
  handleSettingsChange (settings) {
    // 更新通知配置
    if (settings.notifications) {
      this.notificationConfig = {
        ...this.notificationConfig,
        ...settings.notifications
      };
    }

    // 如果禁用了通知，清除所有计划的通知
    if (!this.notificationConfig.enabled) {
      this.clearAllScheduledNotifications();
    }
  }

  /**
   * 处理页面可见性变化
   */
  handleVisibilityChange () {
    if (document.hidden) {
      // 页面隐藏时，可以启用更积极的通知策略
      console.log('📱 页面隐藏，启用后台通知模式');
    } else {
      // 页面显示时，可以减少通知频率
      console.log('👁️ 页面显示，启用前台通知模式');
    }
  }

  /**
   * 处理网络状态变化
   */
  handleNetworkChange (isOnline) {
    if (isOnline) {
      console.log('📡 网络已连接，恢复通知服务');
      this.rescheduleMissedNotifications();
    } else {
      console.log('📵 网络已断开，启用离线通知模式');
      this.handleOfflineMode();
    }
  }

  /**
   * 启动定时任务
   */
  startScheduledTasks () {
    // 每分钟检查一次即将到来的事件
    setInterval(() => {
      this.checkUpcomingEvents();
    }, 60000);

    // 每小时清理过期的通知历史
    setInterval(() => {
      this.cleanupNotificationHistory();
    }, 3600000);

    // 每天检查通知权限状态
    setInterval(() => {
      this.checkNotificationPermission();
    }, 86400000);
  }

  /**
   * 检查即将到来的事件
   */
  async checkUpcomingEvents () {
    const now = new Date();
    // const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingEvents = this.eventsStore.events.filter(event => {
      const eventTime = new Date(event.startDate);
      return eventTime > now && eventTime <= in1Hour;
    });

    for (const event of upcomingEvents) {
      const eventTime = new Date(event.startDate);
      const timeUntil = eventTime.getTime() - now.getTime();

      // 15分钟内的事件发送提醒
      if (timeUntil <= 15 * 60 * 1000) {
        await this.sendEventReminder(event, {
          reminderTime: Math.floor(timeUntil / (60 * 1000)),
          notificationType: 'browser',
          priority: 'high'
        });
      }
    }
  }

  /**
   * 清理通知历史
   */
  cleanupNotificationHistory () {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.notificationHistory = this.notificationHistory.filter(
      item => item.timestamp >= thirtyDaysAgo
    );
    this.saveNotificationHistory();
  }

  /**
   * 检查通知权限
   */
  async checkNotificationPermission () {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      if (currentPermission !== this.permissionStatus) {
        console.log(`📋 通知权限状态变更: ${this.permissionStatus} -> ${currentPermission}`);
        this.permissionStatus = currentPermission;

        if (currentPermission === 'granted') {
          this.notificationConfig.browserNotifications = true;
        } else {
          this.notificationConfig.browserNotifications = false;
        }
      }
    }
  }

  /**
   * 工具方法
   */
  clearEventReminders () {
    for (const [reminderId, reminder] of this.scheduledNotifications.entries()) {
      if (reminder.eventId) {
        clearTimeout(reminder.timer);
        this.scheduledNotifications.delete(reminderId);
      }
    }
  }

  clearAllScheduledNotifications () {
    for (const [reminderId, reminder] of this.scheduledNotifications.entries()) {
      clearTimeout(reminder.timer);
      this.scheduledNotifications.delete(reminderId);
    }
  }

  rescheduleMissedNotifications () {
    // 重新安排错过的通知
    console.log('🔄 重新安排错过的通知');
  }

  handleOfflineMode () {
    // 处理离线模式
    console.log('📵 进入离线通知模式');
  }

  async restoreScheduledNotifications () {
    // 从本地存储恢复计划的通知
    try {
      const saved = localStorage.getItem('scheduled_notifications');
      if (saved) {
        const reminders = JSON.parse(saved);
        // 重新安排通知
        console.log(`📋 恢复 ${reminders.length} 个计划通知`);
      }
    } catch (error) {
      console.error('恢复计划通知失败:', error);
    }
  }

  saveScheduledReminders () {
    try {
      const reminders = Array.from(this.scheduledNotifications.entries()).map(([id, reminder]) => ({
        id,
        eventId: reminder.eventId,
        originalTime: reminder.originalTime,
        optimizedTime: reminder.optimizedTime,
        options: reminder.options
      }));

      localStorage.setItem('scheduled_notifications', JSON.stringify(reminders));
    } catch (error) {
      console.error('保存计划通知失败:', error);
    }
  }

  saveNotificationHistory () {
    try {
      localStorage.setItem('notification_history', JSON.stringify(this.notificationHistory));
    } catch (error) {
      console.error('保存通知历史失败:', error);
    }
  }

  saveReminderHistory (history) {
    try {
      const existing = JSON.parse(localStorage.getItem('reminder_history') || '[]');
      existing.push(history);

      // 限制历史记录数量
      if (existing.length > 500) {
        existing.splice(0, existing.length - 500);
      }

      localStorage.setItem('reminder_history', JSON.stringify(existing));
    } catch (error) {
      console.error('保存提醒历史失败:', error);
    }
  }

  async loadConfiguration () {
    try {
      const saved = localStorage.getItem('notification_config');
      if (saved) {
        this.notificationConfig = { ...this.notificationConfig, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('加载通知配置失败:', error);
    }
  }

  getAuthToken () {
    // 获取认证令牌
    return localStorage.getItem('auth_token') || '';
  }

  urlBase64ToUint8Array (base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  sendPushSubscriptionToServer (subscription) {
    // 发送订阅信息到服务器
    return fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({ subscription })
    });
  }

  /**
   * 停止服务
   */
  async stop () {
    this.clearAllScheduledNotifications();

    if (this.networkListener) {
      window.removeEventListener('online', this.networkListener);
      window.removeEventListener('offline', this.networkListener);
    }

    // 保存状态
    this.saveNotificationHistory();

    console.log('🔕 通知服务已停止');
  }
}

// 创建全局实例
export const notificationService = new NotificationService();
