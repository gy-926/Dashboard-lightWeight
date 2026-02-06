import '@/styles/tailwind.css';
import '@/styles/fontawesome.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import * as LayoutComponents from '@/layouts/modules';
// 引入 kivii.com/bridge 库
import '@kivii.com/bridge';
// 引入自定义 OpenTab 实现
import { KiviiOpenTab } from './bridge/kivii-open-tab';

const app = createApp(App);

// 注册布局全局组件
for (const [key, component] of Object.entries(LayoutComponents)) {
  if (component) {
    app.component(key, component);
  }
}

// 安装 Pinia
const pinia = createPinia();
app.use(pinia);

// 安装路由
app.use(router);

// 注册 kiviiBridge 自定义实现（在挂载前）
if ((window as any).kivii) {
  (window as any).kivii.register(new KiviiOpenTab(pinia));
  console.log('[KiviiBridge] 自定义 OpenTab 实现已注册');
} else {
  console.warn('[KiviiBridge] kivii 未初始化，无法注册自定义实现');
}

app.mount('#app');
