/**
 * AI助手品牌配置
 * 定义AI助手的名称、品牌信息和交互话术
 */

/**
 * 主名称配置
 */
export const ASSISTANT_NAME = {
  // 中文名称
  chinese: '小珺',
  // 拼音
  pinyin: 'Xiǎo Jùn',
  // 英文名称
  english: 'Xiaojun',
  // 英文简称
  englishShort: 'Jun',
  // 完整称呼
  fullTitle: '小珺 - 您的智能日程管家',
  // 简称
  shortTitle: '小珺助手'
};

/**
 * 备选名称配置（当主名称不可用时使用）
 */
export const ALTERNATIVE_NAMES = [
  {
    chinese: '小晞',
    pinyin: 'Xiǎo Xī',
    english: 'Xiaoxi',
    meaning: '晨光、新的开始',
    tagline: '点亮您的每一天'
  },
  {
    chinese: '小珩',
    pinyin: 'Xiǎo Héng',
    english: 'Xiaoheng',
    meaning: '平衡、和谐',
    tagline: '平衡您的精彩生活'
  },
  {
    chinese: '小瑾',
    pinyin: 'Xiǎo Jǐn',
    english: 'Xiaojin',
    meaning: '美德、才华',
    tagline: '怀瑾握瑜，智慧相伴'
  }
];

/**
 * 品牌信息
 */
export const BRAND_INFO = {
  // 品牌标语
  tagline: '如玉般温润 · 如友般贴心 · 如专家般专业',
  // 品牌描述
  description: '小珺是您的智能日程管家，以温润如玉的方式帮助您管理时间、规划生活',
  // 核心价值
  coreValues: ['温润', '可靠', '智能', '高雅'],
  // 品牌色彩
  colors: {
    primary: '#5A9A8F', // 玉青
    secondary: '#F5F5F0', // 玉白
    accent: '#D4A574', // 金珀
    dark: '#2C3E3A' // 墨玉
  }
};

/**
 * 欢迎语配置
 */
export const WELCOME_MESSAGES = {
  // 首次欢迎语
  firstTime: `您好！我是${ASSISTANT_NAME.chinese}，您的智能日程管家。我可以帮您管理日程、设置提醒、规划时间。有什么可以帮您的吗？`,

  // 日常欢迎语（根据时间段）
  morning: `早上好！${ASSISTANT_NAME.chinese}已为您准备好今天的日程`,
  afternoon: `下午好！${ASSISTANT_NAME.chinese}随时为您服务`,
  evening: `晚上好！${ASSISTANT_NAME.chinese}帮您回顾今天的安排`,
  night: `夜深了，${ASSISTANT_NAME.chinese}还在这里陪伴您`,

  // 通用欢迎语
  general: `您好，我是${ASSISTANT_NAME.chinese}，有什么可以帮您的吗？`
};

/**
 * 确认话术
 */
export const CONFIRM_MESSAGES = {
  // 记录确认
  recorded: `好的，${ASSISTANT_NAME.chinese}已经为您记录下来`,
  // 提醒确认
  reminderSet: `明白，${ASSISTANT_NAME.chinese}会准时提醒您`,
  // 日程确认
  scheduleConfirmed: `收到，${ASSISTANT_NAME.chinese}已将此安排加入您的日程`,
  // 修改确认
  updated: `已完成修改，${ASSISTANT_NAME.chinese}已更新您的日程`
};

/**
 * 建议话术
 */
export const SUGGESTION_MESSAGES = {
  // 时间建议
  timeSuggestion: `${ASSISTANT_NAME.chinese}建议您提前15分钟出发`,
  // 日程建议
  scheduleSuggestion: `根据您的习惯，${ASSISTANT_NAME.chinese}推荐这个时间`,
  // 优化建议
  optimizationTip: `${ASSISTANT_NAME.chinese}发现您的日程可以优化，需要听听建议吗？`,
  // 提醒建议
  reminderTip: `${ASSISTANT_NAME.chinese}建议您为这个事件设置提醒`
};

/**
 * 道歉话术
 */
