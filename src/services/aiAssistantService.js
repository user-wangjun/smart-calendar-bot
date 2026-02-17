/**
 * AI智能助手服务层
 * 提供意图识别、实体提取、上下文管理和功能路由
 *
 * @module aiAssistantService
 * @description 智能助手的核心服务层，处理自然语言理解(NLU)和功能调用
 */

import { useEventsStore } from '@/stores/events';
import { useWeatherStore } from '@/stores/weather';
import { useChatStore } from '@/stores/chat';

/**
 * 意图类型枚举
 */
export const IntentType = {
  // 日程相关
  CREATE_EVENT: 'create_event',
  UPDATE_EVENT: 'update_event',
  DELETE_EVENT: 'delete_event',
  QUERY_EVENT: 'query_event',

  // 天气相关
  QUERY_WEATHER: 'query_weather',
  QUERY_FORECAST: 'query_forecast',

  // 提醒相关
  SET_REMINDER: 'set_reminder',
  CANCEL_REMINDER: 'cancel_reminder',

  // 待办相关
  CREATE_TODO: 'create_todo',
  COMPLETE_TODO: 'complete_todo',
  QUERY_TODO: 'query_todo',

  // 通用
  GENERAL_CHAT: 'general_chat',
  GREETING: 'greeting',
  HELP: 'help',
  UNKNOWN: 'unknown'
};

/**
 * 实体类型枚举
 */
export const EntityType = {
  DATE: 'date',
  TIME: 'time',
  DATETIME: 'datetime',
  LOCATION: 'location',
  EVENT_TITLE: 'event_title',
  PRIORITY: 'priority',
  DURATION: 'duration',
  PERSON: 'person',
  CITY: 'city'
};

/**
 * 意图识别器
 * 分析用户输入，识别用户意图
 */
export class IntentRecognizer {
  constructor () {
    // 意图关键词映射
    this.intentKeywords = {
      [IntentType.CREATE_EVENT]: [
        '添加', '创建', '新建', '安排', '预约', '计划', '设定',
        'add', 'create', 'schedule', 'plan', 'book'
      ],
      [IntentType.UPDATE_EVENT]: [
        '修改', '更新', '更改', '调整', '改期', '延期',
        'update', 'modify', 'change', 'reschedule'
      ],
      [IntentType.DELETE_EVENT]: [
        '删除', '取消', '移除', '删掉',
        'delete', 'cancel', 'remove'
      ],
      [IntentType.QUERY_EVENT]: [
        '查看', '查询', '显示', '列出', '有什么', '日程', '安排',
        'show', 'list', 'query', 'check', 'what', 'schedule'
      ],
      [IntentType.QUERY_WEATHER]: [
        '天气', '气温', '温度', '下雨', '晴天', '预报',
        'weather', 'temperature', 'forecast', 'rain', 'sunny'
      ],
      [IntentType.SET_REMINDER]: [
        '提醒', '通知', '闹钟', '记住',
        'remind', 'notify', 'alert'
      ],
      [IntentType.CREATE_TODO]: [
        '待办', '任务', 'todo', '要做', '完成',
        'todo', 'task', 'todo'
      ],
      [IntentType.GREETING]: [
        '你好', '您好', '嗨', 'hello', 'hi', 'hey', '早上好', '下午好', '晚上好'
      ],
      [IntentType.HELP]: [
        '帮助', '怎么用', '功能', '能做什么', 'help', 'how to', 'what can you do'
      ]
    };
  }

