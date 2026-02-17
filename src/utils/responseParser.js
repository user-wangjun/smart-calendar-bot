/**
 * 响应解析器模块
 * 负责解析OpenRouter API返回的生成文本和元数据
 */

/**
 * 完成原因枚举
 */
const FinishReason = {
  STOP: 'stop', // 正常完成
  LENGTH: 'length', // 达到最大token限制
  CONTENT_FILTER: 'content_filter', // 内容被过滤
  TOOL_CALLS: 'tool_calls', // 工具调用完成
  ERROR: 'error' // 发生错误
};

/**
 * 响应解析器类
 */
class ResponseParser {
  constructor () {
    this.keyInfoExtractors = [
      this.extractEvents,
      this.extractEmotions,
      this.extractSuggestions,
      this.extractDates,
      this.extractLocations
    ];
  }

  /**
   * 解析API响应
   * @param {Object} response - API响应对象
   * @returns {Object} 解析结果
   */
  parseResponse (response) {
    // 验证响应结构
    this.validateResponse(response);

    // 提取主要数据
    const choice = response.choices[0];
    const message = choice.message;

    // 构建解析结果
    const result = {
      content: message.content,
      role: message.role,
      metadata: this.extractMetadata(response, choice),
      keyInfo: this.extractKeyInfo(message.content)
    };

    return result;
  }

  /**
   * 验证响应结构
   * @param {Object} response - API响应对象
   * @throws {Error} 响应格式无效时抛出错误
   */
  validateResponse (response) {
    if (!response || typeof response !== 'object') {
      throw new Error('响应格式无效：响应不是对象');
    }

    if (!response.choices || !Array.isArray(response.choices)) {
      throw new Error('响应格式无效：缺少choices字段');
    }

    if (response.choices.length === 0) {
      throw new Error('响应格式无效：choices数组为空');
    }

    const choice = response.choices[0];

    if (!choice.message || typeof choice.message !== 'object') {
      throw new Error('响应格式无效：缺少message字段');
    }

    if (!choice.message.content || typeof choice.message.content !== 'string') {
      throw new Error('响应格式无效：缺少content字段');
    }
  }

