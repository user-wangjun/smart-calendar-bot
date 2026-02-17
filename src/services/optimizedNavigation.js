import { ref, reactive } from 'vue';

/**
 * 优化导航服务
 * 提供流畅的页面跳转、预加载和状态管理
 */
class OptimizedNavigationService {
  constructor () {
    this.router = null;
    this.navigationState = reactive({
      isNavigating: false,
      currentRoute: null,
      loadingRoute: null,
      navigationHistory: [],
      preloadQueue: [],
      errorCount: 0
    });

    this.loadingIndicators = ref({
      global: false,
      routeSpecific: new Map()
    });

    this.performanceMetrics = reactive({
      averageNavigationTime: 0,
      navigationCount: 0,
      slowNavigations: 0,
      failedNavigations: 0
    });

    this.config = {
      enablePreloading: true,
      enableLoadingIndicators: true,
      enableTransitionAnimations: true,
      navigationTimeout: 5000,
      maxRetries: 2,
      retryDelay: 1000
    };

    this.init();
  }

  /**
   * 初始化服务
   */
  init () {
    this.setupPerformanceObserver();
    this.setupErrorHandling();
    this.startPreloadManager();
  }

  /**
   * 设置路由器
   */
  setRouter (router) {
    this.router = router;
    this.setupRouterHooks();
  }

  /**
   * 优化的导航方法
   */
  async navigateTo (route, options = {}) {
    const {
      preload = true,
      showLoading = true,
      replace = false,
      // preserveState = false,
      onSuccess = null,
      onError = null
    } = options;

    const startTime = performance.now();
    const navigationId = this.generateNavigationId();

    try {
      // 检查是否已经在导航中
      if (this.navigationState.isNavigating) {
        console.warn('Navigation already in progress, queuing...');
        return this.queueNavigation(route, options);
      }

      // 开始导航
      this.startNavigation(navigationId, route, showLoading);

      // 预加载目标组件
      if (preload && this.config.enablePreloading) {
        await this.preloadRoute(route);
      }

      // 执行导航
      const navigationPromise = replace
        ? this.router.replace(route)
        : this.router.push(route);

      // 设置超时
      const timeoutPromise = this.createTimeoutPromise(this.config.navigationTimeout);

      // 等待导航完成
      await Promise.race([navigationPromise, timeoutPromise]);

      // 导航成功
      this.completeNavigation(navigationId, startTime, true);

      // 记录历史
      this.recordNavigationHistory(route, true);

      // 成功回调
      if (onSuccess) onSuccess();

      return { success: true, navigationId };
    } catch (error) {
      // 导航失败
      this.completeNavigation(navigationId, startTime, false);
      this.navigationState.errorCount++;

      // 错误处理
      const handled = await this.handleNavigationError(error, route, options);

      if (handled.shouldRetry) {
        // 重试导航
        return this.retryNavigation(route, options, handled.retryCount);
      }

      // 失败回调
      if (onError) onError(error);

      return { success: false, error, navigationId };
    }
  }

  /**
   * 快速导航（无加载指示器）
   */
  async quickNavigate (route, options = {}) {
    return this.navigateTo(route, {
      ...options,
      showLoading: false,
      preload: false
    });
  }

  /**
   * 静默导航（后台导航）
   */
  async silentNavigate (route, options = {}) {
    return this.navigateTo(route, {
      ...options,
      showLoading: false,
      preload: false,
      preserveState: true
    });
  }

  /**
   * 批量预加载路由
   */
  async preloadRoutes (routes) {
    if (!this.config.enablePreloading) return;

    const preloadPromises = routes.map(route => this.preloadRoute(route));

    try {
      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.warn('Preload failed for some routes:', error);
    }
  }

  /**
   * 预加载单个路由
   */
  async preloadRoute (route) {
    try {
      // 获取路由组件
      const routeRecord = this.router.resolve(route);
      if (!routeRecord.matched.length) return;

      // 预加载组件
      const components = routeRecord.matched.map(matched => {
        if (matched.components && matched.components.default) {
          return this.loadComponent(matched.components.default);
        }
        return Promise.resolve();
      });

      await Promise.all(components);

      // 预加载相关数据
      await this.preloadRouteData(routeRecord);
    } catch (error) {
      console.warn('Route preload failed:', error);
    }
  }

  /**
   * 智能预加载（基于用户行为）
   */
  async intelligentPreload () {
    // 基于导航历史预加载常用页面
    const frequentRoutes = this.getFrequentRoutes();
    await this.preloadRoutes(frequentRoutes);

    // 基于当前页面预加载相关页面
    const relatedRoutes = this.getRelatedRoutes();
    await this.preloadRoutes(relatedRoutes);
  }

