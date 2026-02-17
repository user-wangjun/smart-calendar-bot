import CryptoJS from 'crypto-js';

/**
 * 数据导出配置选项
 * @typedef {Object} ExportOptions
 * @property {string[]} types - 要导出的数据类型
 * @property {boolean} encrypt - 是否加密
 * @property {string} password - 加密密码
 * @property {boolean} includeApiKeys - 是否包含API密钥
 * @property {string} version - 导出格式版本
 */

/**
 * 数据导入配置选项
 * @typedef {Object} ImportOptions
 * @property {string} mode - 导入模式 ('merge' | 'overwrite')
 * @property {boolean} validate - 是否验证数据
 * @property {string} password - 解密密码
 * @property {boolean} importApiKeys - 是否导入API密钥
 */

/**
 * 数据导出结果
 * @typedef {Object} ExportResult
 * @property {boolean} success - 是否成功
 * @property {string} data - 导出的JSON字符串
 * @property {string} filename - 建议的文件名
 * @property {Object} metadata - 导出元数据
 * @property {string} [error] - 错误信息
 */

/**
 * 数据导入结果
 * @typedef {Object} ImportResult
 * @property {boolean} success - 是否成功
 * @property {Object} stats - 导入统计
 * @property {string[]} warnings - 警告信息
 * @property {string} [error] - 错误信息
 */

/**
 * 数据类型定义
 */
export const DATA_TYPES = {
  EVENTS: 'events',
  CHAT: 'chat',
  SETTINGS: 'settings',
  PREFERENCES: 'preferences',
  PROFILE: 'profile'
};

/**
 * LocalStorage键名映射
 */
const STORAGE_KEYS = {
  [DATA_TYPES.EVENTS]: 'calendar_events',
  [DATA_TYPES.CHAT]: 'chat_messages',
  [DATA_TYPES.SETTINGS]: 'app_settings',
  [DATA_TYPES.PREFERENCES]: 'userPreferences',
  [DATA_TYPES.PROFILE]: 'user_profile'
};

/**
 * 当前数据版本
 */
const CURRENT_VERSION = '1.0.0';

/**
 * 加密密钥（从环境变量获取）
 */
// const ENCRYPTION_KEY = import.meta.env.VITE_DATA_ENCRYPTION_KEY || 'calendar-data-key-2026';

/**
 * 数据导出服务类
 * 负责将所有用户数据导出为JSON格式
 */
export class DataExporter {
  constructor () {
    this.exportTime = new Date().toISOString();
    this.metadata = {
      appVersion: '2.0.0',
      exportType: 'full',
      dataTypes: []
    };
  }

  /**
   * 执行数据导出
   * @param {ExportOptions} options - 导出选项
   * @returns {Promise<ExportResult>} 导出结果
   */
  async export (options = {}) {
    try {
      const {
        types = Object.values(DATA_TYPES),
        encrypt = false,
        password = '',
        includeApiKeys = false
      } = options;

      // 收集数据
      const data = await this.collectData(types, includeApiKeys);

      // 构建导出对象
      const exportObject = {
        version: CURRENT_VERSION,
        exportTime: this.exportTime,
        metadata: {
          ...this.metadata,
          dataTypes: types,
          encrypted: encrypt,
          includeApiKeys
        },
        data
      };

      // 序列化
      let jsonString = JSON.stringify(exportObject, null, 2);

      // 加密处理
      if (encrypt && password) {
        jsonString = this.encryptData(jsonString, password);
      }

      // 生成文件名
      const filename = this.generateFilename(types, encrypt);

      return {
        success: true,
        data: jsonString,
        filename,
        metadata: exportObject.metadata
      };
    } catch (error) {
      console.error('数据导出失败:', error);
      return {
        success: false,
        error: error.message,
        code: 'EXP001'
      };
    }
  }

