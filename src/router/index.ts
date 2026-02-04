import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
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
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: initialRoutes
})

// 动态路由状态
let dynamicRoutesLoaded = false
let routesLoadPromise: Promise<void> | null = null
let originalAuthRoutes: RouteRecordRaw[] = [] // 保存原始路由树

// 初始化路由
async function initRoutes() {
  if (dynamicRoutesLoaded) return routesLoadPromise
  if (routesLoadPromise) return routesLoadPromise

  routesLoadPromise = (async () => {
    try {
      console.log('[Router] 初始化动态路由...')
      const { constantRoutes, authRoutes } = await generateDynamicRoutes()

      // 保存原始路由树，用于构建菜单
      originalAuthRoutes = authRoutes
      console.log('[Router] 保存原始路由树，数量:', authRoutes.length)

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

    // 使用原始路由树来构建菜单，避免 Vue Router 展平 children 导致的问题
    if (originalAuthRoutes.length === 0) {
      console.warn('[Router] 原始路由树为空，无法更新菜单')
      return
    }

    console.log('[updateMenuFromRoutes] 使用原始路由树构建菜单')
    console.log('[updateMenuFromRoutes] 原始路由树:')
    originalAuthRoutes.forEach(r => {
      const hasChildren = r.children && r.children.length > 0
      console.log(`  ${r.path} (name:${r.name}) ${hasChildren ? `[${r.children?.length || 0} children]` : ''}`)
    })

    // 过滤掉特殊的路由
    const validRoutes = originalAuthRoutes.filter(r => {
      const path = r.path || ''
      return path !== '/' && path !== '' &&
             !path.startsWith(':') && !path.includes('*') &&
             r.meta?.hidden !== true
    })

    // 调试：打印最终传递给菜单的路由
    console.log('[updateMenuFromRoutes] 最终路由数量:', validRoutes.length)
    validRoutes.forEach(r => {
      console.log(`  -> ${r.path} (${r.name})`)
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

// 导出路由类型
export type { RouteRecordRaw }
