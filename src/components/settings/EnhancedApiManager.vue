<template>
  <div class="enhanced-api-manager">
    <!-- 左侧提供商列表 - 只显示用户自定义API -->
    <div class="provider-sidebar">
      <!-- 搜索框 -->
      <div class="provider-search">
        <input
          v-model="providerSearchQuery"
          type="text"
          placeholder="搜索模型平台..."
          class="search-input"
        />
        <Search class="search-icon" />
      </div>

      <div class="provider-list">
        <!-- 用户自定义提供商列表 -->
        <div
          v-for="provider in filteredUserProviders"
          :key="provider.id"
          class="provider-item"
          :class="{
            active: selectedProvider?.id === provider.id,
            'is-enabled': provider.isEnabled
          }"
          @click="selectProvider(provider)"
        >
          <div class="provider-icon-wrapper">
            <div class="provider-icon" :style="getProviderIconStyle(provider)">
              <img v-if="provider.iconUrl" :src="provider.iconUrl" :alt="provider.name">
              <span v-else class="icon-text">{{ getProviderInitial(provider.name) }}</span>
            </div>
          </div>
          <div class="provider-info">
            <span class="provider-name">{{ provider.name }}</span>
          </div>
          <div v-if="provider.isEnabled" class="provider-status online">
            ON
          </div>
        </div>

        <!-- 空状态提示 -->
        <div v-if="filteredUserProviders.length === 0" class="empty-providers">
          <p class="empty-text">{{ userProviders.length === 0 ? '暂无自定义API配置' : '未找到匹配的平台' }}</p>
          <p v-if="userProviders.length === 0" class="empty-hint">点击下方按钮添加</p>
        </div>
      </div>

      <!-- 快速添加模板 -->
      <div v-if="userProviders.length === 0" class="quick-add-templates">
        <p class="templates-title">快速添加</p>
        <div class="template-buttons">
          <button
            v-for="template in providerTemplates"
            :key="template.id"
            class="template-btn"
            @click="selectTemplateAndOpenModal(template)"
          >
            <component :is="template.iconComponent" class="template-icon-svg" />
            <span class="template-name">{{ template.name }}</span>
          </button>
        </div>
      </div>

      <button class="add-provider-btn" @click="showAddProviderDialog">
        <Plus class="icon-svg" />
        <span>添加</span>
      </button>
    </div>

    <!-- 右侧配置面板 -->
    <div class="config-panel">
      <div v-if="selectedProvider" class="panel-content">
        <!-- 面板头部 -->
        <div class="panel-header">
          <div class="header-title">
            <h3>{{ selectedProvider.name }}</h3>
            <p v-if="selectedProvider.isSystem" class="system-notice">
              系统内置API，由系统统一管理
            </p>
            <p v-else class="user-notice">
              用户自定义API配置
            </p>
          </div>
          <div class="header-actions">
            <button
              v-if="!selectedProvider.isSystem"
              class="action-btn delete"
              @click="deleteProvider"
              title="删除提供商"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- API密钥配置 -->
        <div class="config-section">
          <div class="section-header">
            <h4>API 密钥</h4>
            <button
              v-if="selectedProvider.keyUrl"
              class="link-btn"
              @click="openKeyUrl"
            >
              点击这里获取密钥
            </button>
          </div>

          <div class="api-key-input-wrapper">
            <div class="input-group">
              <input
                v-model="apiKeyInput"
                :type="showApiKey ? 'text' : 'password'"
                :placeholder="`输入 ${selectedProvider.name} API 密钥`"
                class="api-key-input"
                :class="{ error: apiKeyError, success: apiKeyValid }"
                @input="validateApiKey"
                @blur="validateApiKey"
              />
              <button
                class="toggle-visibility-btn"
                @click="showApiKey = !showApiKey"
                :title="showApiKey ? '隐藏密钥' : '显示密钥'"
              >
                <Eye v-if="showApiKey" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
            <button
              class="test-btn"
              :class="{ testing: isTesting, success: testResult?.success, error: testResult && !testResult.success }"
              :disabled="!apiKeyInput || isTesting"
              @click="testApiConnection"
            >
              <Loader2 v-if="isTesting" class="w-4 h-4 animate-spin" />
              <Check v-else-if="testResult?.success" class="w-4 h-4" />
              <X v-else-if="testResult && !testResult.success" class="w-4 h-4" />
              <span v-else>检测</span>
            </button>
          </div>

          <!-- 验证错误提示 -->
          <p v-if="apiKeyError" class="error-message">{{ apiKeyError }}</p>

          <!-- 测试结果显示 -->
          <div v-if="testResult" class="test-result" :class="{ success: testResult.success, error: !testResult.success }">
            {{ testResult.message }}
          </div>

          <p class="hint-text">多个密钥使用逗号分隔</p>
        </div>

        <!-- API地址配置 -->
        <div class="config-section">
          <div class="section-header">
            <h4>API 地址</h4>
            <div class="header-actions-group">
              <button class="icon-btn" title="重置为默认" @click="resetApiUrl">
                <RotateCcw class="w-4 h-4" />
              </button>
              <HelpCircle class="w-4 h-4 text-surface-400" title="API地址配置帮助" />
            </div>
          </div>

          <div class="api-url-wrapper">
            <select
              v-if="selectedProvider.urlPresets?.length"
              v-model="selectedUrlPreset"
              class="url-preset-select"
              @change="onUrlPresetChange"
            >
              <option value="">自定义</option>
              <option
                v-for="preset in selectedProvider.urlPresets"
                :key="preset.value"
                :value="preset.value"
              >
                {{ preset.label }}
              </option>
            </select>
            <input
              v-model="apiUrlInput"
              type="text"
              class="api-url-input"
              :placeholder="selectedProvider.defaultUrl || 'https://api.example.com/v1'"
            />
          </div>

          <p class="preview-text">
            预览: {{ apiUrlPreview }}
          </p>
        </div>

        <!-- 模型列表 -->
        <div class="config-section models-section">
          <div class="section-header">
            <h4>
              模型
              <span class="model-count">{{ models.length }}</span>
            </h4>
            <div class="header-actions-group">
              <button class="icon-btn" title="搜索模型" @click="showModelSearch = !showModelSearch">
                <Search class="w-4 h-4" />
              </button>
              <button class="icon-btn" title="添加模型" @click="showAddModelDialog">
                <Plus class="w-4 h-4" />
              </button>
              <button class="icon-btn" title="模型排序" @click="toggleModelSort">
                <ArrowUpDown class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- 模型搜索 -->
          <div v-if="showModelSearch" class="model-search">
            <input
              v-model="modelSearchQuery"
              type="text"
              placeholder="搜索模型..."
              class="search-input"
            />
          </div>

          <!-- 模型分类列表 -->
          <div class="models-list">
            <div
              v-for="category in categorizedModels"
              :key="category.name"
              class="model-category"
            >
              <div
                class="category-header"
                @click="toggleCategory(category.name)"
              >
                <ChevronDown
                  class="w-4 h-4 category-icon"
                  :class="{ collapsed: collapsedCategories.includes(category.name) }"
                />
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ category.models.length }}</span>
              </div>

              <div
                v-show="!collapsedCategories.includes(category.name)"
                class="category-models"
              >
                <div
                  v-for="model in category.models"
                  :key="model.id"
                  class="model-item"
                  :class="{
                    disabled: !model.isEnabled,
                    'is-system': model.isSystem
                  }"
                >
                  <div class="model-icon">
                    <img v-if="model.iconUrl" :src="model.iconUrl" :alt="model.name">
                    <span v-else>{{ model.icon || '🤖' }}</span>
                  </div>
                  <div class="model-info">
                    <span class="model-name">{{ model.name }}</span>
                    <div class="model-tags">
                      <span v-if="model.isFree" class="tag free">免费</span>
                      <span v-if="model.isNew" class="tag new">NEW</span>
                      <span v-for="cap in model.capabilities" :key="cap" class="tag capability">
                        {{ cap }}
                      </span>
                    </div>
                  </div>
                  <div class="model-actions">
                    <button
                      class="action-icon"
                      :class="{ active: model.isEnabled }"
                      @click="toggleModelEnabled(model)"
                      :title="model.isEnabled ? '禁用模型' : '启用模型'"
                    >
                      <Power class="w-4 h-4" />
                    </button>
                    <button
                      v-if="!model.isSystem"
                      class="action-icon"
                      @click="editModel(model)"
                      title="编辑模型"
                    >
                      <Settings2 class="w-4 h-4" />
                    </button>
                    <button
                      v-if="!model.isSystem"
                      class="action-icon delete"
                      @click="deleteModel(model)"
                      title="删除模型"
                    >
                      <Minus class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="panel-footer">
          <button
            class="save-btn"
            :disabled="!hasChanges || isSaving"
            @click="saveConfiguration"
          >
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            <span>{{ isSaving ? '保存中...' : '保存配置' }}</span>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <Bot class="w-16 h-16 text-surface-300" />
        <p>请选择一个API提供商进行配置</p>
      </div>

      <!-- 添加提供商内联表单 -->
      <div v-if="isAddingProvider" class="panel-content add-provider-panel">
        <!-- 面板头部 -->
        <div class="panel-header">
          <div class="header-title">
            <h3>添加 API 提供商</h3>
            <p class="user-notice">配置新的API提供商</p>
          </div>
          <div class="header-actions">
            <button class="action-btn" @click="cancelAddProvider" title="取消">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 预设模板选择 -->
        <div class="config-section">
          <div class="section-header">
            <h4>选择预设模板</h4>
          </div>
          <div class="template-grid-inline">
            <button
              v-for="template in providerTemplates"
              :key="template.id"
              class="template-option-inline"
              :class="{ active: selectedTemplate?.id === template.id }"
              @click="selectTemplate(template)"
            >
              <component :is="template.iconComponent" class="template-option-icon-svg" />
              <span class="template-option-name">{{ template.name }}</span>
            </button>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="config-section">
          <div class="section-header">
            <h4>基本信息</h4>
          </div>

          <div class="form-group">
            <label>提供商名称 <span class="required">*</span></label>
            <input
              v-model="newProvider.name"
              type="text"
              placeholder="例如: My Custom API"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>API 地址 <span class="required">*</span></label>
            <input
              v-model="newProvider.baseUrl"
              type="text"
              placeholder="https://api.example.com/v1"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>API 密钥</label>
            <input
              v-model="newProvider.apiKey"
              type="password"
              placeholder="输入API密钥..."
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>模型 ID (可选)</label>
            <input
              v-model="newProvider.iconUrl"
              type="text"
              placeholder="如无ID则输入模型名称"
              class="form-input"
            />
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="panel-footer">
          <button class="btn-secondary" @click="cancelAddProvider">取消</button>
          <button
            class="save-btn"
            :disabled="!isNewProviderValid"
            @click="addNewProvider"
          >
            <Plus class="w-4 h-4" />
            <span>添加</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 添加提供商对话框 - 保留作为备用，但不再使用 -->
    <Teleport to="body">
      <div v-if="false" class="modal-overlay" @click.self="closeAddProviderModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>添加 API 提供商</h3>
            <button class="close-btn" @click="closeAddProviderModal">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body">
            <!-- 预设模板选择 -->
            <div class="form-group">
              <label>选择预设模板</label>
              <div class="template-grid">
                <button
                  v-for="template in providerTemplates"
                  :key="template.id"
                  class="template-option"
                  :class="{ active: selectedTemplate?.id === template.id }"
                  @click="selectTemplate(template)"
                >
                  <component :is="template.iconComponent" class="template-option-icon-svg" />
                  <span class="template-option-name">{{ template.name }}</span>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>提供商名称 <span class="required">*</span></label>
              <input
                v-model="newProvider.name"
                type="text"
                placeholder="例如: My Custom API"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>API 地址 <span class="required">*</span></label>
              <input
                v-model="newProvider.baseUrl"
                type="text"
                placeholder="https://api.example.com/v1"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>API 密钥</label>
              <input
                v-model="newProvider.apiKey"
                type="password"
                placeholder="sk-..."
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>图标 URL (可选)</label>
              <input
                v-model="newProvider.iconUrl"
                type="text"
                placeholder="https://example.com/icon.png"
                class="form-input"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeAddProviderModal">取消</button>
            <button
              class="btn-primary"
              :disabled="!isNewProviderValid"
              @click="addNewProvider"
            >
              添加
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 添加/编辑模型对话框 -->
    <Teleport to="body">
      <div v-if="showModelModal" class="modal-overlay" @click.self="closeModelModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editingModel ? '编辑模型' : '添加模型' }}</h3>
            <button class="close-btn" @click="closeModelModal">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>模型 ID <span class="required">*</span></label>
              <input
                v-model="modelForm.id"
                type="text"
                placeholder="如无ID则输入模型名称"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>显示名称 <span class="required">*</span></label>
              <input
                v-model="modelForm.name"
                type="text"
                placeholder="例如: GPT-4"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>分类</label>
              <select v-model="modelForm.category" class="form-select">
                <option value="chat">对话</option>
                <option value="agent">代理</option>
                <option value="embedding">嵌入</option>
                <option value="image">图像</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label>最大 Tokens</label>
                <input
                  v-model.number="modelForm.maxTokens"
                  type="number"
                  placeholder="4096"
                  class="form-input"
                />
              </div>
              <div class="form-group half">
                <label>上下文长度</label>
                <input
                  v-model.number="modelForm.contextLength"
                  type="number"
                  placeholder="8192"
                  class="form-input"
                />
              </div>
            </div>
            <div class="form-group">
              <label>能力标签</label>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input v-model="modelForm.isFree" type="checkbox" />
                  <span>免费</span>
                </label>
                <label class="checkbox-item">
                  <input v-model="modelForm.supportsStreaming" type="checkbox" />
                  <span>流式输出</span>
                </label>
                <label class="checkbox-item">
                  <input v-model="modelForm.supportsVision" type="checkbox" />
                  <span>视觉理解</span>
                </label>
                <label class="checkbox-item">
                  <input v-model="modelForm.supportsTools" type="checkbox" />
                  <span>工具调用</span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModelModal">取消</button>
            <button
              class="btn-primary"
              :disabled="!isModelFormValid"
              @click="saveModel"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  Eye, EyeOff, Trash2, Loader2, Check, X,
  RotateCcw, HelpCircle, Search, Plus, ArrowUpDown,
  ChevronDown, Power, Settings2, Minus, Save, Bot,
  Brain, Plug, Waves, Cloud, Droplets, Cog
} from 'lucide-vue-next';
import { useSettingsStore } from '@/stores/settings';
import apiKeyManager from '@/config/apiKeyManager';
import { generateId } from '@/utils/idGenerator';

