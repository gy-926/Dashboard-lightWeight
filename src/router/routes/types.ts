import type { RouteRecordRaw } from 'vue-router'

// 菜单项类型
export interface MenuItem {
  Kvid: string
  ParentKvid?: string | null
  Title: string
  DisplayName?: string  // 菜单显示名称
  Type: 'Page' | 'System' | 'Folder' | 'Link' | string
  Remark?: string
  Icon?: string
  Order?: number
  FunctionKvid?: string
  Children?: MenuItem[]
  [key: string]: any
}

// 后端返回的菜单数据结构
export interface MenuApiResponse {
  MenusMain: {
    Results: MenuItem[]
    Total?: number
  }
  MenuRoot: {
    Kvid: string
    Title: string
    DisplayName?: string  // 菜单根节点显示名称
  }
}

// 路由配置接口（用于 generateRoutes）
export interface RouteConfig {
  path: string
  name: string
  component: string
  meta?: Record<string, any>
  children?: RouteConfig[]
  props?: Record<string, any>
}

// 全局配置接口
export interface GlobalConfig {
  InternalCode: string
  UserCode?: string
  UserName?: string
  customRouteManager?: {
    getRoutes: () => any[]
  }
}

// 缓存的路由数据
export interface CachedRoutes {
  routes: RouteRecordRaw[]
  timestamp: number
  userCode: string
  internalCode: string
}

// Elegant 路由格式（字符串形式的组件路径）
export interface ElegantRoute {
  name?: string
  path: string
  component: string
  redirect?: string
  meta?: Record<string, any>
  props?: Record<string, any>
  children?: ElegantRoute[]
}
