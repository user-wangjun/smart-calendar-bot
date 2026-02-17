/**
 * 自然语言服务单元测试
 * 测试意图识别、实体提取、时间解析等核心功能
 */

import { describe, test, expect, beforeEach } from 'vitest';
import NaturalLanguageService, { IntentRecognizer, EntityExtractor } from '../naturalLanguageService.js';

describe('IntentRecognizer', () => {
  let recognizer;

  beforeEach(() => {
    recognizer = new IntentRecognizer();
  });

  describe('意图识别', () => {
    test('识别创建日程意图 - 创建事件', () => {
      const result = recognizer.recognize('创建一个明天下午3点的会议');
      expect(result).toBe('create_event');
    });

    test('识别创建日程意图 - 添加日程', () => {
      const result = recognizer.recognize('添加一个明天上午10点的任务');
      expect(result).toBe('create_event');
    });

    test('识别创建日程意图 - 安排约会', () => {
      const result = recognizer.recognize('安排一个下周三的面试');
      expect(result).toBe('create_event');
    });

    test('识别创建日程意图 - 明天有会', () => {
      const result = recognizer.recognize('明天下午要开会');
      expect(result).toBe('create_event');
    });

    test('识别创建日程意图 - 记得做某事', () => {
      const result = recognizer.recognize('记得明天早上去医院');
      expect(result).toBe('create_event');
    });

    test('识别查询意图', () => {
      const result = recognizer.recognize('查看明天的日程');
      expect(result).toBe('query_schedule');
    });

    test('识别查询意图 - 有什么安排', () => {
      const result = recognizer.recognize('明天有什么安排');
      expect(result).toBe('query_schedule');
    });

    test('识别修改意图', () => {
      const result = recognizer.recognize('修改明天的会议');
      expect(result).toBe('modify_event');
    });

    test('识别删除意图', () => {
      const result = recognizer.recognize('删除这个日程');
      expect(result).toBe('modify_event');
    });

    test('默认返回聊天意图', () => {
      const result = recognizer.recognize('今天天气怎么样');
      expect(result).toBe('chat');
    });
  });

  describe('置信度计算', () => {
    test('创建意图置信度', () => {
      const text = '创建一个明天下午3点的会议';
      const intent = recognizer.recognize(text);
      const confidence = recognizer.getConfidence(text, intent);
      expect(confidence).toBeGreaterThan(0.5);
      expect(confidence).toBeLessThanOrEqual(0.9);
    });

    test('聊天意图置信度较低', () => {
      const text = '今天天气怎么样';
      const intent = recognizer.recognize(text);
      const confidence = recognizer.getConfidence(text, intent);
      expect(confidence).toBe(0.3);
    });
  });
});

describe('EntityExtractor', () => {
  let extractor;

  beforeEach(() => {
    extractor = new EntityExtractor();
  });

  describe('时间提取', () => {
    test('提取相对时间 - 明天', () => {
      const result = extractor.extractTime('明天下午3点开会');
      expect(result.startTime).toBeDefined();
      expect(result.startTime.getHours()).toBe(15);
      expect(result.startTime.getMinutes()).toBe(0);
    });

    test('提取相对时间 - 后天', () => {
      const result = extractor.extractTime('后天上午10点');
      expect(result.startTime).toBeDefined();
      const now = new Date();
      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() + 2);
      expect(result.startTime.getDate()).toBe(expectedDate.getDate());
    });

    test('提取绝对时间', () => {
      const result = extractor.extractTime('2026年2月15日下午3点');
      expect(result.startTime).toBeDefined();
      expect(result.startTime.getFullYear()).toBe(2026);
      expect(result.startTime.getMonth()).toBe(1); // 2月
      expect(result.startTime.getDate()).toBe(15);
    });

    test('提取时间段关键词', () => {
      const result = extractor.extractTime('明天下午3点');
      expect(result.startTime).toBeDefined();
      expect(result.startTime.getHours()).toBe(15);
    });

    test('提取持续时间', () => {
      const result = extractor.extractTime('明天下午3点开会，持续2小时');
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      const duration = (result.endTime - result.startTime) / (1000 * 60 * 60); // 小时
      expect(duration).toBe(2);
    });

    test('默认持续时间为1小时', () => {
      const result = extractor.extractTime('明天下午3点开会');
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      const duration = (result.endTime - result.startTime) / (1000 * 60 * 60); // 小时
      expect(duration).toBe(1);
    });

    test('提取重复规则 - 每天', () => {
      const result = extractor.extractTime('每天下午3点开会');
      expect(result.recurrence).toEqual({ frequency: 'daily', interval: 1 });
    });

    test('提取重复规则 - 每周', () => {
      const result = extractor.extractTime('每周一上午10点开会');
      expect(result.recurrence).toEqual({ frequency: 'weekly', interval: 1 });
    });
  });

  describe('地点提取', () => {
    test('提取地点 - 在会议室', () => {
      const result = extractor.extractLocation('在会议室开会');
      expect(result).toBe('会议室');
    });

    test('提取地点 - 去国贸', () => {
      const result = extractor.extractLocation('去国贸吃饭');
      expect(result).toBe('国贸');
    });

    test('提取地点 - 位于公司', () => {
      const result = extractor.extractLocation('位于公司总部开会');
      expect(result).toBe('公司总部');
    });

    test('无地点时返回null', () => {
      const result = extractor.extractLocation('明天下午3点开会');
      expect(result).toBeNull();
    });
  });

  describe('参与人提取', () => {
    test('提取参与人 - 和张三', () => {
      const result = extractor.extractAttendees('和张三开会');
      expect(result).toContain('张三');
    });

    test('提取多个参与人', () => {
      const result = extractor.extractAttendees('和张三、李四、王五开会');
      expect(result).toContain('张三');
      expect(result).toContain('李四');
      expect(result).toContain('王五');
    });

    test('提取参与人 - 与李四一起', () => {
      const result = extractor.extractAttendees('与李四一起吃饭');
      expect(result).toContain('李四');
    });

    test('无参与人时返回null', () => {
      const result = extractor.extractAttendees('明天下午3点开会');
      expect(result).toBeNull();
    });
  });

  describe('事件类型提取', () => {
    test('提取会议类型', () => {
      const result = extractor.extractEventType('明天下午3点开会');
      expect(result).toBe('会议');
    });

    test('提取约会类型', () => {
      const result = extractor.extractEventType('明天下午3点约会');
      expect(result).toBe('约会');
    });

    test('提取生日类型', () => {
      const result = extractor.extractEventType('明天是张三的生日');
      expect(result).toBe('生日');
    });

    test('无明确类型时返回null', () => {
      const result = extractor.extractEventType('明天下午3点做某事');
      expect(result).toBeNull();
    });
  });

  describe('标题提取', () => {
    test('使用事件类型作为标题', () => {
      const result = extractor.extractTitle('明天下午3点开会');
      expect(result).toBe('会议');
    });

    test('从动词结构提取标题', () => {
      const result = extractor.extractTitle('明天下午3点要去医院看病');
      expect(result).toBeTruthy();
    });

    test('无明确标题时返回null', () => {
      const result = extractor.extractTitle('明天下午3点');
      expect(result).toBeNull();
    });
  });
});

