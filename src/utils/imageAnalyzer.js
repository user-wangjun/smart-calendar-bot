/**
 * ImageAnalyzer - 图片像素分析和颜色提取模块
 * @fileoverview 提供图片加载、像素采样和颜色分析功能
 * @author AI Assistant
 * @date 2026-02-11
 */

/**
 * 图片分析器类
 * 用于加载背景图片并提取指定区域的像素数据
 */
export class ImageAnalyzer {
  /**
   * 创建图片分析器实例
   * @param {string} imageUrl - 图片URL
   */
  constructor (imageUrl) {
    this.imageUrl = imageUrl;
    this.canvas = null;
    this.ctx = null;
    this.image = null;
    this.isLoaded = false;
    this.cache = new Map(); // 缓存已计算的区域颜色
  }

  /**
   * 加载图片到Canvas
   * @returns {Promise<void>}
   */
  async loadImage () {
    if (this.isLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.image = new Image();
      this.image.crossOrigin = 'anonymous';

      this.image.onload = () => {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        // 限制Canvas大小以优化性能
        const maxSize = 1920;
        let width = this.image.naturalWidth;
        let height = this.image.naturalHeight;

        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.drawImage(this.image, 0, 0, width, height);

        this.isLoaded = true;
        resolve();
      };

      this.image.onerror = () => {
        reject(new Error(`Failed to load image: ${this.imageUrl}`));
      };

      this.image.src = this.imageUrl;
    });
  }

  /**
   * 获取指定区域的颜色数据
   * 使用降采样技术优化性能
   * @param {number} x - 区域左上角X坐标 (相对于视口)
   * @param {number} y - 区域左上角Y坐标 (相对于视口)
   * @param {number} width - 区域宽度
   * @param {number} height - 区域高度
   * @param {Object} containerBounds - 容器边界信息
   * @returns {Object} 区域颜色统计信息 { r, g, b, brightness, isLight }
   */
  getRegionColor (x, y, width, height, containerBounds) {
    if (!this.isLoaded) {
      throw new Error('Image not loaded. Call loadImage() first.');
    }

    // 生成缓存键
    const cacheKey = `${Math.round(x)},${Math.round(y)},${Math.round(width)},${Math.round(height)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 将视口坐标转换为Canvas坐标
    const scaleX = this.canvas.width / containerBounds.width;
    const scaleY = this.canvas.height / containerBounds.height;

    const canvasX = (x - containerBounds.left) * scaleX;
    const canvasY = (y - containerBounds.top) * scaleY;
    const canvasWidth = width * scaleX;
    const canvasHeight = height * scaleY;

    // 确保坐标在有效范围内
    const startX = Math.max(0, Math.round(canvasX));
    const startY = Math.max(0, Math.round(canvasY));
    const endX = Math.min(this.canvas.width, Math.round(canvasX + canvasWidth));
    const endY = Math.min(this.canvas.height, Math.round(canvasY + canvasHeight));

    const pixelWidth = endX - startX;
    const pixelHeight = endY - startY;

    if (pixelWidth <= 0 || pixelHeight <= 0) {
      return { r: 0, g: 0, b: 0, brightness: 0, isLight: false };
    }

    // 降采样：每4x4像素采样一次，减少93.75%的计算量
    const sampleStep = 4;
    let totalR = 0; let totalG = 0; let totalB = 0; let sampleCount = 0;

    try {
      for (let py = startY; py < endY; py += sampleStep) {
        for (let px = startX; px < endX; px += sampleStep) {
          // 采样 4x4 区域的中心点
          const sampleX = Math.min(px + sampleStep / 2, endX - 1);
          const sampleY = Math.min(py + sampleStep / 2, endY - 1);

          const imageData = this.ctx.getImageData(sampleX, sampleY, 1, 1);
          const [r, g, b, a] = imageData.data;

          // 考虑透明度
          const alpha = a / 255;
          totalR += r * alpha;
          totalG += g * alpha;
          totalB += b * alpha;
          sampleCount++;
        }
      }

      if (sampleCount === 0) {
        return { r: 0, g: 0, b: 0, brightness: 0, isLight: false };
      }

      const avgR = Math.round(totalR / sampleCount);
      const avgG = Math.round(totalG / sampleCount);
      const avgB = Math.round(totalB / sampleCount);
      const brightness = this.calculateBrightness(avgR, avgG, avgB);

      const result = {
        r: avgR,
        g: avgG,
        b: avgB,
        brightness,
        isLight: brightness > 0.5
      };

      // 缓存结果
      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.warn('Error reading pixel data:', error);
      return { r: 128, g: 128, b: 128, brightness: 0.5, isLight: true };
    }
  }

  /**
   * 计算颜色亮度 (WCAG标准)
   * @param {number} r - 红色通道值 (0-255)
   * @param {number} g - 绿色通道值 (0-255)
   * @param {number} b - 蓝色通道值 (0-255)
   * @returns {number} 亮度值 (0-1)
   */
  calculateBrightness (r, g, b) {
    // WCAG 2.1 亮度计算公式
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * 清除缓存
   */
  clearCache () {
    this.cache.clear();
  }

  /**
   * 销毁实例，释放资源
   */
  destroy () {
    this.clearCache();
    this.canvas = null;
    this.ctx = null;
    this.image = null;
    this.isLoaded = false;
  }
}

export default ImageAnalyzer;
