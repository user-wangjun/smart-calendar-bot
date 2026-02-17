<template>
  <button
    :class="[
      'base-button',
      variantClasses[variant],
      sizeClasses[size],
      { 'w-full': block, 'has-icon': icon || loading }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
    :type="type"
  >
    <!-- 波纹效果容器 -->
    <span class="ripple-container" ref="rippleContainer"></span>

    <!-- 加载状态 -->
    <LoadingSpinner
      v-if="loading"
      :size="spinnerSize"
      class="button-spinner"
      :class="spinnerColorClass"
    />

    <!-- 图标 -->
    <component
      :is="icon"
      v-else-if="icon"
      class="button-icon"
      :class="iconSizeClass"
    />

    <!-- 按钮文本 -->
    <span class="button-text">
      <slot />
    </span>
  </button>
</template>

<script setup>
import { computed, ref } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'warning'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  type: {
    type: String,
    default: 'button'
  },
  block: Boolean,
  disabled: Boolean,
  loading: Boolean,
  icon: [Object, Function],
  ripple: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['click']);
const rippleContainer = ref(null);

// 变体样式类
const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
  warning: 'btn-warning'
};

// 尺寸样式类
const sizeClasses = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  xl: 'btn-xl'
};

// 图标尺寸
const iconSizeClass = computed(() => {
  switch (props.size) {
    case 'xs': return 'w-3 h-3';
    case 'sm': return 'w-4 h-4';
    case 'lg': return 'w-5 h-5';
    case 'xl': return 'w-6 h-6';
    default: return 'w-4 h-4';
  }
});

// 加载器尺寸
const spinnerSize = computed(() => {
  if (props.size === 'xs' || props.size === 'sm') return 'xs';
  if (props.size === 'lg' || props.size === 'xl') return 'lg';
  return 'sm';
});

// 加载器颜色
const spinnerColorClass = computed(() => {
  if (['primary', 'danger', 'success', 'warning'].includes(props.variant)) {
    return 'text-white';
  }
  return 'text-primary-600';
});

// 创建波纹效果
const createRipple = (event) => {
  if (!props.ripple || props.disabled || props.loading) return;

  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.classList.add('ripple-effect');
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  rippleContainer.value.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
};

// 点击处理
const handleClick = (event) => {
  createRipple(event);
  emit('click', event);
};
</script>

<style scoped>
/* 基础按钮样式 */
.base-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-semibold);
  border: none;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s var(--ease-out);
  white-space: nowrap;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-button:not(:disabled):active {
  transform: translateY(1px);
}

/* 波纹效果容器 */
.ripple-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  border-radius: inherit;
}

/* 波纹效果 */
:global(.ripple-effect) {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* 按钮尺寸 */
.btn-xs {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--text-xs);
  border-radius: var(--radius-md);
  height: 28px;
}

.btn-sm {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--text-sm);
  border-radius: var(--radius-lg);
  height: 36px;
}

.btn-md {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--text-sm);
  border-radius: var(--radius-lg);
  height: 44px;
}

.btn-lg {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--text-base);
  border-radius: var(--radius-lg);
  height: 52px;
}

.btn-xl {
  padding: var(--spacing-lg) var(--spacing-2xl);
  font-size: var(--text-lg);
  border-radius: var(--radius-xl);
  height: 60px;
}

/* 主要按钮 */
.btn-primary {
  background: var(--primary-gradient);
  color: white;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-gradient-hover);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45);
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
}

/* 次要按钮 */
.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-tertiary);
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.dark .btn-secondary {
  background: var(--dark-bg-elevated);
  border-color: var(--dark-border-color);
}

.dark .btn-secondary:hover:not(:disabled) {
  background: var(--dark-bg-tertiary);
  border-color: var(--dark-border-hover);
}

/* 轮廓按钮 */
.btn-outline {
  background: transparent;
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
  box-shadow: var(--shadow-glow);
}

/* 幽灵按钮 */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.dark .btn-ghost:hover:not(:disabled) {
  background: var(--dark-bg-tertiary);
}

/* 危险按钮 */
.btn-danger {
  background: var(--error-gradient);
  color: white;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
}

.btn-danger:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.45);
  transform: translateY(-1px);
}

/* 成功按钮 */
.btn-success {
  background: var(--success-gradient);
  color: white;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}

.btn-success:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
  transform: translateY(-1px);
}

/* 警告按钮 */
.btn-warning {
  background: var(--warning-gradient);
  color: white;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
}

.btn-warning:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.45);
  transform: translateY(-1px);
}

/* 全宽按钮 */
.w-full {
  width: 100%;
}

/* 按钮内容 */
.button-spinner {
  flex-shrink: 0;
}

.button-icon {
  flex-shrink: 0;
}

.button-text {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 焦点样式 */
.base-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--shadow-focus);
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .base-button {
    transition: none;
  }

  .base-button:not(:disabled):active {
    transform: none;
  }

  .btn-primary:hover:not(:disabled),
  .btn-secondary:hover:not(:disabled),
  .btn-danger:hover:not(:disabled),
  .btn-success:hover:not(:disabled),
  .btn-warning:hover:not(:disabled) {
    transform: none;
  }
}
</style>
