/**
 * AI图像生成服务
 * 提供完整的图像生成功能，包括文本提示输入、图像尺寸设置、生成参数调整等
 */

import imageConfig, {
  PROMPT_ENHANCEMENT_KEYWORDS
} from '../config/imageConfig.js';
import ZhipuClient from '../api/zhipuClient.js';
import envConfig from '../config/env.js';

/**
 * 图像生成历史记录存储键
 */
const HISTORY_STORAGE_KEY = 'image_generation_history';

/**
 * 图像生成服务类
 */
class ImageGenerationService {
  constructor () {
    this.client = null;
    this.history = this._loadHistory();
    this.abortController = null;
    this._autoInitClient();
  }

  /**
   * 自动初始化客户端
   * 从.env文件加载智谱AI系统密钥并初始化
   * 系统密钥用于AI生图等基础功能
   */
  _autoInitClient () {
    const systemApiKey = envConfig.getZhipuSystemApiKey();
    if (systemApiKey) {
      this.client = new ZhipuClient({ apiKey: systemApiKey });
      console.log('[ImageGenerationService] 已从.env自动初始化智谱AI系统密钥客户端');
    }
  }

  /**
   * 初始化客户端
   * @param {string} apiKey - 智谱AI API密钥（可选，不传则使用.env中的密钥）
   */
  initClient (apiKey = null) {
    if (apiKey) {
      this.client = new ZhipuClient({ apiKey });
    } else {
      this._autoInitClient();
    }
    return this.isInitialized();
  }

  /**
   * 检查客户端是否已初始化
   * @returns {boolean}
   */
  isInitialized () {
    return this.client && this.client.isValid();
  }

  /**
   * 优化提示词
   * 自动添加质量、风格等关键词以提升生成效果
   * @param {string} prompt - 原始提示词
   * @param {Object} options - 优化选项
   * @param {boolean} options.forBackground - 是否用于背景生成
   * @param {string} options.style - 风格类型
   * @returns {string} 优化后的提示词
   */
  optimizePrompt (prompt, options = {}) {
    if (!imageConfig.isAutoOptimizePrompt()) {
      return prompt;
    }

    const { forBackground = false, style = null } = options;
    const lowerPrompt = prompt.toLowerCase();

    const hasQualityKeyword = PROMPT_ENHANCEMENT_KEYWORDS.quality.some(kw =>
      lowerPrompt.includes(kw.toLowerCase())
    );

    const hasBackgroundKeyword = PROMPT_ENHANCEMENT_KEYWORDS.background.some(kw =>
      lowerPrompt.includes(kw.toLowerCase())
    );

    const enhancements = [];

    if (!hasQualityKeyword) {
      enhancements.push('high quality', 'detailed');
    }

    if (forBackground && !hasBackgroundKeyword) {
      enhancements.push('wallpaper', 'desktop background');
    }

    if (style) {
      enhancements.push(style);
    }

    if (enhancements.length === 0) {
      return prompt;
    }

    return `${prompt}, ${enhancements.join(', ')}`;
  }

