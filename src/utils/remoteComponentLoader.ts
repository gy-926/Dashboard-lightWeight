import type { App } from 'vue';
import * as Vue from 'vue';
import type { ComponentConfig, Config } from './umd/types';
import { remoteLibraries, umdComponentsReady, resolveUmdReady } from './umd/state';
import { loadComponent, loadUMDComponent } from './umd/loader';
import { storageClient } from '@/utils/supabase';

// 公共 re-exports（维持现有外部导入路径不变）
export type { RemoteLibraryInfo, ComponentConfig, Config } from './umd/types';
export { remoteLibraries, umdComponentsReady } from './umd/state';
export { generateUmdRoutes } from './umd/routes';

// 从 Supabase 存储桶中加载 UMD 组件配置
// configPath 格式：'supabase:<BucketName>'
const loadConfig = async (configPath: string): Promise<Config> => {
  if (configPath.startsWith('supabase:')) {
    const bucketName = configPath.slice('supabase:'.length);
    const { data: files, error } = await storageClient.storage.from(bucketName).list();
    if (error) throw error;

    const components: ComponentConfig[] = (files ?? [])
      .filter(f => f.name.endsWith('.js'))
      .map(f => {
        const name = f.name.replace(/(\.umd)?(\.min)?\.js$/i, '');
        const { data } = storageClient.storage.from(bucketName).getPublicUrl(f.name);
        return {
          name,
          type: 'umd' as const,
          version: '1.0.0',
          path: data.publicUrl,
          globalName: 'VueComponent',
          autoRegister: true,
        };
      });

    return { components };
  }

  return { components: [] };
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

// 按需加载单个 UMD 文件并注册到 app
export const loadUmdOnDemand = async (app: App, scriptPath: string): Promise<void> => {
  const EXCLUDED_KEYS = new Set([
    'default',
    'install',
    'manifest',
    'componentsMap',
    'componentsDetailed',
    'version',
    '__esModule',
    'VueDemoComponent',
  ]);

  const remoteComponent = await loadUMDComponent(scriptPath);

  if (typeof remoteComponent !== 'object' || remoteComponent === null) return;

  if (remoteComponent.install) {
    app.use(remoteComponent);
    return;
  }

  runCssInjectors(remoteComponent);

  for (const key in remoteComponent) {
    if (EXCLUDED_KEYS.has(key)) continue;
    const component = remoteComponent[key];
    if (component && (typeof component === 'object' || typeof component === 'function')) {
      if (!Object.prototype.hasOwnProperty.call(app._context.components, key)) {
        app.component(key, component);
      }
    }
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
