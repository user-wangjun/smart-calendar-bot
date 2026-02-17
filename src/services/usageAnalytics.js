import { reactive } from 'vue';
// import { ref, computed } from 'vue';
// import { performanceOptimizer } from './performanceOptimizer';

/**
 * 使用分析服务
 * 提供全面的AI使用统计、分析和报告功能
 */
class UsageAnalytics {
  constructor () {
    this.usageData = reactive({
      daily: new Map(),
      weekly: new Map(),
      monthly: new Map(),
      yearly: new Map()
    });

    this.userBehavior = reactive({
      patterns: new Map(),
      preferences: new Map(),
      sessions: []
    });

    this.costAnalysis = reactive({
      dailyCosts: new Map(),
      monthlyCosts: new Map(),
      platformCosts: new Map(),
      modelCosts: new Map()
    });

    this.analyticsConfig = reactive({
      dataRetentionDays: 365,
      aggregationInterval: 5 * 60 * 1000, // 5分钟
      realTimeUpdates: true,
      exportFormats: ['json', 'csv', 'pdf'],
      privacyMode: false
    });

    this.currentSession = reactive({
      id: null,
      startTime: null,
      requests: [],
      totalTokens: 0,
      totalCost: 0,
      platforms: new Set(),
      models: new Set()
    });

    this.analytics = reactive({
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageCostPerRequest: 0,
      averageTokensPerRequest: 0,
      mostUsedPlatform: null,
      mostUsedModel: null,
      peakUsageTime: null,
      usageTrend: 'stable'
    });

    this.init();
  }

  /**
   * 初始化分析服务
   */
  init () {
    this.startNewSession();
    this.startDataCollection();
    this.startAnalyticsEngine();
    this.loadHistoricalData();
  }

