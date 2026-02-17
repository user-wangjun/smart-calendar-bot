<template>
  <div class="textarea-wrapper">
    <label v-if="label" class="textarea-label">
      {{ label }}
      <span v-if="required" class="textarea-required">*</span>
    </label>
    <textarea
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      class="textarea-field"
      :class="{ 'textarea-error': error }"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    ></textarea>
    <p v-if="error" class="textarea-error-text">{{ error }}</p>
    <p v-else-if="hint" class="textarea-hint">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: String,
  label: String,
  rows: {
    type: [Number, String],
    default: 3
  },
  placeholder: String,
  disabled: Boolean,
  required: Boolean,
  error: String,
  hint: String
});

defineEmits(['update:modelValue', 'blur', 'focus']);
</script>

<style scoped>
.textarea-wrapper {
  width: 100%;
}

.textarea-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.375rem;
}

.textarea-required {
  color: var(--color-error);
}

.textarea-field {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
  transition: all var(--duration-fast) ease;
  outline: none;
  resize: vertical;
}

.textarea-field::placeholder {
  color: var(--text-muted);
}

.textarea-field:hover:not(:disabled) {
  border-color: var(--border-hover);
}

.textarea-field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.textarea-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.textarea-error {
  border-color: var(--color-error) !important;
}

.textarea-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.textarea-error-text {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-error);
}

.textarea-hint {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
