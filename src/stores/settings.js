import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * 设置状态管理
 * 管理用户偏好设置和应用配置
 */
export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const theme = ref('light');
  const themeMode = ref('light'); // light, dark, system
  const language = ref('zh-CN');
  const timezone = ref('Asia/Shanghai');
  const notificationsEnabled = ref(true);

  // 字体设置
  const fontSize = ref('medium'); // small, medium, large, custom
  const customFontSize = ref(16); // 自定义字体大小（px）
  const fontFamily = ref('system'); // system, sans-serif, serif, monospace, cursive, fantasy
  const textColor = ref(''); // 自定义文字颜色（空值表示使用默认）

  // 背景设置
  const backgroundImage = ref('');
  const backgroundType = ref('default'); // default, preset, custom, dynamic
  const backgroundTheme = ref('default'); // default, starry, nature, city, ocean, fireworks
  const backgroundFormat = ref(''); // 当前背景的格式（mime类型）
  const userBackgrounds = ref([]); // 统一的用户背景列表（包含静态和动态），最多保存6个

  // API密钥管理（多平台）
  const apiKeys = ref({
    openai: '',
    anthropic: '',
    google: '',
    openrouter: '',
    cherry: '',
    zhipu: '',
    'qiniu-ai': ''
  });

  // API提供商设置
  const apiProvider = ref('openrouter'); // 当前API提供商

  // 模型模式：'system' (系统/智谱) 或 'custom' (自选)
  const modelMode = ref('system');

  // 自选模型配置
  const customModelConfig = ref({
    platform: 'openai', // openai, anthropic, baidu, ali, custom
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    modelId: 'gpt-3.5-turbo',
    parameters: {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1.0
    }
  });

  // 自选模型预设
  const customModelPresets = ref([]);

  // 用户自定义API提供商列表（与系统API严格分离）
  const userProviders = ref([]);

  // Ollama本地服务设置
  const ollamaEnabled = ref(false); // Ollama功能默认禁用
  const ollamaUrl = ref('http://localhost:11434'); // Ollama服务默认地址
  const ollamaSelectedModel = ref('llama3.1'); // Ollama选中的模型

  // AI模型设置
  const aiModelSettings = ref({
    priorityMode: 'balanced', // balanced, speed, quality, cost
    preferredTaskTypes: ['chat', 'analysis'],
    responseTimePreference: 'medium', // fast, medium, slow
    qualityPreference: 'high', // low, medium, high
    complexityHandling: 'adaptive', // simple, adaptive, complex
    maxBudget: 100
  });

  // 天气设置
  const weatherSettings = ref({
    defaultCity: 'beijing',
    favoriteCities: ['beijing', '上海', '广州'],
    cacheTimeout: 30, // 分钟
    autoRefresh: false,
    refreshInterval: 30, // 分钟
    temperatureUnit: 'c' // c: 摄氏度, f: 华氏度
  });

  // 铃声设置
  const ringtoneSettings = ref({
    customRingtone: '', // 自定义铃声的base64或URL
    ringtoneName: '', // 铃声名称
    useCustomRingtone: false // 是否使用自定义铃声
  });

  // 计算属性
  const isDarkMode = computed(() => {
    if (themeMode.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    if (themeMode.value === 'transparent') {
      // 透明主题默认跟随系统深色模式
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return themeMode.value === 'dark';
  });

  // 系统主题媒体查询引用（用于监听系统主题变化）
  let systemThemeMediaQuery = null;
  let systemThemeChangeListener = null;

  const currentFontSize = computed(() => {
    if (fontSize.value === 'custom') {
      return customFontSize.value;
    }
    const sizeMap = {
      small: 14,
      medium: 16,
      large: 18
    };
    return sizeMap[fontSize.value] || 16;
  });

  const currentFontFamily = computed(() => {
    const fontMap = {
      system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      'sans-serif': '"Helvetica Neue", Helvetica, Arial, sans-serif',
      serif: 'Georgia, "Times New Roman", Times, serif',
      monospace: '"Courier New", Courier, monospace',
      cursive: '"Brush Script MT", cursive',
      fantasy: '"Comic Sans MS", cursive'
    };
    return fontMap[fontFamily.value] || fontMap.system;
  });

  /**
   * 切换主题
   */
  const toggleTheme = () => {
    if (themeMode.value === 'light') {
      themeMode.value = 'dark';
    } else {
      themeMode.value = 'light';
    }
    applyTheme();
    saveToLocalStorage();
  };

  /**
   * 设置主题模式
   * @param {string} mode - 主题模式（light, dark, system）
   */
  const setThemeMode = (mode) => {
    themeMode.value = mode;
    applyTheme();
    // 不再自动清除背景，保持主题与背景的独立性
    saveToLocalStorage();
  };

  /**
   * 设置文字颜色
   * @param {string} color - 文字颜色（十六进制或CSS颜色）
   */
  const setTextColor = (color) => {
    textColor.value = color;
    applyTextColor();
    saveToLocalStorage();
  };

  /**
   * 应用文字颜色到DOM
   */
  const applyTextColor = () => {
    if (textColor.value) {
      document.documentElement.style.setProperty('--custom-text-color', textColor.value);
      document.body.classList.add('has-custom-text-color');
    } else {
      document.documentElement.style.removeProperty('--custom-text-color');
      document.body.classList.remove('has-custom-text-color');
    }
  };

  /**
   * 应用主题到DOM
   */
  const applyTheme = () => {
    const isDark = isDarkMode.value;

    // 先移除所有主题类
    document.documentElement.classList.remove('dark', 'light', 'transparent');

    // 根据主题模式应用相应的类
    if (themeMode.value === 'transparent') {
      document.documentElement.classList.add('transparent');
      // 透明主题同时应用深色/浅色模式来决定文字颜色
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.add('light');
      }
    } else if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }

    // 如果设置为system或transparent模式，启动系统主题监听
    if (themeMode.value === 'system' || themeMode.value === 'transparent') {
      startSystemThemeListener();
    } else {
      stopSystemThemeListener();
    }

    // 主题切换时重新应用背景，确保遮罩透明度与主题匹配
    if (backgroundType.value !== 'default' && backgroundType.value !== 'dynamic') {
      applyBackground();
    }
  };

  /**
   * 启动系统主题变化监听
   */
  const startSystemThemeListener = () => {
    // 如果已经存在监听器，先停止
    stopSystemThemeListener();

    // 创建媒体查询
    systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // 定义变化处理函数
    systemThemeChangeListener = (e) => {
      console.log('[Settings] 系统主题变化:', e.matches ? 'dark' : 'light');
      if (themeMode.value === 'system' || themeMode.value === 'transparent') {
        applyTheme();
      }
    };

    // 添加监听器
    if (systemThemeMediaQuery.addEventListener) {
      systemThemeMediaQuery.addEventListener('change', systemThemeChangeListener);
    } else {
      // 兼容旧版浏览器
      systemThemeMediaQuery.addListener(systemThemeChangeListener);
    }

    console.log('[Settings] 已启动系统主题监听');
  };

  /**
   * 停止系统主题变化监听
   */
  const stopSystemThemeListener = () => {
    if (systemThemeMediaQuery && systemThemeChangeListener) {
      if (systemThemeMediaQuery.removeEventListener) {
        systemThemeMediaQuery.removeEventListener('change', systemThemeChangeListener);
      } else {
        // 兼容旧版浏览器
        systemThemeMediaQuery.removeListener(systemThemeChangeListener);
      }

      systemThemeMediaQuery = null;
      systemThemeChangeListener = null;
      console.log('[Settings] 已停止系统主题监听');
    }
  };

  /**
   * 设置字体大小
   * @param {string} size - 字体大小（small, medium, large, custom）
   */
  const setFontSize = (size) => {
    fontSize.value = size;
    applyFontSize();
    saveToLocalStorage();
  };

  /**
   * 设置自定义字体大小
   * @param {number} size - 字体大小（px）
   */
  const setCustomFontSize = (size) => {
    customFontSize.value = size;
    fontSize.value = 'custom';
    applyFontSize();
    saveToLocalStorage();
  };

  /**
   * 应用字体大小
   */
  const applyFontSize = () => {
    document.documentElement.style.fontSize = `${currentFontSize.value}px`;
  };

  /**
   * 设置字体风格
   * @param {string} family - 字体风格
   */
  const setFontFamily = (family) => {
    fontFamily.value = family;
    applyFontFamily();
    saveToLocalStorage();
  };

  /**
   * 应用字体风格
   */
  const applyFontFamily = () => {
    document.documentElement.style.fontFamily = currentFontFamily.value;
  };

  /**
   * 设置背景图片
   * @param {string} url - 图片URL
   * @param {string} type - 背景类型（ai-generated, custom）
   * @param {string} format - 背景格式（mime类型）
   */
  const setBackgroundImage = (url, type = 'custom', format = '') => {
    backgroundImage.value = url;
    backgroundType.value = url ? type : 'default';
    backgroundTheme.value = 'default';
    backgroundFormat.value = format;
    // 设置背景时，默认文字颜色为白色（如果用户没有自定义）
    if (url && !textColor.value) {
      textColor.value = '#ffffff';
      applyTextColor();
    } else if (!url) {
      textColor.value = '';
      applyTextColor();
    }
    applyBackground();
    saveToLocalStorage();
  };

  /**
   * 设置动态背景主题
   * @param {string} theme - 主题名称（starry, nature, city, ocean）
   */
  const setBackgroundTheme = (theme) => {
    backgroundTheme.value = theme;
    backgroundType.value = theme === 'default' ? 'default' : 'dynamic';
    backgroundImage.value = '';
    // 设置动态背景时，默认文字颜色为白色（如果用户没有自定义）
    if (theme !== 'default' && !textColor.value) {
      textColor.value = '#ffffff';
      applyTextColor();
    } else if (theme === 'default') {
      textColor.value = '';
      applyTextColor();
    }
    applyBackground();
    saveToLocalStorage();
  };

  /**
   * 添加用户背景（支持静态和动态格式）
   * 采用最新优先策略，最多保存6个
   * @param {string} url - 背景URL
   * @param {string} type - 类型（ai-generated、custom、gif、video等）
   * @param {string} name - 背景名称
   * @param {string} format - 文件格式（mime类型）
   */
  const addUserBackground = (url, type, name, format) => {
    const newBackground = {
      id: Date.now().toString(),
      url,
      type,
      name,
      format,
      isDynamic: format && (format.includes('gif') || format.includes('webp') || format.includes('video')),
      createdAt: Date.now()
    };
    // 添加到开头（最新的在前）
    userBackgrounds.value.unshift(newBackground);
    // 限制最多6个
    if (userBackgrounds.value.length > 6) {
      userBackgrounds.value = userBackgrounds.value.slice(0, 6);
    }
    saveToLocalStorage();
  };

  /**
   * 删除用户背景
   * @param {string} id - 背景ID
   */
  const deleteUserBackground = (id) => {
    userBackgrounds.value = userBackgrounds.value.filter(bg => bg.id !== id);
    saveToLocalStorage();
  };

  /**
   * 清除背景图片
   */
  const clearBackground = () => {
    backgroundImage.value = '';
    backgroundType.value = 'default';
    backgroundTheme.value = 'default';
    backgroundFormat.value = '';
    textColor.value = '';
    applyTextColor();
    applyBackground();
    saveToLocalStorage();
  };

  /**
   * 应用背景图片
   * 优化背景与主题色的协同工作，确保视觉效果协调
   * 简化版本：避免在渲染期间操作 DOM，减少错误
   */
  const applyBackground = () => {
    // 使用 setTimeout 确保在 Vue 渲染完成后再操作 DOM
    setTimeout(() => {
      try {
        // 安全检查：确保 document 和 body 存在
        if (!document || !document.body) {
          console.warn('[Settings] DOM 未准备好，跳过背景应用');
          return;
        }

        const appContent = document.querySelector('.app-content');
        const appLayout = document.querySelector('.app-layout');

        // 判断是否是视频背景
        const isVideoBg = backgroundFormat.value && backgroundFormat.value.includes('video');

        if (backgroundType.value === 'default') {
          // 默认背景：清除自定义背景，让主题色完全控制
          document.body.style.backgroundImage = '';
          document.body.style.backgroundColor = '';
          document.body.style.backgroundAttachment = '';
          document.body.classList.remove('has-dynamic-background');
          if (appContent) {
            appContent.style.backgroundColor = '';
          }
          if (appLayout) {
            appLayout.style.backgroundColor = '';
          }
        } else if (backgroundType.value === 'dynamic' || isVideoBg) {
          // 动态主题或视频背景，设置透明背景
          document.body.style.backgroundImage = '';
          document.body.style.backgroundColor = 'transparent';
          document.body.classList.add('has-dynamic-background');
          if (appContent) {
            appContent.style.backgroundColor = 'transparent';
          }
          if (appLayout) {
            appLayout.style.backgroundColor = 'transparent';
          }
        } else {
          // 安全检查：确保 backgroundImage 存在
          if (backgroundImage.value) {
            // 自定义背景图片：保持主题色对文字和UI的控制
            document.body.style.backgroundImage = `url(${backgroundImage.value})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundAttachment = 'fixed';

            // 根据当前主题模式调整背景遮罩透明度，确保文字可读性
            if (isDarkMode.value) {
              // 深色模式下使用稍深的遮罩
              document.body.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
            } else {
              // 浅色模式下使用较浅的遮罩
              document.body.style.backgroundColor = 'rgba(0, 0, 0, 0.25)';
            }

            document.body.classList.remove('has-dynamic-background');
            // 保持内容区域透明，让背景图片显示
            if (appContent) {
              appContent.style.backgroundColor = 'transparent';
            }
            if (appLayout) {
              appLayout.style.backgroundColor = 'transparent';
            }
          }
        }
      } catch (error) {
        console.error('[Settings] 应用背景样式时出错:', error);
      }
    }, 0);
  };

  /**
   * 设置语言
   * @param {string} newLanguage - 语言代码
   */
  const setLanguage = (newLanguage) => {
    language.value = newLanguage;
    saveToLocalStorage();
  };

  /**
   * 设置时区
   * @param {string} newTimezone - 时区名称
   */
  const setTimezone = (newTimezone) => {
    timezone.value = newTimezone;
    saveToLocalStorage();
  };

  /**
   * 切换通知
   */
  const toggleNotifications = () => {
    notificationsEnabled.value = !notificationsEnabled.value;
    saveToLocalStorage();
  };

  /**
   * 设置API密钥
   * @param {string} provider - API提供商
   * @param {string} apiKey - API密钥
   */
  const setApiKey = (provider, apiKey) => {
    apiKeys.value[provider] = apiKey;
    saveToLocalStorage();
  };

  /**
   * 设置模型模式
   * @param {string} mode - 'system' | 'custom'
   */
  const setModelMode = (mode) => {
    modelMode.value = mode;
    saveToLocalStorage();
  };

  /**
   * 更新自选模型配置
   * @param {Object} config - 部分或全部配置
   */
  const setCustomModelConfig = (config) => {
    customModelConfig.value = {
      ...customModelConfig.value,
      ...config,
      parameters: {
        ...customModelConfig.value.parameters,
        ...(config.parameters || {})
      }
    };
    saveToLocalStorage();
  };

  /**
   * 保存当前配置为预设
   * @param {string} name - 预设名称
   */
  const saveCustomPreset = (name) => {
    const newPreset = {
      id: Date.now().toString(),
      name,
      config: JSON.parse(JSON.stringify(customModelConfig.value))
    };
    customModelPresets.value.push(newPreset);
    saveToLocalStorage();
  };

  /**
   * 加载预设
   * @param {string} presetId
   */
  const loadCustomPreset = (presetId) => {
    const preset = customModelPresets.value.find(p => p.id === presetId);
    if (preset) {
      customModelConfig.value = JSON.parse(JSON.stringify(preset.config));
      saveToLocalStorage();
    }
  };

  /**
   * 删除预设
   * @param {string} presetId
   */
  const deleteCustomPreset = (presetId) => {
    customModelPresets.value = customModelPresets.value.filter(p => p.id !== presetId);
    saveToLocalStorage();
  };

  /**
   * 保存用户自定义API提供商
   * @param {Object} provider - 提供商配置
   */
  const saveUserProvider = (provider) => {
    const index = userProviders.value.findIndex(p => p.id === provider.id);
    if (index > -1) {
      userProviders.value[index] = provider;
    } else {
      userProviders.value.push(provider);
    }
    saveToLocalStorage();
  };

  /**
   * 获取所有用户自定义API提供商
   * @returns {Array} 用户提供商列表
   */
  const getUserProviders = () => {
    return userProviders.value;
  };

  /**
   * 删除用户自定义API提供商
   * @param {string} providerId - 提供商ID
   */
  const deleteUserProvider = (providerId) => {
    userProviders.value = userProviders.value.filter(p => p.id !== providerId);
    // 同时删除相关的API密钥
    delete apiKeys.value[`user-${providerId}`];
    saveToLocalStorage();
  };

  /**
   * 设置用户提供商API密钥
   * @param {string} providerId - 提供商ID
   * @param {string} apiKey - API密钥
   */
  const setUserProviderKey = (providerId, apiKey) => {
    apiKeys.value[`user-${providerId}`] = apiKey;
    saveToLocalStorage();
  };

  /**
   * 获取用户提供商API密钥
   * @param {string} providerId - 提供商ID
   * @returns {string} API密钥
   */
  const getUserProviderKey = (providerId) => {
    return apiKeys.value[`user-${providerId}`] || '';
  };

  /**
   * 更新用户提供商模型列表
   * @param {string} providerId - 提供商ID
   * @param {Array} models - 模型列表
   */
  const updateUserProviderModels = (providerId, models) => {
    const provider = userProviders.value.find(p => p.id === providerId);
    if (provider) {
      provider.models = models;
      saveToLocalStorage();
    }
  };

  /**
   * 设置Ollama启用状态
   * @param {boolean} enabled - 是否启用Ollama
   */
  const setOllamaEnabled = (enabled) => {
    ollamaEnabled.value = enabled;
    saveToLocalStorage();
  };

  /**
   * 设置Ollama服务地址
   * @param {string} url - Ollama服务地址
   */
  const setOllamaUrl = (url) => {
    ollamaUrl.value = url;
    saveToLocalStorage();
  };

  /**
   * 设置Ollama选中的模型
   * @param {string} modelId - 模型ID
   */
  const setOllamaSelectedModel = (modelId) => {
    ollamaSelectedModel.value = modelId;
    saveToLocalStorage();
  };

  /**
   * 获取API密钥
   * @param {string} provider - API提供商
   * @returns {string} API密钥
   */
  const getApiKey = (provider) => {
    return apiKeys.value[provider] || '';
  };

  /**
   * 设置API提供商
   * @param {string} provider - API提供商
   */
  const setApiProvider = (provider) => {
    apiProvider.value = provider;
    saveToLocalStorage();
  };

  /**
   * 获取有效的API密钥（仅使用用户配置）
   * 注意：系统不再提供默认AI密钥
   * @param {string} provider - API提供商
   * @returns {string|null} 有效的API密钥
   */
  const getEffectiveApiKey = (provider) => {
    // 仅使用用户配置的密钥
    return apiKeys.value[provider] || null;
  };

  /**
   * 删除API密钥
   * @param {string} provider - API提供商
   */
  const deleteApiKey = (provider) => {
    apiKeys.value[provider] = '';
    saveToLocalStorage();
  };

  /**
   * 设置天气配置
   * @param {Object} settings - 天气设置
   */
  const setWeatherSettings = (settings) => {
    weatherSettings.value = { ...weatherSettings.value, ...settings };
    saveToLocalStorage();
  };

  /**
   * 获取天气配置
   * @returns {Object} - 天气设置
   */
  const getWeatherSettings = () => {
    return weatherSettings.value;
  };

  /**
   * 设置默认城市
   * @param {string} city - 城市名称
   */
  const setDefaultCity = (city) => {
    weatherSettings.value.defaultCity = city;
    saveToLocalStorage();
  };

  /**
   * 添加常用城市
   * @param {string} city - 城市名称
   */
  const addFavoriteCity = (city) => {
    if (!weatherSettings.value.favoriteCities.includes(city)) {
      weatherSettings.value.favoriteCities.push(city);
      saveToLocalStorage();
    }
  };

  /**
   * 移除常用城市
   * @param {string} city - 城市名称
   */
  const removeFavoriteCity = (city) => {
    const index = weatherSettings.value.favoriteCities.indexOf(city);
    if (index > -1) {
      weatherSettings.value.favoriteCities.splice(index, 1);
      saveToLocalStorage();
    }
  };

  /**
   * 设置缓存超时时间
   * @param {number} timeout - 超时时间（分钟）
   */
  const setWeatherCacheTimeout = (timeout) => {
    weatherSettings.value.cacheTimeout = timeout;
    saveToLocalStorage();
  };

  /**
   * 设置自动刷新
   * @param {boolean} enabled - 是否启用
   */
  const setWeatherAutoRefresh = (enabled) => {
    weatherSettings.value.autoRefresh = enabled;
    saveToLocalStorage();
  };

  /**
   * 设置刷新间隔
   * @param {number} interval - 刷新间隔（分钟）
   */
  const setWeatherRefreshInterval = (interval) => {
    weatherSettings.value.refreshInterval = interval;
    saveToLocalStorage();
  };

  /**
   * 设置温度单位
   * @param {string} unit - 温度单位（c或f）
   */
  const setTemperatureUnit = (unit) => {
    weatherSettings.value.temperatureUnit = unit;
    saveToLocalStorage();
  };

  /**
   * 设置自定义铃声
   * @param {string} ringtone - 铃声数据（base64或URL）
   * @param {string} name - 铃声名称
   */
  const setCustomRingtone = (ringtone, name = '自定义铃声') => {
    ringtoneSettings.value.customRingtone = ringtone;
    ringtoneSettings.value.ringtoneName = name;
    ringtoneSettings.value.useCustomRingtone = true;
    saveToLocalStorage();
  };

  /**
   * 清除自定义铃声
   */
  const clearCustomRingtone = () => {
    ringtoneSettings.value.customRingtone = '';
    ringtoneSettings.value.ringtoneName = '';
    ringtoneSettings.value.useCustomRingtone = false;
    saveToLocalStorage();
  };

  /**
   * 设置是否使用自定义铃声
   * @param {boolean} useCustom - 是否使用自定义铃声
   */
  const setUseCustomRingtone = (useCustom) => {
    ringtoneSettings.value.useCustomRingtone = useCustom;
    saveToLocalStorage();
  };

  /**
   * 导出设置
   * @returns {Object} 设置数据
   */
  const exportSettings = () => {
    return {
      themeMode: themeMode.value,
      language: language.value,
      timezone: timezone.value,
      notificationsEnabled: notificationsEnabled.value,
      fontSize: fontSize.value,
      customFontSize: customFontSize.value,
      fontFamily: fontFamily.value,
      textColor: textColor.value,
      backgroundImage: backgroundImage.value,
      backgroundType: backgroundType.value,
      backgroundTheme: backgroundTheme.value,
      backgroundFormat: backgroundFormat.value,
      userBackgrounds: userBackgrounds.value,
      apiKeys: apiKeys.value,
      apiProvider: apiProvider.value,
      weatherSettings: weatherSettings.value,
      ollamaEnabled: ollamaEnabled.value,
      ollamaUrl: ollamaUrl.value,
      ollamaSelectedModel: ollamaSelectedModel.value,
      ringtoneSettings: ringtoneSettings.value
    };
  };

  /**
   * 导入设置
   * @param {Object} data - 设置数据
   */
  // eslint-disable-next-line complexity
  const importSettings = (data) => {
    if (data.themeMode) themeMode.value = data.themeMode;
    if (data.language) language.value = data.language;
    if (data.timezone) timezone.value = data.timezone;
    if (typeof data.notificationsEnabled === 'boolean') notificationsEnabled.value = data.notificationsEnabled;
    if (data.fontSize) fontSize.value = data.fontSize;
    if (data.customFontSize) customFontSize.value = data.customFontSize;
    if (data.fontFamily) fontFamily.value = data.fontFamily;
    if (typeof data.textColor !== 'undefined') textColor.value = data.textColor;
    if (data.backgroundImage) backgroundImage.value = data.backgroundImage;
    if (data.backgroundType) backgroundType.value = data.backgroundType;
    if (data.backgroundTheme) backgroundTheme.value = data.backgroundTheme;
    if (typeof data.backgroundFormat !== 'undefined') backgroundFormat.value = data.backgroundFormat;
    if (data.userBackgrounds) userBackgrounds.value = data.userBackgrounds;
    if (data.apiKeys) apiKeys.value = { ...apiKeys.value, ...data.apiKeys };
    if (data.apiProvider) apiProvider.value = data.apiProvider;
    if (data.modelMode) modelMode.value = data.modelMode;
    if (data.customModelConfig) customModelConfig.value = data.customModelConfig;
    if (data.customModelPresets) customModelPresets.value = data.customModelPresets;
    if (data.weatherSettings) weatherSettings.value = { ...weatherSettings.value, ...data.weatherSettings };
    if (typeof data.ollamaEnabled === 'boolean') ollamaEnabled.value = data.ollamaEnabled;
    if (data.ollamaUrl) ollamaUrl.value = data.ollamaUrl;
    if (data.ollamaSelectedModel) ollamaSelectedModel.value = data.ollamaSelectedModel;
    if (data.ringtoneSettings) ringtoneSettings.value = { ...ringtoneSettings.value, ...data.ringtoneSettings };

    applyTheme();
    applyFontSize();
    applyFontFamily();
    applyTextColor();
    applyBackground();
    saveToLocalStorage();
  };

  /**
   * 从本地存储加载设置
   */
  // eslint-disable-next-line complexity
  const loadFromLocalStorage = () => {
    try {
      const savedSettings = localStorage.getItem('app_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        themeMode.value = settings.themeMode || 'light';
        language.value = settings.language || 'zh-CN';
        timezone.value = settings.timezone || 'Asia/Shanghai';
        notificationsEnabled.value = settings.notificationsEnabled !== false;
        fontSize.value = settings.fontSize || 'medium';
        customFontSize.value = settings.customFontSize || 16;
        fontFamily.value = settings.fontFamily || 'system';
        textColor.value = settings.textColor || '';
        backgroundImage.value = settings.backgroundImage || '';
        backgroundType.value = settings.backgroundType || 'default';
        backgroundTheme.value = settings.backgroundTheme || 'default';
        backgroundFormat.value = settings.backgroundFormat || '';
        userBackgrounds.value = settings.userBackgrounds || [];

        if (settings.apiKeys) {
          apiKeys.value = { ...apiKeys.value, ...settings.apiKeys };
        }

        apiProvider.value = settings.apiProvider || 'openrouter';
        modelMode.value = settings.modelMode || 'system';
        if (settings.customModelConfig) customModelConfig.value = settings.customModelConfig;
        if (settings.customModelPresets) customModelPresets.value = settings.customModelPresets;
        if (settings.userProviders) userProviders.value = settings.userProviders;

        if (settings.weatherSettings) {
          weatherSettings.value = { ...weatherSettings.value, ...settings.weatherSettings };
        }

        // 加载Ollama设置，默认为false（禁用状态）
        ollamaEnabled.value = settings.ollamaEnabled === true;
        ollamaUrl.value = settings.ollamaUrl || 'http://localhost:11434';
        ollamaSelectedModel.value = settings.ollamaSelectedModel || 'llama3.1';

        // 加载铃声设置
        if (settings.ringtoneSettings) {
          ringtoneSettings.value = { ...ringtoneSettings.value, ...settings.ringtoneSettings };
        }

        applyTheme();
        applyFontSize();
        applyFontFamily();
        applyTextColor();
        applyBackground();
      }
    } catch (err) {
      console.error('加载设置失败:', err);
    }
  };

  /**
   * 保存设置到本地存储
   */
  const saveToLocalStorage = () => {
    try {
      const settings = {
        themeMode: themeMode.value,
        language: language.value,
        timezone: timezone.value,
        notificationsEnabled: notificationsEnabled.value,
        fontSize: fontSize.value,
        customFontSize: customFontSize.value,
        fontFamily: fontFamily.value,
        textColor: textColor.value,
        backgroundImage: backgroundImage.value,
        backgroundType: backgroundType.value,
        backgroundTheme: backgroundTheme.value,
        backgroundFormat: backgroundFormat.value,
        userBackgrounds: userBackgrounds.value,
        apiKeys: apiKeys.value,
        apiProvider: apiProvider.value,
        modelMode: modelMode.value,
        customModelConfig: customModelConfig.value,
        customModelPresets: customModelPresets.value,
        userProviders: userProviders.value,
        weatherSettings: weatherSettings.value,
        ollamaEnabled: ollamaEnabled.value,
        ollamaUrl: ollamaUrl.value,
        ollamaSelectedModel: ollamaSelectedModel.value,
        ringtoneSettings: ringtoneSettings.value
      };
      localStorage.setItem('app_settings', JSON.stringify(settings));
    } catch (err) {
      console.error('保存设置失败:', err);
    }
  };

  /**
   * 重置所有设置
   */
  const resetSettings = () => {
    themeMode.value = 'light';
    language.value = 'zh-CN';
    timezone.value = 'Asia/Shanghai';
    notificationsEnabled.value = true;
    fontSize.value = 'medium';
    customFontSize.value = 16;
    fontFamily.value = 'system';
    textColor.value = '';
    backgroundImage.value = '';
    backgroundType.value = 'default';
    backgroundTheme.value = 'default';
    backgroundFormat.value = '';
    userBackgrounds.value = [];
    apiKeys.value = {
      openai: '',
      anthropic: '',
      google: '',
      openrouter: '',
      cherry: '',
      zhipu: '',
      'qiniu-ai': ''
    };
    apiProvider.value = 'openrouter';
    modelMode.value = 'system';
    customModelConfig.value = {
      platform: 'openai',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      modelId: 'gpt-3.5-turbo',
      parameters: {
        temperature: 0.7,
        max_tokens: 2048,
        top_p: 1.0
      }
    };
    customModelPresets.value = [];
    userProviders.value = [];
    weatherSettings.value = {
      defaultCity: 'beijing',
      favoriteCities: ['beijing', '上海', '广州'],
      cacheTimeout: 30,
      autoRefresh: false,
      refreshInterval: 30,
      temperatureUnit: 'c'
    };
    ollamaEnabled.value = false;
    ollamaUrl.value = 'http://localhost:11434';
    ollamaSelectedModel.value = 'llama3.1';

    // 重置铃声设置
    ringtoneSettings.value = {
      customRingtone: '',
      ringtoneName: '',
      useCustomRingtone: false
    };

    applyTheme();
    applyFontSize();
    applyFontFamily();
    applyTextColor();
    applyBackground();
    saveToLocalStorage();
  };

  // 初始化时加载设置
  loadFromLocalStorage();

  // 如果当前是system模式，启动系统主题监听
  if (themeMode.value === 'system') {
    startSystemThemeListener();
  }

  return {
    theme,
    themeMode,
    language,
    timezone,
    notificationsEnabled,
    fontSize,
    customFontSize,
    fontFamily,
    textColor,
    backgroundImage,
    backgroundType,
    backgroundTheme,
    backgroundFormat,
    userBackgrounds,
    apiKeys,
    apiProvider,
    modelMode,
    customModelConfig,
    customModelPresets,
    aiModelSettings,
    weatherSettings,
    ollamaEnabled,
    ollamaUrl,
    ollamaSelectedModel,
    ringtoneSettings,
    isDarkMode,
    currentFontSize,
    currentFontFamily,
    toggleTheme,
    setThemeMode,
    applyTheme,
    setFontSize,
    setCustomFontSize,
    applyFontSize,
    setFontFamily,
    applyFontFamily,
    setTextColor,
    applyTextColor,
    setBackgroundImage,
    setBackgroundTheme,
    clearBackground,
    applyBackground,
    addUserBackground,
    deleteUserBackground,
    setLanguage,
    setTimezone,
    toggleNotifications,
    setApiKey,
    getApiKey,
    deleteApiKey,
    setApiProvider,
    getEffectiveApiKey,
    setModelMode,
    setCustomModelConfig,
    saveCustomPreset,
    loadCustomPreset,
    deleteCustomPreset,
    setOllamaEnabled,
    setOllamaUrl,
    setOllamaSelectedModel,
    setWeatherSettings,
    getWeatherSettings,
    setDefaultCity,
    addFavoriteCity,
    removeFavoriteCity,
    setWeatherCacheTimeout,
    setWeatherAutoRefresh,
    setWeatherRefreshInterval,
    setTemperatureUnit,
    setCustomRingtone,
    clearCustomRingtone,
    setUseCustomRingtone,
    exportSettings,
    importSettings,
    resetSettings,
    // 用户自定义API提供商相关方法
    saveUserProvider,
    getUserProviders,
    deleteUserProvider,
    setUserProviderKey,
    getUserProviderKey,
    updateUserProviderModels
  };
});
