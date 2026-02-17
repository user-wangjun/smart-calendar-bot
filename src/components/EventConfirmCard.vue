<template>
  <div class="event-confirm-card" v-if="parsedEvent">
    <!-- 卡片头部 -->
    <div class="card-header">
      <span class="card-icon">📅</span>
      <span class="card-title">创建新事件</span>
      <span class="confidence-badge" :class="confidenceClass">
        {{ confidenceText }}
      </span>
    </div>

    <!-- 卡片内容 -->
    <div class="card-body">
      <!-- 事件标题 -->
      <div class="field-group">
        <label class="field-label">
          标题
          <span v-if="!editableEvent.title" class="required">*</span>
        </label>
        <div class="field-value">
          <input
            v-model="editableEvent.title"
            type="text"
            class="field-input"
            placeholder="输入事件标题"
            :class="{ 'is-error': !editableEvent.title }"
          />
        </div>
      </div>

      <!-- 时间 -->
      <div class="field-group">
        <label class="field-label">
          时间
          <span v-if="!editableEvent.startTime" class="required">*</span>
        </label>
        <div class="field-value">
          <template v-if="!isEditingTime">
            <span class="time-display" :class="{ 'is-error': !editableEvent.startTime }">
              {{ formatTimeRange(editableEvent) }}
            </span>
            <button class="edit-btn" @click="startEditTime">
              修改
            </button>
          </template>
          <template v-else>
            <div class="time-edit">
              <el-date-picker
                v-model="tempStartTime"
                type="datetime"
                placeholder="选择开始时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 200px"
              />
              <span class="time-separator">至</span>
              <el-date-picker
                v-model="tempEndTime"
                type="datetime"
                placeholder="选择结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 200px"
              />
              <button class="save-btn" @click="saveTimeEdit">保存</button>
              <button class="cancel-btn" @click="cancelTimeEdit">取消</button>
            </div>
          </template>
        </div>
      </div>

      <!-- 地点 -->
      <div class="field-group">
        <label class="field-label">地点</label>
        <div class="field-value">
          <input
            v-model="editableEvent.location"
            type="text"
            class="field-input"
            placeholder="添加地点（可选）"
          />
        </div>
      </div>

      <!-- 参与人 -->
      <div class="field-group">
        <label class="field-label">参与人</label>
        <div class="field-value">
          <input
            v-model="attendeesText"
            type="text"
            class="field-input"
            placeholder="添加参与人，用逗号分隔（可选）"
          />
        </div>
        <div v-if="parsedEvent.event?.attendees?.length" class="attendees-preview">
          <span
            v-for="(attendee, index) in parsedEvent.event.attendees"
            :key="index"
            class="attendee-tag"
          >
            {{ attendee }}
          </span>
        </div>
      </div>

      <!-- 重复 -->
      <div class="field-group">
        <label class="field-label">重复</label>
        <div class="field-value">
          <select v-model="editableEvent.recurrence" class="field-select">
            <option :value="null">不重复</option>
            <option value="daily">每天</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
          </select>
        </div>
      </div>

      <!-- 描述 -->
      <div class="field-group">
        <label class="field-label">描述</label>
        <div class="field-value">
          <textarea
            v-model="editableEvent.description"
            class="field-textarea"
            rows="2"
            placeholder="添加描述（可选）"
          ></textarea>
        </div>
      </div>

      <!-- 缺失信息提示 -->
      <div v-if="missingInfo.length > 0" class="missing-info">
        <span class="warning-icon">⚠️</span>
        <span>请补充以下信息：{{ missingInfo.join('、') }}</span>
      </div>

      <!-- 警告信息 -->
      <div v-if="validation.warnings.length > 0" class="warning-info">
        <div v-for="(warning, index) in validation.warnings" :key="index" class="warning-item">
          <span class="warning-icon">⚡</span>
          <span>{{ warning }}</span>
        </div>
      </div>
    </div>

    <!-- 卡片底部 -->
    <div class="card-footer">
      <button
        class="btn-confirm"
        @click="confirmCreate"
        :disabled="!canConfirm || isCreating"
      >
        <span v-if="isCreating" class="loading-spinner"></span>
        <span v-else>✓ 确认创建</span>
      </button>
      <button class="btn-cancel" @click="cancel" :disabled="isCreating">
        ✕ 取消
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

/**
 * 事件确认卡片组件
 * 用于展示AI解析的事件信息，并允许用户编辑和确认
 */

