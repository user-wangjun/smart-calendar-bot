<template>
  <div class="amap-weather-settings">
    <!-- API密钥设置 -->
    <div class="setting-section">
      <h3 class="section-title">🔑 API密钥设置</h3>

      <!-- 环境变量配置提示 -->
      <div v-if="isApiKeyFromEnv" class="env-config-notice">
        <div class="notice-icon">✅</div>
        <div class="notice-content">
          <div class="notice-title">API密钥已通过环境变量配置</div>
          <div class="notice-text">
            当前使用的API密钥来自 <code>.env</code> 文件中的 <code>VITE_AMAP_API_KEY</code> 配置
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">
          高德Web服务API密钥
          <a 
            href="https://console.amap.com/dev/key/app" 
            target="_blank" 
            class="help-link"
          >
            如何获取？
          </a>
        </label>
        <div class="input-group">
          <input
            v-model="settings.apiKey"
            :type="showApiKey ? 'text' : 'password'"
            class="form-input"
            :placeholder="isApiKeyFromEnv ? '已通过环境变量配置' : '请输入高德Web服务API密钥'"
            :disabled="isApiKeyFromEnv"
            @blur="validateApiKey"
          />
          <button 
            v-if="!isApiKeyFromEnv"
            @click="showApiKey = !showApiKey" 
            class="toggle-btn"
            type="button"
          >
            {{ showApiKey ? '🙈' : '👁️' }}
          </button>
        </div>
        <div v-if="apiKeyError" class="error-hint">{{ apiKeyError }}</div>
        <div class="input-hint">
          <template v-if="isApiKeyFromEnv">
            如需修改密钥，请编辑项目根目录下的 <code>.env</code> 文件
          </template>
          <template v-else>
            密钥将安全地存储在本地，不会上传到服务器。推荐在 <code>.env</code> 文件中配置
          </template>
        </div>
      </div>

      <!-- 连接测试 -->
      <div class="test-section">
        <button 
          @click="testConnection" 
          :disabled="testing || !settings.apiKey"
          class="test-btn"
        >
          <span v-if="testing">测试中...</span>
          <span v-else>测试连接</span>
        </button>
        <div v-if="testResult" :class="['test-result', testResult.success ? 'success' : 'error']">
          {{ testResult.message }}
        </div>
      </div>
    </div>

    <!-- 定位设置 -->
    <div class="setting-section">
      <h3 class="section-title">📍 定位设置</h3>
      <div class="form-group">
        <label class="checkbox-label">
          <input
            v-model="settings.enableHighAccuracy"
            type="checkbox"
          />
          <span>启用高精度定位（使用GPS）</span>
        </label>
        <div class="input-hint">
          高精度定位可能增加电量消耗，但定位更准确
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">定位超时时间（秒）</label>
        <input
          v-model.number="settings.locationTimeout"
          type="number"
          class="form-input"
          min="3"
          max="30"
        />
      </div>
    </div>

    <!-- 刷新设置 -->
    <div class="setting-section">
      <h3 class="section-title">🔄 自动刷新设置</h3>
      <div class="form-group">
        <label class="checkbox-label">
          <input
            v-model="settings.autoRefresh"
            type="checkbox"
          />
          <span>启用自动刷新</span>
        </label>
      </div>

      <div class="form-group" v-if="settings.autoRefresh">
        <label class="form-label">刷新间隔（分钟）</label>
        <select v-model.number="settings.refreshInterval" class="form-select">
          <option :value="5">5分钟</option>
          <option :value="10">10分钟</option>
          <option :value="15">15分钟</option>
          <option :value="30">30分钟</option>
          <option :value="60">1小时</option>
        </select>
      </div>
    </div>

    <!-- 默认城市 -->
    <div class="setting-section">
      <h3 class="section-title">🏙️ 默认城市</h3>
      <div class="form-group">
        <label class="form-label">默认显示天气的城市</label>
        <input
          v-model="settings.defaultCity"
          type="text"
          class="form-input"
          placeholder="例如：北京、上海、广州"
        />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button @click="saveSettings" class="save-btn" :disabled="saving">
        <span v-if="saving">保存中...</span>
        <span v-else>保存设置</span>
      </button>
      <button @click="resetSettings" class="reset-btn">
        重置为默认
      </button>
    </div>

    <!-- 保存结果提示 -->
    <div v-if="saveMessage" :class="['save-message', saveMessage.type]">
      {{ saveMessage.text }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import amapLocationWeatherService from '@/services/amapLocationWeatherService.js';

const emit = defineEmits(['settings-saved', 'settings-reset']);

// 从环境变量获取API密钥
const getApiKeyFromEnv = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_AMAP_API_KEY || '';
  }
  return '';
};

// 检查API密钥是否来自环境变量
const isApiKeyFromEnv = computed(() => {
  const envKey = getApiKeyFromEnv();
  return !!envKey && envKey === settings.apiKey;
});

// 状态
const showApiKey = ref(false);
const apiKeyError = ref('');
const testing = ref(false);
const testResult = ref(null);
const saving = ref(false);
const saveMessage = ref(null);

// 设置数据
const settings = reactive({
  apiKey: '',
  enableHighAccuracy: true,
  locationTimeout: 10,
  autoRefresh: true,
  refreshInterval: 30,
  defaultCity: '北京'
});

