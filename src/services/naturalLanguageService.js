/**
 * 自然语言日程创建服务
 * 提供自然语言解析、意图识别、实体提取等功能
 */

/**
 * 意图识别器
 * 识别用户输入的意图类型
 */
class IntentRecognizer {
  constructor () {
    // 意图识别模式
    this.patterns = {
      CREATE_EVENT: [
        /(?:创建|添加|安排|设置|预约|新建).{0,5}(?:日程|事件|会议|提醒|任务|约会)/i,
        /(?:明天|后天|下周|今天).{0,10}(?:有|要|需要|准备).{0,5}(?:会|做|去)/i,
        /(?:记得|提醒|别忘了).{0,10}(?:明天|后天|下周)/i,
        /(?:帮我|给我).{0,5}(?:记|建|加).{0,5}(?:个|一下)/i
      ],
      QUERY_SCHEDULE: [
        /(?:查看|查询|看看).{0,5}(?:日程|安排|计划|有什么)/i,
        /(?:明天|后天|下周).{0,5}(?:有什么|干什么|安排)/i,
        /(?:我).{0,3}(?:今天|明天).{0,3}(?:要|需要).{0,3}(?:做|干)/i
      ],
      MODIFY_EVENT: [
        /(?:修改|更改|调整|删除|取消).{0,5}(?:日程|事件|会议)/i,
        /(?:把|将).{0,5}(?:改|换|调).{0,5}(?:到|成|为)/i
      ]
    };
  }

  /**
   * 识别意图
   * @param {string} text - 用户输入文本
   * @returns {string} 意图类型
   */
  recognize (text) {
    // 第一阶段：规则匹配
    for (const [intent, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return intent.toLowerCase();
        }
      }
    }

    // 默认返回聊天意图
    return 'chat';
  }

  /**
   * 获取置信度
   * @param {string} text - 用户输入文本
   * @param {string} intent - 识别的意图
   * @returns {number} 置信度 0-1
   */
  getConfidence (text, intent) {
    if (intent === 'chat') return 0.3;

    const patterns = this.patterns[intent.toUpperCase()];
    if (!patterns) return 0.5;

    // 计算匹配度
    let matchCount = 0;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        matchCount++;
      }
    }

    return Math.min(0.5 + (matchCount / patterns.length) * 0.5, 0.9);
  }
}

/**
 * 实体提取器
 * 从文本中提取时间、地点、人物等实体信息
 */
class EntityExtractor {
  constructor () {
    // 实体提取模式
    this.patterns = {
      // 时间模式
      time: {
        // 绝对时间：2026年2月1日 15:00
        absolute: /(\d{4}年)?(\d{1,2}月)(\d{1,2}日)?[\s,，]*(\d{1,2})[:：点](\d{0,2})?/,
        // 相对时间：明天、后天、下周
        relative: /(今天|明天|后天|大后天|本周|下周|下下周)/,
        // 星期：周一、周二...
        weekday: /(周一|周二|周三|周四|周五|周六|周日|星期[一二三四五六日])/,
        // 时间段：早上、上午、下午、晚上
        dayTime: /(早上|上午|中午|下午|晚上|凌晨)(\d{1,2})?[:：点]?(\d{0,2})?/,
        // 持续时间：持续2小时
        duration: /(\d+)[\s]*(?:个)?(小时|分钟|分|天|周)/,
        // 重复规则：每天、每周
        recurrence: /(每天|每周|每月|每个工作日|每个周末)/
      },
      // 地点模式：在会议室、去国贸
      location: /(?:在|去|到|位于)[\s]*([^，。,]+?)(?:和|与|跟|见面|开会|吃饭|等|$)/,
      // 人物模式：和张三、与李四
      person: /(?:和|与|跟|同)[\s]*([^，。,]+?)(?:一起|见面|开会|吃饭|等|$)/,
      // 事件类型关键词
      eventType: /(会议|约会|任务|提醒|生日|纪念日|聚餐|面试|运动|看病|购物|旅游|出差)/
    };

    // 时间段默认时间映射
    this.timeKeywords = {
      早上: { hour: 8, minute: 0 },
      上午: { hour: 9, minute: 0 },
      中午: { hour: 12, minute: 0 },
      下午: { hour: 14, minute: 0 },
      晚上: { hour: 19, minute: 0 },
      凌晨: { hour: 6, minute: 0 }
    };
  }