describe('NaturalLanguageService', () => {
  let service;

  beforeEach(() => {
    service = new NaturalLanguageService();
  });

  describe('完整解析流程', () => {
    test('解析简单创建日程', async () => {
      const result = await service.parse('明天下午3点开会');
      expect(result.intent).toBe('create_event');
      expect(result.event).toBeDefined();
      expect(result.event.title).toBe('开会');
      expect(result.event.startTime).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('解析复杂创建日程', async () => {
      const result = await service.parse('明天下午3点在会议室和张三、李四开会讨论项目，持续2小时');
      expect(result.intent).toBe('create_event');
      expect(result.event.title).toBe('开会');
      expect(result.event.location).toBe('会议室');
      expect(result.event.attendees).toContain('张三');
      expect(result.event.attendees).toContain('李四');
    });

    test('解析查询意图', async () => {
      const result = await service.parse('明天有什么安排');
      expect(result.intent).toBe('query_schedule');
      expect(result.event).toBeNull();
    });

    test('解析聊天意图', async () => {
      const result = await service.parse('今天天气怎么样');
      expect(result.intent).toBe('chat');
      expect(result.event).toBeNull();
    });

    test('检查缺失信息', async () => {
      const result = await service.parse('创建一个日程');
      expect(result.intent).toBe('create_event');
      expect(result.missingInfo).toContain('开始时间');
    });
  });

  describe('事件验证', () => {
    test('验证有效事件', () => {
      const event = {
        title: '测试会议',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
      };
      const validation = service.validateEvent(event);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('验证缺失标题', () => {
      const event = {
        title: '',
        startTime: new Date().toISOString()
      };
      const validation = service.validateEvent(event);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('事件标题不能为空');
    });

    test('验证缺失开始时间', () => {
      const event = {
        title: '测试会议',
        startTime: null
      };
      const validation = service.validateEvent(event);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('开始时间不能为空');
    });

    test('验证过去时间警告', () => {
      const event = {
        title: '测试会议',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 昨天
      };
      const validation = service.validateEvent(event);
      expect(validation.warnings).toContain('开始时间已经过去');
    });

    test('验证结束时间早于开始时间', () => {
      const now = new Date();
      const event = {
        title: '测试会议',
        startTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        endTime: now.toISOString()
      };
      const validation = service.validateEvent(event);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('结束时间必须晚于开始时间');
    });
  });

  describe('边界情况处理', () => {
    test('处理空输入', async () => {
      const result = await service.parse('');
      expect(result.intent).toBe('chat');
    });

    test('处理特殊字符', async () => {
      const result = await service.parse('明天下午3点开会！@#$%');
      expect(result.intent).toBe('create_event');
      expect(result.event.title).toBe('开会');
    });

    test('处理超长输入', async () => {
      const longText = '明天下午3点开会' + 'a'.repeat(500);
      const result = await service.parse(longText);
      expect(result.intent).toBe('create_event');
    });

    test('处理歧义表达', async () => {
      const result = await service.parse('可能明天下午3点开会');
      expect(result.intent).toBe('create_event');
    });
  });
});
