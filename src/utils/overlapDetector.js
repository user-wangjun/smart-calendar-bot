/**
 * OverlapDetector - 文字与背景图片重叠区域检测模块
 * @fileoverview 使用四叉树空间索引优化检测性能
 * @author AI Assistant
 * @date 2026-02-11
 */

/**
 * 四叉树节点类
 * 用于空间分割和快速查询
 */
class QuadtreeNode {
  /**
   * 创建四叉树节点
   * @param {number} x - 区域左上角X坐标
   * @param {number} y - 区域左上角Y坐标
   * @param {number} width - 区域宽度
   * @param {number} height - 区域高度
   * @param {number} capacity - 节点容量，超过后分裂
   * @param {number} maxDepth - 最大深度限制
   * @param {number} depth - 当前深度
   */
  constructor (x, y, width, height, capacity = 4, maxDepth = 8, depth = 0) {
    this.bounds = { x, y, width, height };
    this.capacity = capacity;
    this.maxDepth = maxDepth;
    this.depth = depth;
    this.elements = []; // 存储在此节点的元素
    this.divided = false; // 是否已分裂
    this.northeast = null;
    this.northwest = null;
    this.southeast = null;
    this.southwest = null;
  }

  /**
   * 将当前节点分裂为四个子节点
   */
  subdivide () {
    const { x, y, width, height } = this.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const nextDepth = this.depth + 1;

    this.northeast = new QuadtreeNode(
      x + halfWidth, y,
      halfWidth, halfHeight,
      this.capacity, this.maxDepth, nextDepth
    );
    this.northwest = new QuadtreeNode(
      x, y,
      halfWidth, halfHeight,
      this.capacity, this.maxDepth, nextDepth
    );
    this.southeast = new QuadtreeNode(
      x + halfWidth, y + halfHeight,
      halfWidth, halfHeight,
      this.capacity, this.maxDepth, nextDepth
    );
    this.southwest = new QuadtreeNode(
      x, y + halfHeight,
      halfWidth, halfHeight,
      this.capacity, this.maxDepth, nextDepth
    );

    this.divided = true;

    // 将现有元素重新分配到子节点
    for (const element of this.elements) {
      this.insertToChildren(element);
    }
    this.elements = []; // 清空当前节点元素
  }

  /**
   * 将元素插入到子节点
   * @param {Object} element - 元素对象
   */
  insertToChildren (element) {
    if (this.northeast.insert(element)) {
      return;
    }
    if (this.northwest.insert(element)) {
      return;
    }
    if (this.southeast.insert(element)) {
      return;
    }
    this.southwest.insert(element);
  }

  /**
   * 插入元素到四叉树
   * @param {Object} element - 元素对象，包含bounds属性
   * @returns {boolean} 是否插入成功
   */
  insert (element) {
    // 检查元素是否在当前节点边界内
    if (!this.intersects(element.bounds)) {
      return false;
    }

    // 如果未达到容量且未分裂，直接存储
    if (!this.divided && this.elements.length < this.capacity) {
      this.elements.push(element);
      return true;
    }

    // 需要分裂或已经分裂
    if (!this.divided && this.depth < this.maxDepth) {
      this.subdivide();
    }

    // 插入到子节点
    if (this.divided) {
      this.insertToChildren(element);
    } else {
      // 超过最大深度，强制存储在当前节点
      this.elements.push(element);
    }

    return true;
  }

  /**
   * 检查两个边界是否相交
   * @param {Object} bounds - 待检查的边界
   * @returns {boolean} 是否相交
   */
  intersects (bounds) {
    return !(bounds.x > this.bounds.x + this.bounds.width ||
             bounds.x + bounds.width < this.bounds.x ||
             bounds.y > this.bounds.y + this.bounds.height ||
             bounds.y + bounds.height < this.bounds.y);
  }

  /**
   * 查询与给定区域相交的所有元素
   * @param {Object} range - 查询区域
   * @param {Array} found - 已找到的元素数组
   * @returns {Array} 找到的元素数组
   */
  query (range, found = []) {
    if (!this.intersects(range)) {
      return found;
    }

    // 检查当前节点的元素
    for (const element of this.elements) {
      if (this.rectangleIntersect(element.bounds, range)) {
        found.push(element);
      }
    }

    // 递归查询子节点
    if (this.divided) {
      this.northeast.query(range, found);
      this.northwest.query(range, found);
      this.southeast.query(range, found);
      this.southwest.query(range, found);
    }

    return found;
  }

