/**
 * 数据版本管理器
 * 负责数据版本控制、迁移和向后兼容性管理
 */

import storageManager from './storageManager.js';

class VersionManager {
  constructor () {
    // 当前应用版本
    this.currentVersion = '2.0.0';

    // 数据版本历史
    this.versionHistory = {
      '1.0.0': {
        releaseDate: '2024-01-01',
        description: '初始版本',
        breakingChanges: false
      },
      '1.1.0': {
        releaseDate: '2024-06-01',
        description: '添加对话存储',
        breakingChanges: false
      },
      '1.2.0': {
        releaseDate: '2024-09-01',
        description: '添加背景管理',
        breakingChanges: false
      },
      '2.0.0': {
        releaseDate: '2026-01-24',
        description: '系统性重构，统一存储架构',
        breakingChanges: true
      }
    };

    // 数据迁移策略
    this.migrationStrategies = {
      '1.0.0->1.1.0': this.migrateToV1_1_0.bind(this),
      '1.1.0->1.2.0': this.migrateToV1_2_0.bind(this),
      '1.2.0->2.0.0': this.migrateToV2_0_0.bind(this)
    };

    // 数据结构定义
    this.dataSchemas = {
      '2.0.0': {
        events: {
          id: 'UUID',
          title: { type: 'string', required: true, maxLength: 200 },
          startDate: { type: 'datetime', required: true },
          endDate: { type: 'datetime', required: true },
          description: { type: 'string', required: false, maxLength: 1000 },
          location: { type: 'string', required: false },
          reminderTime: { type: 'number', required: false },
          reminderMethods: { type: 'array', required: false, items: { type: 'string' } },
          createdAt: { type: 'datetime', required: true },
          updatedAt: { type: 'datetime', required: true }
        },
        conversations: {
          id: 'UUID',
          conversationId: { type: 'UUID', required: true },
          role: { type: 'string', required: true, enum: ['user', 'assistant'] },
          content: { type: 'string', required: true, maxLength: 10000 },
          timestamp: { type: 'datetime', required: true },
          model: { type: 'string', required: false },
          metadata: { type: 'object', required: false }
        },
        backgrounds: {
          id: 'UUID',
          url: { type: 'string', required: true },
          type: { type: 'string', required: true, enum: ['default', 'ai-generated', 'custom'] },
          addedAt: { type: 'datetime', required: true },
          isDefault: { type: 'boolean', required: true },
          metadata: { type: 'object', required: false }
        },
        userProfile: {
          id: 'UUID',
          nickname: { type: 'string', required: true, minLength: 2, maxLength: 20 },
          avatar: { type: 'string', required: false },
          birthday: { type: 'date', required: false },
          gender: { type: 'string', required: false, enum: ['male', 'female', 'secret'] },
          email: { type: 'string', required: false, format: 'email' },
          phone: { type: 'string', required: false },
          preferences: { type: 'object', required: false },
          createdAt: { type: 'datetime', required: true },
          updatedAt: { type: 'datetime', required: true }
        }
      }
    };

    this.init();
  }

  /**
   * 初始化版本管理器
   */
  async init () {
    const savedVersion = await this.getSavedVersion();
    console.log(`当前数据版本: ${savedVersion || '未设置'}`);
    console.log(`应用版本: ${this.currentVersion}`);

    if (savedVersion && savedVersion !== this.currentVersion) {
      await this.migrateData(savedVersion, this.currentVersion);
    } else if (!savedVersion) {
      // 首次安装，设置当前版本
      await this.setSavedVersion(this.currentVersion);
      console.log('首次安装，设置数据版本');
    }
  }

  /**
   * 获取保存的数据版本
   * @returns {Promise<string|null>} - 版本号
   */
  async getSavedVersion () {
    try {
      const version = localStorage.getItem('data_version');
      return version || null;
    } catch (error) {
      console.error('获取数据版本失败:', error);
      return null;
    }
  }

  /**
   * 设置数据版本
   * @param {string} version - 版本号
   */
  async setSavedVersion (version) {
    try {
      localStorage.setItem('data_version', version);
      localStorage.setItem('data_version_updated_at', new Date().toISOString());
      return true;
    } catch (error) {
      console.error('设置数据版本失败:', error);
      return false;
    }
  }