  /**
   * 提取元数据
   * @param {Object} response - 完整响应对象
   * @param {Object} choice - 选择对象
   * @returns {Object} 元数据
   */
  extractMetadata (response, choice) {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      finishReason: choice.finish_reason,
      finishReasonText: this.getFinishReasonText(choice.finish_reason),
      usage: this.extractUsage(response.usage)
    };
  }

  /**
   * 提取使用信息
   * @param {Object} usage - 使用信息对象
   * @returns {Object} 格式化的使用信息
   */
  extractUsage (usage) {
    if (!usage) {
      return {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      };
    }

    return {
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0
    };
  }

  /**
   * 获取完成原因的文本描述
   * @param {string} reason - 完成原因代码
   * @returns {string} 文本描述
   */
  getFinishReasonText (reason) {
    const reasonMap = {
      [FinishReason.STOP]: '正常完成',
      [FinishReason.LENGTH]: '达到最大token限制',
      [FinishReason.CONTENT_FILTER]: '内容被过滤',
      [FinishReason.TOOL_CALLS]: '工具调用完成',
      [FinishReason.ERROR]: '发生错误'
    };

    return reasonMap[reason] || '未知原因';
  }

  /**
   * 提取关键信息
   * 从生成内容中提取事件、情感、建议等关键信息
   * @param {string} content - 生成内容
   * @returns {Object} 关键信息对象
   */
  extractKeyInfo (content) {
    const keyInfo = {
      events: [],
      emotions: [],
      suggestions: [],
      dates: [],
      locations: []
    };

    // 使用所有提取器提取信息
    for (const extractor of this.keyInfoExtractors) {
      const extracted = extractor.call(this, content);

      // 合并提取结果
      for (const key in extracted) {
        if (keyInfo[key]) {
          keyInfo[key].push(...extracted[key]);
        }
      }
    }

    // 去重
    for (const key in keyInfo) {
      keyInfo[key] = [...new Set(keyInfo[key])];
    }

    return keyInfo;
  }

  /**
   * 提取事件信息
   * @param {string} content - 生成内容
   * @returns {Object} 提取的事件
   */
  extractEvents (content) {
    const events = [];

    // 事件模式：日期/时间 + 事件类型
    const eventPatterns = [
      /(\d{1,2}月\d{1,2}日|明天|后天|下周|下个月).+?(会议|约会|活动|任务|工作|学习|运动|聚会)/g,
      /(\d{1,2}:\d{2}).+?(会议|约会|活动|任务|工作|学习|运动|聚会)/g,
      /(今天|今晚|明天早上|明天下午|明天晚上).+?(会议|约会|活动|任务)/g
    ];

    for (const pattern of eventPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        events.push(...matches);
      }
    }

    return { events };
  }

  /**
   * 提取情感信息
   * @param {string} content - 生成内容
   * @returns {Object} 提取的情感
   */
  extractEmotions (content) {
    const emotions = [];

    // 积极情感
    const positiveEmotions = [
      '开心', '快乐', '兴奋', '激动', '满足', '幸福',
      '愉快', '欣喜', '喜悦', '乐观', '自信'
    ];

    // 消极情感
    const negativeEmotions = [
      '难过', '沮丧', '失望', '焦虑', '紧张',
      '担心', '害怕', '生气', '愤怒', '悲伤'
    ];

    // 平静情感
    const neutralEmotions = [
      '平静', '放松', '舒适', '安心', '淡定',
      '平静', '冷静', '理智', '清醒'
    ];

    // 检查积极情感
    for (const emotion of positiveEmotions) {
      if (content.includes(emotion)) {
        emotions.push({ emotion, type: 'positive' });
      }
    }

    // 检查消极情感
    for (const emotion of negativeEmotions) {
      if (content.includes(emotion)) {
        emotions.push({ emotion, type: 'negative' });
      }
    }

    // 检查平静情感
    for (const emotion of neutralEmotions) {
      if (content.includes(emotion)) {
        emotions.push({ emotion, type: 'neutral' });
      }
    }

    return { emotions };
  }

  /**
   * 提取建议信息
   * @param {string} content - 生成内容
   * @returns {Object} 提取的建议
   */
  extractSuggestions (content) {
    const suggestions = [];

    // 建议模式
    const suggestionPatterns = [
      /建议.+?[。！？]/g,
      /可以尝试.+?[。！？]/g,
      /推荐.+?[。！？]/g,
      /不妨.+?[。！？]/g
    ];

    for (const pattern of suggestionPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        suggestions.push(...matches);
      }
    }

    return { suggestions };
  }

  /**
   * 提取日期信息
   * @param {string} content - 生成内容
   * @returns {Object} 提取的日期
   */
  extractDates (content) {
    const dates = [];

    // 日期模式
    const datePatterns = [
      /\d{4}年\d{1,2}月\d{1,2}日/g,
      /\d{1,2}月\d{1,2}日/g,
      /明天|后天|下周|下个月|今天|昨天/g,
      /周[一二三四五六七]/g
    ];

    for (const pattern of datePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        dates.push(...matches);
      }
    }

    return { dates };
  }

  /**
   * 提取位置信息
   * @param {string} content - 生成内容
   * @returns {Object} 提取的位置
   */
  extractLocations (content) {
    const locations = [];

    // 位置模式
    const locationPatterns = [
      /在.+?(公司|家|学校|医院|商场|公园|餐厅|咖啡厅)/g,
      /去.+?(公司|家|学校|医院|商场|公园|餐厅|咖啡厅)/g,
      /北京|上海|广州|深圳|杭州|成都|武汉/g
    ];

    for (const pattern of locationPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        locations.push(...matches);
      }
    }

    return { locations };
  }

  /**
   * 格式化解析结果
   * @param {Object} result - 解析结果
   * @returns {string} 格式化的字符串
   */
  formatResult (result) {
    let formatted = '';

    // 添加内容
    formatted += `内容: ${result.content}\n\n`;

    // 添加元数据
    formatted += '元数据:\n';
    formatted += `  模型: ${result.metadata.model}\n`;
    formatted += `  完成原因: ${result.metadata.finishReasonText}\n`;
    formatted += `  Token使用: ${result.metadata.usage.totalTokens} ` +
                `(输入: ${result.metadata.usage.promptTokens}, ` +
                `输出: ${result.metadata.usage.completionTokens})\n\n`;

    // 添加关键信息
    if (result.keyInfo) {
      formatted += '关键信息:\n';

      if (result.keyInfo.events.length > 0) {
        formatted += `  事件: ${result.keyInfo.events.join(', ')}\n`;
      }

      if (result.keyInfo.emotions.length > 0) {
        const emotions = result.keyInfo.emotions
          .map(e => `${e.emotion}(${e.type})`)
          .join(', ');
        formatted += `  情感: ${emotions}\n`;
      }

      if (result.keyInfo.suggestions.length > 0) {
        formatted += `  建议: ${result.keyInfo.suggestions.join('; ')}\n`;
      }

      if (result.keyInfo.dates.length > 0) {
        formatted += `  日期: ${result.keyInfo.dates.join(', ')}\n`;
      }

      if (result.keyInfo.locations.length > 0) {
        formatted += `  位置: ${result.keyInfo.locations.join(', ')}\n`;
      }
    }

    return formatted;
  }

  /**
   * 添加自定义提取器
   * @param {Function} extractor - 提取器函数
   */
  addExtractor (extractor) {
    if (typeof extractor === 'function') {
      this.keyInfoExtractors.push(extractor);
    }
  }

  /**
   * 移除提取器
   * @param {Function} extractor - 要移除的提取器
   */
  removeExtractor (extractor) {
    const index = this.keyInfoExtractors.indexOf(extractor);
    if (index > -1) {
      this.keyInfoExtractors.splice(index, 1);
    }
  }
}

// 导出
export default ResponseParser;
export { FinishReason };
