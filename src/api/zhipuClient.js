/**
 * 智谱AI API客户端
 * 负责与智谱AI平台的API通信
 * 支持GLM系列模型
 */

import envConfig from '../config/env.js';
import apiKeyManager from '../config/apiKeyManager.js';

/**
 * 智谱AI API客户端类
 */
class ZhipuClient {
  constructor (options = {}) {
    // 明确的密钥优先级逻辑：
    // 1. 传入参数（最高优先级）
    // 2. 用户密钥（从apiKeyManager获取，用户在应用中配置）
    // 3. 系统密钥（从.env获取，部署者配置，用于AI生图等基础功能）
    //
    // 使用场景：
    // - AI对话：优先使用用户密钥，没有则使用系统密钥
    // - AI生图：可以直接使用系统密钥
    const systemApiKey = envConfig.getZhipuSystemApiKey();
    const userApiKey = apiKeyManager.getZhipuApiKey();
    this.apiKey = options.apiKey || userApiKey || systemApiKey || '';

    this.apiUrl = options.apiUrl || envConfig.get('ZHIPU_API_URL', 'https://open.bigmodel.cn/api/paas/v4/chat/completions');
    this.timeout = options.timeout || envConfig.getTimeout();
    this.maxRetries = options.maxRetries || envConfig.getMaxRetries();

    // 验证API密钥
    if (!this.apiKey) {
      console.warn('警告：智谱AI API密钥未配置');
      console.warn('请通过以下方式之一配置：');
      console.warn('  1. 系统密钥：在.env文件中设置 VITE_ZHIPU_SYSTEM_API_KEY');
      console.warn('  2. 用户密钥：在应用设置中配置智谱AI API密钥');
    }
  }

  /**
   * 验证API密钥格式
   * @param {string} key - API密钥
   * @returns {boolean} 是否有效
   */
  static validateKeyFormat (key) {
    // 智谱API Key通常格式为: id.secret (例如: 289...34.sfs...)
    // 简单验证：包含一个点，且长度足够
    if (!key || typeof key !== 'string') return false;
    const parts = key.split('.');
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  }

  /**
   * 检查当前密钥是否有效
   * @returns {boolean}
   */
  isValid () {
    return ZhipuClient.validateKeyFormat(this.apiKey);
  }

  /**
   * 发送聊天请求
   * @param {Object} params - 聊天参数
   * @param {string} params.model - 模型名称
   * @param {Array} params.messages - 消息数组
   * @param {number} params.temperature - 温度参数
   * @param {number} params.max_tokens - 最大token数
   * @param {boolean} params.stream - 是否流式传输
   * @returns {Promise<Object>} 聊天响应
   */
  async sendMessage (params) {
    const {
      model = 'glm-4-flash',
      messages = [],
      temperature = 0.7,
      // eslint-disable-next-line camelcase
      max_tokens = 2048,
      stream = false,
      // eslint-disable-next-line camelcase
      top_p = 0.9
    } = params;

    const requestBody = {
      model,
      messages,
      temperature,
      // eslint-disable-next-line camelcase
      max_tokens,
      stream,
      // eslint-disable-next-line camelcase
      top_p
    };

    return await this._makeRequest('/chat/completions', 'POST', requestBody);
  }

