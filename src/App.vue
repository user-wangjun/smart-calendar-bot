<template>
  <AppLayout v-if="isLoggedIn">
    <router-view />
  </AppLayout>

  <!-- 权限请求引导弹窗 -->
  <PermissionRequestModal
    :show="showPermissionModal"
    @close="handlePermissionModalClose"
    @completed="handlePermissionCompleted"
    @skip="handlePermissionSkip"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AppLayout from '@/components/layout/AppLayout.vue';
import PermissionRequestModal from '@/components/PermissionRequestModal.vue';
import { permissionManager } from '@/services/permissionManager';
import { notificationService } from '@/services/notificationService';
import { reminderScheduler } from '@/services/reminderScheduler';
import { useEventsStore } from '@/stores/events';

// 登录状态（临时设为 true 以显示界面，后续接入真实登录逻辑）
const isLoggedIn = ref(true);

// 权限请求弹窗状态
const showPermissionModal = ref(false);

onMounted(async () => {
  // 后续可在此处检查本地存储或调用 API 验证登录状态
  console.log('[App.vue] 应用已挂载，登录状态:', isLoggedIn.value);

  // 初始化权限管理器
  await permissionManager.initialize();

  // 智能判断是否需要显示权限请求
  const checkResult = permissionManager.shouldShowPermissionRequest();
  console.log('[App.vue] 权限检查结果:', checkResult);

  if (checkResult.should) {
    console.log('[App.vue] 需要显示权限请求，原因:', checkResult.reason);
    showPermissionModal.value = true;
  } else {
    // 非首次访问，同步权限状态
    console.log('[App.vue] 无需显示权限请求，原因:', checkResult.reason);
  }

  // 初始化通知服务
  console.log('[App.vue] 初始化通知服务...');
  await notificationService.initialize();
  console.log('[App.vue] 通知服务初始化完成');

  // 初始化提醒调度器
  console.log('[App.vue] 初始化提醒调度器...');
  reminderScheduler.initialize(notificationService);
  console.log('[App.vue] 提醒调度器初始化完成');

  // 从 eventsStore 加载事件并初始化提醒
  console.log('[App.vue] 从 eventsStore 加载事件...');
  const eventsStore = useEventsStore();
  const events = eventsStore.events;
  console.log('[App.vue] 加载到', events.length, '个事件');
  
  // 从事件初始化提醒
  console.log('[App.vue] 从事件初始化提醒...');
  reminderScheduler.initializeFromEvents(events);
  console.log('[App.vue] 提醒初始化完成');
});

/**
 * 处理权限弹窗关闭
 */
const handlePermissionModalClose = () => {
  showPermissionModal.value = false;
};

/**
 * 处理权限授权完成
 */
const handlePermissionCompleted = () => {
  console.log('[App.vue] 权限授权完成');
  showPermissionModal.value = false;
};

/**
 * 处理跳过权限设置
 */
const handlePermissionSkip = () => {
  console.log('[App.vue] 用户跳过权限设置');
  showPermissionModal.value = false;
};
</script>

<style>
/* 全局样式引入 */
@import '@/assets/styles/modern-layout.css';

/* 基础样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
}

/* 滚动条样式优化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--gray-400);
  border-radius: 4px;
  transition: background var(--transition-fast);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gray-500);
}
</style>
