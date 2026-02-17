import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import CryptoJS from 'crypto-js';

/**
 * 用户偏好设置存储
 * 管理用户的扩展偏好设置，包括AI、UI、隐私、内容、性能、无障碍等6大类50+配置项
 */
export const useUserPreferencesStore = defineStore('userPreferences', () => {
  // 加密密钥（应该从环境变量获取）
  const ENCRYPTION_KEY = import.meta.env.VITE_PREFERENCES_ENCRYPTION_KEY || 'default-key-12345';

  // 偏好设置数据
  const preferences = ref({
    // AI偏好
    ai: {
      // 模型偏好
      preferredModels: {
        chat: 'gpt-4',
        analysis: 'claude-3-sonnet',
        translation: 'gpt-4',
        creative: 'gpt-4'
      },

      // 生成设置
      generationSettings: {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        stopSequences: []
      },

      // 质量和性能平衡
      qualityBalance: {
        responseTime: 'balanced', // fast, balanced, quality
        complexityHandling: 'adaptive', // simple, adaptive, complex
        languageDetection: true,
        autoCorrect: true,
        smartRouting: true
      },

      // 内容过滤
      contentFilter: {
        enableNSFWFilter: true,
        enablePoliticsFilter: true,
        customBlockedWords: [],
        contentModeration: 'standard' // strict, standard, relaxed
      },

      // 学习和适应
      learningSettings: {
        enableLearning: true,
        learningRate: 0.1,
        personalizationLevel: 'medium', // low, medium, high
        adaptiveResponses: true,
        contextMemory: true
      }
    },

    // UI偏好
    ui: {
      // 主题设置
      theme: {
        mode: 'auto', // light, dark, auto
        primaryColor: '#409EFF',
        secondaryColor: '#67C23A',
        accentColor: '#E6A23C',
        backgroundImage: null,
        customCSS: ''
      },

      // 布局设置
      layout: {
        sidebarPosition: 'left', // left, right, top, bottom
        sidebarWidth: 280,
        contentWidth: 'fixed', // fixed, fluid, full
        gridColumns: 12,
        responsive: true
      },

      // 字体和排版
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 14,
        lineHeight: 1.6,
        headingScale: 1.25,
        textAlign: 'left', // left, center, right, justify
        letterSpacing: 0
      },

      // 动画和过渡
      animations: {
        enableAnimations: true,
        animationSpeed: 'normal', // slow, normal, fast
        pageTransitions: true,
        hoverEffects: true,
        loadingAnimations: true,
        parallaxEffects: false
      },

      // 组件行为
      components: {
        modalBehavior: 'center', // center, top, bottom, side
        tooltipPosition: 'top', // top, bottom, left, right, auto
        dropdownBehavior: 'click', // click, hover
        scrollBehavior: 'smooth', // smooth, instant, auto
        focusIndicators: true
      }
    },

    // 隐私偏好
    privacy: {
      // 数据收集
      dataCollection: {
        allowAnalytics: true,
        allowCrashReports: true,
        allowPerformanceMonitoring: true,
        allowUsageStatistics: true,
        dataRetentionDays: 90
      },

      // 数据共享
      dataSharing: {
        shareWithThirdParties: false,
        shareAnonymizedData: true,
        marketingConsent: false,
        researchConsent: false
      },

      // 位置和设备信息
      locationSettings: {
        allowLocationAccess: false,
        preciseLocation: false,
        deviceFingerprinting: false,
        ipAddressTracking: false
      },

      // 通信偏好
      communication: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        newsletter: false
      },

      // 安全和加密
      security: {
        enableEncryption: true,
        twoFactorAuth: false,
        biometricAuth: false,
        sessionTimeout: 30, // minutes
        autoLogout: true
      }
    },

    // 内容偏好
    content: {
      // 语言和地区
      language: {
        primaryLanguage: 'zh-CN',
        secondaryLanguages: ['en-US'],
        autoDetectLanguage: true,
        translationService: 'google', // google, baidu, youdao
        localization: 'china' // china, us, eu, global
      },

      // 内容过滤
      contentFiltering: {
        contentRating: 'general', // general, teen, mature
        blockExplicitContent: true,
        blockViolence: false,
        blockPoliticalContent: false,
        customFilters: []
      },

      // 推荐系统
      recommendations: {
        enableRecommendations: true,
        recommendationStrength: 'medium', // low, medium, high
        contentTypes: ['articles', 'videos', 'podcasts'],
        collaborativeFiltering: true,
        contentBasedFiltering: true
      },

      // 媒体偏好
      media: {
        autoPlayVideos: false,
        videoQuality: 'auto', // auto, 144p, 240p, 360p, 480p, 720p, 1080p, 4k
        audioQuality: 'high', // low, medium, high, lossless
        imageQuality: 'high', // low, medium, high, original
        lazyLoading: true
      },

      // 搜索偏好
      search: {
        searchHistory: true,
        searchSuggestions: true,
        safeSearch: 'moderate', // off, moderate, strict
        searchFilters: [],
        searchLanguage: 'zh-CN'
      }
    },

    // 性能偏好
    performance: {
      // 缓存设置
      caching: {
        enableBrowserCache: true,
        enableServiceWorker: true,
        cacheExpiration: 24, // hours
        offlineSupport: true,
        prefetchResources: true
      },

      // 加载优化
      loading: {
        lazyLoading: true,
        progressiveLoading: true,
        resourceHints: true,
        compression: 'gzip', // none, gzip, brotli
        minification: true
      },

      // 内存管理
      memory: {
        memoryLimit: 512, // MB
        garbageCollection: 'auto', // auto, manual, aggressive
        cleanupInterval: 300, // seconds
        maxTabs: 10
      },

      // 网络优化
      network: {
        connectionType: 'auto', // auto, 2g, 3g, 4g, 5g, wifi
        dataSaver: false,
        requestTimeout: 30, // seconds
        retryAttempts: 3,
        fallbackCDN: true
      },

      // 硬件加速
      hardware: {
        enableGPU: true,
        webWorkers: true,
        webAssembly: true,
        canvasAcceleration: true,
        videoAcceleration: true
      }
    },

    // 无障碍偏好
    accessibility: {
      // 视觉辅助
      visual: {
        highContrast: false,
        largeText: false,
        colorBlindMode: 'none', // none, protanopia, deuteranopia, tritanopia
        screenReader: false,
        reducedMotion: false,
        focusIndicators: true
      },

      // 听觉辅助
      hearing: {
        captions: false,
        transcripts: false,
        visualAlerts: false,
        audioDescriptions: false,
        signLanguage: 'none' // none, asl, bsl
      },

      // 运动辅助
      motor: {
        keyboardNavigation: true,
        voiceControl: false,
        switchAccess: false,
        eyeTracking: false,
        gestureControl: false
      },

      // 认知辅助
      cognitive: {
        simplifiedInterface: false,
        extendedTime: false,
        stepByStep: false,
        reminders: true,
        errorPrevention: true
      },

      // 语言和阅读
      language: {
        dyslexiaFriendly: false,
        readingLevel: 'standard', // basic, standard, advanced
        textToSpeech: false,
        speechToText: false,
        languageSwitching: true
      }
    }
  });

  // 加密状态
  const encryptionEnabled = ref(true);
  const lastSyncTime = ref(null);
  const preferencesVersion = ref('1.0.0');

  // 计算属性
  const encryptedPreferences = computed(() => {
    if (!encryptionEnabled.value) return preferences.value;

    try {
      const jsonString = JSON.stringify(preferences.value);
      const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('加密偏好设置失败:', error);
      return preferences.value;
    }
  });

  // 获取偏好设置（解密）
  const getDecryptedPreferences = () => {
    if (!encryptionEnabled.value) return preferences.value;

    try {
      // 如果已经是对象，直接返回
      if (typeof preferences.value === 'object' && preferences.value !== null) {
        return preferences.value;
      }

      // 如果是加密字符串，解密
      if (typeof preferences.value === 'string') {
        const decrypted = CryptoJS.AES.decrypt(preferences.value, ENCRYPTION_KEY);
        const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
        return JSON.parse(jsonString);
      }

      return preferences.value;
    } catch (error) {
      console.error('解密偏好设置失败:', error);
      return getDefaultPreferences();
    }
  };

  // 获取默认偏好设置
  const getDefaultPreferences = () => {
    return {
      ai: {
        preferredModels: {
          chat: 'gpt-4',
          analysis: 'claude-3-sonnet',
          translation: 'gpt-4',
          creative: 'gpt-4'
        },
        generationSettings: {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0,
          stopSequences: []
        },
        qualityBalance: {
          responseTime: 'balanced',
          complexityHandling: 'adaptive',
          languageDetection: true,
          autoCorrect: true,
          smartRouting: true
        },
        contentFilter: {
          enableNSFWFilter: true,
          enablePoliticsFilter: true,
          customBlockedWords: [],
          contentModeration: 'standard'
        },
        learningSettings: {
          enableLearning: true,
          learningRate: 0.1,
          personalizationLevel: 'medium',
          adaptiveResponses: true,
          contextMemory: true
        }
      },
      ui: {
        theme: {
          mode: 'auto',
          primaryColor: '#409EFF',
          secondaryColor: '#67C23A',
          accentColor: '#E6A23C',
          backgroundImage: null,
          customCSS: ''
        },
        layout: {
          sidebarPosition: 'left',
          sidebarWidth: 280,
          contentWidth: 'fixed',
          gridColumns: 12,
          responsive: true
        },
        typography: {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 14,
          lineHeight: 1.6,
          headingScale: 1.25,
          textAlign: 'left',
          letterSpacing: 0
        },
        animations: {
          enableAnimations: true,
          animationSpeed: 'normal',
          pageTransitions: true,
          hoverEffects: true,
          loadingAnimations: true,
          parallaxEffects: false
        },
        components: {
          modalBehavior: 'center',
          tooltipPosition: 'top',
          dropdownBehavior: 'click',
          scrollBehavior: 'smooth',
          focusIndicators: true
        }
      },
      privacy: {
        dataCollection: {
          allowAnalytics: true,
          allowCrashReports: true,
          allowPerformanceMonitoring: true,
          allowUsageStatistics: true,
          dataRetentionDays: 90
        },
        dataSharing: {
          shareWithThirdParties: false,
          shareAnonymizedData: true,
          marketingConsent: false,
          researchConsent: false
        },
        locationSettings: {
          allowLocationAccess: false,
          preciseLocation: false,
          deviceFingerprinting: false,
          ipAddressTracking: false
        },
        communication: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          marketingEmails: false,
          newsletter: false
        },
        security: {
          enableEncryption: true,
          twoFactorAuth: false,
          biometricAuth: false,
          sessionTimeout: 30,
          autoLogout: true
        }
      },
      content: {
        language: {
          primaryLanguage: 'zh-CN',
          secondaryLanguages: ['en-US'],
          autoDetectLanguage: true,
          translationService: 'google',
          localization: 'china'
        },
        contentFiltering: {
          contentRating: 'general',
          blockExplicitContent: true,
          blockViolence: false,
          blockPoliticalContent: false,
          customFilters: []
        },
        recommendations: {
          enableRecommendations: true,
          recommendationStrength: 'medium',
          contentTypes: ['articles', 'videos', 'podcasts'],
          collaborativeFiltering: true,
          contentBasedFiltering: true
        },
        media: {
          autoPlayVideos: false,
          videoQuality: 'auto',
          audioQuality: 'high',
          imageQuality: 'high',
          lazyLoading: true
        },
        search: {
          searchHistory: true,
          searchSuggestions: true,
          safeSearch: 'moderate',
          searchFilters: [],
          searchLanguage: 'zh-CN'
        }
      },
      performance: {
        caching: {
          enableBrowserCache: true,
          enableServiceWorker: true,
          cacheExpiration: 24,
          offlineSupport: true,
          prefetchResources: true
        },
        loading: {
          lazyLoading: true,
          progressiveLoading: true,
          resourceHints: true,
          compression: 'gzip',
          minification: true
        },
        memory: {
          memoryLimit: 512,
          garbageCollection: 'auto',
          cleanupInterval: 300,
          maxTabs: 10
        },
        network: {
          connectionType: 'auto',
          dataSaver: false,
          requestTimeout: 30,
          retryAttempts: 3,
          fallbackCDN: true
        },
        hardware: {
          enableGPU: true,
          webWorkers: true,
          webAssembly: true,
          canvasAcceleration: true,
          videoAcceleration: true
        }
      },
      accessibility: {
        visual: {
          highContrast: false,
          largeText: false,
          colorBlindMode: 'none',
          screenReader: false,
          reducedMotion: false,
          focusIndicators: true
        },
        hearing: {
          captions: false,
          transcripts: false,
          visualAlerts: false,
          audioDescriptions: false,
          signLanguage: 'none'
        },
        motor: {
          keyboardNavigation: true,
          voiceControl: false,
          switchAccess: false,
          eyeTracking: false,
          gestureControl: false
        },
        cognitive: {
          simplifiedInterface: false,
          extendedTime: false,
          stepByStep: false,
          reminders: true,
          errorPrevention: true
        },
        language: {
          dyslexiaFriendly: false,
          readingLevel: 'standard',
          textToSpeech: false,
          speechToText: false,
          languageSwitching: true
        }
      }
    };
  };

  // 获取偏好设置
  const getPreference = (path, defaultValue = null) => {
    try {
      const prefs = getDecryptedPreferences();
      const keys = path.split('.');
      let current = prefs;

      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return defaultValue;
        }
      }

      return current !== undefined ? current : defaultValue;
    } catch (error) {
      console.error('获取偏好设置失败:', error);
      return defaultValue;
    }
  };

  // 设置偏好设置
  const setPreference = (path, value) => {
    try {
      const prefs = getDecryptedPreferences();
      const keys = path.split('.');
      let current = prefs;

      // 导航到父级
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }

      // 设置值
      const lastKey = keys[keys.length - 1];
      current[lastKey] = value;

      // 更新存储
      preferences.value = prefs;

      // 保存到本地存储
      savePreferences();

      return true;
    } catch (error) {
      console.error('设置偏好设置失败:', error);
      return false;
    }
  };

  // 批量设置偏好设置
  const setPreferences = (updates) => {
    try {
      const prefs = getDecryptedPreferences();

      for (const [path, value] of Object.entries(updates)) {
        const keys = path.split('.');
        let current = prefs;

        // 导航到父级
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
          }
          current = current[key];
        }

        // 设置值
        const lastKey = keys[keys.length - 1];
        current[lastKey] = value;
      }

      // 更新存储
      preferences.value = prefs;

      // 保存到本地存储
      savePreferences();

      return true;
    } catch (error) {
      console.error('批量设置偏好设置失败:', error);
      return false;
    }
  };

  // 重置偏好设置
  const resetPreference = (path) => {
    try {
      const defaultPrefs = getDefaultPreferences();
      const keys = path.split('.');
      let current = defaultPrefs;

      // 导航到目标值
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return false;
        }
      }

      // 设置默认值
      return setPreference(path, current);
    } catch (error) {
      console.error('重置偏好设置失败:', error);
      return false;
    }
  };

  // 重置所有偏好设置
  const resetAllPreferences = () => {
    try {
      preferences.value = getDefaultPreferences();
      savePreferences();
      return true;
    } catch (error) {
      console.error('重置所有偏好设置失败:', error);
      return false;
    }
  };

  // 保存偏好设置到本地存储
  const savePreferences = async () => {
    try {
      const dataToSave = {
        preferences: encryptedPreferences.value,
        encryptionEnabled: encryptionEnabled.value,
        lastSyncTime: new Date().toISOString(),
        version: preferencesVersion.value
      };

      localStorage.setItem('userPreferences', JSON.stringify(dataToSave));
      lastSyncTime.value = new Date().toISOString();
    } catch (error) {
      console.error('保存偏好设置失败:', error);
    }
  };

  // 从本地存储加载偏好设置
  const loadPreferences = async () => {
    try {
      const saved = localStorage.getItem('userPreferences');
      if (saved) {
        const data = JSON.parse(saved);

        // 版本检查
        if (data.version && data.version !== preferencesVersion.value) {
          console.warn('偏好设置版本不匹配，使用默认设置');
          // 可以在这里添加迁移逻辑
        }

        preferences.value = data.preferences || getDefaultPreferences();
        encryptionEnabled.value = data.encryptionEnabled !== false;
        lastSyncTime.value = data.lastSyncTime || null;

        return true;
      }
      return false;
    } catch (error) {
      console.error('加载偏好设置失败:', error);
      preferences.value = getDefaultPreferences();
      return false;
    }
  };

  // 导出偏好设置
  const exportPreferences = () => {
    try {
      const prefs = getDecryptedPreferences();
      const exportData = {
        preferences: prefs,
        exportTime: new Date().toISOString(),
        version: preferencesVersion.value,
        metadata: {
          totalSettings: countTotalSettings(prefs),
          categories: Object.keys(prefs).length,
          encryptionEnabled: encryptionEnabled.value
        }
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出偏好设置失败:', error);
      return null;
    }
  };

  // 导入偏好设置
  const importPreferences = (jsonString, options = {}) => {
    try {
      const { merge = true, validate = true } = options;
      const importData = JSON.parse(jsonString);

      if (validate) {
        validatePreferences(importData.preferences);
      }

      if (merge) {
        // 合并设置
        const currentPrefs = getDecryptedPreferences();
        const mergedPrefs = deepMerge(currentPrefs, importData.preferences);
        preferences.value = mergedPrefs;
      } else {
        // 覆盖设置
        preferences.value = importData.preferences;
      }

      // 保存
      savePreferences();

      return {
        success: true,
        importedSettings: countTotalSettings(importData.preferences),
        merged: merge
      };
    } catch (error) {
      console.error('导入偏好设置失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // 验证偏好设置
  const validatePreferences = (prefs) => {
    if (!prefs || typeof prefs !== 'object') {
      throw new Error('偏好设置格式无效');
    }

    // 检查必需的顶级分类
    const requiredCategories = ['ai', 'ui', 'privacy', 'content', 'performance', 'accessibility'];
    for (const category of requiredCategories) {
      if (!(category in prefs)) {
        throw new Error(`缺少必需的分类: ${category}`);
      }
    }

    return true;
  };

  // 深度合并对象
  const deepMerge = (target, source) => {
    const result = { ...target };

    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  };

  // 计算设置总数
  const countTotalSettings = (obj) => {
    let count = 0;

    const countRecursive = (current) => {
      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          if (typeof current[key] === 'object' && current[key] !== null && !Array.isArray(current[key])) {
            countRecursive(current[key]);
          } else {
            count++;
          }
        }
      }
    };

    countRecursive(obj);
    return count;
  };

  // 获取偏好设置摘要
  const getPreferencesSummary = () => {
    const prefs = getDecryptedPreferences();

    return {
      totalSettings: countTotalSettings(prefs),
      categories: Object.keys(prefs).length,
      lastSyncTime: lastSyncTime.value,
      encryptionEnabled: encryptionEnabled.value,
      version: preferencesVersion.value,
      summary: {
        ai: {
          preferredChatModel: prefs.ai.preferredModels.chat,
          learningEnabled: prefs.ai.learningSettings.enableLearning
        },
        ui: {
          themeMode: prefs.ui.theme.mode,
          animationsEnabled: prefs.ui.animations.enableAnimations
        },
        privacy: {
          analyticsEnabled: prefs.privacy.dataCollection.allowAnalytics,
          encryptionEnabled: prefs.privacy.security.enableEncryption
        },
        performance: {
          cachingEnabled: prefs.performance.caching.enableBrowserCache,
          hardwareAcceleration: prefs.performance.hardware.enableGPU
        },
        accessibility: {
          highContrast: prefs.accessibility.visual.highContrast,
          screenReader: prefs.accessibility.visual.screenReader
        }
      }
    };
  };

  // 监听偏好设置变化
  const watchPreference = (path, callback) => {
    let previousValue = getPreference(path);

    // const unwatch = () => {
    //   // 清理逻辑
    // };

    // 简单的轮询机制（在实际项目中可以使用更高效的监听机制）
    const interval = setInterval(() => {
      const currentValue = getPreference(path);
      if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
        callback(currentValue, previousValue);
        previousValue = currentValue;
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  };

  // 初始化加载
  const init = async () => {
    const loaded = await loadPreferences();
    if (!loaded) {
      // 如果没有保存的偏好设置，使用默认值并保存
      preferences.value = getDefaultPreferences();
      await savePreferences();
    }
  };

  // 初始化
  init();

  return {
    // 状态
    preferences,
    encryptionEnabled,
    lastSyncTime,
    preferencesVersion,

    // 计算属性
    encryptedPreferences,

    // 方法
    getPreference,
    setPreference,
    setPreferences,
    resetPreference,
    resetAllPreferences,
    savePreferences,
    loadPreferences,
    exportPreferences,
    importPreferences,
    validatePreferences,
    getPreferencesSummary,
    watchPreference,
    getDecryptedPreferences
  };
});
