/**
 * 背景存储服务
 * 提供背景图片的存储、管理和展示功能
 */

import storageManager from '../storage/storageManager.js';

class BackgroundStorage {
  constructor () {
    this.storageKey = 'backgrounds';
    this.maxBackgrounds = 20; // 最大背景数量
    this.defaultBackgrounds = [
      {
        id: 'default_1',
        url: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        type: 'default',
        addedAt: new Date('2024-01-01').toISOString(),
        isDefault: true,
        metadata: {
          name: '默认背景1',
          description: '蓝紫渐变'
        }
      },
      {
        id: 'default_2',
        url: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        type: 'default',
        addedAt: new Date('2024-01-01').toISOString(),
        isDefault: false,
        metadata: {
          name: '默认背景2',
          description: '粉蓝渐变'
        }
      },
      {
        id: 'default_3',
        url: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        type: 'default',
        addedAt: new Date('2024-01-01').toISOString(),
        isDefault: false,
        metadata: {
          name: '默认背景3',
          description: '绿蓝渐变'
        }
      },
      {
        id: 'default_4',
        url: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        type: 'default',
        addedAt: new Date('2024-01-01').toISOString(),
        isDefault: false,
        metadata: {
          name: '默认背景4',
          description: '橙红渐变'
        }
      },
      {
        id: 'default_5',
        url: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        type: 'default',
        addedAt: new Date('2024-01-01').toISOString(),
        isDefault: false,
        metadata: {
          name: '默认背景5',
          description: '青绿渐变'
        }
      }
    ];

    this.currentBackground = null;
    this.init();
  }

  /**
   * 初始化背景存储
   */
  async init () {
    console.log('初始化背景存储...');

    // 加载保存的背景
    await this.loadBackgrounds();

    // 设置当前背景
    await this.loadCurrentBackground();
  }

