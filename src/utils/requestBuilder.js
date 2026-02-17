/**
 * 请求构建器模块
 * 负责构建符合OpenRouter API规范的请求结构
 */

import ModelConfig from '../config/modelConfig.js';

/**
 * 消息角色枚举
 */
const MessageRole = {
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant'
};

/**
 * 请求构建器类
 */
class RequestBuilder {
  constructor () {
    this.systemPrompt = null;
    this.chatHistory = [];
    this.modelConfig = new ModelConfig();
  }

  /**
   * 设置系统提示词
   * 系统提示词定义了AI助手的角色和行为
   * @param {string} prompt - 系统提示词
   */
  setSystemPrompt (prompt) {
    this.systemPrompt = prompt;
    return this;
  }

  /**
   * 添加聊天历史
   * 聊天历史用于保持对话的上下文
   * @param {Array} history - 聊天历史数组
   */
  setChatHistory (history) {
    this.chatHistory = Array.isArray(history) ? history : [];
    return this;
  }

  /**
   * 添加单条消息到历史
   * @param {string} role - 消息角色（system/user/assistant）
   * @param {string} content - 消息内容
   */
  addMessage (role, content) {
    this.chatHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
    return this;
  }

  /**
   * 设置模型配置
   * @param {Object} config - 模型配置对象
   */
  setModelConfig (config) {
    if (config instanceof ModelConfig) {
      this.modelConfig = config;
    } else {
      this.modelConfig.update(config);
    }
    return this;
  }

  /**
   * 获取当前模型配置
   * @returns {Object} 模型配置对象
   */
  getConfig () {
    return this.modelConfig.toRequestBody();
  }

  /**
   * 构建消息数组
   * 将系统提示词、聊天历史和用户输入组合成标准格式
   * @param {string} userInput - 用户输入
   * @returns {Array} 消息数组
   */
  buildMessages (userInput) {
    const messages = [];

    // 添加系统提示词（如果有）
    if (this.systemPrompt) {
      messages.push({
        role: MessageRole.SYSTEM,
        content: this.systemPrompt
      });
    }

    // 添加聊天历史
    // 确保历史记录按时间顺序排列
    const sortedHistory = [...this.chatHistory].sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    for (const msg of sortedHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // 添加当前用户输入
    messages.push({
      role: MessageRole.USER,
      content: userInput
    });

    return messages;
  }

  /**
   * 估算tokens数量
   * 粗略估算：1 token ≈ 4个中文字符 或 0.75个英文单词
   * @param {string} text - 文本内容
   * @returns {number} 估算的tokens数
   */
  estimateTokens (text) {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    // 统计中文字符
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;

    // 统计英文单词
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;

    // 统计其他字符（标点、数字等）
    const otherChars = text.length - chineseChars - englishWords;

    // 估算：中文字符1:1，英文单词0.75，其他字符0.5
    return chineseChars + Math.ceil(englishWords * 0.75) + Math.ceil(otherChars * 0.5);
  }

  /**
   * 计算消息数组的总tokens
   * @param {Array} messages - 消息数组
   * @returns {number} 总tokens数
   */
  calculateTotalTokens (messages) {
    let totalTokens = 0;

    for (const message of messages) {
      totalTokens += this.estimateTokens(message.content);
    }

    return totalTokens;
  }

  /**
   * 检查并优化消息长度
   * 如果消息过长，裁剪旧消息以保持在token限制内
   * @param {Array} messages - 消息数组
   * @param {number} maxTokens - 最大tokens数
   * @returns {Array} 优化后的消息数组
   */
  optimizeMessageLength (messages, maxTokens = 4096) {
    const totalTokens = this.calculateTotalTokens(messages);

    // 如果在限制内，直接返回
    if (totalTokens <= maxTokens) {
      return messages;
    }

    console.warn(`消息长度超过限制（${totalTokens} > ${maxTokens}），开始优化...`);

    // 保留系统提示词和最近的对话
    const optimizedMessages = [];
    let currentTokens = 0;

    // 从后向前遍历，保留最新的消息
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = this.estimateTokens(message.content);

      // 系统提示词必须保留
      if (message.role === MessageRole.SYSTEM) {
        optimizedMessages.unshift(message);
        currentTokens += messageTokens;
        continue;
      }

      // 检查是否还有空间
      if (currentTokens + messageTokens <= maxTokens) {
        optimizedMessages.unshift(message);
        currentTokens += messageTokens;
      } else {
        console.log(`裁剪消息: ${message.content.substring(0, 50)}...`);
      }
    }

    console.log(`优化后tokens数: ${currentTokens}`);
    return optimizedMessages;
  }

  /**
   * 构建完整的API请求
   * @param {string} userInput - 用户输入
   * @param {Object} options - 可选参数
   * @returns {Object} API请求对象
   */
  buildRequest (userInput, options = {}) {
    // 构建消息数组
    let messages = this.buildMessages(userInput);

    // 优化消息长度（如果需要）
    const maxTokens = options.maxTokens || 4096;
    messages = this.optimizeMessageLength(messages, maxTokens);

    // 获取模型配置
    const modelConfigBody = this.modelConfig.toRequestBody();

    // 构建完整请求体
    const requestBody = {
      ...modelConfigBody,
      messages
    };

    return requestBody;
  }

  /**
   * 构建请求头
   * @param {string} apiKey - API密钥
   * @returns {Object} 请求头对象
   */
  buildHeaders (apiKey) {
    return {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://calendar-app.com', // 用于统计
      'X-Title': 'Calendar App' // 用于统计
    };
  }

  /**
   * 清空聊天历史
   */
  clearHistory () {
    this.chatHistory = [];
    return this;
  }

  /**
   * 获取聊天历史
   * @returns {Array} 聊天历史
   */
  getHistory () {
    return [...this.chatHistory];
  }

  /**
   * 重置构建器
   */
  reset () {
    this.systemPrompt = null;
    this.chatHistory = [];
    this.modelConfig.reset();
    return this;
  }
}

/**
 * 创建日历应用专用的请求构建器
 * 预设了日历应用的系统提示词
 * @returns {RequestBuilder} 请求构建器实例
 */
function createCalendarRequestBuilder () {
  const builder = new RequestBuilder();

  // 设置日历应用的系统提示词
  builder.setSystemPrompt(
    `你是一个智能日历助手，帮助用户记录和管理日程。
你的职责：
1. 倾听用户的日常记录
2. 提供情感支持和鼓励
3. 提取关键信息（时间、地点、事件）
4. 给出适当的建议
请用温暖、友好的语气回复。`
  );

  // 使用日历应用优化的模型配置
  builder.modelConfig.useCalendarConfig();

  return builder;
}

// 导出
export default RequestBuilder;
export { MessageRole, createCalendarRequestBuilder };
