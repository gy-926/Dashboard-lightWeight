import type { RouteRecordRaw } from 'vue-router';
import type { CachedRoutes, ElegantRoute } from './types';
import { globalConfig } from './config';
import { menuRootKvid } from './menu-state';
import { transformRoutesToVueRoutes } from './conversion';

// ==================== 缓存策略 ====================

const CACHE_KEY = 'DYNAMIC_ROUTES_CACHE';
const CACHE_VERSION = 'v8'; // UMD source_url 进入路由元数据，强制淘汰缺少脚本地址的旧缓存
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

// 缓存路由（直接存储 ElegantRoute 格式，避免反向序列化在生产构建中因代码压缩而丢失组件映射）
export function cacheDynamicRoutes(routes: ElegantRoute[]): void {
  try {
    const cacheData: CachedRoutes & { version?: string } = {
      routes,
      timestamp: Date.now(),
      userCode: globalConfig.value.UserCode || '',
      internalCode: globalConfig.value.InternalCode,
      menuRootKvid: menuRootKvid.value ?? undefined,
      version: CACHE_VERSION,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    console.warn('缓存路由失败:', e);
  }
}

// 清除缓存
export function clearDynamicRoutesCache(): void {
  localStorage.removeItem(CACHE_KEY);
}

// 从缓存恢复（返回已转换的 Vue Router 格式）
export function restoreDynamicRoutesFromCache(): RouteRecordRaw[] | null {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return null;

    const cacheData: CachedRoutes & { version?: string } = JSON.parse(cacheStr);

    // 检查缓存版本
    if (cacheData.version !== CACHE_VERSION) {
      clearDynamicRoutesCache();
      return null;
    }

    // 检查缓存是否过期
    const isExpired = Date.now() - cacheData.timestamp > CACHE_EXPIRY;
    if (isExpired) {
      clearDynamicRoutesCache();
      return null;
    }

    // 检查用户是否一致
    if (cacheData.userCode !== globalConfig.value.UserCode) {
      return null;
    }

    // 检查 InternalCode 是否一致
    if (cacheData.internalCode !== globalConfig.value.InternalCode) {
      return null;
    }

    // 恢复 menuRootKvid，供 AutoStartup 查询使用
    if (cacheData.menuRootKvid) {
      menuRootKvid.value = cacheData.menuRootKvid;
    }

    // 递归验证和清理路由数据
    const validateRoutes = (routes: any[]): ElegantRoute[] | null => {
      if (!Array.isArray(routes)) return null;

      const validRoutes: ElegantRoute[] = [];

      for (const route of routes) {
        // 检查路由对象是否有效
        if (!route || typeof route !== 'object') {
          console.warn('[DynamicRoutes] 无效的路由对象，跳过');
          continue;
        }

        // 检查必需属性
        if (route.path === undefined) {
          console.warn('[DynamicRoutes] 路由缺少 path 属性，跳过:', route.name);
          continue;
        }

        // 递归处理 children
        if (route.children && Array.isArray(route.children)) {
          const validChildren = validateRoutes(route.children);
          if (validChildren) {
            route.children = validChildren;
          } else {
            delete route.children;
          }
        }

        validRoutes.push(route as ElegantRoute);
      }

      return validRoutes.length > 0 ? validRoutes : null;
    };

    const validRoutes = validateRoutes(cacheData.routes);
    if (!validRoutes) {
      console.warn('[DynamicRoutes] 缓存路由无效，清除缓存');
      clearDynamicRoutesCache();
      return null;
    }

    // 转换为 Vue Router 格式

    const vueRoutes = transformRoutesToVueRoutes(validRoutes);
    return vueRoutes;
  } catch (e) {
    console.warn('恢复缓存路由失败:', e);
    return null;
  }
}
