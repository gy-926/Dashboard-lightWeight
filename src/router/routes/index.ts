import { ref } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { autoRoutes } from '../auto/routes';
import { getCurrentUser } from '@/api/nest-client';
import type { MenuItem } from './types';
import { fetchMenuData, fetchAutoStartupKvid } from './menu-service';
import { generateUmdRoutes, umdComponentsReady } from '@/utils/remoteComponentLoader';
import { getGlobalConfig } from './config';
import { menuRootKvid, autoStartupKvid } from './menu-state';
import { getMenuTree, generateRoutes } from './menu-routes';
import { getStaticRoutes, transformRoutesToVueRoutes } from './conversion';

// 保持所有现有导入路径，领域实现位于独立模块。
export { setGlobalConfig, getGlobalConfig, syncInternalCodeToEntryPath } from './config';
export {
  cacheDynamicRoutes,
  clearDynamicRoutesCache,
  restoreDynamicRoutesFromCache,
} from './cache';
export { autoStartupKvid } from './menu-state';
export { getMenuTree, analyzeTree, generateRoutes } from './menu-routes';
export {
  layouts,
  views,
  getStaticRoutes,
  transformRoutesToVueRoutes,
  addRouteWithChildren,
} from './conversion';

export async function getRootMenu(): Promise<MenuItem[]> {
  const config = getGlobalConfig();
  const response = await fetchMenuData(config.InternalCode);

  // 保存 menuRoot.Kvid
  menuRootKvid.value = response.MenuRoot?.Kvid ?? null;

  // 过滤掉类型为 System 的菜单
  const filteredMenus = response.MenusMain.Results.filter(
    (item: MenuItem) => item.Type !== 'System'
  );

  return filteredMenus;
}

// ==================== 主入口函数 ====================

// 完整的动态路由生成流程
export async function generateDynamicRoutes(): Promise<{
  constantRoutes: RouteRecordRaw[];
  authRoutes: RouteRecordRaw[];
  initialRedirect: string | null;
}> {
  // 等待后台 UMD 组件加载完成，确保能正确生成 UMD 路由
  await umdComponentsReady;

  // 始终生成 UMD 路由（组件在 main.ts 中已触发加载，并在上面等待完成，此处直接读取）
  const umdVueRoutes = transformRoutesToVueRoutes(generateUmdRoutes());

  // 权限可能随角色和部门变化，登录后必须从服务端获取当前可见菜单。
  const menuItems = await getRootMenu();
  const menuTree = getMenuTree(menuItems);
  const elegantRoutes = generateRoutes(menuTree);
  const vueRoutes = transformRoutesToVueRoutes(elegantRoutes);
  const isSuperAdmin = getCurrentUser()?.role === 'super_admin';
  const visibleAutoRoutes = autoRoutes.map(route => {
    if (route.path !== '/' || !('children' in route) || !route.children) return route;
    return {
      ...route,
      children: route.children.filter(child => child.path !== 'system' || isSuperAdmin),
    } satisfies RouteRecordRaw;
  });
  const authRoutes: RouteRecordRaw[] = [...visibleAutoRoutes, ...vueRoutes, ...umdVueRoutes];

  // 保存自动启动配置；首页接入另行实现。
  const kvid = menuRootKvid.value ? await fetchAutoStartupKvid(menuRootKvid.value) : null;
  autoStartupKvid.value = kvid;

  return {
    constantRoutes: getStaticRoutes(),
    authRoutes,
    initialRedirect: null, // 保持当前首页介绍页的行为
  };
}

// ==================== 状态管理 ====================

// 路由生成状态
const isGenerating = ref(false);
const lastGeneratedAt = ref<number | null>(null);

export function isRouteGenerating(): boolean {
  return isGenerating.value;
}

export function getLastGeneratedTime(): number | null {
  return lastGeneratedAt.value;
}

// 异步生成路由（不阻塞）
export async function asyncGenerateRoutes(): Promise<RouteRecordRaw[]> {
  if (isGenerating.value) {
    return [];
  }

  isGenerating.value = true;

  try {
    const result = await generateDynamicRoutes();
    lastGeneratedAt.value = Date.now();
    return result.authRoutes;
  } finally {
    isGenerating.value = false;
  }
}
