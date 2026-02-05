import { ref, computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import type { MenuItem, GlobalConfig, CachedRoutes, ElegantRoute } from './types'
import { fetchMenuData } from './mockData'

// ==================== 全局配置 ====================

// 默认全局配置
const defaultGlobalConfig: GlobalConfig = {
  InternalCode: 'vueDashboard',
  UserCode: 'admin',
  UserName: '管理员'
}

// 当前全局配置
const globalConfig = ref<GlobalConfig>({ ...defaultGlobalConfig })

// 设置全局配置
export function setGlobalConfig(config: Partial<GlobalConfig>) {
  globalConfig.value = { ...globalConfig.value, ...config }
}

// 获取全局配置
export function getGlobalConfig(): GlobalConfig {
  return globalConfig.value
}

// ==================== 缓存策略 ====================

const CACHE_KEY = 'DYNAMIC_ROUTES_CACHE'
const CACHE_VERSION = 'v2' // 缓存版本，用于强制刷新
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时

// 缓存路由（存储 ElegantRoute 格式，避免函数序列化丢失）
export function cacheDynamicRoutes(routes: RouteRecordRaw[]): void {
  try {
    // 将 Vue Router 路由转换回 ElegantRoute 格式用于缓存
    const elegantRoutes = routes.map(route => routeToElegantRoute(route))
    const cacheData: CachedRoutes & { version?: string } = {
      routes: elegantRoutes,
      timestamp: Date.now(),
      userCode: globalConfig.value.UserCode || '',
      internalCode: globalConfig.value.InternalCode,
      version: CACHE_VERSION
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    console.log('[DynamicRoutes] 路由已缓存')
  } catch (e) {
    console.warn('缓存路由失败:', e)
  }
}

// 递归将 Vue Router 路由转换为 ElegantRoute 格式
function routeToElegantRoute(route: RouteRecordRaw): ElegantRoute {
  return {
    name: route.name,
    path: route.path,
    component: typeof route.component === 'function'
      ? extractComponentName(route.component.toString())
      : undefined,
    redirect: route.redirect,
    meta: route.meta,
    props: route.props,
    children: route.children ? route.children.map(child => routeToElegantRoute(child)) : []
  }
}

// 从组件函数中提取组件名称
function extractComponentName(fnStr: string): string | undefined {
  if (fnStr.includes('iframe-page')) return 'view.iframe-page'
  if (fnStr.includes('base-layout')) return 'layout.base'
  return undefined
}

// 清除缓存
export function clearDynamicRoutesCache(): void {
  localStorage.removeItem(CACHE_KEY)
}

// 从缓存恢复（返回已转换的 Vue Router 格式）
export function restoreDynamicRoutesFromCache(): RouteRecordRaw[] | null {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY)
    if (!cacheStr) return null

    const cacheData: CachedRoutes & { version?: string } = JSON.parse(cacheStr)

    // 检查缓存版本
    if (cacheData.version !== CACHE_VERSION) {
      console.log('[DynamicRoutes] 缓存版本不一致，清除旧缓存')
      clearDynamicRoutesCache()
      return null
    }

    // 检查缓存是否过期
    const isExpired = Date.now() - cacheData.timestamp > CACHE_EXPIRY
    if (isExpired) {
      clearDynamicRoutesCache()
      return null
    }

    // 检查用户是否一致
    if (cacheData.userCode !== globalConfig.value.UserCode) {
      return null
    }

    // 检查 InternalCode 是否一致
    if (cacheData.internalCode !== globalConfig.value.InternalCode) {
      return null
    }

    // 递归验证和清理路由数据
    const validateRoutes = (routes: any[]): ElegantRoute[] | null => {
      if (!Array.isArray(routes)) return null

      const validRoutes: ElegantRoute[] = []

      for (const route of routes) {
        // 检查路由对象是否有效
        if (!route || typeof route !== 'object') {
          console.warn('[DynamicRoutes] 无效的路由对象，跳过')
          continue
        }

        // 检查必需属性
        if (route.path === undefined) {
          console.warn('[DynamicRoutes] 路由缺少 path 属性，跳过:', route.name)
          continue
        }

        // 递归处理 children
        if (route.children && Array.isArray(route.children)) {
          const validChildren = validateRoutes(route.children)
          if (validChildren) {
            route.children = validChildren
          } else {
            delete route.children
          }
        }

        validRoutes.push(route as ElegantRoute)
      }

      return validRoutes.length > 0 ? validRoutes : null
    }

    const validRoutes = validateRoutes(cacheData.routes)
    if (!validRoutes) {
      console.warn('[DynamicRoutes] 缓存路由无效，清除缓存')
      clearDynamicRoutesCache()
      return null
    }

    // 转换为 Vue Router 格式
    console.log('[DynamicRoutes] 从缓存恢复路由，转换格式...')
    const vueRoutes = transformRoutesToVueRoutes(validRoutes)
    return vueRoutes
  } catch (e) {
    console.warn('恢复缓存路由失败:', e)
    return null
  }
}

