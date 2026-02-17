<template>
  <div class="avatar-cropper">
    <div class="cropper-header">
      <h3 class="cropper-title">头像设置</h3>
      <p class="cropper-subtitle">上传并裁剪您的头像</p>
    </div>
    
    <div class="cropper-content">
      <!-- 上传区域 -->
      <div class="upload-section" v-if="!imageSrc">
        <div class="upload-area" @click="triggerFileInput" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop" :class="{ 'drag-over': isDragging }">
          <div class="upload-icon">📷</div>
          <p class="upload-text">点击或拖拽图片到此处</p>
          <p class="upload-hint">支持 JPG、PNG、GIF 格式，最大 5MB</p>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleFileSelect"
          class="hidden-input"
        />
      </div>
      
      <!-- 裁剪区域 -->
      <div class="crop-section" v-if="imageSrc">
        <div class="crop-container">
          <canvas ref="cropCanvas" class="crop-canvas"></canvas>
        </div>
        
        <div class="crop-controls">
          <!-- 缩放控制 -->
          <div class="control-group">
            <label class="control-label">缩放</label>
            <input
              v-model="scale"
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              class="control-slider"
            />
            <span class="control-value">{{ Math.round(scale * 100) }}%</span>
          </div>
          
          <!-- 旋转控制 -->
          <div class="control-group">
            <label class="control-label">旋转</label>
            <button @click="rotate(-90)" class="control-btn">↺ -90°</button>
            <button @click="rotate(90)" class="control-btn">↻ +90°</button>
          </div>
          
          <!-- 重置按钮 -->
          <div class="control-group">
            <button @click="resetCrop" class="control-btn reset">重置</button>
          </div>
        </div>
      </div>
      
      <!-- 预览区域 -->
      <div class="preview-section" v-if="imageSrc">
        <h4 class="preview-label">预览</h4>
        <div class="preview-container">
          <canvas ref="previewCanvas" class="preview-canvas" width="128" height="128"></canvas>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="cropper-actions" v-if="imageSrc">
      <button @click="cancelCrop" class="action-btn cancel">取消</button>
      <button @click="saveCrop" class="action-btn save">保存头像</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useUserProfileStore } from '@/stores/userProfile';

const emit = defineEmits(['save', 'cancel']);
const userProfileStore = useUserProfileStore();

const fileInput = ref(null);
const cropCanvas = ref(null);
const previewCanvas = ref(null);
const imageSrc = ref('');
const scale = ref(1);
const rotation = ref(0);
const isDragging = ref(false);

let image = null;
let ctx = null;
let previewCtx = null;

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    loadImage(file);
  }
};

const handleDragOver = () => {
  isDragging.value = true;
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file) {
    loadImage(file);
  }
};

const loadImage = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    imageSrc.value = e.target.result;
    image = new Image();
    image.onload = () => {
      initCropper();
    };
    image.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

const initCropper = () => {
  if (!cropCanvas.value || !previewCanvas.value) return;
  
  ctx = cropCanvas.value.getContext('2d');
  previewCtx = previewCanvas.value.getContext('2d');
  
  drawCrop();
  drawPreview();
};

const drawCrop = () => {
  if (!ctx || !image) return;
  
  const canvas = cropCanvas.value;
  const width = 300;
  const height = 300;
  
  canvas.width = width;
  canvas.height = height;
  
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  
  ctx.translate(width / 2, height / 2);
  ctx.rotate(rotation.value * Math.PI / 180);
  ctx.scale(scale.value, scale.value);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  ctx.restore();
};

const drawPreview = () => {
  if (!previewCtx || !image) return;
  
  const canvas = previewCanvas.value;
  const width = 128;
  const height = 128;
  
  previewCtx.clearRect(0, 0, width, height);
  previewCtx.save();
  
  previewCtx.translate(width / 2, height / 2);
  previewCtx.rotate(rotation.value * Math.PI / 180);
  previewCtx.scale(scale.value, scale.value);
  previewCtx.drawImage(image, -image.width / 2, -image.height / 2, width, height);
  previewCtx.restore();
};

const rotate = (degrees) => {
  rotation.value = (rotation.value + degrees) % 360;
  drawCrop();
  drawPreview();
};

const resetCrop = () => {
  scale.value = 1;
  rotation.value = 0;
  drawCrop();
  drawPreview();
};

const saveCrop = () => {
  if (!previewCanvas.value) return;
  
  const dataUrl = previewCanvas.value.toDataURL('image/png', 0.8);
  userProfileStore.setAvatar(dataUrl);
  emit('save', dataUrl);
  
  alert('头像保存成功！');
};

const cancelCrop = () => {
  imageSrc.value = '';
  scale.value = 1;
  rotation.value = 0;
  emit('cancel');
};

onMounted(() => {
  if (cropCanvas.value && previewCanvas.value) {
    ctx = cropCanvas.value.getContext('2d');
    previewCtx = previewCanvas.value.getContext('2d');
  }
});

onUnmounted(() => {
  if (image) {
    image.src = '';
  }
});
</script>

<style scoped>
.avatar-cropper {
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--border-color);
}

.cropper-header {
  margin-bottom: 24px;
  text-align: center;
}

.cropper-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.cropper-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.cropper-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-section {
  margin-bottom: 20px;
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  background-color: var(--bg-secondary);
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: var(--primary-color);
  background-color: var(--primary-light);
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.upload-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.hidden-input {
  display: none;
}

.crop-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.crop-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 20px;
  border: 1px solid var(--border-color);
}

.crop-canvas {
  max-width: 100%;
  max-height: 300px;
}

.crop-controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  min-width: 60px;
}

.control-slider {
  flex: 1;
  height: 6px;
  cursor: pointer;
}

.control-value {
  font-size: 14px;
  color: var(--text-secondary);
  min-width: 50px;
  text-align: right;
}

.control-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.control-btn:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--primary-color);
}

.control-btn.reset {
  color: var(--error-color);
  border-color: var(--error-color);
}

.control-btn.reset:hover {
  background-color: var(--error-color);
  color: white;
}

.preview-section {
  margin-bottom: 20px;
}

.preview-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: 20px;
  border: 1px solid var(--border-color);
}

.preview-canvas {
  border-radius: 50%;
  border: 2px solid var(--border-color);
}

.cropper-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn.cancel {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
}

.action-btn.cancel:hover {
  background-color: var(--bg-tertiary);
}

.action-btn.save {
  background-color: var(--primary-color);
  color: white;
}

.action-btn.save:hover {
  background-color: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

@media (max-width: 768px) {
  .crop-section {
    flex-direction: column;
  }
  
  .crop-container {
    width: 100%;
  }
  
  .preview-section {
    display: none;
  }
}
</style>