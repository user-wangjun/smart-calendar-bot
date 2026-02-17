/**
 * 加密工具
 * 使用 Web Crypto API 实现数据加密和解密功能
 */

class EncryptionManager {
  constructor () {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12; // GCM 模式使用 12 字节 IV
    this.saltLength = 16;

    // 密钥存储键名
    this.storageKeys = {
      masterKey: 'encryption_master_key',
      masterSalt: 'encryption_master_salt',
      userPassword: 'encryption_user_password'
    };

    this.masterKey = null;
    this.initialized = false;
  }

  /**
   * 初始化加密管理器
   * @param {string} password - 用户密码（可选）
   * @returns {Promise<boolean>} - 初始化是否成功
   */
  async initialize (password = null) {
    try {
      // 检查是否已有主密钥
      const existingKey = localStorage.getItem(this.storageKeys.masterKey);
      const existingSalt = localStorage.getItem(this.storageKeys.masterSalt);

      if (existingKey && existingSalt) {
        // 使用现有密钥
        this.masterKey = await this.importKey(existingKey, existingSalt);
        this.initialized = true;
        console.log('使用现有加密密钥');
        return true;
      }

      // 如果提供了密码，使用密码生成密钥
      if (password) {
        const { key, salt } = await this.generateKeyFromPassword(password);

        // 保存密钥和盐值
        localStorage.setItem(this.storageKeys.masterKey, key);
        localStorage.setItem(this.storageKeys.masterSalt, salt);
        localStorage.setItem(this.storageKeys.userPassword, this.hashPassword(password));

        this.masterKey = key;
        this.initialized = true;
        console.log('使用密码生成新加密密钥');
        return true;
      }

      // 生成随机密钥（无密码保护）
      const { key, salt } = await this.generateRandomKey();

      localStorage.setItem(this.storageKeys.masterKey, key);
      localStorage.setItem(this.storageKeys.masterSalt, salt);

      this.masterKey = key;
      this.initialized = true;
      console.log('生成随机加密密钥');
      return true;
    } catch (error) {
      console.error('加密管理器初始化失败:', error);
      return false;
    }
  }