  /**
   * 开始导航
   */
  startNavigation (navigationId, route, showLoading) {
    this.navigationState.isNavigating = true;
    this.navigationState.loadingRoute = route;
    this.navigationState.currentRoute = route;

    if (showLoading && this.config.enableLoadingIndicators) {
      this.showLoadingIndicator(navigationId);
    }

    // 添加导航动画类
    if (this.config.enableTransitionAnimations) {
      document.body.classList.add('navigating');
    }
  }

  /**
   * 完成导航
   */
  completeNavigation (navigationId, startTime, success) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.navigationState.isNavigating = false;
    this.navigationState.loadingRoute = null;

    // 更新性能指标
    this.updatePerformanceMetrics(duration, success);

    // 隐藏加载指示器
    this.hideLoadingIndicator(navigationId);

    // 移除导航动画类
    if (this.config.enableTransitionAnimations) {
      document.body.classList.remove('navigating');
    }

    // 记录慢导航
    if (duration > 1000) {
      this.recordSlowNavigation(navigationId, duration);
    }
  }

  /**
   * 显示加载指示器
   */
  showLoadingIndicator (navigationId) {
    this.loadingIndicators.value.global = true;
    this.loadingIndicators.value.routeSpecific.set(navigationId, true);

    // 创建全局加载指示器
    const loadingElement = document.createElement('div');
    loadingElement.className = 'global-loading-indicator';
    loadingElement.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">页面加载中...</div>
    `;

    document.body.appendChild(loadingElement);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .global-loading-indicator {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }
      
      .loading-text {
        color: #666;
        font-size: 14px;
        font-weight: 500;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .navigating {
        pointer-events: none;
        opacity: 0.8;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 隐藏加载指示器
   */
  hideLoadingIndicator (navigationId) {
    this.loadingIndicators.value.global = false;
    this.loadingIndicators.value.routeSpecific.delete(navigationId);

    // 移除加载指示器
    const loadingElement = document.querySelector('.global-loading-indicator');
    if (loadingElement) {
      loadingElement.remove();
    }

    // 移除样式
    const style = document.querySelector('style:contains("global-loading-indicator")');
    if (style) {
      style.remove();
    }
  }

  /**
   * 处理导航错误
   */
  async handleNavigationError (error, route, options) {
    this.performanceMetrics.failedNavigations++;

    // 错误分类
    const errorType = this.categorizeError(error);

    switch (errorType) {
      case 'network':
        return { shouldRetry: true, retryCount: 1 };

      case 'timeout':
        return { shouldRetry: true, retryCount: 2 };

      case 'not_found':
        // 重定向到404页面
        await this.router.push('/404');
        return { shouldRetry: false, retryCount: 0 };

      case 'permission':
        // 重定向到登录页面
        await this.router.push('/login');
        return { shouldRetry: false, retryCount: 0 };

      default:
        return { shouldRetry: false, retryCount: 0 };
    }
  }

  /**
   * 重试导航
   */
  async retryNavigation (route, options, retryCount) {
    if (retryCount <= 0) {
      throw new Error('Max retry attempts exceeded');
    }

    // 延迟重试
    await this.delay(this.config.retryDelay * retryCount);

    // 重试导航
    return this.navigateTo(route, {
      ...options,
      preload: false, // 跳过预加载以节省时间
      onSuccess: options.onSuccess,
      onError: options.onError
    });
  }

  /**
   * 错误分类
   */
  categorizeError (error) {
    if (error.code === 'ENOTFOUND' || error.message.includes('Failed to fetch')) {
      return 'network';
    }
    if (error.message.includes('timeout')) {
      return 'timeout';
    }
    if (error.status === 404 || error.message.includes('not found')) {
      return 'not_found';
    }
    if (error.status === 403 || error.status === 401) {
      return 'permission';
    }
    return 'unknown';
  }

  /**
   * 更新性能指标
   */
  updatePerformanceMetrics (duration, success) {
    this.performanceMetrics.navigationCount++;

    // 更新平均导航时间
    const currentAvg = this.performanceMetrics.averageNavigationTime;
    const count = this.performanceMetrics.navigationCount;
    this.performanceMetrics.averageNavigationTime =
      (currentAvg * (count - 1) + duration) / count;

    if (!success) {
      this.performanceMetrics.failedNavigations++;
    }

    if (duration > 1000) {
      this.performanceMetrics.slowNavigations++;
    }
  }

  /**
   * 记录慢导航
   */
  recordSlowNavigation (navigationId, duration) {
    console.warn(`Slow navigation detected: ${duration}ms for navigation ${navigationId}`);

    // 可以在这里添加性能监控上报
    if (window.gtag) {
      window.gtag('event', 'slow_navigation', {
        event_category: 'performance',
        event_label: navigationId,
        value: Math.round(duration)
      });
    }
  }

  /**
   * 记录导航历史
   */
  recordNavigationHistory (route, success) {
    const entry = {
      timestamp: Date.now(),
      route: typeof route === 'string' ? route : route.path || route.name,
      success,
      userAgent: navigator.userAgent
    };

    this.navigationState.navigationHistory.push(entry);

    // 限制历史记录数量
    if (this.navigationState.navigationHistory.length > 100) {
      this.navigationState.navigationHistory =
        this.navigationState.navigationHistory.slice(-100);
    }
  }

  /**
   * 获取常用路由
   */
  getFrequentRoutes () {
    const routeCounts = {};

    this.navigationState.navigationHistory.forEach(entry => {
      if (entry.success && entry.route) {
        routeCounts[entry.route] = (routeCounts[entry.route] || 0) + 1;
      }
    });

    // 返回最频繁的3个路由
    return Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([route]) => route);
  }

  /**
   * 获取相关路由（基于当前页面）
   */
  getRelatedRoutes () {
    const currentPath = this.router.currentRoute.value.path;
    const related = [];

    // 基于当前路径推断相关页面
    if (currentPath.includes('/calendar')) {
      related.push('/ai-assistant', '/settings');
    } else if (currentPath.includes('/ai-assistant')) {
      related.push('/calendar', '/settings');
    } else if (currentPath.includes('/settings')) {
      related.push('/calendar', '/profile');
    }

    return related;
  }

  /**
   * 工具方法
   */
  generateNavigationId () {
    return `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  createTimeoutPromise (timeout) {
    return new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error(`Navigation timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  delay (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async loadComponent (component) {
    if (typeof component === 'function') {
      return component();
    }
    return component;
  }

  async preloadRouteData (routeRecord) {
    // 这里可以实现路由数据的预加载
    // 例如：预加载API数据、静态资源等
    return Promise.resolve();
  }

  queueNavigation (route, options) {
    // 简单的导航队列实现
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.navigateTo(route, options));
      }, 100);
    });
  }

  setupRouterHooks () {
    if (!this.router) return;

    // 全局前置守卫
    this.router.beforeEach((to, from, next) => {
      // 可以在这里添加全局导航逻辑
      next();
    });

    // 全局后置钩子
    this.router.afterEach((to, from) => {
      // 导航完成后执行智能预加载
      this.intelligentPreload();
    });
  }

  setupPerformanceObserver () {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            // 记录导航性能指标
            console.log(`Navigation to ${entry.name} took ${entry.duration}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
    }
  }

  setupErrorHandling () {
    // 全局错误处理
    window.addEventListener('error', (event) => {
      if (event.message.includes('Failed to fetch dynamically imported module')) {
        console.error('Dynamic import failed:', event.message);
        this.navigationState.errorCount++;
      }
    });

    // 未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message &&
          event.reason.message.includes('Failed to fetch dynamically imported module')) {
        console.error('Unhandled promise rejection in navigation:', event.reason);
        this.navigationState.errorCount++;
      }
    });
  }

  startPreloadManager () {
    // 定期执行智能预加载
    setInterval(() => {
      if (!this.navigationState.isNavigating) {
        this.intelligentPreload();
      }
    }, 30000); // 每30秒检查一次
  }

  /**
   * 获取导航统计
   */
  getNavigationStats () {
    return {
      totalNavigations: this.performanceMetrics.navigationCount,
      averageTime: Math.round(this.performanceMetrics.averageNavigationTime),
      successRate: this.performanceMetrics.navigationCount > 0
        ? Math.round(((this.performanceMetrics.navigationCount - this.performanceMetrics.failedNavigations) / this.performanceMetrics.navigationCount) * 100)
        : 100,
      slowNavigations: this.performanceMetrics.slowNavigations,
      errorCount: this.navigationState.errorCount,
      recentHistory: this.navigationState.navigationHistory.slice(-10)
    };
  }

  /**
   * 重置统计
   */
  resetStats () {
    Object.assign(this.performanceMetrics, {
      averageNavigationTime: 0,
      navigationCount: 0,
      slowNavigations: 0,
      failedNavigations: 0
    });

    this.navigationState.errorCount = 0;
    this.navigationState.navigationHistory = [];
  }
}

// 创建单例实例
export const optimizedNavigation = new OptimizedNavigationService();
export default OptimizedNavigationService;
