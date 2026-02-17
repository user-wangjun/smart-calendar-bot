/**
 * 统一AI模型配置
 * 定义各平台支持的模型列表、特性和配置
 */

/**
 * 平台模型配置
 */
export const PLATFORM_MODELS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    description: 'GPT系列模型，强大的文本生成能力',
    models: [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        maxTokens: 128000,
        contextWindow: 128000,
        pricing: { input: 0.01, output: 0.03 }, // USD per 1K tokens
        features: ['text', 'vision', 'function-calling', 'code'],
        recommended: true,
        category: 'premium'
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        maxTokens: 8192,
        contextWindow: 8192,
        pricing: { input: 0.03, output: 0.06 },
        features: ['text', 'function-calling', 'code'],
        category: 'premium'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        maxTokens: 16385,
        contextWindow: 16385,
        pricing: { input: 0.0005, output: 0.0015 },
        features: ['text', 'code'],
        category: 'standard'
      },
      {
        id: 'gpt-3.5-turbo-16k',
        name: 'GPT-3.5 Turbo 16K',
        maxTokens: 16384,
        contextWindow: 16384,
        pricing: { input: 0.003, output: 0.004 },
        features: ['text', 'code'],
        category: 'standard'
      }
    ],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    authType: 'bearer',
    keyFormat: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    features: ['text', 'vision', 'function-calling', 'streaming'],
    rateLimit: { requests: 100, window: 60000 }, // 100 requests per minute
    timeout: 30000
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🧠',
    description: 'Claude系列模型，注重安全性和有用性',
    models: [
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        maxTokens: 200000,
        contextWindow: 200000,
        pricing: { input: 0.015, output: 0.075 },
        features: ['text', 'vision', 'analysis'],
        recommended: true,
        category: 'premium'
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        maxTokens: 200000,
        contextWindow: 200000,
        pricing: { input: 0.003, output: 0.015 },
        features: ['text', 'vision', 'analysis'],
        category: 'standard'
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        maxTokens: 200000,
        contextWindow: 200000,
        pricing: { input: 0.00025, output: 0.00125 },
        features: ['text', 'analysis'],
        category: 'fast'
      }
    ],
    endpoint: 'https://api.anthropic.com/v1/messages',
    authType: 'bearer',
    keyFormat: 'sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    features: ['text', 'vision', 'analysis', 'streaming'],
    rateLimit: { requests: 50, window: 60000 },
    timeout: 30000
  },

  google: {
    id: 'google',
    name: 'Google AI',
    icon: '🔍',
    description: 'Gemini系列模型，多模态AI能力',
    models: [
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        maxTokens: 30720,
        contextWindow: 30720,
        pricing: { input: 0.0005, output: 0.0015 },
        features: ['text', 'vision', 'multimodal'],
        recommended: true,
        category: 'standard'
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        maxTokens: 12288,
        contextWindow: 12288,
        pricing: { input: 0.0005, output: 0.0015 },
        features: ['text', 'vision', 'multimodal'],
        category: 'vision'
      },
      {
        id: 'gemini-ultra',
        name: 'Gemini Ultra',
        maxTokens: 32768,
        contextWindow: 32768,
        pricing: { input: 0.01, output: 0.03 },
        features: ['text', 'vision', 'multimodal', 'advanced'],
        category: 'premium'
      }
    ],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    authType: 'api-key',
    keyFormat: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    features: ['text', 'vision', 'multimodal', 'streaming'],
    rateLimit: { requests: 60, window: 60000 },
    timeout: 30000
  },

  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🌐',
    description: '统一API网关，支持多个模型提供商',
    models: [
      {
        id: 'arcee-ai/trinity-large-preview:free',
        name: 'Arcee Trinity Large (免费)',
        maxTokens: 32768,
        contextWindow: 32768,
        pricing: { input: 0, output: 0 },
        features: ['text'],
        recommended: true,
        category: 'free'
      },
      {
        id: 'qwen/qwen3-coder:free',
        name: '通义千问3 Coder (免费)',
        maxTokens: 32768,
        contextWindow: 32768,
        pricing: { input: 0, output: 0 },
        features: ['text', 'chinese', 'code'],
        recommended: true,
        category: 'free'
      },
      {
        id: 'qwen/qwen3-next-80b-a3b-instruct:free',
        name: '通义千问3 Next 80B (免费)',
        maxTokens: 32768,
        contextWindow: 32768,
        pricing: { input: 0, output: 0 },
        features: ['text', 'chinese'],
        recommended: true,
        category: 'free'
      },
      {
        id: 'qwen/qwen3-4b:free',
        name: '通义千问3 4B (免费)',
        maxTokens: 32768,
        contextWindow: 32768,
        pricing: { input: 0, output: 0 },
        features: ['text', 'chinese'],
        category: 'free'
      },
      {
        id: 'qwen/qwen-2.5-vl-7b-instruct:free',
        name: '通义千问2.5 VL 7B (免费)',
        maxTokens: 32768,
        contextWindow: 32768,
        pricing: { input: 0, output: 0 },
        features: ['text', 'vision', 'chinese'],
        recommended: true,
        category: 'free'
      },
      {
        id: 'deepseek/deepseek-r1-0528:free',
        name: 'DeepSeek R1 0528 (免费)',
        maxTokens: 32768,
        contextWindow: 32768,
        pricing: { input: 0, output: 0 },
        features: ['text', 'chinese', 'reasoning'],
        recommended: true,
        category: 'free'
      },
      {
        id: 'nvidia/nemotron-3-nano-30b-a3b:free',
        name: 'NVIDIA Nemotron 3 Nano 30B (免费)',
        maxTokens: 4096,
        contextWindow: 4096,
        pricing: { input: 0, output: 0 },
        features: ['text'],
        category: 'free'
      },
      {
        id: 'xiaomi/mimo-v2-flash:free',
        name: '小米MIMO V2 Flash (免费)',
        maxTokens: 8192,
        contextWindow: 8192,
        pricing: { input: 0, output: 0 },
        features: ['text', 'chinese'],
        category: 'free'
      },
      {
        id: 'openai/gpt-4-turbo',
        name: 'GPT-4 Turbo (付费)',
        maxTokens: 128000,
        contextWindow: 128000,
        pricing: { input: 0.01, output: 0.03 },
        features: ['text', 'vision', 'function-calling'],
        category: 'premium'
      }
    ],
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    authType: 'bearer',
    keyFormat: 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    features: ['text', 'vision', 'function-calling', 'streaming'],
    rateLimit: { requests: 200, window: 60000 },
    timeout: 30000
  },

  // cherry: {  // Cherry API已禁用
  //   id: 'cherry',
  //   name: 'Cherry',
  //   icon: '🍒',
  //   description: '国产AI平台，中文优化',
  //   models: [
  //     {
  //       id: 'agent/deepseek-v3.1-terminus(free)',
  //       name: 'DeepSeek V3.1 (免费)',
  //       maxTokens: 16384,
  //       contextWindow: 16384,
  //       pricing: { input: 0, output: 0 },
  //       features: ['text', 'chinese', 'analysis'],
  //       recommended: true,
  //       category: 'free'
  //     },
  //     {
  //       id: 'agent/deepseek-v3.1',
  //       name: 'DeepSeek V3.1 (付费)',
  //       maxTokens: 32768,
  //       contextWindow: 32768,
  //       pricing: { input: 0.0005, output: 0.001 },
  //       features: ['text', 'chinese', 'analysis'],
  //       category: 'standard'
  //     }
  //   ],
  //   endpoint: 'https://api.cherry.ai/v1/chat/completions',
  //   authType: 'bearer',
  //   keyFormat: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  //   features: ['text', 'chinese', 'analysis', 'streaming'],
  //   rateLimit: { requests: 100, window: 60000 },
  //   timeout: 30000
  // },

  zhipu: {
    id: 'zhipu',
    name: '智谱AI',
    icon: '🧠',
    description: '智谱AI GLM系列模型，国产大模型',
    models: [
      {
        id: 'glm-4.7-flash',
        name: 'GLM-4.7-Flash',
        maxTokens: 4096,
        contextWindow: 4096,
        pricing: { input: 0, output: 0 },
        features: ['text', 'chinese'],
        recommended: true,
        category: 'free'
      },
      {
        id: 'glm-4.6v-flash',
        name: 'GLM-4.6V-Flash',
        maxTokens: 4096,
        contextWindow: 4096,
        pricing: { input: 0, output: 0 },
        features: ['text', 'vision', 'chinese'],
        category: 'free'
      },
      {
        id: 'glm-4-flash-250414',
        name: 'GLM-4-Flash-250414',
        maxTokens: 4096,
        contextWindow: 4096,
        pricing: { input: 0, output: 0 },
        features: ['text', 'chinese'],
        category: 'free'
      },
      {
        id: 'glm-4-flash',
        name: 'GLM-4-Flash',
        maxTokens: 4096,
        contextWindow: 4096,
        pricing: { input: 0, output: 0 },
        features: ['text', 'chinese'],
        recommended: true,
        category: 'free'
      },
      {
        id: 'cogview-3-flash',
        name: 'CogView-3-Flash',
        maxTokens: 4096,
        contextWindow: 4096,
        pricing: { input: 0, output: 0 },
        features: ['image-generation'],
        category: 'free'
      }
    ],
    endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    authType: 'bearer',
    keyFormat: '以数字开头的字符串',
    features: ['text', 'vision', 'chinese', 'streaming'],
    rateLimit: { requests: 100, window: 60000 },
    timeout: 30000
  },

  ollama: {
    id: 'ollama',
    name: 'Ollama',
    icon: '🦙',
    description: '本地运行的大模型，无需API密钥',
    models: [
      {
        id: 'llama3.1',
        name: 'Llama 3.1 8B',
        maxTokens: 128000,
        contextWindow: 128000,
        pricing: { input: 0, output: 0 },
        features: ['text', 'local'],
        recommended: true,
        category: 'local'
      },
      {
        id: 'llama3.1:70b',
        name: 'Llama 3.1 70B',
        maxTokens: 128000,
        contextWindow: 128000,
        pricing: { input: 0, output: 0 },
        features: ['text', 'local'],
        category: 'local'
      },
      {
        id: 'qwen2.5:7b',
        name: 'Qwen 2.5 7B',
        maxTokens: 32768,
        contextWindow: 32768,
        pricing: { input: 0, output: 0 },
        features: ['text', 'chinese', 'local'],
        recommended: true,
        category: 'local'
      },
      {
        id: 'qwen2.5:14b',
        name: 'Qwen 2.5 14B',
        maxTokens: 32768,
        contextWindow: 32768,
        pricing: { input: 0, output: 0 },
        features: ['text', 'chinese', 'local'],
        category: 'local'
      },
      {
        id: 'mistral:7b',
        name: 'Mistral 7B',
        maxTokens: 32768,
        contextWindow: 32768,
        pricing: { input: 0, output: 0 },
        features: ['text', 'local'],
        recommended: true,
        category: 'local'
      },
      {
        id: 'mixtral:8x7b',
        name: 'Mixtral 8x7B',
        maxTokens: 32768,
        contextWindow: 32768,
        pricing: { input: 0, output: 0 },
        features: ['text', 'local'],
        category: 'local'
      },
      {
        id: 'gemma2:9b',
        name: 'Gemma 2 9B',
        maxTokens: 8192,
        contextWindow: 8192,
        pricing: { input: 0, output: 0 },
        features: ['text', 'local'],
        recommended: true,
        category: 'local'
      },
      {
        id: 'phi3:mini',
        name: 'Phi-3 Mini',
        maxTokens: 128000,
        contextWindow: 128000,
        pricing: { input: 0, output: 0 },
        features: ['text', 'local'],
        recommended: true,
        category: 'local'
      },
      {
        id: 'phi3:medium',
        name: 'Phi-3 Medium',
        maxTokens: 128000,
        contextWindow: 128000,
        pricing: { input: 0, output: 0 },
        features: ['text', 'local'],
        category: 'local'
      },
      {
        id: 'deepseek-coder-v2',
        name: 'DeepSeek Coder V2',
        maxTokens: 16384,
        contextWindow: 16384,
        pricing: { input: 0, output: 0 },
        features: ['text', 'code', 'local'],
        category: 'local'
      },
      {
        id: 'codellama:13b',
        name: 'CodeLlama 13B',
        maxTokens: 16384,
        contextWindow: 16384,
        pricing: { input: 0, output: 0 },
        features: ['text', 'code', 'local'],
        category: 'local'
      },
      {
        id: 'aha2025/llava-joycaption-beta-one-hf-llava:Q4_K_M',
        name: 'LLaVA JoyCaption Beta',
        maxTokens: 4096,
        contextWindow: 4096,
        pricing: { input: 0, output: 0 },
        features: ['text', 'vision', 'local'],
        recommended: true,
        category: 'local'
      }
    ],
    endpoint: 'http://localhost:11434/api',
    authType: 'none',
    keyFormat: '',
    features: ['text', 'vision', 'local'],
    rateLimit: { requests: 1000, window: 60000 },
    timeout: 30000
  }
};