  /**
   * 识别用户意图
   * @param {string} text - 用户输入文本
   * @param {Array} context - 对话上下文
   * @returns {Object} 意图识别结果
   */
  recognize (text, context = []) {
    const lowerText = text.toLowerCase();

    // 计算每个意图的匹配分数
    const scores = {};

    for (const [intent, keywords] of Object.entries(this.intentKeywords)) {
      scores[intent] = 0;
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          scores[intent] += 1;
        }
      }
    }

    // 找出得分最高的意图
    let maxScore = 0;
    let recognizedIntent = IntentType.GENERAL_CHAT;

    for (const [intent, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        recognizedIntent = intent;
      }
    }

    // 如果没有匹配到任何关键词，根据上下文判断
    if (maxScore === 0 && context.length > 0) {
      recognizedIntent = this.inferFromContext(context);
    }

    return {
      intent: recognizedIntent,
      confidence: maxScore > 0 ? Math.min(maxScore * 0.3, 1) : 0.3,
      originalText: text
    };
  }

  /**
   * 从上下文推断意图
   * @private
   */
  inferFromContext (context) {
    const lastUserMessage = context
      .filter(msg => msg.role === 'user')
      .pop();

    if (!lastUserMessage) return IntentType.GENERAL_CHAT;

    // 如果上一句是创建日程相关，当前可能是补充信息
    const lastIntent = this.recognize(lastUserMessage.content);
    if (lastIntent.intent === IntentType.CREATE_EVENT) {
      return IntentType.CREATE_EVENT;
    }

    return IntentType.GENERAL_CHAT;
  }
}

/**
 * 实体提取器
 * 从文本中提取关键信息
 */
