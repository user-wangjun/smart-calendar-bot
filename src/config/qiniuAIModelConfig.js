/**
 * 七牛云AI模型配置模块
 * 负责管理七牛云AI模型的配置信息
 */

import envConfig from './env.js';

/**
 * 七牛云AI模型配置类
 */
class QiniuAIModelConfig {
  /**
   * 获取七牛云AI配置
   * @returns {Object} 配置对象
   */
  static getConfig () {
    return envConfig.getQiniuAIConfig();
  }

  /**
   * 验证七牛云AI配置是否完整
   * @returns {boolean} 配置是否完整
   */
  static validateConfig () {
    const config = this.getConfig();
    return !!config.apiKey;
  }

  /**
   * 获取配置缺失项
   * @returns {Array} 缺失的配置项列表
   */
  static getMissingConfig () {
    const config = this.getConfig();
    const missing = [];

    if (!config.apiKey) missing.push('QINIU_AI_API_KEY');

    return missing;
  }

  /**
   * 更新配置
   * @param {Object} newConfig - 新配置对象
   */
  static updateConfig (newConfig) {
    if (newConfig.apiKey) envConfig.set('QINIU_AI_API_KEY', newConfig.apiKey);
    if (newConfig.baseUrl) envConfig.set('QINIU_AI_API_URL', newConfig.baseUrl);
    if (newConfig.organization) envConfig.set('QINIU_AI_ORGANIZATION', newConfig.organization);
    if (newConfig.project) envConfig.set('QINIU_AI_PROJECT', newConfig.project);
  }

  /**
   * 获取配置状态信息
   * @returns {Object} 配置状态
   */
  static getConfigStatus () {
    const config = this.getConfig();
    const isValid = this.validateConfig();
    const missing = this.getMissingConfig();

    return {
      isValid,
      isConfigured: !!config.apiKey,
      missing,
      baseUrl: config.baseUrl || '未配置',
      organization: config.organization || '未配置',
      project: config.project || '未配置'
    };
  }

  /**
   * 获取支持的模型列表
   * @returns {Array} 模型列表
   */
  static getSupportedModels () {
    return [
      {
        id: 'minimax/minimax-m2.1',
        name: 'MiniMax M2.1',
        description: 'MiniMax M2.1大语言模型，适合通用对话和文本生成',
        maxTokens: 8192,
        contextWindow: 32768,
        type: 'chat'
      },
      {
        id: 'deepseek/deepseek-v3.2-251201',
        name: 'DeepSeek V3.2',
        description: 'DeepSeek V3.2大语言模型，性能优异，适合复杂任务',
        maxTokens: 8192,
        contextWindow: 32768,
        type: 'chat'
      },
      {
        id: 'gpt-oss-120b',
        name: 'GPT-OSS 120B',
        description: 'GPT-OSS 120B大语言模型，强大的推理能力',
        maxTokens: 8192,
        contextWindow: 32768,
        type: 'chat'
      },
      {
        id: 'doubao-seed-1.6-thinking',
        name: '豆包 1.6 Thinking',
        description: '豆包1.6思考模型，支持深度推理和逻辑分析',
        maxTokens: 8192,
        contextWindow: 32768,
        type: 'chat'
      },
      {
        id: 'qwen3-235b-a22b-instruct-2507',
        name: 'Qwen3 235B Instruct',
        description: '通义千问3 235B指令模型，优秀的中文理解和生成能力',
        maxTokens: 8192,
        contextWindow: 32768,
        type: 'chat'
      }
    ];
  }

  /**
   * 根据模型ID获取模型信息
   * @param {string} modelId - 模型ID
   * @returns {Object|null} 模型信息
   */
  static getModelInfo (modelId) {
    const models = this.getSupportedModels();
    return models.find(model => model.id === modelId) || null;
  }

  /**
   * 获取默认模型配置
   * @returns {Object} 默认配置
   */
  static getDefaultModelConfig () {
    return {
      model: 'qiniu-llm',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false
    };
  }

  /**
   * 验证模型配置参数
   * @param {Object} config - 模型配置
   * @returns {Object} 验证结果
   */
  static validateModelConfig (config) {
    const errors = [];
    const warnings = [];

    // 验证temperature
    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        errors.push('temperature必须在0-2之间');
      } else if (config.temperature > 1.5) {
        warnings.push('temperature值较高，可能导致输出过于随机');
      }
    }

    // 验证max_tokens
    if (config.max_tokens !== undefined) {
      if (config.max_tokens < 1 || config.max_tokens > 8192) {
        errors.push('max_tokens必须在1-8192之间');
      }
    }

    // 验证top_p
    if (config.top_p !== undefined) {
      if (config.top_p < 0 || config.top_p > 1) {
        errors.push('top_p必须在0-1之间');
      }
    }

    // 验证模型是否存在
    if (config.model) {
      const modelInfo = this.getModelInfo(config.model);
      if (!modelInfo) {
        errors.push(`不支持的模型: ${config.model}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default QiniuAIModelConfig;
