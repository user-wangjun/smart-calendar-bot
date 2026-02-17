<template>
  <div v-if="show" class="permission-modal-overlay" @click.self="handleOverlayClick">
    <div class="permission-modal">
      <!-- 头部 -->
      <div class="modal-header">
        <div class="header-icon">
          <span class="icon">🔐</span>
        </div>
        <h2 class="header-title">欢迎使用智能日历助手</h2>
        <p class="header-subtitle">为了提供更好的服务体验，我们需要一些权限</p>
      </div>

      <!-- 权限列表 -->
      <div class="permissions-list">
        <div
          v-for="(config, type) in permissionTypes"
          :key="type"
          class="permission-item"
          :class="{
            'granted': permissionStatus[type]?.status === 'granted',
            'denied': permissionStatus[type]?.status === 'denied',
            'required': config.required
          }"
        >
          <div class="permission-icon">{{ config.icon }}</div>
          <div class="permission-info">
            <div class="permission-header">
              <span class="permission-name">{{ config.name }}</span>
              <span v-if="config.required" class="required-badge">必选</span>
              <span v-else class="optional-badge">可选</span>
            </div>
            <p class="permission-desc">{{ config.description }}</p>
            
            <!-- 拒绝后的引导 -->
            <div v-if="permissionStatus[type]?.status === 'denied'" class="denied-guide">
              <button class="guide-toggle" @click="toggleGuide(type)">
                <span>如何手动开启权限？</span>
                <span class="toggle-icon">{{ expandedGuides[type] ? '▲' : '▼' }}</span>
              </button>
              <div v-if="expandedGuides[type]" class="guide-content">
                <p class="guide-step">
                  <strong>步骤1：</strong>点击浏览器地址栏左侧的 🔒 或 ⓘ 图标
                </p>
                <p class="guide-step">
                  <strong>步骤2：</strong>找到"通知"选项，将其设置为"允许"
                </p>
                <p class="guide-step">
                  <strong>步骤3：</strong>刷新页面使设置生效
                </p>
                <div class="browser-shortcuts">
                  <p class="shortcut-hint">快捷方式：</p>
                  <ul>
                    <li><strong>Chrome：</strong>设置 → 隐私和安全 → 网站设置 → 通知</li>
                    <li><strong>Firefox：</strong>设置 → 隐私与安全 → 权限 → 通知</li>
                    <li><strong>Edge：</strong>设置 → Cookie 和网站权限 → 通知</li>
                    <li><strong>Safari：</strong>偏好设置 → 网站 → 通知</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div class="permission-status">
            <span v-if="permissionStatus[type]?.status === 'granted'" class="status-icon granted">✓</span>
            <span v-else-if="permissionStatus[type]?.status === 'denied'" class="status-icon denied" @click="toggleGuide(type)">✗</span>
            <span v-else-if="requestingPermission === type" class="status-icon loading">
              <span class="spinner"></span>
            </span>
            <button
              v-else
              class="authorize-btn"
              @click="requestSinglePermission(type)"
              :disabled="requestingPermission !== null"
            >
              授权
            </button>
          </div>
        </div>
      </div>

      <!-- 提示信息 -->
      <div v-if="hasDeniedRequired" class="warning-message">
        <span class="warning-icon">⚠️</span>
        <div class="warning-content">
          <span class="warning-title">部分必要权限被拒绝</span>
          <span class="warning-desc">可能影响日程提醒等核心功能，请按上方引导手动开启</span>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <button class="btn-skip" @click="handleSkip">
          稍后设置
        </button>
        <button
          class="btn-continue"
          @click="handleContinue"
          :class="{ 'btn-warning': hasDeniedRequired }"
        >
          {{ continueButtonText }}
        </button>
      </div>

      <!-- 帮助提示 -->
      <div class="help-text">
        <p>💡 您可以随时在设置中修改权限配置</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive } from 'vue';
import { permissionManager, PERMISSION_TYPES } from '@/services/permissionManager';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'completed', 'skip']);

