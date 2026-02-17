<template>
  <div class="app-layout" :class="{ 'has-dynamic-background': settingsStore.backgroundType === 'dynamic' || isVideoBackground }">
    <!-- 视频背景层 -->
    <Transition name="video-background" mode="out-in">
      <video
        v-if="isVideoBackground"
        :key="`video-${settingsStore.backgroundImage}`"
        class="video-background"
        :src="settingsStore.backgroundImage"
        autoplay
        loop
        muted
        playsinline
      />
    </Transition>
    
    <!-- 动态背景层 - 添加过渡效果 -->
    <Transition name="dynamic-background" mode="out-in">
      <StarryBackground v-if="settingsStore.backgroundTheme === 'starry' && !isVideoBackground" :key="`starry-${Date.now()}`" ref="starryRef" />
      <OceanDynamic v-else-if="settingsStore.backgroundTheme === 'ocean' && !isVideoBackground" :key="`ocean-${Date.now()}`" ref="oceanRef" />
      <FireworksDynamic v-else-if="settingsStore.backgroundTheme === 'fireworks' && !isVideoBackground" :key="`fireworks-${Date.now()}`" ref="fireworksRef" />
    </Transition>
    
    <!-- 顶部导航栏 - 唯一导航栏 -->
    <header class="app-navbar">
      <div class="navbar-container">
        <!-- Logo区域 -->
        <div class="navbar-brand" @click="$router.push('/')">
          <div class="brand-icon">
            <Calendar class="w-6 h-6 text-white" />
          </div>
          <span class="brand-text">智能日历</span>
        </div>

        <!-- 主导航菜单 -->
        <nav class="navbar-menu">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: $route.path === item.path }"
          >
            <component :is="item.icon" class="nav-icon" />
            <span class="nav-text">{{ item.label }}</span>
          </router-link>
        </nav>

        <!-- 用户操作区域 -->
        <div class="navbar-actions">
          <div class="notification-btn-container" ref="notificationBtnRef">
            <button
              class="action-button notification-btn"
              @click="toggleNotifications"
              :class="{ 'has-badge': notificationCount > 0 }"
            >
              <Bell class="w-5 h-5" />
              <span v-if="notificationCount > 0" class="notification-badge">{{ notificationCount }}</span>
            </button>
            <NotificationPanel />
          </div>

          <div class="theme-switcher-container" ref="themeMenuRef">
            <button
              class="action-button theme-btn"
              @click="toggleThemeMenu"
              aria-label="切换主题"
            >
              <component :is="currentThemeIcon" class="w-5 h-5" />
            </button>

            <Transition name="dropdown">
              <div v-if="isThemeMenuOpen" class="theme-menu-dropdown">
                <div
                  v-for="mode in themeModes"
                  :key="mode.value"
                  class="menu-item"
                  :class="{ 'menu-item-active': settingsStore.themeMode === mode.value }"
                  @click.stop="selectThemeMode(mode.value)"
                >
                  <component :is="mode.icon" class="menu-icon w-4 h-4" />
                  <span class="menu-text">{{ mode.label }}</span>
                </div>
              </div>
            </Transition>
          </div>

          <div class="user-profile-container" ref="userMenuRef">
            <div class="user-profile" @click="toggleUserMenu">
              <div class="user-avatar">
                <User class="w-5 h-5" />
              </div>
              <span class="user-name">{{ userName }}</span>
              <ChevronDown
                class="dropdown-arrow w-4 h-4"
                :class="{ 'rotate-180': isUserMenuOpen }"
              />
            </div>

            <!-- 用户菜单下拉面板 -->
            <Transition name="dropdown">
              <div v-if="isUserMenuOpen" class="user-menu-dropdown">
                <div
                  v-for="(menuItem, index) in userMenuItems"
                  :key="index"
                  class="menu-item"
                  :class="{ 'menu-divider': menuItem.divider }"
                  @click.stop="handleUserMenuAction(menuItem.action)"
                >
                  <component v-if="menuItem.icon" :is="menuItem.icon" class="menu-icon w-4 h-4" />
                  <span v-if="menuItem.label" class="menu-text">{{ menuItem.label }}</span>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- 移动端菜单按钮 -->
        <button
          class="mobile-menu-toggle"
          :class="{ active: isMobileMenuOpen }"
          @click="toggleMobileMenu"
          aria-label="切换菜单"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>

    <!-- 主体内容区域 -->
    <div class="app-main">
      <!-- 侧边栏 -->
      <aside class="app-sidebar" :class="{ open: isSidebarOpen }">
        <div class="sidebar-header">
          <h3 class="sidebar-title">快速访问</h3>
          <button class="sidebar-close" @click="closeSidebar" aria-label="关闭侧边栏">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="sidebar-content">
          <!-- 今日事件 -->
          <div class="sidebar-section">
            <h4 class="section-title">
              <Clock class="w-4 h-4" />
              今日事件
            </h4>
            <div class="event-list">
              <div
                v-for="event in todayEvents"
                :key="event.id"
                class="event-item"
                @click="goToEvent(event)"
              >
                <div class="event-time">{{ formatTime(event.startDate) }}</div>
                <div class="event-title">{{ event.title }}</div>
              </div>
              <div v-if="todayEvents.length === 0" class="empty-state">
                <CalendarX class="w-8 h-8 mb-2" />
                <p>今日暂无事件</p>
              </div>
            </div>
          </div>

          <!-- 快捷操作 -->
          <div class="sidebar-section">
            <h4 class="section-title">
              <Zap class="w-4 h-4" />
              快捷操作
            </h4>
            <div class="quick-actions">
              <button class="quick-action-btn" @click="quickAddEvent">
                <Plus class="w-4 h-4" />
                添加事件
              </button>
              <button class="quick-action-btn" @click="viewCalendar">
                <Calendar class="w-4 h-4" />
                查看日历
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- 主内容区域 -->
      <main class="app-content">
        <!-- 路由内容 - 简化版，移除Transition避免DOM冲突 -->
        <router-view />
      </main>
    </div>

    <!-- 移动端侧边栏遮罩 -->
    <Transition name="fade">
      <div v-if="isSidebarOpen" class="sidebar-overlay" @click="closeSidebar"></div>
    </Transition>

    <!-- 移动端底部导航 -->
    <nav class="mobile-bottom-nav" v-show="isMobile">
      <router-link
        v-for="item in mobileNavItems"
        :key="item.path"
        :to="item.path"
        class="mobile-nav-item"
        :class="{ active: $route.path === item.path }"
      >
        <component :is="item.icon" class="mobile-nav-icon" />
        <span class="mobile-nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEventsStore } from '@/stores/events';
