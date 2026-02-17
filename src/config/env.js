/**
 * 环境变量加载模块
 * 负责从环境变量或import.meta.env加载配置并进行验证
 */

/**
 * 环境变量配置类
 */
class EnvConfig {
  constructor () {
    this.config = {};
    this.loadEnvFile();
  }

  /**
   * 加载环境变量
   * 在浏览器环境中使用import.meta.env，在Node.js环境中读取.env文件
   */
  // eslint-disable-next-line complexity
  loadEnvFile () {
    try {
      // 检查是否在浏览器环境中
      if (typeof window !== 'undefined') {
        // 浏览器环境：使用import.meta.env（带安全检查）
        const env = this.getSafeEnv();
        this.config = {
          OPENROUTER_API_KEY: env.VITE_OPENROUTER_API_KEY || '',
          OPENROUTER_API_URL: env.VITE_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
          // Cherry API已禁用
          // CHERRY_API_KEY: env.VITE_CHERRY_API_KEY || '',
          // CHERRY_API_URL: env.VITE_CHERRY_API_URL || 'https://api.cherry.ai/v1/chat/completions',
          // 智谱AI配置 - 系统密钥
          ZHIPU_SYSTEM_API_KEY: env.VITE_ZHIPU_SYSTEM_API_KEY || env.VITE_ZHIPU_API_KEY || '',
          ZHIPU_API_KEY: env.VITE_ZHIPU_API_KEY || '',
          ZHIPU_API_URL: env.VITE_ZHIPU_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
          OLLAMA_API_URL: env.VITE_OLLAMA_API_URL || 'http://localhost:11434/api',
          // 七牛云AI配置（仅保留AI对话功能）
          QINIU_AI_API_KEY: env.VITE_QINIU_AI_API_KEY || '',
          QINIU_AI_API_URL: env.VITE_QINIU_AI_API_URL || '', // 七牛云AI API地址，需用户配置
          QINIU_AI_ORGANIZATION: env.VITE_QINIU_AI_ORGANIZATION || '',
          QINIU_AI_PROJECT: env.VITE_QINIU_AI_PROJECT || '',
          // 腾讯地图配置
          TENCENT_MAP_KEY: env.VITE_TENCENT_MAP_KEY || '',
          TENCENT_MAP_API_URL: env.VITE_TENCENT_MAP_API_URL || 'https://map.qq.com/api/gljs',
          // 高德地图配置
          AMAP_API_KEY: env.VITE_AMAP_API_KEY || '',
          AMAP_SECRET_KEY: env.VITE_AMAP_SECRET_KEY || '',
          AMAP_API_URL: env.VITE_AMAP_API_URL || 'https://restapi.amap.com/v3',
          REQUEST_TIMEOUT: env.VITE_REQUEST_TIMEOUT || '30000',
          MAX_RETRIES: env.VITE_MAX_RETRIES || '3',
          LOG_LEVEL: env.VITE_LOG_LEVEL || 'info'
        };
      } else {
        // Node.js环境：读取.env文件（如果需要）
        this.setDefaults();
      }

      // 验证必需的配置项
      this.validateConfig();
    } catch (error) {
      console.error('加载环境变量失败:', error.message);
      this.setDefaults();
    }
  }

  /**
   * 安全获取环境变量对象
   * 处理不同构建工具的兼容性
   * @returns {Object} 环境变量对象
   */
  getSafeEnv () {
    try {
      // 在Vite环境中，import.meta.env 是全局可用的
      // 使用 new Function 来安全地访问 import.meta.env
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env;
      }
    } catch (e) {
      console.warn('import.meta.env 访问失败:', e.message);
    }

    // 降级方案：尝试从 window 对象获取（Vite 会将 env 注入到 window）
    if (typeof window !== 'undefined' && window.__ENV__) {
      return window.__ENV__;
    }