const permissionTypes = ref(PERMISSION_TYPES);
const permissionStatus = ref({});
const requestingPermission = ref(null);
const requestResults = ref({});
const expandedGuides = reactive({});

/**
 * 初始化权限状态
 */
onMounted(async () => {
  await permissionManager.initialize();
  permissionStatus.value = permissionManager.getAllPermissionsStatus();
});

/**
 * 监听显示状态
 */
watch(() => props.show, async (newVal) => {
  if (newVal) {
    await permissionManager.syncWithBrowser();
    permissionStatus.value = permissionManager.getAllPermissionsStatus();
  }
});

/**
 * 切换引导展开状态
 */
const toggleGuide = (type) => {
  expandedGuides[type] = !expandedGuides[type];
};

/**
 * 请求单个权限
 */
const requestSinglePermission = async (type) => {
  requestingPermission.value = type;

  try {
    const result = await permissionManager.requestPermission(type);
    requestResults.value[type] = result;

    // 更新状态
    await permissionManager.syncWithBrowser();
    permissionStatus.value = permissionManager.getAllPermissionsStatus();
  } catch (error) {
    console.error(`请求权限失败 [${type}]:`, error);
  } finally {
    requestingPermission.value = null;
  }
};

/**
 * 是否有必要的权限被拒绝
 */
const hasDeniedRequired = computed(() => {
  for (const [type, config] of Object.entries(PERMISSION_TYPES)) {
    if (config.required) {
      const status = permissionStatus.value[type]?.status;
      if (status === 'denied') {
        return true;
      }
    }
  }
  return false;
});

/**
 * 是否可以继续
 */
const canContinue = computed(() => {
  // 必要权限已授予才能继续
  return permissionManager.areRequiredPermissionsGranted();
});

/**
 * 继续按钮文本
 */
const continueButtonText = computed(() => {
  if (canContinue.value) {
    return '开始使用';
  }
  if (hasDeniedRequired.value) {
    return '我知道了';
  }
  return '请授权必要权限';
});

/**
 * 处理跳过
 */
const handleSkip = () => {
  permissionManager.permissionsRequested = true;
  permissionManager.saveToStorage();
  emit('skip');
  emit('close');
};

/**
 * 处理继续
 */
const handleContinue = () => {
  permissionManager.permissionsRequested = true;
  permissionManager.saveToStorage();
  emit('completed');
  emit('close');
};

/**
 * 点击遮罩层
 */
const handleOverlayClick = () => {
  // 允许点击遮罩关闭
  handleContinue();
};
</script>

