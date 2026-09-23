import '@fortawesome/fontawesome-free/css/all.min.css';
import '@/styles/tailwind.css';

import { setupAuthInterceptor } from '@/utils/auth-interceptor';
setupAuthInterceptor();

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
import * as echarts from 'echarts';
// 引入自定义 OpenTab 实现
import { KiviiOpenTab } from './bridge/kivii-open-tab';
// 引入远程组件加载器
import { loadUmdOnDemand, registerRemoteComponents } from '@/utils/remoteComponentLoader';
import { initializeAuthState, setupAuthSync } from '@/utils/auth-state';
import { usePageHostPilotStore } from '@/runtime/page-host/pilot-store';
import { installPageHostDiagnosticsBrowserApi } from '@/runtime/page-host/diagnostics';
import { getGlobalConfig } from '@/router/routes';
import { getPageHostPilotConfig } from '@/runtime/page-host/pilot-config';

const initApp = async () => {
  // UMD 组件将 ECharts 作为外部依赖；由宿主的本地 npm 包统一提供。
  (window as typeof window & { echarts?: typeof echarts }).echarts = echarts;

  const app = createApp(App);
  installPageHostDiagnosticsBrowserApi(window, () =>
    getPageHostPilotConfig(getGlobalConfig())
  );

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

  // PageHost 只卸载 UMD 页面实例；脚本、全局注册与共享样式保持应用级常驻。
  usePageHostPilotStore(pinia).setUmdRegistrationBridge(async (componentName, scriptPath) => {
    const isRegistered = () =>
      Object.prototype.hasOwnProperty.call(app._context.components, componentName);

    if (!isRegistered() && scriptPath) {
      await loadUmdOnDemand(app, scriptPath);
    }
    return isRegistered();
  });

  // 在路由守卫执行前先通过本地 Nest API 初始化登录状态
  await initializeAuthState();
  setupAuthSync({ router, pinia });

  // 注册 kiviiBridge 自定义实现（在挂载前）
  if (window.kivii) {
    window.kivii.register(new KiviiOpenTab(pinia));
  } else {
    console.warn('[KiviiBridge] kivii 未初始化，无法注册自定义实现');
  }

  // 不再请求 /codes 配置；仅初始化 UMD 就绪状态并加载内置 showcase。
  registerRemoteComponents(app, 'empty_skip_load')
    .catch(e => {
      console.error('[UMD] 远程组件加载失败:', e);
    })
    .finally(() => {
      const showcaseUrl = `${import.meta.env.BASE_URL}umd-showcase/kivii-runtime-showcase.umd.js?v=1.1.2`;
      loadUmdOnDemand(app, showcaseUrl).catch(e => {
        console.error('[UMD Showcase] 示例组件加载失败:', e);
      });
    });

  // 安装路由 (放在远程组件加载之后，避免潜在的冲突)
  app.use(router);

  app.mount('#app');
};

initApp();
