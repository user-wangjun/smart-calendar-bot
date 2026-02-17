/**
 * 安全与隐私保护工具
 * 提供对话数据加密、敏感信息过滤等功能
 *
 * @module security
 */

/**
 * 简单的XOR加密（用于本地存储）
 * 注意：这不是强加密，仅用于防止简单的数据泄露
 */
export class SimpleEncryption {
  constructor (key) {
    this.key = key || this.generateKey();
  }

  /**
   * 生成随机密钥
   */
  generateKey () {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 保存密钥到sessionStorage（页面关闭后清除）
    sessionStorage.setItem('chat_encryption_key', key);
    return key;
  }

  /**
   * 获取或创建密钥
   */
  static getKey () {
    let key = sessionStorage.getItem('chat_encryption_key');
    if (!key) {
      const enc = new SimpleEncryption();
      key = enc.key;
    }
    return key;
  }

  /**
   * XOR加密
   */
  encrypt (text) {
    if (!text) return '';
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
      );
    }
    return btoa(result); // Base64编码
  }

  /**
   * XOR解密
   */
  decrypt (encryptedText) {
    if (!encryptedText) return '';
    try {
      const text = atob(encryptedText); // Base64解码
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
        );
      }
      return result;
    } catch (e) {
      console.error('解密失败:', e);
      return '';
    }
  }
}

/**
 * 敏感信息过滤器
 */
export class SensitiveInfoFilter {
  constructor () {
    // 敏感信息模式
    this.patterns = [
      // 身份证号
      { pattern: /\b(\d{6})(\d{4})(\d{4})(\d{3}[\dXx])\b/g, replacement: '$1****$3****' },
      // 手机号
      { pattern: /\b(1[3-9]\d)(\d{4})(\d{4})\b/g, replacement: '$1****$3' },
      // 银行卡号
      { pattern: /\b(\d{4})(\d{8,12})(\d{4})\b/g, replacement: '$1 **** **** $3' },
      // 邮箱
      { pattern: /(\w{2})\w+(@\w+\.\w+)/g, replacement: '$1***$2' },
      // API密钥（通用格式）
      { pattern: /\b(sk-[a-zA-Z0-9]{20,})\b/g, replacement: '***API-KEY***' },
      // 密码
      { pattern: /(password|密码)["']?\s*[:=]\s*["']?[^\s"']+/gi, replacement: '$1: ***' }
    ];
  }

  /**
   * 过滤敏感信息
   * @param {string} text - 原始文本
   * @returns {string} 过滤后的文本
   */
  filter (text) {
    if (!text) return text;

    let filtered = text;
    for (const { pattern, replacement } of this.patterns) {
      filtered = filtered.replace(pattern, replacement);
    }
    return filtered;
  }

  /**
   * 检查是否包含敏感信息
   * @param {string} text - 文本
   * @returns {boolean} 是否包含敏感信息
   */
  containsSensitiveInfo (text) {
    if (!text) return false;

    for (const { pattern } of this.patterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }
}

/**
 * 安全的本地存储
 */
export class SecureStorage {
  constructor () {
    this.encryption = new SimpleEncryption(SimpleEncryption.getKey());
    this.sensitiveFilter = new SensitiveInfoFilter();
  }

  /**
   * 安全地设置项
   * @param {string} key - 键
   * @param {any} value - 值
   * @param {boolean} encrypt - 是否加密
   */
  setItem (key, value, encrypt = true) {
    try {
      const data = JSON.stringify(value);

      // 过滤敏感信息
      const filteredData = this.sensitiveFilter.filter(data);

      if (encrypt) {
        const encrypted = this.encryption.encrypt(filteredData);
        localStorage.setItem(key, encrypted);
      } else {
        localStorage.setItem(key, filteredData);
      }
    } catch (e) {
      console.error('安全存储失败:', e);
    }
  }

  /**
   * 安全地获取项
   * @param {string} key - 键
   * @param {boolean} encrypted - 是否加密存储的
   * @returns {any} 值
   */
  getItem (key, encrypted = true) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;

      if (encrypted) {
        const decrypted = this.encryption.decrypt(data);
        return JSON.parse(decrypted);
      } else {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('安全读取失败:', e);
      return null;
    }
  }

  /**
   * 删除项
   * @param {string} key - 键
   */
  removeItem (key) {
    localStorage.removeItem(key);
  }

  /**
   * 清空所有对话数据
   */
  clearChatData () {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('chat_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * 获取存储使用情况
   */
  getStorageInfo () {
    let totalSize = 0;
    let chatSize = 0;

    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        const size = localStorage[key].length * 2; // UTF-16编码，每个字符2字节
        totalSize += size;
        if (key.startsWith('chat_')) {
          chatSize += size;
        }
      }
    }

    return {
      totalSize: (totalSize / 1024).toFixed(2) + ' KB',
      chatSize: (chatSize / 1024).toFixed(2) + ' KB',
      totalItems: Object.keys(localStorage).length
    };
  }
}

/**
 * 隐私保护工具
 */
export class PrivacyProtection {
  /**
   * 匿名化用户数据
   * @param {Object} data - 用户数据
   * @returns {Object} 匿名化后的数据
   */
  static anonymize (data) {
    if (!data) return data;

    const anonymized = { ...data };

    // 删除或匿名化敏感字段
    const sensitiveFields = ['name', 'email', 'phone', 'address', 'ip'];
    sensitiveFields.forEach(field => {
      if (anonymized[field]) {
        anonymized[field] = '***';
      }
    });

    return anonymized;
  }

  /**
   * 生成隐私报告
   */
  static generatePrivacyReport () {
    const secureStorage = new SecureStorage();
    const storageInfo = secureStorage.getStorageInfo();

    return {
      storageUsed: storageInfo,
      encryptionEnabled: true,
      sensitiveInfoFiltered: true,
      dataRetention: '本地存储，可手动清除',
      lastCleared: localStorage.getItem('chat_last_cleared') || '从未'
    };
  }

  /**
   * 清除所有数据
   */
  static clearAllData () {
    const secureStorage = new SecureStorage();
    secureStorage.clearChatData();
    localStorage.setItem('chat_last_cleared', new Date().toISOString());
  }
}

// 创建单例
export const secureStorage = new SecureStorage();
export const sensitiveInfoFilter = new SensitiveInfoFilter();

// 便捷函数
export function encryptData (data) {
  const encryption = new SimpleEncryption(SimpleEncryption.getKey());
  return encryption.encrypt(JSON.stringify(data));
}

export function decryptData (encryptedData) {
  const encryption = new SimpleEncryption(SimpleEncryption.getKey());
  const decrypted = encryption.decrypt(encryptedData);
  return JSON.parse(decrypted);
}

export function filterSensitiveInfo (text) {
  return sensitiveInfoFilter.filter(text);
}

export default {
  SimpleEncryption,
  SensitiveInfoFilter,
  SecureStorage,
  PrivacyProtection,
  secureStorage,
  sensitiveInfoFilter,
  encryptData,
  decryptData,
  filterSensitiveInfo
};
