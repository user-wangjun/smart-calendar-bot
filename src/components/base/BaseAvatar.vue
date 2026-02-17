<template>
  <div
    class="avatar"
    :class="sizeClasses[size]"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="avatar-image"
    />
    <span
      v-else
      class="avatar-placeholder"
      :class="textSizeClasses[size]"
    >
      {{ placeholder || '?' }}
    </span>
    
    <!-- Status Dot -->
    <span
      v-if="status"
      class="avatar-status"
      :class="[
        statusColorClasses[status],
        statusSizeClasses[size]
      ]"
    ></span>
  </div>
</template>

<script setup>
defineProps({
  src: String,
  alt: String,
  placeholder: String,
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  status: {
    type: String,
    validator: (value) => ['online', 'offline', 'busy', 'away'].includes(value)
  }
});

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl'
};

const statusColorClasses = {
  online: 'bg-success-500',
  offline: 'bg-muted',
  busy: 'bg-error-500',
  away: 'bg-warning-500'
};

const statusSizeClasses = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-4 w-4'
};
</script>

<style scoped>
.avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  background: var(--bg-tertiary);
}

.avatar-image {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-weight: 500;
  color: var(--text-secondary);
}

.avatar-status {
  position: absolute;
  bottom: 0;
  right: 0;
  display: block;
  border-radius: 9999px;
  border: 2px solid var(--bg-elevated);
}
</style>
