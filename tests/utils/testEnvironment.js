/**
 * 测试环境模拟工具
 * 模拟浏览器的localStorage和indexedDB等API
 */

class MockLocalStorage {
  constructor () {
    this.store = new Map();
  }

  setItem (key, value) {
    this.store.set(key, String(value));
  }

  getItem (key) {
    return this.store.get(key) || null;
  }

  removeItem (key) {
    this.store.delete(key);
  }

  clear () {
    this.store.clear();
  }

  key (index) {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

  get length () {
    return this.store.size;
  }
}

class MockIndexedDBRequest {
  constructor () {
    this.onsuccess = null;
    this.onerror = null;
    this.onupgradeneeded = null;
    this.result = null;
    this.error = null;
    this.transaction = null;
  }

  triggerSuccess (result) {
    this.result = result;
    if (this.onsuccess) {
      this.onsuccess({ target: this });
    }
  }

  triggerError (error) {
    this.error = error;
    if (this.onerror) {
      this.onerror({ target: this });
    }
  }

  triggerUpgrade (event) {
    if (this.onupgradeneeded) {
      this.onupgradeneeded(event);
    }
  }
}

class MockBlob {
  constructor (data, options = {}) {
    this.parts = data;
    this.type = options.type || '';
    this._data = data.join('');
    this.size = this._data.length;
  }
}

class MockURL {
  static createObjectURL (blob) {
    return 'blob:' + Math.random().toString(36).substr(2, 9);
  }

  static revokeObjectURL (url) {

  }
}

class MockFileReader {
  constructor () {
    this.onload = null;
    this.onerror = null;
    this.result = null;
    this.readyState = 0;
  }

  readAsText (file) {
    this.readyState = 1;
    setTimeout(() => {
      this.result = file.mockContent || (file instanceof Blob ? file._data : '');
      this.readyState = 2;
      if (this.onload) {
        this.onload({ target: this });
      }
    }, 0);
  }
}

/**
 * 设置测试环境
 */
function setupTestEnvironment () {
  global.localStorage = new MockLocalStorage();

  const mockDB = {
    objectStoreNames: new Set(),
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue({
        createIndex: jest.fn(),
        add: jest.fn().mockImplementation(function (data) {
          const req = new MockIndexedDBRequest();
          setTimeout(() => req.triggerSuccess(data.id || Date.now()), 0);
          return req;
        }),
        put: jest.fn().mockImplementation(function (data) {
          const req = new MockIndexedDBRequest();
          setTimeout(() => req.triggerSuccess(true), 0);
          return req;
        }),
        get: jest.fn().mockImplementation(function (key) {
          const req = new MockIndexedDBRequest();
          setTimeout(() => req.triggerSuccess(null), 0);
          return req;
        }),
        delete: jest.fn().mockImplementation(function (key) {
          const req = new MockIndexedDBRequest();
          setTimeout(() => req.triggerSuccess(true), 0);
          return req;
        }),
        clear: jest.fn().mockImplementation(function () {
          const req = new MockIndexedDBRequest();
          setTimeout(() => req.triggerSuccess(true), 0);
          return req;
        }),
        index: jest.fn().mockReturnValue({
          openCursor: jest.fn().mockReturnValue({
            onsuccess: null,
            result: null
          }),
          count: jest.fn().mockReturnValue({
            onsuccess: null,
            result: 0
          })
        })
      }),
      oncomplete: null,
      onerror: null
    })
  };

  global.indexedDB = {
    open: jest.fn().mockImplementation((name, version) => {
      const request = new MockIndexedDBRequest();

      request.onupgradeneeded = jest.fn().mockImplementation((event) => {
        const db = event.target.result;
        db.createObjectStore = jest.fn((storeName, options) => {
          db.objectStoreNames.add(storeName);
          return {
            createIndex: jest.fn()
          };
        });
      });

      setTimeout(() => {
        request.triggerSuccess(mockDB);
      }, 0);

      return request;
    })
  };

  global.Blob = MockBlob;
  global.URL = MockURL;
  global.FileReader = MockFileReader;
  global.IDBKeyRange = {
    bound: jest.fn((lower, upper) => ({ lower, upper }))
  };

  global.crypto = {
    subtle: {
      importKey: jest.fn().mockImplementation((format, keyData, algorithm, extractable, keyUsages) => {
        return Promise.resolve({ type: 'secret' });
      }),
      deriveKey: jest.fn().mockImplementation((algorithm, baseKey, derivedKeyType, extractable, keyUsages) => {
        return Promise.resolve({ type: 'secret' });
      }),
      encrypt: jest.fn().mockImplementation((algorithm, key, data) => {
        return Promise.resolve(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
      }),
      decrypt: jest.fn().mockImplementation((algorithm, key, data) => {
        const encoder = new TextEncoder();
        return Promise.resolve(encoder.encode('{"test":"data"}'));
      })
    },
    getRandomValues: jest.fn().mockImplementation(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  };

  global.TextEncoder = class TextEncoder {
    encode (str) {
      return new Uint8Array(Buffer.from(str, 'utf8'));
    }
  };

  global.TextDecoder = class TextDecoder {
    decode (arr) {
      return Buffer.from(arr).toString('utf8');
    }
  };
}

/**
 * 清理测试环境
 */
function cleanupTestEnvironment () {
  if (global.localStorage) {
    global.localStorage.clear();
  }
  jest.clearAllMocks();
}

module.exports = {
  MockLocalStorage,
  MockIndexedDBRequest,
  MockBlob,
  MockURL,
  MockFileReader,
  setupTestEnvironment,
  cleanupTestEnvironment
};
