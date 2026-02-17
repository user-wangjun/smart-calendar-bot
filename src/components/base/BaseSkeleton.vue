<template>
  <div
    class="animate-pulse bg-surface-200 dark:bg-surface-700 rounded"
    :class="[
      { 'rounded-full': circle },
      className
    ]"
    :style="{
      width: width,
      height: height
    }"
  ></div>
</template>

<script setup>
defineProps({
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '1rem'
  },
  circle: Boolean,
  className: {
    type: String,
    default: ''
  }
});
</script>
