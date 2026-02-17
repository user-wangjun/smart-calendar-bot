import { reactive } from 'vue';
import unifiedModelConfig from '@/config/unifiedModelConfig';

/**
 * AI性能优化器
 * 提供AI调用的性能优化、缓存、批处理和智能重试机制
 */
class PerformanceOptimizer {
  constructor () {
    this.cache = reactive(new Map());
    this.requestQueue = reactive([]);
    this.performanceMetrics = reactive({
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      errorRate: 0,
      tokenUsage: {
        total: 0,
        average: 0,
        byPlatform: {}
      }
    });

    this.optimizationConfig = reactive({
      cacheEnabled: true,
      cacheTTL: 5 * 60 * 1000, // 5分钟
      batchSize: 5,
      batchTimeout: 1000, // 1秒
      retryAttempts: 3,
      retryDelay: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000, // 1分钟
      compressionEnabled: true,
      streamingEnabled: true
    });

    this.circuitBreakers = reactive(new Map());
    this.activeStreams = reactive(new Map());
    this.batchIntervalId = null;
    this.metricsIntervalId = null;

    this.init();
  }

  /**
   * 初始化优化器
   */
  init () {
    this.startBatchProcessor();
    this.startMetricsCollector();
    this.loadCacheFromStorage();
  }

  /**
   * 智能请求优化
   */
  async optimizeRequest (platform, model, request, options = {}) {
    const {
      useCache = true,
      enableBatching = true
      // enableCompression = true,
      // enableStreaming = false,
      // priority = 'normal'
    } = options;

    const requestId = this.generateRequestId();
    const cacheKey = this.generateCacheKey(platform, model, request);

    try {
      // 检查缓存
      if (useCache && this.optimizationConfig.cacheEnabled) {
        const cachedResult = this.getFromCache(cacheKey);
        if (cachedResult) {
          this.performanceMetrics.cacheHits++;
          return {
            success: true,
            data: cachedResult.data,
            cached: true,
            cacheHit: true,
            requestId
          };
        }
      }

      this.performanceMetrics.cacheMisses++;

      // 检查熔断器
      if (this.isCircuitBreakerOpen(platform)) {
        return {
          success: false,
          error: 'Circuit breaker is open',
          circuitBreakerOpen: true,
          requestId
        };
      }

      // 批处理或立即执行
      if (enableBatching && this.shouldBatchRequest(request)) {
        return await this.addToBatch(requestId, platform, model, request, options);
      } else {
        return await this.executeRequest(requestId, platform, model, request, options);
      }
    } catch (error) {
      this.handleRequestError(error, platform, requestId);
      return {
        success: false,
        error: error.message,
        requestId
      };
    }
  }

  /**
   * 执行AI请求
   */
  async executeRequest (requestId, platform, model, request, options = {}) {
    const startTime = Date.now();

    try {
      // 请求预处理
      const processedRequest = await this.preprocessRequest(platform, model, request, options);

      // 平台特定优化
      const optimizedRequest = this.applyPlatformOptimizations(platform, processedRequest);

      // 执行请求
      let response;
      if (options.enableStreaming && this.optimizationConfig.streamingEnabled) {
        response = await this.executeStreamingRequest(platform, optimizedRequest);
      } else {
        response = await this.executeStandardRequest(platform, optimizedRequest);
      }

      // 响应后处理
      const processedResponse = await this.postprocessResponse(platform, response);

      // 更新性能指标
      const responseTime = Date.now() - startTime;
      this.updateMetrics(platform, model, responseTime, processedResponse);

      // 缓存结果
      if (options.useCache && this.optimizationConfig.cacheEnabled) {
        const cacheKey = this.generateCacheKey(platform, model, request);
        this.addToCache(cacheKey, processedResponse);
      }

      return {
        success: true,
        data: processedResponse,
        metrics: {
          responseTime,
          platform,
          model
        },
        requestId
      };
    } catch (error) {
      this.handleRequestError(error, platform, requestId);

      // 重试机制
      if (this.shouldRetry(error)) {
        return await this.retryRequest(requestId, platform, model, request, options);
      }

      throw error;
    }
  }

