/**
 * 模型配置模块
 * 负责管理OpenRouter API的模型参数配置
 */

/**
 * OpenRouter 平台模型
 * 所有通过 OpenRouter API 访问的模型
 */
const OPENROUTER_MODELS = {
  // Arcee AI Trinity Large Preview - 免费
  'arcee-ai/trinity-large-preview:free': {
    name: 'Arcee Trinity Large (Free)',
    description: 'Arcee AI Trinity Large Preview 免费模型，适合通用对话和文本生成',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 32768,
    recommended: true,
    apiProvider: 'openrouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions'
  },

  // Qwen3 Coder - 免费
  'qwen/qwen3-coder:free': {
    name: 'Qwen3 Coder (Free)',
    description: '通义千问3 Coder 免费模型，专为代码生成和编程任务优化',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 32768,
    recommended: true,
    apiProvider: 'openrouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions'
  },

  // Qwen3 Next 80B A3B Instruct - 免费
  'qwen/qwen3-next-80b-a3b-instruct:free': {
    name: 'Qwen3 Next 80B (Free)',
    description: '通义千问3 Next 80B A3B Instruct 免费模型，高性能多语言模型',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 32768,
    recommended: true,
    apiProvider: 'openrouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions'
  },

  // Qwen3 4B - 免费
  'qwen/qwen3-4b:free': {
    name: 'Qwen3 4B (Free)',
    description: '通义千问3 4B 免费模型，轻量级快速响应',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 32768,
    recommended: false,
    apiProvider: 'openrouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions'
  },

  // Qwen 2.5 VL 7B Instruct - 免费 (视觉语言模型)
  'qwen/qwen-2.5-vl-7b-instruct:free': {
    name: 'Qwen 2.5 VL 7B (Free)',
    description: '通义千问2.5 VL 7B 免费视觉语言模型，支持图像理解',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 32768,
    recommended: true,
    apiProvider: 'openrouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions'
  },

  // DeepSeek R1 0528 - 免费
  'deepseek/deepseek-r1-0528:free': {
    name: 'DeepSeek R1 0528 (Free)',
    description: 'DeepSeek R1 0528 免费模型，强大的推理能力',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 32768,
    recommended: true,
    apiProvider: 'openrouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions'
  },

  // NVIDIA Nemotron 3 Nano 30B模型 - 免费
  'nvidia/nemotron-3-nano-30b-a3b:free': {
    name: 'Nemotron 3 Nano 30B (Free)',
    description: 'NVIDIA Nemotron 3 Nano 30B免费模型，适合快速推理',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 4096,
    recommended: true,
    apiProvider: 'openrouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions'
  },

  // Xiaomi MIMO V2 Flash模型 - 免费
  'xiaomi/mimo-v2-flash:free': {
    name: 'Xiaomi MIMO V2 Flash (Free)',
    description: '小米MIMO V2 Flash免费模型，适合快速响应',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 4096,
    recommended: true,
    apiProvider: 'openrouter',
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions'
  }
};

/**
 * Cherry Studio 平台模型（已禁用）
 * 通过 Cherry Studio API 访问的模型
 */
const CHERRY_MODELS = {
  // Cherry API暂时禁用
  // 'agent/deepseek-v3.1-terminus(free)': {
  //   name: 'Agent DeepSeek V3.1 (Free)',
  //   description: 'Cherry平台的DeepSeek V3.1免费模型',
  //   inputCost: 0,
  //   outputCost: 0,
  //   maxTokens: 4096,
  //   recommended: true,
  //   apiProvider: 'cherry',
  //   apiUrl: 'https://api.cherry.ai/v1/chat/completions'
  // }
};

/**
 * 智谱AI 平台模型
 * 通过智谱AI API 访问的模型
 */
