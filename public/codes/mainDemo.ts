import {
  computed,
  createApp,
  defineComponent,
  getCurrentInstance,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  watch,
  watchEffect
} from 'vue';
// 导入整个Vue对象
import * as Vue from 'vue';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import VueGridLayout from 'vue-grid-layout';
import vue3TreeOrg from 'vue3-tree-org';
import 'vue3-tree-org/lib/vue3-tree-org.css';
import { loadModule } from 'vue3-sfc-loader';
// import MateChat from '@matechat/core';
import '@devui-design/icons/icomoon/devui-icon.css';
import * as echarts from 'echarts/core';
import WangEditor from 'wangeditor';
import * as naive from 'naive-ui';
import * as XLSX from 'xlsx';
import JsBarcode from 'jsbarcode';
import axiosInstance from '@/service/request/axios';
import { useEcharts, useEchartsRenderer } from '@/hooks/common/echarts';
import { useTheme } from '@/hooks/common/use-theme';
import { useThemeStore } from '@/store/modules/theme';
// 引入JSBridge - 会自动注册到window.JSBridge
import jsBridge from '@/utils/jsbridge-pure';
import './plugins/assets';
// main.js or main.ts
import '@fortawesome/fontawesome-free/css/all.css';
// 引入 KaTeX 样式以支持数学公式渲染
// import 'katex/dist/katex.min.css';
import { useRouterPush } from '@/hooks/common/router';
import CustomRouterLink from '@/components/custom/CustomRouterLink.vue';
import { setupCustomRouteManager, setupDayjs, setupIconifyOffline, setupLoading, setupNProgress } from './plugins';
import { BridgeRouterAdapter } from './utils/bridge-router-adapter';
import { setupStore } from './store';
import { setupRouter } from './router';
import { setupI18n } from './locales';
import { globalAPI } from './utils/global-api';
// 引入Office预览插件
import OfficePreviewPlugin from './plugins/office-preview';

import '@kivii.com/bridge';
// js Bridge
// @ts-expect-error - JavaScript module without TypeScript declarations
import KiviiJSBridge from './utils/kivii.bridge.esm.js';

import App from './App.vue';
// 方法1: 暴露整个Vue对象（包含所有编译器函数）
(window as any).Vue = Vue;

const app = createApp(App);

// 方法3: 备用全局对象
(window as any).__VUE_GLOBALS__ = Vue;

async function setupApp() {
  setupLoading();
  setupNProgress();
  setupIconifyOffline();
  setupDayjs();

  // 全局注册工具库到 window 对象，供外部组件使用
  (window as any).$axios = axiosInstance;
  (window as any).$echarts = echarts;
  (window as any).$WangEditor = WangEditor;
  (window as any).$xlsx = XLSX;
  (window as any).$JsBarcode = JsBarcode;
  // 注册 vue3-tree-org 到 window 对象
  (window as any).$treeOrg = vue3TreeOrg;
  // 注册 useEcharts hook
  (window as any).$useEcharts = useEcharts;
  (window as any).$useEchartsRenderer = useEchartsRenderer;
  // 注册 useTheme hook
  (window as any).$useTheme = useTheme;
  // 注册 useRouterPush hook，设置 inSetup 为 false，因为在全局环境下使用
  (window as any).$routerPush = useRouterPush(false);
  (window as any).$JSBridge = KiviiJSBridge;
  // 注册 vue3-sfc-loader 的 loadModule 函数
  (window as any).$loadModule = loadModule;

  setupStore(app);
  await setupRouter(app);
  setupI18n(app);

  // 🔧 立即设置全局Vue应用实例，确保动态加载器可以使用
  (window as any).__KIVII_GLOBAL_APP__ = app;
  // console.log('[App] ✅ 全局Vue应用实例已设置，动态组件可以注册');
  // 初始化自定义路由管理器
  setupCustomRouteManager();

  // 初始化 Bridge Route 模块
  const bridgeAdapter = new BridgeRouterAdapter();
  const hookManager = new (window as any).$JSBridge.Hook({});
  const routeManager = new (window as any).$JSBridge.Route({}, hookManager);
  routeManager.init(bridgeAdapter);

  // 将初始化好的 Route 实例替换到 JSBridge 中，供外部使用
  (window as any).$JSBridge.Route = routeManager;

  // 在开发环境下加载测试示例
  if (import.meta.env.DEV) {
    import('@/utils/custom-route-examples');
  }

  // 获取 theme store 实例并注册到 window
  const themeStore = useThemeStore();
  (window as any).$themeStore = themeStore;

  // 全局注册 Naive UI 组件
  Object.keys(naive).forEach(key => {
    if (key.startsWith('N')) {
      app.component(key, (naive as any)[key]);
    }
  });
  // 全局注册API工具，确保所有请求都通过中间件
  window.$api = globalAPI;

  // 将 JSBridge 注册为 Vue 全局属性（可选）
  app.config.globalProperties.$jsbridge = jsBridge;

  // 注册 vue3-tree-org 插件
  app.use(vue3TreeOrg);

  app.use(VueGridLayout);
  // // 安装插件
  // app.use(MyComponentsPlugin, {
  //   prefix: 'K' // 组件名前缀，避免命名冲突
  // });
  // 全局注册 wangeditor 组件
  app.component('WangEditor', Editor);
  app.component('WangToolbar', Toolbar);

  // 全局注册 CustomRouterLink 组件
  app.component('CustomRouterLink', CustomRouterLink);

  // 注册Office预览插件
  app.use(OfficePreviewPlugin);

  app.mount('#app');

  // // 启动Kivii动态加载器
  try {
    await initApp();
    console.log('[App] ✅ 新的Kivii动态加载器启动完成!');
  } catch (error) {
    console.error('[App] ❌ Kivii动态加载器启动失败:', error);
  }
}
// 组件动态引入新方法
// 组件配置接口定义
interface ComponentConfig {
  name: string;
  type: 'umd' | 'esm';
  version: string;
  path: string;
  globalName?: string; // UMD组件在全局对象中的名称
  dependencies?: string[]; // 组件依赖的其他资源
}

