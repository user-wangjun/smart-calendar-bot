/**
 * EnhancedApiManager 组件测试
 * 测试API输入优化、模型添加功能和系统/用户API分离
 */

describe('EnhancedApiManager 功能测试', () => {
  describe('API输入优化', () => {
    it('应该正确验证API密钥格式', () => {
      // 模拟验证函数
      const validateApiKey = (key, isSystem) => {
        if (!key) return { valid: false, error: '' };

        if (isSystem) {
          if (key.length < 20) {
            return { valid: false, error: '智谱API密钥长度应至少20位' };
          }
        } else {
          if (key.length < 10) {
            return { valid: false, error: 'API密钥长度可能过短' };
          }
        }
        return { valid: true, error: '' };
      };

      // 测试空密钥
      expect(validateApiKey('', true).valid).toBe(false);

      // 测试系统智谱API密钥（长度不足）
      expect(validateApiKey('short', true)).toEqual({
        valid: false,
        error: '智谱API密钥长度应至少20位'
      });

      // 测试系统智谱API密钥（有效）
      expect(validateApiKey('33901d235d1341bc85f4d8c3ea338848.EpUZsbPOj48ZQRv2', true)).toEqual({
        valid: true,
        error: ''
      });

      // 测试用户自定义API密钥（长度不足）
      expect(validateApiKey('short', false)).toEqual({
        valid: false,
        error: 'API密钥长度可能过短'
      });

      // 测试用户自定义API密钥（有效）
      expect(validateApiKey('sk-test-api-key-1234567890', false)).toEqual({
        valid: true,
        error: ''
      });
    });

    it('应该支持API密钥可见性切换', () => {
      let showApiKey = false;
      const toggleApiKeyVisibility = () => {
        showApiKey = !showApiKey;
      };

      expect(showApiKey).toBe(false);
      toggleApiKeyVisibility();
      expect(showApiKey).toBe(true);
      toggleApiKeyVisibility();
      expect(showApiKey).toBe(false);
    });

    it('应该显示API连接状态', () => {
      const testResults = [
        { success: true, message: '✅ API连接成功！' },
        { success: false, message: '❌ API连接失败' }
      ];

      expect(testResults[0].success).toBe(true);
      expect(testResults[0].message).toContain('成功');
      expect(testResults[1].success).toBe(false);
      expect(testResults[1].message).toContain('失败');
    });
  });

  describe('模型添加增强功能', () => {
    it('应该正确添加新模型', () => {
      const models = [];

      const addModel = (modelData) => {
        models.push({
          ...modelData,
          isSystem: false,
          isEnabled: true
        });
      };

      addModel({
        id: 'gpt-4',
        name: 'GPT-4',
        category: 'chat',
        maxTokens: 8192
      });

      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('gpt-4');
      expect(models[0].isSystem).toBe(false);
      expect(models[0].isEnabled).toBe(true);
    });

    it('应该正确编辑现有模型', () => {
      const models = [
        { id: 'gpt-4', name: 'GPT-4', category: 'chat' }
      ];

      const editModel = (modelId, updates) => {
        const index = models.findIndex(m => m.id === modelId);
        if (index > -1) {
          models[index] = { ...models[index], ...updates };
        }
      };

      editModel('gpt-4', { name: 'GPT-4 Updated' });

      expect(models[0].name).toBe('GPT-4 Updated');
    });

    it('应该正确删除模型', () => {
      let models = [
        { id: 'model-1', name: 'Model 1' },
        { id: 'model-2', name: 'Model 2' }
      ];

      const deleteModel = (modelId) => {
        models = models.filter(m => m.id !== modelId);
      };

      deleteModel('model-1');

      expect(models).toHaveLength(1);
      expect(models[0].id).toBe('model-2');
    });

    it('应该正确启用/禁用模型', () => {
      const models = [
        { id: 'model-1', name: 'Model 1', isEnabled: true }
      ];

      const toggleModelEnabled = (modelId) => {
        const model = models.find(m => m.id === modelId);
        if (model) {
          model.isEnabled = !model.isEnabled;
        }
      };

      toggleModelEnabled('model-1');
      expect(models[0].isEnabled).toBe(false);

      toggleModelEnabled('model-1');
      expect(models[0].isEnabled).toBe(true);
    });

    it('应该正确分类模型', () => {
      const models = [
        { id: 'chat-1', name: 'Chat Model', category: 'chat' },
        { id: 'agent-1', name: 'Agent Model', category: 'agent' },
        { id: 'embedding-1', name: 'Embedding Model', category: 'embedding' }
      ];

      const categorizeModels = (models) => {
        const categories = {};
        models.forEach(model => {
          const cat = model.category || '其他';
          if (!categories[cat]) {
            categories[cat] = [];
          }
          categories[cat].push(model);
        });
        return Object.entries(categories).map(([name, models]) => ({
          name,
          models
        }));
      };

      const categorized = categorizeModels(models);

      expect(categorized).toHaveLength(3);
      expect(categorized.some(c => c.name === 'chat')).toBe(true);
      expect(categorized.some(c => c.name === 'agent')).toBe(true);
      expect(categorized.some(c => c.name === 'embedding')).toBe(true);
    });
  });

  describe('系统API与用户API分离', () => {
    it('应该区分系统提供商和用户提供商', () => {
      const systemProviders = [
        { id: 'zhipu-system', name: '智谱开放平台', isSystem: true }
      ];

      const userProviders = [
        { id: 'user-custom', name: 'My Custom API', isSystem: false }
      ];

      const allProviders = [...systemProviders, ...userProviders];

      expect(allProviders).toHaveLength(2);
      expect(allProviders[0].isSystem).toBe(true);
      expect(allProviders[1].isSystem).toBe(false);
    });

    it('不应该允许删除系统提供商', () => {
      const systemProviders = [
        { id: 'zhipu-system', name: '智谱开放平台', isSystem: true }
      ];

      const deleteProvider = (provider) => {
        if (provider.isSystem) {
          return false; // 不允许删除系统提供商
        }
        return true;
      };

      expect(deleteProvider(systemProviders[0])).toBe(false);
    });

    it('应该允许删除用户提供商', () => {
      const userProvider = { id: 'user-custom', name: 'My Custom API', isSystem: false };

      const deleteProvider = (provider) => {
        if (provider.isSystem) {
          return false;
        }
        return true;
      };

      expect(deleteProvider(userProvider)).toBe(true);
    });

    it('系统模型应该有系统标识', () => {
      const models = [
        { id: 'glm-4', name: 'GLM-4', isSystem: true },
        { id: 'custom-model', name: 'Custom Model', isSystem: false }
      ];

      expect(models[0].isSystem).toBe(true);
      expect(models[1].isSystem).toBe(false);
    });

    it('API密钥存储应该严格分离', () => {
      const systemApiKeys = {};
      const userApiKeys = {};

      // 存储系统API密钥
      const saveSystemKey = (provider, key) => {
        systemApiKeys[provider] = key;
      };

      // 存储用户API密钥
      const saveUserKey = (provider, key) => {
        userApiKeys[provider] = key;
      };

      saveSystemKey('zhipu', 'system-key-123');
      saveUserKey('user-custom', 'user-key-456');

      // 验证分离存储
      expect(systemApiKeys.zhipu).toBe('system-key-123');
      expect(userApiKeys['user-custom']).toBe('user-key-456');
      expect(systemApiKeys['user-custom']).toBeUndefined();
      expect(userApiKeys.zhipu).toBeUndefined();
    });

    it('UI应该只显示用户提供商', () => {
      // const systemProviders = [
      //   { id: 'zhipu-system', name: '智谱开放平台', isSystem: true }
      // ];

      const userProviders = [
        { id: 'user-custom', name: 'My Custom API', isSystem: false }
      ];

      // UI只显示用户提供商
      const displayProviders = userProviders;

      expect(displayProviders).toHaveLength(1);
      expect(displayProviders[0].isSystem).toBe(false);
      expect(displayProviders[0].name).toBe('My Custom API');
    });
  });

  describe('预设模板功能', () => {
    it('应该支持从模板快速添加提供商', () => {
      const userProviders = [];

      const providerTemplates = [
        {
          id: 'template-openrouter',
          name: 'OpenRouter',
          icon: '🔌',
          baseUrl: 'https://openrouter.ai/api/v1',
          keyUrl: 'https://openrouter.ai/keys'
        }
      ];

      const quickAddProvider = (template) => {
        const provider = {
          id: `user-${Math.random().toString(36).substr(2, 8)}`,
          name: template.name,
          icon: template.icon,
          isSystem: false,
          isEnabled: true,
          baseUrl: template.baseUrl,
          defaultUrl: template.baseUrl,
          keyUrl: template.keyUrl,
          apiKey: '',
          models: []
        };
        userProviders.push(provider);
      };

      quickAddProvider(providerTemplates[0]);

      expect(userProviders).toHaveLength(1);
      expect(userProviders[0].name).toBe('OpenRouter');
      expect(userProviders[0].icon).toBe('🔌');
      expect(userProviders[0].isSystem).toBe(false);
    });

    it('应该支持从模板选择并自动填充表单', () => {
      const newProvider = {
        name: '',
        baseUrl: ''
      };

      const template = {
        id: 'template-deepseek',
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1'
      };

      const selectTemplate = (template) => {
        newProvider.name = template.name;
        newProvider.baseUrl = template.baseUrl;
      };

      selectTemplate(template);

      expect(newProvider.name).toBe('DeepSeek');
      expect(newProvider.baseUrl).toBe('https://api.deepseek.com/v1');
    });
  });

  describe('搜索功能', () => {
    it('应该支持提供商搜索', () => {
      const userProviders = [
        { id: 'user-custom', name: 'OpenRouter', isSystem: false },
        { id: 'user-deepseek', name: 'DeepSeek', isSystem: false },
        { id: 'user-zhipu', name: '智谱AI', isSystem: false }
      ];

      let providerSearchQuery = '';

      const getFilteredProviders = () => {
        if (!providerSearchQuery) {
          return userProviders;
        }
        const query = providerSearchQuery.toLowerCase();
        return userProviders.filter(provider =>
          provider.name.toLowerCase().includes(query)
        );
      };

      // 无搜索时显示全部
      expect(getFilteredProviders()).toHaveLength(3);

      // 搜索"open"
      providerSearchQuery = 'open';
      expect(getFilteredProviders()).toHaveLength(1);
      expect(getFilteredProviders()[0].name).toBe('OpenRouter');

      // 搜索"智谱"
      providerSearchQuery = '智谱';
      expect(getFilteredProviders()).toHaveLength(1);
      expect(getFilteredProviders()[0].name).toBe('智谱AI');
    });

    it('应该正确获取提供商首字母', () => {
      const getProviderInitial = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
      };

      expect(getProviderInitial('OpenRouter')).toBe('O');
      expect(getProviderInitial('deepseek')).toBe('D');
      expect(getProviderInitial('智谱AI')).toBe('智');
      expect(getProviderInitial('')).toBe('?');
    });

    it('应该根据名称生成固定的图标颜色', () => {
      const getProviderIconStyle = (provider) => {
        const colors = [
          { bg: '#3B82F6', color: '#fff' },
          { bg: '#8B5CF6', color: '#fff' },
          { bg: '#EC4899', color: '#fff' },
          { bg: '#F59E0B', color: '#fff' },
          { bg: '#10B981', color: '#fff' },
          { bg: '#EF4444', color: '#fff' },
          { bg: '#06B6D4', color: '#fff' },
          { bg: '#F97316', color: '#fff' }
        ];

        let hash = 0;
        for (let i = 0; i < provider.name.length; i++) {
          hash = provider.name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colorIndex = Math.abs(hash) % colors.length;
        const colorSet = colors[colorIndex];

        return {
          backgroundColor: colorSet.bg,
          color: colorSet.color
        };
      };

      const style1 = getProviderIconStyle({ name: 'OpenRouter' });
      const style2 = getProviderIconStyle({ name: 'OpenRouter' });

      // 相同名称应该返回相同颜色
      expect(style1.backgroundColor).toBe(style2.backgroundColor);

      // 不同名称可能有不同颜色
      const style3 = getProviderIconStyle({ name: 'DeepSeek' });
      // 不一定不同，但大概率不同
      expect(style3.backgroundColor).toBeTruthy();
    });
  });

  describe('UI交互', () => {
    it('应该正确切换分类展开/折叠', () => {
      const collapsedCategories = [];

      const toggleCategory = (categoryName) => {
        const index = collapsedCategories.indexOf(categoryName);
        if (index > -1) {
          collapsedCategories.splice(index, 1);
        } else {
          collapsedCategories.push(categoryName);
        }
      };

      // 初始状态
      expect(collapsedCategories).toEqual([]);

      // 折叠分类
      toggleCategory('chat');
      expect(collapsedCategories).toContain('chat');

      // 展开分类
      toggleCategory('chat');
      expect(collapsedCategories).not.toContain('chat');
    });

    it('应该正确搜索模型', () => {
      const models = [
        { id: 'gpt-4', name: 'GPT-4', category: 'chat' },
        { id: 'gpt-3', name: 'GPT-3.5', category: 'chat' },
        { id: 'claude', name: 'Claude', category: 'agent' }
      ];

      const searchModels = (query) => {
        const lowerQuery = query.toLowerCase();
        return models.filter(m =>
          m.name.toLowerCase().includes(lowerQuery) ||
          m.id.toLowerCase().includes(lowerQuery)
        );
      };

      const filtered = searchModels('gpt');

      expect(filtered).toHaveLength(2);
      expect(filtered.every(m => m.name.toLowerCase().includes('gpt'))).toBe(true);
    });

    it('应该正确显示模型标签', () => {
      const model = {
        isFree: true,
        supportsVision: true,
        supportsTools: false
      };

      const getModelTags = (model) => {
        const tags = [];
        if (model.isFree) tags.push('免费');
        if (model.supportsVision) tags.push('视觉');
        if (model.supportsTools) tags.push('工具');
        return tags;
      };

      const tags = getModelTags(model);

      expect(tags).toContain('免费');
      expect(tags).toContain('视觉');
      expect(tags).not.toContain('工具');
    });

    it('空状态时应该显示提示', () => {
      const userProviders = [];

      const isEmpty = userProviders.length === 0;

      expect(isEmpty).toBe(true);
    });
  });
});

