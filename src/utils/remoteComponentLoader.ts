import type { App } from 'vue';
import * as Vue from 'vue';
import { ref } from 'vue';
import type { ElegantRoute } from '@/router/routes/types';

// 远程库状态定义
export interface RemoteLibraryInfo {
  name: string;
  url: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
  manifest?: any;
  componentsMap?: Record<string, any>;
  componentsDetailed?: any[];
  componentKeys?: string[];
  registeredCount?: number;
}

// 响应式状态：存储所有加载的远程库信息
export const remoteLibraries = ref<RemoteLibraryInfo[]>([]);

// UMD 组件加载完成信号：供路由模块感知加载时机，避免刷新时 race condition
let _resolveUmdReady: () => void = () => {};
export const umdComponentsReady: Promise<void> = new Promise(resolve => {
  _resolveUmdReady = resolve;
});

// 组件配置接口定义
export interface ComponentConfig {
  name: string;
  type: 'umd' | 'esm';
  version: string;
  path: string;
  globalName?: string; // UMD组件在全局对象中的名称 (例如: VueComponent)
  dependencies?: string[]; // 组件依赖的其他资源
  autoRegister?: boolean; // 是否自动注册导出对象中的所有组件
}

export interface Config {
  components: ComponentConfig[];
}

import { kivii } from '@kivii.com/bridge';

// 加载配置文件
const loadConfig = async (configPath: string): Promise<Config> => {
  try {
    const response = await kivii.request.get<any>(configPath);
    const data = response.data;

    // 检查是否为旧配置格式 (包含 components 数组)
    if (data.components && Array.isArray(data.components)) {
      return data;
    }

    // 处理新接口格式：期望是一个文件列表数组，其中每个项包含 Path 字段
    // 兼容直接数组或 { data: [] } 或 { items: [] } 或 { Results: [] } 格式
    let items: any[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data.data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data.items && Array.isArray(data.items)) {
      items = data.items;
    } else if (data.Results && Array.isArray(data.Results)) {
      items = data.Results;
    }

    if (items.length > 0) {
      console.log(`Detected API response format with ${items.length} items`);
      const components: ComponentConfig[] = items
        .filter((item: any) => item.Path) // 过滤掉没有 Path 的项
        .map((item: any) => {
          // 从 Path 中提取文件名作为组件名 (去除扩展名)
          // 例如: /Umd/File/MyComponent.umd.js -> MyComponent
          const fileName = item.Path.split('/').pop() || 'UnknownComponent';

          // 优先使用 Name 字段，否则使用文件名
          let name = item.Name || fileName;

          // 移除 .umd.js, .min.js, .js 等后缀，确保组件名干净
          name = name.replace(/(\.umd)?(\.min)?\.js$/i, '');

          return {
            name: name,
            type: 'umd',
            version: item.Version || '1.0.0',
            path: item.Path,
            globalName: item.GlobalName, // 可选
            autoRegister: true, // 默认自动注册
          };
        });
      return { components };
    }

    // 如果既不是旧格式也没有检测到有效项，返回空
    console.warn('Unknown config format or empty list, returning empty components');
    return { components: [] };
  } catch (error) {
    console.error('Failed to load config:', error);
    throw error;
  }
};

