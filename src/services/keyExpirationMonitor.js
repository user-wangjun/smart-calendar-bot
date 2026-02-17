/**
 * 密钥过期监控服务
 * 监控API密钥的有效期、使用配额，提供过期预警
 */

import { KeyStatus, KeyType } from './apiKeyCheckService.js';

/**
 * 预警级别枚举
 */
export const AlertLevel = {
  INFO: 'info', // 信息提示
  WARNING: 'warning', // 警告
  CRITICAL: 'critical' // 严重
};

/**
 * 密钥配额信息类
 */
class KeyQuotaInfo {
  constructor (type, used, total, resetTime = null) {
    this.type = type;
    this.used = used;
    this.total = total;
    this.remaining = total - used;
    this.usagePercent = total > 0 ? (used / total * 100).toFixed(2) : 0;
    this.resetTime = resetTime;
    this.isNearLimit = this.usagePercent >= 80;
    this.isExceeded = this.usagePercent >= 100;
  }
}

/**
 * 密钥过期监控服务类
 */
class KeyExpirationMonitor {
  constructor () {
    this.quotaData = new Map();
    this.expirationData = new Map();
    this.alertCallbacks = [];
    this.monitorInterval = null;

    // 初始化各密钥类型的配额数据
    Object.values(KeyType).forEach(type => {
      this.quotaData.set(type, {
        dailyQuota: this.getDefaultQuota(type),
        usedToday: 0,
        lastResetTime: new Date().toISOString(),
        warningSent: false,
        criticalSent: false
      });
    });
  }

  /**
   * 获取默认配额
   */
  getDefaultQuota (keyType) {
    const defaultQuotas = {
      [KeyType.WEATHER]: 400, // 心知天气免费版: 400次/天
      [KeyType.OPENROUTER]: 1000, // OpenRouter免费额度
      [KeyType.ZHIPU]: 1000, // 智谱AI免费额度
      [KeyType.QINIU]: 1000, // 七牛云AI免费额度
      [KeyType.TENCENT_MAP]: 10000 // 腾讯地图免费额度
    };
    return defaultQuotas[keyType] || 1000;
  }

  /**
   * 启动监控
   * @param {number} checkIntervalMinutes - 检查间隔（分钟）
   */
  startMonitoring (checkIntervalMinutes = 60) {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    // 立即执行一次检查
    this.checkAllKeys();

    // 定时检查
    this.monitorInterval = setInterval(() => {
      this.checkAllKeys();
    }, checkIntervalMinutes * 60 * 1000);

    console.log(`[KeyExpirationMonitor] 已启动密钥过期监控，间隔: ${checkIntervalMinutes}分钟`);
  }

