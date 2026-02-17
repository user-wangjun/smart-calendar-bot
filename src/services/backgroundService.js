/**
 * 背景图片管理服务
 * 支持AI生成背景、本地图片上传(支持大文件IndexedDB存储)、预览和存储
 */

import backgroundDB from '../utils/indexedDB';
import ZhipuClient from '../api/zhipuClient.js';

/**
 * 优化背景生成提示词
 * 添加背景相关关键词以提升生成质量
 * @param {string} userPrompt - 用户原始提示词
 * @returns {string} 优化后的提示词
 */
function optimizePromptForBackground (userPrompt) {
  const backgroundKeywords = [
    'desktop background',
    'high quality',
    'detailed',
    'wallpaper'
  ];

  const lowerPrompt = userPrompt.toLowerCase();

  const hasBackgroundKeyword = backgroundKeywords.some(kw => lowerPrompt.includes(kw));

  if (hasBackgroundKeyword) {
    return userPrompt;
  }

  return `${userPrompt}, suitable for desktop background, high quality, detailed wallpaper`;
}

class BackgroundService {
  constructor () {
    this.currentBackground = '';
    this.backgroundType = 'default'; // default, ai-generated, custom, local-blob
    this.blobUrl = null; // 临时存储 Blob URL
    this.init();
  }

  async init () {
    await this.loadFromStorage();
  }

  /**
   * 从本地存储加载背景
   */
  async loadFromStorage () {
    try {
      const stored = localStorage.getItem('background_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.currentBackground = settings.url || '';
        this.backgroundType = settings.type || 'default';

        // 如果类型是本地 Blob 存储
        if (this.backgroundType === 'local-blob') {
          const blob = await backgroundDB.getBackground('current_bg');
          if (blob) {
            if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
            this.blobUrl = URL.createObjectURL(blob);
            this.currentBackground = this.blobUrl;
          } else {
            // 如果 DB 中没了，回退到默认
            this.clearBackground();
            return;
          }
        }

        this.applyBackground();
      }
    } catch (error) {
      console.error('加载背景设置失败:', error.message);
    }
  }

  /**
   * 保存背景设置元数据到 LocalStorage
   */
  saveToStorage () {
    try {
      const settings = {
        url: this.backgroundType === 'local-blob' ? '' : this.currentBackground, // Blob URL 不持久化保存
        type: this.backgroundType
      };
      localStorage.setItem('background_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('保存背景设置失败:', error.message);
    }
  }

  /**
   * 应用背景到页面
   * 优化背景渲染质量，提升视觉细腻度和像素质量
   */
  applyBackground () {
    if (this.backgroundType === 'default' || !this.currentBackground) {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
      document.body.style.imageRendering = '';
      document.body.style.backdropFilter = '';
    } else {
      document.body.style.backgroundImage = `url(${this.currentBackground})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';

      // 优化图片渲染质量
      document.body.style.imageRendering = 'auto';
      document.body.style.imageRendering = 'crisp-edges';
      document.body.style.imageRendering = 'pixelated';
      // 使用高质量渲染
      document.body.style.imageRendering = 'high-quality';

      // 添加平滑过渡效果
      document.body.style.transition = 'background-image 0.3s ease-in-out';
    }
  }

  /**
   * 设置背景
   * @param {string} url
   * @param {string} type
   */
  setBackground (url, type = 'custom') {
    this.currentBackground = url;
    this.backgroundType = type;
    this.applyBackground();
    this.saveToStorage();
  }

  /**
   * 清除背景
   */
  async clearBackground () {
    this.currentBackground = '';
    this.backgroundType = 'default';
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    await backgroundDB.deleteBackground('current_bg');
    this.applyBackground();
    this.saveToStorage();
  }

  /**
   * 上传背景图片 (增强版：优先服务器，降级本地 IndexedDB)
   * @param {File} file - 图片文件
   * @param {Function} onProgress - 进度回调 (0-100)
   * @returns {Promise<Object>} 上传结果
   */
  async uploadLocalBackground (file, onProgress) {
    try {
      // 1. 验证文件
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return { success: false, message: '不支持的文件格式' };
      }

      // 2. 尝试上传到服务器 (模拟或真实)
      // 注意：由于当前环境不确定是否有后端，我们先尝试 fetch，如果失败则走降级
      try {
        const formData = new FormData();
        formData.append('file', file);

        // 使用 XMLHttpRequest 以支持上传进度
        const response = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/uploads/background', true);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              // 404 或 500 等错误，视为上传失败，触发降级
              reject(new Error(`Server Error: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network Error'));
          xhr.send(formData);
        });

        if (response.success) {
          this.setBackground(response.url, 'custom');
          return { success: true, message: '上传成功 (服务器)' };
        }
      } catch (serverError) {
        console.warn('服务器上传失败，切换至本地存储模式:', serverError);
      }

