import { ref } from 'vue';
import type { GlobalConfig } from './types';

// ==================== 全局配置 ====================

// 默认全局配置
if (!(window as any).uiGlobalConfig) {
  (window as any).uiGlobalConfig = {};
}
const uiConfig = (window as any).uiGlobalConfig;

function getInternalCodeFromEntryPath(pathname = window.location.pathname): string {
  const normalized = String(pathname || '/').replace(/\/+$/, '') || '/';
  const match = normalized.match(/\/entry\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : '';
}

const internalCodeFromEntryPath = getInternalCodeFromEntryPath();

const defaultGlobalConfig: GlobalConfig = {
  InternalCode: internalCodeFromEntryPath || uiConfig.InternalCode || 'umdDashboard',
  UserCode: uiConfig.UserCode || 'admin',
  UserName: uiConfig.UserName || '管理员',
  UseWindowOrigin: uiConfig.UseWindowOrigin !== undefined ? uiConfig.UseWindowOrigin : true,
  Origin:
    uiConfig.Origin ||
    (uiConfig.UseWindowOrigin !== false
      ? window.location.origin
      : import.meta.env.VITE_BACKEND_ORIGIN) ||
    '',
  DisplayName: uiConfig.DisplayName || '',
  Icon: uiConfig.Icon || '',
  Scope: uiConfig.Scope || '',
  Parameters: uiConfig.Parameters || {},
  IsAuthenticated: uiConfig.IsAuthenticated !== undefined ? uiConfig.IsAuthenticated : false,
  PublicLoginUrl: uiConfig.PublicLoginUrl || '',
  ShowWatermark: uiConfig.ShowWatermark !== undefined ? uiConfig.ShowWatermark : false,
  WatermarkText: uiConfig.WatermarkText || 'Dashboard',
};

// 当前全局配置
export const globalConfig = ref<GlobalConfig>({ ...defaultGlobalConfig });

// 设置全局配置
export function setGlobalConfig(config: Partial<GlobalConfig>) {
  globalConfig.value = { ...globalConfig.value, ...config };
}

// 获取全局配置
export function getGlobalConfig(): GlobalConfig {
  return globalConfig.value;
}

export function syncInternalCodeToEntryPath(internalCode?: string | null): void {
  const code = String(internalCode ?? globalConfig.value.InternalCode ?? '').trim();
  if (!code) return;

  const encodedCode = encodeURIComponent(code);
  const currentHash = window.location.hash || '#/';
  const currentSearch = window.location.search || '';
  const currentPath = window.location.pathname || '/';
  const nextPath = `/entry/${encodedCode}`;

  if (currentPath === nextPath) return;
  window.history.replaceState(
    window.history.state,
    '',
    `${nextPath}${currentSearch}${currentHash}`
  );
}