// ==================== 菜单数据获取 ====================

// 获取根菜单
export async function getRootMenu(): Promise<MenuItem[]> {
  const config = getGlobalConfig()
  const response = await fetchMenuData(config.InternalCode)
  return response.MenusMain.Results
}

// ==================== 菜单树构建 ====================

interface TreeStats {
  maxDepth: number
  totalNodes: number
  leafCount: number
  containerCount: number
  functionCount: number
}

export function getMenuTree(items: MenuItem[]): MenuItem[] {
  if (!items || items.length === 0) return []

  // 构建父Kvid集合
  const parentKvids = new Set<string>()
  items.forEach(item => {
    if (item.ParentKvid) {
      parentKvids.add(item.ParentKvid)
    }
  })

  // 找出根节点（ParentKvid 为空或 undefined 的项）
  const rootItems = items.filter(item => {
    return !item.ParentKvid && item.ParentKvid !== ''
  })

  // 递归构建子树
  function buildChildren(parentKvid: string): MenuItem[] {
    const children = items.filter(item => item.ParentKvid === parentKvid)
    children.forEach(child => {
      child.Children = buildChildren(child.Kvid)
    })
    return children
  }

  // 为每个根节点构建子树
  rootItems.forEach(item => {
    item.Children = buildChildren(item.Kvid)
  })

  return rootItems
}

// 统计分析
export function analyzeTree(items: MenuItem[], depth = 1): TreeStats {
  let maxDepth = depth
  let totalNodes = 0
  let leafCount = 0
  let containerCount = 0
  let functionCount = 0

  function traverse(nodes: MenuItem[], currentDepth: number) {
    nodes.forEach(node => {
      totalNodes++
      maxDepth = Math.max(maxDepth, currentDepth)

      const hasChildren = node.Children && node.Children.length > 0
      const hasFunction = !!node.FunctionKvid

      if (hasChildren) {
        containerCount++
        traverse(node.Children!, currentDepth + 1)
      }
      if (hasFunction || !hasChildren) {
        leafCount++
      }
      if (hasFunction) {
        functionCount++
      }
    })
  }

  traverse(items, depth)

  return {
    maxDepth,
    totalNodes,
    leafCount,
    containerCount,
    functionCount
  }
}

// ==================== 路由生成 ====================

// 获取菜单显示名称（优先使用 DisplayName，否则使用 Title）
function getMenuDisplayName(item: MenuItem): string {
  return item.DisplayName || item.Title
}

// 生成根级路由
function generateRootRoute(item: MenuItem, parentPath = ''): ElegantRoute {
  const routeName = item.Type === 'System' ? item.Type : item.Kvid
  // 确保路径以 / 开头
  const routePath = item.Type === 'System'
    ? (item.Remark || `/${item.Type}`).startsWith('/')
      ? (item.Remark || `/${item.Type}`)
      : `/${item.Remark || item.Type}`
    : `/${item.Kvid}`

  return {
    name: routeName,
    path: routePath,
    component: 'layout.base',
    meta: {
      title: getMenuDisplayName(item),
      icon: item.Icon,
      order: item.Order,
      keepAlive: true
    },
    children: []
  }
}

