import { ref, computed } from 'vue';
import { useUserPreferencesStore } from '../stores/userPreferences.js';

/**
 * 个性化推荐服务
 * 基于用户行为、偏好和内容分析提供智能推荐
 */
export class RecommendationService {
  constructor () {
    this.userPreferencesStore = useUserPreferencesStore();
    this.recommendations = ref([]);
    this.userBehavior = ref({
      interactions: [],
      preferences: {},
      history: [],
      patterns: {}
    });
    this.contentIndex = ref(new Map());
    this.similarityMatrix = ref(new Map());
    this.recommendationCache = ref(new Map());
    this.isLearning = ref(false);
    this.recommendationStats = ref({
      totalRecommendations: 0,
      acceptedRecommendations: 0,
      rejectedRecommendations: 0,
      accuracy: 0
    });

    this.init();
  }

  /**
   * 初始化推荐服务
   */
  async init () {
    await this.loadUserBehavior();
    await this.loadContentIndex();
    await this.loadRecommendationStats();
    this.startLearningProcess();
    this.startCacheCleanup();
  }

  /**
   * 加载用户行为数据
   */
  async loadUserBehavior () {
    try {
      const stored = localStorage.getItem('userBehaviorData');
      if (stored) {
        const data = JSON.parse(stored);
        this.userBehavior.value = {
          interactions: data.interactions || [],
          preferences: data.preferences || {},
          history: data.history || [],
          patterns: data.patterns || {}
        };
      }
    } catch (error) {
      console.error('加载用户行为数据失败:', error);
    }
  }

