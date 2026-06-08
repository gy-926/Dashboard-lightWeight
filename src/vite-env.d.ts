/// <reference types="vite/client" />

// Vue 3 SFC Loader 模块声明
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// vue3-sfc-loader 类型声明
declare module 'vue3-sfc-loader' {
  import { DefineComponent } from 'vue'

  interface LoadModuleOptions {
    moduleCache: Record<string, any>
    getFile: (url: string) => Promise<string>
    addStyle?: (textContent: string) => void
  }

  export function loadModule(url: string, options: LoadModuleOptions): Promise<DefineComponent>
}

// 自定义路由参数管理器
interface CustomRouteParams {
  params: Record<string, string>
  routeId: string
  timestamp: number
}

interface CustomRouteParamsManager {
  [routePath: string]: CustomRouteParams
}

interface Window {
  customRouteParamsManager?: CustomRouteParamsManager
  currentCustomRouteKey?: string
  b64_md5?: (value: string) => string
  hex_md5?: (value: string) => string
  md5?: (value: string) => string
  Ext?: any
  $pdfjsPreview?: {
    quickPreview: (el: HTMLElement, url: string) => void
  }
  uiGlobalConfig?: {
    InternalCode?: string
    UserCode?: string
    UserName?: string
    UseWindowOrigin?: boolean
    Origin?: string
    DisplayName?: string
    Icon?: string
    Scope?: string
    Parameters?: Record<string, any>
    IsAuthenticated?: boolean
    [key: string]: any
  }
}

interface ImportMetaEnv {
  readonly VITE_BACKEND_ORIGIN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