// 将 UMD IIFE 注入的 <style> 移到 dashboard 自身 CSS 之前，
// 避免 UMD 的主题变量/dark 选择器因级联位置靠后而覆盖项目样式
const relocateUmdStyles = (existingStyleSet: Set<Element>): void => {
  // 找到 IIFE 新增的 <style> 元素
  const newStyles = Array.from(document.head.querySelectorAll('style')).filter(
    s => !existingStyleSet.has(s)
  );

  if (newStyles.length === 0) return;

  // 定位项目自身的第一个 CSS 资源（<link rel="stylesheet"> 或已有 <style>）
  const firstAppCss =
    document.head.querySelector('link[rel="stylesheet"]') ??
    Array.from(existingStyleSet).find(s => s.parentNode === document.head) ??
    null;

  if (firstAppCss) {
    // 插到项目 CSS 之前 → 项目 CSS 优先级更高，UMD 样式不会覆盖项目主题
    for (const style of newStyles) {
      document.head.insertBefore(style, firstAppCss);
    }
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

    // 记录脚本加载前已存在的 <style> 元素，用于后续定位 IIFE 新增的样式
    const existingStyles = new Set<Element>(document.head.querySelectorAll('style'));

    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      // IIFE 已执行完毕，将其注入的 <style> 移到项目 CSS 之前
      // 确保项目的主题/dark 配置优先级始终高于 UMD 组件样式
      relocateUmdStyles(existingStyles);

      // UMD组件加载完成后，从全局对象中获取组件
      // 默认全局变量名为 VueComponent，可通过配置覆盖
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
const registerComponent = async (app: App, componentConfig: ComponentConfig) => {
  try {
    console.log(
      `Loading component: ${componentConfig.name} (${componentConfig.type}) from ${componentConfig.path}`
    );

    // 使用通用组件加载器
    const remoteComponent = await loadComponent(componentConfig);

    // 更新库信息状态
    const libIndex = remoteLibraries.value.findIndex(l => l.name === componentConfig.name);
    if (libIndex !== -1) {
      const lib = remoteLibraries.value[libIndex];
      lib.status = 'success';

      if (typeof remoteComponent === 'object' && remoteComponent !== null) {
        lib.componentKeys = Object.keys(remoteComponent);
        if (remoteComponent.manifest) {
          lib.manifest = remoteComponent.manifest;
          // 尝试从 manifest 中获取详细信息
          if (!remoteComponent.componentsDetailed && remoteComponent.manifest.componentsDetailed) {
            lib.componentsDetailed = remoteComponent.manifest.componentsDetailed;
          }
          if (!remoteComponent.componentsMap && remoteComponent.manifest.componentsMap) {
            lib.componentsMap = remoteComponent.manifest.componentsMap;
          }
        }

        if (remoteComponent.componentsMap) lib.componentsMap = remoteComponent.componentsMap;
        if (remoteComponent.componentsDetailed)
          lib.componentsDetailed = remoteComponent.componentsDetailed;
      }
    }

    // 打印加载到的组件对象
    console.group(`[Remote Component Loaded]: ${componentConfig.name}`);
    try {
      if (typeof remoteComponent === 'object' && remoteComponent !== null) {
        console.log('Component Keys:', Object.keys(remoteComponent));

        // 打印组件元数据（如果存在）
        if (remoteComponent.manifest) {
          console.log('Manifest:', remoteComponent.manifest);
        }
        if (remoteComponent.componentsMap) {
          console.log('Components Map:', remoteComponent.componentsMap);
        }
        if (remoteComponent.componentsDetailed) {
          console.log('Components Detailed:', remoteComponent.componentsDetailed);
        }
      } else {
        console.log('Component Content (primitive):', remoteComponent);
      }
    } catch (e) {
      console.warn('Could not inspect component content:', e);
    }
    console.groupEnd();

    // 0. 自动注册模式：如果配置了 autoRegister，遍历导出对象并注册所有组件
    if (componentConfig.autoRegister) {
      if (typeof remoteComponent === 'object' && remoteComponent !== null) {
        // 如果是插件，优先安装
        if (remoteComponent.install) {
          app.use(remoteComponent);
          console.log(`Library plugin ${componentConfig.name} installed (via autoRegister)`);
          return;
        }

        // 遍历属性并注册
        // 若库无 install 但有 CSS 注入函数，先执行（兼容多种打包器的命名约定）
        const cssInjectors = [
          'injectStyles',
          '__inject_styles',
          'injectCss',
          '_injectStyles',
          'applyStyles',
          'install_styles',
        ];
        for (const cssKey of cssInjectors) {
          if (typeof remoteComponent[cssKey] === 'function') {
            try {
              remoteComponent[cssKey]();
            } catch (_) {
              /* ignore */
            }
          }
        }
        // 递归检查每个导出组件对象内部的样式注入函数
        for (const key in remoteComponent) {
          const item = remoteComponent[key];
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            for (const cssKey of cssInjectors) {
              if (typeof item[cssKey] === 'function') {
                try {
                  item[cssKey]();
                } catch (_) {
                  /* ignore */
                }
              }
            }
          }
        }

        let registeredCount = 0;
        for (const key in remoteComponent) {
          const component = remoteComponent[key];
          // 简单的组件判断：Vue 组件通常是对象或函数
          if (component && (typeof component === 'object' || typeof component === 'function')) {
            app.component(key, component);
            console.log(`Auto-registered component: ${key}`);
            registeredCount++;
          }
        }

        if (registeredCount === 0) {
          console.warn(`No components found to auto-register in ${componentConfig.name}`);
        } else {
          console.log(
            `Successfully auto-registered ${registeredCount} components from ${componentConfig.name}`
          );
          // 更新注册数量
          const libIndex = remoteLibraries.value.findIndex(l => l.name === componentConfig.name);
          if (libIndex !== -1) {
            remoteLibraries.value[libIndex].registeredCount = registeredCount;
          }
        }
        return; // 自动注册模式下，不再执行后续的单一注册逻辑
      }
    }

    // 1. 插件模式：如果组件有 install 方法，使用 app.use()
    if (remoteComponent.install) {
      app.use(remoteComponent);
      console.log(`Component plugin ${componentConfig.name} registered successfully`);
    }
    // 2. 具名导出模式：如果组件对象包含与 name 匹配的属性
    else if (remoteComponent[componentConfig.name]) {
      app.component(componentConfig.name, remoteComponent[componentConfig.name]);
      console.log(`Component ${componentConfig.name} registered successfully`);
    }
    // 3. 直接组件模式：直接注册返回的对象
    else {
      app.component(componentConfig.name, remoteComponent);
      console.log(`Component ${componentConfig.name} registered as direct component`);
    }
  } catch (error) {
    console.error(`Failed to load component ${componentConfig.name}:`, error);
    throw error; // 重新抛出错误以便上层处理
  }
};

// 将库名/组件名转为路由名称安全字符串（只保留字母数字，其余替换为 _）
function toRouteSafeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}

