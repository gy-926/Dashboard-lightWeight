import type { ComponentConfig } from './types';
import { umdLoadingCount } from './state';

const umdLoadPromises = new Map<string, Promise<any>>();

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
  const resolvedGlobalName = globalName || 'VueComponent';
  const loadKey = `${absoluteUrl}::${resolvedGlobalName}`;
  const pendingLoad = umdLoadPromises.get(loadKey);
  if (pendingLoad) return pendingLoad;

  umdLoadingCount.value++;

  const loadPromise = new Promise<any>((resolve, reject) => {
    const existingScript = Array.from(document.scripts).find(
      script => script.src === absoluteUrl
    );

    const resolveGlobalComponent = () => {
      const component = (window as any)[resolvedGlobalName];
      if (component) {
        resolve(component);
      } else {
        reject(new Error(`组件加载失败：未找到 ${resolvedGlobalName} from ${url}`));
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