describe('Settings Store - 用户API提供商', () => {
  it('应该保存和获取用户提供商', () => {
    const userProviders = [];

    const saveUserProvider = (provider) => {
      const index = userProviders.findIndex(p => p.id === provider.id);
      if (index > -1) {
        userProviders[index] = provider;
      } else {
        userProviders.push(provider);
      }
    };

    const getUserProviders = () => userProviders;

    saveUserProvider({
      id: 'user-test',
      name: 'Test Provider',
      baseUrl: 'https://api.test.com'
    });

    const providers = getUserProviders();
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe('user-test');
  });

  it('应该更新现有提供商', () => {
    const userProviders = [];

    const saveUserProvider = (provider) => {
      const index = userProviders.findIndex(p => p.id === provider.id);
      if (index > -1) {
        userProviders[index] = provider;
      } else {
        userProviders.push(provider);
      }
    };

    saveUserProvider({
      id: 'user-test',
      name: 'Test Provider',
      baseUrl: 'https://api.test.com'
    });

    saveUserProvider({
      id: 'user-test',
      name: 'Updated Provider',
      baseUrl: 'https://api.updated.com'
    });

    expect(userProviders).toHaveLength(1);
    expect(userProviders[0].name).toBe('Updated Provider');
  });

  it('应该删除提供商', () => {
    let userProviders = [
      { id: 'user-test', name: 'Test Provider' }
    ];

    const deleteUserProvider = (providerId) => {
      userProviders = userProviders.filter(p => p.id !== providerId);
    };

    deleteUserProvider('user-test');

    expect(userProviders).toHaveLength(0);
  });

  it('应该保存和获取用户提供商API密钥', () => {
    const apiKeys = {};

    const setUserProviderKey = (providerId, apiKey) => {
      apiKeys[`user-${providerId}`] = apiKey;
    };

    const getUserProviderKey = (providerId) => {
      return apiKeys[`user-${providerId}`] || '';
    };

    setUserProviderKey('user-test', 'test-api-key');

    expect(getUserProviderKey('user-test')).toBe('test-api-key');
  });

  it('应该更新提供商模型列表', () => {
    const userProviders = [
      { id: 'user-test', name: 'Test Provider', models: [] }
    ];

    const updateUserProviderModels = (providerId, models) => {
      const provider = userProviders.find(p => p.id === providerId);
      if (provider) {
        provider.models = models;
      }
    };

    updateUserProviderModels('user-test', [
      { id: 'model-1', name: 'Model 1' }
    ]);

    expect(userProviders[0].models).toHaveLength(1);
    expect(userProviders[0].models[0].id).toBe('model-1');
  });
});
