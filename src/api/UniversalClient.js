/**
 * 通用 AI API 客户端
 * 支持 OpenAI 兼容接口（OpenAI, DeepSeek, 阿里 Qwen, 百度 ERNIE 等）
 * 允许完全自定义配置
 */

import { RetryStrategy, CircuitBreaker } from '../utils/errorHandler.js';

class UniversalClient {
  constructor (options = {}) {
    this.apiKey = options.apiKey || '';
    this.baseUrl = options.baseUrl || 'https://api.openai.com/v1';
    this.model = options.model || 'gpt-3.5-turbo';
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.headers = options.headers || {};

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

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokens: 0
    };
  }

  /**
   * 更新配置
   * @param {Object} config
   */
  updateConfig (config) {
    if (config.apiKey !== undefined) this.apiKey = config.apiKey;
    if (config.baseUrl !== undefined) this.baseUrl = config.baseUrl;
    if (config.model !== undefined) this.model = config.model;
    if (config.headers !== undefined) this.headers = config.headers;
    if (config.timeout !== undefined) this.timeout = config.timeout;
  }

  /**
   * 发送聊天请求
   * @param {Object} params
   */
  async sendMessage (params) {
    const requestBody = {
      model: this.model, // 优先使用客户端配置的模型ID
      messages: params.messages || [],
      temperature: params.temperature || 0.7,
      max_tokens: params.max_tokens || 2048,
      top_p: params.top_p || 1,
      stream: false
    };

    // 如果 params 中显式指定了 model，则覆盖
    if (params.model) {
      requestBody.model = params.model;
    }

    return await this.sendRequest(requestBody);
  }

  /**
   * 发送底层请求
   * @param {Object} requestBody
   */
  async sendRequest (requestBody) {
    this.stats.totalRequests++;

    try {
      const response = await this.circuitBreaker.execute(async () => {
        return await this.retryStrategy.executeWithRetry(async () => {
          const headers = this.buildHeaders();
          const url = this.baseUrl.endsWith('/') ? `${this.baseUrl}chat/completions` : `${this.baseUrl}/chat/completions`;

          // 处理某些 API 不需要 /chat/completions 后缀的情况（如果用户输入了完整 URL）
          // 这里假设用户输入的是 Base URL (如 https://api.openai.com/v1)
          // 简单的判断逻辑：如果 Base URL 已经包含 chat/completions，就不加了
          const finalUrl = this.baseUrl.includes('chat/completions') ? this.baseUrl : url;

          const res = await fetch(finalUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(this.timeout)
          });

          if (!res.ok) {
            let errorMsg = `HTTP ${res.status} ${res.statusText}`;
            try {
              const errData = await res.json();
              if (errData.error && errData.error.message) {
                errorMsg += `: ${errData.error.message}`;
              }
            } catch (e) {
              // ignore
            }
            throw new Error(errorMsg);
          }

          return res.json();
        });
      });

      this.stats.successfulRequests++;
      return response;
    } catch (error) {
      this.stats.failedRequests++;
      throw error;
    }
  }

  /**
   * 发送流式请求
   * @param {Object} params
   * @param {Function} onChunk
   */
  // eslint-disable-next-line complexity
  async sendStreamMessage (params, onChunk) {
    const requestBody = {
      model: this.model,
      messages: params.messages || [],
      temperature: params.temperature || 0.7,
      max_tokens: params.max_tokens || 2048,
      top_p: params.top_p || 1,
      stream: true
    };

    if (params.model) requestBody.model = params.model;

    const headers = this.buildHeaders();
    const url = this.baseUrl.includes('chat/completions')
      ? this.baseUrl
      : (this.baseUrl.endsWith('/') ? `${this.baseUrl}chat/completions` : `${this.baseUrl}/chat/completions`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content && onChunk) {
                onChunk(content);
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream request failed:', error);
      throw error;
    }
  }

  buildHeaders () {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...this.headers
    };
  }

  getStats () {
    return this.stats;
  }
}

export default UniversalClient;
