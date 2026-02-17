<template>
  <ModernCard title="API健康检查" subtitle="检测所有API连接状态" icon="🔍">
    <div class="health-check-panel">
      <!-- 检查按钮 -->
      <div class="check-actions">
        <button 
          @click="runHealthCheck" 
          :disabled="isChecking"
          class="check-btn"
        >
          <span v-if="isChecking">🔄 检查中...</span>
          <span v-else>🔍 开始检查</span>
        </button>
        <button 
          v-if="results.length > 0"
          @click="clearResults"
          class="clear-btn"
        >
          🗑️ 清除结果
        </button>
      </div>

      <!-- 检查进度 -->
      <div v-if="isChecking" class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        <span class="progress-text">{{ checkedCount }}/{{ totalCount }}</span>
      </div>

      <!-- 结果摘要 -->
      <div v-if="report.summary" class="summary-panel">
        <div class="summary-item online">
          <span class="summary-icon">✅</span>
          <span class="summary-count">{{ report.summary.online }}</span>
          <span class="summary-label">在线</span>
        </div>
        <div class="summary-item offline">
          <span class="summary-icon">❌</span>
          <span class="summary-count">{{ report.summary.offline }}</span>
          <span class="summary-label">离线</span>
        </div>
        <div class="summary-item error">
          <span class="summary-icon">⚠️</span>
          <span class="summary-count">{{ report.summary.errors }}</span>
          <span class="summary-label">错误</span>
        </div>
      </div>

      <!-- 详细结果 -->
      <div v-if="results.length > 0" class="results-list">
        <div 
          v-for="result in results" 
          :key="result.provider"
          class="result-item"
          :class="result.status"
        >
          <div class="result-header">
            <span class="provider-icon">{{ result.icon }}</span>
            <span class="provider-name">{{ result.name }}</span>
            <span class="status-badge" :class="result.status">
              {{ getStatusText(result.status) }}
            </span>
          </div>
          
          <div class="result-details">
            <div v-if="result.latency" class="detail-item">
              <span class="detail-label">延迟:</span>
              <span class="detail-value" :class="getLatencyClass(result.latency)">
                {{ result.latency }}ms
              </span>
            </div>
            
            <div v-if="result.models.length > 0" class="detail-item">
              <span class="detail-label">可用模型:</span>
              <span class="detail-value">{{ result.models.join(', ') }}</span>
            </div>
            
            <div v-if="result.error" class="detail-item error">
              <span class="detail-label">错误:</span>
              <span class="detail-value">{{ result.error }}</span>
            </div>

            <div v-if="result.details.chatTest" class="detail-item">
              <span class="detail-label">聊天测试:</span>
              <span class="detail-value" :class="result.details.chatTest.success ? 'success' : 'error'">
                {{ result.details.chatTest.success ? '✅ 通过' : '❌ 失败' }}
                <span v-if="result.details.chatTest.error">({{ result.details.chatTest.error }})</span>
              </span>
            </div>

            <div v-if="result.details.weather" class="detail-item">
              <span class="detail-label">天气:</span>
              <span class="detail-value">
                {{ result.details.location }} {{ result.details.weather }} {{ result.details.temperature }}°C
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 建议 -->
      <div v-if="report.recommendations?.length > 0" class="recommendations">
        <h4>💡 改进建议</h4>
        <ul>
          <li v-for="(rec, index) in report.recommendations" :key="index">
            <strong>{{ rec.provider }}:</strong> {{ rec.issue }} - {{ rec.action }}
          </li>
        </ul>
      </div>
    </div>
  </ModernCard>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import ModernCard from './ui/ModernCard.vue';
import apiHealthCheck from '@/services/apiHealthCheck.js';

const settingsStore = useSettingsStore();

const isChecking = ref(false);
const results = ref([]);
const report = ref({});
const checkedCount = ref(0);
const totalCount = computed(() => settingsStore.ollamaEnabled ? 5 : 4);

const progress = computed(() => {
  if (totalCount.value === 0) return 0;
  return (checkedCount.value / totalCount.value) * 100;
});

/**
 * 运行健康检查
 * 根据Ollama启用状态决定是否检查Ollama
 */
const runHealthCheck = async () => {
  isChecking.value = true;
  results.value = [];
  checkedCount.value = 0;

  // 基础检查列表（不包含Ollama）
  const checkMethods = [
    { name: 'openrouter', method: 'checkOpenRouter' },
    // { name: 'cherry', method: 'checkCherry' }, // Cherry API已禁用
    { name: 'zhipu', method: 'checkZhipu' },
    { name: 'qiniu', method: 'checkQiniuAI' },
    { name: 'weather', method: 'checkWeather' }
  ];

  // 仅在Ollama启用时添加Ollama检查
  if (settingsStore.ollamaEnabled) {
    checkMethods.splice(2, 0, { name: 'ollama', method: 'checkOllama' });
  }

  for (const check of checkMethods) {
    const result = await apiHealthCheck[check.method]();
    results.value.push(result);
    checkedCount.value++;
  }

  report.value = apiHealthCheck.generateReport();
  isChecking.value = false;
};

const clearResults = () => {
  results.value = [];
  report.value = {};
  checkedCount.value = 0;
};

const getStatusText = (status) => {
  const map = {
    online: '在线',
    offline: '离线',
    error: '错误',
    invalid_key: '密钥无效',
    unknown: '未知'
  };
  return map[status] || status;
};

const getLatencyClass = (latency) => {
  if (latency < 1000) return 'good';
  if (latency < 3000) return 'warning';
  return 'bad';
};
</script>

<style scoped>
.health-check-panel {
  padding: 16px;
}

.check-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.check-btn, .clear-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.check-btn {
  background-color: var(--primary-color);
  color: white;
}

.check-btn:hover:not(:disabled) {
  background-color: var(--primary-hover);
}

.check-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.clear-btn {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.clear-btn:hover {
  background-color: var(--bg-hover);
}

/* 进度条 */
.progress-bar {
  position: relative;
  height: 8px;
  background-color: var(--bg-tertiary);
  border-radius: 4px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* 摘要面板 */
.summary-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  background-color: var(--bg-tertiary);
  transition: all 0.2s ease;
}

.summary-item.online {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.summary-item.offline {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.summary-item.error {
  background-color: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.summary-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.summary-count {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.summary-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 结果列表 */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.result-item {
  padding: 16px;
  border-radius: 12px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.result-item.online {
  border-left: 4px solid #10b981;
}

.result-item.offline {
  border-left: 4px solid #ef4444;
}

.result-item.error,
.result-item.invalid_key {
  border-left: 4px solid #f59e0b;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.provider-icon {
  font-size: 24px;
}

.provider-name {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.online {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status-badge.offline {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.status-badge.error,
.status-badge.invalid_key {
  background-color: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

/* 详情 */
.result-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.detail-label {
  color: var(--text-secondary);
  min-width: 80px;
}

.detail-value {
  color: var(--text-primary);
  flex: 1;
}

.detail-value.good {
  color: #10b981;
  font-weight: 500;
}

.detail-value.warning {
  color: #f59e0b;
  font-weight: 500;
}

.detail-value.bad {
  color: #ef4444;
  font-weight: 500;
}

.detail-value.success {
  color: #10b981;
}

.detail-item.error .detail-value {
  color: #ef4444;
}

/* 建议 */
.recommendations {
  padding: 16px;
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
}

.recommendations h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.recommendations li {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  line-height: 1.5;
}

.recommendations li:last-child {
  margin-bottom: 0;
}

.recommendations strong {
  color: var(--text-primary);
}
</style>
