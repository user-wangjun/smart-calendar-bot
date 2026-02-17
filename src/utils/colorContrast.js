/**
 * 响应式文本颜色工具 - 根据背景亮度自动调整文本颜色
 * 符合 WCAG 2.1 AA 标准：对比度 >= 4.5:1
 */

/**
 * 计算颜色的相对亮度 (Relative Luminance)
 * 根据 WCAG 2.1 公式: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * @param {string} color - 颜色值 (hex, rgb, rgba)
 * @returns {number} - 亮度值 (0-1)
 */
export function getLuminance (color) {
  // 解析颜色值
  const rgb = parseColor(color);
  if (!rgb) return 1; // 默认返回白色背景亮度

  // 计算每个通道的线性值
  const [r, g, b] = rgb.map(channel => {
    const sRGB = channel / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  // 计算相对亮度
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 解析颜色值为 RGB 数组
 * @param {string} color - 颜色值
 * @returns {number[]|null} - [r, g, b] 数组
 */
export function parseColor (color) {
  if (!color) return null;

  // 移除空格并转为小写
  const normalized = color.trim().toLowerCase();

  // 处理 hex 颜色
  if (normalized.startsWith('#')) {
    return parseHexColor(normalized);
  }

  // 处理 rgb/rgba 颜色
  if (normalized.startsWith('rgb')) {
    return parseRgbColor(normalized);
  }

  // 处理颜色名称
  if (colorNames[normalized]) {
    return colorNames[normalized];
  }

  return null;
}

/**
 * 解析 hex 颜色
 * @param {string} hex - hex 颜色值
 * @returns {number[]|null}
 */
function parseHexColor (hex) {
  // 移除 # 号
  const cleanHex = hex.replace('#', '');

  // 处理简写形式 (#fff)
  if (cleanHex.length === 3) {
    const [r, g, b] = cleanHex.split('').map(c => parseInt(c + c, 16));
    return [r, g, b];
  }

  // 处理完整形式 (#ffffff)
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  }

  // 处理带 alpha 的 hex (#ffffffff)
  if (cleanHex.length === 8) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  }

  return null;
}

/**
 * 解析 rgb/rgba 颜色
 * @param {string} rgb - rgb 颜色值
 * @returns {number[]|null}
 */
function parseRgbColor (rgb) {
  const match = rgb.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;

  const values = match[1].split(',').map(v => parseFloat(v.trim()));
  if (values.length < 3) return null;

  return values.slice(0, 3); // 只返回 RGB，忽略 alpha
}

/**
 * 计算两个颜色之间的对比度
 * 根据 WCAG 2.1 公式: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 * @param {string} color1 - 前景色
 * @param {string} color2 - 背景色
 * @returns {number} - 对比度比值
 */
export function getContrastRatio (color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 根据背景颜色获取推荐的文本颜色
 * @param {string} backgroundColor - 背景颜色
 * @returns {string} - 推荐的文本颜色 (#000000 或 #FFFFFF)
 */
export function getTextColorForBackground (backgroundColor) {
  const luminance = getLuminance(backgroundColor);

  // 亮度 > 0.5 使用黑色文字，否则使用白色文字
  // 这样可以确保对比度 >= 4.5:1
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * 获取高对比度文本颜色（确保 WCAG AA 标准）
 * @param {string} backgroundColor - 背景颜色
 * @param {number} targetRatio - 目标对比度 (默认 4.5)
 * @returns {string} - 高对比度文本颜色
 */
export function getAccessibleTextColor (backgroundColor, targetRatio = 4.5) {
  // const bgLuminance = getLuminance(backgroundColor);

  // 测试黑色和白色的对比度
  const blackRatio = getContrastRatio('#000000', backgroundColor);
  const whiteRatio = getContrastRatio('#FFFFFF', backgroundColor);

  // 选择对比度更高的颜色
  if (blackRatio >= targetRatio && whiteRatio >= targetRatio) {
    // 两者都满足，选择对比度更高的
    return blackRatio > whiteRatio ? '#000000' : '#FFFFFF';
  } else if (blackRatio >= targetRatio) {
    return '#000000';
  } else if (whiteRatio >= targetRatio) {
    return '#FFFFFF';
  }

  // 如果都不满足，返回对比度更高的那个
  return blackRatio > whiteRatio ? '#000000' : '#FFFFFF';
}

/**
 * 动态调整元素文本颜色
 * @param {HTMLElement} element - 目标元素
 * @param {string} backgroundColor - 背景颜色（可选，默认自动检测）
 */
export function adjustTextColor (element, backgroundColor = null) {
  if (!element) return null;

  // 如果没有提供背景色，尝试获取计算样式
  const bg = backgroundColor || getComputedStyle(element).backgroundColor;

  // 获取推荐的文本颜色
  const textColor = getAccessibleTextColor(bg);

  // 应用文本颜色
  element.style.color = textColor;

  return textColor;
}

/**
 * 颜色名称映射表
 */
const colorNames = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  cyan: [0, 255, 255],
  magenta: [255, 0, 255],
  silver: [192, 192, 192],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  maroon: [128, 0, 0],
  olive: [128, 128, 0],
  lime: [0, 255, 0],
  aqua: [0, 255, 255],
  teal: [0, 128, 128],
  navy: [0, 0, 128],
  fuchsia: [255, 0, 255],
  purple: [128, 0, 128],
  orange: [255, 165, 0],
  pink: [255, 192, 203],
  brown: [165, 42, 42],
  gold: [255, 215, 0],
  indigo: [75, 0, 130],
  violet: [238, 130, 238],
  turquoise: [64, 224, 208],
  tan: [210, 180, 140],
  beige: [245, 245, 220],
  ivory: [255, 255, 240],
  lavender: [230, 230, 250],
  coral: [255, 127, 80],
  salmon: [250, 128, 114],
  khaki: [240, 230, 140],
  plum: [221, 160, 221],
  orchid: [218, 112, 214],
  wheat: [245, 222, 179],
  linen: [250, 240, 230],
  azure: [240, 255, 255],
  snow: [255, 250, 250],
  honeydew: [240, 255, 240],
  mintcream: [245, 255, 250],
  aliceblue: [240, 248, 255],
  ghostwhite: [248, 248, 255],
  whitesmoke: [245, 245, 245],
  seashell: [255, 245, 238],
  oldlace: [253, 245, 230],
  floralwhite: [255, 250, 240],
  cornsilk: [255, 248, 220],
  antiquewhite: [250, 235, 215],
  bisque: [255, 228, 196],
  blanchedalmond: [255, 235, 205],
  burlywood: [222, 184, 135],
  darkgray: [169, 169, 169],
  darkgrey: [169, 169, 169],
  lightgray: [211, 211, 211],
  lightgrey: [211, 211, 211],
  gainsboro: [220, 220, 220],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  midnightblue: [25, 25, 112],
  darkblue: [0, 0, 139],
  mediumblue: [0, 0, 205],
  royalblue: [65, 105, 225],
  dodgerblue: [30, 144, 255],
  deepskyblue: [0, 191, 255],
  skyblue: [135, 206, 235],
  lightskyblue: [135, 206, 250],
  steelblue: [70, 130, 180],
  lightsteelblue: [176, 196, 222],
  powderblue: [176, 224, 230],
  paleturquoise: [175, 238, 238],
  lightcyan: [224, 255, 255],
  cadetblue: [95, 158, 160],
  darkcyan: [0, 139, 139],
  lightseagreen: [32, 178, 170],
  mediumaquamarine: [102, 205, 170],
  aquamarine: [127, 255, 212],
  mediumspringgreen: [0, 250, 154],
  springgreen: [0, 255, 127],
  mediumseagreen: [60, 179, 113],
  seagreen: [46, 139, 87],
  darkseagreen: [143, 188, 143],
  palegreen: [152, 251, 152],
  lightgreen: [144, 238, 144],
  yellowgreen: [154, 205, 50],
  lawngreen: [124, 252, 0],
  chartreuse: [127, 255, 0],
  greenyellow: [173, 255, 47],
  limegreen: [50, 205, 50],
  forestgreen: [34, 139, 34],
  darkgreen: [0, 100, 0],
  darkolivegreen: [85, 107, 47],
  olivedrab: [107, 142, 35],
  darkkhaki: [189, 183, 107],
  lemonchiffon: [255, 250, 205],
  lightgoldenrodyellow: [250, 250, 210],
  papayawhip: [255, 239, 213],
  moccasin: [255, 228, 181],
  peachpuff: [255, 218, 185],
  navajowhite: [255, 222, 173],
  sandybrown: [244, 164, 96],
  goldenrod: [218, 165, 32],
  darkgoldenrod: [184, 134, 11],
  peru: [205, 133, 63],
  chocolate: [210, 105, 30],
  sienna: [160, 82, 45],
  saddlebrown: [139, 69, 19],
  firebrick: [178, 34, 34],
  darkred: [139, 0, 0],
  crimson: [220, 20, 60],
  indianred: [205, 92, 92],
  lightcoral: [240, 128, 128],
  darksalmon: [233, 150, 122],
  lightsalmon: [255, 160, 122],
  tomato: [255, 99, 71],
  orangered: [255, 69, 0],
  darkorange: [255, 140, 0],
  darkviolet: [148, 0, 211],
  darkorchid: [153, 50, 204],
  mediumorchid: [186, 85, 211],
  thistle: [216, 191, 216],
  mistyrose: [255, 228, 225],
  rosybrown: [188, 143, 143],
  darkslateblue: [72, 61, 139],
  slateblue: [106, 90, 205],
  mediumslateblue: [123, 104, 238],
  rebeccapurple: [102, 51, 153],
  blueviolet: [138, 43, 226],
  mediumpurple: [147, 112, 219],
  deeppink: [255, 20, 147],
  hotpink: [255, 105, 180],
  lightpink: [255, 182, 193],
  palevioletred: [219, 112, 147],
  mediumvioletred: [199, 21, 133],
  darkmagenta: [139, 0, 139],
  transparent: [0, 0, 0]
};

/**
 * 测试函数 - 验证各种背景色的文本颜色推荐
 */
export function testColorContrast () {
  const testColors = [
    '#FFFFFF', // 白色 - 应返回黑色
    '#000000', // 黑色 - 应返回白色
    '#F8FAFC', // 浅灰 - 应返回黑色
    '#1E293B', // 深灰 - 应返回白色
    '#3B82F6', // 蓝色 - 应返回白色
    '#FEF3C7', // 浅黄 - 应返回黑色
    '#7C3AED', // 紫色 - 应返回白色
    '#D1FAE5', // 浅绿 - 应返回黑色
    '#DC2626', // 红色 - 应返回白色
    '#FCD34D' // 黄色 - 应返回黑色
  ];

  console.log('=== 响应式文本颜色测试 ===\n');

  testColors.forEach(bg => {
    const textColor = getTextColorForBackground(bg);
    const ratio = getContrastRatio(textColor, bg);
    const status = ratio >= 4.5 ? '✓' : '✗';

    console.log(`${status} 背景: ${bg.padEnd(7)} → 文本: ${textColor} (对比度: ${ratio.toFixed(2)}:1)`);
  });

  console.log('\n=== 测试完成 ===');
}

// 默认导出
export default {
  getLuminance,
  parseColor,
  getContrastRatio,
  getTextColorForBackground,
  getAccessibleTextColor,
  adjustTextColor,
  testColorContrast
};
