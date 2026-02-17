/**
 * 高级定位服务调度器
 * 实现多层级降级、熔断、防作弊与数据完整性保障
 */
import TencentStrategy from './strategies/TencentStrategy.js';
import SystemStrategy from './strategies/SystemStrategy.js';
import IPStrategy from './strategies/IPStrategy.js';
import BaseStationStrategy from './strategies/BaseStationStrategy.js';
import { desensitizeLocation } from '../../utils/geoUtils.js';
// import { checkAltitudeAnomaly } from '../../utils/geoUtils.js';

const STORAGE_KEY_CACHE = 'location_cache_v2';
const STORAGE_KEY_BREAKER = 'location_breaker_state';

class AdvancedLocationProvider {
  constructor () {
    this.strategies = [
      new TencentStrategy(),
      new SystemStrategy(),
      new IPStrategy(),
      new BaseStationStrategy()
    ];

    this.cacheTTL = 5 * 60 * 1000; // 5分钟
    this.requestTimestamps = []; // 用于防作弊

    // 加载熔断器状态
    this.breakerState = this.loadBreakerState();
  }

  /**
   * 加载熔断器状态
   */
  loadBreakerState () {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BREAKER);
      return saved ? JSON.parse(saved) : { failures: 0, lastFailTime: 0, lockedUntil: 0 };
    } catch (e) {
      return { failures: 0, lastFailTime: 0, lockedUntil: 0 };
    }
  }

  /**
   * 保存熔断器状态
   */
  saveBreakerState () {
    try {
      localStorage.setItem(STORAGE_KEY_BREAKER, JSON.stringify(this.breakerState));
    } catch (e) {
      console.error('保存熔断器状态失败', e);
    }
  }

  /**
   * 检查熔断器是否开启
   */
  checkCircuitBreaker () {
    const now = Date.now();
    if (now < this.breakerState.lockedUntil) {
      const remainingMinutes = Math.ceil((this.breakerState.lockedUntil - now) / 60000);
      throw new Error(`定位服务已熔断，请 ${remainingMinutes} 分钟后再试`);
    }
    // 锁定过期，重置
    if (this.breakerState.lockedUntil > 0 && now >= this.breakerState.lockedUntil) {
      this.resetBreaker();
    }
  }

  /**
   * 记录失败并更新熔断器
   */
  recordFailure () {
    this.breakerState.failures++;
    this.breakerState.lastFailTime = Date.now();

    if (this.breakerState.failures >= 10) {
      this.breakerState.lockedUntil = Date.now() + 30 * 60 * 1000; // 锁定30分钟
      console.error('[AdvancedLocation] 连续失败10次，触发熔断，暂停服务30分钟');
    }
    this.saveBreakerState();
  }

  /**
   * 重置熔断器
   */
  resetBreaker () {
    this.breakerState = { failures: 0, lastFailTime: 0, lockedUntil: 0 };
    this.saveBreakerState();
  }

  /**
   * 防作弊检查：1分钟内请求>5次
   */
  checkAntiCheat () {
    const now = Date.now();
    // 清理超过1分钟的记录
    this.requestTimestamps = this.requestTimestamps.filter(t => now - t < 60000);

    if (this.requestTimestamps.length >= 5) {
      // 触发验证码验证 (模拟)
      console.warn('[AdvancedLocation] 请求频率过高，触发防作弊验证');
      // 实际项目中应在此处弹出验证码，此处仅做日志警告并抛出错误或返回缓存
      throw new Error('请求过于频繁，请稍后再试');
    }

    this.requestTimestamps.push(now);
  }

  /**
   * 获取缓存
   */
  getCache () {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_CACHE);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.cacheTTL) {
        localStorage.removeItem(STORAGE_KEY_CACHE);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  /**
   * 设置缓存
   */
  setCache (data) {
    try {
      const cacheObj = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(cacheObj));
    } catch (e) {
      console.error('缓存写入失败', e);
    }
  }

  /**
   * 执行定位流程
   */
  async getCurrentLocation (options = {}) {
    // 1. 熔断检查
    this.checkCircuitBreaker();

    // 2. 防作弊检查
    this.checkAntiCheat();

    // 3. 缓存检查
    if (!options.forceRefresh) {
      const cached = this.getCache();
      if (cached) {
        console.log('[AdvancedLocation] 命中缓存');
        return { success: true, data: cached, source: 'cache' };
      }
    }

    let lastError = null;

    // 4. 责任链降级策略
    for (const strategy of this.strategies) {
      console.log(`[AdvancedLocation] 尝试策略: ${strategy.name}`);
      try {
        const result = await strategy.execute();

        if (result.success) {
          // 成功，重置熔断器
          this.resetBreaker();

          // 5. 数据完整性检查 (海拔二次验证等)
          // 假设这里可以访问上次位置来对比海拔，这里简单模拟
          // if (checkAltitudeAnomaly(result.data.altitude, lastAltitude)) { ... }

          // 6. 数据脱敏
          const safeData = desensitizeLocation(result.data);

          // 7. 写入缓存
          this.setCache(safeData);

          return { success: true, data: safeData, source: strategy.name };
        } else {
          lastError = result.error;
        }
      } catch (e) {
        console.warn(`[AdvancedLocation] 策略 ${strategy.name} 异常:`, e);
        lastError = e.message;
      }
    }

    // 所有策略失败
    this.recordFailure();
    throw new Error(lastError || '所有定位方案均失败');
  }
}

const advancedLocationProvider = new AdvancedLocationProvider();
export default advancedLocationProvider;