import { useSettingsStore } from '@/stores/settings';
import { useUserProfileStore } from '@/stores/userProfile';
import { useNotificationsStore } from '@/stores/notifications';
import StarryBackground from '@/components/background/StarryBackground.vue';
import OceanDynamic from '@/components/background/OceanDynamic.vue';
import FireworksDynamic from '@/components/background/FireworksDynamic.vue';
import NotificationPanel from '@/components/NotificationPanel.vue';

// 动态背景组件引用
const starryRef = ref(null);
const oceanRef = ref(null);
const fireworksRef = ref(null);

// 导入Lucide图标
import {
  Calendar,
  Home,
  Cloud,
  Bot,
  Settings,
  Bell,
  User,
  ChevronDown,
  X,
  Clock,
  CalendarX,
  Zap,
  Plus,
  HelpCircle,
  Info,
  LogOut,
  Menu,
  Sun,
  Moon,
  Monitor,
  Layers
} from 'lucide-vue-next';

// 路由和状态管理
const router = useRouter();
const route = useRoute();
const eventsStore = useEventsStore();
const settingsStore = useSettingsStore();
const userProfileStore = useUserProfileStore();
const notificationsStore = useNotificationsStore();

// 监听路由错误
router.onError((error) => {
  console.error('[AppLayout] 路由错误:', error);
});

// 导航项配置
const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/calendar', label: '日历', icon: Calendar },
  { path: '/weather', label: '天气', icon: Cloud },
  { path: '/ai-assistant', label: 'AI助手', icon: Bot },
  { path: '/settings', label: '设置', icon: Settings }
];

// 移动端导航项（简化版）
const mobileNavItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/calendar', label: '日历', icon: Calendar },
  { path: '/ai-assistant', label: 'AI', icon: Bot },
  { path: '/settings', label: '设置', icon: Settings }
];

// 用户菜单项
const userMenuItems = [
  { label: '设置', icon: Settings, action: 'settings' },
  { label: '帮助', icon: HelpCircle, action: 'help' },
  { divider: true },
  { label: '关于', icon: Info, action: 'about' }
];

// 状态
const isSidebarOpen = ref(false);
const isMobileMenuOpen = ref(false);
const isUserMenuOpen = ref(false);
const isMobile = ref(false);
const userMenuRef = ref(null);
const isThemeMenuOpen = ref(false);
const themeMenuRef = ref(null);
const notificationBtnRef = ref(null);

// 计算属性 - 通知数量
const notificationCount = computed(() => notificationsStore.unreadCount);