  /**
   * 从密码生成密钥
   * @param {string} password - 用户密码
   * @returns {Promise<Object>} - 密钥和盐值
   */
  async generateKeyFromPassword (password) {
    // 生成随机盐值
    const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));

    // 使用 PBKDF2 派生密钥
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordBuffer,
      { name: 'AES-GCM', length: this.keyLength }
    );

    // 导出密钥
    const keyBuffer = await crypto.subtle.exportKey('raw', keyMaterial);
    const keyArray = new Uint8Array(keyBuffer);

    // 转换为 Base64 存储
    const keyBase64 = this.arrayBufferToBase64(keyArray);
    const saltBase64 = this.arrayBufferToBase64(salt);

    return { key: keyBase64, salt: saltBase64 };
  }

  /**
   * 生成随机密钥
   * @returns {Promise<Object>} - 密钥和盐值
   */
  async generateRandomKey () {
    // 生成随机密钥
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: this.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );

    // 生成随机盐值
    const salt = crypto.getRandomValues(new Uint8Array(this.saltLength));

    // 导出密钥
    const keyBuffer = await crypto.subtle.exportKey('raw', key);
    const keyArray = new Uint8Array(keyBuffer);

    // 转换为 Base64 存储
    const keyBase64 = this.arrayBufferToBase64(keyArray);
    const saltBase64 = this.arrayBufferToBase64(salt);

    return { key: keyBase64, salt: saltBase64 };
  }

  /**
   * 导入密钥
   * @param {string} keyBase64 - Base64 编码的密钥
   * @param {string} saltBase64 - Base64 编码的盐值
   * @returns {Promise<CryptoKey>} - 密钥对象
   */
  async importKey (keyBase64, saltBase64) {
    const keyArray = this.base64ToArrayBuffer(keyBase64);
    // const salt = this.base64ToArrayBuffer(saltBase64);

    return await crypto.subtle.importKey(
      'raw',
      keyArray,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 加密数据
   * @param {string} plaintext - 明文数据
   * @param {Object} options - 加密选项
   * @returns {Promise<Object>} - 加密结果
   */
  async encrypt (plaintext, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(plaintext);

      // 生成随机 IV
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));

      // 加密数据
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.masterKey,
        dataBuffer
      );

      // 组合 IV 和加密数据
      const combined = new Uint8Array(
        iv.length + encryptedBuffer.byteLength
      );
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // 转换为 Base64
      const encryptedBase64 = this.arrayBufferToBase64(combined);

      return {
        success: true,
        data: encryptedBase64,
        iv: this.arrayBufferToBase64(iv),
        algorithm: this.algorithm,
        keyLength: this.keyLength
      };
    } catch (error) {
      console.error('加密失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 解密数据
   * @param {string} encryptedData - 加密数据（Base64）
   * @param {string} ivBase64 - IV（Base64）
   * @returns {Promise<Object>} - 解密结果
   */
  async decrypt (encryptedData, ivBase64) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 解析 Base64 数据
      const combined = this.base64ToArrayBuffer(encryptedData);
      const iv = this.base64ToArrayBuffer(ivBase64);

      // 分离 IV 和加密数据
      const encryptedBuffer = combined.slice(iv.length);

      // 解密数据
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.masterKey,
        encryptedBuffer
      );

      // 转换为字符串
      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decryptedBuffer);

      return {
        success: true,
        data: plaintext
      };
    } catch (error) {
      console.error('解密失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 加密对象
   * @param {Object} obj - 要加密的对象
   * @param {Object} options - 加密选项
   * @returns {Promise<Object>} - 加密结果
   */
  async encryptObject (obj, options = {}) {
    try {
      const jsonString = JSON.stringify(obj);
      const result = await this.encrypt(jsonString, options);

      return {
        ...result,
        originalType: 'object'
      };
    } catch (error) {
      console.error('加密对象失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 解密对象
   * @param {string} encryptedData - 加密数据
   * @param {string} ivBase64 - IV
   * @returns {Promise<Object>} - 解密结果
   */
  async decryptObject (encryptedData, ivBase64) {
    try {
      const result = await this.decrypt(encryptedData, ivBase64);

      if (!result.success) {
        return result;
      }

      const jsonString = result.data;
      const obj = JSON.parse(jsonString);

      return {
        ...result,
        data: obj,
        originalType: 'object'
      };
    } catch (error) {
      console.error('解密对象失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 哈希密码（用于验证）
   * @param {string} password - 密码
   * @returns {string} - 哈希值
   */
  hashPassword (password) {
    // 使用 SHA-256 哈希密码
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
      const hashArray = new Uint8Array(hashBuffer);
      return this.arrayBufferToBase64(hashArray);
    });
  }

  /**
   * 验证密码
   * @param {string} password - 密码
   * @returns {Promise<boolean>} - 密码是否正确
   */
  async verifyPassword (password) {
    try {
      const savedHash = localStorage.getItem(this.storageKeys.userPassword);
      if (!savedHash) {
        return false;
      }

      const currentHash = await this.hashPassword(password);
      return currentHash === savedHash;
    } catch (error) {
      console.error('密码验证失败:', error);
      return false;
    }
  }

  /**
   * 更改密码
   * @param {string} oldPassword - 旧密码
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} - 更改结果
   */
  async changePassword (oldPassword, newPassword) {
    try {
      // 验证旧密码
      const isValid = await this.verifyPassword(oldPassword);
      if (!isValid) {
        return {
          success: false,
          message: '旧密码不正确'
        };
      }

      // 生成新密钥
      const { key, salt } = await this.generateKeyFromPassword(newPassword);

      // 更新存储
      localStorage.setItem(this.storageKeys.masterKey, key);
      localStorage.setItem(this.storageKeys.masterSalt, salt);
      localStorage.setItem(this.storageKeys.userPassword, await this.hashPassword(newPassword));

      // 重新初始化
      this.masterKey = await this.importKey(key, salt);

      console.log('密码已更改');
      return {
        success: true,
        message: '密码更改成功'
      };
    } catch (error) {
      console.error('密码更改失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 重置加密（清除密钥）
   * @returns {Promise<boolean>} - 重置是否成功
   */
  async reset () {
    try {
      // 清除所有加密相关数据
      localStorage.removeItem(this.storageKeys.masterKey);
      localStorage.removeItem(this.storageKeys.masterSalt);
      localStorage.removeItem(this.storageKeys.userPassword);

      this.masterKey = null;
      this.initialized = false;

      console.log('加密管理器已重置');
      return true;
    } catch (error) {
      console.error('加密管理器重置失败:', error);
      return false;
    }
  }

  /**
   * 获取加密状态
   * @returns {Object>} - 加密状态信息
   */
  getStatus () {
    return {
      initialized: this.initialized,
      algorithm: this.algorithm,
      keyLength: this.keyLength,
      ivLength: this.ivLength,
      hasPassword: !!localStorage.getItem(this.storageKeys.userPassword),
      keyExists: !!localStorage.getItem(this.storageKeys.masterKey)
    };
  }

  /**
   * ArrayBuffer 转 Base64
   * @param {ArrayBuffer} buffer - 二进制数据
   * @returns {string} - Base64 字符串
   */
  arrayBufferToBase64 (buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
  }

  /**
   * Base64 转 ArrayBuffer
   * @param {string} base64 - Base64 字符串
   * @returns {ArrayBuffer} - 二进制数据
   */
  base64ToArrayBuffer (base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
  }

  /**
   * 测试加密功能
   * @returns {Promise<Object>} - 测试结果
   */
  async test () {
    try {
      const testData = '这是一条测试消息';

      // 加密
      const encrypted = await this.encrypt(testData);

      if (!encrypted.success) {
        return {
          success: false,
          message: '加密测试失败'
        };
      }

      // 解密
      const decrypted = await this.decrypt(encrypted.data, encrypted.iv);

      if (!decrypted.success) {
        return {
          success: false,
          message: '解密测试失败'
        };
      }

      // 验证数据一致性
      const isConsistent = decrypted.data === testData;

      return {
        success: isConsistent,
        message: isConsistent ? '加密功能正常' : '加密功能异常',
        testData: {
          original: testData,
          encrypted: encrypted.data.substring(0, 50) + '...',
          decrypted: decrypted.data
        }
      };
    } catch (error) {
      console.error('加密测试失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// 创建全局单例
const encryptionManager = new EncryptionManager();

export default encryptionManager;