const props = defineProps({
  /**
   * 解析后的事件数据
   */
  parsedEvent: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['confirm', 'cancel']);

// 可编辑的事件数据
const editableEvent = ref({
  title: '',
  startTime: null,
  endTime: null,
  location: '',
  attendees: [],
  description: '',
  recurrence: null,
});

// 参与人文本
const attendeesText = ref('');

// 是否正在编辑时间
const isEditingTime = ref(false);

// 临时时间值
const tempStartTime = ref(null);
const tempEndTime = ref(null);

// 是否正在创建
const isCreating = ref(false);

// 验证结果
const validation = ref({
  valid: true,
  errors: [],
  warnings: [],
});

// 初始化数据
onMounted(() => {
  initEventData();
});

// 监听parsedEvent变化
watch(() => props.parsedEvent, () => {
  initEventData();
}, { deep: true });

/**
 * 初始化事件数据
 */
function initEventData() {
  if (props.parsedEvent?.event) {
    const event = props.parsedEvent.event;
    editableEvent.value = {
      title: event.title || '',
      startTime: event.startTime || null,
      endTime: event.endTime || null,
      location: event.location || '',
      attendees: event.attendees || [],
      description: event.description || '',
      recurrence: event.recurrence || null,
    };

    // 初始化参与人文本
    attendeesText.value = event.attendees?.join('、') || '';

    // 验证数据
    validateEventData();
  }
}

/**
 * 置信度样式类
 */
const confidenceClass = computed(() => {
  const confidence = props.parsedEvent?.confidence || 0;
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
});

/**
 * 置信度文本
 */
const confidenceText = computed(() => {
  const confidence = props.parsedEvent?.confidence || 0;
  if (confidence >= 0.8) return '高置信度';
  if (confidence >= 0.5) return '中置信度';
  return '低置信度';
});

/**
 * 缺失信息列表
 */
const missingInfo = computed(() => {
  const missing = [];
  if (!editableEvent.value.title) {
    missing.push('事件标题');
  }
  if (!editableEvent.value.startTime) {
    missing.push('开始时间');
  }
  return missing;
});

/**
 * 是否可以确认
 */
const canConfirm = computed(() => {
  return missingInfo.value.length === 0 && validation.value.valid;
});

/**
 * 格式化时间范围
 */
function formatTimeRange(event) {
  if (!event.startTime) return '未设置';

  const start = new Date(event.startTime);
  const end = event.endTime ? new Date(event.endTime) : null;

  // 格式化开始时间
  const startStr = start.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (end) {
    // 如果是同一天，只显示时间
    const isSameDay = start.toDateString() === end.toDateString();
    if (isSameDay) {
      const endStr = end.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${startStr} - ${endStr}`;
    } else {
      const endStr = end.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return `${startStr} - ${endStr}`;
    }
  }

  return startStr;
}

/**
 * 开始编辑时间
 */
function startEditTime() {
  tempStartTime.value = editableEvent.value.startTime;
  tempEndTime.value = editableEvent.value.endTime;
  isEditingTime.value = true;
}

/**
 * 保存时间编辑
 */
function saveTimeEdit() {
  editableEvent.value.startTime = tempStartTime.value;
  editableEvent.value.endTime = tempEndTime.value;
  isEditingTime.value = false;
  validateEventData();
}

/**
 * 取消时间编辑
 */
function cancelTimeEdit() {
  isEditingTime.value = false;
}

/**
 * 验证事件数据
 */
function validateEventData() {
  const errors = [];
  const warnings = [];

  // 验证标题
  if (!editableEvent.value.title || editableEvent.value.title.trim().length === 0) {
    errors.push('事件标题不能为空');
  }

  // 验证时间
  if (!editableEvent.value.startTime) {
    errors.push('开始时间不能为空');
  } else {
    const startDate = new Date(editableEvent.value.startTime);
    const now = new Date();

    // 检查是否是过去时间（允许5分钟误差）
    if (startDate.getTime() < now.getTime() - 5 * 60 * 1000) {
      warnings.push('开始时间已经过去，是否继续创建？');
    }
  }

  // 验证结束时间
  if (editableEvent.value.endTime && editableEvent.value.startTime) {
    const startDate = new Date(editableEvent.value.startTime);
    const endDate = new Date(editableEvent.value.endTime);

    if (endDate.getTime() <= startDate.getTime()) {
      errors.push('结束时间必须晚于开始时间');
    }
  }

  validation.value = {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 确认创建
 */
async function confirmCreate() {
  if (!canConfirm.value) return;

  isCreating.value = true;

  try {
    // 解析参与人
    if (attendeesText.value) {
      editableEvent.value.attendees = attendeesText.value
        .split(/[,，、]/)
        .map(s => s.trim())
        .filter(s => s);
    }

    // 构建最终事件对象
    const finalEvent = {
      ...editableEvent.value,
      // 确保时间格式正确
      startTime: editableEvent.value.startTime,
      endTime: editableEvent.value.endTime,
    };

    emit('confirm', finalEvent);
  } catch (error) {
    console.error('创建事件失败:', error);
  } finally {
    isCreating.value = false;
  }
}

/**
 * 取消
 */
function cancel() {
  emit('cancel');
}
</script>

<style scoped>
.event-confirm-card {
  background: var(--bg-primary, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color, #e0e0e0);
  max-width: 450px;
  margin: 16px 0;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-secondary, #f5f5f5);
}

.card-icon {
  font-size: 20px;
}

.card-title {
  flex: 1;
  font-weight: 600;
  color: var(--text-primary, #333333);
  font-size: 16px;
}

.confidence-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.confidence-badge.high {
  background: #dcfce7;
  color: #166534;
}

.confidence-badge.medium {
  background: #fef3c7;
  color: #92400e;
}

.confidence-badge.low {
  background: #fee2e2;
  color: #991b1b;
}

.card-body {
  padding: 16px;
}

.field-group {
  margin-bottom: 12px;
}

.field-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary, #666666);
  margin-bottom: 4px;
  font-weight: 500;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.field-value {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.field-input,
.field-select,
.field-textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  font-size: 14px;
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #333333);
  transition: border-color 0.2s;
  min-width: 200px;
}

.field-input:focus,
.field-select:focus,
.field-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #409eff);
}

.field-input.is-error,
.time-display.is-error {
  border-color: #ef4444;
  color: #ef4444;
}

.field-textarea {
  resize: vertical;
  min-height: 60px;
}

.time-display {
  flex: 1;
  padding: 8px 0;
  font-size: 14px;
  color: var(--text-primary, #333333);
}

.edit-btn,
.save-btn,
.cancel-btn {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.edit-btn {
  color: var(--primary-color, #409eff);
  background: transparent;
}

.edit-btn:hover {
  background: rgba(64, 158, 255, 0.1);
}

.save-btn {
  color: white;
  background: var(--primary-color, #409eff);
}

.save-btn:hover {
  background: #66b1ff;
}

.cancel-btn {
  color: var(--text-secondary, #666666);
  background: var(--bg-secondary, #f5f5f5);
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.time-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.time-separator {
  color: var(--text-secondary, #666666);
  font-size: 14px;
}

.attendees-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.attendee-tag {
  padding: 2px 8px;
  background: var(--bg-secondary, #f5f5f5);
  border-radius: 12px;
  font-size: 12px;
  color: var(--text-secondary, #666666);
}

.missing-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef3c7;
  border-radius: 6px;
  margin-top: 12px;
  font-size: 13px;
  color: #92400e;
}

.warning-info {
  margin-top: 12px;
}

.warning-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fef9c3;
  border-radius: 6px;
  font-size: 13px;
  color: #854d0e;
  margin-bottom: 4px;
}

.warning-icon {
  flex-shrink: 0;
}

.card-footer {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-color, #e0e0e0);
  background: var(--bg-secondary, #f5f5f5);
}

.btn-confirm,
.btn-cancel {
  flex: 1;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.btn-confirm {
  background: var(--primary-color, #409eff);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #333333);
  border: 1px solid var(--border-color, #e0e0e0);
}

.btn-cancel:hover:not(:disabled) {
  background: var(--bg-secondary, #f5f5f5);
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 时间选择器滚动条优化 */
:deep(.el-time-spinner) {
  overflow-y: auto;
  scrollbar-width: thin;
}

:deep(.el-time-spinner::-webkit-scrollbar) {
  width: 6px;
}

:deep(.el-time-spinner::-webkit-scrollbar-thumb) {
  background-color: var(--border-color, #dcdfe6);
  border-radius: 3px;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .event-confirm-card {
    background: #1f2937;
    border-color: #374151;
  }

  .card-header,
  .card-footer {
    background: #111827;
    border-color: #374151;
  }

  .field-input,
  .field-select,
  .field-textarea {
    background: #1f2937;
    border-color: #374151;
    color: #f9fafb;
  }

  .time-display {
    color: #f9fafb;
  }

  .field-label {
    color: #9ca3af;
  }

  .card-title {
    color: #f9fafb;
  }

  .btn-cancel {
    background: #1f2937;
    color: #f9fafb;
    border-color: #374151;
  }

  .btn-cancel:hover:not(:disabled) {
    background: #374151;
  }

  .attendee-tag {
    background: #374151;
    color: #9ca3af;
  }

  .cancel-btn {
    background: #374151;
    color: #9ca3af;
  }
}
</style>