  /**
   * 检查两个矩形是否相交
   * @param {Object} rect1 - 矩形1
   * @param {Object} rect2 - 矩形2
   * @returns {boolean} 是否相交
   */
  rectangleIntersect (rect1, rect2) {
    return !(rect1.x > rect2.x + rect2.width ||
             rect1.x + rect1.width < rect2.x ||
             rect1.y > rect2.y + rect2.height ||
             rect1.y + rect1.height < rect2.y);
  }

  /**
   * 计算两个矩形的重叠区域
   * @param {Object} rect1 - 矩形1
   * @param {Object} rect2 - 矩形2
   * @returns {Object|null} 重叠区域，无重叠返回null
   */
  calculateOverlap (rect1, rect2) {
    const x1 = Math.max(rect1.x, rect2.x);
    const y1 = Math.max(rect1.y, rect2.y);
    const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    if (x1 < x2 && y1 < y2) {
      return {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1
      };
    }

    return null;
  }

  /**
   * 清空四叉树
   */
  clear () {
    this.elements = [];
    if (this.divided) {
      this.northeast.clear();
      this.northwest.clear();
      this.southeast.clear();
      this.southwest.clear();
      this.northeast = null;
      this.northwest = null;
      this.southeast = null;
      this.southwest = null;
      this.divided = false;
    }
  }
}

/**
 * 重叠检测器类
 * 管理文字元素和背景图片的空间关系
 */
export class OverlapDetector {
  /**
   * 创建重叠检测器实例
   * @param {HTMLElement} container - 容器元素
   */
  constructor (container) {
    this.container = container;
    this.quadtree = null;
    this.textElements = new Map(); // 存储文字元素信息
    this.backgroundBounds = null;
    this.initQuadtree();
  }

  /**
   * 初始化四叉树
   */
  initQuadtree () {
    if (!this.container) return;

    const bounds = this.container.getBoundingClientRect();
    this.backgroundBounds = {
      x: bounds.left,
      y: bounds.top,
      width: bounds.width,
      height: bounds.height
    };

    // 创建四叉树，覆盖整个容器区域
    this.quadtree = new QuadtreeNode(
      bounds.left,
      bounds.top,
      bounds.width,
      bounds.height,
      4, // 每个节点容量
      8 // 最大深度
    );
  }

  /**
   * 注册文字元素
   * @param {HTMLElement} element - 文字元素
   * @param {string} elementId - 元素唯一标识
   */
  registerTextElement (element, elementId) {
    if (!element) return;

    const bounds = element.getBoundingClientRect();
    const elementData = {
      id: elementId,
      element,
      bounds: {
        x: bounds.left,
        y: bounds.top,
        width: bounds.width,
        height: bounds.height
      },
      overlaps: [] // 存储与该元素重叠的背景区域
    };

    this.textElements.set(elementId, elementData);
    this.quadtree.insert(elementData);
  }

  /**
   * 批量注册文字元素
   * @param {Array} elements - 元素数组，每个元素包含 { element, id }
   */
  registerTextElements (elements) {
    elements.forEach(({ element, id }) => {
      this.registerTextElement(element, id);
    });
  }

  /**
   * 更新文字元素位置（用于滚动或动画后）
   * @param {string} elementId - 元素ID
   */
  updateElementPosition (elementId) {
    const elementData = this.textElements.get(elementId);
    if (!elementData) return;

    const bounds = elementData.element.getBoundingClientRect();
    elementData.bounds = {
      x: bounds.left,
      y: bounds.top,
      width: bounds.width,
      height: bounds.height
    };

    // 重建四叉树（因为元素位置变化较大）
    this.rebuildQuadtree();
  }

  /**
   * 重建四叉树
   */
  rebuildQuadtree () {
    this.initQuadtree();
    for (const elementData of this.textElements.values()) {
      this.quadtree.insert(elementData);
    }
  }

  /**
   * 检测所有文字元素与背景的重叠
   * @returns {Map} 元素ID到重叠信息的映射
   */
  detectAllOverlaps () {
    const results = new Map();

    for (const [elementId] of this.textElements) {
      const overlapInfo = this.detectOverlap(elementId);
      results.set(elementId, overlapInfo);
    }

    return results;
  }