  /**
   * 保存用户行为数据
   */
  async saveUserBehavior () {
    try {
      const data = {
        interactions: this.userBehavior.value.interactions,
        preferences: this.userBehavior.value.preferences,
        history: this.userBehavior.value.history,
        patterns: this.userBehavior.value.patterns,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('userBehaviorData', JSON.stringify(data));
    } catch (error) {
      console.error('保存用户行为数据失败:', error);
    }
  }

  /**
   * 加载内容索引
   */
  async loadContentIndex () {
    try {
      const stored = localStorage.getItem('contentIndex');
      if (stored) {
        const indexData = JSON.parse(stored);
        this.contentIndex.value = new Map(Object.entries(indexData));
      }
    } catch (error) {
      console.error('加载内容索引失败:', error);
    }
  }

  /**
   * 保存内容索引
   */
  async saveContentIndex () {
    try {
      const indexObj = Object.fromEntries(this.contentIndex.value);
      localStorage.setItem('contentIndex', JSON.stringify(indexObj));
    } catch (error) {
      console.error('保存内容索引失败:', error);
    }
  }

  /**
   * 加载推荐统计
   */
  async loadRecommendationStats () {
    try {
      const stored = localStorage.getItem('recommendationStats');
      if (stored) {
        this.recommendationStats.value = JSON.parse(stored);
      }
    } catch (error) {
      console.error('加载推荐统计失败:', error);
    }
  }

  /**
   * 保存推荐统计
   */
  async saveRecommendationStats () {
    try {
      localStorage.setItem('recommendationStats', JSON.stringify(this.recommendationStats.value));
    } catch (error) {
      console.error('保存推荐统计失败:', error);
    }
  }

  /**
   * 记录用户行为
   */
  recordUserBehavior (behavior) {
    const {
      type, // 'click', 'view', 'like', 'dislike', 'share', 'save'
      contentId,
      contentType,
      metadata = {},
      timestamp = new Date().toISOString()
    } = behavior;

    // 添加到交互记录
    this.userBehavior.value.interactions.push({
      type,
      contentId,
      contentType,
      metadata,
      timestamp
    });

    // 更新偏好
    this.updateUserPreferences(contentType, contentId, type);

    // 更新历史记录
    this.updateHistory(contentId, contentType, type);

    // 保持记录数量在合理范围内
    if (this.userBehavior.value.interactions.length > 10000) {
      this.userBehavior.value.interactions = this.userBehavior.value.interactions.slice(-5000);
    }

    // 保存到本地存储
    this.saveUserBehavior();

    // 触发学习过程
    if (type === 'like' || type === 'dislike') {
      this.triggerLearning();
    }
  }

  /**
   * 更新用户偏好
   */
  updateUserPreferences (contentType, contentId, interactionType) {
    if (!this.userBehavior.value.preferences[contentType]) {
      this.userBehavior.value.preferences[contentType] = {};
    }

    if (!this.userBehavior.value.preferences[contentType][contentId]) {
      this.userBehavior.value.preferences[contentType][contentId] = {
        score: 0,
        interactions: 0,
        lastInteraction: null
      };
    }

    const pref = this.userBehavior.value.preferences[contentType][contentId];

    // 根据交互类型更新分数
    const scoreMap = {
      like: 2,
      dislike: -2,
      view: 0.5,
      click: 1,
      share: 3,
      save: 2.5
    };

    pref.score += scoreMap[interactionType] || 0;
    pref.interactions += 1;
    pref.lastInteraction = new Date().toISOString();

    // 应用时间衰减
    this.applyTimeDecay(pref);
  }

  /**
   * 应用时间衰减
   */
  applyTimeDecay (preference) {
    if (!preference.lastInteraction) return;

    const lastInteraction = new Date(preference.lastInteraction);
    const now = new Date();
    const daysDiff = (now - lastInteraction) / (1000 * 60 * 60 * 24);

    // 超过30天的偏好逐渐衰减
    if (daysDiff > 30) {
      const decayFactor = Math.exp(-(daysDiff - 30) / 30);
      preference.score *= decayFactor;
    }
  }

  /**
   * 更新历史记录
   */
  updateHistory (contentId, contentType, interactionType) {
    const historyEntry = {
      contentId,
      contentType,
      interactionType,
      timestamp: new Date().toISOString()
    };

    this.userBehavior.value.history.unshift(historyEntry);

    // 保持历史记录在合理范围内
    if (this.userBehavior.value.history.length > 5000) {
      this.userBehavior.value.history = this.userBehavior.value.history.slice(0, 3000);
    }
  }

  /**
   * 获取个性化推荐
   */
  async getRecommendations (options = {}) {
    const {
      type = 'mixed', // 'content', 'collaborative', 'mixed', 'trending'
      limit = 10,
      excludeIds = [],
      context = {},
      useCache = true
    } = options;

    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(options);
      if (useCache && this.recommendationCache.value.has(cacheKey)) {
        const cached = this.recommendationCache.value.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5分钟缓存
          return cached.recommendations;
        }
      }

      let recommendations = [];

      switch (type) {
        case 'content':
          recommendations = await this.getContentBasedRecommendations(limit, excludeIds, context);
          break;
        case 'collaborative':
          recommendations = await this.getCollaborativeRecommendations(limit, excludeIds, context);
          break;
        case 'trending':
          recommendations = await this.getTrendingRecommendations(limit, excludeIds, context);
          break;
        case 'mixed':
        default:
          recommendations = await this.getMixedRecommendations(limit, excludeIds, context);
          break;
      }

      // 过滤和排序
      recommendations = this.filterAndSortRecommendations(recommendations, context);

      // 缓存结果
      if (useCache) {
        this.recommendationCache.value.set(cacheKey, {
          recommendations,
          timestamp: Date.now()
        });
      }

      // 更新统计
      this.updateRecommendationStats(recommendations);

      return recommendations;
    } catch (error) {
      console.error('获取推荐失败:', error);
      return [];
    }
  }

  /**
   * 基于内容的推荐
   */
  async getContentBasedRecommendations (limit, excludeIds, context) {
    // const userPrefs = this.userPreferencesStore.getDecryptedPreferences();
    // const userHistory = this.userBehavior.value.history;

    // 分析用户偏好特征
    const userFeatures = this.extractUserFeatures();

    // 获取候选内容
    const candidates = await this.getCandidateContent(userFeatures, limit * 3);

    // 计算相似度
    const similarities = candidates.map(content => ({
      ...content,
      score: this.calculateContentSimilarity(userFeatures, content.features)
    }));

    // 过滤和排序
    return similarities
      .filter(item => !excludeIds.includes(item.id))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 协同过滤推荐
   */
  async getCollaborativeRecommendations (limit, excludeIds, context) {
    // 找到相似用户
    const similarUsers = await this.findSimilarUsers(10);

    // 获取相似用户喜欢的内容
    const recommendations = [];
    const seenContent = new Set(excludeIds);

    for (const similarUser of similarUsers) {
      const userRecommendations = await this.getUserRecommendations(similarUser.userId, similarUser.similarity);

      for (const rec of userRecommendations) {
        if (!seenContent.has(rec.contentId)) {
          recommendations.push(rec);
          seenContent.add(rec.contentId);

          if (recommendations.length >= limit) {
            break;
          }
        }
      }

      if (recommendations.length >= limit) {
        break;
      }
    }

    return recommendations;
  }

  /**
   * 热门推荐
   */
  async getTrendingRecommendations (limit, excludeIds, context) {
    // 获取热门内容
    const trendingContent = await this.getTrendingContent(limit * 2);

    // 结合用户兴趣进行过滤
    const userInterests = this.getUserInterests();

    return trendingContent
      .filter(item => !excludeIds.includes(item.id))
      .map(item => ({
        ...item,
        score: this.calculateTrendingScore(item, userInterests)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 混合推荐
   */
  async getMixedRecommendations (limit, excludeIds, context) {
    const contentBased = await this.getContentBasedRecommendations(Math.ceil(limit * 0.4), excludeIds, context);
    const collaborative = await this.getCollaborativeRecommendations(Math.ceil(limit * 0.4), excludeIds, context);
    const trending = await this.getTrendingRecommendations(Math.ceil(limit * 0.2), excludeIds, context);

    // 合并和去重
    const allRecommendations = [...contentBased, ...collaborative, ...trending];
    const uniqueRecommendations = this.deduplicateRecommendations(allRecommendations);

    return uniqueRecommendations.slice(0, limit);
  }

  /**
   * 提取用户特征
   */
  extractUserFeatures () {
    const features = {
      categories: {},
      tags: {},
      keywords: {},
      contentTypes: {},
      timePatterns: {},
      qualityPreferences: {}
    };

    // 分析交互历史
    this.userBehavior.value.interactions.forEach(interaction => {
      // 分类统计
      if (interaction.contentType) {
        features.categories[interaction.contentType] = (features.categories[interaction.contentType] || 0) + 1;
      }

      // 时间模式
      const hour = new Date(interaction.timestamp).getHours();
      features.timePatterns[hour] = (features.timePatterns[hour] || 0) + 1;

      // 质量偏好（基于交互类型）
      const qualityScore = this.getInteractionQualityScore(interaction.type);
      if (qualityScore > 0) {
        features.qualityPreferences[interaction.contentId] = qualityScore;
      }
    });

    // 分析用户偏好设置
    const userPrefs = this.userPreferencesStore.getDecryptedPreferences();

    // 内容类型偏好
    if (userPrefs.content?.recommendations?.contentTypes) {
      userPrefs.content.recommendations.contentTypes.forEach(type => {
        features.contentTypes[type] = 1;
      });
    }

    return features;
  }

  /**
   * 获取交互质量分数
   */
  getInteractionQualityScore (interactionType) {
    const scores = {
      like: 3,
      share: 2.5,
      save: 2,
      click: 1,
      view: 0.5,
      dislike: -1
    };
    return scores[interactionType] || 0;
  }

  /**
   * 计算内容相似度
   */
  calculateContentSimilarity (userFeatures, contentFeatures) {
    if (!contentFeatures) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    // 分类相似度
    if (contentFeatures.categories) {
      for (const [category, weight] of Object.entries(contentFeatures.categories)) {
        const userWeight = userFeatures.categories[category] || 0;
        totalScore += Math.min(userWeight, weight) * 2;
        totalWeight += 2;
      }
    }

    // 标签相似度
    if (contentFeatures.tags) {
      for (const [tag, weight] of Object.entries(contentFeatures.tags)) {
        const userWeight = userFeatures.tags[tag] || 0;
        totalScore += userWeight * weight * 1.5;
        totalWeight += 1.5;
      }
    }

    // 关键词相似度
    if (contentFeatures.keywords) {
      for (const [keyword, weight] of Object.entries(contentFeatures.keywords)) {
        const userWeight = userFeatures.keywords[keyword] || 0;
        totalScore += userWeight * weight;
        totalWeight += 1;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * 找到相似用户
   */
  async findSimilarUsers (limit = 10) {
    // 这里应该调用后端API获取相似用户
    // 现在使用模拟数据
    const mockSimilarUsers = [
      { userId: 'user_123', similarity: 0.85 },
      { userId: 'user_456', similarity: 0.72 },
      { userId: 'user_789', similarity: 0.68 }
    ];

    return mockSimilarUsers.slice(0, limit);
  }

  /**
   * 获取用户推荐
   */
  async getUserRecommendations (userId, similarity) {
    // 这里应该调用后端API获取用户的推荐内容
    // 现在使用模拟数据
    const mockRecommendations = [
      {
        contentId: 'content_001',
        contentType: 'article',
        score: similarity * 0.8,
        title: '优化日程安排技巧',
        description: '学习如何高效管理时间，提升工作效率',
        reason: '基于相似用户的偏好推荐'
      },
      {
        contentId: 'content_002',
        contentType: 'video',
        score: similarity * 0.6,
        title: '时间管理大师课程',
        description: '掌握番茄工作法和深度工作技巧',
        reason: '基于相似用户的偏好推荐'
      }
    ];

    return mockRecommendations;
  }

  /**
   * 获取用户兴趣
   */
  getUserInterests () {
    const interests = [];
    const preferences = this.userBehavior.value.preferences;

    for (const [contentType, items] of Object.entries(preferences)) {
      for (const [itemId, data] of Object.entries(items)) {
        if (data.score > 1) { // 分数大于1的才算兴趣
          interests.push({
            contentType,
            itemId,
            score: data.score,
            interactions: data.interactions
          });
        }
      }
    }

    return interests.sort((a, b) => b.score - a.score);
  }

  /**
   * 计算热门分数
   */
  calculateTrendingScore (content, userInterests) {
    let score = content.popularity || 0;

    // 结合用户兴趣调整分数
    for (const interest of userInterests) {
      if (content.category === interest.contentType ||
          content.tags?.includes(interest.itemId)) {
        score += interest.score * 0.5;
      }
    }

    return score;
  }

  /**
   * 过滤和排序推荐
   */
  filterAndSortRecommendations (recommendations, context) {
    // 应用业务规则过滤
    let filtered = this.applyBusinessRules(recommendations, context);

    // 多样性保证
    filtered = this.ensureDiversity(filtered);

    // 新鲜度调整
    filtered = this.adjustForFreshness(filtered);

    // 最终排序
    return filtered.sort((a, b) => b.score - a.score);
  }

  /**
   * 应用业务规则
   */
  applyBusinessRules (recommendations, context) {
    const userPrefs = this.userPreferencesStore.getDecryptedPreferences();

    return recommendations.filter(rec => {
      // 内容过滤
      if (userPrefs.content?.contentFiltering) {
        const filtering = userPrefs.content.contentFiltering;

        // 内容评级过滤
        if (filtering.contentRating === 'general' && rec.contentRating === 'mature') {
          return false;
        }

        // 显式内容过滤
        if (filtering.blockExplicitContent && rec.isExplicit) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * 确保多样性
   */
  ensureDiversity (recommendations) {
    const diverse = [];
    const seenCategories = new Set();
    const seenTags = new Set();

    for (const rec of recommendations) {
      const category = rec.category || rec.contentType;
      const tags = rec.tags || [];

      // 如果已经有很多相同分类的内容，降低分数
      if (seenCategories.has(category) && diverse.length > 5) {
        rec.score *= 0.8;
      }

      // 如果已经有很多相同标签的内容，降低分数
      const commonTags = tags.filter(tag => seenTags.has(tag));
      if (commonTags.length > 2) {
        rec.score *= 0.7;
      }

      diverse.push(rec);
      seenCategories.add(category);
      tags.forEach(tag => seenTags.add(tag));
    }

    return diverse;
  }

  /**
   * 调整新鲜度
   */
  adjustForFreshness (recommendations) {
    const now = new Date();

    return recommendations.map(rec => {
      if (rec.createdAt) {
        const age = (now - new Date(rec.createdAt)) / (1000 * 60 * 60 * 24); // 天数

        // 新内容获得分数加成
        if (age < 7) {
          rec.score *= 1.2;
        } else if (age > 90) {
          rec.score *= 0.8;
        }
      }

      return rec;
    });
  }

  /**
   * 去重推荐
   */
  deduplicateRecommendations (recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      const key = `${rec.contentId}-${rec.contentType}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 生成缓存键
   */
  generateCacheKey (options) {
    const key = JSON.stringify(options);
    return `rec_${this.hashCode(key)}`;
  }

  /**
   * 简单的哈希函数
   */
  hashCode (str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString();
  }

  /**
   * 更新推荐统计
   */
  updateRecommendationStats (recommendations) {
    this.recommendationStats.value.totalRecommendations += recommendations.length;

    // 这里可以添加更多的统计逻辑
    // 例如：跟踪用户是否接受了推荐等
  }

  /**
   * 触发学习过程
   */
  async triggerLearning () {
    if (this.isLearning.value) return;

    this.isLearning.value = true;

    try {
      // 更新用户模式
      await this.updateUserPatterns();

      // 更新内容索引
      await this.updateContentIndex();

      // 更新相似度矩阵
      await this.updateSimilarityMatrix();
    } catch (error) {
      console.error('学习过程失败:', error);
    } finally {
      this.isLearning.value = false;
    }
  }

  /**
   * 更新用户模式
   */
  async updateUserPatterns () {
    const patterns = {
      daily: this.analyzeDailyPatterns(),
      weekly: this.analyzeWeeklyPatterns(),
      monthly: this.analyzeMonthlyPatterns(),
      seasonal: this.analyzeSeasonalPatterns()
    };

    this.userBehavior.value.patterns = patterns;
    await this.saveUserBehavior();
  }

  /**
   * 分析日常模式
   */
  analyzeDailyPatterns () {
    const hours = Array(24).fill(0);

    this.userBehavior.value.interactions.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      hours[hour]++;
    });

    return {
      mostActiveHour: hours.indexOf(Math.max(...hours)),
      leastActiveHour: hours.indexOf(Math.min(...hours)),
      activityDistribution: hours
    };
  }

  /**
   * 分析周模式
   */
  analyzeWeeklyPatterns () {
    const days = Array(7).fill(0);

    this.userBehavior.value.interactions.forEach(interaction => {
      const day = new Date(interaction.timestamp).getDay();
      days[day]++;
    });

    return {
      mostActiveDay: days.indexOf(Math.max(...days)),
      leastActiveDay: days.indexOf(Math.min(...days)),
      activityDistribution: days
    };
  }

  /**
   * 分析月模式
   */
  analyzeMonthlyPatterns () {
    const months = Array(12).fill(0);

    this.userBehavior.value.interactions.forEach(interaction => {
      const month = new Date(interaction.timestamp).getMonth();
      months[month]++;
    });

    return {
      mostActiveMonth: months.indexOf(Math.max(...months)),
      leastActiveMonth: months.indexOf(Math.min(...months)),
      activityDistribution: months
    };
  }

  /**
   * 分析季节模式
   */
  analyzeSeasonalPatterns () {
    const seasons = { spring: 0, summer: 0, autumn: 0, winter: 0 };

    this.userBehavior.value.interactions.forEach(interaction => {
      const month = new Date(interaction.timestamp).getMonth();
      let season;

      if (month >= 2 && month <= 4) season = 'spring';
      else if (month >= 5 && month <= 7) season = 'summer';
      else if (month >= 8 && month <= 10) season = 'autumn';
      else season = 'winter';

      seasons[season]++;
    });

    return {
      mostActiveSeason: Object.keys(seasons).reduce((a, b) => seasons[a] > seasons[b] ? a : b),
      seasonalDistribution: seasons
    };
  }

  /**
   * 更新内容索引
   */
  async updateContentIndex () {
    // 这里应该分析用户行为并更新内容索引
    // 现在只是示例逻辑

    const newContent = await this.discoverNewContent();

    for (const content of newContent) {
      this.contentIndex.value.set(content.id, {
        ...content,
        indexedAt: new Date().toISOString()
      });
    }

    await this.saveContentIndex();
  }

  /**
   * 发现新内容
   */
  async discoverNewContent () {
    // 这里应该调用外部API或爬取新内容
    // 现在返回模拟数据
    return [
      {
        id: 'new_content_001',
        title: '新内容1',
        contentType: 'article',
        features: {
          categories: { technology: 0.8 },
          tags: { ai: 0.9, machine_learning: 0.7 }
        }
      }
    ];
  }

  /**
   * 更新相似度矩阵
   */
  async updateSimilarityMatrix () {
    // 这里应该计算内容之间的相似度
    // 现在只是示例逻辑

    const contentIds = Array.from(this.contentIndex.value.keys());

    for (let i = 0; i < contentIds.length; i++) {
      for (let j = i + 1; j < contentIds.length; j++) {
        const content1 = this.contentIndex.value.get(contentIds[i]);
        const content2 = this.contentIndex.value.get(contentIds[j]);

        const similarity = this.calculateItemSimilarity(content1, content2);

        if (!this.similarityMatrix.value.has(contentIds[i])) {
          this.similarityMatrix.value.set(contentIds[i], new Map());
        }

        this.similarityMatrix.value.get(contentIds[i]).set(contentIds[j], similarity);
      }
    }
  }

  /**
   * 计算项目相似度
   */
  calculateItemSimilarity (item1, item2) {
    if (!item1?.features || !item2?.features) return 0;

    const features1 = item1.features;
    const features2 = item2.features;

    let similarity = 0;
    let totalWeight = 0;

    // 计算分类相似度
    if (features1.categories && features2.categories) {
      for (const [cat, weight] of Object.entries(features1.categories)) {
        if (features2.categories[cat]) {
          similarity += weight * features2.categories[cat];
          totalWeight += weight;
        }
      }
    }

    // 计算标签相似度
    if (features1.tags && features2.tags) {
      for (const [tag, weight] of Object.entries(features1.tags)) {
        if (features2.tags[tag]) {
          similarity += weight * features2.tags[tag];
          totalWeight += weight;
        }
      }
    }

    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  /**
   * 启动学习过程
   */
  startLearningProcess () {
    // 每30分钟运行一次学习过程
    setInterval(() => {
      this.triggerLearning();
    }, 30 * 60 * 1000);
  }

  /**
   * 启动缓存清理
   */
  startCacheCleanup () {
    // 每10分钟清理一次过期缓存
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.recommendationCache.value.entries()) {
        if (now - cached.timestamp > 300000) { // 5分钟过期
          this.recommendationCache.value.delete(key);
        }
      }
    }, 10 * 60 * 1000);
  }

  /**
   * 获取候选内容
   */
  async getCandidateContent (userFeatures, limit) {
    // 这里应该从内容索引中获取候选内容
    // 现在返回模拟数据
    const candidateTemplates = [
      { title: '晨间日程规划指南', description: '打造高效的早晨例行公事' },
      { title: '会议时间优化策略', description: '减少无效会议，提升协作效率' },
      { title: '专注工作时段设置', description: '利用时间块技术深度工作' },
      { title: '休息提醒设置建议', description: '科学安排工作与休息节奏' },
      { title: '周末计划模板', description: '平衡休息与个人成长的周末安排' }
    ];

    const candidates = [];

    for (let i = 0; i < limit; i++) {
      const template = candidateTemplates[i % candidateTemplates.length];
      candidates.push({
        id: `candidate_${i}`,
        title: template.title,
        description: template.description,
        contentType: 'article',
        features: {
          categories: { technology: Math.random() },
          tags: { ai: Math.random(), ml: Math.random() }
        }
      });
    }

    return candidates;
  }

  /**
   * 获取热门内容
   */
  async getTrendingContent (limit) {
    // 这里应该从内容索引中获取热门内容
    // 现在返回模拟数据
    const trendingTemplates = [
      { title: 'AI助手使用技巧', description: '热门：如何更好地与AI协作管理日程' },
      { title: '2025效率工具推荐', description: '热门：今年最受欢迎的 productivity 工具' },
      { title: '远程工作时间管理', description: '热门：在家办公的高效工作法' },
      { title: '习惯养成21天计划', description: '热门：建立持久好习惯的方法' }
    ];

    const trending = [];

    for (let i = 0; i < limit; i++) {
      const template = trendingTemplates[i % trendingTemplates.length];
      trending.push({
        id: `trending_${i}`,
        title: template.title,
        description: template.description,
        contentType: 'article',
        popularity: Math.random() * 100,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return trending;
  }

  /**
   * 记录推荐反馈
   */
  recordRecommendationFeedback (feedback) {
    const {
      recommendationId,
      contentId,
      feedbackType, // 'accepted', 'rejected', 'ignored'
      context = {}
    } = feedback;

    // 记录用户行为
    this.recordUserBehavior({
      type: feedbackType === 'accepted' ? 'like' : 'dislike',
      contentId,
      contentType: context.contentType,
      metadata: {
        recommendationId,
        feedbackType,
        context
      }
    });

    // 更新统计
    if (feedbackType === 'accepted') {
      this.recommendationStats.value.acceptedRecommendations++;
    } else if (feedbackType === 'rejected') {
      this.recommendationStats.value.rejectedRecommendations++;
    }

    // 计算准确率
    const total = this.recommendationStats.value.acceptedRecommendations +
                  this.recommendationStats.value.rejectedRecommendations;

    if (total > 0) {
      this.recommendationStats.value.accuracy =
        this.recommendationStats.value.acceptedRecommendations / total;
    }

    this.saveRecommendationStats();
  }

  /**
   * 获取推荐统计
   */
  getRecommendationStats () {
    return {
      ...this.recommendationStats.value,
      userBehaviorCount: this.userBehavior.value.interactions.length,
      contentIndexSize: this.contentIndex.value.size,
      isLearning: this.isLearning.value
    };
  }

  /**
   * 清除所有数据
   */
  async clearAllData () {
    this.userBehavior.value = {
      interactions: [],
      preferences: {},
      history: [],
      patterns: {}
    };

    this.contentIndex.value.clear();
    this.similarityMatrix.value.clear();
    this.recommendationCache.value.clear();
    this.recommendationStats.value = {
      totalRecommendations: 0,
      acceptedRecommendations: 0,
      rejectedRecommendations: 0,
      accuracy: 0
    };

    await this.saveUserBehavior();
    await this.saveContentIndex();
    await this.saveRecommendationStats();
  }
}

// 创建单例实例
export const recommendationService = new RecommendationService();

/**
 * 推荐服务组合式函数
 */
export function useRecommendationService () {
  return {
    // 状态
    recommendations: computed(() => recommendationService.recommendations.value),
    isLearning: computed(() => recommendationService.isLearning.value),
    recommendationStats: computed(() => recommendationService.recommendationStats.value),

    // 方法
    getRecommendations: recommendationService.getRecommendations.bind(recommendationService),
    recordUserBehavior: recommendationService.recordUserBehavior.bind(recommendationService),
    recordRecommendationFeedback: recommendationService.recordRecommendationFeedback.bind(recommendationService),
    getRecommendationStats: recommendationService.getRecommendationStats.bind(recommendationService),
    clearAllData: recommendationService.clearAllData.bind(recommendationService)
  };
}
