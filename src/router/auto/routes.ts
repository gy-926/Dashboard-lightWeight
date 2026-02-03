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
      },
      {
        path: 'analysis',
        name: 'analysis',
        meta: {
          title: '数据分析',
          icon: 'fa-chart-pie'
        },
        children: [
          {
            path: 'overview',
            name: 'analysis-overview',
            component: () => import('../../views/analysis/overview/index.vue'),
            meta: {
              title: '数据概览',
              icon: 'fa-eye'
            }
          },
          {
            path: 'report',
            name: 'analysis-report',
            component: () => import('../../views/analysis/report/index.vue'),
            meta: {
              title: '报表中心',
              icon: 'fa-file-alt'
            }
          },
          {
            path: 'realtime',
            name: 'analysis-realtime',
            component: () => import('../../views/analysis/realtime/index.vue'),
            meta: {
              title: '实时监控',
              icon: 'fa-broadcast-tower'
            }
          }
        ]
      },
      {
        path: 'content',
        name: 'content',
        meta: {
          title: '内容管理',
          icon: 'fa-book'
        },
        children: [
          {
            path: 'article',
            name: 'content-article',
            component: () => import('../../views/content/article/index.vue'),
            meta: {
              title: '文章管理',
              icon: 'fa-newspaper'
            }
          },
          {
            path: 'category',
            name: 'content-category',
            component: () => import('../../views/content/category/index.vue'),
            meta: {
              title: '分类管理',
              icon: 'fa-folder'
            }
          },
          {
            path: 'tag',
            name: 'content-tag',
            component: () => import('../../views/content/tag/index.vue'),
            meta: {
              title: '标签管理',
              icon: 'fa-tags'
            }
          },
          {
            path: 'media',
            name: 'content-media',
            component: () => import('../../views/content/media/index.vue'),
            meta: {
              title: '媒体库',
              icon: 'fa-photo-video'
            }
          }
        ]
      },
      {
        path: 'order',
        name: 'order',
        meta: {
          title: '订单管理',
          icon: 'fa-shopping-cart'
        },
        children: [
          {
            path: 'list',
            name: 'order-list',
            component: () => import('../../views/order/list/index.vue'),
            meta: {
              title: '订单列表',
              icon: 'fa-list-ol'
            }
          },
          {
            path: 'refund',
            name: 'order-refund',
            component: () => import('../../views/order/refund/index.vue'),
            meta: {
              title: '退款处理',
              icon: 'fa-undo'
            }
          },
          {
            path: 'aftersale',
            name: 'order-aftersale',
            component: () => import('../../views/order/aftersale/index.vue'),
            meta: {
              title: '售后服务',
              icon: 'fa-headset'
            }
          }
        ]
      },
      {
        path: 'message',
        name: 'message',
        meta: {
          title: '消息中心',
          icon: 'fa-bell'
        },
        children: [
          {
            path: 'notify',
            name: 'message-notify',
            component: () => import('../../views/message/notify/index.vue'),
            meta: {
              title: '通知管理',
              icon: 'fa-bullhorn'
            }
          },
          {
            path: 'feedback',
            name: 'message-feedback',
            component: () => import('../../views/message/feedback/index.vue'),
            meta: {
              title: '用户反馈',
              icon: 'fa-comment-dots'
            }
          }
        ]
      },
      {
        path: 'log',
        name: 'log',
        meta: {
          title: '日志管理',
          icon: 'fa-history'
        },
        children: [
          {
            path: 'operation',
            name: 'log-operation',
            component: () => import('../../views/log/operation/index.vue'),
            meta: {
              title: '操作日志',
              icon: 'fa-clipboard-list'
            }
          },
          {
            path: 'login',
            name: 'log-login',
            component: () => import('../../views/log/login/index.vue'),
            meta: {
              title: '登录日志',
              icon: 'fa-sign-in-alt'
            }
          },
          {
            path: 'error',
            name: 'log-error',
            component: () => import('../../views/log/error/index.vue'),
            meta: {
              title: '错误日志',
              icon: 'fa-exclamation-triangle'
            }
          }
        ]
      },
      {
        path: 'iframe-page',
        name: 'iframe-page',
        component: () => import('../../views/_builtin/iframe-page/[url].vue'),
        meta: {
          title: 'Iframe 页面',
          hidden: true
        },
        children: [
          {
            path: 'detail/:url(.*)',
            name: 'iframe-page-detail',
            component: () => import('../../views/_builtin/iframe-page/[url].vue'),
            props: route => ({
              url: route.params.url as string,
              kvid: route.query.kvid as string || '',
              type: (route.query.type as string) || 'webview',
              routeQuery: route.query as Record<string, string>,
            }),
            meta: {
              title: 'Iframe 详情页',
              hidden: true,
              keepAlive: true,
            }
          }
        ]
      },
      {
        path: 'settings',
        name: 'settings',
        meta: {
          title: '系统设置',
          icon: 'fa-sliders-h'
        },
        children: [
          {
            path: 'basic',
            name: 'settings-basic',
            component: () => import('../../views/settings/basic/index.vue'),
            meta: {
              title: '基础设置',
              icon: 'fa-cogs'
            }
          },
          {
            path: 'security',
            name: 'settings-security',
            component: () => import('../../views/settings/security/index.vue'),
            meta: {
              title: '安全设置',
              icon: 'fa-shield-alt'
            }
          },
          {
            path: 'notification',
            name: 'settings-notification',
            component: () => import('../../views/settings/notification/index.vue'),
            meta: {
              title: '通知设置',
              icon: 'fa-bell'
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
