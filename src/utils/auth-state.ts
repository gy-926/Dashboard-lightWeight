import type { Pinia } from 'pinia';
import type { Router } from 'vue-router';
import { getCurrentUserRoles } from '@/api/dashboard-admin';
import { getCurrentUser, onAuthChange, refreshAuth } from '@/api/nest-client';
import { setGlobalConfig, clearDynamicRoutesCache } from '@/router/routes';
import { useMenuStore } from '@/layouts/modules/global-menu/store';
import { clearReLogin } from '@/composables/useReLogin';

const LOGIN_PATHS = ['/login', '/SpringLogin', '/update-password'];
export interface AuthRoleInfo { kvid: string; code: string; name: string }
export interface AuthUserInfo { id: string; email: string; displayName: string; appRole: string; roleCodes: string[]; roles: AuthRoleInfo[] }

function uiConfig(): Record<string, any> { return (window as any).uiGlobalConfig ??= {}; }
export function setAuthenticatedFlag(value: boolean): void {
  setGlobalConfig({ IsAuthenticated: value });
  uiConfig().IsAuthenticated = value;
}

export async function syncAuthState(): Promise<void> {
  const user = getCurrentUser();
  setAuthenticatedFlag(Boolean(user));
  if (!user) {
    clearReLogin();
    uiConfig().CurrentUser = null;
    uiConfig().CurrentRole = null;
    uiConfig().CurrentRoles = [];
    setGlobalConfig({ UserCode: '', UserName: '' });
    return;
  }
  let roles: AuthRoleInfo[] = [];
  try { roles = await getCurrentUserRoles(); } catch (error) { console.warn('[AuthState] 获取角色失败:', error); }
  const appRole = user.role === 'super_admin' ? 'admin' : 'user';
  if (!roles.some(role => role.code === appRole)) roles.unshift({ kvid: `app-role:${appRole}`, code: appRole, name: appRole });
  const info: AuthUserInfo = { id: user.id, email: user.email, displayName: user.name, appRole, roleCodes: [...new Set(roles.map(role => role.code))], roles };
  uiConfig().CurrentUser = info;
  uiConfig().CurrentRole = roles.find(role => role.code === appRole) ?? roles[0] ?? null;
  uiConfig().CurrentRoles = roles;
  setGlobalConfig({ UserCode: user.email, UserName: user.name });
}

export async function initializeAuthState(): Promise<boolean> {
  await refreshAuth();
  await syncAuthState();
  return Boolean(getCurrentUser());
}

export function setupAuthSync(options: { router: Router; pinia: Pinia }): void {
  onAuthChange(() => {
    void syncAuthState().then(async () => {
      if (getCurrentUser()) return;
      clearDynamicRoutesCache();
      useMenuStore(options.pinia).resetState();
      if (!LOGIN_PATHS.includes(options.router.currentRoute.value.path)) await options.router.replace('/login');
    });
  });
}