// 生成子路由
function generateChildRoutes(
  items: MenuItem[],
  parentPath: string,
  parentName: string
): ElegantRoute[] {
  return items.map(item => {
    const isSystem = item.Type === 'System'
    const hasChildren = item.Children && item.Children.length > 0
    const hasFunction = !!item.FunctionKvid

    // 生成路由名称
    let routeName: string
    if (isSystem && item.Remark) {
      // System 类型使用 Remark 拼接
      const remarkPath = item.Remark.replace(/^\//, '')
      routeName = `${parentName}_${remarkPath.replace(/\//g, '_')}`
    } else {
      routeName = `${parentName}_${item.Kvid}`
    }

    // 生成路由路径（确保以 / 开头）
    let routePath: string
    if (isSystem && item.Remark) {
      routePath = item.Remark.startsWith('/') ? item.Remark : `/${item.Remark}`
    } else {
      // 拼接父路径
      const normalizedParent = parentPath.replace(/\/$/, '')
      routePath = `${normalizedParent}/${item.Kvid}`
    }

    // 容器节点（有 children）
    if (hasChildren) {
      const route: ElegantRoute = {
        name: routeName,
        path: routePath,
        component: 'layout.base',
        meta: {
          title: getMenuDisplayName(item),
          icon: item.Icon,
          order: item.Order,
          keepAlive: true
        },
        children: []
      }

      // 递归生成子路由
      route.children = generateChildRoutes(item.Children!, routePath, routeName)

      // 容器兼页面（有 FunctionKvid）- 添加默认子路由
      if (hasFunction) {
        route.children.unshift({
          name: `${routeName}_default`,
          path: '',
          component: 'view.iframe-page',
          props: {
            url: item.Type === 'System' ? item.Remark || '' : '',
            kvid: item.Kvid,  // 使用父菜单的 kvid（如果需要访问父菜单的权限）
            functionKvid: item.FunctionKvid,
            type: 'webview'
          },
          meta: {
            title: getMenuDisplayName(item),
            type: 'iframe',
            keepAlive: true
          }
        })
      }

      return route
    }

    // 页面节点（叶子节点或有 FunctionKvid）
    // 使用 IframePage 渲染
    return {
      name: routeName,
      path: routePath,
      component: 'view.iframe-page',
      props: {
        url: item.Type === 'System' ? item.Remark || '' : '',
        kvid: item.Kvid,
        functionKvid: item.FunctionKvid || '',
        type: (item.FunctionKvid?.endsWith('.vue') ? 'vue' : 'webview') as 'webview' | 'vue'
      },
      meta: {
        title: getMenuDisplayName(item),
        icon: item.Icon,
        order: item.Order,
        type: 'iframe',
        keepAlive: true
      }
    }
  })
}

// 生成路由树
export function generateRoutes(menuTree: MenuItem[]): ElegantRoute[] {
  return menuTree.map(item => {
    const route = generateRootRoute(item)

    if (item.Children && item.Children.length > 0) {
      route.children = generateChildRoutes(
        item.Children,
        route.path,
        route.name || item.Kvid
      )
    }

    return route
  })
}

// ==================== 布局与视图映射 ====================

// 定义组件路径映射
const layouts: Record<string, () => Promise<any>> = {
  'layout.base': () => import('../../layouts/base-layout/index.vue'),
}

const views: Record<string, () => Promise<any>> = {
  'view.iframe-page': () => import('../../views/_builtin/iframe-page/index.vue'),
}

// ==================== 路由转换 ====================

// 将 Elegant 路由转换为 Vue Router 路由
function transformElegantRouteToVueRoute(route: ElegantRoute, parentRouteName?: string): RouteRecordRaw {
  // 如果有 redirect 属性且没有 component，返回重定向路由
  if (route.redirect && !route.component) {
    return {
      path: route.path,
      redirect: route.redirect,
      name: route.name,
      meta: route.meta
    } as RouteRecordRaw
  }

  const vueRoute: any = {
    name: route.name,
    path: route.path,
    meta: route.meta,
    props: route.props,
  }

  // 解析组件
  if (route.component) {
    if (route.component.startsWith('layout.')) {
      const layoutName = route.component.replace('layout.', '')
      vueRoute.component = layouts[`layout.${layoutName}`] || layouts['layout.base']
    } else if (route.component.startsWith('view.')) {
      const viewName = route.component.replace('view.', '')
      const viewKey = `view.${viewName}`
      vueRoute.component = views[viewKey] || views['view.iframe-page']
    } else {
      // 动态导入
      vueRoute.component = () => import(`../../views/${route.component}.vue`)
    }
  }

  // 递归处理子路由
  if (route.children && route.children.length > 0) {
    vueRoute.children = route.children.map((child: ElegantRoute) => transformElegantRouteToVueRoute(child, route.name))

    // 如果有默认子路由，添加 redirect
    if (route.children[0]?.path === '') {
      vueRoute.redirect = route.redirect || ''
    }
  }

  return vueRoute as RouteRecordRaw
}

// 转换所有路由
export function transformRoutesToVueRoutes(routes: ElegantRoute[]): RouteRecordRaw[] {
  return routes.map(route => transformElegantRouteToVueRoute(route))
}

// 导出函数用于递归添加路由
export function addRouteWithChildren(router: any, routes: RouteRecordRaw[], parentName?: string) {
  if (!routes || !Array.isArray(routes)) {
    console.warn('[Router] 无效的路由数组:', routes)
    return
  }
  routes.forEach((route, index) => {
    if (!route) {
      console.warn('[Router] 无效的路由，跳过索引:', index)
      return
    }
    // 检查 path
    if (route.path === undefined) {
      console.warn('[Router] 路由缺少 path 属性，跳过:', route.name, 'parent:', parentName)
      return
    }
    // 使用 parentName 添加子路由（顶级路由不使用 parentName）
    try {
      if (parentName) {
        router.addRoute(parentName, route)
      } else {
        router.addRoute(route)
      }
    } catch (e) {
      console.error('[Router] 添加路由失败:', route, e)
      return
    }
    // 递归添加子路由
    if (route.children && route.children.length > 0) {
      if (!route.name) {
        console.warn('[Router] 父路由缺少 name 属性，无法添加子路由:', route.path)
        return
      }
      addRouteWithChildren(router, route.children, route.name)
    }
  })
}

// ==================== 静态路由 ====================

// 获取静态路由（404等）
export function getStaticRoutes(): RouteRecordRaw[] {
  return [
    {
      path: '/404',
      name: 'page-not-found',
      component: () => import('../../views/404.vue'),
      meta: { hidden: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404',
      meta: { hidden: true }
    }
  ]
}

// ==================== 主入口函数 ====================

// 完整的动态路由生成流程
export async function generateDynamicRoutes(): Promise<{
  constantRoutes: RouteRecordRaw[]
  authRoutes: RouteRecordRaw[]
}> {
  // 1. 尝试从缓存恢复
  const cachedRoutes = restoreDynamicRoutesFromCache()
  if (cachedRoutes) {
    return {
      constantRoutes: [],
      authRoutes: cachedRoutes
    }
  }

  // 2. 获取菜单数据
  const menuItems = await getRootMenu()

  // 3. 构建菜单树
  const menuTree = getMenuTree(menuItems)

  // 4. 生成路由
  const elegantRoutes = generateRoutes(menuTree)

  // 5. 转换为 Vue 路由
  const vueRoutes = transformRoutesToVueRoutes(elegantRoutes)

  // 6. 缓存路由
  cacheDynamicRoutes(vueRoutes)

  return {
    constantRoutes: getStaticRoutes(),
    authRoutes: vueRoutes
  }
}

// ==================== 状态管理 ====================

// 路由生成状态
const isGenerating = ref(false)
const lastGeneratedAt = ref<number | null>(null)

export function isRouteGenerating(): boolean {
  return isGenerating.value
}

export function getLastGeneratedTime(): number | null {
  return lastGeneratedAt.value
}

// 异步生成路由（不阻塞）
export async function asyncGenerateRoutes(): Promise<RouteRecordRaw[]> {
  if (isGenerating.value) {
    console.log('[DynamicRoutes] 路由正在生成中，跳过')
    return []
  }

  isGenerating.value = true

  try {
    const result = await generateDynamicRoutes()
    lastGeneratedAt.value = Date.now()
    return result.authRoutes
  } finally {
    isGenerating.value = false
  }
}

// ==================== 导出 ====================

export {
  layouts,
  views
}