  /**
   * 迁移数据
   * @param {string} fromVersion - 源版本
   * @param {string} toVersion - 目标版本
   */
  async migrateData (fromVersion, toVersion) {
    console.log(`开始数据迁移: ${fromVersion} -> ${toVersion}`);

    const migrationKey = `${fromVersion}->${toVersion}`;
    const migrationStrategy = this.migrationStrategies[migrationKey];

    if (!migrationStrategy) {
      console.warn(`未找到迁移策略: ${migrationKey}`);
      return;
    }

    try {
      // 创建备份
      await this.createBackup(fromVersion);

      // 执行迁移
      await migrationStrategy();

      // 更新版本号
      await this.setSavedVersion(toVersion);

      // 验证迁移结果
      const validation = await this.validateMigration(toVersion);

      if (validation.success) {
        console.log('数据迁移成功');
        // 清理备份（可选）
        // await this.cleanupBackup(fromVersion);
      } else {
        console.error('数据迁移验证失败:', validation.errors);
        // 回滚到备份
        await this.rollbackBackup(fromVersion);
        throw new Error('数据迁移失败，已回滚');
      }
    } catch (error) {
      console.error('数据迁移失败:', error);
      throw error;
    }
  }

  /**
   * 迁移到 v1.1.0
   * 添加对话存储支持
   */
  async migrateToV1_1_0 () {
    console.log('执行迁移到 v1.1.0');

    // 检查是否需要迁移
    const conversations = localStorage.getItem('chat_messages');
    if (conversations) {
      // 数据已存在，跳过迁移
      return;
    }

    // 初始化对话存储
    console.log('初始化对话存储...');
  }

  /**
   * 迁移到 v1.2.0
   * 添加背景管理支持
   */
  async migrateToV1_2_0 () {
    console.log('执行迁移到 v1.2.0');

    // 迁移背景设置
    const oldBackgrounds = localStorage.getItem('background_settings');
    if (oldBackgrounds) {
      try {
        const backgrounds = JSON.parse(oldBackgrounds);

        // 转换为新格式
        const newBackgrounds = backgrounds.map(bg => ({
          id: this.generateUUID(),
          url: bg.url,
          type: bg.type || 'default',
          addedAt: new Date().toISOString(),
          isDefault: bg.isDefault || false,
          metadata: {}
        }));

        // 存储到新的 IndexedDB
        await storageManager.store('backgrounds', newBackgrounds);

        console.log('背景数据迁移完成');
      } catch (error) {
        console.error('背景数据迁移失败:', error);
      }
    }
  }

  /**
   * 迁移到 v2.0.0
   * 系统性重构，统一存储架构
   */
  async migrateToV2_0_0 () {
    console.log('执行迁移到 v2.0.0');

    // 1. 迁移事件数据
    await this.migrateEventsToV2();

    // 2. 迁移对话数据
    await this.migrateConversationsToV2();

    // 3. 迁移背景数据
    await this.migrateBackgroundsToV2();

    // 4. 迁移用户资料
    await this.migrateProfileToV2();

    // 5. 清理旧数据
    await this.cleanupOldData();

    console.log('v2.0.0 迁移完成');
  }

