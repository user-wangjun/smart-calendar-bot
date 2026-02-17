/**
 * 存储容量管理器
 * 监控存储使用情况，提供容量预警和自动清理功能
 */

import storageManager from './storageManager.js';

class CapacityManager {
  constructor () {
    // 存储限制配置
    this.limits = {
      localStorage: {
        total: 10 * 1024 * 1024, // 10MB（保持浏览器安全限制）
        warningThreshold: 0.8, // 80% 警告
        criticalThreshold: 0.95 // 95% 严重警告
      },
      indexedDB: {
        total: 500 * 1024 * 1024, // 500MB（大容量存储）
        warningThreshold: 0.8,
        criticalThreshold: 0.95
      }
    };

    // 数据保留策略
    this.retentionPolicy = {
      conversations: {
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90天
        maxCount: 10000 // 最大10000条
      },
      backgrounds: {
        maxAge: 180 * 24 * 60 * 60 * 1000, // 180天
        maxCount: 20 // 最大20张
      },
      events: {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1年
        maxCount: 1000 // 最大1000个事件
      },
      locations: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
        maxCount: 10 // 最大10个位置
      },
      weather: {
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1天
        maxCount: 5 // 最大5个天气记录
      }
    };

    // 清理统计
    this.cleanupStats = {
      lastCleanup: null,
      cleanupCount: 0,
      dataFreed: 0
    };