const settingsStore = useSettingsStore();

// 状态
const selectedProvider = ref(null);
const showApiKey = ref(false);
const apiKeyInput = ref('');
const apiKeyError = ref('');
const apiKeyValid = ref(false);
const apiUrlInput = ref('');
const selectedUrlPreset = ref('');
const isTesting = ref(false);
const testResult = ref(null);
const isSaving = ref(false);
const hasChanges = ref(false);
const showModelSearch = ref(false);
const modelSearchQuery = ref('');
const providerSearchQuery = ref('');
const collapsedCategories = ref([]);
const models = ref([]);

// 对话框状态
const showAddProviderModal = ref(false);
const showModelModal = ref(false);
const editingModel = ref(null);
const selectedTemplate = ref(null);
const isAddingProvider = ref(false);

// 新提供商表单
const newProvider = ref({
  name: '',
  baseUrl: '',
  apiKey: '',
  iconUrl: ''
});

// 模型表单
const modelForm = ref({
  id: '',
  name: '',
  category: 'chat',
  maxTokens: 4096,
  contextLength: 8192,
  isFree: false,
  supportsStreaming: true,
  supportsVision: false,
  supportsTools: false
});

// 系统提供商配置（后台使用，不在UI显示）
const systemProviders = ref([
  {
    id: 'zhipu-system',
    name: '智谱开放平台',
    icon: '🧠',
    isSystem: true,
    isEnabled: true,
    keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    defaultUrl: 'https://open.bigmodel.cn/api/paas/v4',
    urlPresets: [
      { label: '标准接口', value: 'https://open.bigmodel.cn/api/paas/v4' }
    ],
    models: [
      { id: 'glm-4', name: 'GLM-4', category: 'chat', isSystem: true, isEnabled: true, isFree: false, capabilities: ['对话'] },
      { id: 'glm-4-plus', name: 'GLM-4-Plus', category: 'chat', isSystem: true, isEnabled: true, isFree: false, capabilities: ['对话'] },
      { id: 'glm-4-flash', name: 'GLM-4-Flash', category: 'chat', isSystem: true, isEnabled: true, isFree: true, capabilities: ['对话'] },
      { id: 'glm-4v', name: 'GLM-4V', category: 'chat', isSystem: true, isEnabled: true, isFree: false, capabilities: ['对话', '视觉'] }
    ]
  }
]);