  /**
   * 提取所有实体
   * @param {string} text - 用户输入文本
   * @returns {Object} 提取的实体信息
   */
  extract (text) {
    return {
      time: this.extractTime(text),
      location: this.extractLocation(text),
      attendees: this.extractAttendees(text),
      eventType: this.extractEventType(text),
      title: this.extractTitle(text)
    };
  }

  /**
   * 提取时间信息
   * @param {string} text - 用户输入文本
   * @returns {Object} 时间信息
   */
  // eslint-disable-next-line complexity
  extractTime (text) {
    const timeInfo = {
      startTime: null,
      endTime: null,
      isAllDay: false,
      recurrence: null,
      confidence: 0
    };

    // 解析相对时间
    const relativeMatch = text.match(this.patterns.time.relative);
    if (relativeMatch) {
      timeInfo.startTime = this.parseRelativeTime(relativeMatch[1]);
      timeInfo.confidence = 0.7;
    }

    // 解析绝对时间
    const absoluteMatch = text.match(this.patterns.time.absolute);
    if (absoluteMatch) {
      timeInfo.startTime = this.parseAbsoluteTime(absoluteMatch);
      timeInfo.confidence = 0.9;
    }

    // 解析星期
    const weekdayMatch = text.match(this.patterns.time.weekday);
    if (weekdayMatch && !timeInfo.startTime) {
      timeInfo.startTime = this.parseWeekday(weekdayMatch[1]);
      timeInfo.confidence = 0.6;
    }

    // 解析时间段关键词并调整时间
    const dayTimeMatch = text.match(this.patterns.time.dayTime);
    if (dayTimeMatch && timeInfo.startTime) {
      const timeAdjustment = this.parseDayTime(dayTimeMatch);
      if (timeAdjustment) {
        timeInfo.startTime.setHours(timeAdjustment.hour, timeAdjustment.minute);
        timeInfo.confidence = Math.max(timeInfo.confidence, 0.8);
      }
    }

    // 解析具体时间（如"3点"）
    const specificTimeMatch = text.match(/(\d{1,2})[:：点](\d{0,2})?/);
    if (specificTimeMatch && timeInfo.startTime) {
      const hour = parseInt(specificTimeMatch[1]);
      const minute = parseInt(specificTimeMatch[2]) || 0;
      timeInfo.startTime.setHours(hour, minute);
      timeInfo.confidence = Math.max(timeInfo.confidence, 0.85);
    }

    // 解析持续时间
    const durationMatch = text.match(this.patterns.time.duration);
    if (durationMatch && timeInfo.startTime) {
      timeInfo.endTime = this.calculateEndTime(
        timeInfo.startTime,
        parseInt(durationMatch[1]),
        durationMatch[2]
      );
    }

    // 默认结束时间（1小时后）
    if (timeInfo.startTime && !timeInfo.endTime) {
      timeInfo.endTime = new Date(timeInfo.startTime.getTime() + 60 * 60 * 1000);
    }

    // 解析重复规则
    const recurrenceMatch = text.match(this.patterns.time.recurrence);
    if (recurrenceMatch) {
      timeInfo.recurrence = this.parseRecurrence(recurrenceMatch[1]);
    }

    return timeInfo;
  }

  /**
   * 解析相对时间
   * @param {string} relativeText - 相对时间文本
   * @returns {Date} 解析后的日期
   */
  parseRelativeTime (relativeText) {
    const now = new Date();
    const result = new Date(now);
    result.setHours(9, 0, 0, 0); // 默认上午9点

    switch (relativeText) {
      case '今天':
        break;
      case '明天':
        result.setDate(result.getDate() + 1);
        break;
      case '后天':
        result.setDate(result.getDate() + 2);
        break;
      case '大后天':
        result.setDate(result.getDate() + 3);
        break;
      case '本周':
        // 保持本周
        break;
      case '下周':
        result.setDate(result.getDate() + 7);
        break;
      case '下下周':
        result.setDate(result.getDate() + 14);
        break;
    }

    return result;
  }

  /**
   * 解析绝对时间
   * @param {Array} match - 正则匹配结果
   * @returns {Date} 解析后的日期
   */
  parseAbsoluteTime (match) {
    const now = new Date();
    const year = match[1] ? parseInt(match[1]) : now.getFullYear();
    const month = parseInt(match[2]) - 1; // 月份从0开始
    const day = match[3] ? parseInt(match[3]) : now.getDate();
    const hour = match[4] ? parseInt(match[4]) : 9;
    const minute = match[5] ? parseInt(match[5]) : 0;

    return new Date(year, month, day, hour, minute);
  }

