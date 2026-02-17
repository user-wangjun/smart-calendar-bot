/**
 * 七牛云AI模型API客户端
 * 提供大模型推理服务，兼容OpenAI标准
 */

/**
 * 七牛云AI模型配置
 */
const QINIU_AI_CONFIG = {
  // 默认API端点（需用户配置自己的七牛云AI服务端点）
  baseUrl: '',
  // 聊天完成接口
  chatCompletionEndpoint: '/chat/completions',
  // 模型列表接口
  modelsEndpoint: '/models',
  // 默认超时时间（毫秒）
  timeout: 30000,
  // 默认重试次数
  maxRetries: 3
};

/**
 * 七牛云AI模型客户端类
 */
class QiniuAIClient {
  constructor (options = {}) {
    this.apiKey = options.apiKey || '';
    this.baseUrl = options.baseUrl || QINIU_AI_CONFIG.baseUrl;
    this.timeout = options.timeout || QINIU_AI_CONFIG.timeout;
    this.maxRetries = options.maxRetries || QINIU_AI_CONFIG.maxRetries;
    this.organization = options.organization || '';
    this.project = options.project || '';
  }

  /**
   * 获取可用的AI模型列表
   * @returns {Promise<Array>} 模型列表
   */
  async getModels () {
    const response = await this._makeRequest(QINIU_AI_CONFIG.modelsEndpoint, 'GET');
    return response.data || response;
  }

  /**
   * 发送聊天消息
   * @param {Object} params - 聊天参数
   * @param {string} params.model - 模型名称
   * @param {Array} params.messages - 消息数组
   * @param {number} params.temperature - 温度参数（0-2）
   * @param {number} params.max_tokens - 最大token数
   * @param {boolean} params.stream - 是否流式传输
   * @returns {Promise<Object>} 聊天响应
   */
  async sendMessage (params) {
    const {
      model = 'qiniu-llm',
      messages = [],
      temperature = 0.7,
      // eslint-disable-next-line camelcase
      max_tokens = 2048,
      stream = false,
      // eslint-disable-next-line camelcase
      top_p = 1,
      // eslint-disable-next-line camelcase
      frequency_penalty = 0,
      // eslint-disable-next-line camelcase
      presence_penalty = 0,
      stop = null,
      user = null
    } = params;

    const requestBody = {
      model,
      messages,
      temperature,
      // eslint-disable-next-line camelcase
      max_tokens,
      stream,
      // eslint-disable-next-line camelcase
      top_p,
      // eslint-disable-next-line camelcase
      frequency_penalty,
      // eslint-disable-next-line camelcase
      presence_penalty,
      stop,
      user
    };

    const response = await this._makeRequest(
      QINIU_AI_CONFIG.chatCompletionEndpoint,
      'POST',
      requestBody
    );

    if (stream) {
      return this._parseStreamResponse(response);
    }

    return this._parseResponse(response);
  }

  /**
   * 流式聊天
   * @param {Object} params - 聊天参数
   * @returns {Promise<AsyncIterator>} 流式响应迭代器
   */
  async * streamMessage (params) {
    const streamParams = { ...params, stream: true };
    const response = await this.sendMessage(streamParams);

    if (response.body && response.body.getReader) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') return;

              try {
                const parsed = JSON.parse(data);
                yield this._parseStreamChunk(parsed);
              } catch (error) {
                console.warn('解析流式数据失败:', error);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      // 如果不是流式响应，直接返回解析后的内容
      yield this._parseResponse(response);
    }
  }

  /**
   * 批量推理（七牛云特色功能）
   * @param {Array} batchRequests - 批量请求数组
   * @returns {Promise<Array>} 批量响应数组
   */
  async batchInference (batchRequests) {
    const requestBody = {
      requests: batchRequests.map(request => ({
        model: request.model || 'qiniu-llm',
        messages: request.messages || [],
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 2048,
        top_p: request.top_p || 1,
        frequency_penalty: request.frequency_penalty || 0,
        presence_penalty: request.presence_penalty || 0
      }))
    };

    const response = await this._makeRequest('/batch', 'POST', requestBody);
    return response.responses || response;
  }

  /**
   * 获取模型信息
   * @param {string} modelId - 模型ID
   * @returns {Promise<Object>} 模型信息
   */
  async getModelInfo (modelId) {
    const response = await this._makeRequest(`${QINIU_AI_CONFIG.modelsEndpoint}/${modelId}`, 'GET');
    return response;
  }

  /**
   * 获取客户端统计信息
   * @returns {Object} 统计信息
   */
  getStats () {
    return {
      apiProvider: 'qiniu-ai',
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
      organization: this.organization,
      project: this.project
    };
  }

  /**
   * 更新客户端配置
   * @param {Object} config - 新配置
   */
  updateConfig (config) {
    if (config.apiKey) this.apiKey = config.apiKey;
    if (config.baseUrl) this.baseUrl = config.baseUrl;
    if (config.timeout) this.timeout = config.timeout;
    if (config.maxRetries) this.maxRetries = config.maxRetries;
    if (config.organization) this.organization = config.organization;
    if (config.project) this.project = config.project;
  }

  /**
   * 发起HTTP请求
   * @param {string} endpoint - API端点
   * @param {string} method - HTTP方法
   * @param {Object} body - 请求体
   * @returns {Promise<Object>} 响应数据
   */
  async _makeRequest (endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    // 添加认证头
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    // 添加组织和项目信息
    if (this.organization) {
      headers['X-Organization'] = this.organization;
    }
    if (this.project) {
      headers['X-Project'] = this.project;
    }

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
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // 如果是流式响应，直接返回response对象
        if (body && body.stream) {
          return response;
        }

        const responseData = await response.json();
        return responseData;
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries - 1) {
          // 指数退避重试
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`请求失败（重试${this.maxRetries}次）: ${lastError.message}`);
  }

  /**
   * 解析标准响应
   * @param {Object} response - 响应数据
   * @returns {Object} 解析后的响应
   */
  _parseResponse (response) {
    if (!response) {
      throw new Error('响应数据为空');
    }

    // 兼容OpenAI格式的响应
    if (response.choices && response.choices.length > 0) {
      const choice = response.choices[0];
      return {
        id: response.id,
        object: response.object,
        created: response.created,
        model: response.model,
        choices: response.choices,
        usage: response.usage,
        content: choice.message?.content || choice.text || '',
        finishReason: choice.finish_reason
      };
    }

    // 七牛云自定义格式
    if (response.result) {
      return {
        content: response.result.text || response.result.content || '',
        model: response.model,
        usage: response.usage,
        raw: response
      };
    }

    return response;
  }

  /**
   * 解析流式响应块
   * @param {Object} chunk - 流式数据块
   * @returns {Object} 解析后的块
   */
  _parseStreamChunk (chunk) {
    if (chunk.choices && chunk.choices.length > 0) {
      const delta = chunk.choices[0].delta;
      return {
        content: delta?.content || '',
        role: delta?.role,
        finishReason: chunk.choices[0].finish_reason,
        id: chunk.id,
        model: chunk.model
      };
    }

    return {
      content: chunk.result?.text || chunk.text || '',
      raw: chunk
    };
  }
}

export default QiniuAIClient;