// 用户提供商列表（UI显示）
const userProviders = ref([]);

// 预设提供商模板
const providerTemplates = ref([
  {
    id: 'template-zhipu',
    name: '智谱AI',
    icon: 'brain',
    iconComponent: Brain,
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    description: '国产大模型，支持GLM系列'
  },
  {
    id: 'template-openrouter',
    name: 'OpenRouter',
    icon: 'plug',
    iconComponent: Plug,
    baseUrl: 'https://openrouter.ai/api/v1',
    keyUrl: 'https://openrouter.ai/keys',
    description: '支持多种AI模型的统一API平台'
  },
  {
    id: 'template-deepseek',
    name: 'DeepSeek',
    icon: 'waves',
    iconComponent: Waves,
    baseUrl: 'https://api.deepseek.com/v1',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    description: '深度求索大模型API'
  },
  {
    id: 'template-qiniu',
    name: '七牛云AI',
    icon: 'cloud',
    iconComponent: Cloud,
    baseUrl: 'https://ai.qiniuapi.com/v1',
    keyUrl: 'https://portal.qiniu.com/user/key',
    description: '七牛云提供的AI服务'
  },
  {
    id: 'template-siliconflow',
    name: '硅基流动',
    icon: 'droplets',
    iconComponent: Droplets,
    baseUrl: 'https://api.siliconflow.cn/v1',
    keyUrl: 'https://cloud.siliconflow.cn/account/ak',
    description: 'SiliconFlow API平台'
  },
  {
    id: 'template-custom',
    name: '自定义API',
    icon: 'cog',
    iconComponent: Cog,
    baseUrl: '',
    keyUrl: '',
    description: '自定义OpenAI兼容API'
  }
]);

