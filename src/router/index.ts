import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import { setupRouteGuards } from './guards';
import {
  generateDynamicRoutes,
  getStaticRoutes,
  addRouteWithChildren,
  clearDynamicRoutesCache,
} from './routes';
import { UnauthorizedError } from './routes/menu-service';

// 初始静态路由（用于首次渲染）
const initialRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login/index.vue'),
    meta: { hidden: true },
  },
  {
    path: '/login1',
    name: 'login1',
    component: () => import('../views/login/login1.vue'),
    meta: { hidden: true },
  },
  {
    path: '/',
    component: () => import('../layouts/base-layout/index.vue'),
    redirect: '/home',
    meta: { hidden: true },
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('../views/home.vue'),
        meta: { title: '首页', icon: 'fa-home' },
      },
    ],
  },
  ...getStaticRoutes(),
];

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: initialRoutes,
});

// 动态路由状态
let dynamicRoutesLoaded = false;
let routesLoadPromise: Promise<void> | null = null;
let originalAuthRoutes: RouteRecordRaw[] = []; // 保存原始路由树
let targetNavigation: string | null = null; // 目标导航路径（用于刷新时保存原路径）
let dynamicRouteNames: string[] = []; // 记录动态添加的路由名，用于重置时清理

// 递归收集所有路由的 name
function collectRouteNames(routes: RouteRecordRaw[]): string[] {
  return routes.flatMap(r => [
    ...(r.name ? [r.name as string] : []),
    ...(r.children ? collectRouteNames(r.children) : []),
  ]);
}

// 获取动态路由加载状态
function isDynamicRoutesReady() {
  return dynamicRoutesLoaded;
}

// 设置目标导航路径（供 guards 使用）
function setTargetNavigation(path: string) {
  if (!dynamicRoutesLoaded && !targetNavigation) {
    // 过滤掉 404 和通配符路径
    if (path !== '/404' && !path.startsWith('/:pathMatch')) {
      targetNavigation = path;
    }
  }
}

// 等待动态路由加载
function waitForRoutesReady(): Promise<void> {
  if (dynamicRoutesLoaded) {
    return Promise.resolve();
  }
  if (!routesLoadPromise) {
    initRoutes();
  }
  return routesLoadPromise || Promise.resolve();
}

// 初始化路由
async function initRoutes() {
  if (dynamicRoutesLoaded) return routesLoadPromise;
  if (routesLoadPromise) return routesLoadPromise;

  routesLoadPromise = (async () => {
    try {
      // 优先使用 targetNavigation（来自 guards），否则使用当前路由
      const restorePath = targetNavigation || router.currentRoute.value.path;

      const { constantRoutes, authRoutes } = await generateDynamicRoutes();

      // 保存原始路由树，用于构建菜单
      originalAuthRoutes = authRoutes;

      // 使用递归方式添加路由，保持父子关系
      addRouteWithChildren(router, authRoutes);

      // 记录本次动态添加的路由名，用于后续重置
      dynamicRouteNames = collectRouteNames(authRoutes);

      // 添加常量路由
      constantRoutes.forEach(route => {
        router.addRoute(route);
      });

      // 移除初始的 404 路由（会被 addRoute 覆盖）
      const initial404 = router
        .getRoutes()
        .find(r => r.path === '/404' && r.name === 'page-not-found');
      if (initial404) {
        router.removeRoute('page-not-found');
      }

      dynamicRoutesLoaded = true;

      // 如果有待恢复的导航路径，先更新菜单，再恢复导航
      if (
        restorePath &&
        restorePath !== '/' &&
        restorePath !== '/login' &&
        restorePath !== '/login1' &&
        restorePath !== '/404'
      ) {
        targetNavigation = null;
        updateMenuFromRoutes().finally(() => {
          router.replace(restorePath).catch(() => {});
        });
        return;
      }

      // 如果当前在 404 页，尝试回到主页
      const currentPath = router.currentRoute.value.path;
      if (currentPath === '/404' || currentPath === '/:pathMatch(.*)*') {
        targetNavigation = null;
        updateMenuFromRoutes().finally(() => {
          router.replace('/').catch(() => {});
        });
        return;
      }

      // 正常情况，更新菜单
      targetNavigation = null;
      updateMenuFromRoutes();
    } catch (error) {
      // 401：权限不足，跳转到登录页
      if (error instanceof UnauthorizedError) {
        const currentPath = router.currentRoute.value.path;
        const redirect =
          currentPath &&
          currentPath !== '/login' &&
          currentPath !== '/login1' &&
          currentPath !== '/'
            ? `?redirect=${encodeURIComponent(currentPath)}`
            : '';
        dynamicRoutesLoaded = true;
        router.replace(`/login${redirect}`).catch(() => {});
        return;
      }

      console.error('[Router] 动态路由加载失败:', error);
      dynamicRoutesLoaded = true; // 标记为已完成，避免无限等待
    }
  })();

  return routesLoadPromise;
}

// 更新菜单
async function updateMenuFromRoutes() {
  try {
    const { useMenuStore } = await import('@/layouts/modules/global-menu/store');
    const menuStore = useMenuStore();

    // 使用原始路由树来构建菜单，避免 Vue Router 展平 children 导致的问题
    if (originalAuthRoutes.length === 0) {
      return;
    }

    // 过滤掉特殊的路由，并处理根路径下的子路由
    const validRoutes = originalAuthRoutes.flatMap(r => {
      // 1. 如果是根布局路由（path: '/'），且有 children，尝试提取 children 作为一级菜单
      if (r.path === '/' && r.children && r.children.length > 0) {
        // 过滤出未隐藏的子路由
        return r.children
          .filter(child => !child.meta?.hidden)
          .map(child => {
            // 确保 path 是绝对路径，以便菜单正确跳转
            const childPath = child.path.startsWith('/') ? child.path : `/${child.path}`;
            return {
              ...child,
              path: childPath,
            };
          });
      }

      // 2. 正常的顶层路由过滤
      const path = r.path || '';
      if (
        path !== '/' &&
        path !== '' &&
        !path.startsWith(':') &&
        !path.includes('*') &&
        r.meta?.hidden !== true
      ) {
        return [r];
      }
      return [];
    });

    menuStore.setMenuFromRoutes(validRoutes);
  } catch (e) {
    console.warn('[Router] 更新菜单失败:', e);
  }
}

// 重置并重新加载动态路由（登录成功后调用）
export async function reloadDynamicRoutes(): Promise<void> {
  // 1. 清除本地缓存
  clearDynamicRoutesCache();

  // 2. 移除已动态添加的路由，还原为初始状态
  dynamicRouteNames.forEach(name => {
    if (router.hasRoute(name)) {
      router.removeRoute(name);
    }
  });
  dynamicRouteNames = [];
  originalAuthRoutes = [];

  // 3. 重置标志，允许重新加载
  dynamicRoutesLoaded = false;
  routesLoadPromise = null;

  // 4. 重新初始化
  await initRoutes();
}

// 设置路由守卫
setupRouteGuards(router);

export default router;

// 导出路由类型和状态函数
export type { RouteRecordRaw };
export { isDynamicRoutesReady, waitForRoutesReady, setTargetNavigation };