    this.init();
  }

  /**
   * 初始化容量管理器
   */
  async init () {
    console.log('初始化存储容量管理器...');

    // 检查初始容量
    const usage = await this.checkCapacity();
    this.logCapacityStatus(usage);

    // 设置定期清理任务（每24小时）
    this.schedulePeriodicCleanup();

    // 监听存储事件
    this.setupStorageMonitoring();
  }

  /**
   * 检查存储容量
   * @returns {Promise<Object>} - 容量使用情况
   */
  async checkCapacity () {
    const localStorageUsage = this.getLocalStorageUsage();
    const indexedDBUsage = await this.getIndexedDBUsage();

    return {
      localStorage: localStorageUsage,
      indexedDB: indexedDBUsage,
      total: {
        used: localStorageUsage.used + indexedDBUsage.used,
        limit: localStorageUsage.limit + indexedDBUsage.limit,
        percentage: (localStorageUsage.used + indexedDBUsage.used) /
                   (localStorageUsage.limit + indexedDBUsage.limit)
      }
    };
  }

  /**
   * 获取 localStorage 使用情况
   * @returns {Object} - 使用统计
   */
  getLocalStorageUsage () {
    let used = 0;
    let itemCount = 0;

    try {
      for (const key in localStorage) {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        used += size;
        itemCount++;
      }
    } catch (error) {
      console.error('计算 localStorage 使用量失败:', error);
    }

    const limit = this.limits.localStorage.total;
    const percentage = (used / limit) * 100;

    return {
      used,
      limit,
      percentage,
      itemCount,
      warning: percentage >= this.limits.localStorage.warningThreshold,
      critical: percentage >= this.limits.localStorage.criticalThreshold,
      formatted: this.formatBytes(used),
      formattedLimit: this.formatBytes(limit)
    };
  }

  /**
   * 获取 IndexedDB 使用情况
   * @returns {Promise<Object>} - 使用统计
   */
  async getIndexedDBUsage () {
    if (!storageManager.db) {
      return {
        used: 0,
        limit: this.limits.indexedDB.total,
        percentage: 0,
        itemCount: 0,
        warning: false,
        critical: false,
        formatted: '0 B',
        formattedLimit: this.formatBytes(this.limits.indexedDB.total)
      };
    }

    return new Promise((resolve) => {
      const stores = ['conversations', 'backgrounds', 'locations', 'weather'];
      let totalSize = 0;
      let totalItems = 0;
      let processed = 0;

      stores.forEach(storeName => {
        const transaction = storageManager.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAllKeys();

        request.onsuccess = () => {
          const keys = request.result;
          // 估算每条记录约 1KB
          totalSize += keys.length * 1024;
          totalItems += keys.length;
          processed++;

          if (processed === stores.length) {
            const limit = this.limits.indexedDB.total;
            const percentage = (totalSize / limit) * 100;

            resolve({
              used: totalSize,
              limit,
              percentage,
              itemCount: totalItems,
              warning: percentage >= this.limits.indexedDB.warningThreshold,
              critical: percentage >= this.limits.indexedDB.criticalThreshold,
              formatted: this.formatBytes(totalSize),
              formattedLimit: this.formatBytes(limit)
            });
          }
        };

        request.onerror = () => {
          console.error(`获取 ${storeName} 使用量失败`);
          processed++;

          if (processed === stores.length) {
            resolve({
              used: totalSize,
              limit: this.limits.indexedDB.total,
              percentage: 0,
              itemCount: totalItems,
              warning: false,
              critical: false,
              formatted: this.formatBytes(totalSize),
              formattedLimit: this.formatBytes(this.limits.indexedDB.total)
            });
          }
        };
      });
    });
  }

  /**
   * 格式化字节数
   * @param {number} bytes - 字节数
   * @returns {string} - 格式化后的字符串
   */
  formatBytes (bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 记录容量状态
   * @param {Object} usage - 使用情况
   */
  logCapacityStatus (usage) {
    console.log('=== 存储容量状态 ===');
    console.log(`localStorage: ${usage.localStorage.formatted} / ${usage.localStorage.formattedLimit} (${usage.localStorage.percentage.toFixed(1)}%)`);
    console.log(`IndexedDB: ${usage.indexedDB.formatted} / ${usage.indexedDB.formattedLimit} (${usage.indexedDB.percentage.toFixed(1)}%)`);
    console.log(`总计: ${usage.total.formatted} / ${usage.total.formattedLimit} (${usage.total.percentage.toFixed(1)}%)`);
    console.log('====================');

    // 检查是否需要警告
    if (usage.localStorage.warning || usage.indexedDB.warning) {
      this.showCapacityWarning(usage);
    }

    if (usage.localStorage.critical || usage.indexedDB.critical) {
      this.showCriticalWarning(usage);
    }
  }

  /**
   * 显示容量警告
   * @param {Object} usage - 使用情况
   */
  showCapacityWarning (usage) {
    const message = `存储空间使用率已达到 ${usage.total.percentage.toFixed(0)}%，建议清理旧数据以释放空间`;
    console.warn(message);

    // 触发警告事件
    storageManager.emit('capacity:warning', {
      level: 'warning',
      usage,
      message
    });

    // 可以在这里添加Toast通知
    // this.showToast(message, 'warning');
  }

  /**
   * 显示严重警告
   * @param {Object} usage - 使用情况
   */
  showCriticalWarning (usage) {
    const message = `存储空间严重不足！使用率 ${usage.total.percentage.toFixed(0)}%，请立即清理数据`;
    console.error(message);

    // 触发严重警告事件
    storageManager.emit('capacity:critical', {
      level: 'critical',
      usage,
      message
    });

    // 可以在这里添加紧急Toast通知
    // this.showToast(message, 'error');
  }

  /**
   * 设置定期清理任务
   */
  schedulePeriodicCleanup () {
    // 每24小时执行一次清理
    const cleanupInterval = 24 * 60 * 60 * 1000; // 24小时

    setInterval(async () => {
      await this.performCleanup();
    }, cleanupInterval);

    console.log('已设置定期清理任务，间隔：24小时');
  }

  /**
   * 执行清理操作
   * @returns {Promise<Object>} - 清理结果
   */
  async performCleanup () {
    console.log('开始执行清理任务...');

    const startTime = Date.now();
    const results = {
      conversations: { removed: 0, freed: 0 },
      backgrounds: { removed: 0, freed: 0 },
      events: { removed: 0, freed: 0 },
      locations: { removed: 0, freed: 0 },
      weather: { removed: 0, freed: 0 },
      total: { removed: 0, freed: 0 }
    };

    // 清理对话数据
    results.conversations = await this.cleanupConversations();

    // 清理背景数据
    results.backgrounds = await this.cleanupBackgrounds();

    // 清理事件数据
    results.events = await this.cleanupEvents();

    // 清理位置数据
    results.locations = await this.cleanupLocations();

    // 清理天气数据
    results.weather = await this.cleanupWeather();

    // 计算总计
    results.total.removed =
      results.conversations.removed +
      results.backgrounds.removed +
      results.events.removed +
      results.locations.removed +
      results.weather.removed;

    results.total.freed =
      results.conversations.freed +
      results.backgrounds.freed +
      results.events.freed +
      results.locations.freed +
      results.weather.freed;

    const duration = Date.now() - startTime;

    // 更新统计
    this.cleanupStats.lastCleanup = new Date().toISOString();
    this.cleanupStats.cleanupCount++;
    this.cleanupStats.dataFreed += results.total.freed;

    console.log('清理完成:', {
      removed: results.total.removed,
      freed: this.formatBytes(results.total.freed),
      duration: `${duration}ms`
    });

    // 记录清理统计
    this.saveCleanupStats();

    // 检查清理后的容量
    const newUsage = await this.checkCapacity();
    this.logCapacityStatus(newUsage);

    return results;
  }

  /**
   * 清理对话数据
   * @returns {Promise<Object>} - 清理结果
   */
  async cleanupConversations () {
    const policy = this.retentionPolicy.conversations;
    const now = Date.now();

    return new Promise((resolve) => {
      if (!storageManager.db) {
        resolve({ removed: 0, freed: 0 });
        return;
      }

      const transaction = storageManager.db.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result;
        let removed = 0;
        let freed = 0;

        keys.forEach(key => {
          const getRequest = store.get(key);
          getRequest.onsuccess = () => {
            const record = getRequest.result;

            // 检查是否需要删除
            if (record && record.data) {
              const timestamp = new Date(record.data.timestamp).getTime();
              const age = now - timestamp;

              // 删除过期数据
              if (age > policy.maxAge) {
                store.delete(key);
                removed++;
                freed += 1024; // 估算每条记录1KB
              }
            }
          };
        });

        transaction.oncomplete = () => {
          resolve({ removed, freed });
        };
      };

      request.onerror = () => {
        console.error('清理对话数据失败');
        resolve({ removed: 0, freed: 0 });
      };
    });
  }

  /**
   * 清理背景数据
   * @returns {Promise<Object>} - 清理结果
   */
  async cleanupBackgrounds () {
    const policy = this.retentionPolicy.backgrounds;
    const now = Date.now();

    return new Promise((resolve) => {
      if (!storageManager.db) {
        resolve({ removed: 0, freed: 0 });
        return;
      }

      const transaction = storageManager.db.transaction(['backgrounds'], 'readwrite');
      const store = transaction.objectStore('backgrounds');
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result;
        let removed = 0;
        let freed = 0;

        keys.forEach(key => {
          const getRequest = store.get(key);
          getRequest.onsuccess = () => {
            const record = getRequest.result;

            if (record && record.data) {
              const timestamp = new Date(record.data.addedAt).getTime();
              const age = now - timestamp;

              // 删除过期数据
              if (age > policy.maxAge) {
                store.delete(key);
                removed++;
                freed += 50 * 1024; // 估算每张图片50KB
              }
            }
          };
        });

        transaction.oncomplete = () => {
          resolve({ removed, freed });
        };
      };

      request.onerror = () => {
        console.error('清理背景数据失败');
        resolve({ removed: 0, freed: 0 });
      };
    });
  }

  /**
   * 清理事件数据
   * @returns {Promise<Object>} - 清理结果
   */
  async cleanupEvents () {
    const policy = this.retentionPolicy.events;
    const now = Date.now();

    return new Promise((resolve) => {
      const transaction = storageManager.db.transaction(['conversations'], 'readwrite');
      const store = transaction.objectStore('conversations');
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result;
        let removed = 0;
        let freed = 0;

        keys.forEach(key => {
          if (key.startsWith('event_')) {
            const getRequest = store.get(key);
            getRequest.onsuccess = () => {
              const record = getRequest.result;

              if (record && record.data) {
                const timestamp = new Date(record.data.createdAt).getTime();
                const age = now - timestamp;

                // 删除过期数据
                if (age > policy.maxAge) {
                  store.delete(key);
                  removed++;
                  freed += 2 * 1024; // 估算每个事件2KB
                }
              }
            };
          }
        });

        transaction.oncomplete = () => {
          resolve({ removed, freed });
        };
      };

      request.onerror = () => {
        console.error('清理事件数据失败');
        resolve({ removed: 0, freed: 0 });
      };
    });
  }

  /**
   * 清理位置数据
   * @returns {Promise<Object>} - 清理结果
   */
  async cleanupLocations () {
    const policy = this.retentionPolicy.locations;
    const now = Date.now();

    return new Promise((resolve) => {
      if (!storageManager.db) {
        resolve({ removed: 0, freed: 0 });
        return;
      }

      const transaction = storageManager.db.transaction(['locations'], 'readwrite');
      const store = transaction.objectStore('locations');
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result;
        let removed = 0;
        let freed = 0;

        keys.forEach(key => {
          const getRequest = store.get(key);
          getRequest.onsuccess = () => {
            const record = getRequest.result;

            if (record && record.data) {
              const timestamp = new Date(record.data.timestamp).getTime();
              const age = now - timestamp;

              // 删除过期数据
              if (age > policy.maxAge) {
                store.delete(key);
                removed++;
                freed += 1 * 1024; // 估算每个位置1KB
              }
            }
          };
        });

        transaction.oncomplete = () => {
          resolve({ removed, freed });
        };
      };

      request.onerror = () => {
        console.error('清理位置数据失败');
        resolve({ removed: 0, freed: 0 });
      };
    });
  }

  /**
   * 清理天气数据
   * @returns {Promise<Object>} - 清理结果
   */
  async cleanupWeather () {
    const policy = this.retentionPolicy.weather;
    const now = Date.now();

    return new Promise((resolve) => {
      if (!storageManager.db) {
        resolve({ removed: 0, freed: 0 });
        return;
      }

      const transaction = storageManager.db.transaction(['weather'], 'readwrite');
      const store = transaction.objectStore('weather');
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result;
        let removed = 0;
        let freed = 0;

        keys.forEach(key => {
          const getRequest = store.get(key);
          getRequest.onsuccess = () => {
            const record = getRequest.result;

            if (record && record.data) {
              const timestamp = new Date(record.data.timestamp).getTime();
              const age = now - timestamp;

              // 删除过期数据
              if (age > policy.maxAge) {
                store.delete(key);
                removed++;
                freed += 2 * 1024; // 估算每个天气记录2KB
              }
            }
          };
        });

        transaction.oncomplete = () => {
          resolve({ removed, freed });
        };
      };

      request.onerror = () => {
        console.error('清理天气数据失败');
        resolve({ removed: 0, freed: 0 });
      };
    });
  }

  /**
   * 设置存储监控
   */
  setupStorageMonitoring () {
    // 监听存储更新事件
    storageManager.on('storage:updated', async (data) => {
      const usage = await this.checkCapacity();

      if (usage.total.warning) {
        this.showCapacityWarning(usage);
      }

      if (usage.total.critical) {
        this.showCriticalWarning(usage);
      }
    });

    // 监听存储删除事件
    storageManager.on('storage:removed', async (data) => {
      console.log(`数据已删除: ${data.key}`);
    });
  }

  /**
   * 保存清理统计
   */
  saveCleanupStats () {
    const stats = {
      lastCleanup: this.cleanupStats.lastCleanup,
      cleanupCount: this.cleanupStats.cleanupCount,
      dataFreed: this.cleanupStats.dataFreed
    };

    localStorage.setItem('cleanup_stats', JSON.stringify(stats));
  }

  /**
   * 获取清理统计
   * @returns {Object} - 清理统计
   */
  getCleanupStats () {
    try {
      const stats = JSON.parse(localStorage.getItem('cleanup_stats') || '{}');
      return stats;
    } catch (error) {
      console.error('获取清理统计失败:', error);
      return {
        lastCleanup: null,
        cleanupCount: 0,
        dataFreed: 0
      };
    }
  }

  /**
   * 手动触发清理
   * @returns {Promise<Object>} - 清理结果
   */
  async manualCleanup () {
    console.log('手动触发清理...');
    return await this.performCleanup();
  }

  /**
   * 获取优化建议
   * @returns {Promise<Array>} - 优化建议列表
   */
  async getOptimizationSuggestions () {
    const usage = await this.checkCapacity();
    const suggestions = [];

    // 基于使用情况提供建议
    if (usage.total.percentage > 90) {
      suggestions.push({
        type: 'critical',
        priority: 'high',
        message: '存储空间严重不足，建议立即清理旧数据',
        action: '立即清理'
      });
    } else if (usage.total.percentage > 75) {
      suggestions.push({
        type: 'warning',
        priority: 'medium',
        message: '存储空间使用率较高，建议定期清理',
        action: '清理数据'
      });
    }

    // 检查数据类型分布
    if (usage.localStorage.percentage > usage.indexedDB.percentage * 1.5) {
      suggestions.push({
        type: 'optimization',
        priority: 'medium',
        message: 'localStorage 使用率明显高于 IndexedDB，建议将部分数据迁移到 IndexedDB',
        action: '迁移数据'
      });
    }

    // 检查是否有过期数据
    const hasExpiredData = await this.hasExpiredData();
    if (hasExpiredData) {
      suggestions.push({
        type: 'cleanup',
        priority: 'low',
        message: '检测到过期数据，建议执行清理',
        action: '清理过期数据'
      });
    }

    return suggestions;
  }

  /**
   * 检查是否有过期数据
   * @returns {Promise<boolean>} - 是否有过期数据
   */
  async hasExpiredData () {
    // 检查对话数据
    const hasExpiredConversations = await this.checkExpiredData('conversations',
      this.retentionPolicy.conversations.maxAge);

    // 检查背景数据
    const hasExpiredBackgrounds = await this.checkExpiredData('backgrounds',
      this.retentionPolicy.backgrounds.maxAge);

    // 检查事件数据
    const hasExpiredEvents = await this.checkExpiredData('conversations',
      this.retentionPolicy.events.maxAge, 'event_');

    // 检查位置数据
    const hasExpiredLocations = await this.checkExpiredData('locations',
      this.retentionPolicy.locations.maxAge);

    // 检查天气数据
    const hasExpiredWeather = await this.checkExpiredData('weather',
      this.retentionPolicy.weather.maxAge);

    return hasExpiredConversations || hasExpiredBackgrounds ||
           hasExpiredEvents || hasExpiredLocations || hasExpiredWeather;
  }

  /**
   * 检查指定存储的过期数据
   * @param {string} storeName - 存储名称
   * @param {number} maxAge - 最大年龄
   * @param {string} keyPrefix - 键前缀（可选）
   * @returns {Promise<boolean>} - 是否有过期数据
   */
  async checkExpiredData (storeName, maxAge, keyPrefix = '') {
    return new Promise((resolve) => {
      if (!storageManager.db) {
        resolve(false);
        return;
      }

      const transaction = storageManager.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const keys = request.result;
        const now = Date.now();
        let hasExpired = false;

        for (const key of keys) {
          if (!keyPrefix || key.startsWith(keyPrefix)) {
            const getRequest = store.get(key);
            getRequest.onsuccess = () => {
              const record = getRequest.result;

              if (record && record.data) {
                const timestamp = new Date(record.data.timestamp).getTime();
                const age = now - timestamp;

                if (age > maxAge) {
                  hasExpired = true;
                  // 找到过期数据，可以停止检查
                }
              }
            };

            if (hasExpired) break;
          }
        }

        resolve(hasExpired);
      };

      request.onerror = () => {
        console.error(`检查 ${storeName} 过期数据失败`);
        resolve(false);
      };
    });
  }

  /**
   * 获取容量报告
   * @returns {Promise<Object>} - 容量报告
   */
  async getCapacityReport () {
    const usage = await this.checkCapacity();
    const stats = this.getCleanupStats();
    const suggestions = await this.getOptimizationSuggestions();

    return {
      timestamp: new Date().toISOString(),
      usage,
      cleanupStats: stats,
      suggestions,
      summary: this.generateSummary(usage, stats, suggestions)
    };
  }

  /**
   * 生成摘要
   * @param {Object} usage - 使用情况
   * @param {Object} stats - 清理统计
   * @param {Array} suggestions - 优化建议
   * @returns {string} - 摘要文本
   */
  generateSummary (usage, stats, suggestions) {
    const lines = [];

    lines.push('=== 存储容量报告 ===');
    lines.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push('');

    lines.push('存储使用情况:');
    lines.push(`  localStorage: ${usage.localStorage.formatted} / ${usage.localStorage.formattedLimit} (${usage.localStorage.percentage.toFixed(1)}%)`);
    lines.push(`  IndexedDB: ${usage.indexedDB.formatted} / ${usage.indexedDB.formattedLimit} (${usage.indexedDB.percentage.toFixed(1)}%)`);
    lines.push(`  总计: ${usage.total.formatted} / ${usage.total.formattedLimit} (${usage.total.percentage.toFixed(1)}%)`);
    lines.push('');

    lines.push('清理统计:');
    lines.push(`  最后清理: ${stats.lastCleanup ? new Date(stats.lastCleanup).toLocaleString('zh-CN') : '从未执行'}`);
    lines.push(`  清理次数: ${stats.cleanupCount}`);
    lines.push(`  释放空间: ${this.formatBytes(stats.dataFreed)}`);
    lines.push('');

    if (suggestions.length > 0) {
      lines.push('优化建议:');
      suggestions.forEach((suggestion, index) => {
        const priorityIcon = suggestion.priority === 'high'
          ? '🔴'
          : suggestion.priority === 'medium' ? '🟡' : '🟢';
        lines.push(`  ${index + 1}. [${priorityIcon}] ${suggestion.message}`);
        lines.push(`     建议: ${suggestion.action}`);
      });
    }

    return lines.join('\n');
  }
}

// 创建全局单例
const capacityManager = new CapacityManager();

export default capacityManager;
