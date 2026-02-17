import { describe, test, expect, beforeEach } from '@jest/globals';
import { EventExtractionService } from '../src/services/eventExtractionService.js';

/**
 * 日期处理单元测试
 * 验证时区转换修复的正确性
 */
describe('日期处理 - 时区转换修复测试', () => {
  let service;

  beforeEach(() => {
    service = new EventExtractionService();
  });

  describe('parseDate 函数', () => {
    test('应正确解析绝对日期格式（YYYY年MM月DD日）', async () => {
      const result = await service.extractWithRules('2026年2月14日 下午 开会');
      expect(result.success).toBe(true);
      expect(result.events.length).toBeGreaterThan(0);
      const event = result.events[0];
      expect(event.startDate).toMatch(/^2026-02-14/);
    });

    test('应正确解析相对日期（今天）', async () => {
      const now = new Date();
      const expectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const result = await service.extractWithRules('今天下午开会');
      expect(result.success).toBe(true);
      expect(result.events[0].startDate).toMatch(new RegExp(`^${expectedDate}`));
    });

    test('应正确解析相对日期（明天）', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expectedDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      const result = await service.extractWithRules('明天上午开会');
      expect(result.success).toBe(true);
      expect(result.events[0].startDate).toMatch(new RegExp(`^${expectedDate}`));
    });
  });

  describe('combineDateTime 函数', () => {
    test('应正确组合日期和时间', () => {
      const date = '2026-02-14';
      const time = '14:30';
      const result = service.combineDateTime(date, time);

      expect(result).toBe('2026-02-14T14:30:00');
    });

    test('无时间时应使用默认值9:00', () => {
      const date = '2026-02-14';
      const result = service.combineDateTime(date, null);

      expect(result).toBe('2026-02-14T09:00:00');
    });

    test('应正确处理边界日期（跨年）', () => {
      const date = '2026-12-31';
      const time = '23:00';
      const result = service.combineDateTime(date, time);

      expect(result).toBe('2026-12-31T23:00:00');
    });

    test('应正确处理年初日期', () => {
      const date = '2026-01-01';
      const time = '00:00';
      const result = service.combineDateTime(date, time);

      expect(result).toBe('2026-01-01T00:00:00');
    });
  });

  describe('calculateEndDate 函数', () => {
    test('应在开始时间基础上增加默认持续时间', () => {
      const startDate = '2026-02-14T14:00:00';
      const result = service.calculateEndDate(startDate, null);

      expect(result).toBe('2026-02-14T15:00:00');
    });

    test('应正确处理跨天事件', () => {
      const startDate = '2026-02-14T23:30:00';
      const result = service.calculateEndDate(startDate, null);

      expect(result).toBe('2026-02-15T00:30:00');
    });
  });

  describe('时区边界测试', () => {
    test('UTC+8时区下日期不应偏移', async () => {
      const result = await service.extractWithRules('2026年2月14日 凌晨 开会');
      expect(result.success).toBe(true);

      const event = result.events[0];
      expect(event.startDate).toMatch(/^2026-02-14/);
      expect(event.startDate).not.toMatch(/^2026-02-13/);
    });

    test('午夜时间不应导致日期偏移', async () => {
      const result = await service.extractWithRules('2026年2月14日 00:00 重要会议');
      expect(result.success).toBe(true);

      const event = result.events[0];
      expect(event.startDate).toBe('2026-02-14T00:00:00');
    });
  });
});

describe('事件提取集成测试', () => {
  let service;

  beforeEach(() => {
    service = new EventExtractionService();
  });

  test('完整事件提取流程', async () => {
    const result = await service.extractWithRules('2026年2月14日 下午2点 开会讨论项目进度');

    expect(result.success).toBe(true);
    expect(result.events.length).toBeGreaterThan(0);

    const event = result.events[0];
    expect(event.title).toContain('开会');
    expect(event.startDate).toMatch(/^2026-02-14T14:00:00/);
    expect(event.endDate).toMatch(/^2026-02-14T15:00:00/);
    expect(event.type).toBe('meeting');
  });

  test('多行事件提取', async () => {
    const conversation = `
      2026年2月14日 上午10点 团队会议
      2026年2月15日 下午3点 客户拜访
    `;

    const result = await service.extractWithRules(conversation);

    expect(result.success).toBe(true);
    expect(result.events.length).toBe(2);

    expect(result.events[0].startDate).toMatch(/^2026-02-14/);
    expect(result.events[1].startDate).toMatch(/^2026-02-15/);
  });
});
