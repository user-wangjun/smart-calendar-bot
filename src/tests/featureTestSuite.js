/**
 * 功能测试套件
 * 测试提醒删除、跳转优化、AI消息发送等功能
 */

class FeatureTestSuite {
  constructor () {
    this.testResults = [];
    this.currentTest = null;
  }

  /**
   * 运行所有测试
   */
  async runAllTests () {
    console.log('🚀 开始功能测试...');

    const tests = [
      this.testReminderDeletion,
      this.testNavigationOptimization,
      this.testAIMessageSending,
      this.testCrossBrowserCompatibility,
      this.testMobileResponsiveness,
      this.testPerformanceMetrics
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.recordTestResult(test.name, false, error.message);
      }
    }

    this.generateTestReport();
    return this.getTestSummary();
  }

  /**
   * 测试提醒删除功能
   */
  async testReminderDeletion () {
    console.log('📋 测试提醒删除功能...');

    // 测试1: 创建测试提醒
    const testReminder = {
      id: 'test_reminder_001',
      eventId: 'test_event_001',
      eventTitle: '测试会议',
      eventTime: new Date(Date.now() + 3600000), // 1小时后
      reminderTime: new Date(Date.now() + 1800000), // 30分钟后
      minutesBefore: 30,
      type: 'meeting',
      priority: 'high'
    };

    // 模拟添加提醒
    const reminderScheduler = window.reminderScheduler;
    if (reminderScheduler) {
      reminderScheduler.scheduledReminders.set(testReminder.id, testReminder);
    }

    // 测试2: 验证提醒存在
    const exists = reminderScheduler && reminderScheduler.scheduledReminders.has(testReminder.id);
    this.recordTestResult('提醒创建', exists, exists ? '提醒创建成功' : '提醒创建失败');

    // 测试3: 测试删除功能
    let deleteSuccess = false;
    try {
      if (reminderScheduler) {
        const deleted = reminderScheduler.removeReminderById(testReminder.id);
        deleteSuccess = deleted !== null;
      }
    } catch (error) {
      console.error('删除提醒失败:', error);
    }

    this.recordTestResult('提醒删除', deleteSuccess, deleteSuccess ? '提醒删除成功' : '提醒删除失败');

    // 测试4: 验证删除后状态
    const deletedExists = reminderScheduler && reminderScheduler.scheduledReminders.has(testReminder.id);
    const deleteVerification = !deletedExists;
    this.recordTestResult('删除验证', deleteVerification, deleteVerification ? '提醒已完全删除' : '提醒仍存在');

    console.log('✅ 提醒删除功能测试完成');
  }

  /**
   * 测试跳转优化功能
   */
  async testNavigationOptimization () {
    console.log('🧭 测试跳转优化功能...');

    // 测试1: 基础导航性能
    const navigationTimes = [];
    const testRoutes = ['/calendar', '/ai-assistant', '/settings'];

    for (const route of testRoutes) {
      const startTime = performance.now();

      try {
        // 模拟导航
        if (window.optimizedNavigation) {
          await window.optimizedNavigation.navigateTo(route);
        }

        const endTime = performance.now();
        const navigationTime = endTime - startTime;
        navigationTimes.push(navigationTime);

        this.recordTestResult(
          `导航到${route}`,
          navigationTime < 1000,
          `导航时间: ${navigationTime.toFixed(2)}ms`
        );
      } catch (error) {
        this.recordTestResult(`导航到${route}`, false, `导航失败: ${error.message}`);
      }
    }

    // 测试2: 平均导航时间
    const averageTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    this.recordTestResult('平均导航时间', averageTime < 800, `平均: ${averageTime.toFixed(2)}ms`);

    // 测试3: 预加载功能
    let preloadSuccess = false;
    try {
      if (window.optimizedNavigation) {
        await window.optimizedNavigation.preloadRoutes(['/profile', '/settings']);
        preloadSuccess = true;
      }
    } catch (error) {
      console.error('预加载失败:', error);
    }

    this.recordTestResult('预加载功能', preloadSuccess, preloadSuccess ? '预加载成功' : '预加载失败');

    console.log('✅ 跳转优化功能测试完成');
  }

  /**
   * 测试AI消息发送功能
   */
  async testAIMessageSending () {
    console.log('🤖 测试AI消息发送功能...');

    const testMessages = [
      '你好，请介绍一下你自己',
      '今天天气怎么样？',
      '帮我安排一个会议'
    ];

    let successCount = 0;
    const responseTimes = [];

    for (const message of testMessages) {
      const startTime = performance.now();

      try {
        if (window.enhancedChatService) {
          const result = await window.enhancedChatService.sendMessage(message, {
            model: 'gpt-3.5-turbo',
            retryOnFailure: true,
            maxRetries: 2
          });

          const endTime = performance.now();
          const responseTime = endTime - startTime;
          responseTimes.push(responseTime);

          if (result.success) {
            successCount++;
            this.recordTestResult(
              `消息: "${message.substring(0, 20)}..."`,
              true,
              `成功, 响应时间: ${responseTime.toFixed(2)}ms`
            );
          } else {
            this.recordTestResult(
              `消息: "${message.substring(0, 20)}..."`,
              false,
              `失败: ${result.error}`
            );
          }
        } else {
          this.recordTestResult(
            `消息: "${message.substring(0, 20)}..."`,
            false,
            '聊天服务未初始化'
          );
        }
      } catch (error) {
        this.recordTestResult(
          `消息: "${message.substring(0, 20)}..."`,
          false,
          `异常: ${error.message}`
        );
      }
    }

    // 计算成功率
    const successRate = (successCount / testMessages.length) * 100;
    this.recordTestResult('消息发送成功率', successRate >= 80, `成功率: ${successRate.toFixed(1)}%`);

    // 计算平均响应时间
    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      this.recordTestResult('平均响应时间', avgResponseTime < 5000, `平均: ${avgResponseTime.toFixed(2)}ms`);
    }

    console.log('✅ AI消息发送功能测试完成');
  }

  /**
   * 测试跨浏览器兼容性
   */
  async testCrossBrowserCompatibility () {
    console.log('🌐 测试跨浏览器兼容性...');

    // 测试1: 浏览器特性检测
    const features = {
      localStorage: typeof Storage !== 'undefined',
      Promise: typeof Promise !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      IntersectionObserver: typeof IntersectionObserver !== 'undefined',
      ResizeObserver: typeof ResizeObserver !== 'undefined',
      'CSS.supports': typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
    };

    let supportedFeatures = 0;
    for (const [feature, supported] of Object.entries(features)) {
      if (supported) supportedFeatures++;
      this.recordTestResult(`浏览器特性: ${feature}`, supported, supported ? '支持' : '不支持');
    }

    const featureSupportRate = (supportedFeatures / Object.keys(features).length) * 100;
    this.recordTestResult('浏览器特性支持率', featureSupportRate >= 80, `支持率: ${featureSupportRate.toFixed(1)}%`);

    // 测试2: CSS兼容性
    const cssTests = [
      { property: 'display', value: 'flex' },
      { property: 'display', value: 'grid' },
      { property: 'backdrop-filter', value: 'blur(10px)' },
      { property: 'transition', value: 'all 0.3s ease' }
    ];

    let cssSupportCount = 0;
    for (const test of cssTests) {
      const supported = CSS.supports(test.property, test.value);
      if (supported) cssSupportCount++;
      this.recordTestResult(`CSS特性: ${test.property}: ${test.value}`, supported, supported ? '支持' : '不支持');
    }

    const cssSupportRate = (cssSupportCount / cssTests.length) * 100;
    this.recordTestResult('CSS特性支持率', cssSupportRate >= 75, `支持率: ${cssSupportRate.toFixed(1)}%`);

    console.log('✅ 跨浏览器兼容性测试完成');
  }

  /**
   * 测试移动端响应性
   */
  async testMobileResponsiveness () {
    console.log('📱 测试移动端响应性...');

    // 测试1: 视口检测
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth <= 768;

    this.recordTestResult('移动端检测', true, `视口: ${viewportWidth}x${viewportHeight}, 移动端: ${isMobile}`);

    // 测试2: 触摸事件支持
    const touchSupported = 'ontouchstart' in window;
    this.recordTestResult('触摸事件支持', touchSupported, touchSupported ? '支持触摸事件' : '不支持触摸事件');

    // 测试3: 响应式断点
    const breakpoints = {
      xs: viewportWidth < 576,
      sm: viewportWidth >= 576 && viewportWidth < 768,
      md: viewportWidth >= 768 && viewportWidth < 992,
      lg: viewportWidth >= 992 && viewportWidth < 1200,
      xl: viewportWidth >= 1200
    };

    let currentBreakpoint = 'unknown';
    for (const [breakpoint, matches] of Object.entries(breakpoints)) {
      if (matches) {
        currentBreakpoint = breakpoint;
        break;
      }
    }

    this.recordTestResult('响应式断点', true, `当前断点: ${currentBreakpoint}`);

    // 测试4: 性能指标
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      this.recordTestResult('网络连接类型', true, `类型: ${connection.effectiveType}, 速度: ${connection.downlink}Mbps`);
    }

    console.log('✅ 移动端响应性测试完成');
  }

  /**
   * 测试性能指标
   */
  async testPerformanceMetrics () {
    console.log('⚡ 测试性能指标...');

    // 测试1: 页面加载性能
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;

      this.recordTestResult('页面加载时间', loadTime < 3000, `加载时间: ${loadTime}ms`);
      this.recordTestResult('DOM就绪时间', domReadyTime < 2000, `DOM就绪: ${domReadyTime}ms`);
    }

    // 测试2: 内存使用
    if (window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      const usedMemory = memory.usedJSHeapSize;
      const totalMemory = memory.totalJSHeapSize;
      const memoryUsage = (usedMemory / totalMemory) * 100;

      this.recordTestResult('内存使用率', memoryUsage < 80, `内存使用: ${memoryUsage.toFixed(1)}%`);
    }

    // 测试3: 首次内容绘制 (FCP)
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');

      if (fcpEntry) {
        this.recordTestResult('首次内容绘制', fcpEntry.startTime < 2000, `FCP: ${fcpEntry.startTime.toFixed(2)}ms`);
      }
    }

    // 测试4: 最大内容绘制 (LCP)
    if (window.performance && window.performance.getEntriesByType) {
      const lcpEntries = window.performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        const lcp = lcpEntries[lcpEntries.length - 1];
        this.recordTestResult('最大内容绘制', lcp.startTime < 2500, `LCP: ${lcp.startTime.toFixed(2)}ms`);
      }
    }

    console.log('✅ 性能指标测试完成');
  }

  /**
   * 记录测试结果
   */
  recordTestResult (testName, success, details = '') {
    const result = {
      testName,
      success,
      details,
      timestamp: new Date().toISOString()
    };

    this.testResults.push(result);

    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
  }

  /**
   * 生成测试报告
   */
  generateTestReport () {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;

    console.log('\n📊 测试报告总结:');
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过测试: ${passedTests}`);
    console.log(`失败测试: ${failedTests}`);
    console.log(`成功率: ${successRate.toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.testName}: ${r.details}`));
    }

    // 保存到本地存储
    try {
      localStorage.setItem('lastTestReport', JSON.stringify({
        timestamp: new Date().toISOString(),
        totalTests,
        passedTests,
        failedTests,
        successRate,
        results: this.testResults
      }));
    } catch (error) {
      console.warn('无法保存测试报告:', error);
    }
  }

  /**
   * 获取测试摘要
   */
  getTestSummary () {
    const passedTests = this.testResults.filter(r => r.success).length;
    const totalTests = this.testResults.length;
    const successRate = (passedTests / totalTests) * 100;

    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      successRate,
      passed: successRate >= 80,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取详细测试结果
   */
  getDetailedResults () {
    return {
      summary: this.getTestSummary(),
      results: [...this.testResults]
    };
  }
}

// 创建全局测试实例
window.featureTestSuite = new FeatureTestSuite();

// 自动运行测试（可选）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // 延迟执行，确保所有组件都已加载
    setTimeout(() => {
      window.featureTestSuite.runAllTests().then(summary => {
        console.log('🎉 所有测试完成！', summary);
      }).catch(console.error);
    }, 2000);
  });
} else {
  // 如果已经加载，直接运行
  setTimeout(() => {
    window.featureTestSuite.runAllTests().then(summary => {
      console.log('🎉 所有测试完成！', summary);
    }).catch(console.error);
  }, 2000);
}

export default FeatureTestSuite;