  /**
   * 生成图像
   * @param {Object} params - 生成参数
   * @param {string} params.prompt - 图像描述提示词
   * @param {string} params.size - 图像尺寸
   * @param {string} params.quality - 图像质量
   * @param {string} params.model - 模型ID
   * @param {boolean} params.optimizePrompt - 是否优化提示词
   * @returns {Promise<Object>} 生成结果
   */
  async generate (params) {
    const {
      prompt,
      size = imageConfig.getDefaultSize(),
      quality = imageConfig.getDefaultQuality(),
      model = imageConfig.getDefaultModel(),
      optimizePrompt = true
    } = params;

    if (!prompt || !prompt.trim()) {
      return {
        success: false,
        error: '提示词不能为空'
      };
    }

    const validation = imageConfig.validateParams({ prompt, size, quality, model });
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; ')
      };
    }

    if (!this.isInitialized()) {
      return {
        success: false,
        error: 'API客户端未初始化，请先配置API密钥'
      };
    }

    const finalPrompt = optimizePrompt
      ? this.optimizePrompt(prompt, { forBackground: size.includes('768') || size.includes('720') })
      : prompt;

    console.log('[ImageGenerationService] 开始生成图像:', {
      model,
      size,
      quality,
      prompt: finalPrompt.substring(0, 50) + '...'
    });

    this.abortController = new AbortController();

    const maxRetries = imageConfig.getMaxRetries();
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.client.generateImage(finalPrompt, {
          size,
          quality,
          model
        });

        if (result.success && result.data && result.data.length > 0) {
          const imageUrl = result.data[0].url;

          this._addToHistory({
            prompt,
            optimizedPrompt: finalPrompt,
            size,
            quality,
            model,
            imageUrl,
            timestamp: Date.now()
          });

          console.log('[ImageGenerationService] 图像生成成功');

          return {
            success: true,
            imageUrl,
            created: result.created,
            prompt: finalPrompt,
            size,
            quality,
            model
          };
        }

        lastError = new Error('未获取到生成的图像');
      } catch (error) {
        console.warn(`[ImageGenerationService] 第${attempt}次尝试失败:`, error.message);
        lastError = error;

        if (error.name === 'AbortError') {
          return {
            success: false,
            error: '生成已取消',
            cancelled: true
          };
        }

        if (attempt < maxRetries) {
          await this._delay(1000 * attempt);
        }
      }
    }

    console.error('[ImageGenerationService] 图像生成失败:', lastError);

    return {
      success: false,
      error: this._formatError(lastError)
    };
  }

  /**
   * 取消当前生成任务
   */
  cancel () {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * 下载图像
   * @param {string} imageUrl - 图像URL
   * @returns {Promise<Blob>} 图像Blob
   */
  async downloadImage (imageUrl) {
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`下载失败: HTTP ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('[ImageGenerationService] 图像下载失败:', error);
      throw new Error(`图像下载失败: ${error.message}`);
    }
  }

  /**
   * 获取生成历史记录
   * @param {number} limit - 最大返回数量
   * @returns {Array} 历史记录列表
   */
  getHistory (limit = 20) {
    return this.history.slice(0, limit);
  }

  /**
   * 清除历史记录
   */
  clearHistory () {
    this.history = [];
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }

  /**
   * 获取可用模型列表
   * @returns {Array} 模型列表
   */
  getAvailableModels () {
    return imageConfig.getAllModels();
  }

  /**
   * 获取免费模型列表
   * @returns {Array} 免费模型列表
   */
  getFreeModels () {
    return imageConfig.getFreeModels();
  }

  /**
   * 获取预设尺寸列表
   * @returns {Array} 预设尺寸列表
   */
  getPresetSizes () {
    return imageConfig.getPresetSizes();
  }

  /**
   * 获取质量选项列表
   * @returns {Array} 质量选项列表
   */
  getQualityOptions () {
    return imageConfig.getQualityOptions();
  }

  /**
   * 获取默认配置
   * @returns {Object} 默认配置
   */
  getDefaultConfig () {
    return {
      model: imageConfig.getDefaultModel(),
      size: imageConfig.getDefaultSize(),
      quality: imageConfig.getDefaultQuality()
    };
  }

  /**
   * 加载历史记录
   * @returns {Array} 历史记录
   */
  _loadHistory () {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        return Array.isArray(history) ? history : [];
      }
    } catch (error) {
      console.warn('[ImageGenerationService] 加载历史记录失败:', error);
    }
    return [];
  }

  /**
   * 添加到历史记录
   * @param {Object} record - 记录对象
   */
  _addToHistory (record) {
    this.history.unshift(record);

    const maxHistory = imageConfig.getHistoryMax();
    if (this.history.length > maxHistory) {
      this.history = this.history.slice(0, maxHistory);
    }

    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.warn('[ImageGenerationService] 保存历史记录失败:', error);
    }
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise}
   */
  _delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 格式化错误信息
   * @param {Error} error - 错误对象
   * @returns {string} 格式化的错误信息
   */
  _formatError (error) {
    const message = error.message || '未知错误';

    if (message.includes('内容审核')) {
      return '提示词内容不符合规范，请修改后重试';
    }
    if (message.includes('API密钥')) {
      return 'API密钥无效或已过期';
    }
    if (message.includes('超时')) {
      return '请求超时，请检查网络连接';
    }
    if (message.includes('权限')) {
      return '权限不足，请检查API密钥配置';
    }

    return message;
  }
}

export const imageGenerationService = new ImageGenerationService();
export default imageGenerationService;
