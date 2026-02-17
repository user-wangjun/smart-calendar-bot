<template>
  <div class="select-wrapper">
    <label v-if="label" class="select-label">
      {{ label }}
      <span v-if="required" class="select-required">*</span>
    </label>
    <div class="select-container relative">
      <select
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        class="select-field"
        :class="{ 'select-error': error }"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="" disabled selected>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <!-- Chevron Down Icon -->
      <div class="select-suffix">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
    </div>
    <p v-if="error" class="select-error-text">{{ error }}</p>
    <p v-else-if="hint" class="select-hint">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  options: {
    type: Array,
    required: true,
  },
  placeholder: String,
  disabled: Boolean,
  required: Boolean,
  error: String,
  hint: String
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.select-wrapper {
  width: 100%;
}

.select-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.375rem;
}

.select-required {
  color: var(--color-error);
}

.select-container {
  position: relative;
}

.select-field {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
  transition: all var(--duration-fast) ease;
  outline: none;
  appearance: none;
  padding-right: 2.5rem;
}

.select-field:hover:not(:disabled) {
  border-color: var(--border-hover);
}

.select-field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.select-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.select-error {
  border-color: var(--color-error) !important;
}

.select-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.select-suffix {
  position: absolute;
  inset-y: 0;
  right: 0;
  padding-right: 0.75rem;
  display: flex;
  align-items: center;
  pointer-events: none;
  color: var(--text-muted);
}

.select-error-text {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-error);
}

.select-hint {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
