import type { RouteRecordRaw } from 'vue-router';

// 手动配置的路由（禁用 auto-router）
export const autoRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    component: () => import('../../layouts/base-layout/index.vue'),
    redirect: '/home',
    meta: {
      hidden: true,
    },
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('../../views/home.vue'),
        meta: {
          title: '首页',
          icon: 'fa-home',
        },
      },

      {
        path: 'umd-management',
        name: 'umd-management',
        component: () => import('../../views/umd-management/index.vue'),
        meta: {
          title: 'UMD Runtime Lab',
          icon: 'fa-cubes',
        },
      },
      {
        path: 'umd-showcase',
        name: 'umd-showcase',
        component: () => import('../../views/umd-showcase/index.vue'),
        meta: {
          title: 'UMD 运行示例',
          icon: 'fa-flask-vial',
        },
      },
      {
        path: 'umd-menu-config',
        name: 'umd-menu-config',
        component: () => import('../../views/umd-menu-config/index.vue'),
        meta: {
          title: 'UMD组件菜单配置',
          icon: 'fa-sliders-h',
        },
      },
      {
        path: 'blank',
        name: 'blank',
        component: () => import('../../views/blank.vue'),
        meta: {
          title: '暂无内容',
          hidden: true,
        },
      },
      {
        path: 'system',
        name: 'system',
        component: () => import('../../layouts/passthrough-layout/index.vue'),
        redirect: '/system/feature-list',
        meta: {
          title: '系统功能',
          icon: 'fa-cog',
          passthrough: true,
        },
        children: [
          {
            path: 'feature-list',
            name: 'feature-list',
            component: () => import('../../views/feature-list/index.vue'),
            meta: {
              title: '功能列表',
              icon: 'fa-list-alt',
            },
          },
          {
            path: 'menu-config',
            name: 'menu-config',
            component: () => import('../../views/menu-config/index.vue'),
            meta: {
              title: '菜单配置',
              icon: 'fa-sitemap',
            },
          },
        ],
      },
      {
        path: 'iframe-page',
        name: 'iframe-page',
        component: () => import('../../views/_builtin/iframe-page/index.vue'),
        meta: {
          title: 'Iframe 页面',
          hidden: true,
        },
        children: [
          {
            path: 'detail/:url(.*)',
            name: 'iframe-page-detail',
            component: () => import('../../views/_builtin/iframe-page/index.vue'),
            props: route => ({
              url: route.params.url as string,
              kvid: (route.query.kvid as string) || '',
              type: (route.query.type as string) || 'webview',
              routeQuery: route.query as Record<string, string>,
            }),
            meta: {
              title: 'Iframe 详情页',
              hidden: true,
              keepAlive: true,
            },
          },
        ],
      },
    ],
  },
  {
    path: '/404',
    name: 'page-not-found',
    component: () => import('../../views/404.vue'),
    meta: {
      hidden: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: {
      hidden: true,
    },
  },
];

export default autoRoutes;