  /**
   * 记录AI请求使用
   */
  async trackUsage (platform, model, request, response, cost, tokens, duration) {
    const timestamp = Date.now();
    const usageRecord = {
      id: `usage_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      platform,
      model,
      requestType: this.categorizeRequest(request),
      responseType: this.categorizeResponse(response),
      cost: cost || 0,
      tokens: tokens || 0,
      duration: duration || 0,
      success: response && !response.error,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };

    // 添加到当前会话
    this.currentSession.requests.push(usageRecord);
    this.currentSession.totalTokens += tokens || 0;
    this.currentSession.totalCost += cost || 0;
    this.currentSession.platforms.add(platform);
    this.currentSession.models.add(model);

    // 存储到相应的聚合级别
    this.addToDailyAggregation(usageRecord);
    this.addToWeeklyAggregation(usageRecord);
    this.addToMonthlyAggregation(usageRecord);
    this.addToYearlyAggregation(usageRecord);

    // 更新行为分析
    this.updateUserBehavior(usageRecord);

    // 更新成本分析
    this.updateCostAnalysis(usageRecord);

    // 触发实时分析更新
    if (this.analyticsConfig.realTimeUpdates) {
      this.updateRealTimeAnalytics();
    }

    // 保存到存储
    this.saveUsageRecord(usageRecord);

    return usageRecord;
  }

  /**
   * 开始新会话
   */
  startNewSession () {
    if (this.currentSession.id) {
      this.endCurrentSession();
    }

    this.currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      requests: [],
      totalTokens: 0,
      totalCost: 0,
      platforms: new Set(),
      models: new Set()
    };
  }

  /**
   * 结束当前会话
   */
  endCurrentSession () {
    if (!this.currentSession.id) return;

    const sessionData = {
      ...this.currentSession,
      endTime: Date.now(),
      duration: Date.now() - this.currentSession.startTime,
      platformCount: this.currentSession.platforms.size,
      modelCount: this.currentSession.models.size,
      requestCount: this.currentSession.requests.length
    };

    this.userBehavior.sessions.push(sessionData);

    // 限制会话历史数量
    if (this.userBehavior.sessions.length > 100) {
      this.userBehavior.sessions = this.userBehavior.sessions.slice(-100);
    }

    this.analyzeSession(sessionData);
  }

  /**
   * 获取使用统计
   */
  getUsageStats (timeRange = '7d', groupBy = 'day') {
    const now = Date.now();
    const startTime = this.getStartTime(timeRange);

    const stats = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      averageCostPerRequest: 0,
      averageTokensPerRequest: 0,
      successRate: 0,
      averageResponseTime: 0,
      platformDistribution: {},
      modelDistribution: {},
      hourlyDistribution: new Array(24).fill(0),
      dailyDistribution: {},
      trends: {
        requests: [],
        tokens: [],
        cost: []
      }
    };

    // 收集数据
    const relevantData = this.collectRelevantData(startTime, now);

    // 计算统计信息
    stats.totalRequests = relevantData.length;
    stats.totalTokens = relevantData.reduce((sum, record) => sum + (record.tokens || 0), 0);
    stats.totalCost = relevantData.reduce((sum, record) => sum + (record.cost || 0), 0);
    stats.averageCostPerRequest = stats.totalRequests > 0 ? stats.totalCost / stats.totalRequests : 0;
    stats.averageTokensPerRequest = stats.totalRequests > 0 ? stats.totalTokens / stats.totalRequests : 0;

    const successfulRequests = relevantData.filter(record => record.success);
    stats.successRate = stats.totalRequests > 0 ? (successfulRequests.length / stats.totalRequests) * 100 : 0;
    stats.averageResponseTime = relevantData.length > 0
      ? relevantData.reduce((sum, record) => sum + (record.duration || 0), 0) / relevantData.length
      : 0;

    // 平台分布
    stats.platformDistribution = this.calculateDistribution(relevantData, 'platform');

    // 模型分布
    stats.modelDistribution = this.calculateDistribution(relevantData, 'model');

    // 时间分布
    relevantData.forEach(record => {
      const date = new Date(record.timestamp);
      stats.hourlyDistribution[date.getHours()]++;

      const dayKey = date.toISOString().split('T')[0];
      if (!stats.dailyDistribution[dayKey]) {
        stats.dailyDistribution[dayKey] = 0;
      }
      stats.dailyDistribution[dayKey]++;
    });

    // 趋势分析
    stats.trends = this.calculateTrends(relevantData, groupBy);

    return stats;
  }

  /**
   * 获取成本分析
   */
  getCostAnalysis (timeRange = '30d') {
    const now = Date.now();
    const startTime = this.getStartTime(timeRange);

    const analysis = {
      totalCost: 0,
      dailyAverage: 0,
      monthlyProjection: 0,
      platformCosts: {},
      modelCosts: {},
      costTrend: [],
      efficiencyMetrics: {
        costPerToken: 0,
        costPerRequest: 0,
        mostEfficientPlatform: null,
        mostEfficientModel: null
      },
      recommendations: []
    };

    // 计算总成本
    this.costAnalysis.dailyCosts.forEach((cost, timestamp) => {
      if (timestamp >= startTime && timestamp <= now) {
        analysis.totalCost += cost;
      }
    });

    // 计算日均成本
    const days = Math.ceil((now - startTime) / (24 * 60 * 60 * 1000));
    analysis.dailyAverage = days > 0 ? analysis.totalCost / days : 0;
    analysis.monthlyProjection = analysis.dailyAverage * 30;

    // 平台成本分析
    analysis.platformCosts = this.calculatePlatformCosts(startTime, now);

    // 模型成本分析
    analysis.modelCosts = this.calculateModelCosts(startTime, now);

    // 成本趋势
    analysis.costTrend = this.calculateCostTrend(startTime, now);

    // 效率指标
    analysis.efficiencyMetrics = this.calculateEfficiencyMetrics(startTime, now);

    // 生成建议
    analysis.recommendations = this.generateCostRecommendations(analysis);

    return analysis;
  }

  /**
   * 获取用户行为分析
   */
  getUserBehaviorAnalysis () {
    const analysis = {
      usagePatterns: {},
      preferences: {},
      peakUsageTimes: [],
      favoritePlatforms: [],
      favoriteModels: [],
      sessionStats: {
        averageDuration: 0,
        averageRequestsPerSession: 0,
        totalSessions: this.userBehavior.sessions.length
      },
      behaviorInsights: []
    };

    // 使用模式分析
    analysis.usagePatterns = this.analyzeUsagePatterns();

    // 偏好分析
    analysis.preferences = this.analyzePreferences();

    // 高峰使用时间
    analysis.peakUsageTimes = this.findPeakUsageTimes();

    // 最喜欢的平台和模型
    analysis.favoritePlatforms = this.getFavoritePlatforms();
    analysis.favoriteModels = this.getFavoriteModels();

    // 会话统计
    if (this.userBehavior.sessions.length > 0) {
      const totalDuration = this.userBehavior.sessions.reduce((sum, session) => sum + session.duration, 0);
      const totalRequests = this.userBehavior.sessions.reduce((sum, session) => sum + session.requestCount, 0);

      analysis.sessionStats.averageDuration = totalDuration / this.userBehavior.sessions.length;
      analysis.sessionStats.averageRequestsPerSession = totalRequests / this.userBehavior.sessions.length;
    }

    // 行为洞察
    analysis.behaviorInsights = this.generateBehaviorInsights(analysis);

    return analysis;
  }

  /**
   * 生成使用报告
   */
  async generateUsageReport (timeRange = '30d', format = 'json') {
    const usageStats = this.getUsageStats(timeRange);
    const costAnalysis = this.getCostAnalysis(timeRange);
    const behaviorAnalysis = this.getUserBehaviorAnalysis();

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        timeRange,
        format,
        version: '1.0.0'
      },
      summary: {
        totalRequests: usageStats.totalRequests,
        totalTokens: usageStats.totalTokens,
        totalCost: costAnalysis.totalCost,
        averageDailyCost: costAnalysis.dailyAverage,
        successRate: usageStats.successRate,
        mostUsedPlatform: usageStats.platformDistribution[0]?.name,
        mostUsedModel: usageStats.modelDistribution[0]?.name
      },
      detailedStats: usageStats,
      costAnalysis,
      behaviorAnalysis,
      insights: this.generateInsights(usageStats, costAnalysis, behaviorAnalysis),
      recommendations: this.generateRecommendations(usageStats, costAnalysis, behaviorAnalysis)
    };

    // 根据格式导出
    if (format === 'csv') {
      return this.exportToCSV(report);
    } else if (format === 'pdf') {
      return this.exportToPDF(report);
    }

    return report;
  }

  /**
   * 实时分析更新
   */
  updateRealTimeAnalytics () {
    // 更新实时指标
    this.updateAnalyticsSummary();

    // 检查异常使用模式
    this.detectAnomalousUsage();

    // 更新趋势分析
    this.updateTrends();
  }

  /**
   * 数据聚合方法
   */
  addToDailyAggregation (record) {
    const date = new Date(record.timestamp).toDateString();

    if (!this.usageData.daily.has(date)) {
      this.usageData.daily.set(date, {
        date,
        requests: [],
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        platforms: new Set(),
        models: new Set()
      });
    }

    const dailyData = this.usageData.daily.get(date);
    dailyData.requests.push(record);
    dailyData.totalRequests++;
    dailyData.totalTokens += record.tokens;
    dailyData.totalCost += record.cost;
    dailyData.platforms.add(record.platform);
    dailyData.models.add(record.model);
  }

  addToWeeklyAggregation (record) {
    const week = this.getWeekKey(record.timestamp);

    if (!this.usageData.weekly.has(week)) {
      this.usageData.weekly.set(week, {
        week,
        requests: [],
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0
      });
    }

    const weeklyData = this.usageData.weekly.get(week);
    weeklyData.requests.push(record);
    weeklyData.totalRequests++;
    weeklyData.totalTokens += record.tokens;
    weeklyData.totalCost += record.cost;
  }

  addToMonthlyAggregation (record) {
    const month = this.getMonthKey(record.timestamp);

    if (!this.usageData.monthly.has(month)) {
      this.usageData.monthly.set(month, {
        month,
        requests: [],
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0
      });
    }

    const monthlyData = this.usageData.monthly.get(month);
    monthlyData.requests.push(record);
    monthlyData.totalRequests++;
    monthlyData.totalTokens += record.tokens;
    monthlyData.totalCost += record.cost;
  }

  addToYearlyAggregation (record) {
    const year = this.getYearKey(record.timestamp);

    if (!this.usageData.yearly.has(year)) {
      this.usageData.yearly.set(year, {
        year,
        requests: [],
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0
      });
    }

    const yearlyData = this.usageData.yearly.get(year);
    yearlyData.requests.push(record);
    yearlyData.totalRequests++;
    yearlyData.totalTokens += record.tokens;
    yearlyData.totalCost += record.cost;
  }

  /**
   * 辅助方法
   */
  categorizeRequest (request) {
    // 根据请求内容分类
    const prompt = request.prompt || request.messages?.[0]?.content || '';

    if (prompt.includes('翻译') || prompt.includes('translate')) return 'translation';
    if (prompt.includes('总结') || prompt.includes('summarize')) return 'summarization';
    if (prompt.includes('代码') || prompt.includes('code')) return 'code_generation';
    if (prompt.includes('写作') || prompt.includes('write')) return 'writing';
    if (prompt.includes('分析') || prompt.includes('analyze')) return 'analysis';

    return 'general';
  }

  categorizeResponse (response) {
    // 根据响应内容分类
    const content = response.content || '';

    if (content.includes('```')) return 'code';
    if (content.length > 1000) return 'long_form';
    if (content.includes('1.') || content.includes('*')) return 'list';

    return 'text';
  }

  getStartTime (timeRange) {
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };

    return now - (ranges[timeRange] || ranges['7d']);
  }

