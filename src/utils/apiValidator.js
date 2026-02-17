/**
 * API验证模块
 * 提供API端点和密钥的验证功能
 */

import { getDefaultConfig, getProviderDisplayName } from '../config/defaultApiConfig.js';

/**
 * API验证器类
 */
class ApiValidator {
  constructor () {
    this.errorCodes = {
      MISSING_API_KEY: 'MISSING_API_KEY',
      INVALID_KEY_FORMAT: 'INVALID_KEY_FORMAT',
      KEY_TOO_SHORT: 'KEY_TOO_SHORT',
      KEY_TOO_LONG: 'KEY_TOO_LONG',
      MISSING_URL: 'MISSING_URL',
      INVALID_URL_FORMAT: 'INVALID_URL_FORMAT',
      INVALID_PROTOCOL: 'INVALID_PROTOCOL',
      URL_NOT_ACCESSIBLE: 'URL_NOT_ACCESSIBLE',
      SUSPICIOUS_FORMAT: 'SUSPICIOUS_FORMAT',
      KEY_NOT_REQUIRED: 'KEY_NOT_REQUIRED'
    };
  }

  /**
   * 验证API端点URL
   * @param {string} url - API端点URL
   * @returns {Object} 验证结果
   */
  validateEndpoint (url) {
    const errors = [];
    const warnings = [];

    if (!url || url.trim() === '') {
      errors.push({
        field: 'url',
        code: this.errorCodes.MISSING_URL,
        message: 'API端点URL未配置'
      });
      return { valid: false, errors, warnings };
    }

    try {
      const parsed = new URL(url);

      // 验证协议
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.push({
          field: 'url',
          code: this.errorCodes.INVALID_PROTOCOL,
          message: `无效的协议: ${parsed.protocol}。必须使用http或https`,
          actual: parsed.protocol
        });
      }

      // 验证主机名
      if (!parsed.hostname || parsed.hostname === '') {
        errors.push({
          field: 'url',
          code: this.errorCodes.INVALID_URL_FORMAT,
          message: 'URL中缺少主机名'
        });
      }

      // 警告：使用HTTP而不是HTTPS
      if (parsed.protocol === 'http:' && !url.includes('localhost')) {
        warnings.push({
          field: 'url',
          code: 'INSECURE_PROTOCOL',
          message: '建议使用HTTPS协议以确保安全'
        });
      }
    } catch (e) {
      errors.push({
        field: 'url',
        code: this.errorCodes.INVALID_URL_FORMAT,
        message: `URL格式无效: ${url}`,
        error: e.message
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 验证API密钥
   * @param {string} provider - 提供商名称
   * @param {string} apiKey - API密钥
   * @returns {Object} 验证结果
   */
  validateApiKey (provider, apiKey) {
    const errors = [];
    const warnings = [];
    const config = getDefaultConfig(provider);

    // 检查是否需要密钥
    if (config.noKeyRequired) {
      warnings.push({
        field: 'apiKey',
        code: this.errorCodes.KEY_NOT_REQUIRED,
        message: `${getProviderDisplayName(provider)}本地部署不需要API密钥`,
        provider
      });
      return { valid: true, errors, warnings };
    }

    // 检查密钥是否存在
    if (!apiKey || apiKey.trim() === '') {
      errors.push({
        field: 'apiKey',
        code: this.errorCodes.MISSING_API_KEY,
        message: `${getProviderDisplayName(provider)}: API密钥未配置`,
        provider,
        suggestion: '请在设置中配置API密钥'
      });
      return { valid: false, errors, warnings };
    }

    // 检查是否是占位符
    if (apiKey === 'your-api-key-here' ||
        apiKey === 'your-ai-api-key-here' ||
        apiKey === 'my-api-key' ||
        apiKey === 'sk-your-key-here') {
      errors.push({
        field: 'apiKey',
        code: this.errorCodes.MISSING_API_KEY,
        message: `${getProviderDisplayName(provider)}: API密钥是占位符，需要替换为真实密钥`,
        provider,
        suggestion: '请在设置中配置真实的API密钥'
      });
      return { valid: false, errors, warnings };
    }

    // 提供商特定验证
    switch (provider) {
      case 'openrouter':
        this.validateOpenRouterKey(apiKey, errors, warnings);
        break;
      case 'zhipu':
        this.validateZhipuKey(apiKey, errors, warnings);
        break;
      case 'qiniu':
        this.validateQiniuKey(apiKey, errors, warnings);
        break;
      case 'ollama':
        // Ollama不需要密钥
        break;
      default:
        this.validateGenericKey(apiKey, errors, warnings);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * 验证OpenRouter密钥
   */
  validateOpenRouterKey (apiKey, errors, warnings) {
    // 格式检查
    if (!apiKey.startsWith('sk-or-v1-')) {
      errors.push({
        field: 'apiKey',
        code: this.errorCodes.INVALID_KEY_FORMAT,
        message: 'OpenRouter API密钥格式错误',
        provider: 'openrouter',
        expected: 'sk-or-v1-...',
        actual: apiKey.substring(0, Math.min(apiKey.length, 15)) + '...',
        suggestion: 'OpenRouter密钥应以"sk-or-v1-"开头'
      });
    }

    // 长度检查
    if (apiKey.length < 30) {
      errors.push({
        field: 'apiKey',
        code: this.errorCodes.KEY_TOO_SHORT,
        message: 'OpenRouter API密钥太短',
        provider: 'openrouter',
        minLength: 30,
        actualLength: apiKey.length,
        suggestion: '请检查密钥是否完整复制'
      });
    }

    if (apiKey.length > 200) {
      warnings.push({
        field: 'apiKey',
        code: this.errorCodes.KEY_TOO_LONG,
        message: 'API密钥长度异常，可能包含多余字符',
        provider: 'openrouter',
        actualLength: apiKey.length
      });
    }
  }

  /**
   * 验证智谱AI密钥
   * 智谱AI密钥以数字开头，格式为纯数字字符串
   */
  validateZhipuKey (apiKey, errors, warnings) {
    // 智谱AI密钥以数字开头
    if (!/^\d/.test(apiKey)) {
      warnings.push({
        field: 'apiKey',
        code: this.errorCodes.SUSPICIOUS_FORMAT,
        message: '智谱AI API密钥格式异常',
        provider: 'zhipu',
        expected: '以数字开头',
        actual: apiKey.substring(0, Math.min(apiKey.length, 10)) + '...',
        suggestion: '智谱AI密钥应以数字开头'
      });
    }

    if (apiKey.length < 20) {
      errors.push({
        field: 'apiKey',
        code: this.errorCodes.KEY_TOO_SHORT,
        message: '智谱AI API密钥太短',
        provider: 'zhipu',
        minLength: 20,
        actualLength: apiKey.length
      });
    }
  }

  /**
   * 验证七牛云密钥
   */
  validateQiniuKey (apiKey, errors, warnings) {
    if (apiKey.length < 20) {
      errors.push({
        field: 'apiKey',
        code: this.errorCodes.KEY_TOO_SHORT,
        message: '七牛云AI API密钥太短',
        provider: 'qiniu',
        minLength: 20,
        actualLength: apiKey.length
      });
    }

    // 七牛云密钥通常包含字母和数字
    if (!/[a-zA-Z]/.test(apiKey) || !/[0-9]/.test(apiKey)) {
      warnings.push({
        field: 'apiKey',
        code: this.errorCodes.SUSPICIOUS_FORMAT,
        message: '七牛云API密钥应包含字母和数字',
        provider: 'qiniu'
      });
    }
  }

  /**
   * 通用密钥验证
   */
  validateGenericKey (apiKey, errors, warnings) {
    if (apiKey.length < 10) {
      errors.push({
        field: 'apiKey',
        code: this.errorCodes.KEY_TOO_SHORT,
        message: 'API密钥太短',
        minLength: 10,
        actualLength: apiKey.length
      });
    }

    if (apiKey.includes(' ')) {
      errors.push({
        field: 'apiKey',
        code: this.errorCodes.INVALID_KEY_FORMAT,
        message: 'API密钥不应包含空格',
        suggestion: '请删除密钥中的空格字符'
      });
    }
  }

  /**
   * 验证完整API配置
   * @param {Object} config - API配置对象
   * @returns {Object} 完整验证结果
   */
  validateConfig (config) {
    const results = {
      valid: true,
      provider: null,
      errors: [],
      warnings: [],
      details: {}
    };

    // 检查每个提供商
    const providers = ['openrouter', 'zhipu', 'ollama', 'qiniu'];
    let validProvider = null;
    let hasAnyKeyConfigured = false;

    for (const provider of providers) {
      const providerConfig = config[provider];
      if (!providerConfig) continue;

      const endpointValidation = this.validateEndpoint(providerConfig.url);
      const keyValidation = this.validateApiKey(provider, providerConfig.apiKey);

      const isUsable = endpointValidation.valid && keyValidation.valid;

      // 检查是否有配置尝试（非空密钥）
      if (providerConfig.apiKey && providerConfig.apiKey.trim() !== '') {
        hasAnyKeyConfigured = true;
      }

      results.details[provider] = {
        endpoint: endpointValidation,
        apiKey: keyValidation,
        usable: isUsable,
        config: providerConfig
      };

      if (isUsable && !validProvider) {
        validProvider = provider;
      }

      // 只收集有配置尝试的提供商的错误
      // 或者当前正在使用的提供商的错误
      const hasKeyAttempt = providerConfig.apiKey && providerConfig.apiKey.trim() !== '';
      if (hasKeyAttempt || isUsable) {
        results.errors.push(...endpointValidation.errors);
        results.errors.push(...keyValidation.errors);
        results.warnings.push(...endpointValidation.warnings);
        results.warnings.push(...keyValidation.warnings);
      }
    }

    results.provider = validProvider;
    results.valid = results.errors.length === 0;

    // 如果没有找到有效提供商，添加通用错误
    if (!validProvider) {
      if (!hasAnyKeyConfigured) {
        // 完全没有配置任何密钥
        results.errors.push({
          code: 'NO_API_KEY_CONFIGURED',
          message: '未配置API密钥',
          suggestion: '请在下方输入API密钥并点击保存'
        });
      } else {
        // 配置了密钥但都无法使用
        results.errors.push({
          code: 'NO_VALID_PROVIDER',
          message: '配置的API密钥无效',
          suggestion: '请检查API密钥是否正确，或尝试其他提供商'
        });
      }
      results.valid = false;
    }

    return results;
  }

  /**
   * 格式化错误消息
   * @param {Object} error - 错误对象
   * @returns {string} 格式化后的消息
   */
  formatErrorMessage (error) {
    const providerName = error.provider ? getProviderDisplayName(error.provider) : '';

    let message = '';

    if (providerName) {
      message = `${providerName}: ${error.message}`;
    } else {
      message = error.message;
    }

    if (error.suggestion) {
      message += `。${error.suggestion}`;
    }

    return message;
  }

  /**
   * 格式化所有错误
   * @param {Array} errors - 错误数组
   * @returns {string} 格式化后的消息
   */
  formatAllErrors (errors) {
    if (!errors || errors.length === 0) {
      return '';
    }

    return errors.map(e => this.formatErrorMessage(e)).join('\n');
  }

  /**
   * 获取第一个错误的用户友好消息
   * @param {Array} errors - 错误数组
   * @returns {string} 用户消息
   */
  getFirstErrorMessage (errors) {
    if (!errors || errors.length === 0) {
      return '';
    }

    return this.formatErrorMessage(errors[0]);
  }

  /**
   * 验证特定提供商配置
   * @param {string} provider - 提供商名称
   * @param {Object} config - 配置对象
   * @returns {Object} 验证结果
   */
  validateProviderConfig (provider, config) {
    const endpointValidation = this.validateEndpoint(config.url);
    const keyValidation = this.validateApiKey(provider, config.apiKey);

    return {
      valid: endpointValidation.valid && keyValidation.valid,
      endpoint: endpointValidation,
      apiKey: keyValidation,
      errors: [...endpointValidation.errors, ...keyValidation.errors],
      warnings: [...endpointValidation.warnings, ...keyValidation.warnings]
    };
  }
}

// 创建单例实例
const apiValidator = new ApiValidator();

export default apiValidator;
export { ApiValidator };
