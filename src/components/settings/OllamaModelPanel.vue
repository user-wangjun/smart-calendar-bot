<template>
  <div class="ollama-model-panel">
    <div class="panel-header">
      <div class="header-icon">🦙</div>
      <div class="header-content">
        <h3>Ollama 模型</h3>
        <p>选择本地 Ollama 模型进行 AI 对话</p>
      </div>
      <div class="status-badge" :class="{ active: isServiceConnected }">
        {{ isServiceConnected ? '服务已连接' : '服务未连接' }}
      </div>
    </div>

    <div class="panel-body">
      <div class="status-section">
        <div class="status-row">
          <div class="status-item">
            <div class="status-icon" :class="{ success: isServiceConnected, error: !isServiceConnected }">
              <div class="status-dot"></div>
            </div>
            <div class="status-text">
              <div class="status-label">Ollama 服务</div>
              <div class="status-value">
                {{ isServiceConnected ? '运行中' : '未运行' }}
              </div>
            </div>
          </div>
          <div class="status-item">
            <div class="status-icon" :class="{ success: hasModels, error: !hasModels, warning: !isServiceConnected }">
              <div class="status-dot"></div>
            </div>
            <div class="status-text">
              <div class="status-label">模型可用性</div>
              <div class="status-value">
                {{ modelAvailabilityStatus }}
              </div>
            </div>
          </div>
        </div>
        <div class="status-timer" v-if="nextCheckCountdown > 0">
          <span>下次检查: {{ nextCheckCountdown }}秒</span>
        </div>
      </div>

      <div v-if="serviceError" class="error-section">
        <div class="error-icon">⚠️</div>
        <div class="error-content">
          <div class="error-title">无法连接到 Ollama 服务</div>
          <div class="error-message">{{ serviceError }}</div>
          <div class="error-actions">
            <BaseButton 
              size="sm" 
              variant="primary" 
              :icon="RefreshCw" 
              :loading="isChecking"
              @click="checkServiceStatus"
            >
              立即检查
            </BaseButton>
            <a href="https://ollama.com/download" target="_blank" class="help-link">
              下载 Ollama <ExternalLink class="w-3 h-3" />
            </a>
          </div>
          <div class="error-guide">
            <div class="guide-title">如何启动 Ollama 服务:</div>
            <div class="guide-steps">
              <div class="guide-step">1. 打开 Ollama 应用程序</div>
              <div class="guide-step">2. 或在终端运行: <code>ollama serve</code></div>
              <div class="guide-step">3. 确保服务运行在 <code>{{ settingsStore.ollamaUrl }}</code></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!hasModels && isServiceConnected" class="error-section">
        <div class="error-icon">📦</div>
        <div class="error-content">
          <div class="error-title">未发现已下载的模型</div>
          <div class="error-message">需要先下载模型才能使用 Ollama</div>
          <div class="error-actions">
            <BaseButton 
              size="sm" 
              variant="primary" 
              :icon="RefreshCw" 
              :loading="isChecking"
              @click="refreshModels"
            >
              刷新模型
            </BaseButton>
            <a href="https://ollama.com/library" target="_blank" class="help-link">
              浏览模型库 <ExternalLink class="w-3 h-3" />
            </a>
          </div>
          <div class="error-guide">
            <div class="guide-title">如何下载模型:</div>
            <div class="guide-steps">
              <div class="guide-step">1. 打开终端</div>
              <div class="guide-step">2. 运行: <code>ollama pull llama3.1</code> (或其他模型)</div>
              <div class="guide-step">3. 等待下载完成</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="action-bar">
        <BaseButton 
          size="sm" 
          variant="secondary" 
          :icon="RefreshCw" 
          :loading="isLoading || isChecking"
          @click="refreshModels"
        >
          刷新模型
        </BaseButton>
      </div>

      <div v-if="hasModels && isServiceConnected" class="model-list">
        <div 
          v-for="model in displayModels" 
          :key="model.id"
          class="model-item"
          :class="{ active: selectedModelId === model.id }"
          @click="selectModel(model.id)"
        >
          <div class="model-info">
            <div class="model-name">
              {{ model.name }}
              <span v-if="model.recommended" class="recommended-badge">推荐</span>
            </div>
            <div class="model-details">
              <span class="detail-item">上下文: {{ formatContextLength(model.contextWindow) }}</span>
              <span v-if="model.features.includes('vision')" class="detail-item">🎨 多模态</span>
              <span v-if="model.features.includes('code')" class="detail-item">💻 代码</span>
              <span v-if="model.features.includes('chinese')" class="detail-item">🇨🇳 中文</span>
            </div>
          </div>
          <div v-if="selectedModelId === model.id" class="selected-check">
            <Check class="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="loading-box">
        <LoadingSpinner />
        <span class="loading-text">获取模型列表中...</span>
      </div>

      <div class="device-info">
        <div class="info-title">设备信息</div>
        <div class="info-content">
          <div class="info-row">
            <span class="info-label">平台</span>
            <span class="info-value">{{ deviceInfo.platform }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">内存</span>
            <span class="info-value">{{ deviceInfo.totalRam }} GB</span>
          </div>
          <div class="info-row">
            <span class="info-label">CPU</span>
            <span class="info-value">{{ deviceInfo.cpuCores }} 核</span>
          </div>
        </div>
        <div class="recommendation">
          <span class="recommendation-label">💡 推荐模型:</span>
          <span class="recommendation-text">{{ recommendedModelName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import unifiedModelConfig from '@/config/unifiedModelConfig';
import BaseButton from '@/components/base/BaseButton.vue';
import LoadingSpinner from '@/components/base/LoadingSpinner.vue';
import { RefreshCw, Check, ExternalLink } from 'lucide-vue-next';

const settingsStore = useSettingsStore();

const selectedModelId = ref(settingsStore.ollamaSelectedModel || 'llama3.1');
const isLoading = ref(false);
const isChecking = ref(false);
const isServiceConnected = ref(false);
const localModels = ref([]);
const serviceError = ref('');
let autoCheckInterval = null;
let countdownInterval = null;
const nextCheckCountdown = ref(0);
const CHECK_INTERVAL = 30000;

const deviceInfo = ref({
  platform: navigator.platform || 'Unknown',
  totalRam: '8+',
  cpuCores: navigator.hardwareConcurrency || '4+'
});

const ollamaModels = computed(() => {
  return unifiedModelConfig.PLATFORM_MODELS.ollama?.models || [];
});

const displayModels = computed(() => {
  if (localModels.value.length > 0) {
    return localModels.value.map(localModel => {
      const knownModel = ollamaModels.value.find(m => m.id === localModel.name);
      if (knownModel) {
        return knownModel;
      }
      return {
        id: localModel.name,
        name: localModel.name,
        maxTokens: 4096,
        contextWindow: 4096,
        pricing: { input: 0, output: 0 },
        features: ['text', 'local'],
        category: 'local'
      };
    });
  }
  return ollamaModels.value;
});

const hasModels = computed(() => {
  return localModels.value.length > 0;
});

const modelAvailabilityStatus = computed(() => {
  if (!isServiceConnected.value) {
    return '待检查';
  }
  return hasModels.value ? `可用 (${localModels.value.length})` : '无模型';
});

const recommendedModelName = computed(() => {
  const ram = parseInt(deviceInfo.value.totalRam);
  if (ram >= 16) {
    return 'Llama 3.1 8B 或 Qwen 2.5 7B';
  } else if (ram >= 8) {
    return 'Phi-3 Mini 或 Mistral 7B';
  }
  return 'Phi-3 Mini';
});

const formatContextLength = (length) => {
  if (length >= 1000) {
    return (length / 1000) + 'K';
  }
  return length;
};

const selectModel = (modelId) => {
  selectedModelId.value = modelId;
  settingsStore.setOllamaSelectedModel(modelId);
};

const checkServiceStatus = async () => {
  isChecking.value = true;
  serviceError.value = '';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${settingsStore.ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      localModels.value = data.models || [];
      isServiceConnected.value = true;
      serviceError.value = '';
    } else {
      isServiceConnected.value = false;
      serviceError.value = `服务响应异常: ${response.status}`;
    }
  } catch (error) {
    isServiceConnected.value = false;
    if (error.name === 'AbortError') {
      serviceError.value = '连接超时，请检查服务是否正在运行';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      serviceError.value = '无法连接到服务，请确认服务地址和端口';
    } else {
      serviceError.value = error.message || '未知错误';
    }
    localModels.value = [];
  } finally {
    isChecking.value = false;
    resetCountdown();
  }
};

const refreshModels = async () => {
  isLoading.value = true;
  localModels.value = [];
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${settingsStore.ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      localModels.value = data.models || [];
      isServiceConnected.value = true;
      serviceError.value = '';
    } else {
      isServiceConnected.value = false;
      serviceError.value = `服务响应异常: ${response.status}`;
    }
  } catch (error) {
    isServiceConnected.value = false;
    if (error.name === 'AbortError') {
      serviceError.value = '请求超时，请检查服务是否正在运行';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      serviceError.value = '无法连接到服务，请确认服务地址和端口';
    } else {
      serviceError.value = error.message || '未知错误';
    }
  } finally {
    isLoading.value = false;
    resetCountdown();
  }
};

const resetCountdown = () => {
  nextCheckCountdown.value = CHECK_INTERVAL / 1000;
};

const startAutoCheck = () => {
  resetCountdown();
  
  autoCheckInterval = setInterval(() => {
    checkServiceStatus();
  }, CHECK_INTERVAL);
  
  countdownInterval = setInterval(() => {
    if (nextCheckCountdown.value > 0) {
      nextCheckCountdown.value--;
    }
  }, 1000);
};

const stopAutoCheck = () => {
  if (autoCheckInterval) {
    clearInterval(autoCheckInterval);
    autoCheckInterval = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
};

onMounted(() => {
  checkServiceStatus();
  startAutoCheck();
});

onUnmounted(() => {
  stopAutoCheck();
});
</script>

<style scoped>
.ollama-model-panel {
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
  color: var(--text-primary);
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

.panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.status-section {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.status-row {
  display: flex;
  gap: 20px;
  margin-bottom: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: pulse 2s infinite;
}

.status-icon.success .status-dot {
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}

.status-icon.error .status-dot {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.status-icon.warning .status-dot {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.status-text {
  display: flex;
  flex-direction: column;
}

.status-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.status-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.status-timer {
  font-size: 11px;
  color: var(--text-tertiary);
  text-align: right;
}

.error-section {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
  background: var(--bg-danger-light);
  border: 1px solid var(--border-danger);
  border-radius: 8px;
}

.error-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-danger);
  margin-bottom: 4px;
}

.error-message {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.error-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.help-link {
  font-size: 12px;
  color: var(--primary-color);
  text-decoration: underline;
  display: flex;
  align-items: center;
  gap: 4px;
}

.error-guide {
  padding: 12px;
  background: var(--bg-primary);
  border-radius: 6px;
}

.guide-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.guide-step {
  font-size: 11px;
  color: var(--text-secondary);
}

.guide-step code {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: var(--text-primary);
}

.action-bar {
  margin-bottom: 16px;
}

.model-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  max-height: 300px;
}

.model-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.model-item:hover {
  border-color: var(--primary-light);
  background: var(--bg-hover);
}

.model-item.active {
  border-color: var(--primary-color);
  background: rgba(59, 130, 246, 0.1);
}

.model-info {
  flex: 1;
}

.model-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recommended-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: linear-gradient(to right, #a855f7, #3b82f6);
  color: white;
}

.model-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-item {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-tertiary);
}

.selected-check {
  width: 24px;
  height: 24px;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-box,
.empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.empty-link {
  font-size: 12px;
  color: var(--primary-color);
  text-decoration: underline;
  display: flex;
  align-items: center;
  gap: 4px;
}

.device-info {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 12px;
}

.info-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.info-content {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.info-label {
  color: var(--text-tertiary);
}

.info-value {
  color: var(--text-primary);
  font-weight: 500;
}

.recommendation {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.recommendation-label {
  color: var(--text-secondary);
}

.recommendation-text {
  color: var(--primary-color);
  font-weight: 500;
}
</style>
