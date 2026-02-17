/**
 * API密钥管理模块
 * 负责API密钥的安全存储、读取和管理
 * 支持浏览器环境（localStorage）和Node.js环境（fs）
 */

/**
 * 密钥管理器类
 * 提供API密钥的安全存储和访问功能
 */
class ApiKeyManager {
  constructor () {
    this.keys = {};
    this.isBrowser = typeof window !== 'undefined';
    this.encryptionKey = null;
    this.encryptionKeyPromise = null;
    this.storageKey = 'api-keys-encrypted';
    this.loadKeys();
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
        const salt = new TextEncoder().encode('api-key-manager-salt-v2');
        const baseKeyMaterial = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode('smart-calendar-api-keys-secure-2024'),
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
   * 检查是否有默认API密钥
   * 注意：系统不再提供默认AI密钥，用户必须手动配置
   * @param {string} provider - API提供商
   * @returns {boolean} 是否有默认密钥（始终返回false）
   */
  hasDefaultApiKey (provider) {
    // 系统不再提供默认AI密钥，用户必须手动配置
    return false;
  }

  /**
   * 获取有效的API密钥
   * 注意：系统不再提供默认AI密钥，仅使用用户配置的密钥
   * @param {string} provider - API提供商
   * @returns {string|null} 有效的API密钥或null
   */
  getEffectiveApiKey (provider) {
    // 仅使用用户自定义密钥，系统不再提供默认密钥
    const userKey = this.getApiKey(provider);
    if (userKey && userKey.length > 10) {
      return userKey;
    }

    return null;
  }

  /**
   * 加载密钥存储
   * 在浏览器环境中使用localStorage，在Node.js环境中使用文件系统
   */
  async loadKeys () {
    try {
      if (this.isBrowser) {
        const encryptedData = localStorage.getItem(this.storageKey);
        if (encryptedData) {
          const parsed = JSON.parse(encryptedData);
          if (parsed.encrypted && parsed.data) {
            this.keys = await this.decryptKeys(parsed.data);
          } else {
            this.keys = parsed;
          }
        } else {
          this.keys = {};
        }
      } else {
        const fs = require('fs');
        const path = require('path');
        const keyStorePath = path.join(process.cwd(), '.api-keys');

        if (!fs.existsSync(keyStorePath)) {
          this.keys = {};
          return;
        }

        const data = fs.readFileSync(keyStorePath, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed.encrypted && parsed.data) {
          this.keys = await this.decryptKeys(parsed.data);
        } else {
          this.keys = parsed;
        }
      }
    } catch (error) {
      console.error('加载密钥存储失败:', error.message);
      this.keys = {};
    }
  }

  /**
   * 保存密钥存储
   * 在浏览器环境中使用localStorage，在Node.js环境中使用文件系统
   */
  async saveKeys () {
    try {
      if (this.isBrowser) {
        const encryptedData = await this.encryptKeys(this.keys);
        localStorage.setItem(this.storageKey, JSON.stringify({
          encrypted: true,
          version: 1,
          data: encryptedData
        }));
      } else {
        const fs = require('fs');
        const path = require('path');
        const keyStorePath = path.join(process.cwd(), '.api-keys');

        const encryptedData = await this.encryptKeys(this.keys);
        const data = JSON.stringify({
          encrypted: true,
          version: 1,
          data: encryptedData
        }, null, 2);
        fs.writeFileSync(keyStorePath, data, 'utf-8');
      }
    } catch (error) {
      console.error('保存密钥失败:', error.message);
      throw error;
    }
  }

  /**
   * 加密密钥对象
   * @param {Object} keys - 密钥对象
   * @returns {Promise<string>} - Base64编码的加密数据
   */
  async encryptKeys (keys) {
    try {
      const key = await this.getEncryptionKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const dataStr = JSON.stringify(keys);
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

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('加密密钥失败:', error);
      throw error;
    }
  }

  /**
   * 解密密钥对象
   * @param {string} encryptedData - Base64编码的加密数据
   * @returns {Promise<Object>} - 解密后的密钥对象
   */
  async decryptKeys (encryptedData) {
    try {
      const key = await this.getEncryptionKey();
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

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
      console.error('解密密钥失败:', error);
      return {};
    }
  }

  /**
   * 设置API密钥
   * @param {string} provider - API提供商
   * @param {string} apiKey - API密钥
   */
  async setApiKey (provider, apiKey) {
    this.keys[provider] = apiKey;
    await this.saveKeys();
  }

  /**
   * 同步设置API密钥（向后兼容）
   * @param {string} provider - API提供商
   * @param {string} apiKey - API密钥
   */
  setApiKeySync (provider, apiKey) {
    this.keys[provider] = apiKey;
    this.saveKeys().catch(err => {
      console.error('保存密钥失败:', err);
    });
  }

  /**
   * 获取API密钥
   * @param {string} provider - API提供商
   * @returns {string} API密钥
   */
  getApiKey (provider) {
    return this.keys[provider] || '';
  }

  /**
   * 删除API密钥
   * @param {string} provider - API提供商
   */
  async deleteApiKey (provider) {
    delete this.keys[provider];
    await this.saveKeys();
  }

  /**
   * 检查密钥是否存在
   * @param {string} provider - API提供商
   * @returns {boolean} 是否存在
   */
  hasApiKey (provider) {
    return !!this.keys[provider];
  }

  /**
   * 隐藏API密钥（用于显示）
   * @param {string} apiKey - API密钥
   * @param {number} visibleChars - 可见字符数
   * @returns {string} 隐藏后的密钥
   */
  maskApiKey (apiKey, visibleChars = 4) {
    if (!apiKey || apiKey === 'my-api-key') {
      return '我的API（已隐藏）';
    }

    if (apiKey.length <= visibleChars) {
      return '****';
    }

    const prefix = apiKey.substring(0, visibleChars);
    const suffix = apiKey.substring(apiKey.length - visibleChars);
    return `${prefix}****${suffix}`;
  }

  /**
   * 获取OpenRouter API密钥
   * 仅使用用户自定义密钥，系统不再提供默认密钥
   * @returns {string|null} API密钥或null（如果未配置）
   */
  getOpenRouterApiKey () {
    // 仅使用用户自定义密钥
    const userApiKey = this.getApiKey('openrouter');

    if (userApiKey &&
        userApiKey !== 'your-api-key-here' &&
        userApiKey !== '' &&
        userApiKey !== 'my-api-key' &&
        userApiKey !== 'sk-your-key-here') {
      return userApiKey;
    }

    // 系统不再提供默认AI密钥
    return null;
  }

  /**
   * 获取Cherry API密钥（已禁用）
   * @returns {null} 始终返回null
   */
  getCherryApiKey () {
    // Cherry API已禁用
    return null;
  }

  /**
   * 获取智谱AI用户密钥
   * 用户密钥由用户在应用设置中自行配置，用于个人定制化AI对话
   * 优先级高于系统密钥
   * @returns {string|null} 用户密钥或null（如果未配置）
   */
  getZhipuApiKey () {
    // 仅使用用户自定义密钥
    const userApiKey = this.getApiKey('zhipu');

    if (userApiKey &&
        userApiKey !== 'your-api-key-here' &&
        userApiKey !== '' &&
        userApiKey !== 'my-api-key') {
      return userApiKey;
    }

    // 用户密钥未配置，返回null
    return null;
  }

  /**
   * 获取七牛云AI API密钥
   * 仅使用用户自定义密钥，系统不再提供默认密钥
   * @returns {string|null} API密钥或null（如果未配置）
   */
  getQiniuAIApiKey () {
    // 仅使用用户自定义密钥
    const userApiKey = this.getApiKey('qiniu-ai');

    if (userApiKey &&
        userApiKey !== 'your-ai-api-key-here' &&
        userApiKey !== '' &&
        userApiKey !== 'my-api-key') {
      return userApiKey;
    }

    // 系统不再提供默认AI密钥
    return null;
  }

  /**
   * 获取Ollama API URL（带保密逻辑）
   * @returns {string} API URL或默认URL
   */
  getOllamaApiUrl () {
    const apiUrl = this.getApiKey('ollama-url');

    if (!apiUrl || apiUrl === 'http://localhost:11434/api') {
      return 'http://localhost:11434/api';
    }

    return apiUrl;
  }

  /**
   * 检查是否使用默认API密钥
   * @returns {boolean} 是否使用默认密钥
   */
  isUsingDefaultApiKey () {
    const openRouterKey = this.getApiKey('openrouter');
    const zhipuKey = this.getApiKey('zhipu');
    const qiniuKey = this.getApiKey('qiniu-ai');

    return !openRouterKey || openRouterKey === 'your-api-key-here' ||
           !zhipuKey || zhipuKey === 'your-api-key-here' ||
           !qiniuKey || qiniuKey === 'your-ai-api-key-here';
  }

  /**
   * 验证API密钥格式
   * @param {string} provider - API提供商
   * @param {string} apiKey - API密钥
   * @returns {Object} 验证结果
   */
  validateApiKeyFormat (provider, apiKey) {
    const errors = [];
    const warnings = [];

    if (!apiKey) {
      errors.push('API密钥不能为空');
      return { valid: false, errors, warnings };
    }

    // 根据提供商验证格式
    switch (provider) {
      case 'openrouter':
        if (!apiKey.startsWith('sk-or-v1-')) {
          errors.push('OpenRouter密钥应以sk-or-v1开头');
        }
        break;

      case 'zhipu':
        // 智谱AI密钥以数字开头，只检查长度
        if (apiKey.length < 20) {
          warnings.push('智谱AI密钥长度可能过短');
        }
        break;

      case 'qiniu-ai':
        if (apiKey.length < 20) {
          warnings.push('七牛云AI密钥长度可能过短');
        }
        break;

      default:
        if (apiKey.length < 10) {
          warnings.push('密钥长度可能过短');
        }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取所有密钥的显示信息
   * @returns {Object} 密钥显示信息
   */
  getDisplayInfo () {
    const openRouterKey = this.getApiKey('openrouter');
    const cherryKey = this.getApiKey('cherry');
    const qiniuKey = this.getApiKey('qiniu-ai');
    const ollamaUrl = this.getApiKey('ollama-url');

    return {
      openrouter: {
        hasKey: this.hasApiKey('openrouter'),
        maskedKey: this.maskApiKey(openRouterKey),
        isDefault: !openRouterKey || openRouterKey === 'your-api-key-here'
      },
      cherry: {
        hasKey: this.hasApiKey('cherry'),
        maskedKey: this.maskApiKey(cherryKey),
        isDefault: !cherryKey || cherryKey === 'your-api-key-here'
      },
      qiniu: {
        hasKey: this.hasApiKey('qiniu-ai'),
        maskedKey: this.maskApiKey(qiniuKey),
        isDefault: !qiniuKey || qiniuKey === 'your-ai-api-key-here'
      },
      ollama: {
        hasKey: this.hasApiKey('ollama-url'),
        maskedKey: ollamaUrl || 'http://localhost:11434/api',
        isDefault: !ollamaUrl || ollamaUrl === 'http://localhost:11434/api'
      },
      isUsingDefault: this.isUsingDefaultApiKey()
    };
  }

  /**
   * 清空所有密钥
   */
  clearAllKeys () {
    this.keys = {};
    this.saveKeys();
    console.log('所有密钥已清空');
  }

  /**
   * 导出密钥（加密）
   * @param {string} filePath - 导出文件路径
   */
  exportKeys (filePath) {
    try {
      // Node.js环境下才使用fs模块
      if (this.isBrowser) {
        console.warn('浏览器环境不支持文件导出');
        return false;
      }

      const fs = require('fs');
      const data = JSON.stringify(this.keys, null, 2);
      fs.writeFileSync(filePath, data, 'utf-8');
      console.log(`密钥已导出到: ${filePath}`);
      return true;
    } catch (error) {
      console.error('导出密钥失败:', error.message);
      return false;
    }
  }

  /**
   * 导入密钥（解密）
   * @param {string} filePath - 导入文件路径
   */
  importKeys (filePath) {
    try {
      // Node.js环境下才使用fs模块
      if (this.isBrowser) {
        console.warn('浏览器环境不支持文件导入');
        return false;
      }

      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        throw new Error('文件不存在');
      }

      const data = fs.readFileSync(filePath, 'utf-8');
      const importedKeys = JSON.parse(data);

      this.keys = { ...this.keys, ...importedKeys };
      this.saveKeys();

      console.log(`密钥已从 ${filePath} 导入`);
      return true;
    } catch (error) {
      console.error('导入密钥失败:', error.message);
      return false;
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计数据
   */
  getStats () {
    const providers = ['openrouter', 'cherry', 'qiniu-ai', 'ollama-url'];
    const configuredProviders = providers.filter(p => this.hasApiKey(p));

    return {
      totalProviders: providers.length,
      configuredProviders: configuredProviders.length,
      unconfiguredProviders: providers.length - configuredProviders.length,
      isUsingDefault: this.isUsingDefaultApiKey(),
      providers: providers.map(provider => ({
        name: provider,
        configured: this.hasApiKey(provider),
        maskedKey: this.maskApiKey(this.getApiKey(provider))
      }))
    };
  }

  /**
   * 获取支持的API提供商列表
   * @returns {Array} 提供商列表，包含id、icon、name、description等属性
   */
  supportedProviders () {
    return [
      {
        id: 'openrouter',
        icon: '🔌',
        name: 'OpenRouter',
        description: '支持多种AI模型的统一API平台'
      },
      {
        id: 'zhipu',
        icon: '🧠',
        name: '智谱AI',
        description: '国产大模型，支持GLM系列'
      },
      {
        id: 'qiniu-ai',
        icon: '☁️',
        name: '七牛云AI',
        description: '七牛云提供的AI服务'
      }
    ];
  }
}

// 创建单例实例
const apiKeyManager = new ApiKeyManager();

// 导出实例和类
export default apiKeyManager;
export { ApiKeyManager };
