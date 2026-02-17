import { ref, computed } from 'vue';
import unifiedModelConfig from '../config/unifiedModelConfig.js';
import { useSettingsStore } from '../stores/settings.js';
import { useUserProfileStore } from '../stores/userProfile.js';

/**
 * 智能模型路由服务
 * 根据用户偏好、预算、任务类型和性能指标选择最优AI模型
 */
export class ModelRouter {
  constructor () {
    this.settingsStore = useSettingsStore();
    this.userProfileStore = useUserProfileStore();
    this.currentModel = ref(null);
    this.modelHistory = ref([]);
    this.performanceMetrics = ref(new Map());
    this.userPreferences = ref({});
    this.budgetTracker = ref({
      daily: 0,
      monthly: 0,
      lastReset: new Date()
    });

    this.init();
  }

  /**
   * 初始化服务
   */
  async init () {
    await this.loadUserPreferences();
    await this.loadPerformanceMetrics();
    await this.loadBudgetTracker();
    this.startBudgetResetTimer();
  }

  /**
   * 加载用户偏好设置
   */
  async loadUserPreferences () {
    try {
      const settings = this.settingsStore.settings || {};
      const profile = this.userProfileStore.profile || {};

      this.userPreferences.value = {
        priorityMode: settings.aiModelSettings?.priorityMode || 'balanced', // balanced, speed, quality, cost
        preferredPlatforms: settings.apiKeys?.filter(key => key.isActive).map(key => key.platform) || [],
        language: profile.language || 'zh-CN',
        maxBudget: settings.aiModelSettings?.maxBudget || 100,
        taskTypes: settings.aiModelSettings?.preferredTaskTypes || ['chat', 'analysis'],
        responseTimePreference: settings.aiModelSettings?.responseTimePreference || 'medium', // fast, medium, slow
        qualityPreference: settings.aiModelSettings?.qualityPreference || 'high', // low, medium, high
        complexityHandling: settings.aiModelSettings?.complexityHandling || 'adaptive' // simple, adaptive, complex
      };
    } catch (error) {
      console.error('加载用户偏好失败:', error);
      this.userPreferences.value = this.getDefaultPreferences();
    }
  }

  /**
   * 获取默认偏好设置
   */
  getDefaultPreferences () {
    return {
      priorityMode: 'balanced',
      preferredPlatforms: ['openai', 'anthropic'],
      language: 'zh-CN',
      maxBudget: 100,
      taskTypes: ['chat', 'analysis'],
      responseTimePreference: 'medium',
      qualityPreference: 'high',
      complexityHandling: 'adaptive'
    };
  }

  /**
   * 加载性能指标
   */
  async loadPerformanceMetrics () {
    try {
      const stored = localStorage.getItem('modelPerformanceMetrics');
      if (stored) {
        const metrics = JSON.parse(stored);
        this.performanceMetrics.value = new Map(Object.entries(metrics));
      }
    } catch (error) {
      console.error('加载性能指标失败:', error);
    }
  }

  /**
   * 保存性能指标
   */
  async savePerformanceMetrics () {
    try {
      const metricsObj = Object.fromEntries(this.performanceMetrics.value);
      localStorage.setItem('modelPerformanceMetrics', JSON.stringify(metricsObj));
    } catch (error) {
      console.error('保存性能指标失败:', error);
    }
  }

  /**
   * 加载预算跟踪器
   */
  async loadBudgetTracker () {
    try {
      const stored = localStorage.getItem('budgetTracker');
      if (stored) {
        this.budgetTracker.value = JSON.parse(stored);
        // 检查是否需要重置预算
        this.checkAndResetBudget();
      }
    } catch (error) {
      console.error('加载预算跟踪器失败:', error);
    }
  }

  /**
   * 保存预算跟踪器
   */
  async saveBudgetTracker () {
    try {
      localStorage.setItem('budgetTracker', JSON.stringify(this.budgetTracker.value));
    } catch (error) {
      console.error('保存预算跟踪器失败:', error);
    }
  }