  /**
   * 发送流式聊天请求
   * @param {Object} params - 聊天参数
   * @param {Function} onChunk - 接收数据块的回调
   * @returns {Promise<Object>} 完整响应
   */
  async sendStreamMessage (params, onChunk) {
    const streamParams = { ...params, stream: true };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(streamParams),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  if (onChunk) {
                    onChunk(content);
                  }
                }
              } catch (error) {
                console.warn('解析流式数据失败:', error);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return {
        choices: [{
          message: {
            role: 'assistant',
            content: fullContent
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 发起HTTP请求
   * @param {string} endpoint - API端点
   * @param {string} method - HTTP方法
   * @param {Object} body - 请求体
   * @returns {Promise<Object>} 响应数据
   */
  async _makeRequest (endpoint, method = 'GET', body = null) {
    // 检查API密钥是否存在
    if (!this.apiKey) {
      throw new Error('智谱AI API密钥未配置，请在设置中配置API密钥');
    }

    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`
    };

    const requestOptions = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout)
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    let lastError = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = this._parseErrorResponse(response.status, errorData);
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        return responseData;
      } catch (error) {
        lastError = error;

        // 如果是认证错误或客户端错误，不重试直接抛出
        if (error.message.includes('401') || error.message.includes('403')) {
          throw error;
        }

        if (attempt < this.maxRetries - 1) {
          // 指数退避重试
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`智谱API请求失败，${delay}ms后重试(${attempt + 1}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`请求失败（重试${this.maxRetries}次）: ${lastError.message}`);
  }

  /**
   * 解析错误响应
   * @param {number} statusCode - HTTP状态码
   * @param {Object} errorData - 错误数据
   * @returns {string} 格式化的错误信息
   */
  _parseErrorResponse (statusCode, errorData) {
    const errorMessages = {
      400: '请求参数错误：请检查请求体格式',
      401: 'API密钥无效或已过期：请检查智谱AI API密钥配置',
      403: '权限不足：请确认API密钥具有访问权限',
      404: '模型不存在：请检查模型名称是否正确',
      429: '请求过于频繁：请稍后再试',
      500: '智谱AI服务器内部错误：请稍后再试',
      502: '网关错误：智谱AI服务暂时不可用',
      503: '服务不可用：智谱AI服务维护中，请稍后再试'
    };

    const defaultMessage = errorData.error?.message || errorData.message || '未知错误';
    const statusMessage = errorMessages[statusCode] || `HTTP ${statusCode}`;

    return `${statusMessage} - ${defaultMessage}`;
  }

  /**
   * 获取客户端统计信息
   * @returns {Object} 统计信息
   */
  getStats () {
    return {
      apiProvider: 'zhipu',
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey,
      timeout: this.timeout,
      maxRetries: this.maxRetries
    };
  }

  /**
   * 更新客户端配置
   * @param {Object} config - 新配置
   */
  updateConfig (config) {
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.apiUrl) this.apiUrl = config.apiUrl;
    if (config.timeout) this.timeout = config.timeout;
    if (config.maxRetries) this.maxRetries = config.maxRetries;
  }

  /**
   * 生成图像（CogView系列模型）
   * 调用智谱AI图像生成模型，根据文本描述生成图片
   * @param {string} prompt - 图像描述文本
   * @param {Object} options - 可选配置
   * @param {string} options.size - 图像尺寸，默认 '1344x768'
   * @param {string} options.quality - 图像质量 'standard' 或 'hd'
   * @param {string} options.model - 模型ID，默认 'cogview-3-flash'
   * @returns {Promise<Object>} 生成结果，包含图片URL
   */
  async generateImage (prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('智谱AI API密钥未配置，请在设置中配置API密钥');
    }

    const {
      size = '1344x768',
      quality = 'standard',
      model = 'cogview-3-flash'
    } = options;

    const supportedModels = ['cogview-3-flash', 'cogview-4', 'cogview-4-250304', 'glm-image'];
    if (!supportedModels.includes(model)) {
      console.warn(`[ZhipuClient] 模型 ${model} 可能不被支持，支持的模型: ${supportedModels.join(', ')}`);
    }

    const imageApiUrl = 'https://open.bigmodel.cn/api/paas/v4/images/generations';

    const requestBody = {
      model,
      prompt,
      size,
      quality
    };

    const controller = new AbortController();
    const timeoutMs = this.timeout * 2;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    console.log(`[ZhipuClient] 调用图像生成API: model=${model}, size=${size}, quality=${quality}`);

    try {
      const response = await fetch(imageApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = this._parseImageErrorResponse(response.status, errorData);
        throw new Error(errorMessage);
      }

      const responseData = await response.json();

      console.log(`[ZhipuClient] 图像生成成功，返回 ${responseData.data?.length || 0} 张图片`);

      return {
        success: true,
        data: responseData.data,
        created: responseData.created,
        model,
        size,
        quality
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('图像生成请求超时，请稍后重试');
      }
      throw error;
    }
  }

  /**
   * 获取支持的图像生成模型列表
   * @returns {Array} 模型列表
   */
  getSupportedImageModels () {
    return [
      { id: 'cogview-3-flash', name: 'CogView-3-Flash', isFree: true },
      { id: 'cogview-4', name: 'CogView-4', isFree: false },
      { id: 'cogview-4-250304', name: 'CogView-4 (250304)', isFree: false },
      { id: 'glm-image', name: 'GLM-Image', isFree: false }
    ];
  }

  /**
   * 解析图像生成错误响应
   * @param {number} statusCode - HTTP状态码
   * @param {Object} errorData - 错误数据
   * @returns {string} 格式化的错误信息
   */
  _parseImageErrorResponse (statusCode, errorData) {
    const errorMessages = {
      400: '图像生成参数错误：请检查提示词内容',
      401: 'API密钥无效或已过期：请检查智谱AI API密钥配置',
      403: '权限不足：请确认API密钥具有图像生成权限',
      429: '请求过于频繁：请稍后再试',
      500: '智谱AI服务器内部错误：请稍后再试',
      1301: '内容审核未通过：请修改提示词后重试',
      1302: '提示词包含敏感内容：请修改后重试'
    };

    const code = errorData.error?.code || statusCode;
    const defaultMessage = errorData.error?.message || errorData.message || '未知错误';
    const statusMessage = errorMessages[code] || errorMessages[statusCode] || `错误代码: ${code}`;

    return `${statusMessage} - ${defaultMessage}`;
  }

  /**
   * 关闭客户端
   */
  close () {
    console.log('智谱AI客户端已关闭');
  }
}

export default ZhipuClient;
