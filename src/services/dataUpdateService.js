/**
 * 数据更新服务
 * 提供统一的数据更新接口，支持变更监听和自动同步
 */

import storageManager from '../storage/storageManager.js';
import cloudSyncService from './cloudSyncService.js';

class DataUpdateService {
  constructor () {
    // 数据类型定义
    this.dataTypes = {
      events: 'events',
      conversations: 'conversations',
      backgrounds: 'backgrounds',
      userProfile: 'user_profile',
      preferences: 'preferences',
      apiKeys: 'api_keys'
    };

    // 更新队列
    this.updateQueue = [];
    this.isProcessing = false;
    this.maxQueueSize = 100;

    // 同步配置
    this.syncConfig = {
      enabled: false,
      interval: 5 * 60 * 1000, // 5分钟
      autoSync: true,
      conflictResolution: 'last-write-wins' // 'merge', 'manual'
    };

    // 更新统计
    this.updateStats = {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      lastSyncTime: null
    };

    this.init();
  }

  /**
   * 初始化更新服务
   */
  async init () {
    console.log('初始化数据更新服务...');

    // 加载更新统计
    await this.loadUpdateStats();

    // 设置自动同步
    if (this.syncConfig.autoSync) {
      this.setupAutoSync();
    }

    // 设置更新队列处理
    this.setupQueueProcessor();
  }

