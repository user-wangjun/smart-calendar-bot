/**
 * 高德地图天气服务 (入口文件)
 * 重构为指向 EnhancedWeatherService 以支持更严格的要求
 */
import enhancedWeatherService from './weather/EnhancedWeatherService.js';

export default enhancedWeatherService;
export { enhancedWeatherService as AmapWeatherService };
