/**
 * 默认API配置模块
 * 提供默认API端点和自动选择逻辑
 */

/**
 * 默认API配置
 */
const DEFAULT_API_CONFIG = {
  openrouter: {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    keyPrefix: 'sk-or-v1-',
    keyMinLength: 30,
    models: [
      'arcee-ai/trinity-large-preview:free',
      'qwen/qwen3-coder:free',
      'qwen/qwen3-next-80b-a3b-instruct:free',
      'qwen/qwen3-4b:free',
      'qwen/qwen-2.5-vl-7b-instruct:free',
      'deepseek/deepseek-r1-0528:free',
      'nvidia/nemotron-3-nano-30b-a3b:free',
      'xiaomi/mimo-v2-flash:free'
    ],
    isDefault: true,
    requiresKey: true,
    description: 'OpenRouter提供多个免费模型访问'
  },
  zhipu: {
    name: '智谱AI',
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    keyPattern: /^\d+/, // 智谱AI密钥以数字开头
    keyMinLength: 20,
    models: [
      'glm-4.7-flash',
      'glm-4.6v-flash',
      'glm-4-flash-250414',
      'glm-4-flash',
      'cogview-3-flash'
    ],
    isDefault: false,
    requiresKey: true,
    description: '智谱AI GLM系列模型服务（密钥以数字开头）'
  },
  ollama: {
    name: 'Ollama Local',
    url: 'http://localhost:11434/api',
    noKeyRequired: true,
    models: [],
    isDefault: false,
    requiresKey: false,
    description: '本地Ollama部署，无需API密钥'
  },
  qiniu: {
    name: '七牛云AI',
    url: '', // 需要用户配置
    keyMinLength: 20,
    models: [],
    isDefault: false,
    requiresKey: true,
    description: '七牛云AI服务（需配置API地址）'
  }
};

/**
 * 获取默认API配置
 * @param {string} provider - 提供商名称
 * @returns {Object} 默认配置
 */
export function getDefaultConfig (provider) {
  return DEFAULT_API_CONFIG[provider] || DEFAULT_API_CONFIG.openrouter;
}

/**
 * 获取所有默认配置
 * @returns {Object} 所有默认配置
 */
export function getAllDefaultConfigs () {
  return { ...DEFAULT_API_CONFIG };
}

/**
 * 自动选择默认提供商
 * 优先级: Ollama (本地) > OpenRouter (免费) > 其他
 * @param {Object} userConfig - 用户配置
 * @returns {string} 提供商名称
 */
export function getDefaultProvider (userConfig = {}) {
  // 检查Ollama本地部署
  if (userConfig.ollama?.enabled || userConfig.ollama?.url) {
    return 'ollama';
  }

  // 检查OpenRouter配置
  if (userConfig.openrouter?.apiKey &&
      userConfig.openrouter.apiKey !== 'your-api-key-here') {
    return 'openrouter';
  }

  // 检查智谱AI配置
  if (userConfig.zhipu?.apiKey &&
      userConfig.zhipu.apiKey !== 'your-api-key-here') {
    return 'zhipu';
  }

  // 检查七牛云配置
  if (userConfig.qiniu?.apiKey &&
      userConfig.qiniu.apiKey !== 'your-ai-api-key-here') {
    return 'qiniu';
  }

  // 默认返回OpenRouter
  return 'openrouter';
}

/**
 * 获取默认API端点URL
 * @param {string} provider - 提供商名称
 * @returns {string} API端点URL
 */
export function getDefaultApiUrl (provider) {
  const config = DEFAULT_API_CONFIG[provider];
  return config?.url || DEFAULT_API_CONFIG.openrouter.url;
}

/**
 * 获取提供商显示名称
 * @param {string} provider - 提供商名称
 * @returns {string} 显示名称
 */
export function getProviderDisplayName (provider) {
  const config = DEFAULT_API_CONFIG[provider];
  return config?.name || provider;
}

/**
 * 获取提供商描述
 * @param {string} provider - 提供商名称
 * @returns {string} 描述信息
 */
export function getProviderDescription (provider) {
  const config = DEFAULT_API_CONFIG[provider];
  return config?.description || '';
}

/**
 * 检查提供商是否需要API密钥
 * @param {string} provider - 提供商名称
 * @returns {boolean} 是否需要密钥
 */
export function isKeyRequired (provider) {
  const config = DEFAULT_API_CONFIG[provider];
  return config?.requiresKey !== false;
}

/**
 * 获取提供商图标
 * @param {string} provider - 提供商名称
 * @returns {string} 图标emoji
 */
export function getProviderIcon (provider) {
  const icons = {
    openrouter: '🌐',
    zhipu: '🧠',
    ollama: '🦙',
    qiniu: '☁️'
  };
  return icons[provider] || '🔌';
}

/**
 * 构建完整API配置
 * 合并用户配置和默认配置
 * @param {Object} userConfig - 用户配置
 * @returns {Object} 完整配置
 */
export function buildApiConfig (userConfig = {}) {
  const provider = getDefaultProvider(userConfig);
  const defaultConfig = getDefaultConfig(provider);

  return {
    provider,
    name: defaultConfig.name,
    url: userConfig[provider]?.url || defaultConfig.url,
    apiKey: userConfig[provider]?.apiKey || '',
    models: defaultConfig.models,
    requiresKey: defaultConfig.requiresKey,
    description: defaultConfig.description,
    isDefault: !userConfig[provider]?.apiKey ||
               userConfig[provider]?.apiKey === 'your-api-key-here'
  };
}

export default {
  DEFAULT_API_CONFIG,
  getDefaultConfig,
  getAllDefaultConfigs,
  getDefaultProvider,
  getDefaultApiUrl,
  getProviderDisplayName,
  getProviderDescription,
  isKeyRequired,
  getProviderIcon,
  buildApiConfig
};
