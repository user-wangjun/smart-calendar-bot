import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import modernRouter from './router/modernRouter';
import App from './App.vue';
import './assets/styles/main.css';
import './assets/styles/design-system.css';
import { optimizedNavigation } from './services/optimizedNavigation.js';
import amapLocationService from './services/amapLocationService.js';
import envConfig from './config/env.js';

// 初始化优化导航服务
optimizedNavigation.setRouter(modernRouter);

// 初始化高德定位服务API密钥
const amapApiKey = envConfig.getAmapApiKey();
if (amapApiKey) {
  amapLocationService.setApiKey(amapApiKey);
} else {
  console.warn('[main.js] 高德定位服务API密钥未配置，请在.env文件中配置VITE_AMAP_API_KEY');
}

// 创建Vue应用实例
const app = createApp(App);

// 创建Pinia实例
const pinia = createPinia();

// 调试：监听路由错误（在use之前注册）
modernRouter.onError((error) => {
  console.error('[路由错误]', error);
});

// 调试：监听路由导航（在use之前注册）
modernRouter.beforeEach((to, from, next) => {
  next();
});

// 注册插件
app.use(pinia);
app.use(modernRouter);
app.use(ElementPlus);

// 挂载应用
app.mount('#app');