  /**
   * 解析星期
   * @param {string} weekdayText - 星期文本
   * @returns {Date} 解析后的日期
   */
  parseWeekday (weekdayText) {
    const now = new Date();
    const result = new Date(now);
    result.setHours(9, 0, 0, 0);

    const weekdayMap = {
      周一: 1,
      星期二: 2,
      周二: 2,
      周三: 3,
      周四: 4,
      周五: 5,
      周六: 6,
      周日: 0,
      星期天: 0
    };

    const targetDay = weekdayMap[weekdayText];
    if (targetDay !== undefined) {
      const currentDay = result.getDay();
      let daysUntilTarget = targetDay - currentDay;
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7; // 下周
      }
      result.setDate(result.getDate() + daysUntilTarget);
    }

    return result;
  }

  /**
   * 解析时间段关键词
   * @param {Array} match - 正则匹配结果
   * @returns {Object} 时间对象
   */
  parseDayTime (match) {
    const keyword = match[1];
    const baseTime = this.timeKeywords[keyword];

    if (!baseTime) return null;

    // 如果有具体时间，使用具体时间
    if (match[2]) {
      return {
        hour: parseInt(match[2]),
        minute: parseInt(match[3]) || 0
      };
    }

    return baseTime;
  }

  /**
   * 计算结束时间
   * @param {Date} startTime - 开始时间
   * @param {number} duration - 持续时间数值
   * @param {string} unit - 时间单位
   * @returns {Date} 结束时间
   */
  calculateEndTime (startTime, duration, unit) {
    const endTime = new Date(startTime);

    switch (unit) {
      case '小时':
        endTime.setHours(endTime.getHours() + duration);
        break;
      case '分钟':
      case '分':
        endTime.setMinutes(endTime.getMinutes() + duration);
        break;
      case '天':
        endTime.setDate(endTime.getDate() + duration);
        break;
      case '周':
        endTime.setDate(endTime.getDate() + duration * 7);
        break;
    }

    return endTime;
  }

  /**
   * 解析重复规则
   * @param {string} recurrenceText - 重复规则文本
   * @returns {Object} 重复规则对象
   */
  parseRecurrence (recurrenceText) {
    const recurrenceMap = {
      每天: { frequency: 'daily', interval: 1 },
      每周: { frequency: 'weekly', interval: 1 },
      每月: { frequency: 'monthly', interval: 1 },
      每个工作日: { frequency: 'weekly', interval: 1, days: [1, 2, 3, 4, 5] },
      每个周末: { frequency: 'weekly', interval: 1, days: [0, 6] }
    };
    return recurrenceMap[recurrenceText] || null;
  }

  /**
   * 提取地点
   * @param {string} text - 用户输入文本
   * @returns {string|null} 地点信息
   */
  extractLocation (text) {
    const match = text.match(this.patterns.location);
    return match ? match[1].trim() : null;
  }

  /**
   * 提取参与人
   * @param {string} text - 用户输入文本
   * @returns {Array|null} 参与人列表
   */
  extractAttendees (text) {
    const match = text.match(this.patterns.person);
    if (!match) return null;

    // 解析多个人名
    const names = match[1].split(/[,，、和与跟]/).map(s => s.trim()).filter(s => s);
    return names.length > 0 ? names : null;
  }

  /**
   * 提取事件类型
   * @param {string} text - 用户输入文本
   * @returns {string|null} 事件类型
   */
  extractEventType (text) {
    const match = text.match(this.patterns.eventType);
    return match ? match[1] : null;
  }

  /**
   * 提取事件标题
   * @param {string} text - 用户输入文本
   * @returns {string|null} 事件标题
   */
  extractTitle (text) {
    // 首先尝试提取事件类型作为标题
    const eventType = this.extractEventType(text);
    if (eventType) {
      return eventType;
    }

    // 尝试提取动词+名词结构
    const verbPatterns = [
      /(?:要|需要|准备|去|参加)([^，。,]+?)(?:在|于|和|与|$)/,
      /(?:做|干|办|处理)([^，。,]+?)(?:在|于|和|与|$)/
    ];

    for (const pattern of verbPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }
}