  /**
   * 收集指定类型的数据
   * @private
   * @param {string[]} types - 数据类型列表
   * @param {boolean} includeApiKeys - 是否包含API密钥
   * @returns {Promise<Object>} 收集的数据
   */
  async collectData (types, includeApiKeys) {
    const data = {};

    for (const type of types) {
      const key = STORAGE_KEYS[type];
      if (!key) continue;

      try {
        const rawData = localStorage.getItem(key);
        if (rawData) {
          let parsedData = JSON.parse(rawData);

          // 特殊处理设置数据中的API密钥
          if (type === DATA_TYPES.SETTINGS && !includeApiKeys) {
            parsedData = this.filterApiKeys(parsedData);
          }

          data[this.getDataFieldName(type)] = parsedData;
        }
      } catch (error) {
        console.warn(`读取${type}数据失败:`, error);
        data[this.getDataFieldName(type)] = null;
      }
    }

    // 添加当前AI模型设置
    if (types.includes(DATA_TYPES.CHAT)) {
      const chatModel = localStorage.getItem('chat_model');
      if (chatModel) {
        data.chatModel = chatModel;
      }
    }

    return data;
  }

  /**
   * 过滤API密钥
   * @private
   * @param {Object} settings - 设置数据
   * @returns {Object} 过滤后的设置
   */
  filterApiKeys (settings) {
    if (!settings || typeof settings !== 'object') {
      return settings;
    }

    const filtered = { ...settings };
    if (filtered.apiKeys) {
      filtered.apiKeys = {};
      filtered.apiKeysNote = 'API密钥未导出（安全原因）';
    }
    return filtered;
  }

  /**
   * 加密数据
   * @private
   * @param {string} data - 要加密的数据
   * @param {string} password - 加密密码
   * @returns {string} 加密后的数据
   */
  encryptData (data, password) {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, password, {
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7
      }).toString();
      return JSON.stringify({
        encrypted: true,
        algorithm: 'AES-GCM',
        data: encrypted
      });
    } catch (error) {
      throw new Error(`加密失败: ${error.message}`);
    }
  }

  /**
   * 生成导出文件名
   * @private
   * @param {string[]} types - 数据类型
   * @param {boolean} encrypted - 是否加密
   * @returns {string} 文件名
   */
  generateFilename (types, encrypted) {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '');
    const typeStr = types.length === Object.values(DATA_TYPES).length
      ? 'full'
      : types.join('-');
    const ext = encrypted ? 'json.enc' : 'json';

    return `calendar_backup_${typeStr}_${dateStr}_${timeStr}.${ext}`;
  }

  /**
   * 获取数据字段名
   * @private
   * @param {string} type - 数据类型
   * @returns {string} 字段名
   */
  getDataFieldName (type) {
    const fieldNames = {
      [DATA_TYPES.EVENTS]: 'events',
      [DATA_TYPES.CHAT]: 'chatMessages',
      [DATA_TYPES.SETTINGS]: 'settings',
      [DATA_TYPES.PREFERENCES]: 'preferences',
      [DATA_TYPES.PROFILE]: 'profile'
    };
    return fieldNames[type] || type;
  }

  /**
   * 导出为文件并下载
   * @param {ExportOptions} options - 导出选项
   * @returns {Promise<ExportResult>} 导出结果
   */
  async exportToFile (options = {}) {
    const result = await this.export(options);

    if (!result.success) {
      return result;
    }

    try {
      // 创建Blob对象
      const blob = new Blob([result.data], { type: 'application/json' });

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;

      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 清理URL对象
      URL.revokeObjectURL(url);

      return {
        ...result,
        downloaded: true
      };
    } catch (error) {
      return {
        ...result,
        downloaded: false,
        downloadError: error.message
      };
    }
  }

  /**
   * 快速导出（使用默认设置）
   * @returns {Promise<ExportResult>} 导出结果
   */
  async quickExport () {
    return this.exportToFile({
      types: Object.values(DATA_TYPES),
      encrypt: false,
      includeApiKeys: false
    });
  }

  /**
   * 获取数据预览
   * @param {string[]} types - 数据类型
   * @returns {Promise<Object>} 数据预览
   */
  async getDataPreview (types = Object.values(DATA_TYPES)) {
    const data = await this.collectData(types, false);
    const preview = {};

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        preview[key] = {
          type: 'array',
          count: value.length,
          sample: value.slice(0, 3)
        };
      } else if (typeof value === 'object' && value !== null) {
        preview[key] = {
          type: 'object',
          keys: Object.keys(value),
          sample: this.truncateObject(value, 2)
        };
      } else {
        preview[key] = {
          type: typeof value,
          value
        };
      }
    }

    return preview;
  }

  /**
   * 截断对象用于预览
   * @private
   * @param {Object} obj - 对象
   * @param {number} depth - 深度
   * @returns {Object} 截断后的对象
   */
  truncateObject (obj, depth) {
    if (depth <= 0) return '[Object]';
    if (Array.isArray(obj)) {
      return obj.slice(0, 3).map(item =>
        typeof item === 'object' ? this.truncateObject(item, depth - 1) : item
      );
    }

    const result = {};
    const keys = Object.keys(obj).slice(0, 5);
    for (const key of keys) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        result[key] = this.truncateObject(value, depth - 1);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}