<style scoped>
.permission-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.permission-modal {
  background: var(--main-bg-primary, #ffffff);
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dark .permission-modal {
  background: var(--dark-bg-primary, #1a1a2e);
}

.modal-header {
  text-align: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--main-border-primary, #e5e7eb);
}

.dark .modal-header {
  border-bottom-color: var(--dark-border-primary, #2d2d44);
}

.header-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon .icon {
  font-size: 32px;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--main-text-primary, #1f2937);
  margin-bottom: 8px;
}

.dark .header-title {
  color: var(--dark-text-primary, #f3f4f6);
}

.header-subtitle {
  font-size: 14px;
  color: var(--main-text-secondary, #6b7280);
}

.dark .header-subtitle {
  color: var(--dark-text-secondary, #9ca3af);
}

.permissions-list {
  padding: 16px 24px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--main-bg-secondary, #f9fafb);
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.dark .permission-item {
  background: var(--dark-bg-secondary, #16162a);
}

.permission-item.granted {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.permission-item.denied {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.permission-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.permission-info {
  flex: 1;
  min-width: 0;
}

.permission-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.permission-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--main-text-primary, #1f2937);
}

.dark .permission-name {
  color: var(--dark-text-primary, #f3f4f6);
}

.required-badge {
  font-size: 11px;
  padding: 2px 6px;
  background: #ef4444;
  color: white;
  border-radius: 4px;
  font-weight: 500;
}

.optional-badge {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--main-border-primary, #e5e7eb);
  color: var(--main-text-secondary, #6b7280);
  border-radius: 4px;
  font-weight: 500;
}

.dark .optional-badge {
  background: var(--dark-border-primary, #2d2d44);
  color: var(--dark-text-secondary, #9ca3af);
}

.permission-desc {
  font-size: 13px;
  color: var(--main-text-secondary, #6b7280);
  line-height: 1.4;
}

.dark .permission-desc {
  color: var(--dark-text-secondary, #9ca3af);
}

/* 拒绝后引导样式 */
.denied-guide {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--main-border-primary, #e5e7eb);
}

.dark .denied-guide {
  border-top-color: var(--dark-border-primary, #2d2d44);
}

.guide-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  color: #3b82f6;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.guide-toggle:hover {
  background: rgba(59, 130, 246, 0.15);
}

.toggle-icon {
  font-size: 10px;
}

.guide-content {
  margin-top: 12px;
  padding: 12px;
  background: var(--main-bg-secondary, #f9fafb);
  border-radius: 8px;
}

.dark .guide-content {
  background: rgba(0, 0, 0, 0.2);
}

.guide-step {
  font-size: 12px;
  color: var(--main-text-primary, #1f2937);
  margin-bottom: 8px;
  line-height: 1.5;
}

.dark .guide-step {
  color: var(--dark-text-primary, #f3f4f6);
}

.browser-shortcuts {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--main-border-primary, #e5e7eb);
}

.dark .browser-shortcuts {
  border-top-color: var(--dark-border-primary, #2d2d44);
}

.shortcut-hint {
  font-size: 12px;
  font-weight: 600;
  color: var(--main-text-secondary, #6b7280);
  margin-bottom: 8px;
}

.dark .shortcut-hint {
  color: var(--dark-text-secondary, #9ca3af);
}

.browser-shortcuts ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.browser-shortcuts li {
  font-size: 11px;
  color: var(--main-text-muted, #9ca3af);
  margin-bottom: 6px;
  padding-left: 12px;
  position: relative;
}

.browser-shortcuts li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #3b82f6;
}

.dark .browser-shortcuts li {
  color: var(--dark-text-muted, #6b7280);
}

.permission-status {
  flex-shrink: 0;
}

.status-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.status-icon.granted {
  background: #22c55e;
  color: white;
}

.status-icon.denied {
  background: #ef4444;
  color: white;
}

.status-icon.loading {
  background: var(--main-border-primary, #e5e7eb);
}

.dark .status-icon.loading {
  background: var(--dark-border-primary, #2d2d44);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--main-text-secondary, #6b7280);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.authorize-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.authorize-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.authorize-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.warning-message {
  margin: 0 24px;
  padding: 12px 16px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.warning-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.warning-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.warning-title {
  font-size: 13px;
  font-weight: 600;
  color: #f59e0b;
}

.warning-desc {
  font-size: 12px;
  color: #d97706;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--main-border-primary, #e5e7eb);
}

.dark .modal-footer {
  border-top-color: var(--dark-border-primary, #2d2d44);
}

.btn-skip {
  flex: 1;
  padding: 12px 24px;
  background: transparent;
  border: 1px solid var(--main-border-primary, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--main-text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .btn-skip {
  border-color: var(--dark-border-primary, #2d2d44);
  color: var(--dark-text-secondary, #9ca3af);
}

.btn-skip:hover:not(:disabled) {
  background: var(--main-bg-secondary, #f9fafb);
}

.dark .btn-skip:hover:not(:disabled) {
  background: var(--dark-bg-secondary, #16162a);
}

.btn-skip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-continue {
  flex: 2;
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-continue:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-continue:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-continue.btn-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.btn-continue.btn-warning:hover {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.help-text {
  text-align: center;
  padding: 12px 24px 24px;
}

.help-text p {
  font-size: 12px;
  color: var(--main-text-muted, #9ca3af);
}

.dark .help-text p {
  color: var(--dark-text-muted, #6b7280);
}
</style>