  /**
   * 更新数据
   * @param {string} type - 数据类型
   * @param {string} id - 数据ID
   * @param {Object} data - 更新的数据
   * @param {Object} options - 更新选项
   * @returns {Promise<Object>} - 更新结果
   */
  async updateData (type, id, data, options = {}) {
    const {
      notify = true,
      // sync = true,
      timestamp = Date.now()
    } = options;

    try {
      // 添加到更新队列
      const updateItem = {
        type,
        id,
        data,
        options,
        timestamp,
        status: 'pending'
      };

      this.updateQueue.push(updateItem);

      // 触发队列处理
      this.processQueue();

      // 触发更新事件
      if (notify) {
        this.emitUpdateEvent(type, id, data, 'pending');
      }

      return {
        success: true,
        updateId: this.generateUpdateId(),
        message: '更新已加入队列'
      };
    } catch (error) {
      console.error('更新数据失败:', error);
      this.updateStats.failedUpdates++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 批量更新数据
   * @param {string} type - 数据类型
   * @param {Array} updates - 更新数据数组
   * @param {Object} options - 更新选项
   * @returns {Promise<Object>} - 更新结果
   */
  async batchUpdate (type, updates, options = {}) {
    const {
      notify = true
      // sync = true
    } = options;

    try {
      // 验证数据类型
      if (!this.dataTypes[type]) {
        return {
          success: false,
          error: `未知的数据类型: ${type}`
        };
      }

      // 添加批量更新到队列
      const batchId = this.generateBatchId();
      const timestamp = Date.now();

      for (const update of updates) {
        this.updateQueue.push({
          type,
          id: update.id,
          data: update.data,
          options: { ...options, batchId },
          timestamp,
          status: 'pending'
        });
      }

      // 触发队列处理
      this.processQueue();

      // 触发批量更新事件
      if (notify) {
        this.emitBatchUpdateEvent(type, batchId, updates.length);
      }

      return {
        success: true,
        batchId,
        count: updates.length,
        message: `批量更新已加入队列（${updates.length}项）`
      };
    } catch (error) {
      console.error('批量更新失败:', error);
      this.updateStats.failedUpdates += updates.length;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 删除数据
   * @param {string} type - 数据类型
   * @param {string} id - 数据ID
   * @param {Object} options - 删除选项
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteData (type, id, options = {}) {
    const {
      notify = true
      // sync = true
    } = options;

    try {
      // 添加到更新队列
      const updateItem = {
        type,
        id,
        data: null,
        options: { ...options, operation: 'delete' },
        timestamp: Date.now(),
        status: 'pending'
      };

      this.updateQueue.push(updateItem);

      // 触发队列处理
      this.processQueue();

      // 触发删除事件
      if (notify) {
        this.emitDeleteEvent(type, id);
      }

      return {
        success: true,
        updateId: this.generateUpdateId(),
        message: '删除已加入队列'
      };
    } catch (error) {
      console.error('删除数据失败:', error);
      this.updateStats.failedUpdates++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 处理更新队列
   */
  async processQueue () {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // 处理队列中的所有更新
      while (this.updateQueue.length > 0) {
        const updateItem = this.updateQueue.shift();

        const result = await this.executeUpdate(updateItem);

        // 更新状态
        updateItem.status = result.success ? 'completed' : 'failed';
        updateItem.result = result;

        // 触发完成事件
        if (result.success) {
          this.emitUpdateEvent(
            updateItem.type,
            updateItem.id,
            updateItem.data,
            'completed'
          );

          // 如果启用了同步，执行同步
          if (updateItem.options.sync !== false) {
            await this.syncUpdate(updateItem);
          }

          this.updateStats.successfulUpdates++;
        } else {
          this.emitUpdateEvent(
            updateItem.type,
            updateItem.id,
            updateItem.data,
            'failed'
          );

          this.updateStats.failedUpdates++;
        }
      }

      // 保存更新统计
      await this.saveUpdateStats();
    } catch (error) {
      console.error('处理更新队列失败:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 执行单个更新
   * @param {Object} updateItem - 更新项
   * @returns {Promise<Object>} - 执行结果
   */
  async executeUpdate (updateItem) {
    const { type, id, data, options } = updateItem;

    try {
      // 根据数据类型选择存储方式
      const storageType = this.selectStorageType(type, data);

      // 执行更新操作
      if (options.operation === 'delete') {
        await storageManager.remove(`${type}_${id}`);
        return { success: true, message: '删除成功' };
      } else {
        await storageManager.store(`${type}_${id}`, data, { storageType });
        return { success: true, message: '更新成功' };
      }
    } catch (error) {
      console.error(`执行更新失败 [${type}_${id}]:`, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 选择存储类型
   * @param {string} type - 数据类型
   * @param {any} data - 数据
   * @returns {string} - 存储类型
   */
  selectStorageType (type, data) {
    // 大数据使用IndexedDB
    if (data && this.isLargeData(data)) {
      return 'indexedDB';
    }

    // 对话数据使用IndexedDB
    if (type === this.dataTypes.conversations) {
      return 'indexedDB';
    }

    // 背景数据使用IndexedDB
    if (type === this.dataTypes.backgrounds) {
      return 'indexedDB';
    }

    // 其他数据使用localStorage
    return 'localStorage';
  }

  /**
   * 判断是否为大数据
   * @param {any} data - 数据
   * @returns {boolean} - 是否为大数据
   */
  isLargeData (data) {
    if (!data) return false;

    // 计算数据大小
    let size = 0;

    if (typeof data === 'string') {
      size = new Blob([data]).size;
    } else if (typeof data === 'object') {
      size = new Blob([JSON.stringify(data)]).size;
    } else {
      size = new Blob([String(data)]).size;
    }

    // 大于 10KB 视为大数据
    return size > 10 * 1024;
  }

  /**
   * 同步更新到云端
   * @param {Object} updateItem - 更新项
   * @returns {Promise<Object>} - 同步结果
   */
  async syncUpdate (updateItem) {
    if (!this.syncConfig.enabled) {
      return { success: true, message: '同步未启用' };
    }

    try {
      // 调用云同步服务
      const syncResult = await this.callCloudSync({
        type: updateItem.type,
        id: updateItem.id,
        data: updateItem.data,
        operation: updateItem.options.operation || 'update',
        timestamp: updateItem.timestamp
      });

      return syncResult;
    } catch (error) {
      console.error('云同步失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 调用云同步服务
   * @param {Object} syncData - 同步数据
   * @returns {Promise<Object>} - 同步结果
   */
  async callCloudSync (syncData) {
    // 检查云同步服务是否可用
    if (typeof cloudSyncService === 'undefined') {
      return { success: true, message: '云同步服务不可用，跳过' };
    }

    return await cloudSyncService.syncData(syncData);
  }

  /**
   * 设置自动同步
   */
  setupAutoSync () {
    if (!this.syncConfig.autoSync) {
      return;
    }

    // 清除旧的同步定时器
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // 设置新的同步定时器
    this.syncTimer = setInterval(async () => {
      await this.performAutoSync();
    }, this.syncConfig.interval);

    console.log(`已设置自动同步，间隔：${this.syncConfig.interval / 1000 / 60}分钟`);
  }

  /**
   * 执行自动同步
   */
  async performAutoSync () {
    try {
      // 检查是否有待同步的数据
      if (this.updateQueue.length === 0) {
        return;
      }

      console.log('执行自动同步...');

      // 同步所有待更新的数据
      for (const updateItem of this.updateQueue) {
        if (updateItem.status === 'pending') {
          await this.syncUpdate(updateItem);
        }
      }

      // 更新最后同步时间
      this.updateStats.lastSyncTime = new Date().toISOString();
      await this.saveUpdateStats();
    } catch (error) {
      console.error('自动同步失败:', error);
    }
  }

  /**
   * 停止自动同步
   */
  stopAutoSync () {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('自动同步已停止');
    }
  }

  /**
   * 设置队列处理器
   */
  setupQueueProcessor () {
    // 监听存储事件，触发队列处理
    storageManager.on('storage:updated', () => {
      this.processQueue();
    });

    // 设置定期队列处理（每5秒）
    setInterval(() => {
      if (this.updateQueue.length > 0 && !this.isProcessing) {
        this.processQueue();
      }
    }, 5000);
  }

  /**
   * 触发更新事件
   * @param {string} type - 数据类型
   * @param {string} id - 数据ID
   * @param {any} data - 数据
   * @param {string} status - 状态
   */
  emitUpdateEvent (type, id, data, status) {
    storageManager.emit('data:updated', {
      type,
      id,
      data,
      status,
      timestamp: Date.now()
    });
  }

  /**
   * 触发批量更新事件
   * @param {string} type - 数据类型
   * @param {string} batchId - 批次ID
   * @param {number} count - 更新数量
   */
  emitBatchUpdateEvent (type, batchId, count) {
    storageManager.emit('data:batch_updated', {
      type,
      batchId,
      count,
      timestamp: Date.now()
    });
  }

  /**
   * 触发删除事件
   * @param {string} type - 数据类型
   * @param {string} id - 数据ID
   */
  emitDeleteEvent (type, id) {
    storageManager.emit('data:deleted', {
      type,
      id,
      timestamp: Date.now()
    });
  }

  /**
   * 生成更新ID
   * @returns {string} - 更新ID
   */
  generateUpdateId () {
    return `update_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * 生成批次ID
   * @returns {string} - 批次ID
   */
  generateBatchId () {
    return `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * 保存更新统计
   */
  async saveUpdateStats () {
    const stats = {
      totalUpdates: this.updateStats.totalUpdates,
      successfulUpdates: this.updateStats.successfulUpdates,
      failedUpdates: this.updateStats.failedUpdates,
      lastSyncTime: this.updateStats.lastSyncTime,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem('update_stats', JSON.stringify(stats));
  }

  /**
   * 加载更新统计
   */
  async loadUpdateStats () {
    try {
      const stats = JSON.parse(localStorage.getItem('update_stats') || '{}');
      this.updateStats = {
        totalUpdates: stats.totalUpdates || 0,
        successfulUpdates: stats.successfulUpdates || 0,
        failedUpdates: stats.failedUpdates || 0,
        lastSyncTime: stats.lastSyncTime || null
      };
    } catch (error) {
      console.error('加载更新统计失败:', error);
    }
  }

  /**
   * 获取更新统计
   * @returns {Object>} - 更新统计
   */
  getUpdateStats () {
    return {
      ...this.updateStats,
      queueSize: this.updateQueue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * 清空更新队列
   */
  clearQueue () {
    this.updateQueue = [];
    console.log('更新队列已清空');
  }

  /**
   * 获取队列状态
   * @returns {Object>} - 队列状态
   */
  getQueueStatus () {
    return {
      size: this.updateQueue.length,
      isProcessing: this.isProcessing,
      pending: this.updateQueue.filter(item => item.status === 'pending').length,
      completed: this.updateQueue.filter(item => item.status === 'completed').length,
      failed: this.updateQueue.filter(item => item.status === 'failed').length
    };
  }

  /**
   * 设置同步配置
   * @param {Object} config - 同步配置
   */
  setSyncConfig (config) {
    this.syncConfig = {
      ...this.syncConfig,
      ...config
    };

    // 保存配置
    localStorage.setItem('sync_config', JSON.stringify(this.syncConfig));

    // 如果配置改变，重新设置自动同步
    if (config.autoSync !== undefined) {
      this.setupAutoSync();
    }

    console.log('同步配置已更新:', this.syncConfig);
  }

  /**
   * 获取同步配置
   * @returns {Object>} - 同步配置
   */
  getSyncConfig () {
    try {
      const config = JSON.parse(localStorage.getItem('sync_config') || '{}');
      return {
        ...this.syncConfig,
        ...config
      };
    } catch (error) {
      console.error('加载同步配置失败:', error);
      return this.syncConfig;
    }
  }

  /**
   * 强制同步所有数据
   * @returns {Promise<Object>} - 同步结果
   */
  async forceSync () {
    console.log('开始强制同步...');

    try {
      // 收集所有数据
      const allData = await this.collectAllData();

      // 上传到云端
      const syncResult = await this.callCloudSync({
        type: 'all',
        data: allData,
        operation: 'sync',
        timestamp: Date.now()
      });

      // 更新统计
      this.updateStats.lastSyncTime = new Date().toISOString();
      await this.saveUpdateStats();

      return syncResult;
    } catch (error) {
      console.error('强制同步失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 收集所有数据
   * @returns {Promise<Object>} - 所有数据
   */
  async collectAllData () {
    const data = {
      events: await storageManager.retrieve(this.dataTypes.events, { skipCache: true }),
      conversations: await storageManager.retrieve(this.dataTypes.conversations, { skipCache: true }),
      backgrounds: await storageManager.retrieve(this.dataTypes.backgrounds, { skipCache: true }),
      userProfile: await storageManager.retrieve(this.dataTypes.userProfile, { skipCache: true }),
      preferences: await storageManager.retrieve(this.dataTypes.preferences, { skipCache: true }),
      apiKeys: await storageManager.retrieve(this.dataTypes.apiKeys, { skipCache: true })
    };

    return data;
  }

  /**
   * 注册数据更新监听器
   * @param {string} type - 数据类型
   * @param {Function} callback - 回调函数
   */
  onDataUpdate (type, callback) {
    storageManager.on('data:updated', (event) => {
      if (event.type === type) {
        callback(event);
      }
    });
  }

  /**
   * 注册数据删除监听器
   * @param {string} type - 数据类型
   * @param {Function} callback - 回调函数
   */
  onDataDelete (type, callback) {
    storageManager.on('data:deleted', (event) => {
      if (event.type === type) {
        callback(event);
      }
    });
  }

  /**
   * 注册批量更新监听器
   * @param {string} type - 数据类型
   * @param {Function} callback - 回调函数
   */
  onBatchUpdate (type, callback) {
    storageManager.on('data:batch_updated', (event) => {
      if (event.type === type) {
        callback(event);
      }
    });
  }
}

// 创建全局单例
const dataUpdateService = new DataUpdateService();

export default dataUpdateService;