      // 3. 降级方案：IndexedDB 本地存储
      if (onProgress) onProgress(50); // 模拟进度

      await backgroundDB.saveBackground('current_bg', file);

      if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = URL.createObjectURL(file);

      this.setBackground(this.blobUrl, 'local-blob');

      if (onProgress) onProgress(100);

      return {
        success: true,
        message: '网络不可用，已保存到本地 (离线模式)',
        isOffline: true
      };
    } catch (error) {
      console.error('背景处理失败:', error);
      return { success: false, message: '处理失败: ' + error.message };
    }
  }

  /**
   * AI生成背景图片
   * 使用智谱AI CogView-3-Flash模型生成背景图片
   * @param {string} prompt - 图像描述提示词
   * @param {string} apiKey - 智谱AI API密钥（可选，不传则使用已配置的密钥）
   * @returns {Promise<Object>} 生成结果
   */
  async generateAIBackground (prompt, apiKey = null) {
    try {
      if (!prompt || !prompt.trim()) {
        return { success: false, message: '请输入图像描述' };
      }

      const client = apiKey
        ? new ZhipuClient({ apiKey })
        : new ZhipuClient();

      if (!client.isValid()) {
        return {
          success: false,
          message: 'API密钥无效或未配置，请在设置中配置智谱AI API密钥'
        };
      }

      const optimizedPrompt = optimizePromptForBackground(prompt.trim());

      console.log('[BackgroundService] 开始生成AI背景，提示词:', optimizedPrompt);

      const result = await client.generateImage(optimizedPrompt, {
        size: '1344x768',
        quality: 'standard'
      });

      if (!result.success || !result.data || result.data.length === 0) {
        return { success: false, message: '图像生成失败，请稍后重试' };
      }

      const imageUrl = result.data[0].url;

      if (!imageUrl) {
        return { success: false, message: '未获取到生成的图像URL' };
      }

      console.log('[BackgroundService] 图像生成成功，URL:', imageUrl);

      try {
        const imageBlob = await this._downloadImage(imageUrl);

        if (this.blobUrl) {
          URL.revokeObjectURL(this.blobUrl);
        }

        this.blobUrl = URL.createObjectURL(imageBlob);

        await backgroundDB.saveBackground('current_bg', imageBlob);

        this.setBackground(this.blobUrl, 'ai-generated');

        console.log('[BackgroundService] AI背景已应用');

        return {
          success: true,
          message: '背景生成成功！',
          imageUrl: this.blobUrl
        };
      } catch (downloadError) {
        console.warn('[BackgroundService] 图片下载失败，直接使用URL:', downloadError);

        this.setBackground(imageUrl, 'ai-generated');

        return {
          success: true,
          message: '背景生成成功！（使用在线图片）',
          imageUrl,
          isOnline: true
        };
      }
    } catch (error) {
      console.error('[BackgroundService] AI背景生成失败:', error);

      let errorMessage = error.message;

      if (errorMessage.includes('内容审核')) {
        errorMessage = '提示词内容不符合规范，请修改后重试';
      } else if (errorMessage.includes('API密钥')) {
        errorMessage = 'API密钥无效，请检查配置';
      } else if (errorMessage.includes('超时')) {
        errorMessage = '请求超时，请检查网络连接后重试';
      }

      return { success: false, message: errorMessage };
    }
  }

  /**
   * 下载远程图片
   * @param {string} url - 图片URL
   * @returns {Promise<Blob>} 图片Blob对象
   */
  async _downloadImage (url) {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`下载图片失败: HTTP ${response.status}`);
    }

    return await response.blob();
  }
}

export default new BackgroundService();
