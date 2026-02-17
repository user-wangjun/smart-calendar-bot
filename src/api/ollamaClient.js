/**
 * Ollama API客户端
 * 负责与本地Ollama服务进行通信
 */

import envConfig from '../config/env.js';
import { RetryStrategy, CircuitBreaker } from '../utils/errorHandler.js';

/**
 * Ollama客户端类
 */
class OllamaClient {
  constructor (options = {}) {
    // 从环境变量或选项中获取配置
    this.apiUrl = options.apiUrl || envConfig.get('OLLAMA_API_URL', 'http://localhost:11434/api');
    this.timeout = options.timeout || envConfig.getTimeout();
    this.maxRetries = options.maxRetries || envConfig.getMaxRetries();

    // 初始化重试策略
    this.retryStrategy = new RetryStrategy({
      maxRetries: this.maxRetries,
      baseDelay: 1000,
      maxDelay: 10000
    });

    // 初始化断路器
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000
    });

    // 统计信息
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0
    };
  }

  /**
   * 发送POST请求
   * @param {string} endpoint - API端点
   * @param {Object} data - 请求数据
   * @returns {Promise<Object>} 响应数据
   */
  async post (endpoint, data) {
    return this.retryStrategy.executeWithRetry(async () => {
      return this.circuitBreaker.execute(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(`${this.apiUrl}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
          }

          const result = await response.json();

          // 更新统计
          this.stats.totalRequests++;
          this.stats.successfulRequests++;

          return result;
        } catch (error) {
          clearTimeout(timeoutId);

          // 更新统计
          this.stats.totalRequests++;
          this.stats.failedRequests++;

          if (error.name === 'AbortError') {
            throw new Error('请求超时');
          }
          throw error;
        }
      });
    });
  }

  /**
   * 发送聊天完成请求
   * @param {Object} requestBody - 请求体
   * @returns {Promise<Object>} 响应数据
   */
  async sendRequest (requestBody) {
    return this.post('/chat', requestBody);
  }

  /**
   * 发送流式聊天请求
   * @param {Object} requestBody - 请求体
   * @param {Function} onChunk - 接收数据块的回调
   * @returns {Promise<Object>} 完整响应
   */
  async sendStreamRequest (requestBody, onChunk) {
    return this.retryStrategy.executeWithRetry(async () => {
      return this.circuitBreaker.execute(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(`${this.apiUrl}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...requestBody,
              stream: true
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';

          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              try {
                const data = JSON.parse(line);

                if (data.message && data.message.content) {
                  fullContent += data.message.content;

                  // 调用回调
                  if (onChunk) {
                    onChunk({
                      content: data.message.content,
                      done: data.done,
                      model: data.model
                    });
                  }
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }

          // 更新统计
          this.stats.totalRequests++;
          this.stats.successfulRequests++;

          return {
            message: {
              content: fullContent
            },
            model: requestBody.model,
            done: true
          };
        } catch (error) {
          clearTimeout(timeoutId);

          // 更新统计
          this.stats.totalRequests++;
          this.stats.failedRequests++;

          if (error.name === 'AbortError') {
            throw new Error('请求超时');
          }
          throw error;
        }
      });
    });
  }

  /**
   * 获取可用模型列表
   * @returns {Promise<Array>} 模型列表
   */
  async getModels () {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.apiUrl}/tags`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const result = await response.json();
      return result.models || [];
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 获取模型信息
   * @param {string} modelName - 模型名称
   * @returns {Promise<Object>} 模型信息
   */
  async getModelInfo (modelName) {
    const models = await this.getModels();
    return models.find(model => model.name === modelName) || null;
  }

  /**
   * 拉取模型（如果未下载）
   * @param {string} modelName - 模型名称
   * @returns {Promise<void>}
   */
  async pullModel (modelName) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5分钟超时

    try {
      const response = await fetch(`${this.apiUrl}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: modelName,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 生成嵌入向量
   * @param {string} text - 文本
   * @param {string} model - 模型名称
   * @returns {Promise<Array>} 嵌入向量
   */
  async generateEmbedding (text, model = 'nomic-embed-text') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.apiUrl}/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          input: text
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const result = await response.json();
      return result.embedding;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 发送多模态请求（图像+文本）
   * @param {string} imageUrl - 图像URL或base64
   * @param {string} text - 文本提示
   * @param {string} model - 模型名称
   * @returns {Promise<Object>} 响应数据
   */
  async sendMultimodalRequest (imageUrl, text, model = 'aha2025/llava-joycaption-beta-one-hf-llava:Q4_K_M') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt: text,
          images: [imageUrl],
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const result = await response.json();

      // 更新统计
      this.stats.totalRequests++;
      this.stats.successfulRequests++;

      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      // 更新统计
      this.stats.totalRequests++;
      this.stats.failedRequests++;

      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    }
  }

  /**
   * 图像描述生成
   * @param {string} imageUrl - 图像URL或base64
   * @param {string} model - 模型名称
   * @returns {Promise<string>} 图像描述
   */
  async generateImageCaption (imageUrl, model = 'aha2025/llava-joycaption-beta-one-hf-llava:Q4_K_M') {
    const response = await this.sendMultimodalRequest(imageUrl, '请详细描述这张图片', model);
    return response.response || response.text || '';
  }

  /**
   * 视觉问答
   * @param {string} imageUrl - 图像URL或base64
   * @param {string} question - 问题
   * @param {string} model - 模型名称
   * @returns {Promise<string>} 答案
   */
  async visualQA (imageUrl, question, model = 'aha2025/llava-joycaption-beta-one-hf-llava:Q4_K_M') {
    const response = await this.sendMultimodalRequest(imageUrl, question, model);
    return response.response || response.text || '';
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计数据
   */
  getStats () {
    return {
      apiProvider: 'ollama',
      apiUrl: this.apiUrl,
      ...this.stats,
      successRate: this.stats.totalRequests > 0
        ? `${((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2)}%`
        : '0.00%'
    };
  }

  /**
   * 重置统计信息
   */
  resetStats () {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0
    };
  }

  /**
   * 关闭客户端
   */
  close () {
    this.circuitBreaker.reset();
    console.log('Ollama客户端已关闭');
  }
}

export default OllamaClient;
