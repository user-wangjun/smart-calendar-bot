/**
 * 天气智能推荐服务
 * 基于天气数据提供穿衣、饮食、出行等生活建议
 */

/**
 * 穿衣建议配置
 * 根据温度和天气条件提供穿衣推荐
 */
const CLOTHING_ADVICE = {
  veryHot: {
    tempRange: [35, 50],
    description: '极热天气',
    clothing: ['短袖T恤', '短裤', '凉鞋', '遮阳帽', '太阳镜'],
    tips: ['避免在中午时段外出', '多喝水防止中暑', '使用防晒霜'],
    color: '#ef4444'
  },
  hot: {
    tempRange: [28, 35],
    description: '炎热天气',
    clothing: ['短袖衬衫', '薄长裤/短裤', '透气鞋', '遮阳帽'],
    tips: ['选择浅色衣物', '注意防晒', '随身携带水杯'],
    color: '#f97316'
  },
  warm: {
    tempRange: [22, 28],
    description: '温暖天气',
    clothing: ['长袖T恤', '薄外套', '长裤', '休闲鞋'],
    tips: ['早晚温差大，建议携带外套', '适合户外活动'],
    color: '#f59e0b'
  },
  comfortable: {
    tempRange: [15, 22],
    description: '舒适天气',
    clothing: ['长袖衬衫', '薄毛衣', '长裤', '外套'],
    tips: ['最宜人的温度', '适合各种户外活动'],
    color: '#10b981'
  },
  cool: {
    tempRange: [10, 15],
    description: '凉爽天气',
    clothing: ['毛衣', '厚外套', '长裤', ' closed鞋'],
    tips: ['注意保暖', '建议穿多层衣物'],
    color: '#3b82f6'
  },
  cold: {
    tempRange: [5, 10],
    description: '较冷天气',
    clothing: ['厚毛衣', '羽绒服/大衣', '长裤', '保暖鞋', '围巾'],
    tips: ['注意防寒保暖', '老人小孩需特别注意'],
    color: '#6366f1'
  },
  veryCold: {
    tempRange: [-20, 5],
    description: '寒冷天气',
    clothing: ['羽绒服', '保暖内衣', '厚毛衣', '长裤', '保暖鞋', '围巾', '手套', '帽子'],
    tips: ['尽量减少户外活动时间', '注意手脚保暖', '预防冻伤'],
    color: '#8b5cf6'
  }
};

/**
 * 饮食建议配置
 * 根据天气条件提供饮食推荐
 */
const DIET_ADVICE = {
  hot: {
    conditions: ['sunny', 'hot', 'veryHot'],
    description: '清热解暑',
    foods: ['绿豆汤', '西瓜', '苦瓜', '黄瓜', '凉拌菜', '绿茶'],
    drinks: ['绿豆汤', '菊花茶', '柠檬水', '椰子水'],
    tips: ['多喝水补充水分', '避免油腻辛辣食物', '适量吃苦味食物'],
    avoid: ['油炸食品', '辛辣食物', '过甜饮料']
  },
  cold: {
    conditions: ['cold', 'veryCold', 'snow'],
    description: '温补养生',
    foods: ['羊肉汤', '红枣', '桂圆', '生姜', '红糖', '核桃'],
    drinks: ['姜茶', '红枣茶', '热豆浆', '热牛奶'],
    tips: ['多吃温热食物', '适量进补', '避免生冷食物'],
    avoid: ['冷饮', '生冷食物', '寒性水果']
  },
  rainy: {
    conditions: ['rain', 'storm', 'thunderstorm'],
    description: '祛湿健脾',
    foods: ['薏米', '红豆', '山药', '冬瓜', '鲫鱼', '扁豆'],
    drinks: ['薏米水', '红豆汤', '陈皮茶', '普洱茶'],
    tips: ['多吃祛湿食物', '避免过甜食物', '适量运动'],
    avoid: ['油腻食物', '过甜食物', '生冷食物']
  },
  dry: {
    conditions: ['overcast', 'haze', 'fog'],
    description: '润肺养阴',
    foods: ['银耳', '百合', '梨', '蜂蜜', '白萝卜', '莲藕'],
    drinks: ['银耳汤', '蜂蜜水', '梨汤', '菊花茶'],
    tips: ['多喝水保持湿润', '多吃白色食物', '避免辛辣'],
    avoid: ['辛辣食物', '烧烤食物', '烟酒']
  },
  normal: {
    conditions: ['cloudy', 'comfortable'],
    description: '均衡饮食',
    foods: ['新鲜蔬菜', '水果', '全谷物', '瘦肉', '鱼类', '豆制品'],
    drinks: ['白开水', '淡茶', '果汁', '豆浆'],
    tips: ['保持饮食均衡', '多吃时令蔬果', '适量运动'],
    avoid: ['过度加工食品', '高糖饮料']
  }
};

