import type { App } from 'vue';
import * as Vue from 'vue';
import type { ComponentConfig, Config } from './umd/types';
import { remoteLibraries, umdComponentsReady, resolveUmdReady } from './umd/state';
import { loadComponent } from './umd/loader';

// 公共 re-exports（维持现有外部导入路径不变）
export type { RemoteLibraryInfo, ComponentConfig, Config } from './umd/types';
export { remoteLibraries, umdComponentsReady } from './umd/state';
export { generateUmdRoutes } from './umd/routes';

// [MOCK MODE] 硬编码配置；恢复后端时替换为实际请求
// import { kivii } from '@kivii.com/bridge';
const loadConfig = async (_configPath: string): Promise<Config> => {
  return {
    components: [
      {
        name: 'KiviiCrmUmd',
        type: 'umd',
        version: '1.0.0',
        path: '/umd/kivii-component-crmUmd.umd.js',
        globalName: 'VueComponent',
        autoRegister: true,
        metadata: { zhName: 'CRM 业务套件' },
      },
      {
        name: 'KiviiDashboardStandards',
        type: 'umd',
        version: '1.0.0',
        path: '/umd/kivii-dashboard-umd-standards.js',
        globalName: 'VueComponent',
        autoRegister: true,
        metadata: { zhName: '仪表盘标准组件' },
      },
    ],
  };

  // ── 原始后端请求（恢复时取消注释，删除上方 return）──
  // try {
  //   const response = await kivii.request.get<any>(_configPath);
  //   const data = response.data;
  //   if (data.components && Array.isArray(data.components)) return data;
  //   let items: any[] = [];
  //   if (Array.isArray(data)) items = data;
  //   else if (data.data && Array.isArray(data.data)) items = data.data;
  //   else if (data.items && Array.isArray(data.items)) items = data.items;
  //   else if (data.Results && Array.isArray(data.Results)) items = data.Results;
  //   if (items.length > 0) {
  //     const components: ComponentConfig[] = items
  //       .filter((item: any) => item.Path)
  //       .map((item: any) => {
  //         const fileName = item.Path.split('/').pop() || 'UnknownComponent';
  //         let name = item.Name || fileName;
  //         name = name.replace(/(\.umd)?(\.min)?\.js$/i, '');
  //         return { name, type: 'umd', version: item.Version || '1.0.0',
  //                  path: item.Path, globalName: item.GlobalName, autoRegister: true };
  //       });
  //     return { components };
  //   }
  //   return { components: [] };
  // } catch (error) {
  //   console.error('Failed to load config:', error);
  //   throw error;
  // }
};

const CSS_INJECTORS = [
  'injectStyles',
  '__inject_styles',
  'injectCss',
  '_injectStyles',
  'applyStyles',
  'install_styles',
];

function runCssInjectors(obj: Record<string, any>) {
  for (const key of CSS_INJECTORS) {
    if (typeof obj[key] === 'function') {
      try {
        obj[key]();
      } catch (_) {
        /* ignore */
      }
    }
  }
}

const registerComponent = async (app: App, config: ComponentConfig): Promise<void> => {
  const remoteComponent = await loadComponent(config);

  const libIndex = remoteLibraries.value.findIndex(l => l.name === config.name);
  if (libIndex !== -1 && typeof remoteComponent === 'object' && remoteComponent !== null) {
    const lib = remoteLibraries.value[libIndex];
    lib.status = 'success';
    lib.componentKeys = Object.keys(remoteComponent);
    if (remoteComponent.manifest) {
      lib.manifest = remoteComponent.manifest;
      lib.componentsDetailed ??= remoteComponent.manifest.componentsDetailed;
      lib.componentsMap ??= remoteComponent.manifest.componentsMap;
    }
    if (remoteComponent.componentsMap) lib.componentsMap = remoteComponent.componentsMap;
    if (remoteComponent.componentsDetailed)
      lib.componentsDetailed = remoteComponent.componentsDetailed;
    if (config.metadata?.zhName) {
      lib.manifest ??= {};
      lib.manifest.zhName = config.metadata.zhName;
    }
    if (config.metadata?.componentsDetailed) {
      lib.componentsDetailed = config.metadata.componentsDetailed;
    }
  }

  if (config.autoRegister && typeof remoteComponent === 'object' && remoteComponent !== null) {
    if (remoteComponent.install) {
      app.use(remoteComponent);
      return;
    }
    runCssInjectors(remoteComponent);
    for (const key in remoteComponent) {
      const item = remoteComponent[key];
      if (item && typeof item === 'object' && !Array.isArray(item)) runCssInjectors(item);
    }
    let count = 0;
    for (const key in remoteComponent) {
      const comp = remoteComponent[key];
      if (comp && (typeof comp === 'object' || typeof comp === 'function')) {
        app.component(key, comp);
        count++;
      }
    }
    if (libIndex !== -1) remoteLibraries.value[libIndex].registeredCount = count;
    return;
  }

  if (remoteComponent.install) {
    app.use(remoteComponent);
  } else if (remoteComponent[config.name]) {
    app.component(config.name, remoteComponent[config.name]);
  } else {
    app.component(config.name, remoteComponent);
  }
};

export const registerRemoteComponents = async (
  app: App,
  configUrl = '/codes/umdComponents.json'
): Promise<void> => {
  if (!window.Vue) window.Vue = Vue;

  if (configUrl === 'empty_skip_load') {
    resolveUmdReady();
    return;
  }

  try {
    const config = await loadConfig(configUrl);
    if (!config.components?.length) return;

    remoteLibraries.value = config.components.map(c => ({
      name: c.name,
      url: c.path,
      status: 'pending',
    }));

    const CONCURRENCY = 3;
    for (let i = 0; i < config.components.length; i += CONCURRENCY) {
      const chunk = config.components.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        chunk.map(async cfg => {
          const idx = remoteLibraries.value.findIndex(l => l.name === cfg.name);
          if (idx !== -1) remoteLibraries.value[idx].status = 'loading';
          try {
            await registerComponent(app, cfg);
            if (idx !== -1 && remoteLibraries.value[idx].status !== 'success') {
              remoteLibraries.value[idx].status = 'success';
            }
          } catch (error) {
            if (idx !== -1) {
              remoteLibraries.value[idx].status = 'error';
              remoteLibraries.value[idx].error =
                error instanceof Error ? error.message : String(error);
            }
          }
        })
      );
    }
  } catch (error) {
    console.error('Failed to register remote components:', error);
  } finally {
    resolveUmdReady();
  }
};
