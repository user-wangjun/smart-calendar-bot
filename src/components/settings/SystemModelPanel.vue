<template>
  <div class="system-model-panel">
    <div class="panel-header">
      <div class="header-icon">🧠</div>
      <div class="header-content">
        <h3>系统模型 (智谱AI)</h3>
        <p>基于智谱 GLM 系列大模型，由系统统一管理</p>
      </div>
      <div class="status-badge" :class="{ active: isKeyConfigured }">
        {{ isKeyConfigured ? '已激活' : '未配置' }}
      </div>
    </div>

    <div class="panel-body">
      <div class="form-group">
        <label>当前模型</label>
        <select v-model="selectedModelId" @change="updateModel" class="model-select">
          <option v-for="model in zhipuModels" :key="model.id" :value="model.id">
            {{ model.name }} ({{ model.maxTokens }} tokens)
          </option>
        </select>
        <div class="model-desc" v-if="currentModelDesc">
          {{ currentModelDesc }}
        </div>
      </div>

      <div class="info-box">
        <div class="info-item">
          <span class="label">API 来源</span>
          <span class="value">环境变量 (ZHIPU_API_KEY)</span>
        </div>
        <div class="info-item">
          <span class="label">状态</span>
          <span class="value">{{ isKeyConfigured ? '正常' : '缺失' }}</span>
        </div>
      </div>

      <button 
        class="activate-btn" 
        :class="{ active: isActiveMode }"
        @click="activateMode"
      >
        {{ isActiveMode ? '当前正在使用' : '切换到系统模型' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import unifiedModelConfig from '@/config/unifiedModelConfig';
import apiKeyManager from '@/config/apiKeyManager';

const settingsStore = useSettingsStore();

// 获取智谱模型列表
const zhipuModels = computed(() => {
  return unifiedModelConfig.PLATFORM_MODELS.zhipu?.models || [];
});

const selectedModelId = ref(zhipuModels.value[0]?.id || '');
const isKeyConfigured = ref(!!apiKeyManager.getZhipuApiKey());

const currentModelDesc = computed(() => {
  const model = zhipuModels.value.find(m => m.id === selectedModelId.value);
  return unifiedModelConfig.PLATFORM_MODELS.zhipu?.description || '';
});

const isActiveMode = computed(() => settingsStore.modelMode === 'system');

const updateModel = () => {
  // 这里可以触发一些更新，或者 store 中存储选中的 system model
  // 目前 ChatService 会自动选择推荐的模型，或者我们可以加一个 systemModelId 到 store
  // 暂时我们只在 store 中切换模式，具体的模型选择可能需要 ChatService 支持
  // 为了简单，我们暂不存储具体的 System Model 选择，而是默认使用第一个或推荐的
  // 改进：在 settingsStore 中添加 selectedSystemModel
};

const activateMode = () => {
  settingsStore.setModelMode('system');
};

onMounted(() => {
    // 检查 Key
    isKeyConfigured.value = !!apiKeyManager.getZhipuApiKey();
});
</script>

<style scoped>
.system-model-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
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

.status-badge {
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--bg-danger-light);
  color: var(--text-danger);
}

.status-badge.active {
  background: var(--bg-success-light);
  color: var(--text-success);
}

.form-group {
  margin-bottom: 20px;
}

.model-select {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  color: var(--text-primary);
  margin-bottom: 8px;
}

.model-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.info-box {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: var(--text-secondary);
}

.activate-btn {
  margin-top: auto;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.activate-btn.active {
  background: var(--primary-color);
  color: white;
}

.activate-btn:hover:not(.active) {
  background: var(--bg-hover);
}
</style>