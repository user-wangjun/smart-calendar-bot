/**
 * 位置数据持久化服务
 * 负责位置数据的本地存储、读取和恢复
 * 使用 localStorage 实现数据持久化
 */

/**
 * 存储键名
 */
const STORAGE_KEY = 'smart_calendar_location_data';

/**
 * 默认配置
 */
const DEFAULT_CONFIG = {
  // 数据过期时间（毫秒），默认30分钟
  expireTime: 30 * 60 * 1000,
  // 自动保存间隔（毫秒），默认5分钟
  autoSaveInterval: 5 * 60 * 1000,
  // 最大重试次数
  maxRetries: 3
};

/**
 * 位置数据持久化服务类
 */
class LocationPersistenceService {
  constructor () {
    this.config = { ...DEFAULT_CONFIG };
    this.autoSaveTimer = null;
    this.isBrowser = typeof window !== 'undefined';
  }

  /**
   * 检查是否在浏览器环境
   * @returns {boolean}
   */
  isBrowserEnvironment () {
    return this.isBrowser && typeof localStorage !== 'undefined';
  }

  /**
   * 保存位置数据到本地存储
   * @param {Object} locationData - 位置数据
   * @param {Object} metadata - 元数据（提供商、响应时间等）
   * @returns {boolean} 是否保存成功
   */
  saveLocation (locationData, metadata = {}) {
    if (!this.isBrowserEnvironment()) {
      console.warn('[LocationPersistence] 非浏览器环境，无法保存');
      return false;
    }

    try {
      if (!locationData || typeof locationData !== 'object') {
        console.warn('[LocationPersistence] 无效的位置数据');
        return false;
      }

      const dataToSave = {
        location: locationData,
        metadata: {
          provider: metadata.provider || locationData.source || 'unknown',
          responseTime: metadata.responseTime || null,
          timestamp: Date.now(),
          ...metadata
        },
        version: '1.0' // 数据版本，用于未来兼容性
      };

      const serialized = JSON.stringify(dataToSave);
      localStorage.setItem(STORAGE_KEY, serialized);

      console.log('[LocationPersistence] 位置数据已保存:', {
        city: locationData.city,
        provider: dataToSave.metadata.provider,
        timestamp: new Date(dataToSave.metadata.timestamp).toLocaleString()
      });

      return true;
    } catch (error) {
      console.error('[LocationPersistence] 保存位置数据失败:', error);

      // 处理存储空间不足的情况
      if (error.name === 'QuotaExceededError') {
        this.handleStorageFull();
      }

      return false;
    }
  }

  /**
   * 从本地存储读取位置数据
   * @returns {Object|null} 位置数据对象，包含 location 和 metadata
   */
  loadLocation () {
    if (!this.isBrowserEnvironment()) {
      console.warn('[LocationPersistence] 非浏览器环境，无法读取');
      return null;
    }

    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        console.log('[LocationPersistence] 未找到存储的位置数据');
        return null;
      }

      const parsed = JSON.parse(serialized);

      // 验证数据完整性
      if (!this.validateData(parsed)) {
        console.warn('[LocationPersistence] 存储的数据无效，已清除');
        this.clearLocation();
        return null;
      }

      console.log('[LocationPersistence] 位置数据已恢复:', {
        city: parsed.location.city,
        provider: parsed.metadata.provider,
        age: this.formatAge(Date.now() - parsed.metadata.timestamp)
      });