/**
 * 数据导入服务类
 * 负责从JSON文件导入数据到系统
 */
export class DataImporter {
  constructor () {
    this.importTime = new Date().toISOString();
    this.warnings = [];
    this.stats = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0
    };
  }

  /**
   * 执行数据导入
   * @param {string|File} source - 数据源（JSON字符串或File对象）
   * @param {ImportOptions} options - 导入选项
   * @returns {Promise<ImportResult>} 导入结果
   */
  async import (source, options = {}) {
    this.warnings = [];
    this.stats = { total: 0, success: 0, failed: 0, skipped: 0 };

    try {
      const {
        mode = 'merge',
        validate = true,
        password = '',
        importApiKeys = false
      } = options;

      // 读取数据
      let jsonString = await this.readSource(source);

      // 解析数据
      let importData = JSON.parse(jsonString);

      // 检查是否加密
      if (importData.encrypted) {
        if (!password) {
          throw new Error('需要密码解密数据');
        }
        jsonString = this.decryptData(importData.data, password);
        importData = JSON.parse(jsonString);
      }

      // 验证数据
      if (validate) {
        const validation = this.validateData(importData);
        if (!validation.valid) {
          throw new Error(`数据验证失败: ${validation.error}`);
        }
      }

      // 版本检查
      this.checkVersion(importData.version);

      // 执行导入
      const results = await this.importData(importData.data, mode, importApiKeys);

      return {
        success: true,
        stats: this.stats,
        warnings: this.warnings,
        results,
        metadata: importData.metadata
      };
    } catch (error) {
      console.error('数据导入失败:', error);
      return {
        success: false,
        error: error.message,
        code: this.getErrorCode(error),
        stats: this.stats,
        warnings: this.warnings
      };
    }
  }

  /**
   * 读取数据源
   * @private
   * @param {string|File} source - 数据源
   * @returns {Promise<string>} JSON字符串
   */
  async readSource (source) {
    if (typeof source === 'string') {
      return source;
    }

    if (source instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('读取文件失败'));
        reader.readAsText(source);
      });
    }

    throw new Error('不支持的数据源类型');
  }

  /**
   * 解密数据
   * @private
   * @param {string} encryptedData - 加密的数据
   * @param {string} password - 解密密码
   * @returns {string} 解密后的数据
   */
  decryptData (encryptedData, password) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, password, {
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.Pkcs7
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error(`解密失败: ${error.message}`);
    }
  }

  /**
   * 验证导入数据
   * @private
   * @param {Object} data - 导入数据
   * @returns {Object} 验证结果
   */
  validateData (data) {
    // 检查必需字段
    if (!data.version) {
      return { valid: false, error: '缺少版本信息' };
    }

    if (!data.data || typeof data.data !== 'object') {
      return { valid: false, error: '缺少数据对象' };
    }

    // 验证数据结构
    const validFields = ['events', 'chatMessages', 'settings', 'preferences', 'profile', 'chatModel'];
    const dataKeys = Object.keys(data.data);

    if (dataKeys.length === 0) {
      return { valid: false, error: '数据对象为空' };
    }

    // 检查是否有未知字段
    const unknownFields = dataKeys.filter(key => !validFields.includes(key));
    if (unknownFields.length > 0) {
      this.warnings.push(`发现未知数据字段: ${unknownFields.join(', ')}`);
    }

    return { valid: true };
  }

  /**
   * 检查版本兼容性
   * @private
   * @param {string} version - 数据版本
   */
  checkVersion (version) {
    if (!version) {
      this.warnings.push('数据缺少版本信息，可能不兼容');
      return;
    }

    const [major] = version.split('.');
    const [currentMajor] = CURRENT_VERSION.split('.');

    if (major !== currentMajor) {
      this.warnings.push(`数据版本(${version})与当前版本(${CURRENT_VERSION})可能不兼容`);
    }
  }

  /**
   * 导入数据到存储
   * @private
   * @param {Object} data - 要导入的数据
   * @param {string} mode - 导入模式
   * @param {boolean} importApiKeys - 是否导入API密钥
   * @returns {Promise<Object>} 导入结果详情
   */
  async importData (data, mode, importApiKeys) {
    const results = {};

    // 导入事件数据
    if (data.events) {
      results.events = await this.importEvents(data.events, mode);
    }

    // 导入聊天记录
    if (data.chatMessages) {
      results.chatMessages = await this.importChatMessages(data.chatMessages, mode);
    }

    // 导入设置
    if (data.settings) {
      results.settings = await this.importSettings(data.settings, mode, importApiKeys);
    }

    // 导入偏好设置
    if (data.preferences) {
      results.preferences = await this.importPreferences(data.preferences, mode);
    }

    // 导入用户档案
    if (data.profile) {
      results.profile = await this.importProfile(data.profile, mode);
    }

    // 导入AI模型设置
    if (data.chatModel) {
      results.chatModel = await this.importChatModel(data.chatModel);
    }

    return results;
  }

  /**
   * 导入事件数据
   * @private
   * @param {Array} events - 事件数组
   * @param {string} mode - 导入模式
   * @returns {Object} 导入结果
   */
  async importEvents (events, mode) {
    this.stats.total += events.length;
    const key = STORAGE_KEYS[DATA_TYPES.EVENTS];

    try {
      let existingEvents = [];
      const existing = localStorage.getItem(key);
      if (existing) {
        existingEvents = JSON.parse(existing);
      }

      let finalEvents;
      if (mode === 'merge') {
        // 合并模式：根据ID去重，保留更新时间较晚的
        const eventMap = new Map();

        // 先添加现有事件
        existingEvents.forEach(event => {
          eventMap.set(event.id, event);
        });

        // 合并导入的事件
        events.forEach(event => {
          const existing = eventMap.get(event.id);
          if (!existing) {
            eventMap.set(event.id, event);
            this.stats.success++;
          } else {
            // 比较更新时间
            const existingTime = new Date(existing.updatedAt || 0);
            const newTime = new Date(event.updatedAt || 0);
            if (newTime > existingTime) {
              eventMap.set(event.id, event);
              this.stats.success++;
            } else {
              this.stats.skipped++;
            }
          }
        });

        finalEvents = Array.from(eventMap.values());
      } else {
        // 覆盖模式
        finalEvents = events;
        this.stats.success += events.length;
      }

      localStorage.setItem(key, JSON.stringify(finalEvents));

      return {
        success: true,
        imported: this.stats.success,
        skipped: this.stats.skipped,
        total: finalEvents.length
      };
    } catch (error) {
      this.stats.failed += events.length;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 导入聊天记录
   * @private
   * @param {Array} messages - 消息数组
   * @param {string} mode - 导入模式
   * @returns {Object} 导入结果
   */
  async importChatMessages (messages, mode) {
    this.stats.total += messages.length;
    const key = STORAGE_KEYS[DATA_TYPES.CHAT];

    try {
      let existingMessages = [];
      const existing = localStorage.getItem(key);
      if (existing) {
        existingMessages = JSON.parse(existing);
      }

      let finalMessages;
      if (mode === 'merge') {
        // 聊天记录合并：按时间戳去重
        const messageSet = new Set(existingMessages.map(m => m.timestamp));
        const newMessages = messages.filter(m => !messageSet.has(m.timestamp));
        finalMessages = [...existingMessages, ...newMessages];
        this.stats.success += newMessages.length;
        this.stats.skipped += messages.length - newMessages.length;
      } else {
        finalMessages = messages;
        this.stats.success += messages.length;
      }

      localStorage.setItem(key, JSON.stringify(finalMessages));

      return {
        success: true,
        imported: this.stats.success,
        skipped: this.stats.skipped,
        total: finalMessages.length
      };
    } catch (error) {
      this.stats.failed += messages.length;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 导入设置
   * @private
   * @param {Object} settings - 设置对象
   * @param {string} mode - 导入模式
   * @param {boolean} importApiKeys - 是否导入API密钥
   * @returns {Object} 导入结果
   */
  async importSettings (settings, mode, importApiKeys) {
    this.stats.total++;
    const key = STORAGE_KEYS[DATA_TYPES.SETTINGS];

    try {
      let finalSettings = settings;

      // 如果不导入API密钥，保留现有的
      if (!importApiKeys) {
        const existing = localStorage.getItem(key);
        if (existing) {
          const existingSettings = JSON.parse(existing);
          if (existingSettings.apiKeys) {
            finalSettings.apiKeys = existingSettings.apiKeys;
            this.warnings.push('API密钥未导入，保留现有设置');
          }
        }
      }

      if (mode === 'merge') {
        const existing = localStorage.getItem(key);
        if (existing) {
          const existingSettings = JSON.parse(existing);
          finalSettings = this.deepMerge(existingSettings, finalSettings);
        }
      }

      localStorage.setItem(key, JSON.stringify(finalSettings));
      this.stats.success++;

      return {
        success: true,
        mode
      };
    } catch (error) {
      this.stats.failed++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 导入偏好设置
   * @private
   * @param {Object} preferences - 偏好设置
   * @param {string} mode - 导入模式
   * @returns {Object} 导入结果
   */
  async importPreferences (preferences, mode) {
    this.stats.total++;
    const key = STORAGE_KEYS[DATA_TYPES.PREFERENCES];

    try {
      let finalPreferences = preferences;

      if (mode === 'merge') {
        const existing = localStorage.getItem(key);
        if (existing) {
          const existingData = JSON.parse(existing);
          const existingPrefs = existingData.preferences || existingData;
          const newPrefs = preferences.preferences || preferences;
          finalPreferences = {
            ...existingData,
            preferences: this.deepMerge(existingPrefs, newPrefs)
          };
        }
      }

      localStorage.setItem(key, JSON.stringify(finalPreferences));
      this.stats.success++;

      return {
        success: true,
        mode
      };
    } catch (error) {
      this.stats.failed++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 导入用户档案
   * @private
   * @param {Object} profile - 用户档案
   * @param {string} mode - 导入模式
   * @returns {Object} 导入结果
   */
  async importProfile (profile, mode) {
    this.stats.total++;
    const key = STORAGE_KEYS[DATA_TYPES.PROFILE];

    try {
      let finalProfile = profile;

      if (mode === 'merge') {
        const existing = localStorage.getItem(key);
        if (existing) {
          const existingProfile = JSON.parse(existing);
          finalProfile = { ...existingProfile, ...profile };
        }
      }

      localStorage.setItem(key, JSON.stringify(finalProfile));
      this.stats.success++;

      return {
        success: true,
        mode
      };
    } catch (error) {
      this.stats.failed++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 导入AI模型设置
   * @private
   * @param {string} chatModel - AI模型名称
   * @returns {Object} 导入结果
   */
  async importChatModel (chatModel) {
    this.stats.total++;

    try {
      localStorage.setItem('chat_model', chatModel);
      this.stats.success++;

      return {
        success: true,
        model: chatModel
      };
    } catch (error) {
      this.stats.failed++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 深度合并对象
   * @private
   * @param {Object} target - 目标对象
   * @param {Object} source - 源对象
   * @returns {Object} 合并后的对象
   */
  deepMerge (target, source) {
    const result = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * 获取错误代码
   * @private
   * @param {Error} error - 错误对象
   * @returns {string} 错误代码
   */
  getErrorCode (error) {
    const errorCodes = {
      需要密码解密数据: 'IMP004',
      解密失败: 'IMP004',
      数据验证失败: 'IMP001',
      缺少版本信息: 'IMP002',
      不支持的数据源类型: 'IMP001',
      读取文件失败: 'IMP005'
    };

    for (const [msg, code] of Object.entries(errorCodes)) {
      if (error.message.includes(msg)) {
        return code;
      }
    }

    return 'IMP999';
  }

  /**
   * 预览导入文件内容
   * @param {File} file - 导入文件
   * @param {string} [password] - 解密密码
   * @returns {Promise<Object>} 预览信息
   */
  async preview (file, password = '') {
    try {
      let jsonString = await this.readSource(file);
      let importData = JSON.parse(jsonString);

      // 解密如果需要
      if (importData.encrypted) {
        if (!password) {
          return {
            canPreview: false,
            encrypted: true,
            message: '文件已加密，需要密码才能预览'
          };
        }
        jsonString = this.decryptData(importData.data, password);
        importData = JSON.parse(jsonString);
      }

      // 验证数据
      const validation = this.validateData(importData);

      return {
        canPreview: true,
        encrypted: false,
        version: importData.version,
        exportTime: importData.exportTime,
        metadata: importData.metadata,
        dataSummary: this.summarizeData(importData.data),
        validation: validation.valid ? 'passed' : 'failed',
        validationError: validation.error
      };
    } catch (error) {
      return {
        canPreview: false,
        error: error.message
      };
    }
  }

  /**
   * 汇总数据信息
   * @private
   * @param {Object} data - 数据对象
   * @returns {Object} 数据汇总
   */
  summarizeData (data) {
    const summary = {};

    if (data.events) {
      summary.events = {
        count: Array.isArray(data.events) ? data.events.length : 0,
        dateRange: this.getEventsDateRange(data.events)
      };
    }

    if (data.chatMessages) {
      summary.chatMessages = {
        count: Array.isArray(data.chatMessages) ? data.chatMessages.length : 0,
        timeRange: this.getMessagesTimeRange(data.chatMessages)
      };
    }

    if (data.settings) {
      summary.settings = {
        hasApiKeys: !!(data.settings.apiKeys && Object.keys(data.settings.apiKeys).length > 0),
        theme: data.settings.themeMode || 'unknown'
      };
    }

    if (data.preferences) {
      summary.preferences = {
        categories: data.preferences.preferences
          ? Object.keys(data.preferences.preferences).length
          : Object.keys(data.preferences).length
      };
    }

    return summary;
  }

  /**
   * 获取事件日期范围
   * @private
   * @param {Array} events - 事件数组
   * @returns {Object} 日期范围
   */
  getEventsDateRange (events) {
    if (!Array.isArray(events) || events.length === 0) {
      return null;
    }

    const dates = events
      .map(e => e.startDate)
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d));

    if (dates.length === 0) return null;

    return {
      earliest: new Date(Math.min(...dates)).toISOString().split('T')[0],
      latest: new Date(Math.max(...dates)).toISOString().split('T')[0]
    };
  }

  /**
   * 获取消息时间范围
   * @private
   * @param {Array} messages - 消息数组
   * @returns {Object} 时间范围
   */
  getMessagesTimeRange (messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return null;
    }

    const timestamps = messages
      .map(m => m.timestamp)
      .filter(Boolean)
      .map(t => new Date(t))
      .filter(d => !isNaN(d));

    if (timestamps.length === 0) return null;

    return {
      earliest: new Date(Math.min(...timestamps)).toISOString(),
      latest: new Date(Math.max(...timestamps)).toISOString()
    };
  }
}

/**
 * 数据迁移工具类
 * 用于处理版本升级时的数据迁移
 */
export class DataMigration {
  constructor () {
    this.migrations = new Map();
    this.registerMigrations();
  }

  /**
   * 注册数据迁移规则
   * @private
   */
  registerMigrations () {
    // v1.0.0 -> v2.0.0 的迁移规则
    this.migrations.set('1.0.0-2.0.0', this.migrateV1ToV2.bind(this));
  }

  /**
   * 执行数据迁移
   * @param {Object} data - 旧版本数据
   * @param {string} fromVersion - 源版本
   * @param {string} toVersion - 目标版本
   * @returns {Object} 迁移后的数据
   */
  migrate (data, fromVersion, toVersion = CURRENT_VERSION) {
    const migrationKey = `${fromVersion}-${toVersion}`;
    const migration = this.migrations.get(migrationKey);

    if (!migration) {
      console.warn(`未找到从 ${fromVersion} 到 ${toVersion} 的迁移规则`);
      return data;
    }

    return migration(data);
  }

  /**
   * v1.0.0 迁移到 v2.0.0
   * @private
   * @param {Object} data - v1数据
   * @returns {Object} v2数据
   */
  migrateV1ToV2 (data) {
    const migrated = { ...data };

    // 事件数据结构更新
    if (migrated.events) {
      migrated.events = migrated.events.map(event => ({
        ...event,
        // 添加新字段的默认值
        recurrence: event.recurrence || null,
        reminders: event.reminders || [],
        color: event.color || '#409EFF'
      }));
    }

    // 设置结构更新
    if (migrated.settings) {
      migrated.settings = {
        ...migrated.settings,
        // 添加新设置项
        aiModelSettings: migrated.settings.aiModelSettings || {
          priorityMode: 'balanced',
          preferredTaskTypes: ['chat', 'analysis']
        }
      };
    }

    return migrated;
  }
}

/**
 * 便捷函数：快速导出
 * @param {ExportOptions} options - 导出选项
 * @returns {Promise<ExportResult>} 导出结果
 */
export async function exportData (options = {}) {
  const exporter = new DataExporter();
  return exporter.exportToFile(options);
}

/**
 * 便捷函数：快速导入
 * @param {string|File} source - 数据源
 * @param {ImportOptions} options - 导入选项
 * @returns {Promise<ImportResult>} 导入结果
 */
export async function importData (source, options = {}) {
  const importer = new DataImporter();
  return importer.import(source, options);
}

/**
 * 便捷函数：预览导入文件
 * @param {File} file - 导入文件
 * @param {string} [password] - 解密密码
 * @returns {Promise<Object>} 预览信息
 */
export async function previewImport (file, password = '') {
  const importer = new DataImporter();
  return importer.preview(file, password);
}

/**
 * 便捷函数：获取数据备份状态
 * @returns {Object} 备份状态信息
 */
export function getBackupStatus () {
  const status = {
    lastBackup: null,
    dataTypes: {},
    totalSize: 0,
    canExport: true
  };

  const dataTypes = [
    { key: 'calendar_events', name: 'events', label: '日程事件' },
    { key: 'chat_messages', name: 'chat', label: '聊天记录' },
    { key: 'app_settings', name: 'settings', label: '应用设置' },
    { key: 'userPreferences', name: 'preferences', label: '用户偏好' },
    { key: 'user_profile', name: 'profile', label: '用户档案' }
  ];

  for (const type of dataTypes) {
    const data = localStorage.getItem(type.key);
    if (data) {
      const size = new Blob([data]).size;
      status.dataTypes[type.name] = {
        exists: true,
        size,
        sizeFormatted: formatBytes(size)
      };
      status.totalSize += size;
    } else {
      status.dataTypes[type.name] = {
        exists: false,
        size: 0,
        sizeFormatted: '0 B'
      };
    }
  }

  status.totalSizeFormatted = formatBytes(status.totalSize);

  // 检查存储空间
  const storageQuota = 10 * 1024 * 1024; // 10MB (扩大存储空间)
  status.storageUsed = ((status.totalSize / storageQuota) * 100).toFixed(1) + '%';
  status.storageRemaining = formatBytes(storageQuota - status.totalSize);

  return status;
}

/**
 * 格式化字节大小
 * @private
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的字符串
 */
function formatBytes (bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 导出默认对象
export default {
  DataExporter,
  DataImporter,
  DataMigration,
  DATA_TYPES,
  exportData,
  importData,
  previewImport,
  getBackupStatus
};
