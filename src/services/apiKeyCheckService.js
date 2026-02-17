/**
 * API密钥检查服务
 * 提供全面的密钥状态检查、监控和管理功能
 */

import envConfig from '../config/env.js';
import apiValidator from '../utils/apiValidator.js';
import weatherApiKeyManager from './weatherApiKey.js';
import apiKeyManager from '../config/apiKeyManager.js';

/**
 * 密钥状态枚举
 */
export const KeyStatus = {
  NORMAL: 'normal', // 正常
  WARNING: 'warning', // 警告
  EXPIRING: 'expiring', // 即将过期
  EXPIRED: 'expired', // 已过期
  ERROR: 'error', // 异常
  NOT_CONFIGURED: 'not_configured' // 未配置
};

/**
 * 密钥类型枚举
 */
export const KeyType = {
  WEATHER: 'weather',
  OPENROUTER: 'openrouter',
  ZHIPU: 'zhipu',
  QINIU: 'qiniu',
  TENCENT_MAP: 'tencent_map'
};

/**
 * 密钥检查结果类
 */
class KeyCheckResult {
  constructor (type, status, details = {}) {
    this.type = type;
    this.status = status;
    this.timestamp = new Date().toISOString();
    this.details = details;
  }
}

/**
 * API密钥检查服务类
 */
class ApiKeyCheckService {
  constructor () {
    this.checkHistory = [];
    this.maxHistorySize = 100;
    this.checkInterval = null;
    this.stats = new Map();

    // 初始化各密钥类型的统计
    Object.values(KeyType).forEach(type => {
      this.stats.set(type, {
        totalChecks: 0,
        successCount: 0,
        failCount: 0,
        lastCheckTime: null,
        lastSuccessTime: null,
        lastErrorTime: null,
        errorStreak: 0,
        averageResponseTime: 0
      });
    });
  }

  /**
   * 检查所有密钥
   * @returns {Promise<Object>} 检查结果汇总
   */
  async checkAllKeys () {
    const results = {
      timestamp: new Date().toISOString(),
      overall: {
        total: 0,
        normal: 0,
        warning: 0,
        error: 0,
        notConfigured: 0
      },
      details: {}
    };

    // 并行检查所有密钥
    const checkPromises = [
      this.checkWeatherKey(),
      this.checkOpenRouterKey(),
      this.checkZhipuKey(),
      this.checkQiniuKey(),
      this.checkTencentMapKey()
    ];

    const checkResults = await Promise.allSettled(checkPromises);

    checkResults.forEach((result, index) => {
      const keyType = Object.values(KeyType)[index];

      if (result.status === 'fulfilled') {
        results.details[keyType] = result.value;
        results.overall.total++;

        switch (result.value.status) {
          case KeyStatus.NORMAL:
            results.overall.normal++;
            break;
          case KeyStatus.WARNING:
          case KeyStatus.EXPIRING:
            results.overall.warning++;
            break;
          case KeyStatus.ERROR:
          case KeyStatus.EXPIRED:
            results.overall.error++;
            break;
          case KeyStatus.NOT_CONFIGURED:
            results.overall.notConfigured++;
            break;
        }
      } else {
        results.details[keyType] = new KeyCheckResult(
          keyType,
          KeyStatus.ERROR,
          { error: result.reason?.message || '检查过程发生错误' }
        );
        results.overall.error++;
      }
    });

    // 保存检查历史
    this.addToHistory(results);

    return results;
  }

