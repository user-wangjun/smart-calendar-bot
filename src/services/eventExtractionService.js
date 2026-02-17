/**
 * 事件提取服务
 * 从对话内容中自动提取事件信息，支持自然语言处理
 */
import { DEFAULT_REMINDER_MINUTES, DEFAULT_EVENT_DURATION_MINUTES } from '@/config/constants.js';

class EventExtractionService {
  constructor () {
    // 事件关键词模式
    this.patterns = {
      // 日期模式
      date: /(\d{4})[年.-]?(\d{1,2})[月.-]?(\d{1,2})[日]?|(\d{1,2})\/(\d{1,2})\/(\d{1,2})|今天|明天|后天|下周|下个月|明年|(\d{1,2})天后|(\d{1,2})周后/g,

      // 时间模式 - 支持多种格式：HH:mm, HH：mm, HH点mm分, HH点
      time: /(\d{1,2})[:：](\d{2})|(\d{1,2})点(\d{1,2})?分?|上午|下午|晚上|早上|中午|凌晨/g,

      // 事件类型关键词
      eventTypes: {
        meeting: ['会议', '开会', '讨论', '沟通', '汇报', '面谈'],
        appointment: ['预约', '约见', '面谈', '拜访', '咨询'],
        task: ['任务', '工作', '完成', '处理', '准备', '整理'],
        reminder: ['提醒', '记得', '不要忘记', '注意', '关注'],
        personal: ['生日', '纪念日', '旅行', '度假', '休息', '锻炼', '学习'],
        health: ['体检', '看病', '吃药', '运动', '健身', '饮食']
      },

      // 优先级关键词
      priorities: {
        high: ['重要', '紧急', '必须', '关键', '优先', '立即'],
        medium: ['一般', '普通', '正常', '安排', '计划'],
        low: ['可以', '有空', '顺便', '如果', '考虑']
      }
    };

    // AI服务集成（用于智能提取）
    this.aiService = null;

    // 预编译关键词正则以降低匹配复杂度
    this.typeRegexMap = {};
    Object.entries(this.patterns.eventTypes).forEach(([type, keywords]) => {
      const safe = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      this.typeRegexMap[type] = new RegExp(`(${safe.join('|')})`, 'i');
    });
    this.priorityRegex = {
      high: new RegExp(`(${this.patterns.priorities.high.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'i'),
      medium: new RegExp(`(${this.patterns.priorities.medium.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'i')
    };
  }

  /**
   * 设置AI服务
   * @param {Object} aiService - AI服务实例
   */
  setAIService (aiService) {
    this.aiService = aiService;
  }

  /**
   * 从对话中提取事件
   * @param {string} conversation - 对话内容
   * @returns {Promise<Object>} - 提取结果
   */
  async extractEvents (conversation) {
    console.log('开始从对话中提取事件...');

    try {
      // 使用AI服务进行智能提取
      if (this.aiService) {
        return await this.extractWithAI(conversation);
      }

      // 使用规则引擎进行提取
      return await this.extractWithRules(conversation);
    } catch (error) {
      console.error('事件提取失败:', error);
      return {
        success: false,
        events: [],
        error: error.message,
        confidence: 0
      };
    }
  }

  /**
   * 使用AI提取事件
   * @param {string} conversation - 对话内容
   * @returns {Promise<Object>} - 提取结果
   */
  async extractWithAI (conversation) {
    try {
      // 构建提示词
      const prompt = `请从以下对话内容中提取所有事件信息，包括日期、时间、事件名称等。返回JSON格式：\n\n${conversation}\n\n返回格式示例：\n{\n  "events": [\n    {\n      "title": "事件标题",\n      "startDate": "2024-01-25T14:00:00",\n      "endDate": "2024-01-25T15:00:00",\n      "description": "事件描述",\n      "priority": "high",\n      "type": "meeting"\n    }\n  ],\n  "confidence": 0.95\n}`;

      // 调用AI服务
      const response = await this.aiService.sendMessage(prompt);

      // 解析AI响应
      const aiResult = this.parseAIResponse(response);

      if (aiResult.events && aiResult.events.length > 0) {
        return {
          success: true,
          events: aiResult.events,
          confidence: aiResult.confidence || 0.85,
          source: 'ai',
          rawResponse: response
        };
      }

      return {
        success: false,
        events: [],
        confidence: 0,
        source: 'ai',
        message: 'AI未能提取到事件信息'
      };
    } catch (error) {
      console.error('AI提取失败:', error);
      return {
        success: false,
        events: [],
        confidence: 0,
        source: 'ai',
        error: error.message
      };
    }
  }

  /**
   * 使用规则引擎提取事件
   * @param {string} conversation - 对话内容
   * @returns {Promise<Object>} - 提取结果
   */
  async extractWithRules (conversation) {
    const events = [];
    const lines = conversation.split('\n');

    // 分析每一行
    for (const line of lines) {
      const extracted = this.extractFromLine(line);
      if (extracted) {
        events.push(extracted);
      }
    }

    // 去重
    const uniqueEvents = this.deduplicateEvents(events);

    return {
      success: true,
      events: uniqueEvents,
      confidence: 0.75, // 规则引擎置信度较低
      source: 'rules'
    };
  }

  /**
   * 从单行文本中提取事件
   * @param {string} line - 文本行
   * @returns {Object|null>} - 提取的事件对象
   */
  extractFromLine (line) {
    const trimmedLine = line.trim();

    // 检查是否包含事件关键词
    const hasEventKeyword = this.hasEventKeyword(trimmedLine);
    if (!hasEventKeyword) {
      return null;
    }

    // 提取日期 - 使用 exec 获取捕获组
    const dateRegex = this.patterns.date;
    const dateMatch = dateRegex.exec(trimmedLine);
    const extractedDate = this.parseDate(dateMatch);

    // 重置正则索引
    dateRegex.lastIndex = 0;

    // 提取时间 - 使用 exec 获取捕获组
    const timeRegex = this.patterns.time;
    const timeMatch = timeRegex.exec(trimmedLine);
    const extractedTime = this.parseTime(timeMatch);

    // 重置正则索引
    timeRegex.lastIndex = 0;

    // 提取事件标题
    const title = this.extractTitle(trimmedLine, dateMatch, timeMatch);

    // 推断事件类型
    const type = this.inferEventType(trimmedLine);

    // 推断优先级
    const priority = this.inferPriority(trimmedLine);

    // 如果没有日期，返回null
    if (!extractedDate) {
      return null;
    }

    // 生成事件对象
    const event = {
      id: this.generateEventId(),
      title: title || '未命名事件',
      startDate: this.combineDateTime(extractedDate, extractedTime),
      endDate: this.calculateEndDate(extractedDate, extractedTime),
      description: trimmedLine,
      priority,
      type,
      reminderTime: DEFAULT_REMINDER_MINUTES,
      reminderMethods: ['popup'], // 默认弹窗提醒
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return event;
  }

  /**
   * 检查是否包含事件关键词
   * @param {string} text - 文本
   * @returns {boolean} - 是否包含事件关键词
   */
  hasEventKeyword (text) {
    const allKeywords = [
      ...Object.values(this.patterns.eventTypes).flat(),
      '安排', '计划', '日程', '事件', '活动', '要做', '准备', '进行'
    ];

    return allKeywords.some(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * 解析日期
   * @param {Array} match - 正则匹配结果
   * @returns {string|null>} - 本地日期字符串
   */
  // eslint-disable-next-line complexity
  parseDate (match) {
    if (!match) return null;

    const now = new Date();
    let year, month, day;

    // 先检查绝对日期格式（match[1], match[2], match[3] 存在时）
    if (match[1] && match[2] && match[3]) {
      year = parseInt(match[1]);
      month = parseInt(match[2]);
      day = parseInt(match[3]);
    } else if (match[0].includes('今天')) {
      year = now.getFullYear();
      month = now.getMonth() + 1;
      day = now.getDate();
    } else if (match[0].includes('明天')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      year = tomorrow.getFullYear();
      month = tomorrow.getMonth() + 1;
      day = tomorrow.getDate();
    } else if (match[0].includes('后天')) {
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      year = dayAfterTomorrow.getFullYear();
      month = dayAfterTomorrow.getMonth() + 1;
      day = dayAfterTomorrow.getDate();
    } else if (match[0].includes('下周')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      year = nextWeek.getFullYear();
      month = nextWeek.getMonth() + 1;
      day = nextWeek.getDate();
    } else if (match[0].includes('下个月')) {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      year = nextMonth.getFullYear();
      month = nextMonth.getMonth() + 1;
      day = 1;
    } else if (match[0].includes('明年')) {
      year = now.getFullYear() + 1;
      month = 1;
      day = 1;
    } else if (match[0].match(/^\d+天后$/)) {
      const number = parseInt(match[0]);
      if (!isNaN(number)) {
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + number);
        year = futureDate.getFullYear();
        month = futureDate.getMonth() + 1;
        day = futureDate.getDate();
      }
    } else if (match[0].match(/^\d+周后$/)) {
      const number = parseInt(match[0]);
      if (!isNaN(number)) {
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + number * 7);
        year = futureDate.getFullYear();
        month = futureDate.getMonth() + 1;
        day = futureDate.getDate();
      }
    } else if (match[0].match(/^\d+年后$/)) {
      const number = parseInt(match[0]);
      if (!isNaN(number)) {
        const futureDate = new Date(now);
        futureDate.setFullYear(futureDate.getFullYear() + number);
        year = futureDate.getFullYear();
        month = futureDate.getMonth() + 1;
        day = futureDate.getDate();
      }
    }

    // 验证日期
    if (!year || !month || !day) {
      return null;
    }

    // 格式化为本地日期字符串（避免时区转换问题）
    const pad = (n) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  /**
   * 解析时间
   * @param {Array} match - 正则匹配结果
   * @returns {string|null>} - 时间字符串
   */
  parseTime (match) {
    if (!match) return null;

    const timeText = match[0];

    // 处理相对时间
    if (timeText.includes('上午') || timeText.includes('早上') || timeText.includes('凌晨')) {
      return '09:00';
    } else if (timeText.includes('下午')) {
      return '14:00';
    } else if (timeText.includes('晚上') || timeText.includes('中午')) {
      return '18:00';
    } else {
      // 处理绝对时间格式
      // 检查是否有捕获组
      // 格式1: HH:mm 或 HH：mm (捕获组1和2)
      if (match[1] !== undefined && match[2] !== undefined) {
        const hours = String(match[1]).padStart(2, '0');
        const minutes = String(match[2]).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      // 格式2: HH点mm分 或 HH点 (捕获组3和4)
      if (match[3] !== undefined) {
        const hours = String(match[3]).padStart(2, '0');
        const minutes = match[4] !== undefined ? String(match[4]).padStart(2, '0') : '00';
        return `${hours}:${minutes}`;
      }
      return timeText;
    }
  }

  /**
   * 提取事件标题
   * @param {string} line - 文本行
   * @param {Array} dateMatch - 日期匹配
   * @param {Array} timeMatch - 时间匹配
   * @returns {string} - 事件标题
   */
  extractTitle (line, dateMatch, timeMatch) {
    let title = line;

    // 移除日期部分
    if (dateMatch) {
      title = title.replace(dateMatch[0], '').trim();
    }

    // 移除时间部分
    if (timeMatch) {
      title = title.replace(timeMatch[0], '').trim();
    }

    // 移除常见连接词
    const connectors = ['的', '在', '有', '和', '与', '要', '去', '到', '是'];
    connectors.forEach(connector => {
      title = title.replace(new RegExp(`^${connector}`), '').trim();
    });

    // 如果标题为空，使用默认值
    if (!title) {
      return '未命名事件';
    }

    // 限制标题长度
    if (title.length > 200) {
      title = title.substring(0, 200);
    }

    return title;
  }

  /**
   * 推断事件类型
   * @param {string} text - 文本
   * @returns {string} - 事件类型
   */
  inferEventType (text) {
    for (const [type, regex] of Object.entries(this.typeRegexMap)) {
      if (regex.test(text)) return type;
    }
    return 'personal';
  }

  /**
   * 推断事件优先级
   * @param {string} text - 文本
   * @returns {string} - 优先级
   */
  inferPriority (text) {
    if (this.priorityRegex.high.test(text)) return 'high';
    if (this.priorityRegex.medium.test(text)) return 'medium';
    return 'low';
  }

  /**
   * 组合日期和时间
   * @param {string} date - 日期字符串 (YYYY-MM-DD 格式)
   * @param {string} time - 时间字符串 (HH:mm 格式)
   * @returns {string} - ISO日期时间字符串（本地时间格式）
   */
  combineDateTime (date, time) {
    if (!date) return null;

    // 解析日期字符串
    const [year, month, day] = date.split('-').map(Number);

    let hours = 9;
    let minutes = 0;

    if (time) {
      const timeParts = time.split(':').map(Number);
      hours = timeParts[0];
      minutes = timeParts[1];
    }

    // 格式化为本地时间字符串（避免时区转换问题）
    const pad = (n) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00`;
  }

  /**
   * 计算结束时间
   * @param {string} dateOrStartDate - 日期字符串或完整的开始日期时间
   * @param {string|null} time - 时间字符串（可选）
   * @returns {string} - 结束日期时间字符串
   */
  calculateEndDate (dateOrStartDate, time = null) {
    if (!dateOrStartDate) return null;

    let year, month, day, hours, minutes;

    // 判断是完整日期时间还是单独日期
    if (dateOrStartDate.includes('T')) {
      // 完整日期时间格式 YYYY-MM-DDTHH:mm:ss
      const [datePart, timePart] = dateOrStartDate.split('T');
      [year, month, day] = datePart.split('-').map(Number);
      [hours, minutes] = timePart.split(':').map(Number);
    } else {
      // 单独日期格式 YYYY-MM-DD
      [year, month, day] = dateOrStartDate.split('-').map(Number);
      if (time) {
        [hours, minutes] = time.split(':').map(Number);
      } else {
        hours = 9;
        minutes = 0;
      }
    }

    // 创建本地日期对象进行计算
    const startObj = new Date(year, month - 1, day, hours, minutes, 0);

    // 默认持续1小时
    const endObj = new Date(startObj.getTime() + DEFAULT_EVENT_DURATION_MINUTES * 60 * 1000);

    // 格式化为本地时间字符串
    const pad = (n) => String(n).padStart(2, '0');
    return `${endObj.getFullYear()}-${pad(endObj.getMonth() + 1)}-${pad(endObj.getDate())}T${pad(endObj.getHours())}:${pad(endObj.getMinutes())}:00`;
  }

  /**
   * 事件去重
   * @param {Array} events - 事件列表
   * @returns {Array} - 去重后的事件列表
   */
  deduplicateEvents (events) {
    const seen = new Map();
    const unique = [];

    for (const event of events) {
      // 生成唯一键（标题+日期）
      const key = `${event.title}_${event.startDate}`;

      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(event);
      }
    }

    return unique;
  }

  /**
   * 生成事件ID
   * @returns {string} - UUID
   */
  generateEventId () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 解析AI响应
   * @param {string} response - AI响应文本
   * @returns {Object>} - 解析结果
   */
  parseAIResponse (response) {
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        // 验证数据结构
        if (parsed.events && Array.isArray(parsed.events)) {
          return {
            events: parsed.events,
            confidence: parsed.confidence || 0.85
          };
        }
      }

      // 如果无法解析JSON，返回空结果
      return {
        events: [],
        confidence: 0
      };
    } catch (error) {
      console.error('解析AI响应失败:', error);
      return {
        events: [],
        confidence: 0
      };
    }
  }

  /**
   * 批量提取事件
   * @param {Array} conversations - 对话列表
   * @returns {Promise<Object>} - 提取结果
   */
  async extractEventsBatch (conversations) {
    console.log(`批量提取事件，对话数: ${conversations.length}`);

    const allEvents = [];
    let successCount = 0;

    for (const conversation of conversations) {
      try {
        const result = await this.extractEvents(conversation);

        if (result.success) {
          allEvents.push(...result.events);
          successCount++;
        }
      } catch (error) {
        console.error('提取单个对话事件失败:', error);
      }
    }

    // 去重
    const uniqueEvents = this.deduplicateEvents(allEvents);

    return {
      success: successCount > 0,
      events: uniqueEvents,
      total: allEvents.length,
      unique: uniqueEvents.length,
      duplicates: allEvents.length - uniqueEvents.length
    };
  }

  /**
   * 获取提取统计
   * @param {Array} conversations - 对话列表
   * @returns {Promise<Object>} - 统计信息
   */
  async getExtractionStats (conversations) {
    const result = await this.extractEventsBatch(conversations);

    return {
      totalConversations: conversations.length,
      extractedEvents: result.events.length,
      successRate: (result.success / conversations.length * 100).toFixed(1),
      averageConfidence: result.events.reduce((sum, event) => sum + (event.confidence || 0), 0) / result.events.length,
      sourceDistribution: this.analyzeSourceDistribution(conversations)
    };
  }

  /**
   * 分析提取来源分布
   * @param {Array} conversations - 对话列表
   * @returns {Object>} - 来源分布
   */
  analyzeSourceDistribution (conversations) {
    const distribution = {
      ai: 0,
      rules: 0,
      mixed: 0
    };

    for (let i = 0; i < conversations.length; i++) {
      if (this.aiService) {
        distribution.ai++;
      } else {
        distribution.rules++;
      }
    }

    return distribution;
  }
}

// 创建全局单例
const eventExtractionService = new EventExtractionService();

export { EventExtractionService };
export default eventExtractionService;
