import type { RouteRecordRaw } from 'vue-router'

// 手动配置的路由（禁用 auto-router）
export const autoRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../../layouts/base-layout/index.vue'),
    redirect: '/home',
    meta: {
      hidden: true
    },
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('../../views/home.vue'),
        meta: {
          title: '首页',
          icon: 'fa-home'
        }
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../../views/dashboard/index.vue'),
        meta: {
          title: '仪表盘',
          icon: 'fa-chart-line'
        }
      },
      {
        path: 'system',
        name: 'system',
        meta: {
          title: '系统管理',
          icon: 'fa-cog'
        },
        children: [
          {
            path: 'user',
            name: 'system-user',
            component: () => import('../../views/system/user/index.vue'),
            meta: {
              title: '用户管理',
              icon: 'fa-users'
            }
          },
          {
            path: 'role',
            name: 'system-role',
            component: () => import('../../views/system/role/index.vue'),
            meta: {
              title: '角色管理',
              icon: 'fa-user-tag'
            }
          },
          {
            path: 'menu',
            name: 'system-menu',
            component: () => import('../../views/system/menu/index.vue'),
            meta: {
              title: '菜单管理',
              icon: 'fa-list'
            }
          }
        ]
      },
      {
        path: 'sample',
        name: 'sample',
        meta: {
          title: '示例页面',
          icon: 'fa-flask'
        },
        children: [
          {
            path: 'form',
            name: 'sample-form',
            component: () => import('../../views/sample/form/index.vue'),
            meta: {
              title: '表单示例',
              icon: 'fa-edit'
            }
          },
          {
            path: 'table',
            name: 'sample-table',
            component: () => import('../../views/sample/table/index.vue'),
            meta: {
              title: '表格示例',
              icon: 'fa-table'
            }
          }
        ]
      }
    ]
  },
  {
    path: '/404',
    name: 'page-not-found',
    component: () => import('../../views/404.vue'),
    meta: {
      hidden: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: {
      hidden: true
    }
  }
]

export default autoRoutes