  /**
   * 迁移事件数据到 v2.0.0
   */
  async migrateEventsToV2 () {
    const oldEvents = localStorage.getItem('calendar_events');
    if (!oldEvents) return;

    try {
      const events = JSON.parse(oldEvents);

      // 转换为新格式
      const newEvents = events.map(event => ({
        id: event.id || this.generateUUID(),
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        description: event.description || '',
        location: event.location || '',
        reminderTime: event.reminderTime || 0,
        reminderMethods: event.reminderMethods || [],
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // 验证数据
      const validatedEvents = newEvents.filter(event =>
        this.validateEvent(event, '2.0.0').valid
      );

      // 存储到新的统一存储
      for (const event of validatedEvents) {
        await storageManager.store(`event_${event.id}`, event, { storageType: 'indexedDB' });
      }

      console.log(`事件数据迁移完成: ${validatedEvents.length} 条`);
    } catch (error) {
      console.error('事件数据迁移失败:', error);
      throw error;
    }
  }

  /**
   * 迁移对话数据到 v2.0.0
   */
  async migrateConversationsToV2 () {
    const oldConversations = localStorage.getItem('chat_messages');
    if (!oldConversations) return;

    try {
      const conversations = JSON.parse(oldConversations);

      // 转换为新格式
      const newConversations = conversations.map(msg => ({
        id: msg.id || this.generateUUID(),
        conversationId: msg.conversationId || this.generateUUID(),
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp || new Date().toISOString(),
        model: msg.model || 'unknown',
        metadata: msg.metadata || {}
      }));

      // 存储到 IndexedDB
      for (const msg of newConversations) {
        await storageManager.store(`conversation_${msg.id}`, msg, { storageType: 'indexedDB' });
      }

      console.log(`对话数据迁移完成: ${newConversations.length} 条`);
    } catch (error) {
      console.error('对话数据迁移失败:', error);
      throw error;
    }
  }

  /**
   * 迁移背景数据到 v2.0.0
   */
  async migrateBackgroundsToV2 () {
    const oldBackgrounds = localStorage.getItem('background_settings');
    if (!oldBackgrounds) return;

    try {
      const backgrounds = JSON.parse(oldBackgrounds);

      // 转换为新格式
      const newBackgrounds = backgrounds.map(bg => ({
        id: bg.id || this.generateUUID(),
        url: bg.url,
        type: bg.type || 'default',
        addedAt: bg.addedAt || new Date().toISOString(),
        isDefault: bg.isDefault || false,
        metadata: bg.metadata || {}
      }));

      // 存储到 IndexedDB
      for (const bg of newBackgrounds) {
        await storageManager.store(`background_${bg.id}`, bg, { storageType: 'indexedDB' });
      }

      console.log(`背景数据迁移完成: ${newBackgrounds.length} 张`);
    } catch (error) {
      console.error('背景数据迁移失败:', error);
      throw error;
    }
  }

  /**
   * 迁移用户资料到 v2.0.0
   */
  async migrateProfileToV2 () {
    const oldProfile = localStorage.getItem('user_profile');
    if (!oldProfile) return;

    try {
      const profile = JSON.parse(oldProfile);

      // 转换为新格式
      const newProfile = {
        id: profile.id || this.generateUUID(),
        nickname: profile.nickname || '用户昵称',
        avatar: profile.avatar || '',
        birthday: profile.birthday || '',
        gender: profile.gender || 'secret',
        email: profile.email || '',
        phone: profile.phone || '',
        preferences: profile.preferences || {},
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 存储到 localStorage
      await storageManager.store('user_profile', newProfile, { storageType: 'localStorage' });

      console.log('用户资料迁移完成');
    } catch (error) {
      console.error('用户资料迁移失败:', error);
      throw error;
    }
  }

  /**
   * 清理旧数据
   */
  async cleanupOldData () {
    console.log('清理旧数据...');

    const oldKeys = [
      'calendar_events',
      'chat_messages',
      'background_settings',
      'user_profile',
      'app_settings',
      'userPreferences'
    ];

    oldKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`已清理: ${key}`);
      } catch (error) {
        console.error(`清理失败 [${key}]:`, error);
      }
    });
  }