/**
 * 模型选择器
 * 根据任务类型、语言、预算等因素智能选择最优模型
 */
export class ModelSelector {
  constructor () {
    this.platforms = PLATFORM_MODELS;
    this.usageStats = new Map();
  }

  /**
   * 智能选择模型
   * @param {Object} request - 请求参数
   * @param {string} request.taskType - 任务类型（chat, analysis, vision, code）
   * @param {string} request.language - 语言（zh, en）
   * @param {string} request.budget - 预算（free, standard, premium）
   * @param {number} request.complexity - 复杂度（1-5）
   * @param {boolean} request.streaming - 是否需要流式响应
   * @returns {Object} 推荐的模型配置
   */
  selectModel (request) {
    const { taskType, language, budget, complexity, streaming } = request;

    // 1. 根据任务类型筛选模型
    let candidates = this.filterByTaskType(taskType);

    // 2. 根据语言筛选
    candidates = this.filterByLanguage(candidates, language);

    // 3. 根据预算筛选
    candidates = this.filterByBudget(candidates, budget);

    // 4. 根据复杂度筛选
    candidates = this.filterByComplexity(candidates, complexity);

    // 5. 根据流式需求筛选
    if (streaming) {
      candidates = candidates.filter(model =>
        this.platforms[model.platformId].features.includes('streaming')
      );
    }

    // 6. 根据性能和使用统计排序
    candidates = this.sortByPerformance(candidates);

    // 7. 返回最佳推荐
    return candidates.length > 0 ? candidates[0] : this.getDefaultModel();
  }

