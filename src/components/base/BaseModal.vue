<template>
  <Transition name="modal-fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <div
        class="modal-container w-full max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 transform"
        :class="maxWidthClass"
      >
        <!-- Header -->
        <div class="modal-header flex items-center justify-between">
          <h3 class="modal-title">
            <slot name="title">{{ title }}</slot>
          </h3>
          <button
            @click="handleClose"
            class="modal-close-btn transition-colors rounded-lg p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <!-- Content -->
        <div class="modal-content flex-1 overflow-y-auto">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="modal-footer flex justify-end gap-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: String,
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl', 'full'].includes(value)
  },
  closeOnEsc: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const maxWidthClass = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-4xl'
  };
  return sizes[props.size];
});

const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleKeydown = (e) => {
  if (props.closeOnEsc && e.key === 'Escape' && props.modelValue) {
    handleClose();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .transform,
.modal-fade-leave-active .transform {
  transition: transform 0.3s ease-out;
}

.modal-fade-enter-from .transform,
.modal-fade-leave-to .transform {
  transform: scale(0.95) translateY(10px);
}

.modal-container {
  background: var(--bg-elevated);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border-color);
}

.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close-btn {
  color: var(--text-muted);
}

.modal-close-btn:hover {
  color: var(--text-secondary);
  background: var(--bg-tertiary);
}

.modal-content {
  padding: 1rem 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}
</style>
