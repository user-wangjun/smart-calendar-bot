/**
 * ID生成器工具
 * 用于生成唯一标识符
 */

/**
 * 生成随机ID
 * @param {number} length - ID长度，默认8位
 * @returns {string} 随机ID字符串
 */
export function generateId (length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成时间戳ID
 * @returns {string} 基于时间戳的ID
 */
export function generateTimestampId () {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * 生成UUID v4
 * @returns {string} UUID字符串
 */
export function generateUUID () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 生成短UUID（8位）
 * @returns {string} 短UUID
 */
export function generateShortUUID () {
  return generateUUID().replace(/-/g, '').substring(0, 8);
}

export default {
  generateId,
  generateTimestampId,
  generateUUID,
  generateShortUUID
};
