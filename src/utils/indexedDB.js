/**
 * IndexedDB 工具类
 * 用于存储大文件（如背景图片），避免 LocalStorage 容量限制
 */

const DB_NAME = 'SmartCalendarDB';
const DB_VERSION = 1;
const STORE_NAME = 'backgrounds';

class BackgroundDB {
  constructor () {
    this.db = null;
    this.initPromise = this.init();
  }

  init () {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async ensureInit () {
    if (!this.db) {
      await this.initPromise;
    }
  }

  /**
   * 保存背景图片 Blob
   * @param {string} key - 键名 (e.g., 'current_bg')
   * @param {Blob} blob - 图片数据
   */
  async saveBackground (key, blob) {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, key);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * 获取背景图片 Blob
   * @param {string} key
   * @returns {Promise<Blob|null>}
   */
  async getBackground (key) {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  /**
   * 删除背景
   * @param {string} key
   */
  async deleteBackground (key) {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }
}

export default new BackgroundDB();