const ZHIPU_MODELS = {
  // GLM-4.7-Flash - 轻量级快速模型
  'glm-4.7-flash': {
    name: 'GLM-4.7-Flash',
    description: '智谱AI GLM-4.7-Flash轻量级快速模型，适合简单对话',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 4096,
    recommended: true,
    apiProvider: 'zhipu',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
  },

  // GLM-4.6V-Flash - 视觉模型
  'glm-4.6v-flash': {
    name: 'GLM-4.6V-Flash',
    description: '智谱AI GLM-4.6V-Flash视觉模型，支持图像理解',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 4096,
    recommended: true,
    apiProvider: 'zhipu',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
  },

  // GLM-4-Flash-250414 - 特定版本
  'glm-4-flash-250414': {
    name: 'GLM-4-Flash-250414',
    description: '智谱AI GLM-4-Flash-250414版本，性能稳定',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 4096,
    recommended: true,
    apiProvider: 'zhipu',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
  },

  // GLM-4-Flash - 标准版
  'glm-4-flash': {
    name: 'GLM-4-Flash',
    description: '智谱AI GLM-4-Flash标准版，平衡性能与速度',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 4096,
    recommended: true,
    apiProvider: 'zhipu',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
  },

  // CogView-3-Flash - 图像生成
  'cogview-3-flash': {
    name: 'CogView-3-Flash',
    description: '智谱AI CogView-3-Flash图像生成模型',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 4096,
    recommended: false,
    apiProvider: 'zhipu',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
  }
};

/**
 * 七牛云AI 平台模型
 * 通过七牛云AI API 访问的模型
 */
const QINIU_AI_MODELS = {
  'minimax/minimax-m2.1': {
    name: 'MiniMax M2.1 (Qiniu AI)',
    description: '七牛云平台的MiniMax M2.1大语言模型，适合通用对话和文本生成',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 8192,
    recommended: true,
    apiProvider: 'qiniu-ai',
    apiUrl: '' // 从 envConfig.getQiniuAIApiUrl() 动态获取
  },

  'deepseek/deepseek-v3.2-251201': {
    name: 'DeepSeek V3.2 (Qiniu AI)',
    description: '七牛云平台的DeepSeek V3.2大语言模型，性能优异，适合复杂任务',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 8192,
    recommended: true,
    apiProvider: 'qiniu-ai',
    apiUrl: '' // 从 envConfig.getQiniuAIApiUrl() 动态获取
  }
};

/**
 * Ollama 本地模型
 * 通过本地 Ollama 服务访问的模型
 */
const OLLAMA_MODELS = {
  'qwen2.5:7b': {
    name: 'Qwen 2.5 7B (Ollama)',
    description: '本地运行的通义千问2.5 7B模型，数据隐私性好',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 32768,
    recommended: true,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api/chat'
  },

  'qwen2.5:14b': {
    name: 'Qwen 2.5 14B (Ollama)',
    description: '本地运行的通义千问2.5 14B模型，更强的性能',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 32768,
    recommended: false,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api/chat'
  },

  'llama3.2:3b': {
    name: 'Llama 3.2 3B (Ollama)',
    description: '本地运行的Meta Llama 3.2 3B模型，轻量级',
    inputCost: 0,
    outputCost: 0,
    maxTokens: 128000,
    recommended: true,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api/chat'
  }
};

/**
 * 所有可用模型汇总
 * 用于程序内部查询
 */
const AVAILABLE_MODELS = {
  ...OPENROUTER_MODELS,
  ...CHERRY_MODELS,
  ...ZHIPU_MODELS,
  ...QINIU_AI_MODELS,
  ...OLLAMA_MODELS
};

/**
 * 平台模型分类
 * 方便按平台查看和管理
 */
