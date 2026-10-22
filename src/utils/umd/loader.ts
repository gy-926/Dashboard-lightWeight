import type { ComponentConfig } from './types';
import { umdLoadingCount } from './state';
import { createUmdRequestUrl } from '@/utils/umd-cache';

export const UMD_LOAD_TIMEOUT_MS = 15000;
export class UmdLoadError extends Error {}

const umdLoadPromises = new Map<string, Promise<any>>();
const umdRetryCounts = new Map<string, number>();

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
  const retryKey = new URL(url, document.baseURI).href;
  const attempt = umdRetryCounts.get(retryKey) || 0;
  const request = new URL(createUmdRequestUrl(url), document.baseURI);
  // 被移除的 script 在部分浏览器中仍可能保持网络请求；重试使用独立 URL 避免复用挂起请求。
  if (attempt) request.searchParams.set('__kivii_umd_retry', String(attempt));
  const requestUrl = request.href;
  const absoluteUrl = new URL(requestUrl, document.baseURI).href;
  const loadKey = `${absoluteUrl}::${globalName || 'auto'}`;
  const pendingLoad = umdLoadPromises.get(loadKey);
  if (pendingLoad) return pendingLoad;

  umdLoadingCount.value++;

  const loadPromise = new Promise<any>((resolve, reject) => {
    let script = Array.from(document.scripts).find(script => script.src === absoluteUrl);
    const existingStyles = new Set<Element>(document.head.querySelectorAll('style'));
    let settled = false;
    const cleanup = () => {
      clearTimeout(timer);
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
    };
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (script) {
        script.dataset.umdLoadState = 'error';
        script.remove();
      }
      umdRetryCounts.set(retryKey, attempt + 1);
      reject(new UmdLoadError(message));
    };
    const onError = () => fail(`UMD 脚本加载失败，请重试: ${url}`);
    const onLoad = () => {
      if (settled) return;
      try {
        const resolved = resolveLoadedUmdLibrary(requestUrl, globalName);
        if (!resolved) {
          fail(`UMD 脚本已执行，但无法解析导出对象: ${url}`);
          return;
        }
        script!.dataset.umdLoadState = 'loaded';
        relocateUmdStyles(existingStyles);
        settled = true;
        cleanup();
        resolve(resolved.library);
      } catch (error) {
        fail(`UMD 模块解析失败: ${url} - ${error}`);
      }
    };
    const timer = setTimeout(() => fail(`UMD 脚本加载超时，请检查网络后重试: ${url}`), UMD_LOAD_TIMEOUT_MS);
    if (script?.dataset.umdLoadState === 'error') {
      script.remove();
      script = undefined;
    }
    if (script?.dataset.umdLoadState === 'loaded') {
      onLoad();
      return;
    }
    const isNew = !script;
    if (!script) {
      script = document.createElement('script');
      script.src = requestUrl;
      script.dataset.umdLoadState = 'loading';
    }
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    if (isNew) document.head.appendChild(script);
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