/**
 * 出行建议配置
 */
const TRAVEL_ADVICE = {
  sunny: {
    icon: '☀️',
    description: '晴朗',
    advice: '天气晴朗，适合户外活动',
    precautions: ['注意防晒', '携带遮阳帽', '多补充水分'],
    suitable: ['户外运动', '郊游', '摄影', '登山'],
    unsuitable: ['长时间暴晒']
  },
  cloudy: {
    icon: '☁️',
    description: '多云',
    advice: '多云天气，适宜出行',
    precautions: ['天气舒适', '适合各种活动'],
    suitable: ['户外运动', '购物', '约会', '各种活动'],
    unsuitable: []
  },
  rain: {
    icon: '🌧️',
    description: '雨天',
    advice: '有雨，出行请带伞',
    precautions: ['携带雨具', '注意路滑', '避免低洼地带'],
    suitable: ['室内活动', '看电影', '逛商场'],
    unsuitable: ['户外运动', '登山', '露营']
  },
  storm: {
    icon: '⛈️',
    description: '暴雨',
    advice: '暴雨天气，尽量减少外出',
    precautions: ['避免外出', '远离危险区域', '注意防洪'],
    suitable: ['居家活动'],
    unsuitable: ['户外活动', '驾车出行', '水上活动']
  },
  snow: {
    icon: '🌨️',
    description: '雪天',
    advice: '有雪，注意保暖和交通安全',
    precautions: ['穿防滑鞋', '注意保暖', '驾车小心'],
    suitable: ['赏雪', '滑雪', '室内活动'],
    unsuitable: ['长途驾驶', '高空作业']
  },
  fog: {
    icon: '🌫️',
    description: '雾天',
    advice: '能见度低，驾车需谨慎',
    precautions: ['开启雾灯', '减速慢行', '保持距离'],
    suitable: ['室内活动'],
    unsuitable: ['驾车出行', '高空作业']
  }
};

/**
 * 运动建议配置
 */
const EXERCISE_ADVICE = {
  excellent: {
    tempRange: [15, 25],
    weather: ['sunny', 'cloudy'],
    description: '运动条件极佳',
    activities: ['慢跑', '骑行', '游泳', '羽毛球', '登山'],
    tips: ['适合各种户外运动', '注意适量补水'],
    color: '#10b981'
  },
  good: {
    tempRange: [10, 30],
    weather: ['sunny', 'cloudy', 'overcast'],
    description: '运动条件良好',
    activities: ['快走', '瑜伽', '太极', '乒乓球'],
    tips: ['适合轻度到中度运动', '避免剧烈运动'],
    color: '#3b82f6'
  },
  moderate: {
    tempRange: [5, 35],
    weather: ['cloudy', 'overcast', 'light_rain'],
    description: '运动条件一般',
    activities: ['室内健身', '瑜伽', '游泳'],
    tips: ['建议选择室内运动', '注意身体反应'],
    color: '#f59e0b'
  },
  poor: {
    tempRange: [-10, 40],
    weather: ['rain', 'storm', 'snow', 'haze'],
    description: '运动条件较差',
    activities: ['室内拉伸', '冥想', '轻度瑜伽'],
    tips: ['建议室内运动', '避免户外运动'],
    color: '#f97316'
  },
  bad: {
    tempRange: [-50, 50],
    weather: ['storm', 'heavy_rain', 'haze'],
    description: '不建议运动',
    activities: ['休息', '冥想'],
    tips: ['天气恶劣，建议休息', '待天气好转再运动'],
    color: '#ef4444'
  }
};