// 用户名 - 从 userProfileStore 获取，实现实时同步
const userName = computed(() => userProfileStore.nickname || '用户');

/**
 * 主题模式配置
 * 顺序：跟随系统 → 浅色 → 深色 → 透明
 */
const themeModes = [
  { value: 'system', label: '跟随系统', icon: Monitor },
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'transparent', label: '透明', icon: Layers }
];

/**
 * 当前主题图标
 */
const currentThemeIcon = computed(() => {
  const mode = settingsStore.themeMode;
  const modeMap = {
    light: Sun,
    dark: Moon,
    system: Monitor,
    transparent: Layers
  };
  return modeMap[mode] || Sun;
});

// 计算属性
const isVideoBackground = computed(() => {
  return settingsStore.backgroundFormat && settingsStore.backgroundFormat.includes('video');
});

const todayEvents = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return eventsStore.events?.filter(event => {
    const eventDate = new Date(event.startDate).toISOString().split('T')[0];
    return eventDate === today;
  }).slice(0, 5) || [];
});

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

// 方法
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
  toggleSidebar();
};

const toggleNotifications = (event) => {
  event.stopPropagation();
  notificationsStore.togglePanel();
};

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

/**
 * 切换主题菜单显示
 */
const toggleThemeMenu = () => {
  isThemeMenuOpen.value = !isThemeMenuOpen.value;
  isUserMenuOpen.value = false;
};

/**
 * 选择主题模式
 * @param {string} mode - 主题模式
 */
const selectThemeMode = (mode) => {
  settingsStore.setThemeMode(mode);
  isThemeMenuOpen.value = false;
};

/**
 * 点击外部关闭主题菜单
 */
const handleThemeMenuClickOutside = (event) => {
  if (themeMenuRef.value && !themeMenuRef.value.contains(event.target)) {
    isThemeMenuOpen.value = false;
  }
};

const handleUserMenuAction = (action) => {
  isUserMenuOpen.value = false;

  switch (action) {
    case 'settings':
      router.push('/settings');
      break;
    case 'help':
      // 打开帮助对话框或页面
      break;
    case 'about':
      // 打开关于对话框
      break;
  }
};

const quickAddEvent = () => {
  router.push('/calendar');
  closeSidebar();
};

const viewCalendar = () => {
  router.push('/calendar');
  closeSidebar();
};

const goToEvent = (event) => {
  router.push('/calendar');
  closeSidebar();
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

// 点击外部关闭用户菜单
const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    isUserMenuOpen.value = false;
  }
  handleThemeMenuClickOutside(event);
};

/**
 * 监听背景主题变化
 * 确保切换时动画正确重新初始化
 */
watch(() => settingsStore.backgroundTheme, (newTheme, oldTheme) => {
  if (newTheme !== oldTheme) {
    nextTick(() => {
      // 重新应用背景设置
      settingsStore.applyBackground();
      
      // 延迟确保新组件挂载后触发重新初始化
      setTimeout(() => {
        if (newTheme === 'starry' && starryRef.value) {
          starryRef.value.reinitialize?.();
        } else if (newTheme === 'ocean' && oceanRef.value) {
          oceanRef.value.reinitialize?.();
        } else if (newTheme === 'fireworks' && fireworksRef.value) {
          fireworksRef.value.reinitialize?.();
        }
      }, 100);
    });
  }
}, { immediate: false });

// 初始化
onMounted(() => {
  eventsStore.loadFromLocalStorage?.();
  checkMobile();
  window.addEventListener('resize', checkMobile);
  document.addEventListener('click', handleClickOutside);
  
  // 确保背景设置在 DOM 渲染完成后重新应用
  // 使用简单可靠的机制，避免复杂重试导致延迟
  nextTick(() => {
    // 立即应用
    settingsStore.applyBackground();
    
    // 双重保障
    setTimeout(() => {
      settingsStore.applyBackground();
      
      // 触发动态背景组件重新初始化
      if (settingsStore.backgroundTheme === 'starry' && starryRef.value) {
        starryRef.value.reinitialize?.();
      } else if (settingsStore.backgroundTheme === 'ocean' && oceanRef.value) {
        oceanRef.value.reinitialize?.();
      } else if (settingsStore.backgroundTheme === 'fireworks' && fireworksRef.value) {
        fireworksRef.value.reinitialize?.();
      }
    }, 100);
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* 应用布局容器 */
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: transparent;
}

/* 动态背景模式下的布局样式 */
.app-layout.has-dynamic-background {
  background-color: transparent;
}

.app-layout.has-dynamic-background .app-content {
  background-color: transparent;
}

.app-layout.has-dynamic-background .app-navbar,
.app-layout.has-dynamic-background .app-sidebar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.dark .app-layout.has-dynamic-background .app-navbar,
.dark .app-layout.has-dynamic-background .app-sidebar {
  background: rgba(15, 23, 42, 0.85);
}

/* 顶部导航栏 - 固定定位 */
.app-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-fixed);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-sm);
}

