import '@/styles/tailwind.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import * as LayoutComponents from '@/layouts/modules';
// 引入 kivii.com/bridge 库
import '@kivii.com/bridge';
// 引入公共组件及样式
import * as KiviiPublicComponents from 'kivii-public-components';
import 'kivii-public-components/style';
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

  // TODO: 如果需要 UMD 组件中直接使用公共组件标签，请取消以下注释进行全局注册
  for (const [key, component] of Object.entries(KiviiPublicComponents)) {
    if (component && (typeof component === 'object' || typeof component === 'function')) {
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

  // UMD 全量预加载已禁用 —— 改为按菜单标签懒加载
  // const isLoginPage =
  //   window.location.hash.includes('/login') || window.location.hash.includes('/SpringLogin');
  // const uiConfig = (window as any).uiGlobalConfig || {};
  // const isAuthenticated = uiConfig.IsAuthenticated === true;
  //
  // if (isAuthenticated || !isLoginPage) {
  //   try {
  //     console.log('Start loading remote components in background...');
  //     registerRemoteComponents(
  //       app,
  //       '/Restful/Kivii.Storages.Entities.DbFile/Query.json?FolderPath=/Umd/File'
  //     ).catch(e => {
  //       console.error('Remote components loading error (non-fatal):', e);
  //     });
  //   } catch (e) {
  //     console.error('Remote components loading setup error:', e);
  //   }
  // } else {
  //   registerRemoteComponents(app, 'empty_skip_load').catch(e => {});
  // }

  // 解除路由守卫对 umdComponentsReady 的等待（不实际加载任何 UMD 文件）
  registerRemoteComponents(app, 'empty_skip_load').catch(_e => {});

  // 安装路由 (放在远程组件加载之后，避免潜在的冲突)
  app.use(router);

  app.mount('#app');
};

initApp();
