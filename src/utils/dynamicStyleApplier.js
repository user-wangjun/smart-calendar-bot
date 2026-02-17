/**
 * DynamicStyleApplier - 动态样式应用器模块
 * @fileoverview 将计算出的高对比度样式应用到DOM元素，支持平滑过渡和性能优化
 * @author AI Assistant
 * @date 2026-02-11
 */

/**
 * 动态样式应用器类
 * 管理文字元素的样式更新，确保高对比度显示
 */
export class DynamicStyleApplier {
  /**
   * 创建样式应用器实例
   * @param {Object} options - 配置选项
   */
  constructor (options = {}) {
    this.options = {
      transitionDuration: 300, // 过渡动画时长(ms)
      useCSSTransitions: true, // 是否使用CSS过渡
      batchUpdateInterval: 16, // 批量更新间隔(ms)
      preserveOriginalStyles: true, // 是否保留原始样式以便恢复
      ...options
    };

    this.styleCache = new Map(); // 样式缓存
    this.originalStyles = new Map(); // 原始样式备份
    this.pendingUpdates = new Set(); // 待更新的元素
    this.updateScheduled = false; // 是否已安排批量更新
    this.styleSheet = null; // 动态样式表
    this.initStyleSheet();
  }

  /**
   * 初始化动态样式表
   */
  initStyleSheet () {
    // 创建专用的样式表用于管理动态样式
    const styleId = 'dynamic-contrast-styles';
    let styleSheet = document.getElementById(styleId);

    if (!styleSheet) {
      styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      document.head.appendChild(styleSheet);
    }

    this.styleSheet = styleSheet;

    // 添加基础过渡样式
    this.addBaseStyles();
  }

  /**
   * 添加基础过渡样式
   */
  addBaseStyles () {
    const css = `
      [data-contrast-managed] {
        transition: color ${this.options.transitionDuration}ms ease,
                    text-shadow ${this.options.transitionDuration}ms ease;
      }
      
      [data-contrast-managed].contrast-updating {
        transition: none !important;
      }
      
      [data-contrast-outline] {
        -webkit-text-stroke: var(--contrast-outline-width, 0.5px) var(--contrast-outline-color, transparent);
      }
    `;

    if (!this.styleSheet.textContent.includes('data-contrast-managed')) {
      this.styleSheet.textContent += css;
    }
  }

  /**
   * 应用高对比度样式到元素
   * @param {HTMLElement} element - 目标元素
   * @param {Object} styleConfig - 样式配置
   * @param {string} elementId - 元素唯一标识
   */
  applyStyle (element, styleConfig, elementId) {
    if (!element || !styleConfig) return;

    // 备份原始样式
    if (this.options.preserveOriginalStyles && !this.originalStyles.has(elementId)) {
      this.backupOriginalStyles(element, elementId);
    }

    // 生成样式键用于缓存
    const styleKey = this.generateStyleKey(styleConfig);
    const cachedClass = this.styleCache.get(styleKey);

    if (cachedClass) {
      // 使用缓存的样式类
      this.applyCachedStyle(element, cachedClass, styleConfig);
    } else {
      // 创建新样式
      const className = this.createDynamicStyle(styleConfig, elementId);
      this.styleCache.set(styleKey, className);
      this.applyCachedStyle(element, className, styleConfig);
    }

    // 标记元素为受管理状态
    element.setAttribute('data-contrast-managed', 'true');
    element.setAttribute('data-contrast-id', elementId);
  }

  /**
   * 备份元素的原始样式
   * @param {HTMLElement} element - 目标元素
   * @param {string} elementId - 元素ID
   */
  backupOriginalStyles (element, elementId) {
    const computedStyle = window.getComputedStyle(element);

    this.originalStyles.set(elementId, {
      color: element.style.color || '',
      textShadow: element.style.textShadow || '',
      webkitTextStroke: element.style.webkitTextStroke || '',
      computedColor: computedStyle.color,
      computedTextShadow: computedStyle.textShadow
    });
  }

