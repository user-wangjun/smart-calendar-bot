/**
 * 对话存储服务
 * 提供对话内容的持久化存储、检索和管理功能
 */

import storageManager from '../storage/storageManager.js';

class ConversationService {
  constructor () {
    this.storageKey = 'conversations';
    this.messageStoreName = 'messages';
    this.maxMessages = 10000; // 最大消息数
    this.pageSize = 50; // 每页消息数
    this.currentConversationId = null;
  }

  /**
   * 创建新对话
   * @returns {Promise<Object>} - 创建结果
   */
  async createConversation (title = '新对话') {
    const conversationId = this.generateUUID();
    const conversation = {
      id: conversationId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0
    };

    try {
      await storageManager.store(`conversation_${conversationId}`, conversation, { storageType: 'indexedDB' });
      console.log('对话已创建:', conversationId);

      return {
        success: true,
        conversation
      };
    } catch (error) {
      console.error('创建对话失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 添加消息到对话
   * @param {string} conversationId - 对话ID
   * @param {string} role - 角色（user/assistant）
   * @param {string} content - 消息内容
   * @param {Object} options - 选项
   * @returns {Promise<Object>} - 添加结果
   */
  async addMessage (conversationId, role, content, options = {}) {
    const messageId = this.generateUUID();
    const message = {
      id: messageId,
      conversationId,
      role,
      content,
      timestamp: new Date().toISOString(),
      model: options.model || 'unknown',
      metadata: options.metadata || {}
    };

    try {
      await storageManager.store(`message_${messageId}`, message, { storageType: 'indexedDB' });

      // 更新对话的消息计数
      await this.updateConversationMessageCount(conversationId, 1);

      console.log('消息已添加:', messageId);

      return {
        success: true,
        message
      };
    } catch (error) {
      console.error('添加消息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取对话消息
   * @param {string} conversationId - 对话ID
   * @param {Object} options - 选项
   * @returns {Promise<Array>} - 消息列表
   */
  async getMessages (conversationId, options = {}) {
    try {
      const page = options.page || 1;
      const limit = options.limit || this.pageSize;
      const offset = (page - 1) * limit;

      // 从IndexedDB获取消息
      const messages = await this.getMessagesFromDB(conversationId, limit, offset);

      return {
        success: true,
        messages,
        page,
        hasMore: messages.length === limit,
        total: await this.getMessageCount(conversationId)
      };
    } catch (error) {
      console.error('获取消息失败:', error);
      return {
        success: false,
        messages: [],
        error: error.message
      };
    }
  }

  /**
   * 从数据库获取消息
   * @param {string} conversationId - 对话ID
   * @param {number} limit - 限制数量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} - 消息列表
   */
  async getMessagesFromDB (conversationId, limit, offset) {
    if (!storageManager.isIndexedDBReady()) {
      console.warn('IndexedDB未初始化');
      return [];
    }

    try {
      return await storageManager.queryByIndex(
        this.messageStoreName,
        'conversationId',
        conversationId,
        { limit, offset, reverse: true }
      );
    } catch (error) {
      console.error('获取消息失败:', error);
      return [];
    }
  }

  /**
   * 获取消息总数
   * @param {string} conversationId - 对话ID
   * @returns {Promise<number>} - 消息总数
   */
  async getMessageCount (conversationId) {
    if (!storageManager.isIndexedDBReady()) {
      return 0;
    }

    try {
      return await storageManager.countByIndex(
        this.messageStoreName,
        'conversationId',
        conversationId
      );
    } catch (error) {
      console.error('获取消息总数失败:', error);
      return 0;
    }
  }

  /**
   * 搜索消息
   * @param {string} conversationId - 对话ID
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} - 消息列表
   */
  async searchMessages (conversationId, keyword) {
    try {
      const allMessages = await this.getAllMessages(conversationId);

      if (!keyword) {
        return {
          success: true,
          messages: allMessages,
          count: allMessages.length
        };
      }

      const lowerKeyword = keyword.toLowerCase();
      const filtered = allMessages.filter(message =>
        message.content.toLowerCase().includes(lowerKeyword) ||
        (message.metadata && JSON.stringify(message.metadata).toLowerCase().includes(lowerKeyword))
      );

      return {
        success: true,
        messages: filtered,
        count: filtered.length
      };
    } catch (error) {
      console.error('搜索消息失败:', error);
      return {
        success: false,
        messages: [],
        error: error.message
      };
    }
  }

  /**
   * 获取所有消息
   * @param {string} conversationId - 对话ID
   * @returns {Promise<Array>} - 消息列表
   */
  async getAllMessages (conversationId) {
    if (!storageManager.isIndexedDBReady()) {
      console.warn('IndexedDB未初始化');
      return [];
    }

    try {
      return await storageManager.queryByIndex(
        this.messageStoreName,
        'conversationId',
        conversationId
      );
    } catch (error) {
      console.error('获取所有消息失败:', error);
      return [];
    }
  }

  /**
   * 删除消息
   * @param {string} messageId - 消息ID
   * @returns {Promise<boolean>} - 删除是否成功
   */
  async deleteMessage (messageId) {
    try {
      await storageManager.remove(`message_${messageId}`);
      console.log('消息已删除:', messageId);
      return true;
    } catch (error) {
      console.error('删除消息失败:', error);
      return false;
    }
  }

  /**
   * 清空对话
   * @param {string} conversationId - 对话ID
   * @returns {Promise<boolean>} - 清空是否成功
   */
  async clearConversation (conversationId) {
    try {
      // 获取对话的所有消息
      const allMessages = await this.getAllMessages(conversationId);

      // 删除所有消息
      for (const message of allMessages) {
        await this.deleteMessage(message.id);
      }

      // 删除对话记录
      await storageManager.remove(`conversation_${conversationId}`);

      console.log('对话已清空:', conversationId);
      return true;
    } catch (error) {
      console.error('清空对话失败:', error);
      return false;
    }
  }

  /**
   * 更新对话消息计数
   * @param {string} conversationId - 对话ID
   * @param {number} delta - 变化量
   */
  async updateConversationMessageCount (conversationId, delta) {
    try {
      const conversation = await storageManager.retrieve(`conversation_${conversationId}`);

      if (conversation) {
        conversation.messageCount = (conversation.messageCount || 0) + delta;
        conversation.updatedAt = new Date().toISOString();

        await storageManager.store(`conversation_${conversationId}`, conversation, { storageType: 'indexedDB' });
      }
    } catch (error) {
      console.error('更新对话消息计数失败:', error);
    }
  }

  /**
   * 获取对话列表
   * @returns {Promise<Array>} - 对话列表
   */
  async getConversations () {
    try {
      const conversations = [];

      // 从IndexedDB获取所有对话
      if (storageManager.isIndexedDBReady()) {
        const keys = await storageManager.getAllKeys(this.storageKey);

        // 并行获取所有对话数据
        const conversationPromises = keys.map(key => storageManager.retrieve(key));
        const results = await Promise.all(conversationPromises);

        // 过滤有效对话
        for (const conversation of results) {
          if (conversation) {
            conversations.push(conversation);
          }
        }

        // 按创建时间排序
        conversations.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      }

      return {
        success: true,
        conversations,
        count: conversations.length
      };
    } catch (error) {
      console.error('获取对话列表失败:', error);
      return {
        success: false,
        conversations: [],
        error: error.message
      };
    }
  }

  /**
   * 删除对话
   * @param {string} conversationId - 对话ID
   * @returns {Promise<boolean>} - 删除是否成功
   */
  async deleteConversation (conversationId) {
    try {
      // 删除对话的所有消息
      await this.clearConversation(conversationId);

      // 删除对话记录
      await storageManager.remove(`conversation_${conversationId}`);

      console.log('对话已删除:', conversationId);
      return true;
    } catch (error) {
      console.error('删除对话失败:', error);
      return false;
    }
  }

  /**
   * 获取对话统计
   * @returns {Promise<Object>} - 统计信息
   */
  async getConversationStats () {
    try {
      const conversations = await this.getConversations();

      let totalMessages = 0;
      const totalConversations = conversations.conversations.length;

      // 计算总消息数
      for (const conv of conversations.conversations) {
        totalMessages += conv.messageCount || 0;
      }

      return {
        success: true,
        totalConversations,
        totalMessages,
        averageMessagesPerConversation: totalConversations > 0
          ? (totalMessages / totalConversations).toFixed(1)
          : 0
      };
    } catch (error) {
      console.error('获取对话统计失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 清空所有对话
   * @returns {Promise<boolean>} - 清空是否成功
   */
  async clearAllConversations () {
    try {
      // 获取所有对话
      const conversations = await this.getConversations();

      // 删除所有对话
      for (const conv of conversations.conversations) {
        await this.deleteConversation(conv.id);
      }

      console.log('所有对话已清空');
      return true;
    } catch (error) {
      console.error('清空所有对话失败:', error);
      return false;
    }
  }

  /**
   * 生成UUID
   * @returns {string} - UUID字符串
   */
  generateUUID () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 导出对话数据
   * @param {string} conversationId - 对话ID（可选）
   * @returns {Promise<Object>} - 导出结果
   */
  async exportConversation (conversationId = null) {
    try {
      let conversations;

      if (conversationId) {
        // 导出指定对话
        const conversation = await storageManager.retrieve(`conversation_${conversationId}`);
        const messages = await this.getAllMessages(conversationId);

        conversations = [{
          ...conversation,
          messages
        }];
      } else {
        // 导出所有对话
        const allConversations = await this.getConversations();
        conversations = allConversations.conversations;
      }

      // 转换为JSON字符串
      const jsonString = JSON.stringify(conversations, null, 2);

      // 创建Blob并下载
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `conversation_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      // 清理URL
      URL.revokeObjectURL(url);

      console.log('对话数据已导出');

      return {
        success: true,
        count: conversations.length
      };
    } catch (error) {
      console.error('导出对话失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 导入对话数据
   * @param {File} file - 导入的文件
   * @returns {Promise<Object>} - 导入结果
   */
  async importConversation (file) {
    try {
      const jsonString = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          resolve(e.target.result);
        };

        reader.onerror = () => {
          reject(new Error('文件读取失败'));
        };

        reader.readAsText(file);
      });

      const data = JSON.parse(jsonString);

      if (!Array.isArray(data)) {
        return {
          success: false,
          error: '文件格式不正确'
        };
      }

      let importCount = 0;
      let errorCount = 0;

      // 导入对话
      for (const conv of data) {
        const result = await this.createConversation(conv.title || '导入的对话');

        if (result.success) {
          // 导入消息
          if (conv.messages && Array.isArray(conv.messages)) {
            for (const msg of conv.messages) {
              const msgResult = await this.addMessage(
                result.conversation.id,
                msg.role,
                msg.content,
                { model: msg.model, metadata: msg.metadata }
              );

              if (msgResult.success) {
                importCount++;
              } else {
                errorCount++;
              }
            }
          }
        }
      }

      console.log(`对话导入完成: 成功${importCount}条，失败${errorCount}条`);

      return {
        success: true,
        imported: importCount,
        failed: errorCount,
        total: data.length
      };
    } catch (error) {
      console.error('导入对话失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 创建全局单例
const conversationService = new ConversationService();

export default conversationService;