// 根据已加载的 remoteLibraries 生成 UMD 组件路由树
// 每个成功加载的库生成一个 layout.base 的 folder 节点，
// 库内每个导出组件生成一个 view.umd-component 的叶子路由。
export function generateUmdRoutes(): ElegantRoute[] {
  const routes: ElegantRoute[] = [];

  for (const lib of remoteLibraries.value) {
    if (lib.status !== 'success') continue;

    // 过滤掉非组件的导出 key（插件元数据、模块规范字段等）
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
    const keys = (lib.componentKeys ?? []).filter(k => !EXCLUDED_KEYS.has(k));
    if (keys.length === 0) continue;

    const safeName = toRouteSafeName(lib.name);
    const libPath = `/umd/${lib.name}`;
    const libRouteName = `umd_${safeName}`;

    const children: ElegantRoute[] = keys.map(compName => {
      // 尝试从 componentsDetailed 获取友好显示名、中文名和图标
      const detail = lib.componentsDetailed?.find(
        (d: any) => d.name === compName || d.tag === compName
      );
      const title: string = detail?.zhName ?? detail?.displayName ?? detail?.title ?? compName;
      // 图标去掉前缀 (e.g. "fas fa-cube" → "fa-cube")，菜单渲染时会自动加 "fas"
      const rawIcon: string | undefined = detail?.icon;
      const icon: string | undefined = rawIcon?.replace(/^(fas|far|fab|fal|fad)\s+/, '');

      return {
        name: `${libRouteName}_${toRouteSafeName(compName)}`,
        path: `${libPath}/${compName}`,
        component: 'view.umd-component',
        props: { componentName: compName },
        meta: {
          title,
          ...(icon ? { icon } : {}),
          keepAlive: true,
          umdLibrary: lib.name,
          umdComponent: compName,
        },
      };
    });

    routes.push({
      name: libRouteName,
      path: libPath,
      component: 'layout.base',
      // 访问 folder 路径时重定向到第一个子组件
      redirect: children[0]?.path,
      meta: {
        title: lib.manifest?.zhName ?? lib.name,
        icon: 'fa-cube',
        umdLibrary: lib.name,
      },
      children,
    });
  }

  return routes;
}

