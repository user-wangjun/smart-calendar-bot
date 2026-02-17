/**
 * AI图像生成配置管理模块
 * 管理智谱AI CogView系列模型的图像生成配置
 */

/**
 * 支持的图像生成模型
 */
export const IMAGE_MODELS = {
  COGVIEW_3_FLASH: {
    id: 'cogview-3-flash',
    name: 'CogView-3-Flash',
    description: '免费模型，快速生成，创意丰富',
    isFree: true,
    maxSize: 1440,
    supportedSizes: ['1024x1024', '1344x768', '768x1344', '864x1152', '1152x864', '1440x720', '720x1440'],
    qualityOptions: ['standard', 'hd'],
    defaultQuality: 'standard'
  },
  COGVIEW_4: {
    id: 'cogview-4',
    name: 'CogView-4',
    description: '高质量图像生成，风格多样化',
    isFree: false,
    maxSize: 1920,
    supportedSizes: ['1024x1024', '1280x1280', '1344x768', '768x1344', '1440x720', '720x1440'],
    qualityOptions: ['standard', 'hd'],
    defaultQuality: 'standard'
  },
  GLM_IMAGE: {
    id: 'glm-image',
    name: 'GLM-Image',
    description: '旗舰图像生成，文字渲染出色',
    isFree: false,
    maxSize: 1920,
    supportedSizes: ['1024x1024', '1280x1280', '1344x768', '768x1344'],
    qualityOptions: ['hd'],
    defaultQuality: 'hd'
  }
};

/**
 * 预设图像尺寸配置
 */
export const PRESET_SIZES = {
  SQUARE: {
    id: 'square',
    name: '正方形',
    aspectRatio: '1:1',
    sizes: ['1024x1024', '1280x1280']
  },
  LANDSCAPE_WIDE: {
    id: 'landscape_wide',
    name: '宽屏横幅',
    aspectRatio: '16:9',
    sizes: ['1344x768', '1440x720']
  },
  LANDSCAPE_STANDARD: {
    id: 'landscape_standard',
    name: '标准横幅',
    aspectRatio: '4:3',
    sizes: ['1152x864', '1024x768']
  },
  PORTRAIT_WIDE: {
    id: 'portrait_wide',
    name: '宽屏竖幅',
    aspectRatio: '9:16',
    sizes: ['768x1344', '720x1440']
  },
  PORTRAIT_STANDARD: {
    id: 'portrait_standard',
    name: '标准竖幅',
    aspectRatio: '3:4',
    sizes: ['864x1152', '768x1024']
  }
};

/**
 * 图像质量选项
 */
export const QUALITY_OPTIONS = {
  STANDARD: {
    id: 'standard',
    name: '标准',
    description: '快速生成，约5-10秒',
    estimatedTime: '5-10秒'
  },
  HD: {
    id: 'hd',
    name: '高清',
    description: '更精细、细节更丰富，约20秒',
    estimatedTime: '约20秒'
  }
};

/**
 * 提示词优化关键词
 */
export const PROMPT_ENHANCEMENT_KEYWORDS = {
  quality: ['high quality', 'detailed', 'professional'],
  style: ['beautiful', 'artistic', 'elegant'],
  background: ['wallpaper', 'desktop background', 'background image'],
  technical: ['4K', 'high resolution', 'sharp focus']
};

/**
 * 图像配置类
 */
class ImageConfig {
  constructor () {
    this.config = this._loadConfig();
  }

  /**
   * 从环境变量加载配置
   * @returns {Object} 配置对象
   */
  _loadConfig () {
    return {
      apiUrl: import.meta.env.VITE_IMAGE_API_URL || 'https://open.bigmodel.cn/api/paas/v4/images/generations',
      defaultSize: import.meta.env.VITE_IMAGE_DEFAULT_SIZE || '1344x768',
      defaultQuality: import.meta.env.VITE_IMAGE_DEFAULT_QUALITY || 'standard',
      defaultModel: import.meta.env.VITE_IMAGE_DEFAULT_MODEL || 'cogview-3-flash',
      maxWidth: parseInt(import.meta.env.VITE_IMAGE_MAX_WIDTH) || 1920,
      maxHeight: parseInt(import.meta.env.VITE_IMAGE_MAX_HEIGHT) || 1920,
      timeout: parseInt(import.meta.env.VITE_IMAGE_TIMEOUT) || 60000,
      maxRetries: parseInt(import.meta.env.VITE_IMAGE_MAX_RETRIES) || 2,
      autoOptimizePrompt: import.meta.env.VITE_IMAGE_AUTO_OPTIMIZE_PROMPT !== 'false',
      historyMax: parseInt(import.meta.env.VITE_IMAGE_HISTORY_MAX) || 50
    };
  }

  /**
   * 获取API端点URL
   * @returns {string} API URL
   */
  getApiUrl () {
    return this.config.apiUrl;
  }

