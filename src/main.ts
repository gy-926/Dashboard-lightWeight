import '@/styles/tailwind.css';
import '@fortawesome/fontawesome-free/css/all.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import * as LayoutComponents from '@/layouts/modules';
// 引入 kivii.com/bridge 库
import '@kivii.com/bridge';
// 引入自定义 OpenTab 实现
import { KiviiOpenTab } from './bridge/kivii-open-tab';
// 引入远程组件加载器
import { registerRemoteComponents } from '@/utils/remoteComponentLoader';

const initApp = async () => {
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

  // 注册 kiviiBridge 自定义实现（在挂载前）
  if ((window as any).kivii) {
    (window as any).kivii.register(new KiviiOpenTab(pinia));
    console.log('[KiviiBridge] 自定义 OpenTab 实现已注册');
  } else {
    console.warn('[KiviiBridge] kivii 未初始化，无法注册自定义实现');
  }

  // 动态加载远程组件
  try {
    console.log('Start loading remote components...');
    // await registerRemoteComponents(app, '/codes/umdComponents.json');
    await registerRemoteComponents(
      app,
      '/Restful/Kivii.Storages.Entities.DbFile/Query.json?FolderPath=/Umd/File'
    );
  } catch (e) {
    console.error('Remote components loading error (non-fatal):', e);
  }

  // 安装路由 (放在远程组件加载之后，避免潜在的冲突)
  app.use(router);

  app.mount('#app');
};

initApp();
