/**
 * 聊天记录存储模块
 * 负责将生成内容整合到聊天记录中并持久化存储
 * 支持浏览器环境（IndexedDB）和Node.js环境（JSON文件）
 */

/**
 * 消息角色枚举
 */
const MessageRole = {
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant'
};

/**
 * JSON文件存储类
 * 使用JSON文件存储聊天记录（Node.js环境）
 */
class JSONFileChatStorage {
  constructor (dbPath = null) {
    // 检查是否在浏览器环境中
    this.isBrowser = typeof window !== 'undefined';

    if (!this.isBrowser) {
      // Node.js环境：设置文件路径
      const path = require('path');
      const fs = require('fs');
      this.dbPath = dbPath || path.join(process.cwd(), 'data', 'chat.json');

      // 确保数据目录存在
      const dataDir = require('path').dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 初始化存储
      this.initDatabase();
    }
  }

  /**
   * 初始化存储
   * 创建必要的文件结构
   */
  initDatabase () {
    if (this.isBrowser) return;

    const fs = require('fs');

    // 如果文件不存在，创建空数组
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify([]));
    }

    console.log(`聊天记录存储已初始化: ${this.dbPath}`);
  }

  /**
   * 保存消息
   * @param {string} role - 消息角色
   * @param {string} content - 消息内容
   * @param {Object} metadata - 元数据
   * @returns {number} 消息ID
   */
  saveMessage (role, content, metadata = null) {
    if (this.isBrowser) {
      console.warn('JSON文件存储只能在Node.js环境中使用');
      return -1;
    }

    const fs = require('fs');
    const messages = this.loadAllMessages();

    const message = {
      id: messages.length + 1,
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    };

    messages.push(message);

    // 保存到文件
    fs.writeFileSync(
      this.dbPath,
      JSON.stringify(messages, null, 2)
    );

    return message.id;
  }

  /**
   * 加载所有消息
   * @returns {Array} 消息数组
   */
  loadAllMessages () {
    if (this.isBrowser) {
      return [];
    }

    try {
      const fs = require('fs');
      const content = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('加载消息失败:', error.message);
      return [];
    }
  }

  /**
   * 加载最近的消息
   * @param {number} limit - 消息数量限制
   * @returns {Array} 消息数组
   */
  loadRecentMessages (limit = 20) {
    const messages = this.loadAllMessages();

    // 返回最近的N条消息
    return messages.slice(-limit);
  }

  /**
   * 按日期加载消息
   * @param {string} date - 日期（YYYY-MM-DD格式）
   * @returns {Array} 消息数组
   */
  loadMessagesByDate (date) {
    const messages = this.loadAllMessages();

    return messages.filter(msg => {
      const msgDate = msg.timestamp.split('T')[0];
      return msgDate === date;
    });
  }

  /**
   * 搜索消息
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的消息数组
   */
  searchMessages (keyword) {
    const messages = this.loadAllMessages();

    return messages.filter(msg =>
      msg.content.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 删除消息
   * @param {number} messageId - 消息ID
   * @returns {boolean} 是否删除成功
   */
  deleteMessage (messageId) {
    if (this.isBrowser) {
      return false;
    }

    const fs = require('fs');
    const messages = this.loadAllMessages();
    const index = messages.findIndex(msg => msg.id === messageId);

    if (index === -1) {
      return false;
    }

    messages.splice(index, 1);

    // 保存到文件
    fs.writeFileSync(
      this.dbPath,
      JSON.stringify(messages, null, 2)
    );

    return true;
  }

  /**
   * 清空所有消息
   */
  clearAllMessages () {
    if (this.isBrowser) {
      return;
    }

    const fs = require('fs');
    fs.writeFileSync(this.dbPath, JSON.stringify([]));
    console.log('所有消息已清空');
  }

  /**
   * 获取统计信息
   * @returns {Object} 统计数据
   */
  getStatistics () {
    const messages = this.loadAllMessages();

    const stats = {
      totalMessages: messages.length,
      userMessages: 0,
      assistantMessages: 0,
      systemMessages: 0,
      dateRange: null
    };

    for (const msg of messages) {
      if (msg.role === MessageRole.USER) {
        stats.userMessages++;
      } else if (msg.role === MessageRole.ASSISTANT) {
        stats.assistantMessages++;
      } else if (msg.role === MessageRole.SYSTEM) {
        stats.systemMessages++;
      }
    }

    // 计算日期范围
    if (messages.length > 0) {
      const dates = messages.map(msg => msg.timestamp.split('T')[0]);
      stats.dateRange = {
        start: dates[0],
        end: dates[dates.length - 1]
      };
    }

    return stats;
  }

  /**
   * 导出消息
   * @param {string} filePath - 导出文件路径
   * @returns {boolean} 是否导出成功
   */
  exportMessages (filePath) {
    if (this.isBrowser) {
      return false;
    }

    try {
      const fs = require('fs');
      const messages = this.loadAllMessages();
      fs.writeFileSync(
        filePath,
        JSON.stringify(messages, null, 2)
      );
      return true;
    } catch (error) {
      console.error('导出消息失败:', error.message);
      return false;
    }
  }

  /**
   * 导入消息
   * @param {string} filePath - 导入文件路径
   * @returns {boolean} 是否导入成功
   */
  importMessages (filePath) {
    if (this.isBrowser) {
      return false;
    }

    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf-8');
      const importedMessages = JSON.parse(content);

      const existingMessages = this.loadAllMessages();

      // 合并消息
      const allMessages = [...existingMessages, ...importedMessages];

      // 重新编号
      allMessages.forEach((msg, index) => {
        msg.id = index + 1;
      });

      // 保存到文件
      fs.writeFileSync(
        this.dbPath,
        JSON.stringify(allMessages, null, 2)
      );

      console.log(`成功导入 ${importedMessages.length} 条消息`);
      return true;
    } catch (error) {
      console.error('导入消息失败:', error.message);
      return false;
    }
  }

  /**
   * 关闭存储
   */
  close () {
    // JSON文件存储不需要关闭操作
    console.log('聊天记录存储已关闭');
  }
}