  /**
   * 根据任务类型筛选模型
   */
  filterByTaskType (taskType) {
    const candidates = [];

    for (const [platformId, platform] of Object.entries(this.platforms)) {
      for (const model of platform.models) {
        const modelFeatures = new Set(model.features);

        switch (taskType) {
          case 'chat':
            if (modelFeatures.has('text')) {
              candidates.push({ ...model, platformId });
            }
            break;
          case 'analysis':
            if (modelFeatures.has('analysis') || modelFeatures.has('text')) {
              candidates.push({ ...model, platformId });
            }
            break;
          case 'vision':
            if (modelFeatures.has('vision') || modelFeatures.has('multimodal')) {
              candidates.push({ ...model, platformId });
            }
            break;
          case 'code':
            if (modelFeatures.has('code') || modelFeatures.has('text')) {
              candidates.push({ ...model, platformId });
            }
            break;
          default:
            if (modelFeatures.has('text')) {
              candidates.push({ ...model, platformId });
            }
        }
      }
    }

    return candidates;
  }

  /**
   * 根据语言筛选模型
   */
  filterByLanguage (candidates, language) {
    if (!language) return candidates;

    return candidates.filter(model => {
      const modelFeatures = new Set(model.features);

      if (language === 'zh') {
        return modelFeatures.has('chinese') ||
               model.platformId === 'cherry' ||
               model.platformId === 'openrouter';
      }

      return true; // 英文模型通常都支持
    });
  }