  /**
   * 检查并重置预算
   */
  checkAndResetBudget () {
    const now = new Date();
    const lastReset = new Date(this.budgetTracker.value.lastReset);

    // 检查是否需要重置日预算
    if (now.getDate() !== lastReset.getDate()) {
      this.budgetTracker.value.daily = 0;
      this.budgetTracker.value.lastReset = now.toISOString();
    }

    // 检查是否需要重置月预算
    if (now.getMonth() !== lastReset.getMonth()) {
      this.budgetTracker.value.monthly = 0;
    }
  }

  /**
   * 启动预算重置定时器
   */
  startBudgetResetTimer () {
    // 每天检查一次预算重置
    setInterval(() => {
      this.checkAndResetBudget();
      this.saveBudgetTracker();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * 选择最优模型
   * @param {Object} options - 选择选项
   * @param {string} options.taskType - 任务类型
   * @param {string} options.content - 输入内容
   * @param {Object} options.constraints - 约束条件
   * @returns {Promise<Object>} 选择的模型配置
   */
  async selectModel (options = {}) {
    const {
      taskType = 'chat',
      content = '',
      constraints = {}
    } = options;

    try {
      // 分析任务复杂度
      const complexity = this.analyzeTaskComplexity(content, taskType);

      // 获取可用模型列表
      const availableModels = this.getAvailableModels(taskType, complexity);

      // 根据用户偏好过滤模型
      const filteredModels = this.filterModelsByPreferences(availableModels);

      // 根据约束条件进一步过滤
      const constrainedModels = this.applyConstraints(filteredModels, constraints);

      // 计算模型得分
      const scoredModels = this.scoreModels(constrainedModels, {
        taskType,
        complexity,
        content,
        constraints
      });

      // 选择得分最高的模型
      const selectedModel = scoredModels[0];

      if (selectedModel) {
        this.currentModel.value = selectedModel;
        this.recordModelUsage(selectedModel, taskType, complexity);

        // 检查预算
        const estimatedCost = this.estimateCost(selectedModel, content);
        if (!this.checkBudget(estimatedCost)) {
          throw new Error('预算不足，请选择其他模型或调整预算设置');
        }

        return selectedModel;
      } else {
        throw new Error('没有找到合适的模型，请检查API密钥和设置');
      }
    } catch (error) {
      console.error('模型选择失败:', error);
      throw error;
    }
  }

  /**
   * 分析任务复杂度
   */
  analyzeTaskComplexity (content, taskType) {
    const factors = {
      length: content.length,
      languageComplexity: this.calculateLanguageComplexity(content),
      technicalTerms: this.countTechnicalTerms(content),
      taskComplexity: this.getTaskComplexityScore(taskType)
    };

    const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);

    if (totalScore < 50) return 'simple';
    if (totalScore < 150) return 'medium';
    return 'complex';
  }

  /**
   * 计算语言复杂度
   */
  calculateLanguageComplexity (content) {
    // 简化的语言复杂度计算
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    const complexWords = content.match(/[a-zA-Z]{6,}/g)?.length || 0;

    return (avgSentenceLength * 0.5) + (complexWords * 2);
  }

  /**
   * 计算技术术语数量
   */
  countTechnicalTerms (content) {
    const technicalTerms = [
      'API', '算法', '模型', '数据', '代码', '编程', '函数', '变量',
      '数据库', '服务器', '前端', '后端', '框架', '库', '接口'
    ];

    return technicalTerms.filter(term => content.includes(term)).length * 10;
  }

  /**
   * 获取任务复杂度分数
   */
  getTaskComplexityScore (taskType) {
    const scores = {
      chat: 10,
      analysis: 30,
      translation: 20,
      summarization: 25,
      'code-generation': 40,
      'creative-writing': 35,
      'data-processing': 45,
      'image-analysis': 50
    };

    return scores[taskType] || 20;
  }

  /**
   * 获取可用模型列表
   */
  getAvailableModels (taskType, complexity) {
    const models = [];
    const platforms = this.userPreferences.value.preferredPlatforms;

    platforms.forEach(platform => {
      const platformModels = unifiedModelConfig.getModelsByPlatform(platform);
      const suitableModels = platformModels.filter(model => {
        // 检查模型是否支持任务类型
        const supportsTask = model.features.includes(taskType) ||
                           model.features.includes('general');

        // 检查复杂度匹配
        const complexityMatch = this.matchComplexity(model, complexity);

        // 检查语言支持
        const languageSupport = this.checkLanguageSupport(model);

        return supportsTask && complexityMatch && languageSupport;
      });

      models.push(...suitableModels.map(model => ({
        ...model,
        platform,
        availability: this.checkModelAvailability(platform, model.id)
      })));
    });

    return models;
  }

  /**
   * 匹配复杂度
   */
  matchComplexity (model, complexity) {
    const complexityMap = {
      simple: ['low', 'medium', 'high'],
      medium: ['medium', 'high'],
      complex: ['high']
    };

    return complexityMap[complexity]?.includes(model.complexityHandling);
  }

  /**
   * 检查语言支持
   */
  checkLanguageSupport (model) {
    const userLanguage = this.userPreferences.value.language;
    return model.languages.includes(userLanguage) ||
           model.languages.includes('multilingual');
  }

  /**
   * 检查模型可用性
   */
  checkModelAvailability (platform, modelId) {
    // 这里可以添加实际的API可用性检查
    // 目前返回true表示默认可用
    return true;
  }

  /**
   * 根据用户偏好过滤模型
   */
  filterModelsByPreferences (models) {
    const preferences = this.userPreferences.value;

    return models.filter(model => {
      // 过滤价格
      if (model.pricing?.input > preferences.maxBudget * 0.1) {
        return false;
      }

      // 过滤响应时间
      if (preferences.responseTimePreference === 'fast' &&
          model.averageResponseTime > 2000) {
        return false;
      }

      if (preferences.responseTimePreference === 'slow' &&
          model.averageResponseTime < 500) {
        return false;
      }

      // 过滤质量偏好
      if (preferences.qualityPreference === 'high' &&
          model.qualityScore < 8) {
        return false;
      }

      if (preferences.qualityPreference === 'low' &&
          model.qualityScore > 6) {
        return false;
      }

      return true;
    });
  }

  /**
   * 应用约束条件
   */
  applyConstraints (models, constraints) {
    return models.filter(model => {
      // 最大令牌数约束
      if (constraints.maxTokens && model.maxTokens < constraints.maxTokens) {
        return false;
      }

      // 最大成本约束
      if (constraints.maxCost && model.pricing?.input > constraints.maxCost) {
        return false;
      }

      // 响应时间约束
      if (constraints.maxResponseTime &&
          model.averageResponseTime > constraints.maxResponseTime) {
        return false;
      }

      return true;
    });
  }

  /**
   * 为模型打分
   */
  scoreModels (models, context) {
    const { taskType, complexity, content } = context;
    // const { constraints } = context;
    const preferences = this.userPreferences.value;

    return models.map(model => {
      let score = 0;

      // 基础分数
      score += model.qualityScore * 10;

      // 任务类型匹配度
      const taskMatchScore = this.calculateTaskMatchScore(model, taskType);
      score += taskMatchScore;

      // 复杂度匹配度
      const complexityScore = this.calculateComplexityScore(model, complexity);
      score += complexityScore;

      // 成本效益
      const costEffectiveness = this.calculateCostEffectiveness(model, content);
      score += costEffectiveness;

      // 响应时间
      const responseTimeScore = this.calculateResponseTimeScore(model);
      score += responseTimeScore;

      // 历史表现
      const historyScore = this.calculateHistoryScore(model);
      score += historyScore;

      // 用户偏好模式
      const preferenceScore = this.calculatePreferenceScore(model, preferences);
      score += preferenceScore;

      return {
        ...model,
        score,
        scoreBreakdown: {
          quality: model.qualityScore * 10,
          taskMatch: taskMatchScore,
          complexity: complexityScore,
          cost: costEffectiveness,
          responseTime: responseTimeScore,
          history: historyScore,
          preference: preferenceScore
        }
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * 计算任务匹配分数
   */
  calculateTaskMatchScore (model, taskType) {
    if (model.features.includes(taskType)) {
      return 20;
    } else if (model.features.includes('general')) {
      return 10;
    }
    return 0;
  }

  /**
   * 计算复杂度分数
   */
  calculateComplexityScore (model, complexity) {
    const complexityScores = {
      simple: { low: 15, medium: 10, high: 5 },
      medium: { low: 5, medium: 20, high: 15 },
      complex: { low: 0, medium: 10, high: 25 }
    };

    return complexityScores[complexity]?.[model.complexityHandling] || 0;
  }

  /**
   * 计算成本效益
   */
  calculateCostEffectiveness (model, content) {
    const estimatedTokens = this.estimateTokens(content);
    const cost = (estimatedTokens / 1000) * model.pricing.input;

    // 成本越低分数越高，但考虑质量平衡
    const maxBudget = this.userPreferences.value.maxBudget;
    const costRatio = cost / maxBudget;

    if (costRatio < 0.01) return 25;
    if (costRatio < 0.05) return 20;
    if (costRatio < 0.1) return 15;
    if (costRatio < 0.2) return 10;
    return 5;
  }

  /**
   * 计算响应时间分数
   */
  calculateResponseTimeScore (model) {
    const responseTime = model.averageResponseTime;

    if (responseTime < 1000) return 20;
    if (responseTime < 2000) return 15;
    if (responseTime < 5000) return 10;
    return 5;
  }

  /**
   * 计算历史分数
   */
  calculateHistoryScore (model) {
    const key = `${model.platform}-${model.id}`;
    const metrics = this.performanceMetrics.value.get(key);

    if (!metrics) return 10; // 默认分数

    const successRate = metrics.successCount / (metrics.successCount + metrics.errorCount);
    const avgQuality = metrics.totalQuality / metrics.successCount;

    return (successRate * 15) + (avgQuality * 5);
  }

  /**
   * 计算偏好分数
   */
  calculatePreferenceScore (model, preferences) {
    let score = 0;

    // 平台偏好
    if (preferences.preferredPlatforms.includes(model.platform)) {
      score += 10;
    }

    // 质量偏好
    if (preferences.qualityPreference === 'high' && model.qualityScore >= 8) {
      score += 5;
    } else if (preferences.qualityPreference === 'low' && model.qualityScore <= 6) {
      score += 5;
    }

    return score;
  }

  /**
   * 估算令牌数
   */
  estimateTokens (content) {
    // 简化的令牌估算：中文字符按1.5倍计算，英文按0.8倍
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishChars = (content.match(/[a-zA-Z]/g) || []).length;
    const otherChars = content.length - chineseChars - englishChars;

    return Math.ceil(chineseChars * 1.5 + englishChars * 0.8 + otherChars * 1.2);
  }

  /**
   * 估算成本
   */
  estimateCost (model, content) {
    const tokens = this.estimateTokens(content);
    return (tokens / 1000) * model.pricing.input;
  }

  /**
   * 检查预算
   */
  checkBudget (estimatedCost) {
    const maxBudget = this.userPreferences.value.maxBudget;
    const dailyBudget = maxBudget / 30; // 假设月预算平均分配到每天

    return (this.budgetTracker.value.daily + estimatedCost) <= dailyBudget &&
           (this.budgetTracker.value.monthly + estimatedCost) <= maxBudget;
  }

  /**
   * 记录模型使用
   */
  recordModelUsage (model, taskType, complexity) {
    const usage = {
      model: `${model.platform}-${model.id}`,
      taskType,
      complexity,
      timestamp: new Date().toISOString(),
      cost: 0, // 将在实际使用后更新
      tokens: 0,
      quality: 0
    };

    this.modelHistory.value.unshift(usage);

    // 保持历史记录在合理范围内
    if (this.modelHistory.value.length > 1000) {
      this.modelHistory.value = this.modelHistory.value.slice(0, 1000);
    }

    this.saveModelHistory();
  }

  /**
   * 保存模型历史
   */
  async saveModelHistory () {
    try {
      localStorage.setItem('modelHistory', JSON.stringify(this.modelHistory.value));
    } catch (error) {
      console.error('保存模型历史失败:', error);
    }
  }

  /**
   * 更新性能指标
   */
  updatePerformanceMetrics (modelKey, success, quality = 0, responseTime = 0, cost = 0) {
    const metrics = this.performanceMetrics.value.get(modelKey) || {
      successCount: 0,
      errorCount: 0,
      totalQuality: 0,
      totalResponseTime: 0,
      totalCost: 0,
      lastUsed: null
    };

    if (success) {
      metrics.successCount++;
      metrics.totalQuality += quality;
      metrics.totalResponseTime += responseTime;
    } else {
      metrics.errorCount++;
    }

    metrics.totalCost += cost;
    metrics.lastUsed = new Date().toISOString();

    this.performanceMetrics.value.set(modelKey, metrics);
    this.savePerformanceMetrics();
  }

  /**
   * 获取协作过滤推荐
   */
  async getCollaborativeRecommendations (taskType, content) {
    // 这里可以实现基于用户行为的协作过滤
    // 目前返回基于历史使用的简单推荐
    const similarTasks = this.modelHistory.value.filter(usage =>
      usage.taskType === taskType
    );

    const modelCounts = {};
    similarTasks.forEach(usage => {
      modelCounts[usage.model] = (modelCounts[usage.model] || 0) + 1;
    });

    return Object.entries(modelCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([model]) => model);
  }

  /**
   * 获取当前模型
   */
  getCurrentModel () {
    return this.currentModel.value;
  }

  /**
   * 获取模型历史
   */
  getModelHistory (limit = 100) {
    return this.modelHistory.value.slice(0, limit);
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats () {
    const stats = {
      totalUsage: this.modelHistory.value.length,
      successRate: 0,
      averageQuality: 0,
      totalCost: 0,
      platformStats: {},
      modelStats: {}
    };

    if (stats.totalUsage === 0) return stats;

    let successCount = 0;
    let totalQuality = 0;

    this.modelHistory.value.forEach(usage => {
      if (usage.quality > 0) {
        successCount++;
        totalQuality += usage.quality;
      }

      // 平台统计
      const [platform] = usage.model.split('-');
      stats.platformStats[platform] = (stats.platformStats[platform] || 0) + 1;

      // 模型统计
      stats.modelStats[usage.model] = (stats.modelStats[usage.model] || 0) + 1;

      // 总成本
      stats.totalCost += usage.cost || 0;
    });

    stats.successRate = successCount / stats.totalUsage;
    stats.averageQuality = totalQuality / successCount || 0;

    return stats;
  }

  /**
   * 重置预算
   */
  resetBudget () {
    this.budgetTracker.value = {
      daily: 0,
      monthly: 0,
      lastReset: new Date().toISOString()
    };
    this.saveBudgetTracker();
  }

  /**
   * 更新用户偏好
   */
  updatePreferences (newPreferences) {
    this.userPreferences.value = {
      ...this.userPreferences.value,
      ...newPreferences
    };
    this.saveUserPreferences();
  }

  /**
   * 保存用户偏好
   */
  async saveUserPreferences () {
    try {
      // 更新到设置存储
      await this.settingsStore.updateAIModelSettings({
        priorityMode: this.userPreferences.value.priorityMode,
        maxBudget: this.userPreferences.value.maxBudget,
        preferredTaskTypes: this.userPreferences.value.taskTypes,
        responseTimePreference: this.userPreferences.value.responseTimePreference,
        qualityPreference: this.userPreferences.value.qualityPreference,
        complexityHandling: this.userPreferences.value.complexityHandling
      });
    } catch (error) {
      console.error('保存用户偏好失败:', error);
    }
  }
}

// 创建单例实例
export const modelRouter = new ModelRouter();

/**
 * 模型路由组合式函数
 */
export function useModelRouter () {
  return {
    // 状态
    currentModel: computed(() => modelRouter.currentModel.value),
    modelHistory: computed(() => modelRouter.modelHistory.value),
    performanceMetrics: computed(() => modelRouter.performanceMetrics.value),
    userPreferences: computed(() => modelRouter.userPreferences.value),
    budgetTracker: computed(() => modelRouter.budgetTracker.value),

    // 方法
    selectModel: modelRouter.selectModel.bind(modelRouter),
    getCollaborativeRecommendations: modelRouter.getCollaborativeRecommendations.bind(modelRouter),
    getCurrentModel: modelRouter.getCurrentModel.bind(modelRouter),
    getModelHistory: modelRouter.getModelHistory.bind(modelRouter),
    getPerformanceStats: modelRouter.getPerformanceStats.bind(modelRouter),
    resetBudget: modelRouter.resetBudget.bind(modelRouter),
    updatePreferences: modelRouter.updatePreferences.bind(modelRouter),
    updatePerformanceMetrics: modelRouter.updatePerformanceMetrics.bind(modelRouter)
  };
}