.dark .app-navbar {
  background: rgba(15, 23, 42, 0.85);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
}

/* Logo区域 */
.navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-weight: var(--font-bold);
  font-size: var(--text-xl);
  color: var(--text-primary);
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.navbar-brand:hover {
  opacity: 0.8;
}

.brand-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-gradient);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: transform 0.3s var(--ease-spring), box-shadow 0.3s ease;
}

.navbar-brand:hover .brand-icon {
  transform: scale(1.05) rotate(-5deg);
  box-shadow: var(--shadow-glow);
}

/* 导航菜单 */
.navbar-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  transition: all 0.2s var(--ease-out);
  position: relative;
}

.nav-item:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--primary-gradient);
  color: white;
  box-shadow: var(--shadow-md);
}

.nav-item.active:hover {
  box-shadow: var(--shadow-glow);
}

.nav-icon {
  width: 18px;
  height: 18px;
}

/* 用户操作区域 */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.notification-btn-container {
  position: relative;
}

.action-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.action-button.has-badge {
  color: var(--primary-color);
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--error-gradient);
  color: white;
  font-size: 10px;
  font-weight: var(--font-bold);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.3s var(--ease-spring);
}

/* 主题切换按钮 */
.theme-btn:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

/* 主题菜单下拉 */
.theme-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  min-width: 160px;
  z-index: var(--z-dropdown);
  overflow: hidden;
}

.dark .theme-menu-dropdown {
  background: var(--dark-bg-elevated);
  border-color: var(--dark-border-color);
}

.theme-menu-dropdown .menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.theme-menu-dropdown .menu-item:hover {
  background-color: var(--bg-tertiary);
}

.theme-menu-dropdown .menu-item-active {
  background-color: var(--primary-color);
  color: white;
}

.theme-menu-dropdown .menu-item-active:hover {
  background-color: var(--primary-hover);
}

.theme-menu-dropdown .menu-icon {
  color: var(--text-tertiary);
}

.theme-menu-dropdown .menu-item-active .menu-icon {
  color: white;
}

.user-profile-container {
  position: relative;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm) var(--spacing-xs) var(--spacing-xs);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-profile:hover {
  background-color: var(--bg-tertiary);
}

.user-avatar {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--secondary-gradient);
  border-radius: var(--radius-full);
  color: white;
}

.user-name {
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.dropdown-arrow {
  color: var(--text-tertiary);
  transition: transform 0.2s var(--ease-spring);
}

.dropdown-arrow.rotate-180 {
  transform: rotate(180deg);
}

/* 用户菜单下拉 */
.user-menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  min-width: 180px;
  z-index: var(--z-dropdown);
  overflow: hidden;
}

.dark .user-menu-dropdown {
  background: var(--dark-bg-elevated);
  border-color: var(--dark-border-color);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.menu-item:hover {
  background-color: var(--bg-tertiary);
}

.menu-item.menu-divider {
  height: 1px;
  padding: 0;
  margin: var(--spacing-xs) 0;
  background-color: var(--border-color);
  pointer-events: none;
}

.menu-icon {
  color: var(--text-tertiary);
}

/* 移动端菜单按钮 */
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  gap: 5px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-lg);
  transition: background-color 0.2s ease;
}

.mobile-menu-toggle:hover {
  background-color: var(--bg-tertiary);
}

.mobile-menu-toggle span {
  display: block;
  width: 20px;
  height: 2px;
  background-color: var(--text-primary);
  border-radius: 2px;
  transition: all 0.3s var(--ease-spring);
}

.mobile-menu-toggle.active span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.mobile-menu-toggle.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.active span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* 主体内容区域 */
.app-main {
  display: flex;
  flex: 1;
  margin-top: 64px;
  min-height: calc(100vh - 64px);
}

/* 侧边栏 - 使用高对比度边框 */
.app-sidebar {
  width: 280px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  /* 增加边框宽度从 1px 到 2px，使用高对比度边框颜色 */
  border-right: 2px solid var(--border-color);
  padding: var(--spacing-xl);
  overflow-y: auto;
  transition: transform 0.3s var(--ease-out), border-color 0.2s ease;
}

