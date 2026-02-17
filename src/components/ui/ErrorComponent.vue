<template>
  <div class="error-component">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">加载失败</h3>
      <p class="error-message">组件加载失败，请刷新页面重试</p>
      <button class="retry-button" @click="retry">
        重试
      </button>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['retry']);

const retry = () => {
  emit('retry');
};
</script>

<style scoped>
.error-component {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  min-height: 300px;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
}

.error-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm);
}

.error-message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg);
  line-height: 1.6;
}

.retry-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--primary-color);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all var(--transition-base);
}

.retry-button:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.retry-button:active {
  transform: translateY(0);
}
</style>
