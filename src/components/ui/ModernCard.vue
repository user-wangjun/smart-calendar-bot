<template>
  <div class="modern-card">
    <div class="modern-card-header" v-if="title || icon">
      <div class="header-content">
        <div class="header-icon" v-if="icon">{{ icon }}</div>
        <div class="header-text">
          <h3 class="card-title">{{ title }}</h3>
          <p class="card-subtitle" v-if="subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="header-actions">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="modern-card-body">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.modern-card {
  background: var(--bg-primary, #ffffff);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color, #e5e7eb);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modern-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.modern-card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary, #f9fafb);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-tertiary, #f3f4f6);
  border-radius: 10px;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #111827);
  line-height: 1.4;
}

.card-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  line-height: 1.4;
}

.modern-card-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

/* 深色模式适配 - 使用 .dark 类 */
.dark .modern-card {
  background: var(--dark-bg-primary, #1f2937);
  border-color: var(--dark-border-color, #374151);
}

.dark .modern-card-header {
  background: var(--dark-bg-secondary, #111827);
  border-bottom-color: var(--dark-border-color, #374151);
}

.dark .header-icon {
  background: var(--dark-bg-tertiary, #374151);
}

.dark .card-title {
  color: var(--dark-text-primary, #f9fafb);
}

.dark .card-subtitle {
  color: var(--dark-text-secondary, #9ca3af);
}

/* 系统深色模式适配（作为后备） */
@media (prefers-color-scheme: dark) {
  .modern-card {
    background: var(--bg-primary, #1f2937);
    border-color: var(--border-color, #374151);
  }

  .modern-card-header {
    background: var(--bg-secondary, #111827);
    border-bottom-color: var(--border-color, #374151);
  }

  .header-icon {
    background: var(--bg-tertiary, #374151);
  }

  .card-title {
    color: var(--text-primary, #f9fafb);
  }

  .card-subtitle {
    color: var(--text-secondary, #9ca3af);
  }
}
</style>