// 加载单个 UMD 文件，注册组件并写入 remoteLibraries，使其出现在菜单中
export const loadSingleUmdFile = async (app: App, url: string): Promise<void> => {
  if (!(window as any).Vue) (window as any).Vue = Vue;

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

  const name = url.split('/').pop()?.replace(/\.js$/i, '') ?? url;
  remoteLibraries.value.push({ name, url, status: 'loading' });
  const libIndex = remoteLibraries.value.length - 1;

  try {
    const remoteComponent = await loadUMDComponent(url);

    if (typeof remoteComponent !== 'object' || remoteComponent === null) {
      remoteLibraries.value[libIndex].status = 'error';
      remoteLibraries.value[libIndex].error = '加载结果不是对象';
      return;
    }

    const lib = remoteLibraries.value[libIndex];
    lib.status = 'success';
    lib.componentKeys = Object.keys(remoteComponent).filter(k => !EXCLUDED_KEYS.has(k));
    if (remoteComponent.manifest) {
      lib.manifest = remoteComponent.manifest;
      if (remoteComponent.manifest.componentsDetailed)
        lib.componentsDetailed = remoteComponent.manifest.componentsDetailed;
    }
    if (remoteComponent.componentsDetailed)
      lib.componentsDetailed = remoteComponent.componentsDetailed;

    // CSS 注入
    const cssInjectors = [
      'injectStyles',
      '__inject_styles',
      'injectCss',
      '_injectStyles',
      'applyStyles',
      'install_styles',
    ];
    for (const cssKey of cssInjectors) {
      if (typeof remoteComponent[cssKey] === 'function') {
        try {
          remoteComponent[cssKey]();
        } catch (_) {
          /* ignore */
        }
      }
    }

    // 注册组件到 app
    if (remoteComponent.install) {
      app.use(remoteComponent);
    } else {
      for (const key of lib.componentKeys) {
        const component = remoteComponent[key];
        if (component && (typeof component === 'object' || typeof component === 'function')) {
          if (!Object.prototype.hasOwnProperty.call(app._context.components, key)) {
            app.component(key, component);
          }
        }
      }
    }
  } catch (e) {
    remoteLibraries.value[libIndex].status = 'error';
    remoteLibraries.value[libIndex].error = String(e);
    console.error('[UMD] 单文件加载失败:', e);
  } finally {
    _resolveUmdReady();
  }
};

// 按需加载单个 UMD 文件并注册到 app（懒加载 / remark 路径场景）
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

  // 插件模式
  if (remoteComponent.install) {
    app.use(remoteComponent);
    return;
  }

  // CSS 注入
  const cssInjectors = [
    'injectStyles',
    '__inject_styles',
    'injectCss',
    '_injectStyles',
    'applyStyles',
    'install_styles',
  ];
  for (const cssKey of cssInjectors) {
    if (typeof remoteComponent[cssKey] === 'function') {
      try {
        remoteComponent[cssKey]();
      } catch (_) {
        /* ignore */
      }
    }
  }

  // 注册所有导出的组件（跳过已注册的，避免重复覆盖）
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

// 注册所有远程组件
export const registerRemoteComponents = async (
  app: App,
  configUrl: string = '/codes/umdComponents.json'
) => {
  // 暴露 Vue 到全局，供 UMD 组件使用
  if (!(window as any).Vue) {
    (window as any).Vue = Vue;
  }

  // 针对 login 页面跳过加载的特殊处理
  if (configUrl === 'empty_skip_load') {
    _resolveUmdReady();
    return;
  }

  try {
    const config = await loadConfig(configUrl);
    console.log('Config loaded:', config);

    if (!config.components || config.components.length === 0) {
      console.warn('No components found in config');
      return;
    }

    // 记录加载结果
    const loadResults: Array<{ name: string; success: boolean; error?: string }> = [];

    // 初始化 remoteLibraries
    remoteLibraries.value = config.components.map(c => ({
      name: c.name,
      url: c.path,
      status: 'pending',
    }));

    // 控制并发数以降低内存峰值 (Chunk/Sequential Loading)
    const CONCURRENCY_LIMIT = 3;

    // 按块加载以降低初始内存飙升
    for (let i = 0; i < config.components.length; i += CONCURRENCY_LIMIT) {
      const chunk = config.components.slice(i, i + CONCURRENCY_LIMIT);

      const loadPromises = chunk.map(async componentConfig => {
        // 查找并更新状态为 loading
        const libIndex = remoteLibraries.value.findIndex(l => l.name === componentConfig.name);
        if (libIndex !== -1) {
          remoteLibraries.value[libIndex].status = 'loading';
        }

        try {
          await registerComponent(app, componentConfig);
          loadResults.push({ name: componentConfig.name, success: true });

          // 成功后在 registerComponent 内部逻辑已经（或即将）处理详细信息的提取，
          // 这里主要更新最终状态，防止在 registerComponent 中漏掉
          if (libIndex !== -1 && remoteLibraries.value[libIndex].status !== 'success') {
            remoteLibraries.value[libIndex].status = 'success';
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          loadResults.push({
            name: componentConfig.name,
            success: false,
            error: errorMessage,
          });

          // 更新错误状态
          if (libIndex !== -1) {
            remoteLibraries.value[libIndex].status = 'error';
            remoteLibraries.value[libIndex].error = errorMessage;
          }
        }
      });

      await Promise.allSettled(loadPromises);
    }

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
  } catch (error) {
    console.error('Failed to register remote components:', error);
  } finally {
    // 无论成功或失败，通知等待方 UMD 加载阶段已结束
    _resolveUmdReady();
  }
};
