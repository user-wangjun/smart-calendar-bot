<template>
  <div class="input-wrapper">
    <label v-if="label" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>
    <div class="input-container relative">
      <div v-if="$slots.prefix" class="input-prefix">
        <slot name="prefix" />
      </div>
      <input
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="input-field"
        :class="[
          { 'input-error': error },
          { 'pl-10': $slots.prefix },
          { 'pr-10': $slots.suffix }
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
      <div v-if="$slots.suffix" class="input-suffix">
        <slot name="suffix" />
      </div>
    </div>
    <p v-if="error" class="input-error-text">{{ error }}</p>
    <p v-else-if="hint" class="input-hint">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  type: {
    type: String,
    default: 'text'
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
.input-wrapper {
  width: 100%;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.375rem;
}

.input-required {
  color: var(--color-error);
}

.input-container {
  position: relative;
}

.input-prefix,
.input-suffix {
  position: absolute;
  inset-y: 0;
  left: 0;
  padding-left: 0.75rem;
  display: flex;
  align-items: center;
  pointer-events: none;
  color: var(--text-muted);
}

.input-suffix {
  left: auto;
  right: 0;
  padding-left: 0;
  padding-right: 0.75rem;
}

.input-field {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 0.5rem 0.75rem;
  color: var(--text-primary);
  transition: all var(--duration-fast) ease;
  outline: none;
}

.input-field::placeholder {
  color: var(--text-muted);
}

.input-field:hover:not(:disabled) {
  border-color: var(--border-hover);
}

.input-field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-error {
  border-color: var(--color-error) !important;
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
}

.input-error-text {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-error);
}

.input-hint {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
