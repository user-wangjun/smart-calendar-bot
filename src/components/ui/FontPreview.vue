<template>
  <div class="font-preview">
    <div class="preview-header">
      <h4 class="preview-title">字体预览</h4>
      <p class="preview-subtitle">实时预览不同字体的显示效果</p>
    </div>
    
    <div class="preview-content" :style="{ fontSize: `${fontSize}px`, fontFamily: currentFont }">
      <div class="preview-section">
        <h3 class="preview-heading">标题示例</h3>
        <p class="preview-paragraph">
          这是一段示例文本，用于展示字体的显示效果。
          您可以在这里看到不同字体的区别。
        </p>
      </div>
      
      <div class="preview-section">
        <h4 class="preview-subheading">副标题示例</h4>
        <p class="preview-paragraph">
          字体大小为{{ fontSize }}像素，字体风格为{{ fontName }}。
        </p>
      </div>
      
      <div class="preview-section">
        <p class="preview-text">
          数字示例：0123456789
        </p>
        <p class="preview-text">
          英文字母：ABCDEFGHIJKLMNOPQRSTUVWXYZ
        </p>
        <p class="preview-text">
          中文字符：abcdefghijklmnopqrstuvwxyz
        </p>
      </div>
      
      <div class="preview-section">
        <p class="preview-quote">
          "优秀的设计不仅仅是外观，更是功能和美学的完美结合。"
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  fontSize: {
    type: Number,
    default: 16
  },
  fontFamily: {
    type: String,
    default: 'system'
  }
});

const fontName = computed(() => {
  const fontMap = {
    system: '系统默认',
    'sans-serif': '无衬线体',
    serif: '衬线体',
    monospace: '等宽字体',
    cursive: '手写体',
    fantasy: '艺术字体'
  };
  return fontMap[props.fontFamily] || '系统默认';
});

const currentFont = computed(() => {
  const fontMap = {
    system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    'sans-serif': '"Helvetica Neue", Helvetica, Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", Times, serif',
    monospace: '"Courier New", Courier, monospace',
    cursive: '"Brush Script MT", cursive',
    fantasy: '"Comic Sans MS", cursive'
  };
  return fontMap[props.fontFamily] || fontMap.system;
});
</script>

<style scoped>
.font-preview {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 20px;
  border: 1px solid var(--border-color);
}

.preview-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.preview-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-section {
  padding: 16px;
  background-color: var(--bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.preview-heading {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.preview-subheading {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.preview-paragraph {
  font-size: inherit;
  color: var(--text-primary);
  line-height: 1.6;
  margin: 0 0 8px 0;
}

.preview-text {
  font-size: inherit;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.preview-quote {
  font-size: inherit;
  color: var(--text-primary);
  font-style: italic;
  line-height: 1.8;
  padding: 16px;
  background-color: var(--bg-tertiary);
  border-left: 4px solid var(--primary-color);
  border-radius: var(--radius-sm);
  margin: 0;
}

@media (max-width: 768px) {
  .font-preview {
    padding: 16px;
  }
  
  .preview-section {
    padding: 12px;
  }
  
  .preview-heading {
    font-size: 20px;
  }
  
  .preview-subheading {
    font-size: 18px;
  }
}
</style>