  /**
   * 添加背景
   * @param {string} url - 背景URL
   * @param {string} type - 类型（default/ai-generated/custom）
   * @param {Object} metadata - 元数据
   * @returns {Promise<Object>} - 添加结果
   */
  async addBackground (url, type = 'custom', metadata = {}) {
    try {
      // 验证URL
      if (!url || typeof url !== 'string') {
        return {
          success: false,
          error: '背景URL无效'
        };
      }

      // 检查是否已存在
      const existing = await this.getBackgroundByUrl(url);
      if (existing) {
        return {
          success: false,
          error: '背景已存在'
        };
      }

      // 检查背景数量限制
      const backgrounds = await this.getAllBackgrounds();
      if (backgrounds.length >= this.maxBackgrounds) {
        // 删除最旧的背景
        await this.deleteOldestBackground();
      }

      // 创建新背景
      const background = {
        id: this.generateUUID(),
        url,
        type,
        addedAt: new Date().toISOString(),
        isDefault: false,
        metadata: {
          ...metadata,
          size: await this.getImageSize(url)
        }
      };

      // 保存到IndexedDB
      await storageManager.store(`background_${background.id}`, background, { storageType: 'indexedDB' });

      // 设置为当前背景
      await this.setCurrentBackground(background.id);

      console.log('背景已添加:', background.id);

      return {
        success: true,
        background
      };
    } catch (error) {
      console.error('添加背景失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 删除背景
   * @param {string} backgroundId - 背景ID
   * @returns {Promise<boolean>} - 删除是否成功
   */
  async deleteBackground (backgroundId) {
    try {
      // 检查是否为默认背景
      const background = await this.getBackgroundById(backgroundId);
      if (!background) {
        return {
          success: false,
          error: '背景不存在'
        };
      }

      if (background.isDefault) {
        return {
          success: false,
          error: '不能删除默认背景'
        };
      }

      // 从IndexedDB删除
      await storageManager.remove(`background_${backgroundId}`);

      // 如果删除的是当前背景，重置为默认
      if (this.currentBackground?.id === backgroundId) {
        const defaultBackground = this.defaultBackgrounds[0];
        await this.setCurrentBackground(defaultBackground.id);
      }

      console.log('背景已删除:', backgroundId);

      return {
        success: true
      };
    } catch (error) {
      console.error('删除背景失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 设置默认背景
   * @param {string} backgroundId - 背景ID
   * @returns {Promise<boolean>} - 设置是否成功
   */
  async setDefaultBackground (backgroundId) {
    try {
      // 获取所有背景
      const backgrounds = await this.getAllBackgrounds();

      // 重置所有背景的默认状态
      for (const bg of backgrounds) {
        bg.isDefault = (bg.id === backgroundId);
        await storageManager.store(`background_${bg.id}`, bg, { storageType: 'indexedDB' });
      }

      // 设置为当前背景
      await this.setCurrentBackground(backgroundId);

      console.log('默认背景已设置:', backgroundId);

      return {
        success: true
      };
    } catch (error) {
      console.error('设置默认背景失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取所有背景
   * @returns {Promise<Array>} - 背景列表
   */
  async getAllBackgrounds () {
    try {
      // 从IndexedDB获取所有背景
      const backgrounds = await this.getBackgroundsFromDB();

      // 添加默认背景（如果不存在）
      const allBackgrounds = [...backgrounds];
      const existingIds = new Set(backgrounds.map(bg => bg.id));

      for (const defaultBg of this.defaultBackgrounds) {
        if (!existingIds.has(defaultBg.id)) {
          allBackgrounds.push(defaultBg);
        }
      }

      // 按添加时间排序（最新的在前）
      allBackgrounds.sort((a, b) =>
        new Date(b.addedAt) - new Date(a.addedAt)
      );

      return allBackgrounds;
    } catch (error) {
      console.error('获取背景列表失败:', error);
      return [];
    }
  }

  /**
   * 从数据库获取背景
   * @returns {Promise<Array>} - 背景列表
   */
  async getBackgroundsFromDB () {
    if (!storageManager.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = storageManager.db.transaction([this.storageKey], 'readonly');
      const store = transaction.objectStore(this.storageKey);
      const request = store.getAll();

      request.onsuccess = () => {
        const backgrounds = request.result || [];
        resolve(backgrounds);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * 获取最近使用的背景
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} - 背景列表
   */
  async getRecentBackgrounds (limit = 5) {
    const allBackgrounds = await this.getAllBackgrounds();

    // 返回最近的N个背景
    return allBackgrounds.slice(0, limit);
  }

  /**
   * 根据ID获取背景
   * @param {string} backgroundId - 背景ID
   * @returns {Promise<Object|null>} - 背景对象
   */
  async getBackgroundById (backgroundId) {
    try {
      const backgrounds = await this.getAllBackgrounds();
      return backgrounds.find(bg => bg.id === backgroundId) || null;
    } catch (error) {
      console.error('获取背景失败:', error);
      return null;
    }
  }

  /**
   * 根据URL获取背景
   * @param {string} url - 背景URL
   * @returns {Promise<Object|null>} - 背景对象
   */
  async getBackgroundByUrl (url) {
    try {
      const backgrounds = await this.getAllBackgrounds();
      return backgrounds.find(bg => bg.url === url) || null;
    } catch (error) {
      console.error('获取背景失败:', error);
      return null;
    }
  }

  /**
   * 设置当前背景
   * @param {string} backgroundId - 背景ID
   * @returns {Promise<boolean>} - 设置是否成功
   */
  async setCurrentBackground (backgroundId) {
    try {
      const background = await this.getBackgroundById(backgroundId);

      if (!background) {
        console.warn('背景不存在:', backgroundId);
        return false;
      }

      this.currentBackground = background;

      // 保存到localStorage
      localStorage.setItem('current_background_id', backgroundId);
      localStorage.setItem('current_background_url', background.url);

      // 应用背景到页面
      this.applyBackgroundToPage(background.url);

      // 触发背景更新事件
      storageManager.emit('background:updated', {
        backgroundId,
        background
      });

      console.log('当前背景已设置:', backgroundId);

      return true;
    } catch (error) {
      console.error('设置当前背景失败:', error);
      return false;
    }
  }

  /**
   * 加载保存的背景
   */
  async loadBackgrounds () {
    try {
      const backgrounds = await this.getBackgroundsFromDB();
      console.log(`已加载${backgrounds.length}个背景`);
    } catch (error) {
      console.error('加载背景失败:', error);
    }
  }

  /**
   * 加载当前背景
   */
  async loadCurrentBackground () {
    try {
      const backgroundId = localStorage.getItem('current_background_id');

      if (backgroundId) {
        const background = await this.getBackgroundById(backgroundId);
        if (background) {
          this.currentBackground = background;
          this.applyBackgroundToPage(background.url);
        }
      }
    } catch (error) {
      console.error('加载当前背景失败:', error);
    }
  }

  /**
   * 应用背景到页面
   * @param {string} url - 背景URL
   */
  applyBackgroundToPage (url) {
    if (url.startsWith('linear-gradient')) {
      // 渐变背景
      document.body.style.background = url;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      // 图片背景
      document.body.style.backgroundImage = `url(${url})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    }
  }

  /**
   * 删除最旧的背景
   */
  async deleteOldestBackground () {
    const backgrounds = await this.getBackgroundsFromDB();

    // 排除默认背景
    const customBackgrounds = backgrounds.filter(bg => !bg.isDefault);

    if (customBackgrounds.length <= this.maxBackgrounds) {
      return;
    }

    // 按添加时间排序，删除最旧的
    customBackgrounds.sort((a, b) =>
      new Date(a.addedAt) - new Date(b.addedAt)
    );

    // 删除超出限制的背景
    const toDelete = customBackgrounds.slice(this.maxBackgrounds);
    for (const bg of toDelete) {
      await this.deleteBackground(bg.id);
    }
  }

  /**
   * 获取图片大小
   * @param {string} url - 图片URL
   * @returns {Promise<number>} - 图片大小（字节）
   */
  async getImageSize (url) {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        // 估算图片大小（宽×高×3字节）
        const size = img.width * img.height * 3;
        resolve(size);
      };

      img.onerror = () => {
        // 默认估算为100KB
        resolve(100 * 1024);
      };

      img.src = url;
    });
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
   * 获取背景统计
   * @returns {Promise<Object>} - 统计信息
   */
  async getBackgroundStats () {
    const backgrounds = await this.getAllBackgrounds();

    const stats = {
      total: backgrounds.length,
      default: backgrounds.filter(bg => bg.isDefault).length,
      custom: backgrounds.filter(bg => !bg.isDefault).length,
      aiGenerated: backgrounds.filter(bg => bg.type === 'ai-generated').length,
      uploaded: backgrounds.filter(bg => bg.type === 'custom').length,
      current: this.currentBackground?.id || null,
      totalSize: await this.calculateTotalSize(backgrounds)
    };

    return stats;
  }

  /**
   * 计算总大小
   * @param {Array} backgrounds - 背景列表
   * @returns {Promise<number>} - 总大小（字节）
   */
  async calculateTotalSize (backgrounds) {
    let totalSize = 0;

    for (const bg of backgrounds) {
      if (bg.metadata && bg.metadata.size) {
        totalSize += bg.metadata.size;
      } else {
        // 默认估算渐变为1KB
        totalSize += 1024;
      }
    }

    return totalSize;
  }

  /**
   * 清空所有背景
   * @returns {Promise<boolean>} - 清空是否成功
   */
  async clearAllBackgrounds () {
    try {
      // 清除IndexedDB
      await storageManager.clear(this.storageKey);

      // 清除localStorage
      localStorage.removeItem('current_background_id');
      localStorage.removeItem('current_background_url');

      // 重置为默认背景
      const defaultBackground = this.defaultBackgrounds[0];
      await this.setCurrentBackground(defaultBackground.id);

      console.log('所有背景已清空');

      return true;
    } catch (error) {
      console.error('清空背景失败:', error);
      return false;
    }
  }
}

// 创建全局单例
const backgroundStorage = new BackgroundStorage();

export default backgroundStorage;
