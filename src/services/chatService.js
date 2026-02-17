/**
 * 聊天服务层
 * 整合所有模块，提供统一的聊天接口
 */

import OpenRouterClient from '../api/openRouterClient.js';
import ZhipuClient from '../api/zhipuClient.js';
import UniversalClient from '../api/UniversalClient.js';
import OllamaClient from '../api/ollamaClient.js';
import QiniuAIClient from '../api/qiniuAIClient.js';
import RequestBuilder, { createCalendarRequestBuilder } from '../utils/requestBuilder.js';
import ResponseParser from '../utils/responseParser.js';
import ErrorHandler from '../utils/errorHandler.js';
import ChatStorage from '../storage/chatStorage.js';
import envConfig from '../config/env.js';
import ModelConfig from '../config/modelConfig.js';
import OllamaModelConfig from '../config/ollamaModelConfig.js';
import QiniuAIModelConfig from '../config/qiniuAIModelConfig.js';
import apiKeyManager from '../config/apiKeyManager.js';
import apiValidator from '../utils/apiValidator.js';
import { getProviderDisplayName } from '../config/defaultApiConfig.js';
import { useSettingsStore } from '../stores/settings.js';

/**
 * 聊天服务类
 * 提供完整的聊天功能
 */
class ChatService {
  constructor (options = {}) {
    // 验证API配置
    this.validationErrors = [];
    this.defaultProvider = null;

    // Ollama启用状态（从options传入）
    this.ollamaEnabled = options.ollamaEnabled || false;

    const apiConfig = {
      openrouter: {
        url: envConfig.getApiUrl(),
        apiKey: apiKeyManager.getOpenRouterApiKey()
      },
      zhipu: {
        url: envConfig.getZhipuApiUrl(),
        apiKey: apiKeyManager.getZhipuApiKey()
      },
      ollama: {
        url: apiKeyManager.getOllamaApiUrl(),
        apiKey: null,
        enabled: this.ollamaEnabled
      },
      qiniu: {
        url: envConfig.getQiniuAIApiUrl(),
        apiKey: apiKeyManager.getQiniuAIApiKey()
      }
    };

    // 验证配置
    this.validateApiConfig(apiConfig);

    // 根据验证结果创建API客户端
    this.apiClients = this.createApiClients(options);

    // 初始化请求构建器
    this.requestBuilder = options.useCalendar
      ? createCalendarRequestBuilder()
      : new RequestBuilder();

    // 初始化响应解析器
    this.responseParser = new ResponseParser();

    // 初始化错误处理器
    this.errorHandler = new ErrorHandler();

    // 初始化存储
    this.storage = new ChatStorage(options.storage);

    // 聊天状态
    this.isInitialized = false;
    this.isProcessing = false;
  }

  /**
   * 验证API配置
   * @param {Object} config - API配置
   */
  validateApiConfig (config) {
    const validation = apiValidator.validateConfig(config);

    this.validationErrors = validation.errors;
    this.validationWarnings = validation.warnings;
    this.defaultProvider = validation.provider;

    if (!validation.valid) {
      console.warn('API配置验证失败:', validation.errors);
    } else if (this.defaultProvider) {
      console.log(`使用API提供商: ${getProviderDisplayName(this.defaultProvider)}`);
    }
  }

