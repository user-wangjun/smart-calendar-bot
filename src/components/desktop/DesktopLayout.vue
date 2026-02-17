<template>
  <div class="desktop-layout">
    <!-- 左侧栏：日历及日期选择 -->
    <aside class="desktop-left-sidebar">
      <DesktopLeftSidebar />
    </aside>

    <!-- 右侧栏：天气信息和生活建议 -->
    <main class="desktop-right-sidebar">
      <DesktopRightSidebar />
    </main>
  </div>
</template>

<script setup>
import DesktopLeftSidebar from './DesktopLeftSidebar.vue';
import DesktopRightSidebar from './DesktopRightSidebar.vue';
</script>

<style scoped>
/* PC端布局样式 */
.desktop-layout {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(180deg, #f9fafb 0%, #e5e7eb 100%);
}

/* 左侧栏：1/3宽度 */
.desktop-left-sidebar {
  width: 33.33%;
  min-width: 400px;
  max-width: 600px;
  background: #ffffff;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
  height: 100vh;
}

/* 右侧栏：2/3宽度 */
.desktop-right-sidebar {
  flex: 1;
  overflow-y: auto;
  height: 100vh;
  padding: 24px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .desktop-left-sidebar {
    min-width: 350px;
  }
}

@media (max-width: 1024px) {
  .desktop-layout {
    flex-direction: column;
  }
  
  .desktop-left-sidebar {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    height: auto;
    min-height: 400px;
  }
  
  .desktop-right-sidebar {
    height: auto;
  }
}

@media (max-width: 768px) {
  .desktop-left-sidebar {
    min-height: 300px;
  }
  
  .desktop-right-sidebar {
    padding: 16px;
  }
}
</style>
