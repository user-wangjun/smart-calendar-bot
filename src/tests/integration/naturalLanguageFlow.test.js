/**
 * 自然语言日程创建集成测试
 * 测试完整的用户流程：输入 -> 解析 -> 确认 -> 创建
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useEventsStore } from '@/stores/events';
import { useChatStore } from '@/stores/chat';
import NaturalLanguageService from '@/services/naturalLanguageService.js';

describe('自然语言日程创建集成测试', () => {
  let nlpService;
  let eventsStore;
  let chatStore;

  beforeEach(() => {
    // 创建Pinia实例
    setActivePinia(createPinia());

    // 初始化服务
    nlpService = new NaturalLanguageService();

    // 获取store实例
    eventsStore = useEventsStore();
    chatStore = useChatStore();

    // 清空store状态
    eventsStore.$reset();
    chatStore.$reset();
  });

  describe('完整流程测试', () => {
    test('流程：用户输入 -> 解析 -> 确认 -> 创建成功', async () => {
      // 1. 用户输入
      const userInput = '明天下午3点和张三开会';

      // 2. 解析输入
      const parseResult = await nlpService.parse(userInput, {
        currentTime: new Date()
      });

      // 验证解析结果
      expect(parseResult.intent).toBe('create_event');
      expect(parseResult.event).toBeDefined();
      expect(parseResult.event.title).toBe('开会');
      expect(parseResult.event.attendees).toContain('张三');
      expect(parseResult.confidence).toBeGreaterThan(0.5);

      // 3. 模拟用户确认（添加到store）
      const newEvent = {
        title: parseResult.event.title,
        startDate: parseResult.event.startTime,
        endDate: parseResult.event.endTime,
        location: parseResult.event.location,
        attendees: parseResult.event.attendees,
        description: parseResult.event.description,
        type: 'event',
        priority: 'medium'
      };

      eventsStore.addEvent(newEvent);

      // 4. 验证事件已创建
      expect(eventsStore.events).toHaveLength(1);
      expect(eventsStore.events[0].title).toBe('开会');
      expect(eventsStore.events[0].attendees).toContain('张三');

      // 5. 验证聊天记录
      expect(chatStore.messages).toHaveLength(0); // 尚未添加消息
    });

    test('流程：复杂日程创建', async () => {
      const userInput = '下周三晚上7点在国贸和王五、李四一起吃饭，持续2小时';

      // 解析
      const parseResult = await nlpService.parse(userInput, {
        currentTime: new Date()
      });

      // 验证解析
      expect(parseResult.intent).toBe('create_event');
      expect(parseResult.event.title).toBe('吃饭');
      expect(parseResult.event.location).toBe('国贸');
      expect(parseResult.event.attendees).toContain('王五');
      expect(parseResult.event.attendees).toContain('李四');

      // 验证时间
      const startTime = new Date(parseResult.event.startTime);
      expect(startTime.getHours()).toBe(19); // 晚上7点

      // 验证持续时间
      const endTime = new Date(parseResult.event.endTime);
      const duration = (endTime - startTime) / (1000 * 60 * 60); // 小时
      expect(duration).toBe(2);

      // 创建事件
      eventsStore.addEvent({
        title: parseResult.event.title,
        startDate: parseResult.event.startTime,
        endDate: parseResult.event.endTime,
        location: parseResult.event.location,
        attendees: parseResult.event.attendees,
        type: 'event',
        priority: 'medium'
      });

      // 验证
      expect(eventsStore.events).toHaveLength(1);
      expect(eventsStore.events[0].location).toBe('国贸');
    });

    test('流程：重复事件创建', async () => {
      const userInput = '每周一上午10点团队例会';

      // 解析
      const parseResult = await nlpService.parse(userInput, {
        currentTime: new Date()
      });

      // 验证重复规则
      expect(parseResult.intent).toBe('create_event');
      expect(parseResult.event.recurrence).toBeDefined();
      expect(parseResult.event.recurrence.frequency).toBe('weekly');

      // 创建事件
      eventsStore.addEvent({
        title: parseResult.event.title,
        startDate: parseResult.event.startTime,
        endDate: parseResult.event.endTime,
        type: 'event',
        priority: 'medium'
      });

      expect(eventsStore.events).toHaveLength(1);
    });
  });

  describe('边界情况测试', () => {
    test('流程：低置信度输入', async () => {
      const userInput = '也许明天可能有个会'; // 歧义表达

      const parseResult = await nlpService.parse(userInput, {
        currentTime: new Date()
      });

      // 应该识别为创建意图，但置信度较低
      expect(parseResult.intent).toBe('create_event');
      expect(parseResult.confidence).toBeLessThan(0.8);
    });

    test('流程：缺失必要信息', async () => {
      const userInput = '创建一个日程'; // 缺少时间

      const parseResult = await nlpService.parse(userInput, {
        currentTime: new Date()
      });

      expect(parseResult.intent).toBe('create_event');
      expect(parseResult.missingInfo).toContain('开始时间');
      expect(parseResult.event.startTime).toBeNull();
    });

    test('流程：非日程意图', async () => {
      const userInput = '今天天气怎么样';

      const parseResult = await nlpService.parse(userInput, {
        currentTime: new Date()
      });

      expect(parseResult.intent).toBe('chat');
      expect(parseResult.event).toBeNull();
    });

    test('流程：查询意图', async () => {
      const userInput = '明天有什么安排';

      const parseResult = await nlpService.parse(userInput, {
        currentTime: new Date()
      });

      expect(parseResult.intent).toBe('query_schedule');
      expect(parseResult.event).toBeNull();
    });
  });

  describe('数据一致性测试', () => {
    test('验证事件数据格式', async () => {
      const userInput = '明天下午3点开会';

      const parseResult = await nlpService.parse(userInput, {
        currentTime: new Date()
      });

      // 验证时间格式为ISO字符串
      expect(parseResult.event.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(parseResult.event.endTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // 验证事件对象结构
      expect(parseResult.event).toHaveProperty('title');
      expect(parseResult.event).toHaveProperty('startTime');
      expect(parseResult.event).toHaveProperty('endTime');
      expect(parseResult.event).toHaveProperty('location');
      expect(parseResult.event).toHaveProperty('attendees');
      expect(parseResult.event).toHaveProperty('description');
    });

    test('验证事件创建后数据完整性', async () => {
      const userInput = '明天下午3点在会议室和张三开会';

      const parseResult = await nlpService.parse(userInput, {
        currentTime: new Date()
      });

      // 创建事件
      const eventData = {
        title: parseResult.event.title,
        startDate: parseResult.event.startTime,
        endDate: parseResult.event.endTime,
        location: parseResult.event.location,
        attendees: parseResult.event.attendees,
        description: parseResult.event.description,
        type: 'event',
        priority: 'medium'
      };

      eventsStore.addEvent(eventData);

      // 验证存储的事件
      const storedEvent = eventsStore.events[0];
      expect(storedEvent.title).toBe('开会');
      expect(storedEvent.location).toBe('会议室');
      expect(storedEvent.attendees).toContain('张三');
      expect(storedEvent.type).toBe('event');
      expect(storedEvent.priority).toBe('medium');
    });
  });

  describe('性能测试', () => {
    test('解析响应时间', async () => {
      const userInput = '明天下午3点开会';

      const startTime = Date.now();
      await nlpService.parse(userInput, {
        currentTime: new Date()
      });
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(100); // 应该在100ms内完成
    });

    test('批量解析性能', async () => {
      const inputs = [
        '明天下午3点开会',
        '后天上午10点约会',
        '下周三面试',
        '每天下午3点健身'
      ];

      const startTime = Date.now();
      for (const input of inputs) {
        await nlpService.parse(input, { currentTime: new Date() });
      }
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(500); // 4个请求应该在500ms内完成
    });
  });
});