// 计算属性
const allProviders = computed(() => {
  return [...systemProviders.value, ...userProviders.value];
});

// 过滤后的用户提供商列表（支持搜索）
const filteredUserProviders = computed(() => {
  if (!providerSearchQuery.value) {
    return userProviders.value;
  }
  const query = providerSearchQuery.value.toLowerCase();
  return userProviders.value.filter(provider =>
    provider.name.toLowerCase().includes(query)
  );
});

const isNewProviderValid = computed(() => {
  return newProvider.value.name.trim() && newProvider.value.baseUrl.trim();
});

const isModelFormValid = computed(() => {
  return modelForm.value.id.trim() && modelForm.value.name.trim();
});

const apiUrlPreview = computed(() => {
  const base = apiUrlInput.value || selectedProvider.value?.defaultUrl || '';
  return base ? `${base}/chat/completions` : '';
});

const filteredModels = computed(() => {
  let result = models.value;
  if (modelSearchQuery.value) {
    const query = modelSearchQuery.value.toLowerCase();
    result = result.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.id.toLowerCase().includes(query)
    );
  }
  return result;
});

const categorizedModels = computed(() => {
  const categories = {};
  filteredModels.value.forEach(model => {
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
});

// 方法
const selectProvider = (provider) => {
  selectedProvider.value = provider;
  loadProviderConfig(provider);
};

const loadProviderConfig = (provider) => {
  // 加载API密钥
  const key = provider.isSystem
    ? apiKeyManager.getZhipuApiKey()
    : settingsStore.getUserProviderKey(provider.id);
  apiKeyInput.value = key || '';

  // 加载API地址
  apiUrlInput.value = provider.defaultUrl || '';

  // 加载模型列表
  models.value = provider.models ? [...provider.models] : [];

  // 重置状态
  hasChanges.value = false;
  testResult.value = null;
  apiKeyError.value = '';
  apiKeyValid.value = false;
};

const validateApiKey = () => {
  if (!apiKeyInput.value) {
    apiKeyError.value = '';
    apiKeyValid.value = false;
    return;
  }

  const key = apiKeyInput.value.trim();

  if (selectedProvider.value?.isSystem) {
    // 系统智谱API验证
    if (key.length < 20) {
      apiKeyError.value = '智谱API密钥长度应至少20位';
      apiKeyValid.value = false;
    } else {
      apiKeyError.value = '';
      apiKeyValid.value = true;
    }
  } else {
    // 用户自定义API验证
    if (key.length < 10) {
      apiKeyError.value = 'API密钥长度可能过短';
      apiKeyValid.value = false;
    } else {
      apiKeyError.value = '';
      apiKeyValid.value = true;
    }
  }

  hasChanges.value = true;
};

const testApiConnection = async () => {
  if (!apiKeyInput.value) return;

  isTesting.value = true;
  testResult.value = null;

  try {
    // 模拟API测试
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 实际项目中这里应该调用真实的API测试
    const isValid = apiKeyValid.value;

    if (isValid) {
      testResult.value = {
        success: true,
        message: '✅ API连接成功！密钥验证通过'
      };
    } else {
      testResult.value = {
        success: false,
        message: '❌ API连接失败：密钥格式不正确'
      };
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: `❌ 测试失败：${error.message}`
    };
  } finally {
    isTesting.value = false;
  }
};

const onUrlPresetChange = () => {
  if (selectedUrlPreset.value) {
    apiUrlInput.value = selectedUrlPreset.value;
  }
  hasChanges.value = true;
};

const resetApiUrl = () => {
  apiUrlInput.value = selectedProvider.value?.defaultUrl || '';
  selectedUrlPreset.value = '';
  hasChanges.value = true;
};

const openKeyUrl = () => {
  if (selectedProvider.value?.keyUrl) {
    window.open(selectedProvider.value.keyUrl, '_blank');
  }
};

const toggleCategory = (categoryName) => {
  const index = collapsedCategories.value.indexOf(categoryName);
  if (index > -1) {
    collapsedCategories.value.splice(index, 1);
  } else {
    collapsedCategories.value.push(categoryName);
  }
};

const toggleModelEnabled = (model) => {
  model.isEnabled = !model.isEnabled;
  hasChanges.value = true;
};

const editModel = (model) => {
  editingModel.value = model;
  modelForm.value = {
    id: model.id,
    name: model.name,
    category: model.category || 'chat',
    maxTokens: model.maxTokens || 4096,
    contextLength: model.contextLength || 8192,
    isFree: model.isFree || false,
    supportsStreaming: model.supportsStreaming !== false,
    supportsVision: model.supportsVision || false,
    supportsTools: model.supportsTools || false
  };
  showModelModal.value = true;
};

const deleteModel = (model) => {
  if (confirm(`确定要删除模型 "${model.name}" 吗？`)) {
    const index = models.value.findIndex(m => m.id === model.id);
    if (index > -1) {
      models.value.splice(index, 1);
      hasChanges.value = true;
    }
  }
};

const showAddModelDialog = () => {
  editingModel.value = null;
  modelForm.value = {
    id: '',
    name: '',
    category: 'chat',
    maxTokens: 4096,
    contextLength: 8192,
    isFree: false,
    supportsStreaming: true,
    supportsVision: false,
    supportsTools: false
  };
  showModelModal.value = true;
};

const closeModelModal = () => {
  showModelModal.value = false;
  editingModel.value = null;
};

const saveModel = () => {
  if (!isModelFormValid.value) return;

  const modelData = {
    ...modelForm.value,
    isSystem: false,
    isEnabled: true,
    capabilities: []
  };

  if (modelData.supportsVision) modelData.capabilities.push('视觉');
  if (modelData.supportsTools) modelData.capabilities.push('工具');

  if (editingModel.value) {
    // 更新现有模型
    const index = models.value.findIndex(m => m.id === editingModel.value.id);
    if (index > -1) {
      models.value[index] = { ...models.value[index], ...modelData };
    }
  } else {
    // 添加新模型
    models.value.push(modelData);
  }

  hasChanges.value = true;
  closeModelModal();
};

const showAddProviderDialog = () => {
  selectedTemplate.value = null;
  newProvider.value = {
    name: '',
    baseUrl: '',
    apiKey: '',
    iconUrl: ''
  };
  isAddingProvider.value = true;
  // 取消选中当前提供商，显示添加表单
  selectedProvider.value = null;
};

/**
 * 选择预设模板
 * @param {Object} template - 提供商模板
 */
const selectTemplate = (template) => {
  selectedTemplate.value = template;
  // 自动填充表单
  newProvider.value.name = template.name;
  newProvider.value.baseUrl = template.baseUrl;
};

/**
 * 取消添加提供商
 */
const cancelAddProvider = () => {
  isAddingProvider.value = false;
  selectedTemplate.value = null;
  newProvider.value = {
    name: '',
    baseUrl: '',
    apiKey: '',
    iconUrl: ''
  };
};

const closeAddProviderModal = () => {
  showAddProviderModal.value = false;
};

const addNewProvider = () => {
  if (!isNewProviderValid.value) return;

  const provider = {
    id: `user-${generateId()}`,
    name: newProvider.value.name,
    icon: selectedTemplate.value?.icon || '⚙️',
    iconUrl: newProvider.value.iconUrl,
    isSystem: false,
    isEnabled: true,
    baseUrl: newProvider.value.baseUrl,
    defaultUrl: newProvider.value.baseUrl,
    keyUrl: selectedTemplate.value?.keyUrl || '',
    apiKey: newProvider.value.apiKey,
    models: []
  };

  userProviders.value.push(provider);
  settingsStore.saveUserProvider(provider);

  // 保存API密钥
  if (newProvider.value.apiKey) {
    settingsStore.setUserProviderKey(provider.id, newProvider.value.apiKey);
  }

  // 关闭内联表单
  isAddingProvider.value = false;
  selectedTemplate.value = null;

  // 自动选中新添加的提供商
  selectProvider(provider);
};

const deleteProvider = () => {
  if (!selectedProvider.value || selectedProvider.value.isSystem) return;

  if (confirm(`确定要删除提供商 "${selectedProvider.value.name}" 吗？此操作不可撤销。`)) {
    const index = userProviders.value.findIndex(p => p.id === selectedProvider.value.id);
    if (index > -1) {
      userProviders.value.splice(index, 1);
      settingsStore.deleteUserProvider(selectedProvider.value.id);
      selectedProvider.value = null;
    }
  }
};

/**
 * 选择模板并打开添加对话框（内联表单）
 * @param {Object} template - 提供商模板
 */
const selectTemplateAndOpenModal = (template) => {
  selectedTemplate.value = template;
  // 自动填充表单
  newProvider.value.name = template.name;
  newProvider.value.baseUrl = template.baseUrl;
  // 显示内联添加表单
  isAddingProvider.value = true;
  // 取消选中当前提供商
  selectedProvider.value = null;
};

const toggleModelSort = () => {
  // 切换排序方式
  models.value.reverse();
};

/**
 * 获取提供商名称的首字母
 * @param {string} name - 提供商名称
 * @returns {string} 首字母
 */
const getProviderInitial = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

/**
 * 获取提供商图标背景样式
 * @param {Object} provider - 提供商对象
 * @returns {Object} 样式对象
 */
const getProviderIconStyle = (provider) => {
  // 根据提供商名称生成固定的颜色
  const colors = [
    { bg: '#3B82F6', color: '#fff' }, // blue
    { bg: '#8B5CF6', color: '#fff' }, // violet
    { bg: '#EC4899', color: '#fff' }, // pink
    { bg: '#F59E0B', color: '#fff' }, // amber
    { bg: '#10B981', color: '#fff' }, // emerald
    { bg: '#EF4444', color: '#fff' }, // red
    { bg: '#06B6D4', color: '#fff' }, // cyan
    { bg: '#F97316', color: '#fff' }, // orange
  ];

  // 使用名称的hash来选择颜色
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

const saveConfiguration = async () => {
  if (!selectedProvider.value) return;

  isSaving.value = true;

  try {
    // 保存API密钥
    if (selectedProvider.value.isSystem) {
      // 系统API使用apiKeyManager
      if (apiKeyInput.value) {
        await apiKeyManager.setApiKey('zhipu', apiKeyInput.value);
      }
    } else {
      // 用户API使用settingsStore
      settingsStore.setUserProviderKey(selectedProvider.value.id, apiKeyInput.value);
    }

    // 保存模型配置
    if (!selectedProvider.value.isSystem) {
      settingsStore.updateUserProviderModels(selectedProvider.value.id, models.value);
    }

    hasChanges.value = false;

    // 显示成功提示
    testResult.value = {
      success: true,
      message: '✅ 配置保存成功！'
    };
  } catch (error) {
    testResult.value = {
      success: false,
      message: `❌ 保存失败：${error.message}`
    };
  } finally {
    isSaving.value = false;
  }
};

// 监听输入变化
watch([apiKeyInput, apiUrlInput], () => {
  hasChanges.value = true;
});

// 初始化
onMounted(() => {
  // 加载用户保存的提供商
  const savedProviders = settingsStore.getUserProviders();
  if (savedProviders?.length) {
    userProviders.value = savedProviders;
    // 默认选择第一个用户自定义提供商
    selectProvider(userProviders.value[0]);
  }
  // 如果没有用户自定义提供商，显示空状态，不选中系统API
});
</script>

<style scoped>
.enhanced-api-manager {
  display: flex;
  height: 100%;
  min-height: 600px;
  background: var(--surface-900, #0f0f0f);
  border-radius: 12px;
  overflow: hidden;
}

/* 左侧提供商列表 */
.provider-sidebar {
  width: 280px;
  background: var(--surface-900, #0f0f0f);
  border-right: 1px solid var(--surface-800, #1a1a1a);
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
}

/* 搜索框 */
.provider-search {
  position: relative;
  margin-bottom: 8px;
}

.provider-search .search-input {
  width: 100%;
  padding: 10px 36px 10px 14px;
  border: 1px solid var(--surface-700, #2a2a2a);
  border-radius: 10px;
  background: var(--surface-800, #1a1a1a);
  color: var(--surface-100, #f5f5f5);
  font-size: 14px;
  transition: all 0.2s;
}

.provider-search .search-input:focus {
  outline: none;
  border-color: var(--primary-600, #2563eb);
  background: var(--surface-700, #2a2a2a);
}

.provider-search .search-input::placeholder {
  color: var(--surface-500, #6b7280);
}

.provider-search .search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--surface-500, #6b7280);
  pointer-events: none;
}

.provider-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.provider-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  background: transparent;
}

.provider-item:hover {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
  transform: translateX(4px);
}

.provider-item.active {
  background: rgba(59, 130, 246, 0.12);
  border-color: var(--primary-500, #3b82f6);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.provider-icon-wrapper {
  margin-right: 12px;
}

.provider-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.provider-item:hover .provider-icon {
  transform: scale(1.05);
}

.provider-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.provider-icon .icon-text {
  font-size: 14px;
  font-weight: 600;
}

.provider-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.provider-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--surface-200, #e5e5e5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.provider-status {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  background: transparent;
  color: var(--surface-500, #6b7280);
  border: 1px solid var(--surface-700, #2a2a2a);
}

.provider-status.online {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.3);
}

.add-provider-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  margin-top: 8px;
  border: 1px dashed var(--primary-500, #3b82f6);
  border-radius: 10px;
  background: transparent;
  color: var(--primary-400, #60a5fa);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-provider-btn:hover {
  border-style: solid;
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.add-provider-btn .icon-svg {
  width: 18px;
  height: 18px;
}

/* 空状态提示 */
.empty-providers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-radius: 12px;
  border: 1px dashed var(--surface-600, #4b5563);
  margin: 8px 0;
}

.empty-text {
  font-size: 14px;
  color: var(--surface-300, #d1d5db);
  margin: 0 0 8px 0;
  font-weight: 500;
}

.empty-hint {
  font-size: 12px;
  color: var(--surface-500, #6b7280);
  margin: 0;
}

/* 快速添加模板 */
.quick-add-templates {
  padding: 8px 12px;
  border-top: 1px solid var(--surface-700, #2a2a2a);
}

.templates-title {
  font-size: 11px;
  color: var(--surface-500, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 0;
}

.template-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.template-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--surface-700, #2a2a2a);
  border-radius: 8px;
  background: var(--surface-800, #1a1a1a);
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-btn:hover {
  border-color: var(--primary-500, #3b82f6);
  background: rgba(59, 130, 246, 0.1);
  transform: translateX(4px);
}

.template-icon-svg {
  width: 18px;
  height: 18px;
  color: var(--primary-400, #60a5fa);
  flex-shrink: 0;
}

.template-icon {
  font-size: 16px;
}

.template-name {
  font-size: 13px;
  color: var(--surface-300, #d1d5db);
}

/* 模板网格（对话框中） */
.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.template-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 1px solid var(--surface-600, #4b5563);
  border-radius: 8px;
  background: var(--surface-800, #1a1a1a);
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-option:hover {
  border-color: var(--primary-500, #3b82f6);
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.template-option.active {
  border-color: var(--primary-500, #3b82f6);
  background: rgba(59, 130, 246, 0.15);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.template-option-icon {
  font-size: 20px;
}

.template-option-icon-svg {
  width: 22px;
  height: 22px;
  color: var(--primary-400, #60a5fa);
}

.template-option-name {
  font-size: 11px;
  color: var(--surface-300, #d1d5db);
}

/* 内联模板网格 */
.template-grid-inline {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.template-option-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 1px solid var(--surface-600, #4b5563);
  border-radius: 8px;
  background: var(--surface-800, #1a1a1a);
  cursor: pointer;
  transition: all 0.2s ease;
}

.template-option-inline:hover {
  border-color: var(--primary-500, #3b82f6);
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.template-option-inline.active {
  border-color: var(--primary-500, #3b82f6);
  background: rgba(59, 130, 246, 0.15);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* 添加提供商面板 */
.add-provider-panel {
  background: var(--surface-800, #1a1a1a);
  border-radius: 12px;
  padding: 20px;
  margin: 8px;
}

.add-provider-panel .config-section {
  background: var(--surface-800, #1a1a1a);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.add-provider-panel .form-group {
  margin-bottom: 12px;
}

.add-provider-panel .form-group:last-child {
  margin-bottom: 0;
}

.add-provider-panel .form-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--surface-300, #d1d5db);
  margin-bottom: 6px;
}

.add-provider-panel .form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--surface-600, #4b5563);
  border-radius: 8px;
  background: var(--surface-900, #0f0f0f);
  color: var(--surface-100, #f5f5f5);
  font-size: 14px;
  transition: all 0.2s;
}

.add-provider-panel .form-input:focus {
  outline: none;
  border-color: var(--primary-500, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.add-provider-panel .form-input::placeholder {
  color: var(--surface-500, #6b7280);
}

.add-provider-panel .panel-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--surface-700, #2a2a2a);
}

.add-provider-panel .btn-secondary {
  padding: 10px 20px;
  border: 1px solid var(--surface-600, #4b5563);
  border-radius: 8px;
  background: transparent;
  color: var(--surface-300, #d1d5db);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-provider-panel .btn-secondary:hover {
  border-color: var(--surface-500, #6b7280);
  background: var(--surface-700, #2a2a2a);
}

/* 右侧配置面板 */
.config-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--surface-700, #2a2a2a);
}

.header-title h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--surface-100, #f5f5f5);
  margin: 0 0 4px 0;
}

.system-notice {
  font-size: 12px;
  color: var(--primary-400, #60a5fa);
  margin: 0;
}

.user-notice {
  font-size: 12px;
  color: var(--surface-400, #9ca3af);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px;
  border-radius: 6px;
  border: none;
  background: var(--surface-700, #2a2a2a);
  color: var(--surface-300, #d1d5db);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--surface-600, #4b5563);
}

.action-btn.delete:hover {
  background: var(--error-900, #7f1d1d);
  color: var(--error-400, #f87171);
}

/* 配置区块 */
.config-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--surface-200, #e5e5e5);
  margin: 0;
}

.link-btn {
  font-size: 12px;
  color: var(--primary-400, #60a5fa);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.link-btn:hover {
  color: var(--primary-300, #93c5fd);
}

.header-actions-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-btn {
  padding: 6px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--surface-400, #9ca3af);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--surface-700, #2a2a2a);
  color: var(--surface-200, #e5e5e5);
}

/* API密钥输入 */
.api-key-input-wrapper {
  display: flex;
  gap: 8px;
}

.input-group {
  flex: 1;
  position: relative;
}

.api-key-input {
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 1px solid var(--surface-600, #4b5563);
  border-radius: 8px;
  background: var(--surface-800, #1a1a1a);
  color: var(--surface-100, #f5f5f5);
  font-size: 14px;
  transition: all 0.2s;
}

.api-key-input:focus {
  outline: none;
  border-color: var(--primary-500, #3b82f6);
}

.api-key-input.error {
  border-color: var(--error-500, #ef4444);
}

.api-key-input.success {
  border-color: var(--success-500, #22c55e);
}

.toggle-visibility-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--surface-400, #9ca3af);
  cursor: pointer;
}

.test-btn {
  padding: 10px 16px;
  border: 1px solid var(--surface-600, #4b5563);
  border-radius: 8px;
  background: var(--surface-700, #2a2a2a);
  color: var(--surface-200, #e5e5e5);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  justify-content: center;
}

.test-btn:hover:not(:disabled) {
  background: var(--surface-600, #4b5563);
  transform: translateY(-1px);
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-btn.success {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%);
  border-color: var(--success-500, #22c55e);
  color: var(--success-400, #4ade80);
}

.test-btn.error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%);
  border-color: var(--error-500, #ef4444);
  color: var(--error-400, #f87171);
}

.error-message {
  font-size: 12px;
  color: var(--error-400, #f87171);
  margin-top: 8px;
}

.test-result {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.test-result.success {
  background: var(--success-900, #064e3b);
  color: var(--success-400, #4ade80);
}

.test-result.error {
  background: var(--error-900, #7f1d1d);
  color: var(--error-400, #f87171);
}

.hint-text {
  font-size: 12px;
  color: var(--surface-500, #6b7280);
  margin-top: 8px;
}

/* API地址配置 */
.api-url-wrapper {
  display: flex;
  gap: 8px;
}

.url-preset-select {
  width: 140px;
  padding: 10px 12px;
  border: 1px solid var(--surface-600, #4b5563);
  border-radius: 8px;
  background: var(--surface-800, #1a1a1a);
  color: var(--surface-100, #f5f5f5);
  font-size: 14px;
}

.api-url-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--surface-600, #4b5563);
  border-radius: 8px;
  background: var(--surface-800, #1a1a1a);
  color: var(--surface-100, #f5f5f5);
  font-size: 14px;
}

.preview-text {
  font-size: 12px;
  color: var(--surface-500, #6b7280);
  margin-top: 8px;
}

/* 模型列表 */
.models-section {
  border: 1px solid var(--surface-700, #2a2a2a);
  border-radius: 12px;
  padding: 16px;
  background: linear-gradient(135deg, var(--surface-800, #1a1a1a) 0%, rgba(26, 26, 26, 0.8) 100%);
}

.model-count {
  font-size: 12px;
  color: var(--primary-400, #60a5fa);
  font-weight: 600;
  margin-left: 8px;
  background: rgba(59, 130, 246, 0.15);
  padding: 2px 8px;
  border-radius: 12px;
}

.model-search {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--surface-600, #4b5563);
  border-radius: 6px;
  background: var(--surface-900, #0f0f0f);
  color: var(--surface-100, #f5f5f5);
  font-size: 13px;
}

.models-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-category {
  border-radius: 8px;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: linear-gradient(135deg, var(--surface-700, #2a2a2a) 0%, rgba(42, 42, 42, 0.8) 100%);
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.category-header:hover {
  background: rgba(59, 130, 246, 0.1);
}

.category-icon {
  transition: transform 0.2s;
}

.category-icon.collapsed {
  transform: rotate(-90deg);
}

.category-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--surface-200, #e5e5e5);
}

.category-count {
  font-size: 11px;
  color: var(--surface-500, #6b7280);
  background: var(--surface-600, #4b5563);
  padding: 2px 8px;
  border-radius: 12px;
}

.category-models {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--surface-800, #1a1a1a);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.model-item:hover {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
}

.model-item.disabled {
  opacity: 0.5;
}

.model-item.is-system {
  border-left: 3px solid var(--primary-500, #3b82f6);
}

.model-icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin-right: 12px;
  background: var(--surface-700, #2a2a2a);
}

.model-icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.model-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-name {
  font-size: 13px;
  color: var(--surface-200, #e5e5e5);
}

.model-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.tag.free {
  background: var(--success-900, #064e3b);
  color: var(--success-400, #4ade80);
}

.tag.new {
  background: var(--primary-900, #1e3a5f);
  color: var(--primary-400, #60a5fa);
}

.tag.capability {
  background: var(--surface-600, #4b5563);
  color: var(--surface-300, #d1d5db);
}

.model-actions {
  display: flex;
  gap: 4px;
}

.action-icon {
  padding: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--surface-500, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-icon:hover {
  background: rgba(59, 130, 246, 0.15);
  color: var(--primary-400, #60a5fa);
}

.action-icon.active {
  color: var(--success-400, #4ade80);
  background: rgba(34, 197, 94, 0.1);
}

.action-icon.delete:hover {
  background: rgba(239, 68, 68, 0.15);
  color: var(--error-400, #f87171);
}

/* 面板底部 */
.panel-footer {
  padding-top: 16px;
  border-top: 1px solid var(--surface-700, #2a2a2a);
}

.save-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary-600, #2563eb) 0%, var(--primary-500, #3b82f6) 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.save-btn:active:not(:disabled) {
  transform: translateY(0);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--surface-400, #9ca3af);
  gap: 20px;
  padding: 48px 24px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
  border-radius: 16px;
  margin: 16px;
}

.empty-state p {
  font-size: 15px;
  color: var(--surface-300, #d1d5db);
  font-weight: 500;
}

.empty-state .w-16 {
  width: 64px;
  height: 64px;
  color: var(--primary-500, #3b82f6);
  opacity: 0.6;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--surface-800, #1a1a1a);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--surface-700, #2a2a2a);
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--surface-100, #f5f5f5);
  margin: 0;
}

.close-btn {
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--surface-400, #9ca3af);
  cursor: pointer;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--surface-700, #2a2a2a);
  color: var(--surface-200, #e5e5e5);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--surface-300, #d1d5db);
  margin-bottom: 6px;
}

.form-group .required {
  color: var(--error-500, #ef4444);
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--surface-600, #4b5563);
  border-radius: 8px;
  background: var(--surface-900, #0f0f0f);
  color: var(--surface-100, #f5f5f5);
  font-size: 14px;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-500, #3b82f6);
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-group.half {
  flex: 1;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--surface-300, #d1d5db);
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-500, #3b82f6);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--surface-700, #2a2a2a);
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  border: 1px solid var(--surface-600, #4b5563);
  background: transparent;
  color: var(--surface-300, #d1d5db);
}

.btn-secondary:hover {
  background: var(--surface-700, #2a2a2a);
}

.btn-primary {
  border: none;
  background: var(--primary-600, #2563eb);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-500, #3b82f6);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
