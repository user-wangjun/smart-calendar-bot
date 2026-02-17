/**
 * ColorContrastManager - 颜色对比度管理器
 * @fileoverview 主控制器模块，整合图片分析、重叠检测、对比度计算和样式应用
 * @author AI Assistant
 * @date 2026-02-11
 */

import { ImageAnalyzer } from './imageAnalyzer.js';
import { OverlapDetector } from './overlapDetector.js';
import { ContrastCalculator } from './contrastCalculator.js';
import { DynamicStyleApplier } from './dynamicStyleApplier.js';

/**
 * 颜色对比度管理器类
 * 提供完整的自动检测和动态调整文字颜色的功能
 */
export class ColorContrastManager {
  /**
   * 创建管理器实例
   * @param {Object} options - 配置选项
   */
  constructor (options = {}) {
    this.options = {
      debounceDelay: 100, // 防抖延迟(ms)
      throttleInterval: 16, // 节流间隔(ms)
      enableIntersectionObserver: true, // 启用交叉观察器
      intersectionThreshold: 0.1, // 交叉观察阈值
      rootMargin: '50px', // 根边距
      autoUpdateOnScroll: true, // 滚动时自动更新
      autoUpdateOnResize: true, // 调整大小时自动更新
      ...options
    };

    // 子模块实例
    this.imageAnalyzer = null;
    this.overlapDetector = null;
    this.contrastCalculator = null;
    this.styleApplier = null;

    // 状态管理
    this.isInitialized = false;
    this.isProcessing = false;
    this.registeredElements = new Map();
    this.observer = null;
    this.debounceTimer = null;
    this.throttleTimer = null;
    this.lastUpdateTime = 0;

    // 绑定事件处理器
    this.handleScroll = this.handleScroll.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleIntersection = this.handleIntersection.bind(this);
  }

  /**
   * 初始化管理器
   * @param {HTMLElement} container - 背景图片容器
   * @param {string} imageUrl - 背景图片URL
   * @returns {Promise<void>}
   */
  async initialize (container, imageUrl) {
    if (this.isInitialized) {
      console.warn('ColorContrastManager already initialized');
      return;
    }

    if (!container || !imageUrl) {
      throw new Error('Container and imageUrl are required');
    }

    try {
      // 初始化图片分析器
      this.imageAnalyzer = new ImageAnalyzer(imageUrl);
      await this.imageAnalyzer.loadImage();

      // 初始化其他模块
      this.overlapDetector = new OverlapDetector(container);
      this.contrastCalculator = new ContrastCalculator();
      this.styleApplier = new DynamicStyleApplier();

      // 设置交叉观察器
      if (this.options.enableIntersectionObserver && 'IntersectionObserver' in window) {
        this.setupIntersectionObserver(container);
      }

      // 绑定事件监听
      this.bindEvents();

      this.isInitialized = true;
      console.log('ColorContrastManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ColorContrastManager:', error);
      throw error;
    }
  }

  /**
   * 设置交叉观察器
   * @param {HTMLElement} container - 容器元素
   */
  setupIntersectionObserver (container) {
    this.observer = new IntersectionObserver(
      this.handleIntersection,
      {
        root: null,
        rootMargin: this.options.rootMargin,
        threshold: this.options.intersectionThreshold
      }
    );

    this.observer.observe(container);
  }