  /**
   * 生成样式缓存键
   * @param {Object} styleConfig - 样式配置
   * @returns {string} 缓存键
   */
  generateStyleKey (styleConfig) {
    const { color, shadow, outline, isLight } = styleConfig;
    const colorKey = `${color.r},${color.g},${color.b}`;
    const shadowKey = shadow ? `${shadow.color}-${shadow.offsetX}-${shadow.offsetY}-${shadow.blur}` : 'none';
    const outlineKey = outline ? `${outline.color}-${outline.width}` : 'none';

    return `${colorKey}|${shadowKey}|${outlineKey}|${isLight}`;
  }

  /**
   * 创建动态样式类
   * @param {Object} styleConfig - 样式配置
   * @param {string} elementId - 元素ID
   * @returns {string} 样式类名
   */
  createDynamicStyle (styleConfig, elementId) {
    const className = `contrast-style-${this.hashCode(elementId)}-${Date.now()}`;
    const { color, shadow, outline } = styleConfig;

    // 构建CSS规则
    let cssRules = `.${className} {`;

    // 文字颜色
    cssRules += `color: rgb(${color.r}, ${color.g}, ${color.b}) !important;`;

    // 文字阴影
    if (shadow && shadow.css) {
      cssRules += `text-shadow: ${shadow.css};`;
    }

    cssRules += '}';

    // 轮廓样式（使用CSS变量以便动态调整）
    if (outline && outline.css) {
      cssRules += `.${className} {`;
      cssRules += `--contrast-outline-color: ${outline.color};`;
      cssRules += `--contrast-outline-width: ${outline.width}px;`;
      cssRules += `text-shadow: ${outline.css};`;
      cssRules += '}';
    }

    // 添加到样式表
    this.styleSheet.textContent += cssRules;

    return className;
  }

  /**
   * 应用缓存的样式
   * @param {HTMLElement} element - 目标元素
   * @param {string} className - 样式类名
   * @param {Object} styleConfig - 样式配置
   */
  applyCachedStyle (element, className, styleConfig) {
    // 移除旧的对比度样式类
    const oldClasses = element.className.match(/contrast-style-\S+/g);
    if (oldClasses) {
      oldClasses.forEach(cls => element.classList.remove(cls));
    }

    // 添加新样式类
    element.classList.add(className);

    // 直接应用内联样式作为后备
    this.applyInlineStyles(element, styleConfig);
  }

  /**
   * 应用内联样式
   * @param {HTMLElement} element - 目标元素
   * @param {Object} styleConfig - 样式配置
   */
  applyInlineStyles (element, styleConfig) {
    const { color, shadow, outline } = styleConfig;

    // 应用颜色
    element.style.color = `rgb(${color.r}, ${color.g}, ${color.b})`;

    // 应用阴影
    if (shadow && shadow.css) {
      element.style.textShadow = shadow.css;
    }

    // 应用轮廓
    if (outline && outline.css) {
      element.setAttribute('data-contrast-outline', 'true');
    }
  }

  /**
   * 批量应用样式（性能优化）
   * @param {Map} stylesMap - 元素ID到样式配置的映射
   * @param {Map} elementsMap - 元素ID到DOM元素的映射
   */
  batchApplyStyles (stylesMap, elementsMap) {
    // 添加到待更新队列
    for (const [elementId, styleConfig] of stylesMap) {
      const element = elementsMap.get(elementId);
      if (element) {
        this.pendingUpdates.add({ element, styleConfig, elementId });
      }
    }

    // 安排批量更新
    this.scheduleBatchUpdate();
  }

