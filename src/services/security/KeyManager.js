/**
 * 统一密钥管理服务
 * 核心职责：
 * 1. 统一获取入口，屏蔽底层存储差异（Env vs Storage）
 * 2. 分层权限控制（Dev/Prod 策略）
 * 3. 强制格式校验
 * 4. 访问审计（日志记录）
 */

import envConfig from '../../config/env.js';
import apiKeyManager from '../../config/apiKeyManager.js';
import { getValidator } from './KeyValidators.js';

// 运行环境检测
const isProd = import.meta.env.PROD;

class KeyManager {
  constructor () {
    this.auditLog = [];
    this.maxLogSize = 100;
  }

  /**
   * 获取密钥（对外唯一接口）
   * @param {string} keyName 密钥名称 (e.g. 'OPENROUTER_API_KEY')
   * @param {Object} options 选项 { strict: boolean }
   * @returns {string|null} 密钥原文或 null
   */
  getKey (keyName, options = { strict: true }) {
    let key = null;
    let source = 'none';

    // 策略：
    // 生产环境 (Prod): 优先使用环境变量 (Code-built-in/Injected)，其次是用户配置 (User-filled)
    // 开发环境 (Dev): 优先使用用户配置 (User-filled) 以便调试，其次是环境变量 (.env)

    // 注意：具体优先级可根据业务需求调整。
    // 这里假设生产环境 Vercel 注入的变量最权威，但如果允许用户覆盖（例如 Bring Your Own Key），则需反转。
    // 根据用户需求 "开发环境使用只读测试密钥，生产密钥由运维动态下发"，
    // 我们可以理解为：
    // Prod: Env Vars (运维下发) > LocalStorage (用户填写的)
    // Dev: LocalStorage (开发者填写的) > Env Vars (.env 测试密钥)

    if (isProd) {
      // 1. 尝试从环境变量获取 (运维下发/CI注入)
      key = this._getFromEnv(keyName);
      if (key) {
        source = 'env_var';
      } else {
        // 2. 尝试从用户配置获取 (BYOK 模式)
        key = this._getFromStorage(keyName);
        if (key) source = 'user_storage';
      }
    } else {
      // Dev 环境
      // 1. 尝试从用户配置获取 (本地调试优先)
      key = this._getFromStorage(keyName);
      if (key) {
        source = 'user_storage';
      } else {
        // 2. 尝试从环境变量获取 (.env 文件)
        key = this._getFromEnv(keyName);
        if (key) source = 'env_var';
      }
    }

    // 记录审计日志 (不记录密钥内容)
    this._logAccess(keyName, !!key, source);

    // 验证
    if (key && options.strict) {
      const validator = getValidator(keyName);
      if (!validator(key)) {
        console.warn(`[KeyManager] Security Warning: Key ${keyName} from ${source} failed validation.`);
        // 验证失败策略：在严格模式下返回 null
        return null;
      }
    }

    return key;
  }

  /**
   * 设置用户自定义密钥
   * @param {string} keyName
   * @param {string} value
   */
  async setUserKey (keyName, value) {
    const validator = getValidator(keyName);
    if (!validator(value)) {
      throw new Error(`Invalid format for key: ${keyName}`);
    }
    // 使用现有的 ApiKeyManager 存储到 LocalStorage (加密)
    // 需要适配 ApiKeyManager 的接口。
    // ApiKeyManager 目前主要针对 Provider 存储 (e.g., 'openrouter', 'zhipu')
    // 我们需要映射 KeyName 到 Provider Name

    const provider = this._mapKeyToProvider(keyName);
    if (provider) {
      await apiKeyManager.saveApiKey(provider, value);
      return true;
    }
    return false;
  }

  /**
   * 内部方法：从环境变量获取
   */
  _getFromEnv (keyName) {
    // envConfig.config 已经加载了环境变量
    return envConfig.config[keyName] || null;
  }

  /**
   * 内部方法：从存储获取
   */
  _getFromStorage (keyName) {
    const provider = this._mapKeyToProvider(keyName);
    if (!provider) return null;
    return apiKeyManager.getApiKey(provider);
  }

  /**
   * 映射 KeyName 到 ApiKeyManager 的 provider 名称
   */
  _mapKeyToProvider (keyName) {
    if (keyName === 'OPENROUTER_API_KEY') return 'openrouter';
    if (keyName === 'ZHIPU_API_KEY') return 'zhipu';
    if (keyName === 'QINIU_AI_API_KEY') return 'qiniu';
    // 其他如地图 Key 目前 ApiKeyManager 可能未管理，需要扩展或直接存取
    return null;
  }

  /**
   * 记录访问日志
   */
  _logAccess (keyName, success, source) {
    const entry = {
      timestamp: new Date().toISOString(),
      key: keyName,
      success,
      source,
      env: isProd ? 'prod' : 'dev'
    };

    this.auditLog.unshift(entry);
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog.pop();
    }

    // 开发环境打印日志
    if (!isProd) {
      // console.debug(`[KeyManager] Access: ${keyName} (${source}) -> ${success ? 'OK' : 'MISSING'}`);
    }
  }

  /**
   * 获取审计日志
   */
  getAuditLog () {
    return [...this.auditLog];
  }
}

export default new KeyManager();
