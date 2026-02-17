<template>
  <div
    class="base-card"
    :class="[
      {
        'hoverable': hoverable,
        'flat': flat,
        'glass': glass,
        'gradient-border': gradientBorder,
        'no-padding': noPadding,
        'animate-in': animateIn
      },
      paddingClass
    ]"
    :style="customStyles"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 渐变边框效果 -->
    <div v-if="gradientBorder" class="gradient-border-bg"></div>

    <!-- 卡片头部 -->
    <div v-if="$slots.header || title" class="card-header" :class="{ 'with-border': headerBorder }">
      <slot name="header">
        <div class="header-content">
          <component v-if="icon" :is="icon" class="header-icon" />
          <div class="header-text">
            <h3 v-if="title" class="header-title">{{ title }}</h3>
            <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
          </div>
        </div>
      </slot>
    </div>

    <!-- 卡片内容 -->
    <div class="card-body" :class="{ 'no-padding': noContentPadding }">
      <slot />
    </div>

    <!-- 卡片底部 -->
    <div v-if="$slots.footer" class="card-footer" :class="{ 'with-border': footerBorder }">
      <slot name="footer" />
    </div>

    <!-- 悬停遮罩效果 -->
    <div v-if="hoverable && !flat" class="hover-overlay"></div>
  </div>
</template>

<script setup>
import { computed, ref, useSlots } from 'vue';

const slots = useSlots();
const props = defineProps({
  // 基础属性
  hoverable: Boolean,
  flat: Boolean,
  glass: Boolean,
  gradientBorder: Boolean,
  noPadding: Boolean,
  noContentPadding: Boolean,
  animateIn: Boolean,

  // 头部属性
  title: String,
  subtitle: String,
  icon: Object,
  headerBorder: {
    type: Boolean,
    default: true
  },

  // 底部属性
  footerBorder: {
    type: Boolean,
    default: true
  },

  // 自定义样式
  background: String,
  borderColor: String,
  shadow: String
});

const emit = defineEmits(['click', 'mouseenter', 'mouseleave']);

const isHovered = ref(false);

// 自定义样式
const customStyles = computed(() => {
  const styles = {};
  if (props.background) styles.background = props.background;
  if (props.borderColor) styles.borderColor = props.borderColor;
  if (props.shadow) styles.boxShadow = props.shadow;
  return styles;
});

// 内边距类
const paddingClass = computed(() => {
  if (props.noPadding) return '';
  // 安全检查 slots 存在性
  const hasHeaderSlot = typeof slots !== 'undefined' && slots.header;
  const hasFooterSlot = typeof slots !== 'undefined' && slots.footer;
  if (!hasHeaderSlot && !props.title && !hasFooterSlot) {
    return 'p-6';
  }
  return '';
});

// 事件处理
const handleClick = (event) => {
  emit('click', event);
};

const handleMouseEnter = (event) => {
  isHovered.value = true;
  emit('mouseenter', event);
};

const handleMouseLeave = (event) => {
  isHovered.value = false;
  emit('mouseleave', event);
};
</script>

<style scoped>
/* 基础卡片样式 - 使用CSS变量系统 */
.base-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-elevated);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.3s var(--ease-out);
  will-change: transform, box-shadow;
  box-shadow: var(--shadow-card);
}

/* 透明主题下的卡片 */
.transparent .base-card {
  background: var(--bg-elevated);
  border-color: var(--border-color);
}

/* 默认阴影 */
.base-card:not(.flat) {
  box-shadow: var(--shadow-card);
}

/* 悬停效果 */
.base-card.hoverable {
  cursor: pointer;
}

.base-card.hoverable:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

.base-card.hoverable:hover .hover-overlay {
  opacity: 1;
}

/* 玻璃态效果 */
.base-card.glass {
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
}

/* 渐变边框效果 */
.base-card.gradient-border {
  border: none;
  background: transparent;
}

.gradient-border-bg {
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: var(--radius-xl);
  background: var(--primary-gradient);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* 进入动画 */
.base-card.animate-in {
  animation: card-enter 0.4s var(--ease-spring);
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 卡片头部 */
.card-header {
  padding: var(--spacing-lg) var(--spacing-xl);
  background: transparent;
}

.card-header.with-border {
  border-bottom: 1px solid var(--border-color);
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.header-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.header-text {
  flex: 1;
  min-width: 0;
}

.header-title {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0;
  line-height: var(--leading-tight);
}

.header-subtitle {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: var(--spacing-xs) 0 0;
  line-height: var(--leading-normal);
}

/* 卡片内容 */
.card-body {
  flex: 1;
  padding: var(--spacing-xl);
  position: relative;
  z-index: 2;
  background: transparent;
}

.card-body.no-padding {
  padding: 0;
}

.base-card.no-padding .card-body {
  padding: 0;
}

/* 卡片底部 */
.card-footer {
  padding: var(--spacing-lg) var(--spacing-xl);
  background: transparent;
}

.card-footer.with-border {
  border-top: 1px solid var(--border-color);
}

/* 悬停遮罩 */
.hover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    var(--bg-tertiary) 0%,
    var(--bg-secondary) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  border-radius: inherit;
  z-index: 1;
}

/* 扁平样式 */
.base-card.flat {
  box-shadow: none;
  border: 1px solid var(--border-color);
}

.base-card.flat.hoverable:hover {
  background: var(--bg-secondary);
  transform: none;
}

/* 焦点样式 */
.base-card.hoverable:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--shadow-focus), var(--shadow-card-hover);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .card-header,
  .card-footer {
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .card-body {
    padding: var(--spacing-lg);
  }

  .header-title {
    font-size: var(--text-base);
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .base-card {
    transition: none;
  }

  .base-card.hoverable:hover {
    transform: none;
  }

  .base-card.animate-in {
    animation: none;
  }

  .hover-overlay {
    transition: none;
  }
}
</style>
