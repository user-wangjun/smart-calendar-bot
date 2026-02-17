import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DataExporter,
  DataImporter,
  DataMigration,
  DATA_TYPES,
  getBackupStatus
} from '../dataTransferService';

/**
 * 数据导入导出服务测试套件
 * 测试导出、导入、迁移等核心功能
 */
describe('DataTransferService', () => {
  // 模拟localStorage
  const localStorageMock = {
    store: {},
    getItem (key) {
      return this.store[key] || null;
    },
    setItem (key, value) {
      this.store[key] = value;
    },
    removeItem (key) {
      delete this.store[key];
    },
    clear () {
      this.store = {};
    }
  };

  // 测试数据
  const mockEvents = [
    {
      id: 1,
      title: '测试会议',
      startDate: '2026-01-31T10:00:00',
      endDate: '2026-01-31T11:00:00',
      createdAt: '2026-01-30T08:00:00',
      updatedAt: '2026-01-30T08:00:00'
    },
    {
      id: 2,
      title: '项目截止',
      startDate: '2026-02-01T17:00:00',
      endDate: '2026-02-01T17:00:00',
      createdAt: '2026-01-25T10:00:00',
      updatedAt: '2026-01-28T15:00:00'
    }
  ];

  const mockChatMessages = [
    {
      id: 1,
      role: 'user',
      content: '你好',
      timestamp: '2026-01-31T09:00:00'
    },
    {
      id: 2,
      role: 'assistant',
      content: '您好！有什么可以帮助您的吗？',
      timestamp: '2026-01-31T09:00:05'
    }
  ];

  const mockSettings = {
    themeMode: 'light',
    language: 'zh-CN',
    apiKeys: {
      openai: 'sk-test123',
      openrouter: 'sk-test456'
    }
  };

  beforeEach(() => {
    // 重置localStorage模拟
    localStorageMock.clear();

    // 设置测试数据
    localStorageMock.setItem('calendar_events', JSON.stringify(mockEvents));
    localStorageMock.setItem('chat_messages', JSON.stringify(mockChatMessages));
    localStorageMock.setItem('app_settings', JSON.stringify(mockSettings));
    localStorageMock.setItem('chat_model', 'gpt-4');

    // 替换全局localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * DataExporter 测试
   */
  describe('DataExporter', () => {
    it('应该成功创建导出实例', () => {
      const exporter = new DataExporter();
      expect(exporter).toBeDefined();
      expect(exporter.metadata).toBeDefined();
      expect(exporter.exportTime).toBeDefined();
    });

    it('应该导出所有数据类型', async () => {
      const exporter = new DataExporter();
      const result = await exporter.export();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.filename).toContain('calendar_backup');

      const parsed = JSON.parse(result.data);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.data.events).toEqual(mockEvents);
      expect(parsed.data.chatMessages).toEqual(mockChatMessages);
      expect(parsed.data.settings).toBeDefined();
    });

    it('应该支持选择性导出', async () => {
      const exporter = new DataExporter();
      const result = await exporter.export({
        types: [DATA_TYPES.EVENTS]
      });

      expect(result.success).toBe(true);

      const parsed = JSON.parse(result.data);
      expect(parsed.data.events).toEqual(mockEvents);
      expect(parsed.data.chatMessages).toBeUndefined();
    });

    it('默认不应导出API密钥', async () => {
      const exporter = new DataExporter();
      const result = await exporter.export({
        types: [DATA_TYPES.SETTINGS]
      });

      expect(result.success).toBe(true);

      const parsed = JSON.parse(result.data);
      expect(parsed.data.settings.apiKeys).toEqual({});
      expect(parsed.data.settings.apiKeysNote).toBe('API密钥未导出（安全原因）');
    });

    it('应该支持包含API密钥导出', async () => {
      const exporter = new DataExporter();
      const result = await exporter.export({
        types: [DATA_TYPES.SETTINGS],
        includeApiKeys: true
      });

      expect(result.success).toBe(true);

      const parsed = JSON.parse(result.data);
      expect(parsed.data.settings.apiKeys).toEqual(mockSettings.apiKeys);
    });

    it('应该生成正确的文件名', async () => {
      const exporter = new DataExporter();
      const result = await exporter.export();

      expect(result.filename).toMatch(/calendar_backup_full_\d{8}_\d{6}\.json/);
    });

    it('应该支持加密导出', async () => {
      const exporter = new DataExporter();
      const result = await exporter.export({
        encrypt: true,
        password: 'test-password'
      });

      expect(result.success).toBe(true);

      const parsed = JSON.parse(result.data);
      expect(parsed.encrypted).toBe(true);
      expect(parsed.algorithm).toBe('AES-GCM');
      expect(parsed.data).toBeDefined();
    });

    it('应该提供数据预览', async () => {
      const exporter = new DataExporter();
      const preview = await exporter.getDataPreview();

      expect(preview).toBeDefined();
      expect(preview.events).toBeDefined();
      expect(preview.events.type).toBe('array');
      expect(preview.events.count).toBe(2);
    });
  });

  /**
   * DataImporter 测试
   */
  describe('DataImporter', () => {
    it('应该成功创建导入实例', () => {
      const importer = new DataImporter();
      expect(importer).toBeDefined();
      expect(importer.warnings).toEqual([]);
      expect(importer.stats).toEqual({
        total: 0,
        success: 0,
        failed: 0,
        skipped: 0
      });
    });

    it('应该成功导入事件数据（覆盖模式）', async () => {
      const exportData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        metadata: { dataTypes: [DATA_TYPES.EVENTS] },
        data: {
          events: [
            {
              id: 3,
              title: '新事件',
              startDate: '2026-02-15T10:00:00',
              createdAt: '2026-02-01T08:00:00',
              updatedAt: '2026-02-01T08:00:00'
            }
          ]
        }
      };

      const importer = new DataImporter();
      const result = await importer.import(JSON.stringify(exportData), {
        mode: 'overwrite'
      });

      expect(result.success).toBe(true);
      expect(result.results.events.success).toBe(true);

      const stored = JSON.parse(localStorageMock.getItem('calendar_events'));
      expect(stored).toHaveLength(1);
      expect(stored[0].title).toBe('新事件');
    });

    it('应该成功导入事件数据（合并模式）', async () => {
      const exportData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        metadata: { dataTypes: [DATA_TYPES.EVENTS] },
        data: {
          events: [
            {
              id: 3,
              title: '新事件',
              startDate: '2026-02-15T10:00:00',
              createdAt: '2026-02-01T08:00:00',
              updatedAt: '2026-02-01T08:00:00'
            }
          ]
        }
      };

      const importer = new DataImporter();
      const result = await importer.import(JSON.stringify(exportData), {
        mode: 'merge'
      });

      expect(result.success).toBe(true);

      const stored = JSON.parse(localStorageMock.getItem('calendar_events'));
      expect(stored).toHaveLength(3); // 原有2个 + 新增1个
    });

    it('合并模式应该根据更新时间选择较新数据', async () => {
      const exportData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        metadata: { dataTypes: [DATA_TYPES.EVENTS] },
        data: {
          events: [
            {
              id: 1, // 与现有事件相同ID
              title: '更新的会议',
              startDate: '2026-01-31T10:00:00',
              createdAt: '2026-01-30T08:00:00',
              updatedAt: '2026-01-31T20:00:00' // 更新的时间
            }
          ]
        }
      };

      const importer = new DataImporter();
      const result = await importer.import(JSON.stringify(exportData), {
        mode: 'merge'
      });

      expect(result.success).toBe(true);

      const stored = JSON.parse(localStorageMock.getItem('calendar_events'));
      const event = stored.find(e => e.id === 1);
      expect(event.title).toBe('更新的会议');
    });

    it('应该成功导入聊天记录', async () => {
      const exportData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        metadata: { dataTypes: [DATA_TYPES.CHAT] },
        data: {
          chatMessages: [
            {
              id: 3,
              role: 'user',
              content: '新的消息',
              timestamp: '2026-02-01T10:00:00'
            }
          ]
        }
      };

      const importer = new DataImporter();
      const result = await importer.import(JSON.stringify(exportData), {
        mode: 'merge'
      });

      expect(result.success).toBe(true);

      const stored = JSON.parse(localStorageMock.getItem('chat_messages'));
      expect(stored).toHaveLength(3);
    });

    it('应该验证数据格式', async () => {
      const invalidData = {
        // 缺少version
        exportTime: new Date().toISOString(),
        data: {}
      };

      const importer = new DataImporter();
      const result = await importer.import(JSON.stringify(invalidData));

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少版本信息');
      expect(result.code).toBe('IMP002');
    });

    it('应该检测空数据对象', async () => {
      const emptyData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        data: {}
      };

      const importer = new DataImporter();
      const result = await importer.import(JSON.stringify(emptyData));

      expect(result.success).toBe(false);
      expect(result.error).toContain('数据对象为空');
    });

    it('应该支持从File对象导入', async () => {
      const exportData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        metadata: { dataTypes: [DATA_TYPES.EVENTS] },
        data: { events: [] }
      };

      const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
      const file = new File([blob], 'test.json', { type: 'application/json' });

      const importer = new DataImporter();
      const result = await importer.import(file);

      expect(result.success).toBe(true);
    });

    it('应该提供导入预览', async () => {
      const exportData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        metadata: { dataTypes: [DATA_TYPES.EVENTS, DATA_TYPES.CHAT] },
        data: {
          events: mockEvents,
          chatMessages: mockChatMessages
        }
      };

      const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
      const file = new File([blob], 'test.json', { type: 'application/json' });

      const importer = new DataImporter();
      const preview = await importer.preview(file);

      expect(preview.canPreview).toBe(true);
      expect(preview.version).toBe('1.0.0');
      expect(preview.dataSummary.events.count).toBe(2);
      expect(preview.dataSummary.chatMessages.count).toBe(2);
    });

    it('应该检测加密文件并提示需要密码', async () => {
      const encryptedData = {
        encrypted: true,
        algorithm: 'AES-GCM',
        data: 'encrypted-content-here'
      };

      const blob = new Blob([JSON.stringify(encryptedData)], { type: 'application/json' });
      const file = new File([blob], 'test.json.enc', { type: 'application/json' });

      const importer = new DataImporter();
      const preview = await importer.preview(file);

      expect(preview.canPreview).toBe(false);
      expect(preview.encrypted).toBe(true);
      expect(preview.message).toContain('需要密码');
    });
  });

  /**
   * DataMigration 测试
   */
  describe('DataMigration', () => {
    it('应该成功创建迁移实例', () => {
      const migration = new DataMigration();
      expect(migration).toBeDefined();
      expect(migration.migrations).toBeDefined();
    });

    it('应该执行v1到v2的数据迁移', () => {
      const migration = new DataMigration();

      const v1Data = {
        events: [
          {
            id: 1,
            title: '测试事件',
            startDate: '2026-01-31T10:00:00'
            // 缺少recurrence, reminders, color字段
          }
        ],
        settings: {
          themeMode: 'light'
          // 缺少aiModelSettings
        }
      };

      const v2Data = migration.migrate(v1Data, '1.0.0', '2.0.0');

      expect(v2Data.events[0].recurrence).toBeNull();
      expect(v2Data.events[0].reminders).toEqual([]);
      expect(v2Data.events[0].color).toBe('#409EFF');
      expect(v2Data.settings.aiModelSettings).toBeDefined();
    });

    it('应该保留已有数据不变', () => {
      const migration = new DataMigration();

      const v1Data = {
        events: [
          {
            id: 1,
            title: '测试事件',
            recurrence: 'weekly',
            color: '#FF0000'
          }
        ]
      };

      const v2Data = migration.migrate(v1Data, '1.0.0', '2.0.0');

      expect(v2Data.events[0].recurrence).toBe('weekly');
      expect(v2Data.events[0].color).toBe('#FF0000');
    });
  });

  /**
   * 便捷函数测试
   */
  describe('便捷函数', () => {
    it('getBackupStatus应该返回正确的备份状态', () => {
      const status = getBackupStatus();

      expect(status).toBeDefined();
      expect(status.dataTypes).toBeDefined();
      expect(status.dataTypes.events.exists).toBe(true);
      expect(status.dataTypes.chat.exists).toBe(true);
      expect(status.totalSize).toBeGreaterThan(0);
      expect(status.totalSizeFormatted).toBeDefined();
      expect(status.storageUsed).toBeDefined();
    });

    it('应该正确处理空存储', () => {
      localStorageMock.clear();

      const status = getBackupStatus();

      expect(status.dataTypes.events.exists).toBe(false);
      expect(status.totalSize).toBe(0);
    });
  });

  /**
   * 集成测试
   */
  describe('集成测试', () => {
    it('应该完成完整的导出导入流程', async () => {
      // 1. 导出数据
      const exporter = new DataExporter();
      const exportResult = await exporter.export();

      expect(exportResult.success).toBe(true);

      // 2. 清空存储
      localStorageMock.clear();

      // 3. 导入数据
      const importer = new DataImporter();
      const importResult = await importer.import(exportResult.data);

      expect(importResult.success).toBe(true);

      // 4. 验证数据
      const events = JSON.parse(localStorageMock.getItem('calendar_events'));
      const messages = JSON.parse(localStorageMock.getItem('chat_messages'));

      expect(events).toEqual(mockEvents);
      expect(messages).toEqual(mockChatMessages);
    });

    it('应该支持加密导出导入流程', async () => {
      const password = 'secure-password-123';

      // 1. 加密导出
      const exporter = new DataExporter();
      const exportResult = await exporter.export({
        encrypt: true,
        password
      });

      expect(exportResult.success).toBe(true);

      // 2. 清空存储
      localStorageMock.clear();

      // 3. 解密导入
      const importer = new DataImporter();
      const importResult = await importer.import(exportResult.data, {
        password
      });

      expect(importResult.success).toBe(true);

      // 4. 验证数据
      const events = JSON.parse(localStorageMock.getItem('calendar_events'));
      expect(events).toEqual(mockEvents);
    });

    it('应该拒绝错误的解密密码', async () => {
      const password = 'correct-password';
      const wrongPassword = 'wrong-password';

      // 1. 加密导出
      const exporter = new DataExporter();
      const exportResult = await exporter.export({
        encrypt: true,
        password
      });

      // 2. 使用错误密码导入
      const importer = new DataImporter();
      const importResult = await importer.import(exportResult.data, {
        password: wrongPassword
      });

      expect(importResult.success).toBe(false);
      expect(importResult.error).toContain('解密失败');
    });
  });

  /**
   * 边界条件测试
   */
  describe('边界条件测试', () => {
    it('应该处理大量事件数据', async () => {
      const largeEvents = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `事件${i}`,
        startDate: '2026-01-31T10:00:00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      localStorageMock.setItem('calendar_events', JSON.stringify(largeEvents));

      const exporter = new DataExporter();
      const result = await exporter.export({
        types: [DATA_TYPES.EVENTS]
      });

      expect(result.success).toBe(true);

      const parsed = JSON.parse(result.data);
      expect(parsed.data.events).toHaveLength(1000);
    });

    it('应该处理特殊字符', async () => {
      const specialEvents = [
        {
          id: 1,
          title: '会议<特殊>字符"测试"',
          description: '包含换行\n和制表\t符',
          startDate: '2026-01-31T10:00:00'
        }
      ];

      const exportData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        data: { events: specialEvents }
      };

      const importer = new DataImporter();
      const result = await importer.import(JSON.stringify(exportData));

      expect(result.success).toBe(true);

      const stored = JSON.parse(localStorageMock.getItem('calendar_events'));
      expect(stored[0].title).toBe('会议<特殊>字符"测试"');
    });

    it('应该处理缺失的localStorage项', async () => {
      localStorageMock.removeItem('calendar_events');

      const exporter = new DataExporter();
      const result = await exporter.export({
        types: [DATA_TYPES.EVENTS, DATA_TYPES.CHAT]
      });

      expect(result.success).toBe(true);

      const parsed = JSON.parse(result.data);
      expect(parsed.data.events).toBeUndefined();
      expect(parsed.data.chatMessages).toEqual(mockChatMessages);
    });
  });
});