  /**
   * 根据预算筛选模型
   */
  filterByBudget (candidates, budget) {
    if (!budget || budget === 'free') {
      return candidates.filter(model =>
        model.pricing.input === 0 && model.pricing.output === 0
      );
    }

    if (budget === 'standard') {
      return candidates.filter(model =>
        model.pricing.input <= 0.005 && model.pricing.output <= 0.005
      );
    }

    return candidates; // premium预算不限制
  }

  /**
   * 根据复杂度筛选模型
   */
  filterByComplexity (candidates, complexity) {
    if (!complexity) return candidates;

    return candidates.filter(model => {
      if (complexity >= 4) {
        return model.category === 'premium';
      } else if (complexity >= 3) {
        return ['premium', 'standard'].includes(model.category);
      }
      return true;
    });
  }

  /**
   * 根据性能和使用统计排序
   */
  sortByPerformance (candidates) {
    return candidates.sort((a, b) => {
      // 优先推荐标记的模型
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;

      // 根据使用统计排序
      const aStats = this.usageStats.get(a.id) || { successRate: 0.9, avgLatency: 1000 };
      const bStats = this.usageStats.get(b.id) || { successRate: 0.9, avgLatency: 1000 };

      // 成功率优先
      if (aStats.successRate !== bStats.successRate) {
        return bStats.successRate - aStats.successRate;
      }

      // 延迟其次
      return aStats.avgLatency - bStats.avgLatency;
    });
  }

