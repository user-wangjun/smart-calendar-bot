<template>
  <div class="custom-model-panel">
    <div class="panel-header">
      <div class="header-icon">🔧</div>
      <div class="header-content">
        <h3>用户自选模型 (Custom)</h3>
        <p>接入任意 OpenAI 兼容的 API 服务</p>
      </div>
      <button class="preset-btn" @click="showPresets = !showPresets">
        预设管理
      </button>
    </div>

    <div class="panel-body">
      <!-- 平台预设 -->
      <div class="form-group">
        <label>平台选择</label>
        <select v-model="selectedPlatform" @change="applyPlatformPreset" class="form-select">
          <option value="openai">OpenAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="ali">阿里通义千问 (OpenAI兼容)</option>
          <option value="baidu">百度千帆 (OpenAI兼容)</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <!-- 基础配置 -->
      <div class="form-group">
        <label>Base URL</label>
        <input 
          v-model="config.baseUrl" 
          type="text" 
          class="form-input" 
          placeholder="https://api.openai.com/v1"
        >
      </div>

      <div class="form-group">
        <label>API Key</label>
        <div class="input-with-icon">
          <input 
            v-model="config.apiKey" 
            :type="showKey ? 'text' : 'password'" 
            class="form-input" 
            placeholder="sk-..."
          >
          <span class="icon" @click="showKey = !showKey">
            {{ showKey ? '👁️' : '🔒' }}
          </span>
        </div>
      </div>

      <div class="form-group">
        <label>模型 ID</label>
        <input 
          v-model="config.modelId" 
          type="text" 
          class="form-input" 
          placeholder="例如: gpt-4o, deepseek-chat"
        >
      </div>

      <!-- 参数配置 -->
      <div class="params-section">
        <div class="param-item">
          <div class="param-header">
            <span>温度 (Temperature)</span>
            <span>{{ config.parameters.temperature }}</span>
          </div>
          <input 
            v-model.number="config.parameters.temperature" 
            type="range" 
            min="0" 
            max="2" 
            step="0.1" 
            class="param-slider"
          >
        </div>
        
        <div class="param-item">
          <div class="param-header">
            <span>最大 Tokens</span>
            <span>{{ config.parameters.max_tokens }}</span>
          </div>
          <input 
            v-model.number="config.parameters.max_tokens" 
            type="range" 
            min="128" 
            max="8192" 
            step="128" 
            class="param-slider"
          >
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <button class="save-preset-btn" @click="savePreset">保存为预设</button>
        <button 
          class="activate-btn" 
          :class="{ active: isActiveMode }"
          @click="activateMode"
        >
          {{ isActiveMode ? '当前正在使用' : '切换到自选模型' }}
        </button>
      </div>
    </div>

    <!-- 预设列表弹窗 (简化版) -->
    <div v-if="showPresets" class="presets-modal">
      <div class="modal-content">
        <h4>已保存的预设</h4>
        <div class="preset-list">
          <div v-for="preset in presets" :key="preset.id" class="preset-item">
            <span class="preset-name">{{ preset.name }}</span>
            <div class="preset-actions">
              <button @click="loadPreset(preset.id)">加载</button>
              <button @click="deletePreset(preset.id)" class="danger">删除</button>
            </div>
          </div>
          <div v-if="presets.length === 0" class="no-data">暂无预设</div>
        </div>
        <button class="close-btn" @click="showPresets = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore();
const config = ref(settingsStore.customModelConfig);
const showKey = ref(false);
const showPresets = ref(false);
const selectedPlatform = ref(config.value.platform || 'openai');

const isActiveMode = computed(() => settingsStore.modelMode === 'custom');
const presets = computed(() => settingsStore.customModelPresets);

const platformPresets = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    modelId: 'gpt-3.5-turbo'
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    modelId: 'deepseek-chat'
  },
  ali: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    modelId: 'qwen-turbo'
  },
  baidu: {
    baseUrl: 'https://qianfan.baidubce.com/v2/chat/completions',
    modelId: 'ernie-3.5-8k'
  },
  custom: {
    baseUrl: '',
    modelId: ''
  }
};

const applyPlatformPreset = () => {
  const preset = platformPresets[selectedPlatform.value];
  if (preset) {
    if (selectedPlatform.value !== 'custom') {
      config.value.baseUrl = preset.baseUrl;
      config.value.modelId = preset.modelId;
    }
    config.value.platform = selectedPlatform.value;
  }
};

const activateMode = () => {
  settingsStore.setCustomModelConfig(config.value);
  settingsStore.setModelMode('custom');
};

const savePreset = () => {
  const name = prompt('请输入预设名称:', `${selectedPlatform.value}-${config.value.modelId}`);
  if (name) {
    settingsStore.setCustomModelConfig(config.value);
    settingsStore.saveCustomPreset(name);
  }
};

const loadPreset = (id) => {
  settingsStore.loadCustomPreset(id);
  config.value = settingsStore.customModelConfig;
  selectedPlatform.value = config.value.platform;
  showPresets.value = false;
};

const deletePreset = (id) => {
  if (confirm('确定删除该预设吗？')) {
    settingsStore.deleteCustomPreset(id);
  }
};

// 监听配置变化自动保存到 store
watch(config, (newVal) => {
  settingsStore.setCustomModelConfig(newVal);
}, { deep: true });

</script>

<style scoped>
.custom-model-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.panel-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color-light);
}

.header-icon {
  font-size: 24px;
  margin-right: 12px;
}

.header-content h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.header-content p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.preset-btn {
  margin-left: auto;
  padding: 4px 8px;
  font-size: 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 12px;
  margin-bottom: 6px;
  color: var(--text-secondary);
}

.form-select, .form-input {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
}

.input-with-icon {
  position: relative;
}

.input-with-icon .icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  opacity: 0.6;
}

.params-section {
  background: var(--bg-secondary);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.param-item {
  margin-bottom: 10px;
}

.param-item:last-child {
  margin-bottom: 0;
}

.param-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.param-slider {
  width: 100%;
}

.actions {
  margin-top: auto;
  display: flex;
  gap: 10px;
}

.save-preset-btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
}

.activate-btn {
  flex: 2;
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
}

.activate-btn.active {
  background: var(--primary-color);
  color: white;
}

/* Modal */
.presets-modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}

.modal-content {
  background: var(--bg-card);
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-height: 80%;
  overflow-y: auto;
}

.preset-list {
  margin: 15px 0;
}

.preset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
}

.preset-actions button {
  margin-left: 5px;
  padding: 4px 8px;
  border-radius: 4px;
  border: none;
  background: var(--bg-secondary);
  cursor: pointer;
  font-size: 12px;
}

.preset-actions button.danger {
  color: red;
}

.close-btn {
  width: 100%;
  padding: 8px;
  background: var(--bg-secondary);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>