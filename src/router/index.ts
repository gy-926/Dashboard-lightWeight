import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupRouteGuards } from './guards'
import { generateDynamicRoutes, getStaticRoutes, addRouteWithChildren } from './routes'

// 初始静态路由（用于首次渲染）
const initialRoutes: RouteRecordRaw[] = [
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
        meta: { title: '首页', icon: 'fa-home' }
      }
    ]
  },
  ...getStaticRoutes()
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: initialRoutes
})

// 动态路由状态
let dynamicRoutesLoaded = false
let routesLoadPromise: Promise<void> | null = null

// 初始化路由
async function initRoutes() {
  if (dynamicRoutesLoaded) return routesLoadPromise
  if (routesLoadPromise) return routesLoadPromise

  routesLoadPromise = (async () => {
    try {
      console.log('[Router] 初始化动态路由...')
      const { constantRoutes, authRoutes } = await generateDynamicRoutes()

      // 使用递归方式添加路由，保持父子关系
      addRouteWithChildren(router, authRoutes)

      // 添加常量路由
      constantRoutes.forEach(route => {
        router.addRoute(route)
      })

      // 移除初始的 404 路由（会被 addRoute 覆盖）
      const initial404 = router.getRoutes().find(r => r.path === '/404' && r.name === 'page-not-found')
      if (initial404) {
        router.removeRoute('page-not-found')
      }

      dynamicRoutesLoaded = true
      console.log('[Router] 动态路由加载完成')

      // 如果当前在 404 页，刷新页面让路由生效
      const currentPath = router.currentRoute.value.path
      if (currentPath === '/404') {
        console.log('[Router] 动态路由已加载，刷新页面以应用新路由')
        window.location.reload()
        return
      }

      // 通知菜单 store 更新菜单
      updateMenuFromRoutes()
    } catch (error) {
      console.error('[Router] 动态路由加载失败:', error)
      dynamicRoutesLoaded = true // 标记为已完成，避免无限等待
    }
  })()

  return routesLoadPromise
}

// 更新菜单
async function updateMenuFromRoutes() {
  try {
    const { useMenuStore } = await import('@/layouts/modules/global-menu/store')
    const menuStore = useMenuStore()

    // 只获取顶级路由（parent 为 undefined 的路由）
    const routes = router.getRoutes().filter(r => !r.meta?.hidden && !r.parent)

    // 过滤掉特殊的路由
    const validRoutes = routes.filter(r => {
      const path = r.path || ''
      return path !== '/' && path !== '' && !path.startsWith(':') && !path.includes('*')
    })

    menuStore.setMenuFromRoutes(validRoutes)
    console.log('[Router] 菜单已更新，共', validRoutes.length, '个路由')
  } catch (e) {
    console.warn('[Router] 更新菜单失败:', e)
  }
}

// 延迟初始化（等待全局配置）
setTimeout(() => {
  initRoutes()
}, 100)

// 设置路由守卫
setupRouteGuards(router)

export default router

// 导出路由类型
export type { RouteRecordRaw }