  /**
   * 获取默认模型
   */
  getDefaultModel () {
    return {
      id: 'arcee-ai/trinity-large-preview:free',
      name: 'Arcee Trinity Large (免费)',
      platformId: 'openrouter',
      maxTokens: 32768,
      pricing: { input: 0, output: 0 },
      features: ['text']
    };
  }

  /**
   * 更新使用统计
   */
  updateUsageStats (modelId, success, latency) {
    const stats = this.usageStats.get(modelId) || {
      totalRequests: 0,
      successfulRequests: 0,
      totalLatency: 0,
      successRate: 0.9,
      avgLatency: 1000
    };

    stats.totalRequests++;
    if (success) stats.successfulRequests++;
    stats.totalLatency += latency;

    stats.successRate = stats.successfulRequests / stats.totalRequests;
    stats.avgLatency = stats.totalLatency / stats.totalRequests;

    this.usageStats.set(modelId, stats);
  }

  /**
   * 获取平台配置
   */
  getPlatformConfig (platformId) {
    return this.platforms[platformId];
  }

  /**
   * 获取模型配置
   */
  getModelConfig (platformId, modelId) {
    const platform = this.platforms[platformId];
    if (!platform) return null;

    return platform.models.find(model => model.id === modelId);
  }

  /**
   * 获取推荐模型列表
   */
  getRecommendedModels (taskType = 'chat', limit = 5) {
    const candidates = this.filterByTaskType(taskType);
    const sorted = this.sortByPerformance(candidates);
    return sorted.slice(0, limit);
  }

  /**
   * 获取免费模型列表
   */
  getFreeModels () {
    const freeModels = [];

    for (const [platformId, platform] of Object.entries(this.platforms)) {
      for (const model of platform.models) {
        if (model.pricing.input === 0 && model.pricing.output === 0) {
          freeModels.push({ ...model, platformId });
        }
      }
    }

    return freeModels;
  }

  /**
   * 获取中文优化模型列表
   */
  getChineseOptimizedModels () {
    const chineseModels = [];

    for (const [platformId, platform] of Object.entries(this.platforms)) {
      for (const model of platform.models) {
        const modelFeatures = new Set(model.features);
        if (modelFeatures.has('chinese') || platformId === 'cherry') {
          chineseModels.push({ ...model, platformId });
        }
      }
    }

    return chineseModels;
  }

  /**
   * 验证API密钥格式
   */
  validateApiKey (platformId, apiKey) {
    const platform = this.platforms[platformId];
    if (!platform || !platform.keyFormat) return true;

    // 简化的格式验证
    const format = platform.keyFormat;
    if (format.includes('sk-')) {
      return apiKey.startsWith('sk-');
    }
    if (format.includes('AIza')) {
      return apiKey.startsWith('AIza');
    }

    return true;
  }
}

// 创建单例实例
export const modelSelector = new ModelSelector();

// 导出配置
export default {
  PLATFORM_MODELS,
  ModelSelector,
  modelSelector
};