  /**
   * 执行流式请求
   */
  async executeStreamingRequest (platform, request) {
    const streamId = this.generateStreamId();

    try {
      // 获取平台配置
      const platformConfig = unifiedModelConfig.platforms[platform];
      if (!platformConfig || !platformConfig.streamingSupport) {
        throw new Error(`Platform ${platform} does not support streaming`);
      }

      // 创建流式请求
      const stream = await this.createStream(platform, request);
      this.activeStreams.set(streamId, stream);

      return new Promise((resolve, reject) => {
        let fullResponse = '';

        stream.on('data', (chunk) => {
          fullResponse += chunk;
          this.handleStreamChunk(streamId, chunk);
        });

        stream.on('end', () => {
          this.activeStreams.delete(streamId);
          resolve(fullResponse);
        });

        stream.on('error', (error) => {
          this.activeStreams.delete(streamId);
          reject(error);
        });
      });
    } catch (error) {
      this.activeStreams.delete(streamId);
      throw error;
    }
  }

  /**
   * 执行标准请求
   */
  async executeStandardRequest (platform, request) {
    // 这里应该调用实际的AI平台API
    // 模拟API调用
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 模拟成功响应
        resolve({
          content: 'AI response content',
          tokens: Math.floor(Math.random() * 1000) + 100,
          model: request.model,
          platform
        });
      }, Math.random() * 2000 + 500); // 随机延迟 500-2500ms
    });
  }

  /**
   * 请求预处理
   */
  async preprocessRequest (platform, model, request, options) {
    let processedRequest = { ...request };

    // 模型特定预处理
    const modelConfig = unifiedModelConfig.getModelConfig(platform, model);
    if (modelConfig && modelConfig.preprocessor) {
      processedRequest = await modelConfig.preprocessor(processedRequest);
    }

    // 压缩请求内容
    if (options.enableCompression && this.optimizationConfig.compressionEnabled) {
      processedRequest = await this.compressRequest(processedRequest);
    }

    // 优化提示词
    processedRequest.prompt = this.optimizePrompt(processedRequest.prompt, platform, model);

    return processedRequest;
  }

  /**
   * 响应后处理
   */
  async postprocessResponse (platform, response) {
    let processedResponse = { ...response };

    // 解压缩响应
    if (processedResponse.compressed) {
      processedResponse = await this.decompressResponse(processedResponse);
    }

    // 平台特定后处理
    const platformConfig = unifiedModelConfig.platforms[platform];
    if (platformConfig && platformConfig.postprocessor) {
      processedResponse = await platformConfig.postprocessor(processedResponse);
    }

    return processedResponse;
  }

  /**
   * 平台特定优化
   */
  applyPlatformOptimizations (platform, request) {
    const platformConfig = unifiedModelConfig.platforms[platform];
    if (!platformConfig) return request;

    // 应用平台特定的优化规则
    let optimizedRequest = { ...request };

    // 温度参数优化
    if (platformConfig.optimizeTemperature && request.temperature !== undefined) {
      optimizedRequest.temperature = this.optimizeTemperature(
        request.temperature,
        platformConfig.temperatureRange
      );
    }

    // 最大令牌数优化
    if (platformConfig.optimizeMaxTokens && request.max_tokens !== undefined) {
      optimizedRequest.max_tokens = this.optimizeMaxTokens(
        request.max_tokens,
        platformConfig.maxTokensRange
      );
    }

    // 平台特定参数
    if (platformConfig.defaultParameters) {
      optimizedRequest = {
        ...platformConfig.defaultParameters,
        ...optimizedRequest
      };
    }

    return optimizedRequest;
  }

  /**
   * 批处理系统
   */
  async addToBatch (requestId, platform, model, request, options) {
    const batchItem = {
      requestId,
      platform,
      model,
      request,
      options,
      timestamp: Date.now(),
      resolve: null,
      reject: null
    };

    return new Promise((resolve, reject) => {
      batchItem.resolve = resolve;
      batchItem.reject = reject;
      this.requestQueue.push(batchItem);
    });
  }

  /**
   * 启动批处理器
   */
  startBatchProcessor () {
    this.batchIntervalId = setInterval(() => {
      this.processBatchQueue();
    }, this.optimizationConfig.batchTimeout);
  }

  /**
   * 处理批处理队列
   */
  async processBatchQueue () {
    if (this.requestQueue.length === 0) return;

    // 按平台分组
    const batches = this.groupRequestsByPlatform();

    for (const [platform, requests] of Object.entries(batches)) {
      if (requests.length >= this.optimizationConfig.batchSize) {
        await this.executeBatch(platform, requests);
      }
    }
  }

  /**
   * 执行批处理
   */
  async executeBatch (platform, requests) {
    try {
      // 移除队列中的请求
      this.requestQueue = this.requestQueue.filter(
        item => !requests.some(req => req.requestId === item.requestId)
      );

      // 执行批处理请求
      const batchResults = await this.executeBatchRequest(platform, requests);

      // 处理结果
      requests.forEach((request, index) => {
        const result = batchResults[index];
        if (result.success) {
          request.resolve({
            success: true,
            data: result.data,
            batched: true,
            requestId: request.requestId
          });
        } else {
          request.reject(new Error(result.error));
        }
      });
    } catch (error) {
      // 批处理失败，单独重试每个请求
      requests.forEach(request => {
        this.retryRequest(
          request.requestId,
          request.platform,
          request.model,
          request.request,
          request.options
        ).then(result => {
          request.resolve(result);
        }).catch(err => {
          request.reject(err);
        });
      });
    }
  }

  /**
   * 缓存系统
   */
  getFromCache (cacheKey) {
    if (!this.cache.has(cacheKey)) return null;

    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    // 检查缓存是否过期
    if (now - cached.timestamp > this.optimizationConfig.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  /**
   * 添加到缓存
   */
  addToCache (cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    // 限制缓存大小
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 重试机制
   */
  async retryRequest (requestId, platform, model, request, options, attempt = 1) {
    if (attempt > this.optimizationConfig.retryAttempts) {
      throw new Error(`Max retry attempts (${this.optimizationConfig.retryAttempts}) exceeded`);
    }

    const delay = this.optimizationConfig.retryDelay * Math.pow(2, attempt - 1);

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      return await this.executeRequest(requestId, platform, model, request, options);
    } catch (error) {
      return await this.retryRequest(requestId, platform, model, request, options, attempt + 1);
    }
  }

  /**
   * 熔断器机制
   */
  isCircuitBreakerOpen (platform) {
    const breaker = this.circuitBreakers.get(platform);
    if (!breaker) return false;

    const now = Date.now();
    if (now - breaker.lastFailure > this.optimizationConfig.circuitBreakerTimeout) {
      this.circuitBreakers.delete(platform);
      return false;
    }

    return breaker.failureCount >= this.optimizationConfig.circuitBreakerThreshold;
  }

  /**
   * 处理请求错误
   */
  handleRequestError (error, platform, requestId) {
    console.error(`Request ${requestId} failed for platform ${platform}:`, error);

    // 更新熔断器状态
    const breaker = this.circuitBreakers.get(platform) || {
      failureCount: 0,
      lastFailure: 0
    };

    breaker.failureCount++;
    breaker.lastFailure = Date.now();
    this.circuitBreakers.set(platform, breaker);

    // 更新错误率指标
    this.updateErrorMetrics(platform, error);
  }

  /**
   * 更新性能指标
   */
  updateMetrics (platform, model, responseTime, response) {
    this.performanceMetrics.totalRequests++;

    // 更新平均响应时间
    const currentAvg = this.performanceMetrics.averageResponseTime;
    const totalRequests = this.performanceMetrics.totalRequests;
    this.performanceMetrics.averageResponseTime =
      (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;

    // 更新令牌使用统计
    if (response.tokens) {
      this.performanceMetrics.tokenUsage.total += response.tokens;

      if (!this.performanceMetrics.tokenUsage.byPlatform[platform]) {
        this.performanceMetrics.tokenUsage.byPlatform[platform] = {
          total: 0,
          count: 0,
          average: 0
        };
      }

      const platformStats = this.performanceMetrics.tokenUsage.byPlatform[platform];
      platformStats.total += response.tokens;
      platformStats.count++;
      platformStats.average = platformStats.total / platformStats.count;
    }

    // 保存到本地存储
    this.saveMetricsToStorage();
  }

  /**
   * 优化提示词
   */
  optimizePrompt (prompt, platform, model) {
    // 基于平台和模型优化提示词
    const optimizations = [];

    // 添加平台特定的系统提示
    const platformConfig = unifiedModelConfig.platforms[platform];
    if (platformConfig && platformConfig.systemPrompt) {
      optimizations.push(platformConfig.systemPrompt);
    }

    // 添加模型特定的优化
    const modelConfig = unifiedModelConfig.getModelConfig(platform, model);
    if (modelConfig && modelConfig.promptOptimizer) {
      prompt = modelConfig.promptOptimizer(prompt);
    }

    // 压缩提示词长度
    prompt = this.compressPrompt(prompt);

    return prompt;
  }

  /**
   * 压缩提示词
   */
  compressPrompt (prompt) {
    // 移除多余的空格和换行
    prompt = prompt.replace(/\s+/g, ' ').trim();

    // 替换常见的长短语
    const replacements = {
      'artificial intelligence': 'AI',
      'machine learning': 'ML',
      please: 'pls',
      'thank you': 'ty'
    };

    Object.entries(replacements).forEach(([long, short]) => {
      prompt = prompt.replace(new RegExp(long, 'gi'), short);
    });

    return prompt;
  }

  /**
   * 工具方法
   */
  generateRequestId () {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateCacheKey (platform, model, request) {
    const keyData = {
      platform,
      model,
      prompt: request.prompt,
      temperature: request.temperature,
      max_tokens: request.max_tokens
    };
    return JSON.stringify(keyData);
  }

  generateStreamId () {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  shouldBatchRequest (request) {
    // 判断是否应该批处理
    return !request.immediate && !request.streaming;
  }

  groupRequestsByPlatform () {
    const groups = {};
    this.requestQueue.forEach(item => {
      if (!groups[item.platform]) {
        groups[item.platform] = [];
      }
      groups[item.platform].push(item);
    });
    return groups;
  }

  shouldRetry (error) {
    // 判断是否应该重试
    const retryableErrors = [
      'timeout',
      'network',
      'rate_limit',
      'service_unavailable'
    ];

    return retryableErrors.some(type => error.message.toLowerCase().includes(type));
  }

  updateErrorMetrics (platform, error) {
    // 更新错误指标
    // const errorType = this.categorizeError(error);
    // 这里可以添加更详细的错误统计
  }

  categorizeError (error) {
    const message = error.message.toLowerCase();

    if (message.includes('rate limit')) return 'rate_limit';
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('network')) return 'network';
    if (message.includes('auth')) return 'authentication';
    if (message.includes('quota')) return 'quota_exceeded';

    return 'unknown';
  }

  optimizeTemperature (temperature, range) {
    // 温度参数优化
    if (range) {
      return Math.max(range.min, Math.min(range.max, temperature));
    }
    return temperature;
  }

  optimizeMaxTokens (tokens, range) {
    // 最大令牌数优化
    if (range) {
      return Math.max(range.min, Math.min(range.max, tokens));
    }
    return tokens;
  }

  /**
   * 存储相关方法
   */
  saveCacheToStorage () {
    const cacheData = Array.from(this.cache.entries()).slice(0, 100); // 限制缓存大小
    localStorage.setItem('ai_cache', JSON.stringify(cacheData));
  }

  loadCacheFromStorage () {
    try {
      const cacheData = localStorage.getItem('ai_cache');
      if (cacheData) {
        const entries = JSON.parse(cacheData);
        entries.forEach(([key, value]) => {
          this.cache.set(key, value);
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  saveMetricsToStorage () {
    localStorage.setItem('ai_metrics', JSON.stringify(this.performanceMetrics));
  }

  loadMetricsFromStorage () {
    try {
      const metricsData = localStorage.getItem('ai_metrics');
      if (metricsData) {
        const metrics = JSON.parse(metricsData);
        Object.assign(this.performanceMetrics, metrics);
      }
    } catch (error) {
      console.warn('Failed to load metrics from storage:', error);
    }
  }

  /**
   * 启动指标收集器
   */
  startMetricsCollector () {
    this.metricsIntervalId = setInterval(() => {
      this.saveMetricsToStorage();
      this.saveCacheToStorage();
    }, 30000); // 每30秒保存一次
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats () {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.performanceMetrics.totalRequests > 0
        ? (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests * 100).toFixed(2)
        : 0,
      activeStreams: this.activeStreams.size,
      queueSize: this.requestQueue.length,
      circuitBreakers: Array.from(this.circuitBreakers.keys())
    };
  }

  /**
   * 清理缓存
   */
  clearCache () {
    this.cache.clear();
    localStorage.removeItem('ai_cache');
  }

  /**
   * 重置指标
   */
  resetMetrics () {
    Object.assign(this.performanceMetrics, {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      errorRate: 0,
      tokenUsage: {
        total: 0,
        average: 0,
        byPlatform: {}
      }
    });

    this.saveMetricsToStorage();
  }

  /**
   * 关闭优化器（清理资源）
   */
  close () {
    if (this.batchIntervalId) {
      clearInterval(this.batchIntervalId);
      this.batchIntervalId = null;
    }
    if (this.metricsIntervalId) {
      clearInterval(this.metricsIntervalId);
      this.metricsIntervalId = null;
    }
    this.activeStreams.forEach(stream => {
      try { stream.destroy?.(); } catch (_) {}
    });
    this.activeStreams.clear();
  }
}

// 创建单例实例
export const performanceOptimizer = new PerformanceOptimizer();
export default performanceOptimizer;