/**
 * 获取穿衣建议
 * @param {number} temperature - 温度
 * @param {string} weatherType - 天气类型
 * @returns {Object} 穿衣建议
 */
const getClothingAdvice = (temperature, weatherType) => {
  // 根据温度找到对应的建议
  let advice = null;
  for (const [key, value] of Object.entries(CLOTHING_ADVICE)) {
    if (temperature >= value.tempRange[0] && temperature < value.tempRange[1]) {
      advice = { ...value, key };
      break;
    }
  }

  // 如果没有找到，使用默认建议
  if (!advice) {
    advice = CLOTHING_ADVICE.comfortable;
  }

  // 根据天气类型调整
  if (weatherType.includes('rain')) {
    advice.clothing.push('雨衣/雨伞');
    advice.tips.push('记得带雨具');
  }
  if (weatherType.includes('snow')) {
    advice.clothing.push('防滑鞋');
    advice.tips.push('注意防滑');
  }

  return advice;
};

/**
 * 获取饮食建议
 * @param {string} weatherType - 天气类型
 * @param {number} temperature - 温度
 * @returns {Object} 饮食建议
 */
const getDietAdvice = (weatherType, temperature) => {
  // 根据天气类型找到对应的建议
  let advice = DIET_ADVICE.normal;

  for (const [key, value] of Object.entries(DIET_ADVICE)) {
    if (value.conditions.includes(weatherType)) {
      advice = { ...value, key };
      break;
    }
  }

  // 根据温度微调
  if (temperature > 30 && advice.key !== 'hot') {
    advice.tips.push('天气炎热，多喝水');
  }
  if (temperature < 5 && advice.key !== 'cold') {
    advice.tips.push('天气寒冷，多喝热饮');
  }

  return advice;
};

/**
 * 获取出行建议
 * @param {string} weatherType - 天气类型
 * @returns {Object} 出行建议
 */
const getTravelAdvice = (weatherType) => {
  // 找到最匹配的天气类型
  for (const [key, value] of Object.entries(TRAVEL_ADVICE)) {
    if (weatherType.includes(key)) {
      return { ...value, key };
    }
  }

  // 默认返回多云建议
  return TRAVEL_ADVICE.cloudy;
};

/**
 * 获取运动建议
 * @param {number} temperature - 温度
 * @param {string} weatherType - 天气类型
 * @returns {Object} 运动建议
 */
const getExerciseAdvice = (temperature, weatherType) => {
  // 根据温度和天气评估运动条件
  let bestMatch = null;
  let bestScore = -1;

  for (const [key, value] of Object.entries(EXERCISE_ADVICE)) {
    let score = 0;

    // 温度匹配度
    if (temperature >= value.tempRange[0] && temperature <= value.tempRange[1]) {
      score += 2;
    } else if (temperature >= value.tempRange[0] - 5 && temperature <= value.tempRange[1] + 5) {
      score += 1;
    }

    // 天气匹配度
    if (value.weather.includes(weatherType)) {
      score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = { ...value, key };
    }
  }

  return bestMatch || EXERCISE_ADVICE.moderate;
};

/**
 * 获取健康提醒
 * @param {Object} weatherData - 天气数据
 * @returns {Array} 健康提醒列表
 */
