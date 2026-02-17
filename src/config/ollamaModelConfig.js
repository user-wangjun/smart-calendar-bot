/**
 * Ollama模型配置模块
 * 负责管理本地Ollama模型的参数配置
 */

/**
 * 可用模型列表
 * 包含模型名称、描述、参数信息等
 */
const AVAILABLE_MODELS = {
  // Llama 3.1 8B - Meta最新开源模型
  'llama3.1': {
    name: 'Llama 3.1 8B',
    description: 'Meta Llama 3.1 8B模型，适合通用对话和复杂任务',
    size: '4.7GB',
    contextLength: 128000,
    recommended: true,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api'
  },

  // Llama 3.1 70B - Meta最新大模型
  'llama3.1:70b': {
    name: 'Llama 3.1 70B',
    description: 'Meta Llama 3.1 70B模型，适合复杂推理和高质量对话',
    size: '40GB',
    contextLength: 128000,
    recommended: false,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api'
  },

  // Qwen 2.5 7B - 阿里巴巴开源模型
  'qwen2.5:7b': {
    name: 'Qwen 2.5 7B',
    description: '通义千问2.5 7B模型，适合中文对话和文本生成',
    size: '4.5GB',
    contextLength: 32768,
    recommended: true,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api'
  },

  // Qwen 2.5 14B - 阿里巴巴中模型
  'qwen2.5:14b': {
    name: 'Qwen 2.5 14B',
    description: '通义千问2.5 14B模型，适合复杂任务和多轮对话',
    size: '9GB',
    contextLength: 32768,
    recommended: false,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api'
  },

  // Mistral 7B - Mistral AI开源模型
  'mistral:7b': {
    name: 'Mistral 7B',
    description: 'Mistral AI 7B模型，适合快速推理和通用对话',
    size: '4.1GB',
    contextLength: 32768,
    recommended: true,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api'
  },

  // Mixtral 8x7B - Mistral AI混合模型
  'mixtral:8x7b': {
    name: 'Mixtral 8x7B',
    description: 'Mistral AI Mixtral 8x7B模型，适合复杂推理和高质量输出',
    size: '26GB',
    contextLength: 32768,
    recommended: false,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api'
  },

  // Gemma 2 9B - Google开源模型
  'gemma2:9b': {
    name: 'Gemma 2 9B',
    description: 'Google Gemma 2 9B模型，适合通用对话和推理',
    size: '5.5GB',
    contextLength: 8192,
    recommended: true,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api'
  },

  // Phi-3 Mini - Microsoft轻量级模型
  'phi3:mini': {
    name: 'Phi-3 Mini',
    description: 'Microsoft Phi-3 Mini 3.8B模型，适合快速推理和边缘设备',
    size: '2.3GB',
    contextLength: 128000,
    recommended: true,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api'
  },

  // Phi-3 Medium - Microsoft中等模型
  'phi3:medium': {
    name: 'Phi-3 Medium',
    description: 'Microsoft Phi-3 Medium 14B模型，适合复杂任务和高质量对话',
    size: '7.9GB',
    contextLength: 128000,
    recommended: false,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api'
  },

  // DeepSeek Coder V2 - 代码生成模型
  'deepseek-coder-v2': {
    name: 'DeepSeek Coder V2',
    description: 'DeepSeek Coder V2 16B模型，专门用于代码生成和编程辅助',
    size: '9GB',
    contextLength: 16384,
    recommended: false,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api'
  },

  // CodeLlama 13B - Meta代码模型
  'codellama:13b': {
    name: 'CodeLlama 13B',
    description: 'Meta CodeLlama 13B模型，专门用于代码生成和编程辅助',
    size: '7.4GB',
    contextLength: 16384,
    recommended: false,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api'
  },

  // LLaVA JoyCaption Beta - 多模态模型（图像+文本）
  'aha2025/llava-joycaption-beta-one-hf-llava:Q4_K_M': {
    name: 'LLaVA JoyCaption Beta',
    description: 'LLaVA多模态模型，支持图像理解和描述生成，适合图像标注和视觉问答',
    size: '约4GB（量化版）',
    contextLength: 4096,
    recommended: true,
    apiProvider: 'ollama',
    apiUrl: 'http://localhost:11434/api',
    capabilities: ['vision', 'text'],
    supportsImages: true
  }
};

/**
 * 默认模型配置
 * 适用于日历应用的智能对话场景
 */
const DEFAULT_CONFIG = {
  // 模型名称 - 使用Llama 3.1 8B
  model: 'llama3.1',

  // 温度值（0.0-2.0）
  // 0.0: 更确定，更一致
  // 0.7: 平衡创造性和一致性（推荐）
  // 1.0: 更随机，更有创造性
  // 2.0: 非常随机，可能产生不相关内容
  temperature: 0.7,

  // 最大生成tokens数
  // 控制模型输出的最大长度
  // 建议值：500-1500
  max_tokens: 1000,

  // 核采样参数（0.0-1.0）
  // 与temperature二选一，通常使用temperature
  // 0.9: 只考虑前90%概率的tokens
  top_p: 0.9,

  // 频率惩罚（-2.0-2.0）
  // 正值减少重复，负值增加重复
  // 0.5: 适度减少重复
  frequency_penalty: 0.5,

  // 存在惩罚（-2.0-2.0）
  // 正值鼓励谈论新话题
  // 0.5: 适度鼓励新话题
  presence_penalty: 0.5,

  // 是否流式输出
  // true: 逐token返回结果
  // false: 一次性返回完整结果
  stream: false,

  // 系统提示词
  // 定义AI助手的角色和行为
  system: '你是一个智能日历助手，能够帮助用户管理日程、提供天气信息、给出穿搭和饮食建议。请用友好、专业的语气回答。'
};

