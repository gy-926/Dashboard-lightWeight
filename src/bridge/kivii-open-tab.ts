import router from '@/router';
import type { Pinia } from 'pinia';
import { useMenuStore } from '@/layouts/modules/global-menu/store';
import { createOpenTabService, type OpenTabOptions } from '@/services/open-tab';

export type { OpenTabOptions } from '@/services/open-tab';

/** Kivii Bridge 适配层；业务导航、菜单查找和标签处理由共享服务负责。 */
export class KiviiOpenTab {
  public interfaceType = 'IOpenTab';
  private service: ReturnType<typeof createOpenTabService>;

  constructor(pinia?: Pinia) {
    this.service = createOpenTabService(router, useMenuStore(pinia));
  }

  open(url: string, options?: OpenTabOptions): Promise<boolean> {
    return this.service.openTab(url, options);
  }

  openPath(path: string, options?: OpenTabOptions): Promise<boolean> {
    return this.service.openPath(path, options);
  }

  openByKvid(kvid: string, options?: OpenTabOptions): Promise<boolean> {
    return this.service.openByKvid(kvid, options);
  }
}

/**
 * 快捷函数：打开 URL 或路径
 */
export function openTab(url: string, options?: OpenTabOptions): Promise<boolean> {
  if (typeof window !== 'undefined' && window.kivii) {
    return window.kivii.openTab.open(url, options);
  }
  console.warn('[KiviiOpenTab] kivii 未初始化');
  return Promise.resolve(false);
}

/**
 * 快捷函数：打开内部路径
 */
export function openTabPath(path: string, options?: OpenTabOptions): Promise<boolean> {
  return openTab(path, options);
}

/**
 * 快捷函数：通过 kvid 打开
 */
export function openTabByKvid(kvid: string, options?: OpenTabOptions): Promise<boolean> {
  if (typeof window !== 'undefined' && window.kivii) {
    return window.kivii.openTab.openByKvid(kvid, options);
  }
  console.warn('[KiviiOpenTab] kivii 未初始化');
  return Promise.resolve(false);
}