  /**
   * 获取默认尺寸
   * @returns {string} 默认尺寸
   */
  getDefaultSize () {
    return this.config.defaultSize;
  }

  /**
   * 获取默认质量
   * @returns {string} 默认质量
   */
  getDefaultQuality () {
    return this.config.defaultQuality;
  }

  /**
   * 获取默认模型
   * @returns {string} 默认模型ID
   */
  getDefaultModel () {
    return this.config.defaultModel;
  }

  /**
   * 获取超时时间
   * @returns {number} 超时时间（毫秒）
   */
  getTimeout () {
    return this.config.timeout;
  }

  /**
   * 获取最大重试次数
   * @returns {number} 最大重试次数
   */
  getMaxRetries () {
    return this.config.maxRetries;
  }

  /**
   * 是否启用提示词自动优化
   * @returns {boolean}
   */
  isAutoOptimizePrompt () {
    return this.config.autoOptimizePrompt;
  }

  /**
   * 获取历史记录最大数量
   * @returns {number}
   */
  getHistoryMax () {
    return this.config.historyMax;
  }

  /**
   * 获取模型配置
   * @param {string} modelId - 模型ID
   * @returns {Object|null} 模型配置
   */
  getModelConfig (modelId) {
    const model = Object.values(IMAGE_MODELS).find(m => m.id === modelId);
    return model || null;
  }

  /**
   * 获取所有可用模型
   * @returns {Array} 模型列表
   */
  getAllModels () {
    return Object.values(IMAGE_MODELS);
  }

  /**
   * 获取免费模型列表
   * @returns {Array} 免费模型列表
   */
  getFreeModels () {
    return Object.values(IMAGE_MODELS).filter(m => m.isFree);
  }

  /**
   * 验证尺寸是否有效
   * @param {string} size - 尺寸字符串（如 '1344x768'）
   * @param {string} modelId - 模型ID
   * @returns {boolean}
   */
  isValidSize (size, modelId = null) {
    if (!size || typeof size !== 'string') {
      return false;
    }

    const [width, height] = size.split('x').map(Number);

    if (!width || !height || isNaN(width) || isNaN(height)) {
      return false;
    }

    if (width > this.config.maxWidth || height > this.config.maxHeight) {
      return false;
    }

    if (modelId) {
      const modelConfig = this.getModelConfig(modelId);
      if (modelConfig && modelConfig.supportedSizes) {
        return modelConfig.supportedSizes.includes(size);
      }
    }

    return true;
  }

  /**
   * 验证质量选项是否有效
   * @param {string} quality - 质量选项
   * @param {string} modelId - 模型ID
   * @returns {boolean}
   */
  isValidQuality (quality, modelId = null) {
    if (!quality || typeof quality !== 'string') {
      return false;
    }

    if (modelId) {
      const modelConfig = this.getModelConfig(modelId);
      if (modelConfig && modelConfig.qualityOptions) {
        return modelConfig.qualityOptions.includes(quality);
      }
    }

    return Object.keys(QUALITY_OPTIONS).includes(quality.toUpperCase());
  }

  /**
   * 获取预设尺寸列表
   * @param {string} aspectRatio - 宽高比（可选）
   * @returns {Array} 预设尺寸列表
   */
  getPresetSizes (aspectRatio = null) {
    if (aspectRatio) {
      const preset = Object.values(PRESET_SIZES).find(p => p.aspectRatio === aspectRatio);
      return preset ? preset.sizes : [];
    }
    return Object.values(PRESET_SIZES);
  }

  /**
   * 获取质量选项列表
   * @returns {Array} 质量选项列表
   */
  getQualityOptions () {
    return Object.values(QUALITY_OPTIONS);
  }

  /**
   * 创建默认生成参数
   * @param {Object} overrides - 覆盖的参数
   * @returns {Object} 生成参数
   */
  createDefaultParams (overrides = {}) {
    return {
      model: this.config.defaultModel,
      size: this.config.defaultSize,
      quality: this.config.defaultQuality,
      ...overrides
    };
  }

  /**
   * 验证生成参数
   * @param {Object} params - 生成参数
   * @returns {Object} 验证结果 { valid, errors }
   */
  validateParams (params) {
    const errors = [];

    if (!params.prompt || !params.prompt.trim()) {
      errors.push('提示词不能为空');
    }

    if (!this.isValidSize(params.size, params.model)) {
      errors.push(`无效的图像尺寸: ${params.size}`);
    }

    if (!this.isValidQuality(params.quality, params.model)) {
      errors.push(`无效的质量选项: ${params.quality}`);
    }

    const modelConfig = this.getModelConfig(params.model);
    if (!modelConfig) {
      errors.push(`不支持的模型: ${params.model}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const imageConfig = new ImageConfig();
export default imageConfig;