    // 最后返回空对象
    console.warn('无法获取环境变量，使用空对象');
    return {};
  }

  /**
   * 设置默认配置
   * 当.env文件不存在或加载失败时使用默认值
   */
  setDefaults () {
    this.config = {
      OPENROUTER_API_KEY: '',
      OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
      // Cherry API已禁用
      // CHERRY_API_KEY: '',
      // CHERRY_API_URL: 'https://api.cherry.ai/v1/chat/completions',
      // 智谱AI配置 - 系统密钥
      ZHIPU_SYSTEM_API_KEY: '',
      ZHIPU_API_KEY: '',
      ZHIPU_API_URL: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      OLLAMA_API_URL: 'http://localhost:11434/api',
      // 七牛云AI配置（仅保留AI对话功能）
      QINIU_AI_API_KEY: '',
      QINIU_AI_API_URL: '', // 七牛云AI API地址，需用户配置
      QINIU_AI_ORGANIZATION: '',
      QINIU_AI_PROJECT: '',
      // 腾讯地图配置
      TENCENT_MAP_KEY: '',
      TENCENT_MAP_API_URL: 'https://map.qq.com/api/gljs',
      // 高德地图配置
      AMAP_API_KEY: '',
      AMAP_SECRET_KEY: '',
      AMAP_API_URL: 'https://restapi.amap.com/v3',
      REQUEST_TIMEOUT: '30000',
      MAX_RETRIES: '3',
      LOG_LEVEL: 'info'
    };
  }

  /**
   * 验证配置项
   * 检查必需的配置项是否存在且有效，使用默认值而不是抛出错误
   */
  // eslint-disable-next-line complexity
  validateConfig () {
    // 确保config对象存在
    if (!this.config || typeof this.config !== 'object') {
      this.setDefaults();
      return;
    }

    // 使用默认API端点URL如果未提供
    if (!this.config.OPENROUTER_API_URL) {
      console.warn('OPENROUTER_API_URL未配置，使用默认URL');
      this.config.OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    }

    // 验证URL格式，无效则使用默认值
    try {
      // eslint-disable-next-line no-new
      new URL(this.config.OPENROUTER_API_URL);
    } catch (error) {
      console.warn('OPENROUTER_API_URL格式无效，使用默认URL');
      this.config.OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
    }

    // 使用默认Ollama URL如果未提供
    if (!this.config.OLLAMA_API_URL) {
      this.config.OLLAMA_API_URL = 'http://localhost:11434/api';
    }

    // 七牛云AI URL需要用户自行配置，不提供默认值
    if (!this.config.QINIU_AI_API_URL) {
      console.warn('QINIU_AI_API_URL未配置，七牛云AI功能将不可用');
    }

    // API密钥验证 - 只记录警告，不抛出错误
    // 让apiValidator在运行时进行详细验证
    if (!this.config.OPENROUTER_API_KEY) {
      console.warn('OPENROUTER_API_KEY未配置，需要在设置中配置');
    } else if (!this.config.OPENROUTER_API_KEY.startsWith('sk-or-v1-')) {
      console.warn('警告：API密钥格式可能不正确，OpenRouter密钥通常以sk-or-v1开头');
    }

    // 验证超时时间
    const timeout = parseInt(this.config.REQUEST_TIMEOUT || '30000');
    if (isNaN(timeout) || timeout < 1000 || timeout > 300000) {
      console.warn('警告：REQUEST_TIMEOUT应在1000-300000毫秒之间，使用默认值30000');
      this.config.REQUEST_TIMEOUT = '30000';
    }

    // 验证重试次数
    const retries = parseInt(this.config.MAX_RETRIES || '3');
    if (isNaN(retries) || retries < 0 || retries > 10) {
      console.warn('警告：MAX_RETRIES应在0-10之间，使用默认值3');
      this.config.MAX_RETRIES = '3';
    }
  }

  /**
   * 获取配置项
   * @param {string} key - 配置键名
   * @param {string} defaultValue - 默认值
   * @returns {string} 配置值
   */
  get (key, defaultValue = null) {
    return this.config[key] || defaultValue;
  }

  /**
   * 获取API密钥
   * @returns {string} API密钥
   */
  getApiKey () {
    return this.config.OPENROUTER_API_KEY;
  }

  /**
   * 获取API URL
   * @returns {string} API URL
   */
  getApiUrl () {
    return this.config.OPENROUTER_API_URL;
  }

  /**
   * 获取请求超时时间
   * @returns {number} 超时时间（毫秒）
   */
  getTimeout () {
    return parseInt(this.config.REQUEST_TIMEOUT || '30000');
  }

  /**
   * 获取最大重试次数
   * @returns {number} 重试次数
   */
  getMaxRetries () {
    return parseInt(this.config.MAX_RETRIES || '3');
  }

  /**
   * 获取日志级别
   * @returns {string} 日志级别
   */
  getLogLevel () {
    return this.config.LOG_LEVEL || 'info';
  }

  /**
   * 获取所有配置
   * @returns {Object} 配置对象
   */
  getAll () {
    return { ...this.config };
  }

  /**
   * 设置配置项
   * @param {string} key - 配置键名
   * @param {string} value - 配置值
   */
  set (key, value) {
    this.config[key] = value;
  }

  /**
   * 获取七牛云AI API密钥
   * @returns {string} AI API密钥
   */
  getQiniuAIApiKey () {
    return this.config.QINIU_AI_API_KEY || '';
  }

  /**
   * 获取七牛云AI API URL
   * @returns {string} AI API URL
   */
  getQiniuAIApiUrl () {
    return this.config.QINIU_AI_API_URL || '';
  }

  /**
   * 获取七牛云AI组织ID
   * @returns {string} 组织ID
   */
  getQiniuAIOrganization () {
    return this.config.QINIU_AI_ORGANIZATION || '';
  }

  /**
   * 获取七牛云AI项目ID
   * @returns {string} 项目ID
   */
  getQiniuAIProject () {
    return this.config.QINIU_AI_PROJECT || '';
  }

  /**
   * 获取七牛云AI完整配置
   * @returns {Object} AI配置对象
   */
  getQiniuAIConfig () {
    return {
      apiKey: this.config.QINIU_AI_API_KEY || '',
      baseUrl: this.config.QINIU_AI_API_URL || '',
      organization: this.config.QINIU_AI_ORGANIZATION || '',
      project: this.config.QINIU_AI_PROJECT || ''
    };
  }

  /**
   * 隐藏API密钥（用于显示）
   * @param {string} apiKey - API密钥
   * @returns {string} 隐藏后的密钥
   */
  maskApiKey (apiKey) {
    if (!apiKey || apiKey === 'my-api-key') {
      return '我的API（已隐藏）';
    }
    if (apiKey.length <= 8) {
      return '****';
    }
    return apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4);
  }

  /**
   * 获取Cherry API密钥（已禁用）
   * @returns {string} API密钥或空字符串
   */
  getCherryApiKey () {
    // Cherry API已禁用，返回空字符串
    return '';
  }

  /**
   * 获取智谱AI API密钥（向后兼容 - 旧方法）
   * @returns {string} API密钥或空字符串（用户需手动配置）
   */
  getZhipuApiKey () {
    return this.config.ZHIPU_API_KEY || '';
  }

  /**
   * 获取智谱AI系统密钥
   * 系统密钥由部署者/开发者配置，用于AI生图等基础功能
   * @returns {string} 系统密钥或空字符串
   */
  getZhipuSystemApiKey () {
    return this.config.ZHIPU_SYSTEM_API_KEY || '';
  }

  /**
   * 获取智谱AI API URL
   * @returns {string} API URL
   */
  getZhipuApiUrl () {
    return this.config.ZHIPU_API_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  }

  /**
   * 获取高德地图API密钥
   * @returns {string} API密钥
   */
  getAmapApiKey () {
    return this.config.AMAP_API_KEY || '';
  }

  /**
   * 获取高德地图安全密钥（用于签名）
   * @returns {string} 安全密钥
   */
  getAmapSecretKey () {
    return this.config.AMAP_SECRET_KEY || '';
  }

  /**
   * 获取高德地图API URL
   * @returns {string} API URL
   */
  getAmapApiUrl () {
    return this.config.AMAP_API_URL || 'https://restapi.amap.com/v3';
  }

  /**
   * 获取腾讯地图API密钥
   * @returns {string} API密钥
   */
  getTencentMapKey () {
    return this.config.TENCENT_MAP_KEY || '';
  }

  /**
   * 检查是否使用默认API密钥
   * @returns {boolean} 是否使用默认密钥
   */
  isUsingDefaultApiKey () {
    const openRouterKey = this.config.OPENROUTER_API_KEY || '';
    const qiniuKey = this.config.QINIU_AI_API_KEY || '';

    return !openRouterKey || openRouterKey === 'your-api-key-here' ||
           !qiniuKey || qiniuKey === 'your-ai-api-key-here';
  }
}

// 创建单例实例
const envConfig = new EnvConfig();

// 导出实例
export default envConfig;