// 默认设置
const defaultSettings = {
  apiKey: '',
  enableHighAccuracy: true,
  locationTimeout: 10,
  autoRefresh: true,
  refreshInterval: 30,
  defaultCity: '北京'
};

// 验证API密钥
const validateApiKey = () => {
  apiKeyError.value = '';
  if (settings.apiKey && settings.apiKey.length < 10) {
    apiKeyError.value = 'API密钥格式不正确';
    return false;
  }
  return true;
};

// 测试连接
const testConnection = async () => {
  if (!settings.apiKey) {
    testResult.value = {
      success: false,
      message: '请先输入API密钥'
    };
    return;
  }

  testing.value = true;
  testResult.value = null;

  try {
    // 设置API密钥
    amapLocationWeatherService.setApiKey(settings.apiKey);

    // 执行健康检查
    const health = await amapLocationWeatherService.healthCheck();

    if (health.healthy) {
      testResult.value = {
        success: true,
        message: '✅ 连接成功！API密钥有效，所有服务正常。'
      };
    } else {
      testResult.value = {
        success: false,
        message: `❌ 连接失败：${health.message}`
      };
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: `❌ 测试失败：${error.message}`
    };
  } finally {
    testing.value = false;
  }
};

// 保存设置
const saveSettings = async () => {
  if (!validateApiKey()) {
    return;
  }

  saving.value = true;
  saveMessage.value = null;

  try {
    // 保存到本地存储
    const settingsToSave = {
      ...settings,
      apiKey: settings.apiKey // 实际应用中应该加密存储
    };
    localStorage.setItem('amapWeatherSettings', JSON.stringify(settingsToSave));

    // 设置API密钥到服务
    if (settings.apiKey) {
      amapLocationWeatherService.setApiKey(settings.apiKey);
    }

    saveMessage.value = {
      type: 'success',
      text: '✅ 设置保存成功！'
    };

    emit('settings-saved', settingsToSave);
  } catch (error) {
    saveMessage.value = {
      type: 'error',
      text: `❌ 保存失败：${error.message}`
    };
  } finally {
    saving.value = false;

    // 3秒后清除消息
    setTimeout(() => {
      saveMessage.value = null;
    }, 3000);
  }
};

// 重置设置
const resetSettings = () => {
  Object.assign(settings, defaultSettings);
  apiKeyError.value = '';
  testResult.value = null;
  saveMessage.value = {
    type: 'info',
    text: '设置已重置为默认值，请记得保存'
  };

  emit('settings-reset');

  setTimeout(() => {
    saveMessage.value = null;
  }, 3000);
};

// 加载保存的设置
const loadSettings = () => {
  try {
    // 优先从环境变量读取API密钥
    const envApiKey = getApiKeyFromEnv();
    if (envApiKey) {
      settings.apiKey = envApiKey;
      amapLocationWeatherService.setApiKey(envApiKey);
    }

    // 从本地存储读取其他设置
    const saved = localStorage.getItem('amapWeatherSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 合并设置，但不覆盖环境变量的API密钥
      Object.assign(settings, {
        ...parsed,
        apiKey: envApiKey || parsed.apiKey || ''
      });

      // 设置API密钥到服务（如果环境变量没有配置）
      if (!envApiKey && settings.apiKey) {
        amapLocationWeatherService.setApiKey(settings.apiKey);
      }
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
};

// 生命周期
onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.amap-weather-settings {
  padding: 20px;
}

.setting-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.setting-section:last-of-type {
  border-bottom: none;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0 0 16px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #4b5563);
  margin-bottom: 8px;
}

.help-link {
  font-size: 12px;
  color: var(--primary-color, #3b82f6);
  text-decoration: none;
  margin-left: 8px;
}

.help-link:hover {
  text-decoration: underline;
}

.input-group {
  display: flex;
  gap: 8px;
}

.form-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
}

.toggle-btn {
  padding: 10px 12px;
  background: var(--bg-secondary, #f3f4f6);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: var(--bg-hover, #e5e7eb);
}

.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 8px;
  font-size: 14px;
  background: white;
}

.form-select:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.input-hint {
  font-size: 12px;
  color: var(--text-tertiary, #9ca3af);
  margin-top: 4px;
}

.input-hint code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
}

.error-hint {
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
}

/* 环境变量配置提示 */
.env-config-notice {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #d1fae5;
  border-radius: 8px;
  margin-bottom: 16px;
}

.notice-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 14px;
  font-weight: 600;
  color: #065f46;
  margin-bottom: 4px;
}

.notice-text {
  font-size: 12px;
  color: #047857;
  line-height: 1.5;
}

.notice-text code {
  background: rgba(255, 255, 255, 0.5);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.test-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.test-btn {
  padding: 10px 20px;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.test-btn:hover:not(:disabled) {
  background: var(--primary-hover, #2563eb);
}

.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-result {
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 6px;
}

.test-result.success {
  background: #d1fae5;
  color: #065f46;
}

.test-result.error {
  background: #fee2e2;
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.save-btn {
  flex: 1;
  padding: 12px 24px;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: var(--primary-hover, #2563eb);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-btn {
  padding: 12px 24px;
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-secondary, #4b5563);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.reset-btn:hover {
  background: var(--bg-hover, #e5e7eb);
}

.save-message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.save-message.success {
  background: #d1fae5;
  color: #065f46;
}

.save-message.error {
  background: #fee2e2;
  color: #991b1b;
}

.save-message.info {
  background: #dbeafe;
  color: #1e40af;
}
</style>
