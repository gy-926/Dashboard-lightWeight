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
  if (window.kivii) {
    window.kivii.register(new KiviiOpenTab(pinia));
  } else {
    console.warn('[KiviiBridge] kivii 未初始化，无法注册自定义实现');
  }

  // 动态加载远程组件（后台加载，不阻塞应用挂载）
  // Supabase 存储使用匿名 key 访问，无需登录即可加载，始终在启动时触发
  registerRemoteComponents(app, 'supabase:UmdTempleate').catch(e => {
    console.error('[UMD] 远程组件加载失败:', e);
  });

  // 安装路由 (放在远程组件加载之后，避免潜在的冲突)
  app.use(router);

  app.mount('#app');
};

initApp();