  /**
   * 停止监控
   */
  stopMonitoring () {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log('[KeyExpirationMonitor] 已停止密钥过期监控');
    }
  }

  /**
   * 检查所有密钥状态
   */
  checkAllKeys () {
    const results = [];

    Object.values(KeyType).forEach(keyType => {
      const result = this.checkKeyStatus(keyType);
      results.push(result);
    });

    return results;
  }

  /**
   * 检查单个密钥状态
   */
  checkKeyStatus (keyType) {
    const quota = this.quotaData.get(keyType);
    const now = new Date();
    const lastReset = new Date(quota.lastResetTime);

    // 检查是否需要重置每日配额（跨天了）
    if (this.isNewDay(lastReset, now)) {
      this.resetDailyQuota(keyType);
    }

    const usagePercent = quota.dailyQuota > 0
      ? (quota.usedToday / quota.dailyQuota * 100)
      : 0;

    let status = KeyStatus.NORMAL;
    let alertLevel = null;
    let message = '';

    if (usagePercent >= 100) {
      status = KeyStatus.EXPIRED;
      alertLevel = AlertLevel.CRITICAL;
      message = `今日配额已用完 (${quota.usedToday}/${quota.dailyQuota})`;

      if (!quota.criticalSent) {
        this.sendAlert(keyType, AlertLevel.CRITICAL, message);
        quota.criticalSent = true;
      }
    } else if (usagePercent >= 90) {
      status = KeyStatus.EXPIRING;
      alertLevel = AlertLevel.CRITICAL;
      message = `配额即将用完: ${usagePercent.toFixed(1)}% (${quota.usedToday}/${quota.dailyQuota})`;

      if (!quota.criticalSent) {
        this.sendAlert(keyType, AlertLevel.CRITICAL, message);
        quota.criticalSent = true;
      }
    } else if (usagePercent >= 80) {
      status = KeyStatus.EXPIRING;
      alertLevel = AlertLevel.WARNING;
      message = `配额使用超过80%: ${usagePercent.toFixed(1)}% (${quota.usedToday}/${quota.dailyQuota})`;

      if (!quota.warningSent) {
        this.sendAlert(keyType, AlertLevel.WARNING, message);
        quota.warningSent = true;
      }
    } else if (usagePercent >= 50) {
      status = KeyStatus.NORMAL;
      alertLevel = AlertLevel.INFO;
      message = `配额使用过半: ${usagePercent.toFixed(1)}% (${quota.usedToday}/${quota.dailyQuota})`;
    }

    return {
      keyType,
      status,
      alertLevel,
      message,
      quota: new KeyQuotaInfo(keyType, quota.usedToday, quota.dailyQuota),
      resetTime: this.getNextResetTime()
    };
  }

  /**
   * 检查是否是新的一天
   */
  isNewDay (lastReset, now) {
    return lastReset.getDate() !== now.getDate() ||
           lastReset.getMonth() !== now.getMonth() ||
           lastReset.getFullYear() !== now.getFullYear();
  }

  /**
   * 重置每日配额
   */
  resetDailyQuota (keyType) {
    const quota = this.quotaData.get(keyType);
    quota.usedToday = 0;
    quota.lastResetTime = new Date().toISOString();
    quota.warningSent = false;
    quota.criticalSent = false;

    console.log(`[KeyExpirationMonitor] 已重置 ${keyType} 的每日配额`);
  }

  /**
   * 获取下次重置时间
   */
  getNextResetTime () {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  /**
   * 记录API调用
   * @param {string} keyType - 密钥类型
   * @param {boolean} success - 是否成功
   */
  recordApiCall (keyType, success = true) {
    const quota = this.quotaData.get(keyType);
    if (quota) {
      quota.usedToday++;

      // 实时检查是否需要发送预警
      this.checkKeyStatus(keyType);
    }
  }

  /**
   * 设置配额
   * @param {string} keyType - 密钥类型
   * @param {number} dailyQuota - 每日配额
   */
  setQuota (keyType, dailyQuota) {
    const quota = this.quotaData.get(keyType);
    if (quota) {
      quota.dailyQuota = dailyQuota;
      console.log(`[KeyExpirationMonitor] 已设置 ${keyType} 的每日配额为 ${dailyQuota}`);
    }
  }

  /**
   * 获取配额信息
   */
  getQuotaInfo (keyType = null) {
    if (keyType) {
      const quota = this.quotaData.get(keyType);
      if (quota) {
        return new KeyQuotaInfo(keyType, quota.usedToday, quota.dailyQuota, this.getNextResetTime());
      }
      return null;
    }

    const allQuotas = {};
    this.quotaData.forEach((quota, type) => {
      allQuotas[type] = new KeyQuotaInfo(type, quota.usedToday, quota.dailyQuota, this.getNextResetTime());
    });
    return allQuotas;
  }

  /**
   * 注册预警回调
   * @param {Function} callback - 回调函数 (keyType, alertLevel, message) => void
   */
  onAlert (callback) {
    this.alertCallbacks.push(callback);
  }

  /**
   * 移除预警回调
   */
  offAlert (callback) {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  /**
   * 发送预警
   */
  sendAlert (keyType, alertLevel, message) {
    const alert = {
      keyType,
      alertLevel,
      message,
      timestamp: new Date().toISOString()
    };

    console.log(`[KeyExpirationMonitor] [${alertLevel.toUpperCase()}] ${keyType}: ${message}`);

    // 调用所有注册的回调
    this.alertCallbacks.forEach(callback => {
      try {
        callback(keyType, alertLevel, message);
      } catch (error) {
        console.error('[KeyExpirationMonitor] 预警回调执行失败:', error);
      }
    });

    // 触发浏览器通知（如果用户允许）
    this.showNotification(alert);
  }

  /**
   * 显示浏览器通知
   */
  async showNotification (alert) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const title = this.getAlertTitle(alert.alertLevel);
      const options = {
        body: alert.message,
        icon: '/favicon.ico',
        tag: `key-alert-${alert.keyType}`,
        requireInteraction: alert.alertLevel === AlertLevel.CRITICAL
      };

      // eslint-disable-next-line no-new
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showNotification(alert);
      }
    }
  }

  /**
   * 获取预警标题
   */
  getAlertTitle (alertLevel) {
    const titles = {
      [AlertLevel.INFO]: 'ℹ️ API密钥信息',
      [AlertLevel.WARNING]: '⚠️ API密钥警告',
      [AlertLevel.CRITICAL]: '🚨 API密钥紧急提醒'
    };
    return titles[alertLevel] || 'API密钥提醒';
  }

  /**
   * 获取预警历史
   */
  getAlertHistory (keyType = null, limit = 50) {
    // 这里可以实现持久化存储的历史记录
    // 目前返回空数组，实际应用中可以存储到localStorage或后端
    return [];
  }

  /**
   * 导出监控报告
   */
  exportReport () {
    const quotaInfo = this.getQuotaInfo();
    const status = this.checkAllKeys();

    return {
      timestamp: new Date().toISOString(),
      quotas: quotaInfo,
      status,
      summary: {
        totalKeys: Object.keys(KeyType).length,
        nearLimit: status.filter(s => s.status === KeyStatus.EXPIRING).length,
        exceeded: status.filter(s => s.status === KeyStatus.EXPIRED).length
      }
    };
  }
}

// 创建单例实例
const keyExpirationMonitor = new KeyExpirationMonitor();

export default keyExpirationMonitor;
export { KeyExpirationMonitor, KeyQuotaInfo };
