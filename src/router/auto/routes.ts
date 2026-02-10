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
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../../views/dashboard/index.vue'),
        meta: {
          title: 'umd文件配置页面',
          icon: 'fa-chart-line',
        },
      },
      {
        path: 'sample',
        name: 'sample',
        meta: {
          title: '示例页面',
          icon: 'fa-flask',
        },
        children: [
          {
            path: 'form',
            name: 'sample-form',
            component: () => import('../../views/sample/form/index.vue'),
            meta: {
              title: '表单示例',
              icon: 'fa-edit',
            },
          },
          {
            path: 'table',
            name: 'sample-table',
            component: () => import('../../views/sample/table/index.vue'),
            meta: {
              title: '表格示例',
              icon: 'fa-table',
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
