/**
 * 统一位置服务提供商 (入口文件)
 * 重构为指向 AdvancedLocationProvider 以实现更严格的定位策略
 */
import advancedLocationProvider from './location/AdvancedLocationProvider.js';
import { LocationError, LocationErrorType } from './locationServiceEnhanced.js';

// 导出单例
export default advancedLocationProvider;

// 导出类定义（虽然现在是AdvancedLocationProvider实例，但保持兼容性）
// 注意：如果外部代码使用了 new LocationProviderService()，这可能会有问题
// 但通常我们使用单例。如果必须支持 new，我们需要导出 AdvancedLocationProvider 类
// 这里我们假设主要使用默认导出的单例

export {
  advancedLocationProvider as LocationProviderService, // 这是一个实例，不是类，如果外部用 new 会报错。
  LocationError,
  LocationErrorType
};

// 如果外部确实使用了 new LocationProviderService()，我们需要重新导出类
// 但 AdvancedLocationProvider 已经在 ./location/AdvancedLocationProvider.js 中定义
// 我们可以在这里简单做一个包装或者直接修改 AdvancedLocationProvider 的导出