  /**
   * 创建API客户端
   * @param {Object} options - 选项
   * @returns {Object} API客户端对象
   */
  createApiClients (options) {
    const clients = {};
    const timeout = options.timeout || envConfig.getTimeout();
    const maxRetries = options.maxRetries || envConfig.getMaxRetries();

    // OpenRouter客户端
    const openrouterKey = apiKeyManager.getOpenRouterApiKey();
    console.log('[ChatService] OpenRouter API Key:', openrouterKey ? '已配置' : '未配置');
    if (openrouterKey) {
      clients.openrouter = new OpenRouterClient({
        apiKey: openrouterKey,
        timeout,
        maxRetries
      });
    } else {
      console.warn('[ChatService] OpenRouter客户端未创建：API密钥未配置');
    }

    clients.zhipu = new ZhipuClient({
      apiKey: apiKeyManager.getZhipuApiKey(),
      timeout,
      maxRetries
    });

    clients.universal = new UniversalClient({
      timeout,
      maxRetries
    });

    if (this.ollamaEnabled) {
      clients.ollama = new OllamaClient({
        apiUrl: apiKeyManager.getOllamaApiUrl(),
        timeout,
        maxRetries
      });
    }

    const qiniuKey = apiKeyManager.getQiniuAIApiKey();
    if (qiniuKey) {
      clients.qiniu = new QiniuAIClient({
        apiKey: qiniuKey,
        baseUrl: envConfig.getQiniuAIApiUrl(),
        organization: envConfig.getQiniuAIOrganization(),
        project: envConfig.getQiniuAIProject(),
        timeout,
        maxRetries
      });
    }

    return clients;
  }