  getWeekKey (timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week}`;
  }

  getMonthKey (timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  getYearKey (timestamp) {
    return new Date(timestamp).getFullYear().toString();
  }

  getWeekNumber (date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  collectRelevantData (startTime, endTime) {
    const data = [];

    this.usageData.daily.forEach((dailyData, date) => {
      const dateTime = new Date(date).getTime();
      if (dateTime >= startTime && dateTime <= endTime) {
        data.push(...dailyData.requests);
      }
    });

    return data;
  }

  calculateDistribution (data, field) {
    const distribution = {};

    data.forEach(record => {
      const value = record[field];
      if (!distribution[value]) {
        distribution[value] = 0;
      }
      distribution[value]++;
    });

    return Object.entries(distribution)
      .map(([name, count]) => ({ name, count, percentage: (count / data.length) * 100 }))
      .sort((a, b) => b.count - a.count);
  }

  calculateTrends (data, groupBy) {
    const trends = {
      requests: [],
      tokens: [],
      cost: []
    };

    const grouped = {};

    data.forEach(record => {
      const key = this.getTrendKey(record.timestamp, groupBy);
      if (!grouped[key]) {
        grouped[key] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          timestamp: record.timestamp
        };
      }

      grouped[key].requests++;
      grouped[key].tokens += record.tokens || 0;
      grouped[key].cost += record.cost || 0;
    });

    Object.entries(grouped)
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .forEach(([key, values]) => {
        trends.requests.push({ key, value: values.requests });
        trends.tokens.push({ key, value: values.tokens });
        trends.cost.push({ key, value: values.cost });
      });

    return trends;
  }

  getTrendKey (timestamp, groupBy) {
    const date = new Date(timestamp);

    switch (groupBy) {
      case 'hour':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
      case 'day':
        return date.toDateString();
      case 'week':
        return this.getWeekKey(timestamp);
      case 'month':
        return this.getMonthKey(timestamp);
      default:
        return date.toDateString();
    }
  }

  calculatePlatformCosts (startTime, endTime) {
    const costs = {};

    this.costAnalysis.platformCosts.forEach((cost, timestamp) => {
      if (timestamp >= startTime && timestamp <= endTime) {
        Object.entries(cost).forEach(([platform, amount]) => {
          if (!costs[platform]) {
            costs[platform] = 0;
          }
          costs[platform] += amount;
        });
      }
    });

    return costs;
  }

  calculateModelCosts (startTime, endTime) {
    const costs = {};

    // 这里需要根据实际数据计算模型成本
    return costs;
  }

  calculateCostTrend (startTime, endTime) {
    const trend = [];

    this.costAnalysis.dailyCosts.forEach((cost, timestamp) => {
      if (timestamp >= startTime && timestamp <= endTime) {
        trend.push({
          timestamp,
          cost,
          date: new Date(timestamp).toISOString().split('T')[0]
        });
      }
    });

    return trend.sort((a, b) => a.timestamp - b.timestamp);
  }

  calculateEfficiencyMetrics (startTime, endTime) {
    const metrics = {
      costPerToken: 0,
      costPerRequest: 0,
      mostEfficientPlatform: null,
      mostEfficientModel: null
    };

    const relevantData = this.collectRelevantData(startTime, endTime);

    if (relevantData.length > 0) {
      const totalCost = relevantData.reduce((sum, record) => sum + (record.cost || 0), 0);
      const totalTokens = relevantData.reduce((sum, record) => sum + (record.tokens || 0), 0);

      metrics.costPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;
      metrics.costPerRequest = relevantData.length > 0 ? totalCost / relevantData.length : 0;
    }

    return metrics;
  }

  generateCostRecommendations (analysis) {
    const recommendations = [];

    if (analysis.dailyAverage > 10) {
      recommendations.push({
        type: 'cost',
        priority: 'high',
        message: '日均成本较高，建议优化使用模式',
        suggestion: '考虑使用更经济的模型或减少不必要的请求'
      });
    }

    if (analysis.efficiencyMetrics.costPerToken > 0.001) {
      recommendations.push({
        type: 'efficiency',
        priority: 'medium',
        message: '每令牌成本较高',
        suggestion: '尝试使用更高效的模型或优化提示词'
      });
    }

    return recommendations;
  }

  analyzeUsagePatterns () {
    const patterns = {
      daily: {},
      weekly: {},
      monthly: {}
    };

    // 分析每日模式
    this.usageData.daily.forEach((data, date) => {
      const dayOfWeek = new Date(date).getDay();
      if (!patterns.daily[dayOfWeek]) {
        patterns.daily[dayOfWeek] = 0;
      }
      patterns.daily[dayOfWeek] += data.totalRequests;
    });

    return patterns;
  }

  analyzePreferences () {
    const preferences = {
      platforms: this.getFavoritePlatforms(),
      models: this.getFavoriteModels(),
      requestTypes: this.getFavoriteRequestTypes()
    };

    return preferences;
  }

  findPeakUsageTimes () {
    const hourlyUsage = new Array(24).fill(0);

    this.usageData.daily.forEach(data => {
      data.requests.forEach(request => {
        const hour = new Date(request.timestamp).getHours();
        hourlyUsage[hour]++;
      });
    });

    const peakHours = [];
    const maxUsage = Math.max(...hourlyUsage);

    hourlyUsage.forEach((usage, hour) => {
      if (usage > maxUsage * 0.8) {
        peakHours.push(hour);
      }
    });

    return peakHours;
  }

  getFavoritePlatforms () {
    const platformUsage = {};

    this.usageData.daily.forEach(data => {
      data.requests.forEach(request => {
        if (!platformUsage[request.platform]) {
          platformUsage[request.platform] = 0;
        }
        platformUsage[request.platform]++;
      });
    });

    return Object.entries(platformUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([platform, count]) => ({ platform, count }));
  }

  getFavoriteModels () {
    const modelUsage = {};

    this.usageData.daily.forEach(data => {
      data.requests.forEach(request => {
        if (!modelUsage[request.model]) {
          modelUsage[request.model] = 0;
        }
        modelUsage[request.model]++;
      });
    });

    return Object.entries(modelUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([model, count]) => ({ model, count }));
  }

  getFavoriteRequestTypes () {
    const typeUsage = {};

    this.usageData.daily.forEach(data => {
      data.requests.forEach(request => {
        if (!typeUsage[request.requestType]) {
          typeUsage[request.requestType] = 0;
        }
        typeUsage[request.requestType]++;
      });
    });

    return Object.entries(typeUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  generateBehaviorInsights (analysis) {
    const insights = [];

    if (analysis.peakUsageTimes.length > 0) {
      insights.push({
        type: 'usage_pattern',
        insight: `高峰使用时间在 ${analysis.peakUsageTimes.join(', ')} 时`,
        recommendation: '考虑在这些时间段安排重要任务'
      });
    }

    if (analysis.favoritePlatforms.length > 0) {
      insights.push({
        type: 'preference',
        insight: `最常用平台: ${analysis.favoritePlatforms[0].platform}`,
        recommendation: '继续使用您偏好的平台以获得最佳体验'
      });
    }

    return insights;
  }

  generateInsights (usageStats, costAnalysis, behaviorAnalysis) {
    const insights = [];

    // 使用趋势洞察
    if (usageStats.trends.requests.length > 1) {
      const recent = usageStats.trends.requests.slice(-7);
      const avgRecent = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
      const avgPrevious = usageStats.trends.requests.slice(-14, -7).reduce((sum, item) => sum + item.value, 0) / 7;

      if (avgRecent > avgPrevious * 1.2) {
        insights.push({
          type: 'trend',
          level: 'info',
          message: '最近使用量有显著增长',
          suggestion: '考虑升级套餐以获得更多额度'
        });
      }
    }

    // 成本洞察
    if (costAnalysis.dailyAverage > 5) {
      insights.push({
        type: 'cost',
        level: 'warning',
        message: '日均成本较高',
        suggestion: '考虑使用更经济的模型或优化使用模式'
      });
    }

    return insights;
  }

  generateRecommendations (usageStats, costAnalysis, behaviorAnalysis) {
    const recommendations = [];

    // 基于使用模式的建议
    if (usageStats.successRate < 95) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: '提高成功率',
        description: '您的请求成功率低于95%，建议检查网络连接或尝试其他平台',
        action: '检查网络设置'
      });
    }

    // 基于成本的建议
    if (costAnalysis.dailyAverage > 10) {
      recommendations.push({
        type: 'cost',
        priority: 'medium',
        title: '优化成本',
        description: '日均成本较高，建议优化使用模式',
        action: '查看成本优化建议'
      });
    }

    return recommendations;
  }

  updateUserBehavior (record) {
    // 更新用户行为模式
    const hour = new Date(record.timestamp).getHours();
    const key = `hour_${hour}`;

    if (!this.userBehavior.patterns.has(key)) {
      this.userBehavior.patterns.set(key, 0);
    }

    this.userBehavior.patterns.set(key, this.userBehavior.patterns.get(key) + 1);
  }

  updateCostAnalysis (record) {
    const date = new Date(record.timestamp).toDateString();
    const dateKey = new Date(date).getTime();

    // 更新每日成本
    if (!this.costAnalysis.dailyCosts.has(dateKey)) {
      this.costAnalysis.dailyCosts.set(dateKey, 0);
    }
    this.costAnalysis.dailyCosts.set(dateKey, this.costAnalysis.dailyCosts.get(dateKey) + record.cost);

    // 更新平台成本
    if (!this.costAnalysis.platformCosts.has(dateKey)) {
      this.costAnalysis.platformCosts.set(dateKey, {});
    }
    const platformCosts = this.costAnalysis.platformCosts.get(dateKey);
    if (!platformCosts[record.platform]) {
      platformCosts[record.platform] = 0;
    }
    platformCosts[record.platform] += record.cost;
  }

  updateAnalyticsSummary () {
    const recentData = this.collectRelevantData(Date.now() - 24 * 60 * 60 * 1000, Date.now());

    this.analytics.totalRequests = recentData.length;
    this.analytics.totalTokens = recentData.reduce((sum, record) => sum + (record.tokens || 0), 0);
    this.analytics.totalCost = recentData.reduce((sum, record) => sum + (record.cost || 0), 0);
    this.analytics.averageCostPerRequest = recentData.length > 0 ? this.analytics.totalCost / recentData.length : 0;
    this.analytics.averageTokensPerRequest = recentData.length > 0 ? this.analytics.totalTokens / recentData.length : 0;
  }

  detectAnomalousUsage () {
    // 检测异常使用模式
    const recentUsage = this.getUsageStats('24h');
    const historicalAverage = this.getUsageStats('7d');

    if (recentUsage.totalRequests > historicalAverage.totalRequests * 3) {
      console.warn('检测到异常高使用量');
    }
  }

  updateTrends () {
    // 更新趋势分析
    const trends = this.getUsageStats('30d', 'day');

    if (trends.trends.requests.length > 1) {
      const recent = trends.trends.requests.slice(-7);
      const previous = trends.trends.requests.slice(-14, -7);

      const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
      const previousAvg = previous.reduce((sum, item) => sum + item.value, 0) / previous.length;

      if (recentAvg > previousAvg * 1.1) {
        this.analytics.usageTrend = 'increasing';
      } else if (recentAvg < previousAvg * 0.9) {
        this.analytics.usageTrend = 'decreasing';
      } else {
        this.analytics.usageTrend = 'stable';
      }
    }
  }

  analyzeSession (sessionData) {
    // 分析会话数据
    if (sessionData.duration > 3600000) { // 超过1小时
      console.log('长会话检测:', sessionData);
    }
  }

  saveUsageRecord (record) {
    // 保存使用记录到本地存储
    const key = `usage_${record.timestamp}`;
    localStorage.setItem(key, JSON.stringify(record));

    // 限制存储数量
    const keys = Object.keys(localStorage).filter(k => k.startsWith('usage_'));
    if (keys.length > 1000) {
      keys.sort().slice(0, keys.length - 1000).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }

  loadHistoricalData () {
    // 从本地存储加载历史数据
    const keys = Object.keys(localStorage).filter(k => k.startsWith('usage_'));

    keys.forEach(key => {
      try {
        const record = JSON.parse(localStorage.getItem(key));
        if (record && record.timestamp) {
          this.addToDailyAggregation(record);
          this.addToWeeklyAggregation(record);
          this.addToMonthlyAggregation(record);
          this.addToYearlyAggregation(record);
        }
      } catch (error) {
        console.warn('Failed to load usage record:', key, error);
      }
    });
  }

  startDataCollection () {
    // 定期清理旧数据
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // 每天清理一次
  }

  startAnalyticsEngine () {
    // 定期更新分析
    setInterval(() => {
      this.updateRealTimeAnalytics();
    }, this.analyticsConfig.aggregationInterval);
  }

  cleanupOldData () {
    const cutoffTime = Date.now() - (this.analyticsConfig.dataRetentionDays * 24 * 60 * 60 * 1000);

    // 清理聚合数据
    this.usageData.daily.forEach((data, date) => {
      if (new Date(date).getTime() < cutoffTime) {
        this.usageData.daily.delete(date);
      }
    });

    // 清理本地存储
    const keys = Object.keys(localStorage).filter(k => k.startsWith('usage_'));
    keys.forEach(key => {
      try {
        const record = JSON.parse(localStorage.getItem(key));
        if (record.timestamp < cutoffTime) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        localStorage.removeItem(key);
      }
    });
  }

  exportToCSV (report) {
    // 实现CSV导出
    const csvData = [];

    // 添加标题行
    csvData.push(['日期', '请求数', '令牌数', '成本', '成功率']);

    // 添加数据行
    report.detailedStats.trends.requests.forEach((item, index) => {
      csvData.push([
        item.key,
        item.value,
        report.detailedStats.trends.tokens[index]?.value || 0,
        report.detailedStats.trends.cost[index]?.value || 0,
        report.detailedStats.successRate.toFixed(2)
      ]);
    });

    return csvData.map(row => row.join(',')).join('\n');
  }

  exportToPDF (report) {
    // 实现PDF导出（这里返回模拟数据）
    return {
      format: 'pdf',
      content: `AI使用分析报告\n\n总请求数: ${report.summary.totalRequests}\n总成本: $${report.summary.totalCost.toFixed(2)}\n成功率: ${report.summary.successRate.toFixed(1)}%`,
      filename: `ai-usage-report-${new Date().toISOString().split('T')[0]}.pdf`
    };
  }
}

// 创建单例实例
export const usageAnalytics = new UsageAnalytics();
export default usageAnalytics;