export const PLATFORM_MODELS = {
  openrouter: {
    name: 'OpenRouter',
    description: 'OpenRouter 平台提供的各种免费和付费模型',
    models: OPENROUTER_MODELS
  },
  // cherry: {
  //   name: 'Cherry Studio',
  //   description: 'Cherry Studio 平台提供的模型（已禁用）',
  //   models: CHERRY_MODELS
  // },
  zhipu: {
    name: '智谱AI',
    description: '智谱AI 平台提供的GLM系列模型',
    models: ZHIPU_MODELS
  },
  'qiniu-ai': {
    name: '七牛云AI',
    description: '七牛云AI 平台提供的模型',
    models: QINIU_AI_MODELS
  },
  ollama: {
    name: 'Ollama 本地',
    description: '本地 Ollama 服务运行的模型',
    models: OLLAMA_MODELS
  }
};

/**
 * 默认模型配置
 */
export const DEFAULT_MODEL_CONFIG = {
  model: 'arcee-ai/trinity-large-preview:free', // 默认使用 Arcee Trinity Large
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0
};

/**
 * 模型配置类
 */
class ModelConfig {
  constructor (config = {}) {
    this.config = {
      ...DEFAULT_MODEL_CONFIG,
      ...config
    };
  }

  /**
   * 设置模型
   * @param {string} modelId - 模型ID
   */
  setModel (modelId) {
    if (AVAILABLE_MODELS[modelId]) {
      this.config.model = modelId;
      return true;
    }
    console.warn(`模型 ${modelId} 不可用`);
    return false;
  }

  /**
   * 获取当前模型配置
   * @returns {Object} 模型配置
   */
  getConfig () {
    return { ...this.config };
  }

  /**
   * 获取模型信息
   * @param {string} modelId - 模型ID
   * @returns {Object|null} 模型信息
   */
  static getModelInfo (modelId) {
    return AVAILABLE_MODELS[modelId] || null;
  }

  /**
   * 获取所有可用模型
   * @returns {Object} 所有模型
   */
  static getAllModels () {
    return { ...AVAILABLE_MODELS };
  }

  /**
   * 获取推荐模型列表
   * @returns {Array} 推荐模型列表
   */
  static getRecommendedModels () {
    return Object.entries(AVAILABLE_MODELS)
      .filter(([_, model]) => model.recommended)
      .map(([id, model]) => ({ id, ...model }));
  }

  /**
   * 获取指定平台的模型
   * @param {string} platform - 平台名称
   * @returns {Object|null} 该平台的所有模型
   */
  static getPlatformModels (platform) {
    return PLATFORM_MODELS[platform]?.models || null;
  }

  /**
   * 构建请求体
   * @returns {Object} API请求体
   */
  toRequestBody () {
    const modelInfo = AVAILABLE_MODELS[this.config.model];
    if (!modelInfo) {
      throw new Error(`模型 ${this.config.model} 不可用`);
    }

    return {
      model: this.config.model,
      temperature: this.config.temperature,
      max_tokens: Math.min(this.config.maxTokens, modelInfo.maxTokens),
      top_p: this.config.topP,
      frequency_penalty: this.config.frequencyPenalty,
      presence_penalty: this.config.presencePenalty
    };
  }

  /**
   * 应用日历应用优化的模型配置
   * 为日历场景调整温度、token限制等参数
   */
  useCalendarConfig () {
    // 日历应用需要更稳定的输出，降低temperature
    this.config.temperature = 0.5;
    // 日历场景通常需要较长的回复来提供建议
    this.config.maxTokens = 2048;
    // 使用更保守的采样策略
    this.config.topP = 0.85;
    // 避免重复
    this.config.frequencyPenalty = 0.2;
    this.config.presencePenalty = 0.1;
    return this;
  }

  /**
   * 重置配置到默认值
   */
  reset () {
    this.config = { ...DEFAULT_MODEL_CONFIG };
    return this;
  }

  /**
   * 更新配置
   * @param {Object} config - 配置对象
   */
  update (config) {
    this.config = {
      ...this.config,
      ...config
    };
    return this;
  }
}

export { AVAILABLE_MODELS };
export default ModelConfig;
