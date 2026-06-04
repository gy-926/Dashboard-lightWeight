/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'vue3-sfc-loader' {
  import { DefineComponent } from 'vue';

  interface LoadModuleOptions {
    moduleCache: Record<string, any>;
    getFile: (url: string) => Promise<string>;
    addStyle?: (textContent: string) => void;
  }

  export function loadModule(url: string, options: LoadModuleOptions): Promise<DefineComponent>;
}

// ── 自定义路由参数 ──────────────────────────────────────────────
interface CustomRouteParams {
  params: Record<string, string>;
  routeId: string;
  timestamp: number;
}

interface CustomRouteParamsManager {
  [routePath: string]: CustomRouteParams;
}

// ── KiviiBridge（由宿主 HTML 注入到 window.kivii）──────────────
interface KiviiOpenTabBridge {
  open(url: string, options?: unknown): Promise<boolean>;
  openByKvid(kvid: string, options?: unknown): Promise<boolean>;
}

interface KiviiBridge {
  register(impl: unknown): void;
  openTab: KiviiOpenTabBridge;
}

// ── Window 扩展 ────────────────────────────────────────────────
interface Window {
  /** 宿主系统注入的全局配置（来自 HTML） */
  uiGlobalConfig?: {
    CurrentUser?: {
      id: string;
      email: string;
      displayName: string;
      appRole: string;
      roleCodes: string[];
      roles: Array<{
        kvid: string;
        code: string;
        name: string;
      }>;
    } | null;
    CurrentRole?: {
      kvid: string;
      code: string;
      name: string;
    } | null;
    CurrentRoles?: Array<{
      kvid: string;
      code: string;
      name: string;
    }>;
    InternalCode?: string;
    UserCode?: string;
    UserName?: string;
    UseWindowOrigin?: boolean;
    Origin?: string;
    DisplayName?: string;
    Icon?: string;
    Scope?: string;
    Parameters?: Record<string, unknown>;
    IsAuthenticated?: boolean;
    PublicLoginUrl?: string;
    [key: string]: unknown;
  };
  /** KiviiBridge 主对象（由宿主 HTML 脚本注入） */
  kivii?: KiviiBridge;
  /** 自定义路由参数管理器（供 iframe 页面共享参数） */
  customRouteParamsManager?: CustomRouteParamsManager;
  /** 当前激活的自定义路由 key */
  currentCustomRouteKey?: string;
  /** UMD 组件依赖的 Vue 全局对象 */
  Vue?: unknown;
  /** PDF 预览插件（可选） */
  $pdfjsPreview?: {
    quickPreview: (el: HTMLElement, url: string) => void;
  };
  /** ExtJS 全局对象（可选） */
  Ext?: unknown;
}

// ── 环境变量 ───────────────────────────────────────────────────
interface ImportMetaEnv {
  readonly VITE_BACKEND_ORIGIN: string;
  /** mock | real，控制数据来源 */
  readonly VITE_API_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