/**
 * IndexedDB存储类
 * 用于浏览器环境的聊天记录存储
 */
class IndexedDBChatStorage {
  constructor (dbName = 'CalendarChatDB', storeName = 'messages') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
    this.isBrowser = typeof window !== 'undefined' &&
                      typeof indexedDB !== 'undefined';
  }

  /**
   * 初始化数据库
   * @returns {Promise<void>}
   */
  async init () {
    if (!this.isBrowser) {
      console.warn('IndexedDB不可用，使用内存存储');
      this.db = null;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, 1);

        request.onerror = () => {
          console.warn('IndexedDB打开失败，使用内存存储:', request.error);
          this.db = null;
          resolve();
        };

        request.onsuccess = () => {
          this.db = request.result;
          console.log('IndexedDB已初始化');
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;

          // 创建对象存储
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, {
              keyPath: 'id',
              autoIncrement: true
            });

            // 创建索引
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('role', 'role', { unique: false });
          }
        };
      } catch (error) {
        console.warn('IndexedDB初始化失败，使用内存存储:', error);
        this.db = null;
        resolve();
      }
    });
  }

  /**
   * 保存消息
   * @param {string} role - 消息角色
   * @param {string} content - 消息内容
   * @param {Object} metadata - 元数据
   * @returns {Promise<number>} 消息ID
   */
  async saveMessage (role, content, metadata = null) {
    // 如果IndexedDB不可用，返回模拟ID
    if (!this.db) {
      console.warn('IndexedDB不可用，消息未持久化');
      return Date.now();
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const message = {
          role,
          content,
          timestamp: new Date().toISOString(),
          metadata: metadata || {}
        };

        const request = store.add(message);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        console.warn('保存消息失败:', error);
        resolve(Date.now());
      }
    });
  }

  /**
   * 加载最近的消息
   * @param {number} limit - 消息数量限制
   * @returns {Promise<Array>} 消息数组
   */
  async loadRecentMessages (limit = 20) {
    // 如果IndexedDB不可用，返回空数组
    if (!this.db) {
      console.warn('IndexedDB不可用，返回空消息列表');
      return [];
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('timestamp');
        const request = index.openCursor(null, 'prev');

        const messages = [];
        let count = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;

          if (cursor && count < limit) {
            messages.unshift(cursor.value);
            cursor.continue();
            count++;
          } else {
            resolve(messages);
          }
        };

        request.onerror = () => {
          console.warn('加载消息失败:', request.error);
          resolve([]);
        };
      } catch (error) {
        console.warn('加载消息失败:', error);
        resolve([]);
      }
    });
  }

  /**
   * 按日期加载消息
   * @param {string} date - 日期（YYYY-MM-DD格式）
   * @returns {Promise<Array>} 消息数组
   */
  async loadMessagesByDate (date) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor();

      const messages = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const msgDate = cursor.value.timestamp.split('T')[0];

          if (msgDate === date) {
            messages.push(cursor.value);
          }

          cursor.continue();
        } else {
          resolve(messages);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 搜索消息
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 匹配的消息数组
   */
  async searchMessages (keyword) {
    const allMessages = await this.loadRecentMessages(1000);

    return allMessages.filter(msg =>
      msg.content.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 删除消息
   * @param {number} messageId - 消息ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteMessage (messageId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(messageId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        if (request.error.name === 'NotFoundError') {
          resolve(false);
        } else {
          reject(request.error);
        }
      };
    });
  }

  /**
   * 清空所有消息
   * @returns {Promise<void>}
   */
  async clearAllMessages () {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('所有消息已清空');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 关闭数据库
   */
  close () {
    if (this.db) {
      this.db.close();
      console.log('IndexedDB已关闭');
    }
  }
}

/**
 * 聊天记录管理类
 * 提供统一的接口管理聊天记录
 */
class ChatStorage {
  constructor (options = {}) {
    // 根据环境选择存储方式
    this.isBrowser = typeof window !== 'undefined';

    if (this.isBrowser) {
      // 浏览器环境使用IndexedDB
      this.storage = new IndexedDBChatStorage(
        options.dbName,
        options.storeName
      );
    } else {
      // Node.js环境使用JSON文件
      this.storage = new JSONFileChatStorage(options.dbPath);
    }

    // 聊天历史缓存
    this.chatHistory = [];
  }

  /**
   * 初始化存储
   * @returns {Promise<void>}
   */
  async init () {
    if (this.isBrowser) {
      await this.storage.init();
    }
  }

  /**
   * 保存用户消息
   * @param {string} content - 消息内容
   * @returns {Promise<number>} 消息ID
   */
  async saveUserMessage (content) {
    const id = await this.storage.saveMessage(
      MessageRole.USER,
      content
    );

    // 添加到历史缓存
    this.chatHistory.push({
      role: MessageRole.USER,
      content,
      timestamp: new Date().toISOString()
    });

    return id;
  }

  /**
   * 保存助手消息
   * @param {string} content - 消息内容
   * @param {Object} metadata - 元数据
   * @returns {Promise<number>} 消息ID
   */
  async saveAssistantMessage (content, metadata = null) {
    const id = await this.storage.saveMessage(
      MessageRole.ASSISTANT,
      content,
      metadata
    );

    // 添加到历史缓存
    this.chatHistory.push({
      role: MessageRole.ASSISTANT,
      content,
      timestamp: new Date().toISOString(),
      metadata
    });

    return id;
  }

  /**
   * 保存对话
   * @param {string} userMessage - 用户消息
   * @param {string} assistantMessage - 助手消息
   * @param {Object} metadata - 元数据
   * @returns {Promise<Object>} 保存结果
   */
  async saveConversation (userMessage, assistantMessage, metadata = null) {
    const userId = await this.saveUserMessage(userMessage);
    const assistantId = await this.saveAssistantMessage(
      assistantMessage,
      metadata
    );

    return {
      userId,
      assistantId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 加载聊天历史
   * @param {number} limit - 消息数量限制
   * @returns {Promise<Array>} 聊天历史
   */
  async loadChatHistory (limit = 20) {
    // 如果缓存为空，从存储加载
    if (this.chatHistory.length === 0) {
      this.chatHistory = await this.storage.loadRecentMessages(limit);
    }

    return this.chatHistory.slice(-limit);
  }

  /**
   * 清空聊天历史
   */
  async clearChatHistory () {
    await this.storage.clearAllMessages();
    this.chatHistory = [];
  }

  /**
   * 获取统计信息
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics () {
    return this.storage.getStatistics();
  }

  /**
   * 搜索消息
   * @param {string} keyword - 搜索关键词
   * @returns {Promise<Array>} 匹配的消息数组
   */
  async searchMessages (keyword) {
    if (this.isBrowser) {
      return await this.storage.searchMessages(keyword);
    } else {
      return this.storage.searchMessages(keyword);
    }
  }

  /**
   * 关闭存储
   */
  close () {
    this.storage.close();
  }
}

// 导出
export default ChatStorage;
export { MessageRole, JSONFileChatStorage, IndexedDBChatStorage };
