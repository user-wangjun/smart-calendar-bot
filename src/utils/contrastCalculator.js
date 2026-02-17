/**
 * ContrastCalculator - 对比度计算模块
 * @fileoverview 根据WCAG 2.1标准计算对比度，提供高对比度颜色建议
 * @author AI Assistant
 * @date 2026-02-11
 */

/**
 * WCAG 2.1 对比度标准
 */
const WCAG_STANDARDS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3.0,
  AAA_NORMAL: 7.0,
  AAA_LARGE: 4.5
};

/**
 * 对比度计算器类
 * 实现WCAG 2.1对比度计算标准和智能颜色选择
 */
export class ContrastCalculator {
  /**
   * 获取WCAG标准
   * @returns {Object} WCAG标准对象
   */
  static get STANDARDS () {
    return WCAG_STANDARDS;
  }

  /**
   * 创建对比度计算器实例
   */
  constructor () {
    this.cache = new Map();
  }

  /**
   * 将sRGB值转换为线性RGB值
   * @param {number} value - sRGB值 (0-255)
   * @returns {number} 线性RGB值
   */
  sRGBToLinear (value) {
    const sRGB = value / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  }

  /**
   * 计算颜色的相对亮度
   * @param {number} r - 红色通道 (0-255)
   * @param {number} g - 绿色通道 (0-255)
   * @param {number} b - 蓝色通道 (0-255)
   * @returns {number} 相对亮度 (0-1)
   */
  calculateLuminance (r, g, b) {
    const R = this.sRGBToLinear(r);
    const G = this.sRGBToLinear(g);
    const B = this.sRGBToLinear(b);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  /**
   * 计算两个颜色之间的对比度
   * @param {Object} color1 - 第一个颜色 {r, g, b}
   * @param {Object} color2 - 第二个颜色 {r, g, b}
   * @returns {number} 对比度比值 (1-21)
   */
  calculateContrastRatio (color1, color2) {
    const cacheKey = `${color1.r},${color1.g},${color1.b}-${color2.r},${color2.g},${color2.b}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const lum1 = this.calculateLuminance(color1.r, color1.g, color1.b);
    const lum2 = this.calculateLuminance(color2.r, color2.g, color2.b);

    // 对比度公式: (L1 + 0.05) / (L2 + 0.05)，其中L1是较亮的颜色
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    const result = Math.round(ratio * 100) / 100;
    this.cache.set(cacheKey, result);

    return result;
  }

  /**
   * 检查对比度是否符合标准
   * @param {number} ratio - 对比度比值
   * @param {string} level - 标准级别 ('AA', 'AAA')
   * @param {boolean} isLargeText - 是否为大号文本
   * @returns {boolean} 是否符合标准
   */
  meetsStandard (ratio, level = 'AA', isLargeText = false) {
    if (level === 'AAA') {
      return isLargeText
        ? ratio >= ContrastCalculator.STANDARDS.AAA_LARGE
        : ratio >= ContrastCalculator.STANDARDS.AAA_NORMAL;
    }

    return isLargeText
      ? ratio >= ContrastCalculator.STANDARDS.AA_LARGE
      : ratio >= ContrastCalculator.STANDARDS.AA_NORMAL;
  }

  /**
   * 根据背景颜色获取最佳文字颜色
   * @param {Object} bgColor - 背景颜色 {r, g, b}
   * @param {Object} options - 配置选项
   * @returns {Object} 最佳文字颜色配置
   */
  getOptimalTextColor (bgColor, options = {}) {
    const {
      minContrast = ContrastCalculator.STANDARDS.AA_NORMAL,
      preferredLight = { r: 255, g: 255, b: 255 },
      preferredDark = { r: 0, g: 0, b: 0 },
      enhanceShadow = true
    } = options;

    const lightContrast = this.calculateContrastRatio(bgColor, preferredLight);
    const darkContrast = this.calculateContrastRatio(bgColor, preferredDark);

    // 选择对比度更高的颜色
    let optimalColor, contrastRatio, isLight;

    if (lightContrast >= darkContrast) {
      optimalColor = preferredLight;
      contrastRatio = lightContrast;
      isLight = true;
    } else {
      optimalColor = preferredDark;
      contrastRatio = darkContrast;
      isLight = false;
    }

    // 如果对比度不足，尝试增强
    if (contrastRatio < minContrast) {
      const enhanced = this.enhanceContrast(bgColor, isLight, minContrast);
      optimalColor = enhanced.color;
      contrastRatio = enhanced.contrast;
    }

    return {
      color: optimalColor,
      contrastRatio,
      isLight,
      meetsStandard: this.meetsStandard(contrastRatio, 'AA'),
      shadow: enhanceShadow ? this.getTextShadow(bgColor, isLight) : null
    };
  }

  /**
   * 增强对比度
   * @param {Object} bgColor - 背景颜色
   * @param {boolean} isLight - 是否使用浅色文字
   * @param {number} targetContrast - 目标对比度
   * @returns {Object} 增强后的颜色配置
   */
  enhanceContrast (bgColor, isLight, targetContrast) {
    const baseColor = isLight ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
    let bestColor = { ...baseColor };
    let bestContrast = this.calculateContrastRatio(bgColor, baseColor);

    // 如果基础对比度已满足要求，直接返回
    if (bestContrast >= targetContrast) {
      return { color: bestColor, contrast: bestContrast };
    }

    // 尝试调整颜色以提升对比度
    // 对于浅色文字，尝试添加淡色调
    // 对于深色文字，保持纯黑或添加深色调
    const adjustments = [0.9, 0.8, 0.7, 0.6, 0.5];

    for (const factor of adjustments) {
      const adjustedColor = isLight
        ? { r: 255, g: 255, b: Math.round(255 * factor) } // 偏黄白
        : { r: 0, g: 0, b: Math.round(255 * (1 - factor)) }; // 深蓝黑

      const contrast = this.calculateContrastRatio(bgColor, adjustedColor);

      if (contrast > bestContrast) {
        bestContrast = contrast;
        bestColor = adjustedColor;
      }

      if (bestContrast >= targetContrast) {
        break;
      }
    }

    return { color: bestColor, contrast: bestContrast };
  }

  /**
   * 获取文字阴影配置以增强可读性
   * @param {Object} bgColor - 背景颜色
   * @param {boolean} isLightText - 是否为浅色文字
   * @returns {Object} 阴影配置
   */
  getTextShadow (bgColor, isLightText) {
    const shadowColor = isLightText
      ? 'rgba(0, 0, 0, 0.5)'
      : 'rgba(255, 255, 255, 0.5)';

    return {
      color: shadowColor,
      offsetX: 0,
      offsetY: 1,
      blur: 3,
      css: `${shadowColor} 0px 1px 3px`
    };
  }

  /**
   * 分析多个采样点的颜色，确定整体最佳文字颜色
   * @param {Array} samples - 采样点颜色数组
   * @param {Object} options - 配置选项
   * @returns {Object} 综合最佳文字颜色
   */
  analyzeMultipleSamples (samples, options = {}) {
    if (!samples || samples.length === 0) {
      return this.getOptimalTextColor({ r: 128, g: 128, b: 128 }, options);
    }

    // 计算平均颜色
    const avgColor = this.calculateAverageColor(samples);

    // 计算颜色方差，判断背景复杂度
    const variance = this.calculateColorVariance(samples, avgColor);
    const isComplex = variance > 0.1; // 高方差表示复杂背景

    // 找出最亮和最暗的采样点
    let lightest = samples[0];
    let darkest = samples[0];
    let maxLum = this.calculateLuminance(lightest.r, lightest.g, lightest.b);
    let minLum = maxLum;

    for (const sample of samples) {
      const lum = this.calculateLuminance(sample.r, sample.g, sample.b);
      if (lum > maxLum) {
        maxLum = lum;
        lightest = sample;
      }
      if (lum < minLum) {
        minLum = lum;
        darkest = sample;
      }
    }

    // 基于平均颜色获取最佳文字颜色
    const baseResult = this.getOptimalTextColor(avgColor, options);

    // 对于复杂背景，检查最差情况下的对比度
    if (isComplex) {
      const worstCaseBg = baseResult.isLight ? darkest : lightest;
      const worstContrast = this.calculateContrastRatio(worstCaseBg, baseResult.color);

      // 如果最差情况不满足标准，添加更强的阴影或轮廓
      if (worstContrast < ContrastCalculator.STANDARDS.AA_NORMAL) {
        baseResult.needsEnhancement = true;
        baseResult.enhancementType = 'outline';
        baseResult.outline = this.getTextOutline(baseResult.isLight);
      }
    }

    return {
      ...baseResult,
      averageColor: avgColor,
      variance,
      isComplexBackground: isComplex,
      sampleCount: samples.length
    };
  }

  /**
   * 计算平均颜色
   * @param {Array} colors - 颜色数组
   * @returns {Object} 平均颜色
   */
  calculateAverageColor (colors) {
    let totalR = 0; let totalG = 0; let totalB = 0;

    for (const color of colors) {
      totalR += color.r;
      totalG += color.g;
      totalB += color.b;
    }

    return {
      r: Math.round(totalR / colors.length),
      g: Math.round(totalG / colors.length),
      b: Math.round(totalB / colors.length)
    };
  }

  /**
   * 计算颜色方差
   * @param {Array} colors - 颜色数组
   * @param {Object} avgColor - 平均颜色
   * @returns {number} 方差值
   */
  calculateColorVariance (colors, avgColor) {
    let variance = 0;

    for (const color of colors) {
      const dr = (color.r - avgColor.r) / 255;
      const dg = (color.g - avgColor.g) / 255;
      const db = (color.b - avgColor.b) / 255;
      variance += (dr * dr + dg * dg + db * db) / 3;
    }

    return variance / colors.length;
  }

  /**
   * 获取文字轮廓配置
   * @param {boolean} isLightText - 是否为浅色文字
   * @returns {Object} 轮廓配置
   */
  getTextOutline (isLightText) {
    const outlineColor = isLightText
      ? 'rgba(0, 0, 0, 0.7)'
      : 'rgba(255, 255, 255, 0.7)';

    return {
      color: outlineColor,
      width: 1,
      css: `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}`
    };
  }

  /**
   * 将RGB对象转换为CSS颜色字符串
   * @param {Object} color - RGB颜色对象
   * @param {number} alpha - 透明度 (0-1)
   * @returns {string} CSS颜色字符串
   */
  toCSSColor (color, alpha = 1) {
    if (alpha < 1) {
      return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    }
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  /**
   * 将RGB转换为十六进制
   * @param {Object} color - RGB颜色对象
   * @returns {string} 十六进制颜色字符串
   */
  toHexColor (color) {
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  /**
   * 清除缓存
   */
  clearCache () {
    this.cache.clear();
  }

  /**
   * 销毁实例
   */
  destroy () {
    this.clearCache();
  }
}

export default ContrastCalculator;