  /**
   * 处理交叉观察回调
   * @param {Array} entries - 观察条目
   */
  handleIntersection (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 容器可见时，更新所有已注册元素
        this.updateAllElements();
      }
    });
  }

  /**
   * 绑定事件监听
   */
  bindEvents () {
    if (this.options.autoUpdateOnScroll) {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
    }

    if (this.options.autoUpdateOnResize) {
      window.addEventListener('resize', this.handleResize, { passive: true });
    }
  }

  /**
   * 处理滚动事件
   */
  handleScroll () {
    this.debounceUpdate();
  }

  /**
   * 处理调整大小事件
   */
  handleResize () {
    // 重新初始化四叉树
    if (this.overlapDetector) {
      this.overlapDetector.rebuildQuadtree();
    }
    this.debounceUpdate();
  }

  /**
   * 防抖更新
   */
  debounceUpdate () {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.updateAllElements();
    }, this.options.debounceDelay);
  }

  /**
   * 节流更新
   */
  throttleUpdate () {
    const now = Date.now();
    if (now - this.lastUpdateTime >= this.options.throttleInterval) {
      this.lastUpdateTime = now;
      this.updateAllElements();
    }
  }

  /**
   * 注册文字元素
   * @param {HTMLElement} element - 文字元素
   * @param {Object} options - 元素特定选项
   * @returns {string} 元素ID
   */
  registerElement (element, options = {}) {
    if (!this.isInitialized) {
      console.warn('ColorContrastManager not initialized');
      return null;
    }

    if (!element) {
      console.warn('Invalid element provided');
      return null;
    }

    const elementId = `contrast-element-${this.generateId()}`;

    // 存储元素信息
    this.registeredElements.set(elementId, {
      element,
      options: {
        sampleCount: 9, // 采样点数量
        minContrast: 4.5, // 最小对比度
        enhanceShadow: true, // 增强阴影
        ...options
      }
    });

    // 注册到重叠检测器
    this.overlapDetector.registerTextElement(element, elementId);

    // 立即更新该元素
    this.updateElement(elementId);

    return elementId;
  }

  /**
   * 批量注册元素
   * @param {Array} elements - 元素数组
   * @param {Object} defaultOptions - 默认选项
   * @returns {Array} 元素ID数组
   */
  registerElements (elements, defaultOptions = {}) {
    const ids = [];

    elements.forEach(({ element, options }) => {
      const id = this.registerElement(element, { ...defaultOptions, ...options });
      if (id) ids.push(id);
    });

    return ids;
  }

  /**
   * 更新单个元素
   * @param {string} elementId - 元素ID
   */
  async updateElement (elementId) {
    if (this.isProcessing) return;

    const elementData = this.registeredElements.get(elementId);
    if (!elementData) return;

    try {
      this.isProcessing = true;

      // 1. 检测重叠区域
      const overlapInfo = this.overlapDetector.detectOverlap(elementId);

      if (!overlapInfo || !overlapInfo.hasOverlap) {
        // 无重叠，恢复原始样式
        this.styleApplier.restoreOriginalStyle(elementId, elementData.element);
        this.isProcessing = false;
        return;
      }

      // 2. 获取采样点
      const samplePoints = this.overlapDetector.getSamplePoints(
        elementId,
        elementData.options.sampleCount
      );

      // 3. 分析背景颜色
      const containerBounds = this.overlapDetector.backgroundBounds;
      const colorSamples = [];

      for (const point of samplePoints) {
        const color = this.imageAnalyzer.getRegionColor(
          point.x, point.y,
          10, 10, // 采样区域大小
          containerBounds
        );
        colorSamples.push(color);
      }

      // 4. 计算最佳文字颜色
      const contrastResult = this.contrastCalculator.analyzeMultipleSamples(
        colorSamples,
        {
          minContrast: elementData.options.minContrast,
          enhanceShadow: elementData.options.enhanceShadow
        }
      );

      // 5. 应用样式
      this.styleApplier.applyStyle(
        elementData.element,
        contrastResult,
        elementId
      );
    } catch (error) {
      console.error(`Error updating element ${elementId}:`, error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 更新所有已注册元素
   */
  async updateAllElements () {
    if (!this.isInitialized || this.registeredElements.size === 0) return;

    const updatePromises = [];

    for (const elementId of this.registeredElements.keys()) {
      updatePromises.push(this.updateElement(elementId));
    }

    await Promise.all(updatePromises);
  }

  /**
   * 注销元素
   * @param {string} elementId - 元素ID
   */
  unregisterElement (elementId) {
    const elementData = this.registeredElements.get(elementId);

    if (elementData) {
      // 恢复原始样式
      this.styleApplier.restoreOriginalStyle(elementId, elementData.element);

      // 从各模块中移除
      this.registeredElements.delete(elementId);
      this.overlapDetector.unregisterTextElement(elementId);
    }
  }

  /**
   * 获取元素的对比度信息
   * @param {string} elementId - 元素ID
   * @returns {Object|null} 对比度信息
   */
  getElementContrastInfo (elementId) {
    const elementData = this.registeredElements.get(elementId);
    if (!elementData) return null;

    const overlapInfo = this.overlapDetector.detectOverlap(elementId);
    const styleInfo = this.styleApplier.getElementStyleInfo(elementId);

    return {
      elementId,
      hasOverlap: overlapInfo?.hasOverlap || false,
      overlapPercentage: overlapInfo?.overlapPercentage || 0,
      currentStyle: styleInfo,
      isManaged: styleInfo?.isManaged || false
    };
  }

  /**
   * 获取所有元素的对比度报告
   * @returns {Array} 对比度报告数组
   */
  getContrastReport () {
    const report = [];

    for (const elementId of this.registeredElements.keys()) {
      const info = this.getElementContrastInfo(elementId);
      if (info) report.push(info);
    }

    return report;
  }

  /**
   * 手动触发更新
   */
  refresh () {
    if (this.overlapDetector) {
      this.overlapDetector.rebuildQuadtree();
    }
    this.updateAllElements();
  }

  /**
   * 暂停自动更新
   */
  pause () {
    if (this.observer) {
      this.observer.disconnect();
    }
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
  }

  /**
   * 恢复自动更新
   */
  resume () {
    if (this.observer && this.overlapDetector) {
      this.observer.observe(this.overlapDetector.container);
    }
    this.bindEvents();
  }

  /**
   * 生成唯一ID
   * @returns {string} 唯一ID
   */
  generateId () {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 销毁管理器
   */
  destroy () {
    // 暂停所有更新
    this.pause();

    // 恢复所有元素原始样式
    if (this.styleApplier) {
      this.styleApplier.restoreAllStyles();
    }

    // 清理资源
    if (this.imageAnalyzer) {
      this.imageAnalyzer.destroy();
    }

    if (this.overlapDetector) {
      this.overlapDetector.destroy();
    }

    if (this.contrastCalculator) {
      this.contrastCalculator.destroy();
    }

    if (this.styleApplier) {
      this.styleApplier.destroy();
    }

    // 清空数据
    this.registeredElements.clear();
    this.isInitialized = false;

    console.log('ColorContrastManager destroyed');
  }
}

export default ColorContrastManager;
