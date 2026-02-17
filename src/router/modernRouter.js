import { createRouter, createWebHistory } from 'vue-router';
import { h } from 'vue';

// 包装 ErrorComponent 以适配路由错误场景
const RouterErrorBoundary = {
  setup () {
    return () => h('div', {
      class: 'error-boundary',
      style: {
        padding: '40px',
        textAlign: 'center'
      }
    }, [
      h('div', {
        class: 'error-icon',
        style: {
          fontSize: '48px',
          marginBottom: '16px'
        }
      }, '⚠️'),
      h('h2', {
        style: {
          color: '#111827',
          marginBottom: '8px'
        }
      }, '页面加载失败'),
      h('p', {
        style: {
          color: '#6b7280',
          marginBottom: '24px'
        }
      }, '抱歉，该页面暂时无法加载。请稍后重试。'),
      h('button', {
        onClick: () => { window.location.href = '/'; },
        style: {
          padding: '12px 24px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }
      }, '返回首页')
    ]);
  }
};

// 导入页面组件（带错误处理的动态导入）
const ModernDashboard = () => import('@/views/ModernDashboard.vue').catch(err => {
  console.error('ModernDashboard 加载失败:', err);
  return { default: RouterErrorBoundary };
});
const Calendar = () => import('@/views/Calendar.vue').catch(err => {
  console.error('Calendar 加载失败:', err);
  return { default: RouterErrorBoundary };
});
const AIAssistant = () => import('@/views/AIAssistant.vue').catch(err => {
  console.error('AIAssistant 加载失败:', err);
  return { default: RouterErrorBoundary };
});
const UnifiedSettings = () => import('@/views/UnifiedSettings.vue').catch(err => {
  console.error('UnifiedSettings 加载失败:', err);
  return { default: RouterErrorBoundary };
});
const WeatherView = () => import('@/views/WeatherView.vue').catch(err => {
  console.error('WeatherView 加载失败:', err);
  return { default: RouterErrorBoundary };
});
const AmapWeather = () => import('@/views/AmapWeather.vue').catch(err => {
  console.error('AmapWeather 加载失败:', err);
  return { default: RouterErrorBoundary };
});

// 定义路由配置
// 注意：AppLayout 由 App.vue 直接渲染，这里不需要嵌套路由
const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: ModernDashboard,
    meta: {
      title: '智能仪表盘',
      description: '智能日历应用的主控制面板'
    }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: {
      title: '日历管理',
      description: '查看和管理您的日程安排'
    }
  },
  {
    path: '/ai-assistant',
    name: 'AIAssistant',
    component: AIAssistant,
    meta: {
      title: 'AI助手',
      description: '与AI助手进行智能对话'
    }
  },
  {
    path: '/settings',
    name: 'UnifiedSettings',
    component: UnifiedSettings,
    meta: {
      title: '设置中心',
      description: '个性化您的应用设置'
    }
  },
  {
    path: '/weather',
    name: 'WeatherView',
    component: WeatherView,
    meta: {
      title: '天气预报',
      description: '查看实时天气信息和未来预报'
    }
  },
  {
    path: '/amap-weather',
    name: 'AmapWeather',
    component: AmapWeather,
    meta: {
      title: '高德天气',
      description: '基于高德地图API的实时天气服务'
    }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面未找到',
      description: '您访问的页面不存在'
    }
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior (to, from, savedPosition) {
    // 始终滚动到顶部
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 智能日历`;
  } else {
    document.title = '智能日历';
  }

  // 添加页面访问统计
  console.log(`导航到: ${to.path}`);

  next();
});

// 路由后置钩子
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计、埋点等
  if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
    window.gtag('config', 'GA_MEASUREMENT_ID', {
      page_path: to.path
    });
  }
});

export default router;