  /**
   * 检查天气API密钥
   */
  async checkWeatherKey () {
    const key = envConfig.get('VITE_WEATHER_API_KEY') || weatherApiKeyManager.getApiKey();
    const stats = this.stats.get(KeyType.WEATHER);
    stats.totalChecks++;
    stats.lastCheckTime = new Date().toISOString();

    // 1. 基础验证
    if (!key || key.trim() === '') {
      stats.failCount++;
      stats.errorStreak++;
      return new KeyCheckResult(KeyType.WEATHER, KeyStatus.NOT_CONFIGURED, {
        message: '天气API密钥未配置',
        suggestion: '请在.env文件中设置VITE_WEATHER_API_KEY'
      });
    }

    // 2. 格式验证
    const validation = apiValidator.validateApiKey('weather', key);
    if (!validation.valid) {
      stats.failCount++;
      stats.errorStreak++;
      stats.lastErrorTime = new Date().toISOString();
      return new KeyCheckResult(KeyType.WEATHER, KeyStatus.ERROR, {
        message: '密钥格式无效',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // 3. 连通性测试
    const startTime = Date.now();
    try {
      const response = await fetch(
        `https://api.seniverse.com/v3/weather/now.json?key=${key}&location=beijing`,
        { signal: AbortSignal.timeout(10000) }
      );

      const responseTime = Date.now() - startTime;
      stats.averageResponseTime = this.calculateAverageResponseTime(
        stats.averageResponseTime,
        responseTime,
        stats.successCount + 1
      );

      if (response.ok) {
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          // 成功
          stats.successCount++;
          stats.errorStreak = 0;
          stats.lastSuccessTime = new Date().toISOString();

          return new KeyCheckResult(KeyType.WEATHER, KeyStatus.NORMAL, {
            message: '密钥有效',
            responseTime,
            location: data.results[0].location?.name,
            weather: data.results[0].now?.text,
            temperature: data.results[0].now?.temperature
          });
        } else {
          // API返回异常数据
          stats.failCount++;
          stats.errorStreak++;
          stats.lastErrorTime = new Date().toISOString();

          return new KeyCheckResult(KeyType.WEATHER, KeyStatus.WARNING, {
            message: 'API返回数据异常',
            responseTime,
            response: data
          });
        }
      } else if (response.status === 401 || response.status === 403) {
        // 认证失败
        stats.failCount++;
        stats.errorStreak++;
        stats.lastErrorTime = new Date().toISOString();

        return new KeyCheckResult(KeyType.WEATHER, KeyStatus.ERROR, {
          message: '密钥认证失败，可能已过期或无效',
          httpStatus: response.status,
          suggestion: '请检查密钥是否正确，或到心知天气官网重新申请'
        });
      } else {
        // 其他HTTP错误
        stats.failCount++;
        stats.errorStreak++;
        stats.lastErrorTime = new Date().toISOString();

        return new KeyCheckResult(KeyType.WEATHER, KeyStatus.ERROR, {
          message: `API请求失败: HTTP ${response.status}`,
          httpStatus: response.status,
          suggestion: '请检查网络连接或API服务状态'
        });
      }
    } catch (error) {
      stats.failCount++;
      stats.errorStreak++;
      stats.lastErrorTime = new Date().toISOString();

      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return new KeyCheckResult(KeyType.WEATHER, KeyStatus.ERROR, {
          message: 'API请求超时',
          error: error.message,
          suggestion: '请检查网络连接，或稍后重试'
        });
      }

      return new KeyCheckResult(KeyType.WEATHER, KeyStatus.ERROR, {
        message: '网络请求失败',
        error: error.message,
        suggestion: '请检查网络连接'
      });
    }
  }

  /**
   * 检查OpenRouter密钥
   */
  async checkOpenRouterKey () {
    const key = apiKeyManager.getOpenRouterApiKey();
    const stats = this.stats.get(KeyType.OPENROUTER);
    stats.totalChecks++;
    stats.lastCheckTime = new Date().toISOString();

    if (!key) {
      stats.failCount++;
      stats.errorStreak++;
      return new KeyCheckResult(KeyType.OPENROUTER, KeyStatus.NOT_CONFIGURED, {
        message: 'OpenRouter API密钥未配置',
        suggestion: '请在设置中配置OpenRouter API密钥'
      });
    }

    // 格式验证
    const validation = apiValidator.validateApiKey('openrouter', key);
    if (!validation.valid) {
      stats.failCount++;
      stats.errorStreak++;
      stats.lastErrorTime = new Date().toISOString();
      return new KeyCheckResult(KeyType.OPENROUTER, KeyStatus.ERROR, {
        message: '密钥格式无效',
        errors: validation.errors
      });
    }

    // 连通性测试
    const startTime = Date.now();
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10000)
      });

      const responseTime = Date.now() - startTime;
      stats.averageResponseTime = this.calculateAverageResponseTime(
        stats.averageResponseTime,
        responseTime,
        stats.successCount + 1
      );

      if (response.ok) {
        const data = await response.json();
        stats.successCount++;
        stats.errorStreak = 0;
        stats.lastSuccessTime = new Date().toISOString();

        return new KeyCheckResult(KeyType.OPENROUTER, KeyStatus.NORMAL, {
          message: '密钥有效',
          responseTime,
          availableModels: data.data?.length || 0
        });
      } else if (response.status === 401) {
        stats.failCount++;
        stats.errorStreak++;
        stats.lastErrorTime = new Date().toISOString();

        return new KeyCheckResult(KeyType.OPENROUTER, KeyStatus.ERROR, {
          message: '密钥认证失败',
          httpStatus: response.status,
          suggestion: '请检查密钥是否正确'
        });
      } else {
        stats.failCount++;
        stats.errorStreak++;
        stats.lastErrorTime = new Date().toISOString();

        return new KeyCheckResult(KeyType.OPENROUTER, KeyStatus.ERROR, {
          message: `API请求失败: HTTP ${response.status}`,
          httpStatus: response.status
        });
      }
    } catch (error) {
      stats.failCount++;
      stats.errorStreak++;
      stats.lastErrorTime = new Date().toISOString();

      return new KeyCheckResult(KeyType.OPENROUTER, KeyStatus.ERROR, {
        message: '网络请求失败',
        error: error.message
      });
    }
  }

  /**
   * 检查智谱AI密钥
   */
  async checkZhipuKey () {
    const key = apiKeyManager.getZhipuApiKey();
    const stats = this.stats.get(KeyType.ZHIPU);
    stats.totalChecks++;
    stats.lastCheckTime = new Date().toISOString();

    if (!key) {
      stats.failCount++;
      stats.errorStreak++;
      return new KeyCheckResult(KeyType.ZHIPU, KeyStatus.NOT_CONFIGURED, {
        message: '智谱AI API密钥未配置',
        suggestion: '请在设置中配置智谱AI API密钥'
      });
    }

    // 智谱AI密钥验证通过格式检查即可
    const validation = apiValidator.validateApiKey('zhipu', key);
    if (!validation.valid) {
      stats.failCount++;
      stats.errorStreak++;
      stats.lastErrorTime = new Date().toISOString();
      return new KeyCheckResult(KeyType.ZHIPU, KeyStatus.ERROR, {
        message: '密钥格式无效',
        errors: validation.errors
      });
    }

    stats.successCount++;
    stats.errorStreak = 0;
    stats.lastSuccessTime = new Date().toISOString();

    return new KeyCheckResult(KeyType.ZHIPU, KeyStatus.NORMAL, {
      message: '密钥格式有效',
      warnings: validation.warnings
    });
  }

  /**
   * 检查七牛云AI密钥
   */
  async checkQiniuKey () {
    const key = apiKeyManager.getQiniuAIApiKey();
    const stats = this.stats.get(KeyType.QINIU);
    stats.totalChecks++;
    stats.lastCheckTime = new Date().toISOString();

    if (!key) {
      stats.failCount++;
      stats.errorStreak++;
      return new KeyCheckResult(KeyType.QINIU, KeyStatus.NOT_CONFIGURED, {
        message: '七牛云AI API密钥未配置',
        suggestion: '请在设置中配置七牛云AI API密钥'
      });
    }

    const validation = apiValidator.validateApiKey('qiniu', key);
    if (!validation.valid) {
      stats.failCount++;
      stats.errorStreak++;
      stats.lastErrorTime = new Date().toISOString();
      return new KeyCheckResult(KeyType.QINIU, KeyStatus.ERROR, {
        message: '密钥格式无效',
        errors: validation.errors
      });
    }

    stats.successCount++;
    stats.errorStreak = 0;
    stats.lastSuccessTime = new Date().toISOString();

    return new KeyCheckResult(KeyType.QINIU, KeyStatus.NORMAL, {
      message: '密钥格式有效',
      warnings: validation.warnings
    });
  }

  /**
   * 检查腾讯地图密钥
   */
  async checkTencentMapKey () {
    const key = envConfig.get('TENCENT_MAP_KEY');
    const stats = this.stats.get(KeyType.TENCENT_MAP);
    stats.totalChecks++;
    stats.lastCheckTime = new Date().toISOString();

    if (!key || key.trim() === '') {
      stats.failCount++;
      stats.errorStreak++;
      return new KeyCheckResult(KeyType.TENCENT_MAP, KeyStatus.NOT_CONFIGURED, {
        message: '腾讯地图API密钥未配置',
        suggestion: '请在.env文件中设置VITE_TENCENT_MAP_KEY'
      });
    }

    // 腾讯地图密钥格式检查（通常是字母数字组合）
    if (key.length < 10) {
      stats.failCount++;
      stats.errorStreak++;
      stats.lastErrorTime = new Date().toISOString();
      return new KeyCheckResult(KeyType.TENCENT_MAP, KeyStatus.ERROR, {
        message: '密钥格式异常，长度过短',
        suggestion: '请检查密钥是否完整'
      });
    }

    stats.successCount++;
    stats.errorStreak = 0;
    stats.lastSuccessTime = new Date().toISOString();

    return new KeyCheckResult(KeyType.TENCENT_MAP, KeyStatus.NORMAL, {
      message: '密钥已配置'
    });
  }

  /**
   * 计算平均响应时间
   */
  calculateAverageResponseTime (currentAvg, newTime, count) {
    if (currentAvg === 0) return newTime;
    return (currentAvg * (count - 1) + newTime) / count;
  }

  /**
   * 添加到检查历史
   */
  addToHistory (result) {
    this.checkHistory.push(result);
    if (this.checkHistory.length > this.maxHistorySize) {
      this.checkHistory.shift();
    }
  }

  /**
   * 获取检查历史
   */
  getCheckHistory (keyType = null, limit = 10) {
    let history = this.checkHistory;

    if (keyType) {
      history = history.filter(h =>
        h.details && Object.values(h.details).some(d => d.type === keyType)
      );
    }

    return history.slice(-limit);
  }

  /**
   * 获取密钥统计信息
   */
  getKeyStats (keyType = null) {
    if (keyType) {
      return this.stats.get(keyType);
    }

    const allStats = {};
    this.stats.forEach((value, key) => {
      allStats[key] = value;
    });
    return allStats;
  }

  /**
   * 启动定时检查
   * @param {number} intervalMinutes - 检查间隔（分钟）
   */
  startAutoCheck (intervalMinutes = 30) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // 立即执行一次
    this.checkAllKeys();

    // 定时执行
    this.checkInterval = setInterval(() => {
      this.checkAllKeys();
    }, intervalMinutes * 60 * 1000);

    console.log(`[ApiKeyCheckService] 已启动定时检查，间隔: ${intervalMinutes}分钟`);
  }

  /**
   * 停止定时检查
   */
  stopAutoCheck () {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[ApiKeyCheckService] 已停止定时检查');
    }
  }

  /**
   * 获取密钥健康报告
   */
  getHealthReport () {
    const stats = this.getKeyStats();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalKeys: Object.keys(KeyType).length,
        healthyKeys: 0,
        warningKeys: 0,
        errorKeys: 0,
        notConfiguredKeys: 0
      },
      details: {}
    };

    Object.entries(stats).forEach(([keyType, stat]) => {
      const keyStats = { ...stat };

      // 计算成功率
      const totalAttempts = stat.successCount + stat.failCount;
      keyStats.successRate = totalAttempts > 0
        ? (stat.successCount / totalAttempts * 100).toFixed(2) + '%'
        : 'N/A';

      // 判断健康状态
      if (stat.errorStreak >= 3) {
        keyStats.healthStatus = KeyStatus.ERROR;
        report.summary.errorKeys++;
      } else if (stat.errorStreak > 0) {
        keyStats.healthStatus = KeyStatus.WARNING;
        report.summary.warningKeys++;
      } else if (stat.totalChecks === 0) {
        keyStats.healthStatus = KeyStatus.NOT_CONFIGURED;
        report.summary.notConfiguredKeys++;
      } else {
        keyStats.healthStatus = KeyStatus.NORMAL;
        report.summary.healthyKeys++;
      }

      report.details[keyType] = keyStats;
    });

    return report;
  }

  /**
   * 导出检查报告
   */
  exportReport () {
    const report = this.getHealthReport();
    const history = this.getCheckHistory(null, 50);

    return {
      ...report,
      history,
      exportTime: new Date().toISOString()
    };
  }
}

// 创建单例实例
const apiKeyCheckService = new ApiKeyCheckService();

export default apiKeyCheckService;
export { ApiKeyCheckService, KeyCheckResult };
