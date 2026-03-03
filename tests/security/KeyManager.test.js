import KeyManager from '../../src/services/security/KeyManager.js';
import envConfig from '../../src/config/env.js';
import apiKeyManager from '../../src/config/apiKeyManager.js';

// Mock dependencies
jest.mock('../../src/config/env.js', () => ({
  config: {}
}));

jest.mock('../../src/config/apiKeyManager.js', () => ({
  getApiKey: jest.fn(),
  saveApiKey: jest.fn()
}));

describe('KeyManager Security Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    envConfig.config = {};
    // Reset KeyManager environment to Dev by default
    KeyManager.env = { PROD: false, DEV: true };
  });

  describe('Environment Priority', () => {
    const TEST_KEY_NAME = 'OPENROUTER_API_KEY';
    const ENV_VALUE = 'sk-or-v1-env-value-12345678901234567890';
    const STORAGE_VALUE = 'sk-or-v1-storage-value-12345678901234567890';

    test('Dev: Should prefer User Storage over Env', () => {
      KeyManager.env = { PROD: false, DEV: true };

      envConfig.config[TEST_KEY_NAME] = ENV_VALUE;
      apiKeyManager.getApiKey.mockReturnValue(STORAGE_VALUE);

      const key = KeyManager.getKey(TEST_KEY_NAME);
      expect(key).toBe(STORAGE_VALUE);
      expect(apiKeyManager.getApiKey).toHaveBeenCalledWith('openrouter');
    });

    test('Prod: Should prefer Env over User Storage', () => {
      KeyManager.env = { PROD: true, DEV: false };

      envConfig.config[TEST_KEY_NAME] = ENV_VALUE;
      apiKeyManager.getApiKey.mockReturnValue(STORAGE_VALUE);

      const key = KeyManager.getKey(TEST_KEY_NAME);
      expect(key).toBe(ENV_VALUE);
    });

    test('Fallback: Should use Storage if Env missing in Prod', () => {
      KeyManager.env = { PROD: true, DEV: false };

      envConfig.config[TEST_KEY_NAME] = undefined;
      apiKeyManager.getApiKey.mockReturnValue(STORAGE_VALUE);

      const key = KeyManager.getKey(TEST_KEY_NAME);
      expect(key).toBe(STORAGE_VALUE);
    });
  });

  describe('Validation', () => {
    const TEST_KEY_NAME = 'OPENROUTER_API_KEY';

    test('Should return null for invalid format in strict mode', () => {
      KeyManager.env = { PROD: true, DEV: false };
      envConfig.config[TEST_KEY_NAME] = 'invalid-short-key'; // Invalid format

      const key = KeyManager.getKey(TEST_KEY_NAME);
      expect(key).toBeNull();
    });

    test('Should return key for valid format', () => {
      KeyManager.env = { PROD: true, DEV: false };
      const validKey = 'sk-or-v1-valid-long-key-12345678901234567890';
      envConfig.config[TEST_KEY_NAME] = validKey;

      const key = KeyManager.getKey(TEST_KEY_NAME);
      expect(key).toBe(validKey);
    });
  });

  describe('Audit Log', () => {
    test('Should record access attempts', () => {
      const keyName = 'ZHIPU_API_KEY';
      KeyManager.getKey(keyName);

      const logs = KeyManager.getAuditLog();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].key).toBe(keyName);
      expect(logs[0].success).toBeDefined();
    });
  });
});
