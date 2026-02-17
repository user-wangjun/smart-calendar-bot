/**
 * 统一存储管理器
 * 根据数据类型自动选择最优存储方式，提供统一的存储接口
 * 支持敏感数据的加密存储
 */

class StorageManager {
  constructor () {
    this.storageTypes = {
      localStorage: 'localStorage',
      indexedDB: 'indexedDB',
      memory: 'memory'
    };

    this.storageConfig = {
      smallData: {
        maxSize: 1024 * 1024,
        threshold: 0.8
      },
      largeData: {
        maxSize: 100 * 1024 * 1024,
        threshold: 0.9
      },
      sensitiveData: {
        encrypt: true,
        algorithm: 'AES-GCM',
        keyLength: 256
      }
    };

    this.cache = new Map();
    this.encryptionKey = null;
    this.encryptionKeyPromise = null;
    this.dataPrefix = 'smart_calendar_';
    this.initIndexedDB();
  }

  /**
   * 获取或创建加密密钥
   * 使用PBKDF2从固定盐值派生密钥，确保密钥可重现
   * @returns {Promise<CryptoKey>} 加密密钥
   */
  async getEncryptionKey () {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    if (this.encryptionKeyPromise) {
      return this.encryptionKeyPromise;
    }

    this.encryptionKeyPromise = (async () => {
      try {
        const salt = new TextEncoder().encode('smart-calendar-encryption-salt-v1');
        const baseKeyMaterial = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode('smart-calendar-secure-key-2024'),
          'PBKDF2',
          false,
          ['deriveKey']
        );

        this.encryptionKey = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt,
            iterations: 100000,
            hash: 'SHA-256'
          },
          baseKeyMaterial,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );

        return this.encryptionKey;
      } catch (error) {
        console.error('生成加密密钥失败:', error);
        this.encryptionKeyPromise = null;
        throw error;
      }
    })();

    return this.encryptionKeyPromise;
  }

  /**
   * 初始化 IndexedDB
   */
  async initIndexedDB () {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SmartCalendarDB', 1);

      request.onerror = () => {
        console.error('IndexedDB 初始化失败');
        resolve(false);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 创建对象存储空间
        if (!db.objectStoreNames.contains('conversations')) {
          db.createObjectStore('conversations', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('backgrounds')) {
          db.createObjectStore('backgrounds', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('locations')) {
          db.createObjectStore('locations', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('weather')) {
          db.createObjectStore('weather', { keyPath: 'id' });
        }

        // 创建索引
        const conversationStore = request.transaction.objectStore('conversations');
        if (!conversationStore.indexNames.contains('timestamp')) {
          conversationStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * 存储数据
   * @param {string} key - 存储键
   * @param {any} data - 要存储的数据
   * @param {Object} options - 存储选项
   * @returns {Promise<boolean>} - 存储是否成功
   */
  async store (key, data, options = {}) {
    try {
      const storageType = this.selectStorageType(key, data, options);
      const result = await this[storageType].store(key, data, options);

      // 更新缓存
      this.cache.set(key, { data, timestamp: Date.now() });

      // 触发存储事件
      this.emit('storage:updated', { key, data, storageType });

      return result;
    } catch (error) {
      console.error(`存储失败 [${key}]:`, error);
      throw error;
    }
  }

  /**
   * 检索数据
   * @param {string} key - 存储键
   * @param {Object} options - 检索选项
   * @returns {Promise<any>} - 检索到的数据
   */
  async retrieve (key, options = {}) {
    try {
      // 先检查缓存
      const cached = this.cache.get(key);
      if (cached && !options.skipCache) {
        const age = Date.now() - cached.timestamp;
        if (age < (options.cacheTime || 60000)) { // 默认缓存1分钟
          return cached.data;
        }
      }

      const storageType = this.selectStorageType(key, null, options);
      const data = await this[storageType].retrieve(key, options);

      // 更新缓存
      if (data !== null) {
        this.cache.set(key, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      console.error(`检索失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * 删除数据
   * @param {string} key - 存储键
   * @returns {Promise<boolean>} - 删除是否成功
   */
  async remove (key) {
    try {
      const storageType = this.selectStorageType(key, null);
      const result = await this[storageType].remove(key);

      // 清除缓存
      this.cache.delete(key);

      // 触发删除事件
      this.emit('storage:removed', { key, storageType });

      return result;
    } catch (error) {
      console.error(`删除失败 [${key}]:`, error);
      return false;
    }
  }

  /**
   * 清空指定类型的所有数据
   * @param {string} storageType - 存储类型
   * @returns {Promise<boolean>} - 清空是否成功
   */
  async clear (storageType) {
    try {
      const result = await this[storageType].clear();

      // 清除相关缓存
      for (const [key] of this.cache) {
        if (this.selectStorageType(key, null) === storageType) {
          this.cache.delete(key);
        }
      }

      return result;
    } catch (error) {
      console.error(`清空失败 [${storageType}]:`, error);
      return false;
    }
  }

  /**
   * 选择存储类型
   * @param {string} key - 存储键
   * @param {any} data - 要存储的数据
   * @param {Object} options - 存储选项
   * @returns {string} - 存储类型
   */
  selectStorageType (key, data, options = {}) {
    // 强制指定存储类型
    if (options.storageType) {
      return options.storageType;
    }

    // 敏感数据使用加密存储
    if (options.sensitive || this.isSensitiveKey(key)) {
      return 'localStorage';
    }

    // 大数据使用 IndexedDB
    if (data && this.isLargeData(data)) {
      return 'indexedDB';
    }

    // 默认使用 localStorage
    return 'localStorage';
  }

  /**
   * 判断是否为敏感数据
   * @param {string} key - 存储键
   * @returns {boolean} - 是否为敏感数据
   */
  isSensitiveKey (key) {
    const sensitiveKeys = [
      'api_keys',
      'user_password',
      'auth_token',
      'private_key',
      'secret'
    ];

    return sensitiveKeys.some(sensitiveKey =>
      key.toLowerCase().includes(sensitiveKey)
    );
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

    // 大于 100KB 视为大数据
    return size > 100 * 1024;
  }

  /**
   * localStorage 存储实现
   */
  getLocalStorageHandler () {
    const self = this;
    return {
      store: async (key, data, options) => {
        try {
          let value;
          if (options.sensitive) {
            value = await self.encryptData(data);
          } else {
            value = JSON.stringify(data);
          }
          localStorage.setItem(self.dataPrefix + key, value);
          return true;
        } catch (error) {
          if (error.name === 'QuotaExceededError') {
            throw new Error('存储空间不足');
          }
          throw error;
        }
      },

      retrieve: async (key, options) => {
        try {
          const value = localStorage.getItem(self.dataPrefix + key);
          if (value === null) return null;

          const data = JSON.parse(value);
          if (options.sensitive) {
            return await self.decryptData(data);
          }
          return data;
        } catch (error) {
          console.error('解析 localStorage 数据失败:', error);
          return null;
        }
      },

      remove: (key) => {
        localStorage.removeItem(self.dataPrefix + key);
        return true;
      },

      clear: () => {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(self.dataPrefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        return true;
      }
    };
  }

  /**
   * localStorage 存储实现（兼容旧代码）
   */
  get localStorage () {
    return this.getLocalStorageHandler();
  }

  /**
   * IndexedDB 存储实现
   */
  getIndexedDBHandler () {
    const self = this;
    return {
      store: async (key, data, options) => {
        if (!self.db) {
          console.warn('IndexedDB 未初始化');
          return false;
        }

        return new Promise((resolve, reject) => {
          const transaction = self.db.transaction(['conversations', 'backgrounds', 'locations', 'weather'], 'readwrite');
          const storeName = self.getStoreName(key);
          const store = transaction.objectStore(storeName);

          const request = store.put({
            id: key,
            data,
            timestamp: Date.now()
          });

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
      },

      retrieve: async (key, options) => {
        if (!self.db) {
          console.warn('IndexedDB 未初始化');
          return null;
        }

        return new Promise((resolve, reject) => {
          const transaction = self.db.transaction(['conversations', 'backgrounds', 'locations', 'weather'], 'readonly');
          const storeName = self.getStoreName(key);
          const store = transaction.objectStore(storeName);

          const request = store.get(key);

          request.onsuccess = () => {
            resolve(request.result ? request.result.data : null);
          };
          request.onerror = () => reject(request.error);
        });
      },

      remove: async (key) => {
        if (!self.db) {
          console.warn('IndexedDB 未初始化');
          return false;
        }

        return new Promise((resolve, reject) => {
          const transaction = self.db.transaction(['conversations', 'backgrounds', 'locations', 'weather'], 'readwrite');
          const storeName = self.getStoreName(key);
          const store = transaction.objectStore(storeName);

          const request = store.delete(key);

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
      },

      clear: async () => {
        if (!self.db) {
          console.warn('IndexedDB 未初始化');
          return false;
        }

        return new Promise((resolve, reject) => {
          const transaction = self.db.transaction(['conversations', 'backgrounds', 'locations', 'weather'], 'readwrite');

          transaction.oncomplete = () => resolve(true);
          transaction.onerror = () => reject(transaction.error);

          for (const storeName of ['conversations', 'backgrounds', 'locations', 'weather']) {
            transaction.objectStore(storeName).clear();
          }
        });
      }
    };
  }

  /**
   * IndexedDB 存储实现（兼容旧代码）
   */
  get indexedDB () {
    return this.getIndexedDBHandler();
  }

  /**
   * 根据键获取存储空间名称
   * @param {string} key - 存储键
   * @returns {string} - 存储空间名称
   */
  getStoreName (key) {
    if (key.startsWith('conversation')) {
      return 'conversations';
    } else if (key.startsWith('background')) {
      return 'backgrounds';
    } else if (key.startsWith('location')) {
      return 'locations';
    } else if (key.startsWith('weather')) {
      return 'weather';
    }

    return 'conversations';
  }

  /**
   * 加密数据
   * 使用AES-GCM算法加密数据，返回Base64编码的加密结果
   * @param {any} data - 要加密的数据
   * @returns {Promise<string>} - 加密后的数据（JSON格式）
   */
  async encryptData (data) {
    try {
      const key = await this.getEncryptionKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const dataStr = JSON.stringify(data);
      const encodedData = encoder.encode(dataStr);

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      const encryptedArray = new Uint8Array(encryptedBuffer);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv, 0);
      combined.set(encryptedArray, iv.length);

      const base64Result = btoa(String.fromCharCode(...combined));
      return JSON.stringify({
        encrypted: true,
        version: 1,
        data: base64Result
      });
    } catch (error) {
      console.error('加密数据失败:', error);
      throw new Error('数据加密失败');
    }
  }

  /**
   * 解密数据
   * 解密AES-GCM加密的数据
   * @param {string|Object} encryptedData - 要解密的数据
   * @returns {Promise<any>} - 解密后的数据
   */
  async decryptData (encryptedData) {
    try {
      let dataObj = encryptedData;
      if (typeof encryptedData === 'string') {
        dataObj = JSON.parse(encryptedData);
      }

      if (!dataObj || !dataObj.encrypted) {
        return dataObj;
      }

      if (!dataObj.data) {
        console.warn('加密数据格式无效');
        return null;
      }

      const key = await this.getEncryptionKey();
      const combined = Uint8Array.from(atob(dataObj.data), c => c.charCodeAt(0));

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const decryptedStr = decoder.decode(decryptedBuffer);
      return JSON.parse(decryptedStr);
    } catch (error) {
      console.error('解密数据失败:', error);
      return null;
    }
  }

  /**
   * 简单事件发射器
   */
  getEventListeners () {
    if (!this._eventListeners) {
      this._eventListeners = new Map();
    }
    return this._eventListeners;
  }

  on (event, callback) {
    const listeners = this.getEventListeners();
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event).push(callback);
  }

  off (event, callback) {
    const listeners = this.getEventListeners();
    if (listeners.has(event)) {
      const eventListeners = listeners.get(event);
      const index = eventListeners.indexOf(callback);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit (event, data) {
    const listeners = this.getEventListeners();
    if (listeners.has(event)) {
      listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件监听器错误 [${event}]:`, error);
        }
      });
    }
  }

  /**
   * 获取存储使用情况
   * @returns {Promise<Object>} - 存储使用统计
   */
  async getStorageUsage () {
    const localStorageUsage = this.getLocalStorageUsage();
    const indexedDBUsage = await this.getIndexedDBUsage();

    return {
      localStorage: localStorageUsage,
      indexedDB: indexedDBUsage,
      total: localStorageUsage + indexedDBUsage
    };
  }

  /**
   * 获取 localStorage 使用量
   * 仅计算应用数据前缀的键
   * @returns {Object} - 使用统计
   */
  getLocalStorageUsage () {
    let total = 0;
    let itemCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.dataPrefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          total += new Blob([value]).size;
          itemCount++;
        }
      }
    }

    const limit = 5 * 1024 * 1024;
    const percentage = (total / limit) * 100;

    return {
      used: total,
      limit,
      percentage,
      itemCount,
      warning: percentage > 80
    };
  }

  /**
   * 获取 IndexedDB 使用量
   * @returns {Promise<Object>} - 使用统计
   */
  async getIndexedDBUsage () {
    if (!this.db) {
      return { used: 0, limit: Infinity, percentage: 0, warning: false };
    }

    return new Promise((resolve) => {
      const stores = ['conversations', 'backgrounds', 'locations', 'weather'];
      let total = 0;
      let processed = 0;

      stores.forEach(storeName => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAllKeys();

        request.onsuccess = () => {
          const keys = request.result;
          // 估算每条记录约 1KB
          total += keys.length * 1024;
          processed++;

          if (processed === stores.length) {
            // IndexedDB 理论上无限制
            resolve({
              used: total,
              limit: Infinity,
              percentage: 0,
              warning: false
            });
          }
        };
      });
    });
  }

  /**
   * 按索引查询记录
   * @param {string} storeName - 存储空间名称
   * @param {string} indexName - 索引名称
   * @param {any} indexValue - 索引值
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} - 查询结果
   */
  async queryByIndex (storeName, indexName, indexValue, options = {}) {
    if (!this.db) {
      console.warn('IndexedDB 未初始化');
      return [];
    }

    const limit = options.limit || Infinity;
    const offset = options.offset || 0;
    const reverse = options.reverse || false;

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const range = IDBKeyRange.only(indexValue);
        const direction = reverse ? 'prev' : 'next';

        const request = index.openCursor(range, direction);
        const results = [];
        let skipped = 0;
        let count = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;

          if (cursor) {
            if (skipped < offset) {
              skipped++;
              cursor.continue();
            } else if (count < limit) {
              results.push(cursor.value);
              count++;
              cursor.continue();
            } else {
              resolve(results);
            }
          } else {
            resolve(results);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 按索引计数
   * @param {string} storeName - 存储空间名称
   * @param {string} indexName - 索引名称
   * @param {any} indexValue - 索引值
   * @returns {Promise<number>} - 计数结果
   */
  async countByIndex (storeName, indexName, indexValue) {
    if (!this.db) {
      return 0;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const range = IDBKeyRange.only(indexValue);

        const request = index.count(range);

        request.onsuccess = () => {
          resolve(request.result || 0);
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取所有记录
   * @param {string} storeName - 存储空间名称
   * @returns {Promise<Array>} - 所有记录
   */
  async getAll (storeName) {
    if (!this.db) {
      console.warn('IndexedDB 未初始化');
      return [];
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取所有键
   * @param {string} storeName - 存储空间名称
   * @returns {Promise<Array>} - 所有键
   */
  async getAllKeys (storeName) {
    if (!this.db) {
      console.warn('IndexedDB 未初始化');
      return [];
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAllKeys();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 检查IndexedDB是否已初始化
   * @returns {boolean} - 是否已初始化
   */
  isIndexedDBReady () {
    return !!this.db;
  }
}

// 创建全局单例
const storageManager = new StorageManager();

export default storageManager;
