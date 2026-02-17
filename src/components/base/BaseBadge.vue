<template>
  <span
    class="badge"
    :class="variant"
  >
    <slot name="icon" />
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'success', 'warning', 'error', 'info'].includes(value)
  }
});
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.badge.default {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.badge.primary {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
  border-color: rgba(59, 130, 246, 0.2);
}

.badge.success {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
  border-color: rgba(34, 197, 94, 0.2);
}

.badge.warning {
  background: rgba(251, 191, 36, 0.1);
  color: var(--color-warning);
  border-color: rgba(251, 191, 36, 0.2);
}

.badge.error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
  border-color: rgba(239, 68, 68, 0.2);
}

.badge.info {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
  border-color: rgba(59, 130, 246, 0.2);
}
</style>
