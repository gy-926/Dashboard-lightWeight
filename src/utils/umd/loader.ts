import type { ComponentConfig } from './types';
import { umdLoadingCount } from './state';

const umdLoadPromises = new Map<string, Promise<any>>();

interface KiviiUmdRegistry {
  byUrl?: Record<string, any>;
  byFileName?: Record<string, any>;
}

interface ResolvedUmdLibrary {
  library: any;
  resolvedBy: string;
}

function getUmdFileName(url: string): string {
  const pathname = new URL(url, document.baseURI).pathname;
  return decodeURIComponent(pathname.split('/').pop() || '');
}

/**
 * 按兼容优先级解析 UMD 导出对象：
 * 1. 后端显式配置的 globalName（旧协议）
 * 2. 新模板按 URL / 文件名写入的 Registry
 * 3. 扫描 manifest.fileName（兼容未接入 Registry 的中间版本）
 * 4. 最早期约定的 window.VueComponent
 */
function resolveLoadedUmdLibrary(url: string, globalName?: string): ResolvedUmdLibrary | undefined {
  const absoluteUrl = new URL(url, document.baseURI).href;
  const fileName = getUmdFileName(url);

  if (globalName && (window as any)[globalName]) {
    return {
      library: (window as any)[globalName],
      resolvedBy: `globalName:${globalName}`,
    };
  }

  const registry = (window as any).__KIVII_UMD_REGISTRY__ as KiviiUmdRegistry | undefined;
  if (registry?.byUrl?.[absoluteUrl]) {
    return {
      library: registry.byUrl[absoluteUrl],
      resolvedBy: `registry:url:${absoluteUrl}`,
    };
  }
  if (registry?.byFileName?.[fileName]) {
    return {
      library: registry.byFileName[fileName],
      resolvedBy: `registry:fileName:${fileName}`,
    };
  }

  for (const key of Object.keys(window)) {
    try {
      const candidate = (window as any)[key];
      if (
        candidate &&
        typeof candidate === 'object' &&
        candidate.manifest?.fileName === fileName
      ) {
        return {
          library: candidate,
          resolvedBy: `manifest:${key}`,
        };
      }
    } catch {
      // 某些 window 属性可能包含跨域或只读访问限制，忽略并继续查找。
    }
  }

  if ((window as any).VueComponent) {
    return {
      library: (window as any).VueComponent,
      resolvedBy: 'legacy-default:VueComponent',
    };
  }

  return undefined;
}

// 将 UMD IIFE 注入的 <style> 移到项目自身 CSS 之前，
// 防止 UMD 主题变量因级联位置靠后而覆盖项目样式
export function relocateUmdStyles(existingStyleSet: Set<Element>): void {
  const newStyles = Array.from(document.head.querySelectorAll('style')).filter(
    s => !existingStyleSet.has(s)
  );
  if (newStyles.length === 0) return;

  const firstAppCss =
    document.head.querySelector('link[rel="stylesheet"]') ??
    Array.from(existingStyleSet).find(s => s.parentNode === document.head) ??
    null;

  if (firstAppCss) {
    for (const style of newStyles) {
      document.head.insertBefore(style, firstAppCss);
    }
  }
}

export function loadUMDComponent(url: string, globalName?: string): Promise<any> {
  const absoluteUrl = new URL(url, document.baseURI).href;
  const loadKey = `${absoluteUrl}::${globalName || 'auto'}`;
  const pendingLoad = umdLoadPromises.get(loadKey);
  if (pendingLoad) return pendingLoad;

  umdLoadingCount.value++;

  const loadPromise = new Promise<any>((resolve, reject) => {
    const existingScript = Array.from(document.scripts).find(
      script => script.src === absoluteUrl
    );

    const resolveGlobalComponent = () => {
      const resolved = resolveLoadedUmdLibrary(url, globalName);
      if (resolved) {
        console.log(`[UMD] ${url} resolved by ${resolved.resolvedBy}`);
        resolve(resolved.library);
      } else {
        reject(
          new Error(
            `UMD 脚本已执行，但无法解析导出对象: ${url}` +
              (globalName ? ` (globalName: ${globalName})` : '')
          )
        );
      }
    };

    if (existingScript) {
      const loadState = existingScript.dataset.umdLoadState;
      const resourceLoaded =
        loadState === 'loaded' || performance.getEntriesByName(absoluteUrl).length > 0;

      if (resourceLoaded) {
        resolveGlobalComponent();
        return;
      }
      if (loadState === 'error') {
        reject(new Error(`脚本加载失败: ${url}`));
        return;
      }

      existingScript.addEventListener('load', resolveGlobalComponent, { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error(`脚本加载失败: ${url}`)),
        { once: true }
      );
      return;
    }

    const existingStyles = new Set<Element>(document.head.querySelectorAll('style'));
    const script = document.createElement('script');
    script.src = url;
    script.dataset.umdLoadState = 'loading';
    script.onload = () => {
      script.dataset.umdLoadState = 'loaded';
      relocateUmdStyles(existingStyles);
      resolveGlobalComponent();
    };
    script.onerror = () => {
      script.dataset.umdLoadState = 'error';
      reject(new Error(`脚本加载失败: ${url}`));
    };
    document.head.appendChild(script);
  });

  const trackedPromise = loadPromise.finally(() => {
    umdLoadPromises.delete(loadKey);
    umdLoadingCount.value = Math.max(0, umdLoadingCount.value - 1);
  });
  umdLoadPromises.set(loadKey, trackedPromise);

  return trackedPromise;
}

export async function loadESMComponent(url: string): Promise<any> {
  try {
    const module = await import(/* @vite-ignore */ url);
    return module.default || module;
  } catch (error) {
    throw new Error(`ESM 组件加载失败: ${url} - ${error}`);
  }
}

export async function loadComponent(componentConfig: ComponentConfig): Promise<any> {
  const { type, path, globalName } = componentConfig;
  switch (type) {
    case 'umd':
      return loadUMDComponent(path, globalName);
    case 'esm':
      return loadESMComponent(path);
    default:
      throw new Error(`不支持的组件类型: ${type}`);
  }
}