  /**
   * 创建备份
   * @param {string} version - 版本号
   */
  async createBackup (version) {
    console.log(`创建版本 ${version} 的备份`);

    const backupData = {
      version,
      timestamp: new Date().toISOString(),
      data: {}
    };

    // 收集所有数据
    const dataTypes = ['events', 'conversations', 'backgrounds', 'user_profile'];
    for (const type of dataTypes) {
      try {
        const data = await storageManager.retrieve(type, { skipCache: true });
        backupData.data[type] = data;
      } catch (error) {
        console.error(`备份 ${type} 失败:`, error);
      }
    }

    // 保存备份
    const backupKey = `backup_${version}_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backupData));

    console.log(`备份已创建: ${backupKey}`);
  }

  /**
   * 回滚备份
   * @param {string} version - 版本号
   */
  async rollbackBackup (version) {
    console.log(`回滚到版本 ${version}`);

    // 查找备份
    const backupKeys = Object.keys(localStorage).filter(key =>
      key.startsWith(`backup_${version}`)
    );

    if (backupKeys.length === 0) {
      console.warn('未找到备份');
      return;
    }

    // 使用最新的备份
    const latestBackupKey = backupKeys.sort().reverse()[0];
    const backup = JSON.parse(localStorage.getItem(latestBackupKey));

    // 恢复数据
    for (const [type, data] of Object.entries(backup.data)) {
      try {
        await storageManager.store(type, data);
      } catch (error) {
        console.error(`恢复 ${type} 失败:`, error);
      }
    }

    // 恢复版本号
    await this.setSavedVersion(version);

    console.log('回滚完成');
  }

  /**
   * 验证迁移结果
   * @param {string} version - 目标版本
   * @returns {Promise<Object>} - 验证结果
   */
  async validateMigration (version) {
    const schema = this.dataSchemas[version];
    if (!schema) {
      return { success: false, errors: ['未找到数据结构定义'] };
    }

    const errors = [];

    // 验证每种数据类型
    for (const [dataType, dataSchema] of Object.entries(schema)) {
      try {
        const data = await storageManager.retrieve(dataType, { skipCache: true });

        if (!data) {
          errors.push(`${dataType} 数据丢失`);
          continue;
        }

        // 验证数据结构
        const dataErrors = this.validateDataStructure(data, dataSchema, dataType);
        errors.push(...dataErrors);
      } catch (error) {
        errors.push(`${dataType} 验证失败: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * 验证数据结构
   * @param {any} data - 数据对象
   * @param {Object} schema - 数据结构定义
   * @param {string} dataType - 数据类型名称
   * @returns {Array<string>} - 错误列表
   */
  validateDataStructure (data, schema, dataType) {
    const errors = [];

    if (Array.isArray(data)) {
      // 数组数据验证
      data.forEach((item, index) => {
        for (const [field, fieldSchema] of Object.entries(schema)) {
          const error = this.validateField(item, field, fieldSchema, dataType, index);
          if (error) {
            errors.push(error);
          }
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      // 对象数据验证
      for (const [field, fieldSchema] of Object.entries(schema)) {
        const error = this.validateField(data, field, fieldSchema, dataType);
        if (error) {
          errors.push(error);
        }
      }
    }

    return errors;
  }

  /**
   * 验证单个字段
   * @param {any} data - 数据对象
   * @param {string} field - 字段名
   * @param {Object} schema - 字段结构定义
   * @param {string} dataType - 数据类型名称
   * @param {number} index - 数组索引（可选）
   * @returns {string|null>} - 错误信息
   */
  // eslint-disable-next-line complexity
  validateField (data, field, schema, dataType, index = null) {
    const value = data[field];
    const prefix = index !== null ? `${dataType}[${index}].` : `${dataType}.`;

    // 必填验证
    if (schema.required && (value === undefined || value === null || value === '')) {
      return `${prefix}${field} 是必填字段`;
    }

    // 类型验证
    if (value !== undefined && value !== null) {
      switch (schema.type) {
        case 'string':
          if (typeof value !== 'string') {
            return `${prefix}${field} 类型错误，期望 string`;
          }
          if (schema.minLength && value.length < schema.minLength) {
            return `${prefix}${field} 长度不能少于 ${schema.minLength}`;
          }
          if (schema.maxLength && value.length > schema.maxLength) {
            return `${prefix}${field} 长度不能超过 ${schema.maxLength}`;
          }
          break;

        case 'number':
          if (typeof value !== 'number') {
            return `${prefix}${field} 类型错误，期望 number`;
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            return `${prefix}${field} 类型错误，期望 boolean`;
          }
          break;

        case 'date':
        case 'datetime':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            return `${prefix}${field} 日期格式错误`;
          }
          break;

        case 'array':
          if (!Array.isArray(value)) {
            return `${prefix}${field} 类型错误，期望 array`;
          }
          break;

        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            return `${prefix}${field} 类型错误，期望 object`;
          }
          break;

        case 'UUID': {
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(value)) {
            return `${prefix}${field} UUID 格式错误`;
          }
          break;
        }
      }

      // 枚举值验证
      if (schema.enum && !schema.enum.includes(value)) {
        return `${prefix}${field} 值必须是以下之一: ${schema.enum.join(', ')}`;
      }

      // 格式验证
      if (schema.format) {
        switch (schema.format) {
          case 'email': {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              return `${prefix}${field} 邮箱格式错误`;
            }
            break;
          }
        }
      }
    }

    return null;
  }

  /**
   * 验证事件数据
   * @param {Object} event - 事件对象
   * @param {string} version - 数据版本
   * @returns {Object>} - 验证结果
   */
  validateEvent (event, version) {
    const schema = this.dataSchemas[version]?.events;
    if (!schema) {
      return { valid: false, errors: ['未找到事件数据结构定义'] };
    }

    const errors = this.validateDataStructure(event, schema, 'event');

    // 业务规则验证
    if (event.startDate && event.endDate) {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);

      if (end <= start) {
        errors.push('event.endDate 必须晚于 event.startDate');
      }

      const duration = end - start;
      const maxDuration = 24 * 60 * 60 * 1000; // 24小时
      if (duration > maxDuration) {
        errors.push('事件持续时间不能超过24小时');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成 UUID
   * @returns {string} - UUID 字符串
   */
  generateUUID () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 检查版本兼容性
   * @param {string} version - 版本号
   * @returns {boolean} - 是否兼容
   */
  isCompatible (version) {
    const [major, minor] = version.split('.').map(Number);
    const [currentMajor, currentMinor] = this.currentVersion.split('.').map(Number);

    // 主版本号必须匹配
    if (major !== currentMajor) {
      return false;
    }

    // 次版本号可以向后兼容
    return minor <= currentMinor;
  }

  /**
   * 获取版本信息
   * @returns {Object>} - 版本信息
   */
  getVersionInfo () {
    return {
      current: this.currentVersion,
      saved: localStorage.getItem('data_version'),
      compatible: this.isCompatible(localStorage.getItem('data_version') || this.currentVersion),
      lastUpdate: localStorage.getItem('data_version_updated_at')
    };
  }
}

// 创建全局单例
const versionManager = new VersionManager();

export default versionManager;
