import type { ComponentConfig } from './types';

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
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      const component = (window as any)[globalName || 'VueComponent'];
      if (component) {
        resolve(component);
        return;
      }
    }

    const existingStyles = new Set<Element>(document.head.querySelectorAll('style'));
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      relocateUmdStyles(existingStyles);
      const component = (window as any)[globalName || 'VueComponent'];
      if (component) {
        resolve(component);
      } else {
        reject(new Error(`组件加载失败：未找到 ${globalName || 'VueComponent'} from ${url}`));
      }
    };
    script.onerror = () => reject(new Error(`脚本加载失败: ${url}`));
    document.head.appendChild(script);
  });
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