      return parsed;
    } catch (error) {
      console.error('[LocationPersistence] 读取位置数据失败:', error);

      // 数据损坏，清除存储
      if (error instanceof SyntaxError) {
        console.warn('[LocationPersistence] 数据格式错误，已清除');
        this.clearLocation();
      }

      return null;
    }
  }

  /**
   * 清除存储的位置数据
   * @returns {boolean} 是否清除成功
   */
  clearLocation () {
    if (!this.isBrowserEnvironment()) {
      return false;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[LocationPersistence] 位置数据已清除');
      return true;
    } catch (error) {
      console.error('[LocationPersistence] 清除位置数据失败:', error);
      return false;
    }
  }

  /**
   * 检查存储的数据是否过期
   * @param {Object} data - 存储的数据对象
   * @returns {boolean} 是否过期
   */
  isExpired (data) {
    if (!data || !data.metadata || !data.metadata.timestamp) {
      return true;
    }

    const age = Date.now() - data.metadata.timestamp;
    return age > this.config.expireTime;
  }

  /**
   * 获取数据年龄（毫秒）
   * @param {Object} data - 存储的数据对象
   * @returns {number} 年龄（毫秒）
   */
  getDataAge (data) {
    if (!data || !data.metadata || !data.metadata.timestamp) {
      return Infinity;
    }
    return Date.now() - data.metadata.timestamp;
  }

  /**
   * 格式化年龄显示
   * @param {number} ageMs - 年龄（毫秒）
   * @returns {string} 格式化后的字符串
   */
  formatAge (ageMs) {
    if (ageMs < 60000) return '刚刚';
    if (ageMs < 3600000) return `${Math.floor(ageMs / 60000)}分钟前`;
    if (ageMs < 86400000) return `${Math.floor(ageMs / 3600000)}小时前`;
    return `${Math.floor(ageMs / 86400000)}天前`;
  }

  /**
   * 验证数据完整性
   * @param {Object} data - 数据对象
   * @returns {boolean} 是否有效
   */
  validateData (data) {
    // 检查基本结构
    if (!data || typeof data !== 'object') return false;

    // 检查必要字段
    if (!data.location || typeof data.location !== 'object') return false;
    if (!data.metadata || typeof data.metadata !== 'object') return false;
    if (!data.metadata.timestamp || typeof data.metadata.timestamp !== 'number') return false;

    // 检查位置数据必要字段
    if (!data.location.city && !data.location.latitude && !data.location.longitude) {
      return false;
    }

    return true;
  }

  /**
   * 处理存储空间不足的情况
   */
  handleStorageFull () {
    console.warn('[LocationPersistence] 存储空间不足，尝试清理旧数据');

    try {
      // 清理其他可能占用空间的数据（保留位置数据）
      const keysToPreserve = [STORAGE_KEY];
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToPreserve.includes(key)) {
          keysToRemove.push(key);
        }
      }

      // 删除最旧的数据（这里简单删除前几个）
      keysToRemove.slice(0, 5).forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`[LocationPersistence] 已清理: ${key}`);
        } catch (e) {
          // 忽略单个删除错误
        }
      });

      console.log('[LocationPersistence] 存储空间清理完成');
    } catch (error) {
      console.error('[LocationPersistence] 清理存储空间失败:', error);
    }
  }

  /**
   * 启动自动保存
   * @param {Function} getDataCallback - 获取当前数据的回调函数
   */
  startAutoSave (getDataCallback) {
    if (!this.isBrowserEnvironment()) return;

    // 清除现有的定时器
    this.stopAutoSave();

    console.log('[LocationPersistence] 启动自动保存');

    this.autoSaveTimer = setInterval(() => {
      try {
        const data = getDataCallback();
        if (data && data.location) {
          this.saveLocation(data.location, data.metadata);
        }
      } catch (error) {
        console.error('[LocationPersistence] 自动保存失败:', error);
      }
    }, this.config.autoSaveInterval);
  }

  /**
   * 停止自动保存
   */
  stopAutoSave () {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
      console.log('[LocationPersistence] 停止自动保存');
    }
  }

  /**
   * 获取存储统计信息
   * @returns {Object} 统计信息
   */
  getStats () {
    if (!this.isBrowserEnvironment()) {
      return { available: false };
    }

    try {
      const data = this.loadLocation();
      if (!data) {
        return {
          available: true,
          hasData: false,
          storageUsed: this.getStorageSize()
        };
      }

      const age = this.getDataAge(data);
      const isExpired = this.isExpired(data);

      return {
        available: true,
        hasData: true,
        city: data.location.city,
        provider: data.metadata.provider,
        timestamp: data.metadata.timestamp,
        age: this.formatAge(age),
        ageMs: age,
        isExpired,
        storageUsed: this.getStorageSize()
      };
    } catch (error) {
      console.error('[LocationPersistence] 获取统计信息失败:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * 获取存储大小（近似值）
   * @returns {string} 格式化的大小字符串
   */
  getStorageSize () {
    if (!this.isBrowserEnvironment()) return 'N/A';

    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          totalSize += (key.length + (value ? value.length : 0)) * 2; // UTF-16
        }
      }

      if (totalSize < 1024) return `${totalSize} B`;
      if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(2)} KB`;
      return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
    } catch (error) {
      return 'Unknown';
    }
  }

  /**
   * 更新配置
   * @param {Object} config - 配置对象
   */
  setConfig (config) {
    this.config = { ...this.config, ...config };
    console.log('[LocationPersistence] 配置已更新:', this.config);
  }

  /**
   * 获取当前配置
   * @returns {Object} 配置对象
   */
  getConfig () {
    return { ...this.config };
  }
}

// 创建单例实例
const locationPersistenceService = new LocationPersistenceService();

export default locationPersistenceService;
export { LocationPersistenceService, STORAGE_KEY };