interface Config {
  components: ComponentConfig[];
}
// 加载配置文件
const loadConfig = async (): Promise<Config> => {
  try {
    const response = await fetch('/codes/umdComponents.json');
    if (!response.ok) {
      throw new Error(`配置文件加载失败: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load config:', error);
    throw error;
  }
};

// 动态加载远程UMD组件的函数
const loadUMDComponent = (url: string, globalName?: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载过该脚本
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      // 如果已经加载，直接返回全局组件
      const component = (window as any)[globalName || 'VueComponent'];
      if (component) {
        resolve(component);
        return;
      }
    }

    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      // UMD组件加载完成后，从全局对象中获取组件
      const component = (window as any)[globalName || 'VueComponent'];
      if (component) {
        resolve(component);
      } else {
        reject(new Error(`组件加载失败：未找到${globalName || 'VueComponent'} from ${url}`));
      }
    };
    script.onerror = () => reject(new Error(`脚本加载失败: ${url}`));
    document.head.appendChild(script);
  });
};

// 动态加载ESM组件的函数
const loadESMComponent = async (url: string): Promise<any> => {
  try {
    const module = await import(/* @vite-ignore */ url);
    return module.default || module;
  } catch (error) {
    throw new Error(`ESM组件加载失败: ${url} - ${error}`);
  }
};

// 通用组件加载器
const loadComponent = async (componentConfig: ComponentConfig): Promise<any> => {
  const { type, path, globalName } = componentConfig;

  switch (type) {
    case 'umd':
      return await loadUMDComponent(path, globalName);
    case 'esm':
      return await loadESMComponent(path);
    default:
      throw new Error(`不支持的组件类型: ${type}`);
  }
};

// 注册单个组件
const registerComponent = async (componentConfig: ComponentConfig) => {
  try {
    console.log(`Loading component: ${componentConfig.name} (${componentConfig.type}) from ${componentConfig.path}`);

    // 使用通用组件加载器
    const remoteComponent = await loadComponent(componentConfig);

    // 如果组件有install方法，直接使用（插件模式）
    if (remoteComponent.install) {
      app.use(remoteComponent);
      console.log(`Component plugin ${componentConfig.name} registered successfully`);
    } else if (remoteComponent[componentConfig.name]) {
      // 手动注册单个组件（组件对象中包含具名组件）
      app.component(componentConfig.name, remoteComponent[componentConfig.name]);
      console.log(`Component ${componentConfig.name} registered successfully`);
    } else {
      // 尝试直接注册组件（如果组件本身就是一个Vue组件）
      app.component(componentConfig.name, remoteComponent);
      console.log(`Component ${componentConfig.name} registered as direct component`);
    }
  } catch (error) {
    console.error(`Failed to load component ${componentConfig.name}:`, error);
    throw error; // 重新抛出错误以便上层处理
  }
};

// 注册所有远程组件
const registerRemoteComponents = async () => {
  try {
    const config = await loadConfig();
    console.log('Config loaded:', config);

    if (!config.components || config.components.length === 0) {
      console.warn('No components found in config');
      return;
    }

    // 记录加载结果
    const loadResults: Array<{ name: string; success: boolean; error?: string }> = [];

    // 并行加载所有组件
    const loadPromises = config.components.map(async componentConfig => {
      try {
        await registerComponent(componentConfig);
        loadResults.push({ name: componentConfig.name, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        loadResults.push({
          name: componentConfig.name,
          success: false,
          error: errorMessage
        });
      }
    });

    await Promise.allSettled(loadPromises);

    // 输出加载结果统计
    const successCount = loadResults.filter(r => r.success).length;
    const failureCount = loadResults.filter(r => !r.success).length;

    console.log(`Component loading completed: ${successCount} successful, ${failureCount} failed`);

    if (failureCount > 0) {
      console.warn(
        'Failed components:',
        loadResults.filter(r => !r.success)
      );
    }

    // 如果所有组件都加载失败，抛出错误
    if (successCount === 0 && failureCount > 0) {
      throw new Error('All components failed to load');
    }
  } catch (error) {
    console.error('Failed to register remote components:', error);
    throw error;
  }
};
// 初始化应用
const initApp = async () => {
  console.log('Initializing application...');

  try {
    // 先注册远程组件
    await registerRemoteComponents();
    console.log('Remote components registration completed');

    // 然后挂载应用
    // app.mount("#app");
    console.log('Application mounted successfully');
  } catch (error) {
    console.error('Application initialization failed:', error);

    // 即使组件加载失败，也要挂载应用，确保基础功能可用
    try {
      // app.mount("#app");
      console.log('Application mounted with fallback mode (some components may not be available)');
    } catch (mountError) {
      console.error('Critical error: Failed to mount application:', mountError);
    }
  }
};

setTimeout(() => {
  setupApp();
}, 200);