/**
 * 模型配置类
 */
class OllamaModelConfig {
  constructor (config = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
  }

  /**
   * 设置模型名称
   * @param {string} modelName - 模型名称
   */
  setModel (modelName) {
    this.config.model = modelName;
    return this;
  }

  /**
   * 设置温度值
   * @param {number} temperature - 温度值（0.0-2.0）
   */
  setTemperature (temperature) {
    if (temperature < 0 || temperature > 2) {
      throw new Error('温度值必须在0.0到2.0之间');
    }
    this.config.temperature = temperature;
    return this;
  }

  /**
   * 设置最大tokens数
   * @param {number} maxTokens - 最大tokens数
   */
  setMaxTokens (maxTokens) {
    if (maxTokens < 1 || maxTokens > 128000) {
      throw new Error('最大tokens数必须在1到128000之间');
    }
    this.config.max_tokens = maxTokens;
    return this;
  }

  /**
   * 设置top_p参数
   * @param {number} topP - top_p值（0.0-1.0）
   */
  setTopP (topP) {
    if (topP < 0 || topP > 1) {
      throw new Error('top_p值必须在0.0到1.0之间');
    }
    this.config.top_p = topP;
    return this;
  }

  /**
   * 设置频率惩罚
   * @param {number} penalty - 频率惩罚值（-2.0-2.0）
   */
  setFrequencyPenalty (penalty) {
    if (penalty < -2 || penalty > 2) {
      throw new Error('频率惩罚值必须在-2.0到2.0之间');
    }
    this.config.frequency_penalty = penalty;
    return this;
  }

  /**
   * 设置存在惩罚
   * @param {number} penalty - 存在惩罚值（-2.0-2.0）
   */
  setPresencePenalty (penalty) {
    if (penalty < -2 || penalty > 2) {
      throw new Error('存在惩罚值必须在-2.0到2.0之间');
    }
    this.config.presence_penalty = penalty;
    return this;
  }

  /**
   * 设置是否流式输出
   * @param {boolean} stream - 是否流式输出
   */
  setStream (stream) {
    this.config.stream = stream;
    return this;
  }

  /**
   * 设置系统提示词
   * @param {string} systemPrompt - 系统提示词
   */
  setSystemPrompt (systemPrompt) {
    this.config.system = systemPrompt;
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

  /**
   * 重置为默认配置
   */
  reset () {
    this.config = { ...DEFAULT_CONFIG };
    return this;
  }

  /**
   * 获取当前配置
   * @returns {Object} 配置对象
   */
  getConfig () {
    return { ...this.config };
  }

  /**
   * 转换为API请求体格式
   * @param {string} userInput - 用户输入
   * @param {Array} messages - 消息历史
   * @returns {Object} API请求体
   */
  toRequestBody (userInput, messages = []) {
    return {
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: this.config.system
        },
        ...messages,
        {
          role: 'user',
          content: userInput
        }
      ],
      options: {
        temperature: this.config.temperature,
        num_predict: this.config.max_tokens,
        top_p: this.config.top_p,
        frequency_penalty: this.config.frequency_penalty,
        presence_penalty: this.config.presence_penalty
      },
      stream: this.config.stream
    };
  }
}

/**
 * 获取模型信息
 * @param {string} modelName - 模型名称
 * @returns {Object|null} 模型信息
 */
function getModelInfo (modelName) {
  return AVAILABLE_MODELS[modelName] || null;
}

/**
 * 获取所有可用模型
 * @returns {Array} 模型列表
 */
function getAllModels () {
  return Object.entries(AVAILABLE_MODELS).map(([key, model]) => ({
    id: key,
    ...model
  }));
}

/**
 * 获取推荐模型
 * @returns {Array} 推荐模型列表
 */
function getRecommendedModels () {
  return Object.entries(AVAILABLE_MODELS)
    .filter(([key, model]) => model.recommended)
    .map(([key, model]) => ({
      id: key,
      ...model
    }));
}

/**
 * 验证模型配置
 * @param {Object} config - 配置对象
 * @returns {Object} 验证结果
 */
function validateConfig (config) {
  const errors = [];

  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('温度值必须在0.0到2.0之间');
  }

  if (config.max_tokens < 1 || config.max_tokens > 128000) {
    errors.push('最大tokens数必须在1到128000之间');
  }

  if (config.top_p < 0 || config.top_p > 1) {
    errors.push('top_p值必须在0.0到1.0之间');
  }

  if (config.frequency_penalty < -2 || config.frequency_penalty > 2) {
    errors.push('频率惩罚值必须在-2.0到2.0之间');
  }

  if (config.presence_penalty < -2 || config.presence_penalty > 2) {
    errors.push('存在惩罚值必须在-2.0到2.0之间');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 导出
export default OllamaModelConfig;
export {
  AVAILABLE_MODELS,
  DEFAULT_CONFIG,
  getModelInfo,
  getAllModels,
  getRecommendedModels,
  validateConfig
};