export const APOLOGY_MESSAGES = {
  // 未理解
  notUnderstood: `抱歉，${ASSISTANT_NAME.chinese}没有理解您的意思，能再说一遍吗？`,
  // 无法处理
  cannotProcess: `对不起，这个问题${ASSISTANT_NAME.chinese}还需要学习`,
  // 系统错误
  systemError: `抱歉，${ASSISTANT_NAME.chinese}遇到了一点问题，请稍后再试`,
  // 信息不足
  needMoreInfo: `${ASSISTANT_NAME.chinese}需要更多信息才能帮您，可以补充一下吗？`
};

/**
 * 结束语
 */
export const CLOSING_MESSAGES = {
  // 通用结束
  general: `${ASSISTANT_NAME.chinese}随时为您服务`,
  // 感谢
  thanks: `感谢您的使用，${ASSISTANT_NAME.chinese}期待再次为您服务`,
  // 祝福
  blessing: `祝您今天愉快，${ASSISTANT_NAME.chinese}一直在这里`,
  // 晚安
  goodNight: `晚安，${ASSISTANT_NAME.chinese}明天见`
};

/**
 * 功能介绍话术
 */
export const FEATURE_INTRODUCTIONS = {
  // 日程管理
  schedule: `${ASSISTANT_NAME.chinese}可以帮您创建、编辑、删除日程，管理您的时间`,
  // 提醒功能
  reminder: `${ASSISTANT_NAME.chinese}会在合适的时间提醒您重要事项`,
  // 智能建议
  suggestion: `${ASSISTANT_NAME.chinese}会根据您的习惯提供智能建议`,
  // 自然语言
  nlp: `您可以用自然语言告诉${ASSISTANT_NAME.chinese}您的安排，比如"明天下午3点开会"`,
  // 天气集成
  weather: `${ASSISTANT_NAME.chinese}会结合天气信息为您的出行提供建议`
};

/**
 * 错误提示话术
 */
export const ERROR_MESSAGES = {
  // 网络错误
  networkError: `网络连接不稳定，${ASSISTANT_NAME.chinese}无法连接到服务器`,
  // API错误
  apiError: `服务暂时不可用，${ASSISTANT_NAME.chinese}正在努力恢复`,
  // 数据错误
  dataError: `数据加载出错，${ASSISTANT_NAME.chinese}建议您刷新页面重试`,
  // 权限错误
  permissionError: `${ASSISTANT_NAME.chinese}需要您的授权才能继续操作`
};

/**
 * 获取当前时间段的欢迎语
 * @returns {string} 欢迎语
 */
export function getTimeBasedWelcome () {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return WELCOME_MESSAGES.morning;
  } else if (hour >= 12 && hour < 18) {
    return WELCOME_MESSAGES.afternoon;
  } else if (hour >= 18 && hour < 22) {
    return WELCOME_MESSAGES.evening;
  } else {
    return WELCOME_MESSAGES.night;
  }
}

/**
 * 获取带有助手名称的消息
 * @param {string} template - 消息模板，使用{name}作为占位符
 * @returns {string} 替换后的消息
 */
export function formatMessage (template) {
  return template.replace(/{name}/g, ASSISTANT_NAME.chinese);
}

/**
 * 获取完整的品牌介绍
 * @returns {string} 品牌介绍文本
 */
export function getBrandIntroduction () {
  return `${ASSISTANT_NAME.fullTitle}

${BRAND_INFO.tagline}

${BRAND_INFO.description}

核心价值：${BRAND_INFO.coreValues.join(' · ')}`;
}

/**
 * 检查名称配置是否完整
 * @returns {boolean} 配置是否完整
 */
export function validateNameConfig () {
  return !!(
    ASSISTANT_NAME.chinese &&
    ASSISTANT_NAME.pinyin &&
    ASSISTANT_NAME.english &&
    BRAND_INFO.tagline &&
    BRAND_INFO.description
  );
}

/**
 * 导出默认配置对象
 */
export default {
  name: ASSISTANT_NAME,
  alternatives: ALTERNATIVE_NAMES,
  brand: BRAND_INFO,
  messages: {
    welcome: WELCOME_MESSAGES,
    confirm: CONFIRM_MESSAGES,
    suggestion: SUGGESTION_MESSAGES,
    apology: APOLOGY_MESSAGES,
    closing: CLOSING_MESSAGES,
    feature: FEATURE_INTRODUCTIONS,
    error: ERROR_MESSAGES
  },
  getTimeBasedWelcome,
  formatMessage,
  getBrandIntroduction,
  validateNameConfig
};
