/**
 * OpenRouter API客户端
 * 负责发送API请求并处理网络响应
 */

import envConfig from '../config/env.js';
import { RetryStrategy, CircuitBreaker } from '../utils/errorHandler.js';

/**
 * OpenRouter客户端类
 */
class OpenRouterClient {
  constructor (options = {}) {
    // 从环境变量或选项中获取配置
    this.apiKey = options.apiKey || envConfig.getApiKey();
    this.apiUrl = options.apiUrl || envConfig.getApiUrl();
    this.timeout = options.timeout || envConfig.getTimeout();
    this.maxRetries = options.maxRetries || envConfig.getMaxRetries();

    // 验证API密钥
    if (!this.apiKey) {
      throw new Error('API密钥未配置');
    }

    // 初始化重试策略
    this.retryStrategy = new RetryStrategy({
      maxRetries: this.maxRetries,
      baseDelay: 1000,
      maxDelay: 30000
    });

    // 初始化断路器
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000
    });

    // 请求统计
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCost: 0
    };
  }

  /**
   * 发送POST请求
   * @param {string} url - 请求URL
   * @param {Object} headers - 请求头
   * @param {Object} body - 请求体
   * @returns {Promise<Response>} 响应对象
   */
  async post (url, headers, body) {
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // 发送请求
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      // 清除超时定时器
      clearTimeout(timeoutId);

      // 检查响应状态
      if (!response.ok) {
        const error = new Error(`HTTP错误: ${response.status}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          headers: this.parseHeaders(response.headers)
        };

        // 尝试读取错误响应体
        try {
          error.response.data = await response.json();
          console.error('[OpenRouterClient] API错误响应:', error.response.data);
        } catch (e) {
          error.response.data = await response.text();
          console.error('[OpenRouterClient] API错误响应:', error.response.data);
        }

        // 记录详细的错误信息
        console.error('[OpenRouterClient] 请求失败:', {
          status: response.status,
          statusText: response.statusText,
          url,
          body
        });

        throw error;
      }

      return response;
    } catch (error) {
      // 清除超时定时器
      clearTimeout(timeoutId);

      // 如果是超时错误，添加code属性
      if (error.name === 'AbortError') {
        error.code = 'ECONNABORTED';
      }

      throw error;
    }
  }

  /**
   * 解析响应头
   * @param {Headers} headers - Fetch API的Headers对象
   * @returns {Object} 普通对象
   */
  parseHeaders (headers) {
    const result = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * 发送API请求（带重试和断路器）
   * @param {Object} requestBody - 请求体
   * @returns {Promise<Object>} 响应数据
   */
  async sendRequest (requestBody) {
    // 更新统计
    this.stats.totalRequests++;

    try {
      // 使用断路器保护
      const response = await this.circuitBreaker.execute(async () => {
        // 使用重试策略
        return await this.retryStrategy.executeWithRetry(async () => {
          // 构建请求头
          const headers = this.buildHeaders();

          // 发送请求
          return await this.post(this.apiUrl, headers, requestBody);
        });
      });

      // 解析响应体
      const data = await response.json();

      // 更新成功统计
      this.stats.successfulRequests++;

      // 更新token统计
      if (data.usage) {
        this.stats.totalTokens += (data.usage.prompt_tokens || 0) +
                              (data.usage.completion_tokens || 0);
      }

      return data;
    } catch (error) {
      // 更新失败统计
      this.stats.failedRequests++;

      // 重新抛出错误
      throw error;
    }
  }

  /**
   * 构建请求头
   * @returns {Object} 请求头对象
   */
  buildHeaders () {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://calendar-app.com',
      'X-Title': 'Calendar App'
    };
    console.log('[OpenRouterClient] 构建请求头:', { ...headers, Authorization: 'Bearer ***' });
    return headers;
  }

  /**
   * 发送流式请求
   * @param {Object} requestBody - 请求体
   * @param {Function} onChunk - 接收数据块的回调函数
   * @returns {Promise<void>}
   */
  async sendStreamRequest (requestBody, onChunk) {
    // 更新统计
    this.stats.totalRequests++;

    try {
      // 使用断路器保护
      await this.circuitBreaker.execute(async () => {
        // 使用重试策略
        await this.retryStrategy.executeWithRetry(async () => {
          // 构建请求头
          const headers = this.buildHeaders();

          // 创建AbortController
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);

          try {
            // 发送流式请求
            const response = await fetch(this.apiUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify({ ...requestBody, stream: true }),
              signal: controller.signal
            });

            // 清除超时定时器
            clearTimeout(timeoutId);

            // 检查响应状态
            if (!response.ok) {
              const error = new Error(`HTTP错误: ${response.status}`);
              error.response = {
                status: response.status,
                statusText: response.statusText
              };
              throw error;
            }

            // 读取流
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                break;
              }

              // 解码数据块
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              // 处理每一行
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);

                  // 跳过结束标记
                  if (data === '[DONE]') {
                    continue;
                  }

                  try {
                    // 解析JSON数据
                    const parsed = JSON.parse(data);

                    // 提取内容
                    const content = parsed.choices?.[0]?.delta?.content;

                    if (content) {
                      onChunk(content);
                    }
                  } catch (e) {
                    console.error('解析流数据失败:', e);
                  }
                }
              }
            }

            // 更新成功统计
            this.stats.successfulRequests++;
          } catch (error) {
            // 清除超时定时器
            clearTimeout(timeoutId);

            // 如果是超时错误，添加code属性
            if (error.name === 'AbortError') {
              error.code = 'ECONNABORTED';
            }

            throw error;
          }
        });
      });
    } catch (error) {
      // 更新失败统计
      this.stats.failedRequests++;

      // 重新抛出错误
      throw error;
    }
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计数据
   */
  getStats () {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0
        ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
        : '0%'
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
      totalTokens: 0,
      totalCost: 0
    };
  }

  /**
   * 获取断路器状态
   * @returns {Object} 断路器状态
   */
  getCircuitBreakerState () {
    return this.circuitBreaker.getState();
  }

  /**
   * 重置断路器
   */
  resetCircuitBreaker () {
    this.circuitBreaker.reset();
  }

  /**
   * 更新API密钥
   * @param {string} newApiKey - 新的API密钥
   */
  updateApiKey (newApiKey) {
    if (!newApiKey) {
      throw new Error('API密钥不能为空');
    }

    this.apiKey = newApiKey;
    console.log('API密钥已更新');
  }

  /**
   * 更新超时时间
   * @param {number} newTimeout - 新的超时时间（毫秒）
   */
  updateTimeout (newTimeout) {
    if (typeof newTimeout !== 'number' || newTimeout < 1000) {
      throw new Error('超时时间必须大于等于1000毫秒');
    }

    this.timeout = newTimeout;
    console.log(`超时时间已更新为 ${newTimeout}ms`);
  }

  /**
   * 关闭客户端
   * 清理资源
   */
  close () {
    // 重置断路器
    this.circuitBreaker.reset();

    console.log('OpenRouter客户端已关闭');
  }
}

// 导出
export default OpenRouterClient;
