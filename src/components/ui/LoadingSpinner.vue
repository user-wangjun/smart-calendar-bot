<template>
  <div class="loading-spinner-container">
    <div class="loading-spinner"></div>
    <p class="loading-text">加载中...</p>
  </div>
</template>

<script setup>
</script>

<style scoped>
.loading-spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  min-height: 200px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: var(--spacing-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  font-weight: var(--font-normal);
}
</style>