  /**
   * 检测单个元素与背景的重叠
   * @param {string} elementId - 元素ID
   * @returns {Object} 重叠信息
   */
  detectOverlap (elementId) {
    const elementData = this.textElements.get(elementId);
    if (!elementData) {
      return null;
    }

    // 计算元素与背景的重叠区域
    const overlapRegion = this.quadtree.calculateOverlap(
      elementData.bounds,
      this.backgroundBounds
    );

    if (!overlapRegion) {
      return {
        elementId,
        hasOverlap: false,
        overlapPercentage: 0,
        overlapRegion: null,
        elementBounds: elementData.bounds
      };
    }

    // 计算重叠百分比
    const elementArea = elementData.bounds.width * elementData.bounds.height;
    const overlapArea = overlapRegion.width * overlapRegion.height;
    const overlapPercentage = (overlapArea / elementArea) * 100;

    // 将重叠区域转换为相对于元素的坐标
    const relativeOverlap = {
      x: overlapRegion.x - elementData.bounds.x,
      y: overlapRegion.y - elementData.bounds.y,
      width: overlapRegion.width,
      height: overlapRegion.height
    };

    return {
      elementId,
      hasOverlap: true,
      overlapPercentage: Math.round(overlapPercentage * 100) / 100,
      overlapRegion: relativeOverlap,
      elementBounds: elementData.bounds,
      absoluteOverlapRegion: overlapRegion
    };
  }

  /**
   * 获取元素的可见部分区域
   * 考虑元素可能被容器裁剪的情况
   * @param {string} elementId - 元素ID
   * @returns {Array} 可见区域数组
   */
  getVisibleRegions (elementId) {
    const elementData = this.textElements.get(elementId);
    if (!elementData) return [];

    const visibleRegions = [];
    const elementBounds = elementData.bounds;

    // 检查元素是否在背景容器内
    if (!this.quadtree.rectangleIntersect(elementBounds, this.backgroundBounds)) {
      return [];
    }

    // 计算可见区域（简单的矩形裁剪）
    const visibleX = Math.max(elementBounds.x, this.backgroundBounds.x);
    const visibleY = Math.max(elementBounds.y, this.backgroundBounds.y);
    const visibleRight = Math.min(
      elementBounds.x + elementBounds.width,
      this.backgroundBounds.x + this.backgroundBounds.width
    );
    const visibleBottom = Math.min(
      elementBounds.y + elementBounds.height,
      this.backgroundBounds.y + this.backgroundBounds.height
    );

    if (visibleX < visibleRight && visibleY < visibleBottom) {
      visibleRegions.push({
        x: visibleX - elementBounds.x,
        y: visibleY - elementBounds.y,
        width: visibleRight - visibleX,
        height: visibleBottom - visibleY,
        isClipped: visibleX > elementBounds.x ||
                   visibleY > elementBounds.y ||
                   visibleRight < elementBounds.x + elementBounds.width ||
                   visibleBottom < elementBounds.y + elementBounds.height
      });
    }

    return visibleRegions;
  }

  /**
   * 获取元素的采样点
   * 用于在多个位置检测背景颜色
   * @param {string} elementId - 元素ID
   * @param {number} sampleCount - 采样点数量
   * @returns {Array} 采样点数组
   */
  getSamplePoints (elementId, sampleCount = 9) {
    const elementData = this.textElements.get(elementId);
    if (!elementData) return [];

    const { x, y, width, height } = elementData.bounds;
    const points = [];

    // 根据元素大小决定采样网格
    const gridSize = Math.ceil(Math.sqrt(sampleCount));
    const stepX = width / (gridSize + 1);
    const stepY = height / (gridSize + 1);

    for (let row = 1; row <= gridSize; row++) {
      for (let col = 1; col <= gridSize; col++) {
        if (points.length >= sampleCount) break;

        points.push({
          x: x + stepX * col,
          y: y + stepY * row,
          relativeX: stepX * col,
          relativeY: stepY * row
        });
      }
    }

    return points;
  }

  /**
   * 注销文字元素
   * @param {string} elementId - 元素ID
   */
  unregisterTextElement (elementId) {
    this.textElements.delete(elementId);
    this.rebuildQuadtree();
  }

  /**
   * 清空所有注册的元素
   */
  clear () {
    this.textElements.clear();
    if (this.quadtree) {
      this.quadtree.clear();
    }
  }

  /**
   * 销毁实例
   */
  destroy () {
    this.clear();
    this.quadtree = null;
    this.container = null;
  }
}

export default OverlapDetector;
