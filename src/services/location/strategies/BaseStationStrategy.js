/**
 * 基站定位策略 (降级方案 C)
 * Web环境无法直接获取 MCC/MNC/LAC/CID 参数
 * 此模块为占位符，或用于后续 Hybrid App 桥接
 * 严格3秒超时
 */
export default class BaseStationStrategy {
  constructor () {
    this.name = 'base_station';
    this.timeout = 3000;
  }

  async execute () {
    // Web环境不支持
    console.warn('[BaseStationStrategy] Web环境不支持基站定位，跳过');
    return {
      success: false,
      error: 'Web环境不支持基站定位'
    };
  }
}