/**
 * 自然语言服务主类
 * 整合意图识别和实体提取功能
 */
class NaturalLanguageService {
  constructor () {
    this.intentRecognizer = new IntentRecognizer();
    this.entityExtractor = new EntityExtractor();
  }

  /**
   * 解析自然语言输入
   * @param {string} input - 用户输入文本
   * @param {Object} context - 上下文信息
   * @returns {Object} 解析结果
   */
  async parse (input, context = {}) {
    const result = {
      intent: null,
      event: null,
      confidence: 0,
      missingInfo: [],
      rawInput: input
    };

    try {
      // 1. 意图识别
      result.intent = this.intentRecognizer.recognize(input);
      result.confidence = this.intentRecognizer.getConfidence(input, result.intent);

      // 如果不是创建事件意图，直接返回
      if (result.intent !== 'create_event') {
        return result;
      }

      // 2. 实体提取
      const entities = this.entityExtractor.extract(input);

      // 3. 构建事件对象
      result.event = this.buildEventObject(entities, input);

      // 4. 更新置信度
      result.confidence = this.calculateConfidence(result.confidence, entities);

      // 5. 检查缺失信息
      result.missingInfo = this.checkMissingInfo(result.event);
    } catch (error) {
      console.error('自然语言解析失败:', error);
      result.error = error.message;
      result.intent = 'chat'; // 出错时转为普通聊天
    }

    return result;
  }

  /**
   * 构建事件对象
   * @param {Object} entities - 提取的实体
   * @param {string} originalText - 原始输入
   * @returns {Object} 事件对象
   */
  buildEventObject (entities, originalText) {
    const event = {
      title: entities.title || entities.eventType || '新事件',
      startTime: entities.time?.startTime?.toISOString(),
      endTime: entities.time?.endTime?.toISOString(),
      location: entities.location,
      attendees: entities.attendees,
      description: originalText,
      recurrence: entities.time?.recurrence,
      isAllDay: entities.time?.isAllDay || false
    };

    return event;
  }

  /**
   * 计算整体置信度
   * @param {number} intentConfidence - 意图识别置信度
   * @param {Object} entities - 提取的实体
   * @returns {number} 整体置信度
   */
  calculateConfidence (intentConfidence, entities) {
    let entityScore = 0;
    let entityCount = 0;

    // 时间信息权重最高
    if (entities.time?.startTime) {
      entityScore += entities.time.confidence * 0.5;
      entityCount += 0.5;
    }

    // 标题
    if (entities.title || entities.eventType) {
      entityScore += 0.3;
      entityCount += 0.3;
    }

    // 其他信息
    if (entities.location) {
      entityScore += 0.1;
      entityCount += 0.1;
    }
    if (entities.attendees) {
      entityScore += 0.1;
      entityCount += 0.1;
    }

    // 计算加权平均
    const entityConfidence = entityCount > 0 ? entityScore / entityCount : 0;

    // 综合置信度：意图识别占40%，实体提取占60%
    return intentConfidence * 0.4 + entityConfidence * 0.6;
  }

  /**
   * 检查缺失信息
   * @param {Object} event - 事件对象
   * @returns {Array} 缺失信息列表
   */
  checkMissingInfo (event) {
    const missing = [];

    if (!event.title || event.title === '新事件') {
      missing.push('事件标题');
    }
    if (!event.startTime) {
      missing.push('开始时间');
    }

    return missing;
  }

  /**
   * 验证事件数据
   * @param {Object} event - 事件对象
   * @returns {Object} 验证结果
   */
  validateEvent (event) {
    const errors = [];
    const warnings = [];

    // 验证标题
    if (!event.title || event.title.trim().length === 0) {
      errors.push('事件标题不能为空');
    }

    // 验证时间
    if (!event.startTime) {
      errors.push('开始时间不能为空');
    } else {
      const startDate = new Date(event.startTime);
      const now = new Date();

      // 检查是否是过去时间（允许5分钟误差）
      if (startDate.getTime() < now.getTime() - 5 * 60 * 1000) {
        warnings.push('开始时间已经过去');
      }
    }

    // 验证结束时间
    if (event.endTime && event.startTime) {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);

      if (endDate.getTime() <= startDate.getTime()) {
        errors.push('结束时间必须晚于开始时间');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// 导出服务
export default NaturalLanguageService;
export { IntentRecognizer, EntityExtractor };