.dark .app-sidebar {
  background: rgba(15, 23, 42, 0.85);
  border-right-color: var(--dark-border-color);
}

/* 侧边栏悬停时边框更明显 */
.app-sidebar:hover {
  border-right-color: var(--border-hover);
}

.dark .app-sidebar:hover {
  border-right-color: var(--dark-border-hover);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.sidebar-title {
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  color: var(--text-primary);
}

.sidebar-close {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: var(--spacing-xs);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.sidebar-close:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.sidebar-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-md);
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.event-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  /* 使用高对比度边框 */
  border: 2px solid var(--border-color);
}

.event-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-hover);
  transform: translateX(4px);
}

.dark .event-item {
  border-color: var(--dark-border-color);
}

.dark .event-item:hover {
  border-color: var(--dark-border-hover);
}

.event-time {
  font-size: var(--text-xs);
  color: var(--primary-color);
  font-weight: var(--font-semibold);
}

.event-title {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  line-clamp: 2;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-align: center;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  /* 使用高对比度边框 */
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.quick-action-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-hover);
  transform: translateX(4px);
}

.dark .quick-action-btn {
  border-color: var(--dark-border-color);
}

.dark .quick-action-btn:hover {
  border-color: var(--dark-border-hover);
}

/* 主内容区域 - 使用WCAG高对比度颜色方案 */
.app-content {
  flex: 1;
  padding: var(--spacing-xl);
  overflow-y: auto;
  min-height: calc(100vh - 64px);

  /* 应用高对比度颜色方案 */
  background-color: transparent;
  color: var(--main-text-primary);

  /* 确保文字渲染清晰 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;

  /* 平滑过渡 */
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 移动端遮罩 */
.sidebar-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  z-index: var(--z-modal-backdrop);
  backdrop-filter: blur(4px);
}

/* 移动端底部导航 */
.mobile-bottom-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-elevated);
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-xs) 0 calc(var(--spacing-xs) + env(safe-area-inset-bottom));
  z-index: var(--z-fixed);
}

.dark .mobile-bottom-nav {
  background: var(--dark-bg-elevated);
  border-top-color: var(--dark-border-color);
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--spacing-xs);
  color: var(--text-tertiary);
  text-decoration: none;
  transition: all 0.2s ease;
}

.mobile-nav-item.active {
  color: var(--primary-color);
}

.mobile-nav-icon {
  width: 24px;
  height: 24px;
}

.mobile-nav-label {
  font-size: 10px;
  font-weight: var(--font-medium);
}

/* 过渡动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s var(--ease-spring);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.page-enter-active,
.page-leave-active {
  transition: all 0.3s var(--ease-out);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 64px;
    bottom: 0;
    z-index: var(--z-modal);
    transform: translateX(-100%);
  }

  .app-sidebar.open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: flex;
  }

  .sidebar-overlay {
    display: block;
  }
}

@media (max-width: 768px) {
  .navbar-container {
    padding: 0 var(--spacing-md);
  }

  .navbar-menu {
    display: none;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .user-name {
    display: none;
  }

  .app-content {
    padding: var(--spacing-md);
    padding-bottom: calc(var(--spacing-md) + 70px);
  }

  .mobile-bottom-nav {
    display: flex;
  }

  .brand-text {
    display: none;
  }
}

/* 视频背景样式 */
.video-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  pointer-events: none;
}

/* 视频背景过渡效果 */
.video-background-enter-active,
.video-background-leave-active {
  transition: opacity 1s ease-in-out;
}

.video-background-enter-from,
.video-background-leave-to {
  opacity: 0;
}

/* 动态背景过渡效果 */
.dynamic-background-enter-active,
.dynamic-background-leave-active {
  transition: opacity 1s ease-in-out;
}

.dynamic-background-enter-from,
.dynamic-background-leave-to {
  opacity: 0;
}

/* 确保背景切换时的平滑过渡 */
.app-layout {
  transition: background-color 1s ease-in-out;
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .app-sidebar {
    transition: none;
  }

  .mobile-menu-toggle span {
    transition: none;
  }

  .dynamic-background-enter-active,
  .dynamic-background-leave-active {
    transition: none;
  }

  .video-background-enter-active,
  .video-background-leave-active {
    transition: none;
  }

  .app-layout {
    transition: none;
  }
}

/* 响应式视频背景优化 */
@media (max-width: 768px) {
  .video-background {
    object-position: center center;
  }
}

/* 性能优化：低功耗模式下禁用视频背景 */
@media (prefers-reduced-motion: reduce) {
  .video-background {
    display: none;
  }
}
</style>