const getHealthReminders = (weatherData) => {
  const reminders = [];
  const { temperature, humidity, weatherType, airQuality } = weatherData;

  // 温度提醒
  if (temperature > 35) {
    reminders.push({
      type: 'warning',
      title: '高温预警',
      content: '气温过高，注意防暑降温，避免长时间户外活动',
      icon: '🌡️'
    });
  } else if (temperature < 0) {
    reminders.push({
      type: 'warning',
      title: '低温提醒',
      content: '气温较低，注意保暖，预防感冒',
      icon: '❄️'
    });
  }

  // 湿度提醒
  if (humidity > 80) {
    reminders.push({
      type: 'info',
      title: '湿度较高',
      content: '空气湿度大，注意室内通风，预防关节不适',
      icon: '💧'
    });
  } else if (humidity < 30) {
    reminders.push({
      type: 'info',
      title: '空气干燥',
      content: '空气干燥，多喝水，注意皮肤保湿',
      icon: '🏜️'
    });
  }

  // 空气质量提醒
  if (airQuality && airQuality.aqi > 100) {
    reminders.push({
      type: 'warning',
      title: '空气质量提醒',
      content: `空气质量${airQuality.level}，敏感人群减少户外活动`,
      icon: '😷'
    });
  }

  // 紫外线提醒
  if (weatherType === 'sunny' && temperature > 25) {
    reminders.push({
      type: 'info',
      title: '紫外线较强',
      content: '阳光强烈，外出请做好防晒措施',
      icon: '☀️'
    });
  }

  return reminders;
};

/**
 * 天气智能推荐服务类
 */
class WeatherRecommendationService {
  constructor () {
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30分钟缓存
  }

  /**
   * 获取完整的智能推荐
   * @param {Object} weatherData - 天气数据
   * @returns {Object} 完整的推荐数据
   */
  getRecommendations (weatherData) {
    const cacheKey = `rec_${weatherData.location?.adcode}_${Math.round(weatherData.temperature)}`;

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    const recommendations = {
      clothing: getClothingAdvice(weatherData.temperature, weatherData.weatherType),
      diet: getDietAdvice(weatherData.weatherType, weatherData.temperature),
      travel: getTravelAdvice(weatherData.weatherType),
      exercise: getExerciseAdvice(weatherData.temperature, weatherData.weatherType),
      health: getHealthReminders(weatherData),
      updateTime: new Date().toISOString()
    };

    // 缓存结果
    this.cache.set(cacheKey, {
      data: recommendations,
      timestamp: Date.now()
    });

    return recommendations;
  }

  /**
   * 获取穿衣建议
   * @param {number} temperature - 温度
   * @param {string} weatherType - 天气类型
   * @returns {Object} 穿衣建议
   */
  getClothingRecommendation (temperature, weatherType) {
    return getClothingAdvice(temperature, weatherType);
  }

  /**
   * 获取饮食建议
   * @param {string} weatherType - 天气类型
   * @param {number} temperature - 温度
   * @returns {Object} 饮食建议
   */
  getDietRecommendation (weatherType, temperature) {
    return getDietAdvice(weatherType, temperature);
  }

  /**
   * 获取出行建议
   * @param {string} weatherType - 天气类型
   * @returns {Object} 出行建议
   */
  getTravelRecommendation (weatherType) {
    return getTravelAdvice(weatherType);
  }

  /**
   * 获取运动建议
   * @param {number} temperature - 温度
   * @param {string} weatherType - 天气类型
   * @returns {Object} 运动建议
   */
  getExerciseRecommendation (temperature, weatherType) {
    return getExerciseAdvice(temperature, weatherType);
  }

  /**
   * 获取健康提醒
   * @param {Object} weatherData - 天气数据
   * @returns {Array} 健康提醒
   */
  getHealthReminders (weatherData) {
    return getHealthReminders(weatherData);
  }

  /**
   * 清除缓存
   */
  clearCache () {
    this.cache.clear();
    console.log('[WeatherRecommendation] 缓存已清除');
  }
}

// 创建单例实例
const weatherRecommendationService = new WeatherRecommendationService();

export default weatherRecommendationService;
export {
  WeatherRecommendationService,
  CLOTHING_ADVICE,
  DIET_ADVICE,
  TRAVEL_ADVICE,
  EXERCISE_ADVICE
};
