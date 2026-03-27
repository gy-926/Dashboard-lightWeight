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

  // 动态加载远程组件 (改为后台加载，不阻塞应用挂载)
  // 如果处于未登录状态，且当前路由是登录页，则不加载 UMD 组件，避免重复加载
  const isLoginPage = window.location.hash.includes('/login');
  const uiConfig = (window as any).uiGlobalConfig || {};
  const isAuthenticated = uiConfig.IsAuthenticated === true;

  if (isAuthenticated || !isLoginPage) {
    try {
      console.log('Start loading remote components in background...');
      registerRemoteComponents(
        app,
        '/Restful/Kivii.Storages.Entities.DbFile/Query.json?FolderPath=/Umd/File'
      ).catch(e => {
        console.error('Remote components loading error (non-fatal):', e);
      });
    } catch (e) {
      console.error('Remote components loading setup error:', e);
    }
  } else {
    console.log('On login page and not authenticated, skipping UMD component loading.');
    // 必须 resolve umdComponentsReady，否则路由系统会一直卡住等待
    // 虽然我们在 index.ts 里通过 setTimeout 处理了兜底，但主动释放更安全
    // 我们可以在 registerRemoteComponents 不执行时也给个假完成状态
    // 由于 _resolveUmdReady 是非导出的内部方法，最简单的就是让 index.ts 依赖不卡死
    // （在上面的 commit 我们已经处理了）
  }

  // 安装路由 (放在远程组件加载之后，避免潜在的冲突)
  app.use(router);

  app.mount('#app');
};

initApp();