export class EntityExtractor {
  constructor () {
    // 日期模式
    this.datePatterns = [
      // 相对日期
      { pattern: /今天|today/i, type: EntityType.DATE, handler: () => this.getRelativeDate(0) },
      { pattern: /明天|tomorrow/i, type: EntityType.DATE, handler: () => this.getRelativeDate(1) },
      { pattern: /后天|day after tomorrow/i, type: EntityType.DATE, handler: () => this.getRelativeDate(2) },
      { pattern: /昨天|yesterday/i, type: EntityType.DATE, handler: () => this.getRelativeDate(-1) },

      // 星期
      { pattern: /周[一二三四五六日]|星期[一二三四五六日]/, type: EntityType.DATE, handler: (match) => this.parseWeekday(match[0]) },

      // 具体日期
      { pattern: /(\d{4})年(\d{1,2})月(\d{1,2})日/, type: EntityType.DATE, handler: (match) => `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}` },
      {
        pattern: /(\d{1,2})月(\d{1,2})日/,
        type: EntityType.DATE,
        handler: (match) => {
          const year = new Date().getFullYear();
          return `${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
        }
      }
    ];

    // 时间模式
    this.timePatterns = [
      { pattern: /(\d{1,2}):(\d{2})/, type: EntityType.TIME, handler: (match) => `${match[1].padStart(2, '0')}:${match[2]}` },
      {
        pattern: /(\d{1,2})点(\d{0,2})分?/,
        type: EntityType.TIME,
        handler: (match) => {
          const hour = match[1].padStart(2, '0');
          const minute = match[2] || '00';
          return `${hour}:${minute}`;
        }
      },
      { pattern: /(上午|下午|晚上|早晨)?\s*(\d{1,2})点/, type: EntityType.TIME, handler: (match) => this.parseTimePeriod(match[1], match[2]) }
    ];

    // 优先级模式
    this.priorityPatterns = [
      { pattern: /重要|紧急|高优先级|high priority/i, value: 'high' },
      { pattern: /普通|一般|中优先级|medium priority/i, value: 'medium' },
      { pattern: /低优先级|不重要|low priority/i, value: 'low' }
    ];

    // 持续时间模式
    this.durationPatterns = [
      { pattern: /(\d+)\s*小时?/i, unit: 'hour' },
      { pattern: /(\d+)\s*分钟?/i, unit: 'minute' },
      { pattern: /(\d+)\s*天/i, unit: 'day' }
    ];
  }

  /**
   * 提取所有实体
   * @param {string} text - 用户输入文本
   * @returns {Object} 提取的实体
   */
  extract (text) {
    const entities = {
      dates: this.extractDates(text),
      times: this.extractTimes(text),
      datetimes: this.extractDateTimes(text),
      locations: this.extractLocations(text),
      priorities: this.extractPriorities(text),
      durations: this.extractDurations(text),
      titles: this.extractEventTitles(text)
    };

    return entities;
  }

  /**
   * 提取日期
   */
  extractDates (text) {
    const dates = [];
    for (const { pattern, handler } of this.datePatterns) {
      const match = text.match(pattern);
      if (match) {
        dates.push({
          type: EntityType.DATE,
          value: handler(match),
          original: match[0]
        });
      }
    }
    return dates;
  }

  /**
   * 提取时间
   */
  extractTimes (text) {
    const times = [];
    for (const { pattern, handler } of this.timePatterns) {
      const match = text.match(pattern);
      if (match) {
        times.push({
          type: EntityType.TIME,
          value: handler(match),
          original: match[0]
        });
      }
    }
    return times;
  }

  /**
   * 提取日期时间组合
   */
  extractDateTimes (text) {
    const dates = this.extractDates(text);
    const times = this.extractTimes(text);

    if (dates.length > 0 && times.length > 0) {
      return [{
        type: EntityType.DATETIME,
        date: dates[0].value,
        time: times[0].value,
        value: `${dates[0].value}T${times[0].value}`
      }];
    }

    if (dates.length > 0) {
      return [{
        type: EntityType.DATETIME,
        date: dates[0].value,
        time: '09:00',
        value: `${dates[0].value}T09:00`
      }];
    }

    return [];
  }

  /**
   * 提取地点
   */
  extractLocations (text) {
    const locations = [];
    const patterns = [
      /在\s*([^，。]+?)(?:举行|举办|进行|开|见面)?/,
      /地点[是为:]\s*([^，。]+)/,
      /位置[是为:]\s*([^，。]+)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        locations.push({
          type: EntityType.LOCATION,
          value: match[1].trim(),
          original: match[0]
        });
      }
    }

    return locations;
  }

  /**
   * 提取优先级
   */
  extractPriorities (text) {
    for (const { pattern, value } of this.priorityPatterns) {
      if (pattern.test(text)) {
        return [{
          type: EntityType.PRIORITY,
          value,
          original: text.match(pattern)[0]
        }];
      }
    }
    return [];
  }

  /**
   * 提取持续时间
   */
  extractDurations (text) {
    const durations = [];
    for (const { pattern, unit } of this.durationPatterns) {
      const match = text.match(pattern);
      if (match) {
        durations.push({
          type: EntityType.DURATION,
          value: parseInt(match[1]),
          unit,
          original: match[0]
        });
      }
    }
    return durations;
  }

  /**
   * 提取事件标题
   */
  extractEventTitles (text) {
    const titles = [];
    const patterns = [
      /(?:安排|添加|创建|预约)\s*([^，。]+?)(?:在|于|时间|日期)/,
      /(?:叫|名为|标题是)\s*["']?([^"'，。]+)["']?/,
      /([^，。]+?)(?:会议|约会|活动|日程|提醒)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        titles.push({
          type: EntityType.EVENT_TITLE,
          value: match[1].trim(),
          original: match[0]
        });
      }
    }

    return titles;
  }

  // 辅助方法
  getRelativeDate (days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  parseWeekday (weekdayStr) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const day = weekdays.findIndex(d => weekdayStr.includes(d));
    if (day === -1) return null;

    const today = new Date().getDay();
    const diff = day - today;
    return this.getRelativeDate(diff >= 0 ? diff : diff + 7);
  }

  parseTimePeriod (period, hour) {
    let h = parseInt(hour);
    if (period === '下午' || period === '晚上') {
      if (h < 12) h += 12;
    }
    return `${h.toString().padStart(2, '0')}:00`;
  }
}

/**
 * 功能路由器
 * 根据意图和实体执行相应的功能
 */
export class FunctionRouter {
  constructor () {
    this.eventsStore = null;
    this.weatherStore = null;
    this.chatStore = null;
  }

  /**
   * 初始化store
   */
  initStores () {
    this.eventsStore = useEventsStore();
    this.weatherStore = useWeatherStore();
    this.chatStore = useChatStore();
  }

  /**
   * 执行功能
   * @param {Object} intent - 意图识别结果
   * @param {Object} entities - 实体提取结果
   * @param {string} originalText - 原始文本
   * @returns {Promise<Object>} 执行结果
   */
  async execute (intent, entities, originalText) {
    if (!this.eventsStore) {
      this.initStores();
    }

    switch (intent.intent) {
      case IntentType.CREATE_EVENT:
        return await this.createEvent(entities, originalText);

      case IntentType.QUERY_EVENT:
        return await this.queryEvents(entities);

      case IntentType.QUERY_WEATHER:
        return await this.queryWeather(entities);

      case IntentType.SET_REMINDER:
        return await this.setReminder(entities, originalText);

      case IntentType.CREATE_TODO:
        return await this.createTodo(entities, originalText);

      case IntentType.GREETING:
        return this.generateGreeting();

      case IntentType.HELP:
        return this.generateHelp();

      default:
        return null; // 返回null表示需要AI生成回复
    }
  }

  /**
   * 创建日程
   */
  async createEvent (entities, originalText) {
    const datetime = entities.datetimes[0];
    const title = entities.titles[0]?.value || '新日程';
    const location = entities.locations[0]?.value || '';
    const priority = entities.priorities[0]?.value || 'medium';

    if (!datetime) {
      return {
        success: false,
        message: '请提供具体的时间信息，例如"明天下午3点"或"周五上午"'
      };
    }

    try {
      const event = {
        id: Date.now().toString(),
        title,
        date: datetime.date,
        time: datetime.time,
        location,
        priority,
        description: originalText,
        createdAt: new Date().toISOString()
      };

      this.eventsStore.addEvent?.(event);

      return {
        success: true,
        message: `已为您创建日程：${title}\n时间：${datetime.date} ${datetime.time}${location ? '\n地点：' + location : ''}`,
        data: event
      };
    } catch (error) {
      return {
        success: false,
        message: '创建日程失败：' + error.message
      };
    }
  }

  /**
   * 查询日程
   */
  async queryEvents (entities) {
    try {
      const date = entities.dates[0]?.value || this.getRelativeDate(0);
      const events = this.eventsStore.getEventsByDate?.(date) || [];

      if (events.length === 0) {
        return {
          success: true,
          message: `${date} 没有安排任何日程`
        };
      }

      const eventList = events.map(e => `• ${e.time || '全天'} - ${e.title}`).join('\n');
      return {
        success: true,
        message: `${date} 的日程安排：\n${eventList}`,
        data: events
      };
    } catch (error) {
      return {
        success: false,
        message: '查询日程失败：' + error.message
      };
    }
  }

  /**
   * 查询天气
   */
  async queryWeather (entities) {
    try {
      // 获取当前天气数据
      const weatherData = this.weatherStore.currentWeather;

      if (!weatherData) {
        return {
          success: false,
          message: '暂无天气数据，请稍后再试'
        };
      }

      const { temperature, condition, humidity, windSpeed } = weatherData;
      return {
        success: true,
        message: `当前天气：${condition}，温度 ${temperature}°C，湿度 ${humidity}%，风速 ${windSpeed}km/h`
      };
    } catch (error) {
      return {
        success: false,
        message: '查询天气失败：' + error.message
      };
    }
  }

  /**
   * 设置提醒
   */
  async setReminder (entities, originalText) {
    const datetime = entities.datetimes[0];

    if (!datetime) {
      return {
        success: false,
        message: '请告诉我您希望在什么时候收到提醒'
      };
    }

    // 提取提醒内容
    const content = originalText
      .replace(/提醒我|设置提醒|在.*?提醒/, '')
      .replace(/今天|明天|后天/, '')
      .replace(/\d{1,2}点\d{0,2}分?/, '')
      .trim();

    return {
      success: true,
      message: `好的，我会在 ${datetime.date} ${datetime.time} 提醒您${content ? '：' + content : ''}`
    };
  }

  /**
   * 创建待办
   */
  async createTodo (entities, originalText) {
    const title = entities.titles[0]?.value ||
      originalText.replace(/添加|创建|待办|任务/g, '').trim();

    if (!title) {
      return {
        success: false,
        message: '请告诉我您需要完成什么任务'
      };
    }

    return {
      success: true,
      message: `已添加待办任务：${title}`
    };
  }

  /**
   * 生成问候语
   */
  generateGreeting () {
    const hour = new Date().getHours();
    let greeting = '你好';

    if (hour < 6) greeting = '晚上好';
    else if (hour < 9) greeting = '早上好';
    else if (hour < 12) greeting = '上午好';
    else if (hour < 14) greeting = '中午好';
    else if (hour < 18) greeting = '下午好';
    else greeting = '晚上好';

    const responses = [
      `${greeting}！我是您的智能助手，有什么可以帮您的吗？`,
      `${greeting}！今天想安排点什么？`,
      `${greeting}！我可以帮您管理日程、查询天气或设置提醒。`
    ];

    return {
      success: true,
      message: responses[Math.floor(Math.random() * responses.length)]
    };
  }

  /**
   * 生成帮助信息
   */
  generateHelp () {
    return {
      success: true,
      message: `我可以帮您：

📅 **日程管理**
• "帮我安排明天下午3点的会议"
• "查看今天的日程"
• "取消周五的约会"

🌤 **天气查询**
• "今天天气怎么样"
• "明天会下雨吗"

⏰ **提醒设置**
• "提醒我今天下午3点开会"
• "10分钟后提醒我喝水"

✅ **待办事项**
• "添加一个购买礼物的待办"
• "完成今天的任务"

您可以直接用自然语言和我对话！`
    };
  }

  getRelativeDate (days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

/**
 * AI助手服务主类
 * 整合意图识别、实体提取和功能路由
 */
export class AIAssistantService {
  constructor () {
    this.intentRecognizer = new IntentRecognizer();
    this.entityExtractor = new EntityExtractor();
    this.functionRouter = new FunctionRouter();
    this.conversationContext = [];
    this.maxContextLength = 10;
  }

  /**
   * 处理用户消息
   * @param {string} message - 用户消息
   * @returns {Promise<Object>} 处理结果
   */
  async processMessage (message) {
    // 1. 意图识别
    const intent = this.intentRecognizer.recognize(message, this.conversationContext);

    // 2. 实体提取
    const entities = this.entityExtractor.extract(message);

    // 3. 尝试执行功能
    const functionResult = await this.functionRouter.execute(intent, entities, message);

    // 4. 更新上下文
    this.updateContext('user', message);

    // 5. 返回结果
    if (functionResult && functionResult.success) {
      this.updateContext('assistant', functionResult.message);
      return {
        type: 'function',
        content: functionResult.message,
        data: functionResult.data,
        intent: intent.intent,
        entities
      };
    }

    // 6. 如果需要AI生成回复
    return {
      type: 'ai',
      content: null, // 由调用方通过AI获取
      intent: intent.intent,
      entities,
      needsAI: true
    };
  }

  /**
   * 更新对话上下文
   * @private
   */
  updateContext (role, content) {
    this.conversationContext.push({ role, content, timestamp: Date.now() });

    if (this.conversationContext.length > this.maxContextLength * 2) {
      this.conversationContext = this.conversationContext.slice(-this.maxContextLength * 2);
    }
  }

  /**
   * 获取当前上下文
   */
  getContext () {
    return this.conversationContext;
  }

  /**
   * 清空上下文
   */
  clearContext () {
    this.conversationContext = [];
  }
}

// 创建单例
export const aiAssistantService = new AIAssistantService();

// 便捷函数
export function useAIAssistant () {
  return aiAssistantService;
}

export default AIAssistantService;