  /**
   * 初始化服务
   * @returns {Promise<void>}
   */
  async init () {
    if (this.isInitialized) {
      return;
    }

    try {
      // 初始化存储
      await this.storage.init();

      // 加载聊天历史
      const history = await this.storage.loadChatHistory();

      // 设置到请求构建器
      for (const msg of history) {
        this.requestBuilder.addMessage(msg.role, msg.content);
      }

      this.isInitialized = true;
      console.log('聊天服务已初始化');
    } catch (error) {
      console.error('初始化聊天服务失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送消息并获取回复
   * @param {string} userInput - 用户输入
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 聊天结果
   */
  // eslint-disable-next-line complexity
  async sendMessage (userInput, options = {}) {
    // 检查是否正在处理
    if (this.isProcessing) {
      throw new Error('正在处理上一条消息，请稍候');
    }

    // 检查是否已初始化
    if (!this.isInitialized) {
      await this.init();
    }

    // 检查API配置验证错误
    // 注意：在Custom模式下，验证逻辑由UniversalClient处理
    const settingsStore = useSettingsStore();
    const isCustomMode = settingsStore.modelMode === 'custom';

    if (!isCustomMode && this.validationErrors && this.validationErrors.length > 0) {
      const errorMessage = apiValidator.formatAllErrors(this.validationErrors);
      console.warn('API配置验证失败，无法发送消息:', errorMessage);

      return {
        success: false,
        error: {
          userMessage: errorMessage,
          technicalMessage: JSON.stringify(this.validationErrors),
          code: 'API_VALIDATION_FAILED',
          validationErrors: this.validationErrors
        },
        timestamp: new Date().toISOString()
      };
    }

    // 检查是否有可用的API客户端
    if (!this.defaultProvider || !this.apiClients[this.defaultProvider]) {
      const noProviderError = {
        code: 'NO_API_PROVIDER',
        message: '没有可用的API提供商',
        suggestion: '请在设置中配置至少一个API提供商的密钥'
      };

      return {
        success: false,
        error: {
          userMessage: apiValidator.formatErrorMessage(noProviderError),
          technicalMessage: 'No valid API provider configured',
          code: 'NO_API_PROVIDER'
        },
        timestamp: new Date().toISOString()
      };
    }

    this.isProcessing = true;

    try {
      // 更新系统提示词（如果提供）
      if (options.systemPrompt) {
        this.requestBuilder.setSystemPrompt(options.systemPrompt);
      }

      // 更新模型配置（如果提供）
      if (options.modelConfig) {
        this.requestBuilder.setModelConfig(options.modelConfig);
      }

      // 构建API请求
      const requestBody = this.requestBuilder.buildRequest(
        userInput,
        options
      );

      // 确定API提供商
      let apiProvider = 'openrouter'; // default

      if (settingsStore.ollamaEnabled && this.apiClients.ollama) {
        // 如果启用了Ollama，优先使用Ollama
        apiProvider = 'ollama';
        // 使用选中的Ollama模型
        const selectedModel = settingsStore.ollamaSelectedModel || 'llama3.1';
        this.requestBuilder.setModelConfig({ model: selectedModel });
      } else if (settingsStore.modelMode === 'system') {
        apiProvider = 'zhipu';
        // 确保智谱客户端使用Env Key (ZhipuClient内部已处理，这里再次确认)
        if (!this.apiClients.zhipu.isValid && !this.apiClients.zhipu.isValid()) {
          // 如果无效，可能Env Key没加载到
          console.warn('智谱客户端密钥无效');
        }
      } else if (settingsStore.modelMode === 'custom') {
        apiProvider = 'universal';
        // 更新通用客户端配置
        this.apiClients.universal.updateConfig({
          apiKey: settingsStore.customModelConfig.apiKey,
          baseUrl: settingsStore.customModelConfig.baseUrl,
          model: settingsStore.customModelConfig.modelId,
          headers: {} // 可以扩展支持自定义Header
        });
        // 可以在这里设置参数
        this.requestBuilder.setModelConfig(settingsStore.customModelConfig.parameters);
      } else {
        // Fallback to old logic if any
        const modelConfig = this.requestBuilder.getConfig();
        const modelInfo = this.getModelInfo(modelConfig.model);
        apiProvider = modelInfo?.apiProvider || this.defaultProvider || 'openrouter';
      }

      // 检查对应的客户端是否存在
      console.log('[ChatService] 使用模式:', settingsStore.modelMode);
      console.log('[ChatService] 使用API提供商:', apiProvider);
      console.log('[ChatService] 可用客户端:', Object.keys(this.apiClients));
      if (!this.apiClients[apiProvider]) {
        console.error('[ChatService] 客户端不可用:', apiProvider);
        const clientError = {
          code: 'API_CLIENT_NOT_AVAILABLE',
          message: `${getProviderDisplayName(apiProvider)}客户端不可用`,
          suggestion: '请检查API密钥配置'
        };

        return {
          success: false,
          error: {
            userMessage: apiValidator.formatErrorMessage(clientError),
            technicalMessage: `API client for ${apiProvider} not available`,
            code: 'API_CLIENT_NOT_AVAILABLE'
          },
          timestamp: new Date().toISOString()
        };
      }

      // 根据API提供商选择对应的客户端
      let response;
      if (apiProvider === 'zhipu') {
        // 使用智谱AI API客户端
        response = await this.apiClients.zhipu.sendMessage(requestBody);
      } else if (apiProvider === 'universal') {
        // 使用通用客户端
        response = await this.apiClients.universal.sendMessage(requestBody);
      } else if (apiProvider === 'ollama') {
        // 使用Ollama API客户端
        response = await this.apiClients.ollama.sendRequest(requestBody);
      } else if (apiProvider === 'qiniu-ai' || apiProvider === 'qiniu') {
        // 使用七牛云AI API客户端
        response = await this.apiClients.qiniu.sendMessage(requestBody);
      } else {
        // 使用OpenRouter API客户端
        response = await this.apiClients.openrouter.sendRequest(requestBody);
      }

      // 解析响应
      const parsed = this.responseParser.parseResponse(response);

      // 保存到存储
      await this.storage.saveConversation(
        userInput,
        parsed.content,
        parsed.metadata
      );

      // 更新请求构建器的历史
      this.requestBuilder.addMessage('user', userInput);
      this.requestBuilder.addMessage('assistant', parsed.content);

      // 返回结果
      return {
        success: true,
        content: parsed.content,
        metadata: parsed.metadata,
        keyInfo: parsed.keyInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // 处理错误
      const handledError = this.errorHandler.handleError(error);

      // 保存错误消息到存储
      await this.storage.saveUserMessage(userInput);

      // 返回错误结果
      return {
        success: false,
        error: handledError,
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 获取模型信息
   * @param {string} modelName - 模型名称
   * @returns {Object} 模型信息
   */
  getModelInfo (modelName) {
    // 先尝试从 ModelConfig 获取（OpenRouter 和 Cherry）
    const modelInfo = ModelConfig.getModelInfo(modelName);
    if (modelInfo) {
      return modelInfo;
    }

    // 尝试从 OllamaModelConfig 获取（Ollama）
    const ollamaModelInfo = OllamaModelConfig.getModelInfo(modelName);
    if (ollamaModelInfo) {
      return ollamaModelInfo;
    }

    // 尝试从 QiniuAIModelConfig 获取（七牛云AI）
    const qiniuModelInfo = QiniuAIModelConfig.getModelInfo(modelName);
    if (qiniuModelInfo) {
      return qiniuModelInfo;
    }

    return null;
  }

  /**
   * 发送流式消息
   * @param {string} userInput - 用户输入
   * @param {Function} onChunk - 接收数据块的回调
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 聊天结果
   */
  async sendStreamMessage (userInput, onChunk, options = {}) {
    if (this.isProcessing) {
      throw new Error('正在处理上一条消息，请稍候');
    }

    // 检查是否已初始化
    if (!this.isInitialized) {
      await this.init();
    }

    this.isProcessing = true;

    let fullContent = '';

    try {
      // 更新系统提示词（如果提供）
      if (options.systemPrompt) {
        this.requestBuilder.setSystemPrompt(options.systemPrompt);
      }

      // 更新模型配置（如果提供）
      if (options.modelConfig) {
        this.requestBuilder.setModelConfig(options.modelConfig);
      }

      // 构建API请求
      const requestBody = this.requestBuilder.buildRequest(
        userInput,
        options
      );

      // 发送流式请求 - 根据模式选择客户端
      const settingsStore = useSettingsStore();
      let apiProvider = this.defaultProvider || 'openrouter';

      if (settingsStore.modelMode === 'system') {
        apiProvider = 'zhipu';
      } else if (settingsStore.modelMode === 'custom') {
        apiProvider = 'universal';
        this.apiClients.universal.updateConfig({
          apiKey: settingsStore.customModelConfig.apiKey,
          baseUrl: settingsStore.customModelConfig.baseUrl,
          model: settingsStore.customModelConfig.modelId
        });
      }

      const client = this.apiClients[apiProvider];
      if (!client) {
        throw new Error(`API客户端不可用: ${apiProvider}`);
      }
      await client.sendStreamRequest(
        requestBody,
        (chunk) => {
          // 调用回调
          if (onChunk) {
            onChunk(chunk);
          }

          // 累积内容
          fullContent += chunk;
        }
      );

      // 解析完整响应
      const parsed = this.responseParser.parseResponse({
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
      });

      // 保存到存储
      await this.storage.saveConversation(
        userInput,
        parsed.content,
        parsed.metadata
      );

      // 更新请求构建器的历史
      this.requestBuilder.addMessage('user', userInput);
      this.requestBuilder.addMessage('assistant', parsed.content);

      // 返回结果
      return {
        success: true,
        content: parsed.content,
        metadata: parsed.metadata,
        keyInfo: parsed.keyInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // 处理错误
      const handledError = this.errorHandler.handleError(error);

      // 保存错误消息到存储
      await this.storage.saveUserMessage(userInput);

      // 返回错误结果
      return {
        success: false,
        error: handledError,
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 获取聊天历史
   * @param {number} limit - 消息数量限制
   * @returns {Promise<Array>} 聊天历史
   */
  async getChatHistory (limit = 20) {
    return await this.storage.loadChatHistory(limit);
  }

  /**
   * 搜索聊天记录
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 匹配的消息
   */
  async searchMessages (keyword) {
    return await this.storage.searchMessages(keyword);
  }

  /**
   * 按日期获取消息
   * @param {string} date - 日期（YYYY-MM-DD格式）
   * @returns {Promise<Array>} 消息数组
   */
  async getMessagesByDate (date) {
    return await this.storage.loadMessagesByDate(date);
  }

  /**
   * 清空聊天历史
   * @returns {Promise<void>}
   */
  async clearChatHistory () {
    await this.storage.clearChatHistory();

    // 清空请求构建器的历史
    this.requestBuilder.clearHistory();
  }

  /**
   * 删除消息
   * @param {number} messageId - 消息ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteMessage (messageId) {
    return await this.storage.deleteMessage(messageId);
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics () {
    const storageStats = await this.storage.getStatistics();
    const openRouterStats = this.apiClients.openrouter?.getStats();
    const zhipuStats = this.apiClients.zhipu?.getStats();
    const ollamaStats = this.apiClients.ollama?.getStats();
    const qiniuStats = this.apiClients.qiniu?.getStats();
    const errorLogs = this.errorHandler.getErrorLogs(10);

    return {
      storage: storageStats,
      api: {
        openrouter: openRouterStats,
        zhipu: zhipuStats,
        ollama: ollamaStats,
        qiniu: qiniuStats
      },
      recentErrors: errorLogs
    };
  }

  /**
   * 导出聊天记录
   * @param {string} filePath - 导出文件路径
   * @returns {Promise<boolean>} 是否导出成功
   */
  async exportChatHistory (filePath) {
    return await this.storage.exportMessages(filePath);
  }

  /**
   * 导入聊天记录
   * @param {string} filePath - 导入文件路径
   * @returns {Promise<boolean>} 是否导入成功
   */
  async importChatHistory (filePath) {
    const result = await this.storage.importMessages(filePath);

    // 重新加载历史
    if (result) {
      const history = await this.storage.loadChatHistory();

      // 清空并重新设置历史
      this.requestBuilder.clearHistory();

      for (const msg of history) {
        this.requestBuilder.addMessage(msg.role, msg.content);
      }
    }

    return result;
  }

  /**
   * 更新系统提示词
   * @param {string} prompt - 系统提示词
   */
  updateSystemPrompt (prompt) {
    this.requestBuilder.setSystemPrompt(prompt);
  }

  /**
   * 更新模型配置
   * @param {Object} config - 模型配置
   */
  updateModelConfig (config) {
    this.requestBuilder.setModelConfig(config);
  }

  /**
   * 重置服务
   * @returns {Promise<void>}
   */
  async reset () {
    // 清空聊天历史
    await this.clearChatHistory();

    // 重置请求构建器
    this.requestBuilder.reset();

    // 重置所有API客户端统计
    Object.values(this.apiClients).forEach(client => {
      if (client && typeof client.resetStats === 'function') {
        client.resetStats();
      }
      if (client && typeof client.resetCircuitBreaker === 'function') {
        client.resetCircuitBreaker();
      }
    });

    console.log('聊天服务已重置');
  }

  /**
   * 关闭服务
   */
  async close () {
    this.storage.close();

    this.apiClients.openrouter?.close();
    this.apiClients.zhipu?.close();
    this.apiClients.ollama?.close();
    this.apiClients.qiniu?.close();

    console.log('聊天服务已关闭');
  }

  getStatus () {
    return {
      initialized: this.isInitialized,
      processing: this.isProcessing,
      ollamaEnabled: this.ollamaEnabled,
      apiClients: {
        openrouter: this.apiClients.openrouter?.getStats(),
        zhipu: this.apiClients.zhipu?.getStats(),
        ollama: this.apiClients.ollama?.getStats(),
        qiniu: this.apiClients.qiniu?.getStats()
      }
    };
  }
}

/**
 * 创建日历应用专用的聊天服务
 * @param {Object} options - 配置选项
 * @returns {ChatService} 聊天服务实例
 */
function createCalendarChatService (options = {}) {
  return new ChatService({
    ...options,
    useCalendar: true
  });
}

// 导出
export default ChatService;
export { createCalendarChatService };
