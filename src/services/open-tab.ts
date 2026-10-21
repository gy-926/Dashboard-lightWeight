import { isNavigationFailure, NavigationFailureType, type Router } from 'vue-router';
import type { MenuItem } from '@/layouts/modules/global-menu/types';

export interface OpenTabOptions {
  /** 外部 HTTP(S) 地址默认新窗口打开；false 使用当前窗口。内部地址始终使用工作台标签。 */
  newTab?: boolean;
  /** 标签已经存在时是否切换过去，默认 true；标签身份仍以路径为准。 */
  activateExisting?: boolean;
  /** 替换当前历史记录，默认 false。 */
  replace?: boolean;
}

export interface PathInfo {
  key: string;
  path: string;
  title?: string;
  icon?: string;
  kvid?: string;
  url?: string;
  type?: 'webview' | 'extjs' | 'vue' | 'umd';
}

interface OpenTabMenuStore {
  readonly menuList: MenuItem[];
  readonly tabsList: MenuItem[];
  addTab(item: MenuItem): void;
}

function normalizePath(path: string): string {
  const value = path.trim();
  if (!value) return '';
  return value.startsWith('/') ? value : `/${value}`;
}

function findMenu(items: MenuItem[], match: (item: MenuItem) => boolean): MenuItem | undefined {
  for (const item of items) {
    if (match(item)) return item;
    const child = item.children && findMenu(item.children, match);
    if (child) return child;
  }
}

function pathInfo(item: MenuItem): PathInfo {
  const legacy = item as MenuItem & Record<string, any>;
  const meta = item.meta ?? {};
  const url = String(meta.url ?? legacy.url ?? legacy.Url ?? legacy.functionKvid ?? legacy.FunctionKvid ?? '');
  const explicitType = meta.type ?? legacy.type;
  const type = ['webview', 'extjs', 'vue', 'umd'].includes(String(explicitType))
    ? explicitType as PathInfo['type']
    : url.startsWith('ExtJS.') ? 'extjs'
    : url.split(/[?#]/)[0].endsWith('.vue') ? 'vue' : 'webview';
  return {
    key: item.key,
    path: item.path,
    title: item.title || legacy.DisplayName || legacy.Title,
    icon: item.icon || legacy.Icon,
    kvid: item.kvid || (meta.kvid as string | undefined) || legacy.Kvid,
    url: url || undefined,
    type,
  };
}

/** 工作台唯一 OpenTab 业务实现；Bridge 与 Vue composable 只负责提供依赖。 */
export function createOpenTabService(router: Router, menuStore: OpenTabMenuStore) {
  function findPathInfo(path: string): PathInfo | null {
    const normalized = normalizePath(path);
    if (!normalized) return null;
    const resolvedPath = router.resolve(normalized).path;
    const item = findMenu(menuStore.menuList, item => item.path === resolvedPath);
    return item ? pathInfo(item) : null;
  }

  function findPathInfoByKvid(kvid: string): PathInfo | null {
    if (!kvid) return null;
    const item = findMenu(menuStore.menuList, item => {
      const info = pathInfo(item);
      return info.kvid === kvid || item.key === kvid;
    });
    return item ? pathInfo(item) : null;
  }

  async function openTab(url: string, options?: OpenTabOptions): Promise<boolean> {
    try {
      const target = url.trim();
      if (!target) return false;
      if (/^https?:\/\//i.test(target)) {
        if (options?.newTab !== false) {
          window.open(target, '_blank', 'noopener,noreferrer');
        } else if (options.replace) {
          window.location.replace(target);
        } else {
          window.location.assign(target);
        }
        return true;
      }
      return await openPath(target, options);
    } catch (error) {
      console.error('[OpenTab] 打开失败:', error);
      return false;
    }
  }

  async function openPath(path: string, options?: OpenTabOptions): Promise<boolean> {
    try {
      if (/^https?:\/\//i.test(path.trim())) return await openTab(path, options);
      const normalized = normalizePath(path);
      if (!normalized) return false;
      const target = router.resolve(normalized);
      if (options?.activateExisting === false && menuStore.tabsList.some(tab => tab.path === target.path)) {
        return true;
      }

      const failure = await (options?.replace ? router.replace(target.fullPath) : router.push(target.fullPath));
      // 重复访问当前地址视为成功；被守卫阻止、取消或抛错则失败。
      if (failure && !isNavigationFailure(failure, NavigationFailureType.duplicated)) return false;

      // 导航确认后再补充标签元数据；重定向时以最终页面为准，避免留下未打开的标签。
      const info = findPathInfo(router.currentRoute.value.path);
      if (info) {
        menuStore.addTab({
          key: info.key,
          path: info.path,
          title: info.title || '未命名页面',
          icon: info.icon || 'fa-file',
          kvid: info.kvid,
          meta: { ...router.currentRoute.value.meta, kvid: info.kvid, url: info.url, type: info.type },
        });
      }
      return true;
    } catch (error) {
      console.error('[OpenTab] 路径导航失败:', error);
      return false;
    }
  }

  async function openByKvid(kvid: string, options?: OpenTabOptions): Promise<boolean> {
    const info = findPathInfoByKvid(kvid);
    return info ? openPath(info.path, options) : false;
  }

  async function openMenuItem(item: MenuItem, options?: OpenTabOptions): Promise<boolean> {
    return item.path ? openPath(item.path, options) : false;
  }

  return { openTab, openPath, openByKvid, openMenuItem, findPathInfo, findPathInfoByKvid };
}