  /**
   * 安排批量更新
   */
  scheduleBatchUpdate () {
    if (this.updateScheduled) return;

    this.updateScheduled = true;

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => this.executeBatchUpdate());
    } else {
      setTimeout(() => this.executeBatchUpdate(), this.options.batchUpdateInterval);
    }
  }

  /**
   * 执行批量更新
   */
  executeBatchUpdate () {
    // 暂停过渡动画以提高性能
    this.pendingUpdates.forEach(({ element }) => {
      element.classList.add('contrast-updating');
    });

    // 应用所有待更新样式
    this.pendingUpdates.forEach(({ element, styleConfig, elementId }) => {
      this.applyStyle(element, styleConfig, elementId);
    });

    // 恢复过渡动画
    requestAnimationFrame(() => {
      this.pendingUpdates.forEach(({ element }) => {
        element.classList.remove('contrast-updating');
      });
      this.pendingUpdates.clear();
      this.updateScheduled = false;
    });
  }

  /**
   * 恢复元素的原始样式
   * @param {string} elementId - 元素ID
   * @param {HTMLElement} element - 目标元素（可选）
   */
  restoreOriginalStyle (elementId, element = null) {
    const targetElement = element || document.querySelector(`[data-contrast-id="${elementId}"]`);
    if (!targetElement) return;

    const originalStyle = this.originalStyles.get(elementId);
    if (originalStyle) {
      // 恢复原始样式
      targetElement.style.color = originalStyle.color;
      targetElement.style.textShadow = originalStyle.textShadow;
      targetElement.style.webkitTextStroke = originalStyle.webkitTextStroke;

      // 移除对比度管理标记
      targetElement.removeAttribute('data-contrast-managed');
      targetElement.removeAttribute('data-contrast-id');
      targetElement.removeAttribute('data-contrast-outline');

      // 移除样式类
      const oldClasses = targetElement.className.match(/contrast-style-\S+/g);
      if (oldClasses) {
        oldClasses.forEach(cls => targetElement.classList.remove(cls));
      }
    }
  }

  /**
   * 恢复所有元素的原始样式
   */
  restoreAllStyles () {
    for (const elementId of this.originalStyles.keys()) {
      this.restoreOriginalStyle(elementId);
    }
    this.originalStyles.clear();
    this.styleCache.clear();
  }

  /**
   * 生成哈希码
   * @param {string} str - 输入字符串
   * @returns {string} 哈希码
   */
  hashCode (str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  /**
   * 清理未使用的样式
   */
  cleanupUnusedStyles () {
    // 获取所有正在使用的样式类
    const usedClasses = new Set();
    document.querySelectorAll('[data-contrast-managed]').forEach(element => {
      const classes = element.className.match(/contrast-style-\S+/g);
      if (classes) {
        classes.forEach(cls => usedClasses.add(cls));
      }
    });

    // 清理缓存中未使用的样式
    for (const [key, className] of this.styleCache) {
      if (!usedClasses.has(className)) {
        this.styleCache.delete(key);
        this.removeStyleRule(className);
      }
    }
  }

  /**
   * 从样式表中移除样式规则
   * @param {string} className - 样式类名
   */
  removeStyleRule (className) {
    if (!this.styleSheet) return;

    const cssText = this.styleSheet.textContent;
    const regex = new RegExp(`\\.${className}\\s*\\{[^}]*\\}`, 'g');
    this.styleSheet.textContent = cssText.replace(regex, '');
  }

  /**
   * 更新配置选项
   * @param {Object} newOptions - 新配置选项
   */
  updateOptions (newOptions) {
    this.options = { ...this.options, ...newOptions };

    // 如果过渡设置改变，更新基础样式
    if (newOptions.transitionDuration !== undefined || newOptions.useCSSTransitions !== undefined) {
      this.addBaseStyles();
    }
  }

  /**
   * 获取元素的当前对比度样式信息
   * @param {string} elementId - 元素ID
   * @returns {Object|null} 样式信息
   */
  getElementStyleInfo (elementId) {
    const element = document.querySelector(`[data-contrast-id="${elementId}"]`);
    if (!element) return null;

    const computedStyle = window.getComputedStyle(element);
    return {
      color: computedStyle.color,
      textShadow: computedStyle.textShadow,
      isManaged: element.hasAttribute('data-contrast-managed'),
      hasOutline: element.hasAttribute('data-contrast-outline')
    };
  }

  /**
   * 销毁实例
   */
  destroy () {
    this.restoreAllStyles();

    if (this.styleSheet && this.styleSheet.parentNode) {
      this.styleSheet.parentNode.removeChild(this.styleSheet);
    }

    this.styleSheet = null;
    this.styleCache.clear();
    this.pendingUpdates.clear();
  }
}

export default DynamicStyleApplier;
