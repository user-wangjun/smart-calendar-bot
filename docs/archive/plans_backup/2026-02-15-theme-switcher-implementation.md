# 主题模式快捷切换按钮实现计划

&gt; **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在导航栏添加主题模式快捷切换按钮，支持快速切换4种主题（跟随系统、浅色、深色、透明）

**Architecture:** 在 AppLayout.vue 的用户操作区域添加主题切换按钮，使用与现有通知按钮和用户菜单一致的视觉风格，点击后显示下拉菜单选择主题。

**Tech Stack:** Vue 3, Pinia, Tailwind CSS, Lucide Icons

---

## 任务1: 添加主题切换按钮组件

**Files:**
- Modify: `src/components/layout/AppLayout.vue:32-70`

**Step 1: 导入必要的图标**

在现有导入中添加主题相关图标：
```javascript
// 在 import 语句中添加
Sun, Moon, Monitor, Layers
```

**Step 2: 添加主题切换状态**

在 script setup 中添加：
```javascript
const isThemeMenuOpen = ref(false);
const themeMenuRef = ref(null);
```

**Step 3: 添加主题切换按钮UI**

在通知按钮和用户菜单之间添加主题按钮：
```vue
&lt;div class="theme-switcher-container" ref="themeMenuRef"&gt;
  &lt;button
    class="action-button theme-btn"
    @click="toggleThemeMenu"
    aria-label="切换主题"
  &gt;
    &lt;component :is="currentThemeIcon" class="w-5 h-5" /&gt;
  &lt;/button&gt;

  &lt;Transition name="dropdown"&gt;
    &lt;div v-if="isThemeMenuOpen" class="theme-menu-dropdown"&gt;
      &lt;div
        v-for="mode in themeModes"
        :key="mode.value"
        class="menu-item"
        :class="{ 'menu-item-active': settingsStore.themeMode === mode.value }"
        @click.stop="selectThemeMode(mode.value)"
      &gt;
        &lt;component :is="mode.icon" class="menu-icon w-4 h-4" /&gt;
        &lt;span class="menu-text"&gt;{{ mode.label }}&lt;/span&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/Transition&gt;
&lt;/div&gt;
```

**Step 4: 添加计算属性和方法**

在 script setup 中添加：
```javascript
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
const currentThemeIcon = computed(() =&gt; {
  const mode = settingsStore.themeMode;
  const modeMap = {
    light: Sun,
    dark: Moon,
    system: Monitor,
    transparent: Layers
  };
  return modeMap[mode] || Sun;
});

/**
 * 切换主题菜单显示
 */
const toggleThemeMenu = () =&gt; {
  isThemeMenuOpen.value = !isThemeMenuOpen.value;
  isUserMenuOpen.value = false;
};

/**
 * 选择主题模式
 * @param {string} mode - 主题模式
 */
const selectThemeMode = (mode) =&gt; {
  settingsStore.setThemeMode(mode);
  isThemeMenuOpen.value = false;
};

/**
 * 点击外部关闭主题菜单
 */
const handleThemeMenuClickOutside = (event) =&gt; {
  if (themeMenuRef.value &amp;&amp; !themeMenuRef.value.contains(event.target)) {
    isThemeMenuOpen.value = false;
  }
};
```

**Step 5: 更新点击外部监听**

修改现有的 handleClickOutside 和监听逻辑：
```javascript
// 修改 handleClickOutside 函数
const handleClickOutside = (event) =&gt; {
  if (userMenuRef.value &amp;&amp; !userMenuRef.value.contains(event.target)) {
    isUserMenuOpen.value = false;
  }
  handleThemeMenuClickOutside(event);
};
```

**Step 6: 添加主题菜单样式**

在 style scoped 中添加：
```css
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
```

---

## 任务2: 验证实现

**Files:**
- Test: 手动测试

**Step 1: 运行开发服务器**

```powershell
npm run dev
```

**Step 2: 验证功能**

检查点：
- [ ] 主题按钮在导航栏正确显示
- [ ] 按钮图标根据当前主题动态变化
- [ ] 点击按钮显示下拉菜单
- [ ] 菜单中主题顺序正确（跟随系统 → 浅色 → 深色 → 透明）
- [ ] 当前选中的主题高亮显示
- [ ] 点击主题选项后正确切换
- [ ] 菜单点击外部自动关闭
- [ ] 与设置页面的主题选择状态同步
- [ ] 主题切换时所有组件颜色正确变化
- [ ] 主题与背景图片功能同时生效

---

Plan complete and saved to `docs/plans/2026-02-15-theme-switcher-implementation.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
