<template>
  <!-- 数据导入导出对话框组件 -->
  <div class="data-transfer-dialog">
    <!-- 导出对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出数据"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="export-content">
        <!-- 数据类型选择 -->
        <div class="section">
          <h4>选择要导出的数据</h4>
          <el-checkbox-group v-model="selectedTypes" class="type-list">
            <el-checkbox label="events">
              <div class="type-item">
                <el-icon><Calendar /></el-icon>
                <span>日程事件</span>
                <el-tag v-if="dataStatus.events?.exists" size="small" type="info">
                  {{ dataStatus.events?.sizeFormatted }}
                </el-tag>
              </div>
            </el-checkbox>
            <el-checkbox label="chat">
              <div class="type-item">
                <el-icon><ChatDotRound /></el-icon>
                <span>聊天记录</span>
                <el-tag v-if="dataStatus.chat?.exists" size="small" type="info">
                  {{ dataStatus.chat?.sizeFormatted }}
                </el-tag>
              </div>
            </el-checkbox>
            <el-checkbox label="settings">
              <div class="type-item">
                <el-icon><Setting /></el-icon>
                <span>应用设置</span>
                <el-tag v-if="dataStatus.settings?.exists" size="small" type="info">
                  {{ dataStatus.settings?.sizeFormatted }}
                </el-tag>
              </div>
            </el-checkbox>
            <el-checkbox label="preferences">
              <div class="type-item">
                <el-icon><User /></el-icon>
                <span>用户偏好</span>
                <el-tag v-if="dataStatus.preferences?.exists" size="small" type="info">
                  {{ dataStatus.preferences?.sizeFormatted }}
                </el-tag>
              </div>
            </el-checkbox>
            <el-checkbox label="profile">
              <div class="type-item">
                <el-icon><Avatar /></el-icon>
                <span>用户档案</span>
                <el-tag v-if="dataStatus.profile?.exists" size="small" type="info">
                  {{ dataStatus.profile?.sizeFormatted }}
                </el-tag>
              </div>
            </el-checkbox>
          </el-checkbox-group>
          <div class="select-all">
            <el-button link @click="selectAllTypes">
              全选
            </el-button>
            <el-button link @click="clearAllTypes">
              清空
            </el-button>
          </div>
        </div>

        <!-- 导出选项 -->
        <div class="section">
          <h4>导出选项</h4>
          <div class="options">
            <el-checkbox v-model="exportOptions.encrypt">
              加密导出（需要密码才能导入）
            </el-checkbox>
            <div v-if="exportOptions.encrypt" class="password-input">
              <el-input
                v-model="exportOptions.password"
                type="password"
                placeholder="设置密码"
                show-password
              />
              <el-input
                v-model="exportOptions.confirmPassword"
                type="password"
                placeholder="确认密码"
                show-password
              />
            </div>
            <el-checkbox v-model="exportOptions.includeApiKeys">
              包含API密钥（谨慎选择）
            </el-checkbox>
          </div>
        </div>

        <!-- 存储空间信息 -->
        <div class="section storage-info">
          <h4>存储空间</h4>
          <div class="storage-bar">
            <el-progress
              :percentage="parseFloat(dataStatus.storageUsed || 0)"
              :status="storageStatus"
            />
            <div class="storage-text">
              已使用 {{ dataStatus.storageUsed }}（{{ dataStatus.totalSizeFormatted }} / 5 MB）
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="exporting"
            :disabled="!canExport"
            @click="handleExport"
          >
            导出数据
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入数据"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="import-content">
        <!-- 文件上传 -->
        <div v-if="!importPreview" class="upload-section">
          <el-upload
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".json,.json.enc"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖拽到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .json 和 .json.enc（加密）格式文件
              </div>
            </template>
          </el-upload>
        </div>

        <!-- 密码输入（加密文件） -->
        <div v-if="needPassword" class="section">
          <el-alert
            title="文件已加密"
            type="info"
            :closable="false"
            show-icon
          />
          <el-input
            v-model="importPassword"
            type="password"
            placeholder="请输入解密密码"
            show-password
            class="password-field"
          />
          <el-button type="primary" @click="decryptAndPreview">
            解密并预览
          </el-button>
        </div>

        <!-- 导入预览 -->
        <div v-if="importPreview" class="preview-section">
          <el-alert
            :title="validationMessage"
            :type="validationType"
            :closable="false"
            show-icon
            class="validation-alert"
          />

          <div class="section">
            <h4>文件信息</h4>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="版本">
                {{ importPreview.version }}
              </el-descriptions-item>
              <el-descriptions-item label="导出时间">
                {{ formatDate(importPreview.exportTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="加密状态">
                {{ importPreview.metadata?.encrypted ? '已加密' : '未加密' }}
              </el-descriptions-item>
              <el-descriptions-item label="包含API密钥">
                {{ importPreview.metadata?.includeApiKeys ? '是' : '否' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="section">
            <h4>数据概览</h4>
            <div class="data-summary">
              <div v-if="importPreview.dataSummary?.events" class="summary-item">
                <el-icon><Calendar /></el-icon>
                <span>日程事件: {{ importPreview.dataSummary.events.count }} 条</span>
                <span v-if="importPreview.dataSummary.events.dateRange" class="range">
                  ({{ importPreview.dataSummary.events.dateRange.earliest }} ~
                  {{ importPreview.dataSummary.events.dateRange.latest }})
                </span>
              </div>
              <div v-if="importPreview.dataSummary?.chatMessages" class="summary-item">
                <el-icon><ChatDotRound /></el-icon>
                <span>聊天记录: {{ importPreview.dataSummary.chatMessages.count }} 条</span>
              </div>
              <div v-if="importPreview.dataSummary?.settings" class="summary-item">
                <el-icon><Setting /></el-icon>
                <span>应用设置</span>
                <el-tag
                  v-if="importPreview.dataSummary.settings.hasApiKeys"
                  size="small"
                  type="warning"
                >
                  包含API密钥
                </el-tag>
              </div>
              <div v-if="importPreview.dataSummary?.preferences" class="summary-item">
                <el-icon><User /></el-icon>
                <span>用户偏好: {{ importPreview.dataSummary.preferences.categories }} 个分类</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h4>导入选项</h4>
            <el-radio-group v-model="importMode">
              <el-radio label="merge">
                合并模式（推荐）
                <div class="radio-desc">新数据与现有数据合并，冲突时保留较新数据</div>
              </el-radio>
              <el-radio label="overwrite">
                覆盖模式
                <div class="radio-desc">完全替换现有数据，请谨慎使用</div>
              </el-radio>
            </el-radio-group>

            <el-checkbox v-model="importApiKeys" class="api-keys-option">
              导入API密钥（将覆盖现有密钥）
            </el-checkbox>
          </div>
        </div>

        <!-- 导入进度 -->
        <div v-if="importing" class="progress-section">
          <el-progress
            :percentage="importProgress"
            :status="importStatus"
            :stroke-width="20"
            striped
            striped-flow
          />
          <div class="progress-text">{{ importStatusText }}</div>
        </div>

        <!-- 导入结果 -->
        <div v-if="importResult" class="result-section">
          <el-alert
            :title="importResult.success ? '导入成功' : '导入失败'"
            :type="importResult.success ? 'success' : 'error'"
            :closable="false"
            show-icon
          />
          <div v-if="importResult.success" class="result-stats">
            <div class="stat-item">
              <span class="label">成功导入:</span>
              <span class="value success">{{ importResult.stats?.success || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">跳过:</span>
              <span class="value warning">{{ importResult.stats?.skipped || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="label">失败:</span>
              <span class="value error">{{ importResult.stats?.failed || 0 }}</span>
            </div>
          </div>
          <div v-if="importResult.warnings?.length" class="result-warnings">
            <h5>警告信息</h5>
            <ul>
              <li v-for="(warning, index) in importResult.warnings" :key="index">
                {{ warning }}
              </li>
            </ul>
          </div>
          <div v-if="importResult.error" class="result-error">
            <el-alert
              :title="importResult.error"
              type="error"
              :closable="false"
            />
            <div v-if="importResult.code" class="error-code">
              错误代码: {{ importResult.code }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importDialogVisible = false">关闭</el-button>
          <el-button
            v-if="importPreview && !importResult"
            type="primary"
            :loading="importing"
            :disabled="!canImport"
            @click="handleImport"
          >
            开始导入
          </el-button>
          <el-button
            v-if="importResult?.success"
            type="success"
            @click="refreshPage"
          >
            刷新页面
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 快速导出提示 -->
    <el-dialog
      v-model="quickExportVisible"
      title="快速导出"
      width="400px"
    >
      <p>即将导出所有数据（不含API密钥），是否继续？</p>
      <template #footer>
        <el-button @click="quickExportVisible = false">取消</el-button>
        <el-button type="primary" :loading="exporting" @click="executeQuickExport">
          确认导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Calendar,
  ChatDotRound,
  Setting,
  User,
  Avatar,
  UploadFilled
} from '@element-plus/icons-vue';
import {
  DataExporter,
  DataImporter,
  DATA_TYPES,
  getBackupStatus
} from '@/services/dataTransferService';

// 定义emits
const emit = defineEmits(['data-imported', 'data-exported']);

// 对话框显示状态
const exportDialogVisible = ref(false);
const importDialogVisible = ref(false);
const quickExportVisible = ref(false);

// 数据状态
const dataStatus = ref({});

// 导出相关
const selectedTypes = ref([]);
const exportOptions = ref({
  encrypt: false,
  password: '',
  confirmPassword: '',
  includeApiKeys: false
});
const exporting = ref(false);

// 导入相关
const importFile = ref(null);
const importPassword = ref('');
const needPassword = ref(false);
const importPreview = ref(null);
const importMode = ref('merge');
const importApiKeys = ref(false);
const importing = ref(false);
const importProgress = ref(0);
const importStatus = ref('');
const importStatusText = ref('');
const importResult = ref(null);

// 计算属性
const canExport = computed(() => {
  if (selectedTypes.value.length === 0) return false;
  if (exportOptions.value.encrypt) {
    return exportOptions.value.password &&
           exportOptions.value.password === exportOptions.value.confirmPassword;
  }
  return true;
});

const canImport = computed(() => {
  return importPreview.value?.validation === 'passed' && !importing.value;
});

const storageStatus = computed(() => {
  const used = parseFloat(dataStatus.value.storageUsed || 0);
  if (used > 90) return 'exception';
  if (used > 70) return 'warning';
  return 'success';
});

const validationMessage = computed(() => {
  if (!importPreview.value) return '';
  if (importPreview.value.validation === 'passed') {
    return '数据验证通过，可以导入';
  }
  return `数据验证失败: ${importPreview.value.validationError}`;
});

const validationType = computed(() => {
  if (!importPreview.value) return 'info';
  return importPreview.value.validation === 'passed' ? 'success' : 'error';
});

// 方法
const loadDataStatus = () => {
  dataStatus.value = getBackupStatus();
};

const selectAllTypes = () => {
  selectedTypes.value = ['events', 'chat', 'settings', 'preferences', 'profile'];
};

const clearAllTypes = () => {
  selectedTypes.value = [];
};

const showExportDialog = () => {
  loadDataStatus();
  selectedTypes.value = [];
  exportOptions.value = {
    encrypt: false,
    password: '',
    confirmPassword: '',
    includeApiKeys: false
  };
  exportDialogVisible.value = true;
};

const showImportDialog = () => {
  importFile.value = null;
  importPassword.value = '';
  needPassword.value = false;
  importPreview.value = null;
  importMode.value = 'merge';
  importApiKeys.value = false;
  importResult.value = null;
  importProgress.value = 0;
  importDialogVisible.value = true;
};

const showQuickExport = () => {
  quickExportVisible.value = true;
};

const handleExport = async () => {
  if (!canExport.value) return;

  exporting.value = true;
  try {
    const exporter = new DataExporter();
    const typeMap = {
      events: DATA_TYPES.EVENTS,
      chat: DATA_TYPES.CHAT,
      settings: DATA_TYPES.SETTINGS,
      preferences: DATA_TYPES.PREFERENCES,
      profile: DATA_TYPES.PROFILE
    };

    const result = await exporter.exportToFile({
      types: selectedTypes.value.map(t => typeMap[t]),
      encrypt: exportOptions.value.encrypt,
      password: exportOptions.value.password,
      includeApiKeys: exportOptions.value.includeApiKeys
    });

    if (result.success) {
      ElMessage.success('数据导出成功');
      exportDialogVisible.value = false;
      emit('data-exported', result);
    } else {
      ElMessage.error(result.error || '导出失败');
    }
  } catch (error) {
    ElMessage.error('导出过程出错: ' + error.message);
  } finally {
    exporting.value = false;
  }
};

const executeQuickExport = async () => {
  exporting.value = true;
  try {
    const exporter = new DataExporter();
    const result = await exporter.quickExport();

    if (result.success) {
      ElMessage.success('快速导出成功');
      quickExportVisible.value = false;
      emit('data-exported', result);
    } else {
      ElMessage.error(result.error || '导出失败');
    }
  } catch (error) {
    ElMessage.error('导出过程出错: ' + error.message);
  } finally {
    exporting.value = false;
  }
};

const handleFileChange = async (file) => {
  importFile.value = file.raw;
  importResult.value = null;

  const importer = new DataImporter();
  const preview = await importer.preview(file.raw);

  if (preview.encrypted) {
    needPassword.value = true;
    importPreview.value = null;
  } else {
    needPassword.value = false;
    importPreview.value = preview;
  }
};

const decryptAndPreview = async () => {
  if (!importPassword.value) {
    ElMessage.warning('请输入密码');
    return;
  }

  const importer = new DataImporter();
  const preview = await importer.preview(importFile.value, importPassword.value);

  if (preview.canPreview) {
    needPassword.value = false;
    importPreview.value = preview;
  } else {
    ElMessage.error(preview.error || '密码错误或文件损坏');
  }
};

const handleImport = async () => {
  if (!canImport.value) return;

  importing.value = true;
  importProgress.value = 0;
  importStatusText.value = '正在导入数据...';

  try {
    // 模拟进度更新
    const progressInterval = setInterval(() => {
      if (importProgress.value < 90) {
        importProgress.value += 10;
      }
    }, 200);

    const importer = new DataImporter();
    const result = await importer.import(importFile.value, {
      mode: importMode.value,
      validate: true,
      password: importPassword.value,
      importApiKeys: importApiKeys.value
    });

    clearInterval(progressInterval);
    importProgress.value = 100;
    importResult.value = result;

    if (result.success) {
      importStatus.value = 'success';
      importStatusText.value = '导入完成';
      ElMessage.success('数据导入成功');
      emit('data-imported', result);
    } else {
      importStatus.value = 'exception';
      importStatusText.value = '导入失败';
      ElMessage.error(result.error || '导入失败');
    }
  } catch (error) {
    importStatus.value = 'exception';
    importStatusText.value = '导入出错';
    importResult.value = {
      success: false,
      error: error.message
    };
    ElMessage.error('导入过程出错: ' + error.message);
  } finally {
    importing.value = false;
  }
};

const refreshPage = () => {
  window.location.reload();
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
};

// 暴露方法给父组件
defineExpose({
  showExportDialog,
  showImportDialog,
  showQuickExport
});

// 生命周期
onMounted(() => {
  loadDataStatus();
});
</script>

<style scoped>
.data-transfer-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.section {
  margin-bottom: 24px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  :deep(.el-checkbox) {
    margin-right: 0;
    height: auto;
  }
}

.type-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  span {
    flex: 1;
  }
}

.select-all {
  margin-top: 12px;
  display: flex;
  gap: 16px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .password-input {
    margin-left: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .el-input {
      width: 300px;
    }
  }
}

.storage-info {
  .storage-bar {
    margin-top: 8px;
  }

  .storage-text {
    margin-top: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.upload-section {
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
  }
}

.password-field {
  margin: 16px 0;
}

.preview-section {
  .validation-alert {
    margin-bottom: 16px;
  }
}

.data-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .summary-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-radius: 4px;

    .el-icon {
      color: var(--el-color-primary);
    }

    .range {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

:deep(.el-radio-group) {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .el-radio {
    height: auto;
    align-items: flex-start;

    .radio-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }
}

.api-keys-option {
  margin-top: 16px;
}

.progress-section {
  padding: 24px;
  text-align: center;

  .progress-text {
    margin-top: 12px;
    color: var(--el-text-color-secondary);
  }
}

.result-section {
  .result-stats {
    display: flex;
    gap: 24px;
    margin-top: 16px;
    padding: 16px;
    background: var(--el-fill-color-light);
    border-radius: 4px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .label {
        color: var(--el-text-color-secondary);
      }

      .value {
        font-weight: 600;
        font-size: 18px;

        &.success {
          color: var(--el-color-success);
        }

        &.warning {
          color: var(--el-color-warning);
        }

        &.error {
          color: var(--el-color-danger);
        }
      }
    }
  }

  .result-warnings {
    margin-top: 16px;

    h5 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: var(--el-color-warning);
    }

    ul {
      margin: 0;
      padding-left: 20px;
      color: var(--el-text-color-secondary);
      font-size: 13px;
    }
  }

  .result-error {
    margin-top: 16px;

    .error-code {
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
