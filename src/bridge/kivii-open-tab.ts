/**
 * KiviiBridge OpenTab 自定义实现
 *
 * 用于统一管理 IframePage 三种渲染类型（webview、extjs、vue）的标签页打开功能
 */

import type { Router } from 'vue-router';
import router from '@/router';
import type { Pinia } from 'pinia';
import { useMenuStore } from '@/layouts/modules/global-menu/store';
import type { MenuItem } from '@/layouts/modules/global-menu/types';

/**
 * 内部菜单项接口（包含额外属性）
 */
interface InternalMenuItem extends MenuItem {
  kvid?: string;
  url?: string;
}

/**
 * OpenTab 选项配置
 */
export interface OpenTabOptions {
  /** 是否在新标签页打开（可选，用于未来扩展） */
  newTab?: boolean;
  /** 是否激活已存在的标签（默认 true） */
  activateExisting?: boolean;
}

/**
 * 路径信息接口
 */
interface PathInfo {
  /** 标签缓存键（路由名优先） */
  key: string;
  /** 路由路径 */
  path: string;
  /** 页面标题 */
  title?: string;
  /** 图标 */
  icon?: string;
  /** Kvid */
  kvid?: string;
  /** URL */
  url?: string;
  /** 页面类型 */
  type?: 'webview' | 'extjs' | 'vue';
}

/**
 * KiviiOpenTab 自定义实现类
 *
 * 负责将 openTab 的调用转换为路由跳转和标签页管理
 */
export class KiviiOpenTab {
  public interfaceType = 'IOpenTab';
  private router: Router;
  private menuStore: ReturnType<typeof useMenuStore>;

  constructor(pinia?: Pinia) {
    this.router = router;
    this.menuStore = useMenuStore(pinia);
  }

  /**
   * 打开外部 URL 或内部路径
   * @param url - 完整的 URL 或内部路径
   * @param options - 打开选项
   */
  async open(url: string, options?: OpenTabOptions): Promise<boolean> {
    try {


      // 判断是否为外部 URL（http/https 开头）
      if (this.isExternalUrl(url)) {
        // 外部链接：使用 window.open
        window.open(url, '_blank', 'noopener,noreferrer');
        return true;
      }

      // 内部路径：转换为路由跳转
      return this.openPath(url, options);
    } catch (error) {
      console.error('[KiviiOpenTab] 打开 URL 失败:', error);
      return false;
    }
  }

  /**
   * 打开内部路径
   * @param path - 内部路径（如 /dashboard、/analysis/overview）
   * @param options - 打开选项
   */
  async openPath(path: string, options?: OpenTabOptions): Promise<boolean> {
    try {


      if (!path) {
        console.warn('[KiviiOpenTab] 路径为空');
        return false;
      }

      // 标准化路径
      const normalizedPath = this.normalizePath(path);

      // 查找路径信息（从菜单中获取）
      const pathInfo = this.findPathInfo(normalizedPath);

      // 添加标签页
      if (pathInfo) {
        const tab: MenuItem = {
          key: pathInfo.key,
          path: pathInfo.path,
          title: pathInfo.title || '未命名页面',
          icon: pathInfo.icon || 'fa-file',
          children: [],
        };
        // 存储额外信息到 meta
        if (pathInfo.kvid || pathInfo.url || pathInfo.type) {
          (tab as any).meta = {
            kvid: pathInfo.kvid,
            url: pathInfo.url,
            type: pathInfo.type,
          };
        }
        this.menuStore.addTab(tab);
      }

      // 路由跳转
      this.router.push(normalizedPath);

      return true;
    } catch (error) {
      console.error('[KiviiOpenTab] 打开路径失败:', error);
      return false;
    }
  }

  /**
   * 打开功能模块（通过 kvid 打开）
   * @param kvid - 功能模块的 kvid
   * @param options - 打开选项
   */
  async openByKvid(kvid: string, options?: OpenTabOptions): Promise<boolean> {
    try {


      // 查找 kvid 对应的路径信息
      const pathInfo = this.findPathInfoByKvid(kvid);

      if (!pathInfo || !pathInfo.path) {
        console.warn('[KiviiOpenTab] 未找到 kvid 对应的路径:', kvid);
        // 如果找不到，仍然尝试通过路径跳转
        this.router.push('/');
        return false;
      }

      return this.openPath(pathInfo.path, options);
    } catch (error) {
      console.error('[KiviiOpenTab] 打开 kvid 失败:', error);
      return false;
    }
  }

  /**
   * 判断是否为外部 URL
   */
  private isExternalUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  /**
   * 标准化路径
   */
  private normalizePath(path: string): string {
    // 确保路径以 / 开头
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    // 移除查询参数和 hash
    const cleanPath = path.split('?')[0].split('#')[0];
    return cleanPath;
  }

  /**
   * 从菜单中查找路径信息
   */
  private findPathInfo(path: string): PathInfo | null {
    const menuList = this.menuStore.menuList;

    // 递归查找菜单
    const findInMenu = (items: any[]): PathInfo | null => {
      for (const item of items) {
        if (item.path === path) {
          return {
            key: item.key,
            path: item.path,
            title: item.title || item.DisplayName || item.Title,
            icon: item.icon || item.Icon,
            kvid: item.kvid || item.Kvid,
            url: item.url || item.Url || item.functionKvid || item.FunctionKvid,
            type: this.getPageType(item),
          };
        }
        if (item.children && item.children.length > 0) {
          const found = findInMenu(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findInMenu(menuList);
  }

  /**
   * 通过 kvid 查找路径信息
   */
  private findPathInfoByKvid(kvid: string): PathInfo | null {
    const menuList = this.menuStore.menuList;

    // 递归查找菜单
    const findInMenu = (items: any[]): PathInfo | null => {
      for (const item of items) {
        if (item.kvid === kvid || item.Kvid === kvid) {
          return {
            key: item.key,
            path: item.path,
            title: item.title || item.DisplayName || item.Title,
            icon: item.icon || item.Icon,
            kvid: item.kvid || item.Kvid,
            url: item.url || item.Url || item.functionKvid || item.FunctionKvid,
            type: this.getPageType(item),
          };
        }
        if (item.children && item.children.length > 0) {
          const found = findInMenu(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findInMenu(menuList);
  }

  /**
   * 获取页面类型
   */
  private getPageType(item: any): 'webview' | 'extjs' | 'vue' {
    const functionKvid = item.functionKvid || item.FunctionKvid || '';
    const url = item.url || item.Url || '';

    if (functionKvid.startsWith('ExtJS.')) {
      return 'extjs';
    }
    if (functionKvid.endsWith('.vue') || url.endsWith('.vue')) {
      return 'vue';
    }
    return 'webview';
  }
}

/**
 * 快捷函数：打开 URL 或路径
 */
export function openTab(url: string, options?: OpenTabOptions): Promise<boolean> {
  if (typeof window !== 'undefined' && (window as any).kivii) {
    return (window as any).kivii.openTab.open(url, options);
  }
  // 如果 kivii 未初始化，返回失败
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
  if (typeof window !== 'undefined' && (window as any).kivii) {
    return (window as any).kivii.openTab.openByKvid(kvid, options);
  }
  console.warn('[KiviiOpenTab] kivii 未初始化');
  return Promise.resolve(false);
}
