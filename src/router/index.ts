import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { setupRouteGuards } from './guards'
import { generateDynamicRoutes, getStaticRoutes, addRouteWithChildren } from './routes'

// 初始静态路由（用于首次渲染）
const initialRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login/index.vue'),
    meta: { hidden: true }
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
        meta: { title: '首页', icon: 'fa-home' }
      }
    ]
  },
  ...getStaticRoutes()
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: initialRoutes
})

// 动态路由状态
let dynamicRoutesLoaded = false
let routesLoadPromise: Promise<void> | null = null
let originalAuthRoutes: RouteRecordRaw[] = [] // 保存原始路由树
let targetNavigation: string | null = null // 目标导航路径（用于刷新时保存原路径）

// 获取动态路由加载状态
function isDynamicRoutesReady() {
  return dynamicRoutesLoaded
}

// 设置目标导航路径（供 guards 使用）
function setTargetNavigation(path: string) {
  if (!dynamicRoutesLoaded && !targetNavigation) {
    // 过滤掉 404 和 通配符路径
    if (path !== '/404' && !path.startsWith('/:pathMatch')) {
      targetNavigation = path
      console.log(`[Router] 保存目标导航路径: ${path}`)
    }
  }
}

// 等待动态路由加载
function waitForRoutesReady(): Promise<void> {
  if (dynamicRoutesLoaded) {
    return Promise.resolve()
  }
  if (!routesLoadPromise) {
    initRoutes()
  }
  return routesLoadPromise || Promise.resolve()
}

// 初始化路由
async function initRoutes() {
  if (dynamicRoutesLoaded) return routesLoadPromise
  if (routesLoadPromise) return routesLoadPromise

  routesLoadPromise = (async () => {
    try {
      // 优先使用 targetNavigation（来自 guards），否则使用当前路由
      const restorePath = targetNavigation || router.currentRoute.value.path
      console.log(`[Router] 动态路由加载中，restorePath: ${restorePath}`)

      const { constantRoutes, authRoutes } = await generateDynamicRoutes()

      // 保存原始路由树，用于构建菜单
      originalAuthRoutes = authRoutes

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

      // 如果有待恢复的导航路径，先更新菜单，再恢复导航
      if (restorePath && restorePath !== '/' && restorePath !== '/login' && restorePath !== '/404') {
        console.log(`[Router] 动态路由已加载，恢复导航到: ${restorePath}`)
        // 先更新菜单，再恢复导航
        targetNavigation = null
        updateMenuFromRoutes().finally(() => {
          router.replace(restorePath).catch(() => {})
        })
        return
      }

      // 如果当前在 404 页，尝试回到主页
      const currentPath = router.currentRoute.value.path
      if (currentPath === '/404' || currentPath === '/:pathMatch(.*)*') {
        console.log('[Router] 动态路由已加载，404页面上使用 replace 回到主页')
        targetNavigation = null
        updateMenuFromRoutes().finally(() => {
          router.replace('/').catch(() => {})
        })
        return
      }

      // 正常情况，更新菜单
      targetNavigation = null
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

    // 使用原始路由树来构建菜单，避免 Vue Router 展平 children 导致的问题
    if (originalAuthRoutes.length === 0) {
      return
    }

    // 过滤掉特殊的路由
    const validRoutes = originalAuthRoutes.filter(r => {
      const path = r.path || ''
      return path !== '/' && path !== '' &&
             !path.startsWith(':') && !path.includes('*') &&
             r.meta?.hidden !== true
    })

    menuStore.setMenuFromRoutes(validRoutes)
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

// 导出路由类型和状态函数
export type { RouteRecordRaw }
export { isDynamicRoutesReady, waitForRoutesReady, setTargetNavigation }
