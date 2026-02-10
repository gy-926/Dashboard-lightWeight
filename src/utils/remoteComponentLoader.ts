import type { App } from 'vue';
import * as Vue from 'vue';

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

// 加载配置文件
const loadConfig = async (configPath: string): Promise<Config> => {
  try {
    const response = await fetch(configPath);
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
    /* @vite-ignore */ // 忽略 Vite 对动态导入的警告
    const module = await import(url);
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

// 注册所有远程组件
export const registerRemoteComponents = async (
  app: App,
  configUrl: string = '/codes/umdComponents.json'
) => {
  // 暴露 Vue 到全局，供 UMD 组件使用
  if (!(window as any).Vue) {
    (window as any).Vue = Vue;
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

    // 并行加载所有组件
    const loadPromises = config.components.map(async componentConfig => {
      try {
        await registerComponent(app, componentConfig);
        loadResults.push({ name: componentConfig.name, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        loadResults.push({
          name: componentConfig.name,
          success: false,
          error: errorMessage,
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
  } catch (error) {
    console.error('Failed to register remote components:', error);
  }
};
