/**
 * 密钥校验规则模块
 * 定义各类 API 密钥的格式验证规则
 */

export const KeyValidators = {
  /**
   * OpenRouter API Key 校验
   * 格式: sk-or-v1- 开头，后接长字符串
   */
  OPENROUTER_API_KEY: (key) => {
    if (!key) return false;
    // 允许 sk-or-v1- 开头，或者简单的非空字符串（兼容旧格式或不同厂商）
    // 严格模式: /^sk-or-v1-[a-zA-Z0-9]{64}$/
    return typeof key === 'string' && key.startsWith('sk-or-v1-') && key.length > 30;
  },

  /**
   * 智谱 AI API Key 校验
   * 格式: id.secret (通常是数字.字母数字)
   */
  ZHIPU_API_KEY: (key) => {
    if (!key) return false;
    return /^[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/.test(key);
  },

  /**
   * 高德地图 API Key 校验
   * 格式: 32位字母数字
   */
  AMAP_API_KEY: (key) => {
    if (!key) return false;
    return /^[a-zA-Z0-9]{32}$/.test(key);
  },

  /**
   * 腾讯地图 Key 校验
   * 格式: AAAAA-BBBBB-CCCCC-DDDDD-EEEEE-FFFFF (示例，实际可能不同)
   * 这里使用通用长度校验作为基础
   */
  TENCENT_MAP_KEY: (key) => {
    if (!key) return false;
    return typeof key === 'string' && key.length > 10;
  },

  /**
   * 通用非空校验
   */
  GENERIC_NON_EMPTY: (key) => {
    return typeof key === 'string' && key.length > 0;
  }
};

/**
 * 获取校验器
 * @param {string} keyName 密钥名称
 * @returns {Function} 校验函数
 */
export const getValidator = (keyName) => {
  if (KeyValidators[keyName]) {
    return KeyValidators[keyName];
  }

  // 根据前缀或名称推断
  if (keyName.includes('OPENROUTER')) return KeyValidators.OPENROUTER_API_KEY;
  if (keyName.includes('ZHIPU')) return KeyValidators.ZHIPU_API_KEY;
  if (keyName.includes('AMAP')) return KeyValidators.AMAP_API_KEY;
  if (keyName.includes('TENCENT')) return KeyValidators.TENCENT_MAP_KEY;

  return KeyValidators.GENERIC_NON_EMPTY;
};
