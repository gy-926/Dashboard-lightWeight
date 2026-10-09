import type { RouteRecordRaw } from 'vue-router';
import type { ElegantRoute } from './types';

// ==================== 布局与视图映射 ====================

// 定义组件路径映射
const layouts: Record<string, () => Promise<any>> = {
  'layout.base': () => import('../../layouts/base-layout/index.vue'),
  'layout.passthrough': () => import('../../layouts/passthrough-layout/index.vue'),
};

const views: Record<string, () => Promise<any>> = {
  'view.iframe-page': () => import('../../views/_builtin/iframe-page/index.vue'),
  'view.umd-component': () => import('../../views/_builtin/umd-component/index.vue'),
};

// ==================== 路由转换 ====================

// 将 Elegant 路由转换为 Vue Router 路由
function transformElegantRouteToVueRoute(
  route: ElegantRoute,
  parentRouteName?: string
): RouteRecordRaw {
  // 如果有 redirect 属性且没有 component，返回重定向路由
  if (route.redirect && !route.component) {
    return {
      path: route.path,
      redirect: route.redirect,
      name: route.name,
      meta: route.meta,
    } as RouteRecordRaw;
  }

  const vueRoute: any = {
    name: route.name,
    path: route.path,
    meta: route.meta,
    props: route.props,
  };

  // 解析组件
  if (route.component) {
    if (route.component.startsWith('layout.')) {
      const layoutName = route.component.replace('layout.', '');
      vueRoute.component = layouts[`layout.${layoutName}`] || layouts['layout.base'];
    } else if (route.component.startsWith('view.')) {
      const viewName = route.component.replace('view.', '');
      const viewKey = `view.${viewName}`;
      vueRoute.component = views[viewKey] || views['view.iframe-page'];
    } else {
      // 动态导入
      vueRoute.component = () => import(`../../views/${route.component}.vue`);
    }
  }

  // 递归处理子路由
  if (route.children && route.children.length > 0) {
    vueRoute.children = route.children.map((child: ElegantRoute) =>
      transformElegantRouteToVueRoute(child, route.name)
    );

    // 如果有默认子路由（空路径），添加 redirect
    if (route.children[0]?.path === '') {
      vueRoute.redirect = route.redirect || '';
    }
  }

  // 若 elegant 路由声明了 redirect（且尚未通过上面逻辑设置），直接应用
  if (route.redirect && !vueRoute.redirect) {
    vueRoute.redirect = route.redirect;
  }

  return vueRoute as RouteRecordRaw;
}

// 转换所有路由
export function transformRoutesToVueRoutes(routes: ElegantRoute[]): RouteRecordRaw[] {
  return routes.map(route => transformElegantRouteToVueRoute(route));
}

// 导出函数用于递归添加路由
export function addRouteWithChildren(router: any, routes: RouteRecordRaw[], parentName?: string) {
  if (!routes || !Array.isArray(routes)) {
    console.warn('[Router] 无效的路由数组:', routes);
    return;
  }
  routes.forEach((route, index) => {
    if (!route) {
      console.warn('[Router] 无效的路由，跳过索引:', index);
      return;
    }
    // 检查 path
    if (route.path === undefined) {
      console.warn('[Router] 路由缺少 path 属性，跳过:', route.name, 'parent:', parentName);
      return;
    }
    // 使用 parentName 添加子路由（顶级路由不使用 parentName）
    try {
      if (parentName) {
        router.addRoute(parentName, route);
      } else {
        router.addRoute(route);
      }
    } catch (e) {
      console.error('[Router] 添加路由失败:', route, e);
      return;
    }
    // 递归添加子路由
    if (route.children && route.children.length > 0) {
      if (!route.name) {
        console.warn('[Router] 父路由缺少 name 属性，无法添加子路由:', route.path);
        return;
      }
      const parent = typeof route.name === 'string' ? route.name : undefined;
      addRouteWithChildren(router, route.children, parent);
    }
  });
}

// ==================== 静态路由 ====================

// 获取静态路由（404等）
export function getStaticRoutes(): RouteRecordRaw[] {
  return [
    {
      path: '/404',
      name: 'page-not-found',
      component: () => import('../../views/404.vue'),
      meta: { hidden: true },
    },
    {
      path: '/update-password',
      name: 'update-password',
      component: () => import('@/views/login/update-password.vue'),
      meta: {
        title: '更新密码',
        hideMenu: true,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404',
      meta: { hidden: true },
    },
  ];
}

export { layouts, views };
