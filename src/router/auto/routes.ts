import type { RouteRecordRaw } from 'vue-router'

// Auto-generated route configuration by @wemt/vue-auto-router
// Generated at: 2025-10-06T08:44:18.149Z 

export const autoRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../../views/home.vue'),
    meta: {
      title: 'Home'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../../views/404.vue'),
    meta: {
      title: '404 Not Found',
      hidden: true
    }
  }
]

export default autoRoutes

// HMR支持
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔄 [vue-auto-router] Routes updated')
  })
}
