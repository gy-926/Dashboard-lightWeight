import type { Pinia } from 'pinia';
import type { Router } from 'vue-router';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { setGlobalConfig, clearDynamicRoutesCache } from '@/router/routes';
import { useMenuStore } from '@/layouts/modules/global-menu/store';

const LOGIN_PATHS = ['/login', '/SpringLogin', '/update-password'];

export interface AuthRoleInfo {
  kvid: string;
  code: string;
  name: string;
}

export interface AuthUserInfo {
  id: string;
  email: string;
  displayName: string;
  appRole: string;
  roleCodes: string[];
  roles: AuthRoleInfo[];
}

function ensureUiGlobalConfig(): Record<string, any> {
  if (!(window as any).uiGlobalConfig) {
    (window as any).uiGlobalConfig = {};
  }
  return (window as any).uiGlobalConfig;
}

export function setAuthenticatedFlag(isAuthenticated: boolean): void {
  setGlobalConfig({ IsAuthenticated: isAuthenticated });
  ensureUiGlobalConfig().IsAuthenticated = isAuthenticated;
}

async function fetchAuthUserInfo(user: User | null | undefined): Promise<AuthUserInfo | null> {
  if (!user) return null;

  const email = String(user.email ?? '').trim();
  const rawDisplayName = user.user_metadata?.displayName ?? user.user_metadata?.name ?? email;
  const displayName = String(rawDisplayName || '用户').trim();
  const appRole = String(user.app_metadata?.role ?? '').trim();

  const { data: userRoles, error: userRolesError } = await supabase
    .from('user_roles')
    .select('role_kvid')
    .eq('user_id', user.id);

  if (userRolesError) {
    console.warn('[AuthState] 获取用户角色绑定失败:', userRolesError.message);
  }

  const roleKvids = Array.from(
    new Set((userRoles ?? []).map(item => String(item.role_kvid ?? '').trim()).filter(Boolean))
  );

  let roles: AuthRoleInfo[] = [];

  if (roleKvids.length > 0) {
    const { data: roleRows, error: rolesError } = await supabase
      .from('roles')
      .select('kvid, code, name')
      .in('kvid', roleKvids);

    if (rolesError) {
      console.warn('[AuthState] 获取角色定义失败:', rolesError.message);
    } else {
      roles = (roleRows ?? []).map(item => ({
        kvid: String(item.kvid ?? ''),
        code: String(item.code ?? ''),
        name: String(item.name ?? ''),
      }));
    }
  }

  if (appRole && !roles.some(role => role.code === appRole)) {
    roles.unshift({
      kvid: `app-role:${appRole}`,
      code: appRole,
      name: appRole,
    });
  }

  const roleCodes = Array.from(new Set(roles.map(role => role.code).filter(Boolean)));

  return {
    id: user.id,
    email,
    displayName,
    appRole,
    roleCodes,
    roles,
  };
}

function syncUserInfoToGlobal(userInfo: AuthUserInfo | null): void {
  const uiGlobalConfig = ensureUiGlobalConfig();

  if (!userInfo) {
    uiGlobalConfig.CurrentUser = null;
    uiGlobalConfig.CurrentRole = null;
    uiGlobalConfig.CurrentRoles = [];
    setGlobalConfig({ UserCode: '', UserName: '' });
    return;
  }

  const currentRole =
    userInfo.roles.find(role => role.code === userInfo.appRole) ?? userInfo.roles[0] ?? null;

  uiGlobalConfig.CurrentUser = userInfo;
  uiGlobalConfig.CurrentRole = currentRole;
  uiGlobalConfig.CurrentRoles = userInfo.roles;

  setGlobalConfig({
    UserCode: userInfo.email || userInfo.id,
    UserName: userInfo.displayName,
  });
}

export function syncAuthenticatedFlagFromSession(session: Session | null | undefined): boolean {
  const isAuthenticated = !!session?.access_token;
  setAuthenticatedFlag(isAuthenticated);
  return isAuthenticated;
}

export async function initializeAuthState(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  syncUserInfoToGlobal(await fetchAuthUserInfo(session?.user));
  return syncAuthenticatedFlagFromSession(session);
}

export function setupSupabaseAuthSync(options: { router: Router; pinia: Pinia }): void {
  const { router, pinia } = options;

  supabase.auth.onAuthStateChange(async (event, session) => {
    const isAuthenticated = syncAuthenticatedFlagFromSession(session);
    syncUserInfoToGlobal(await fetchAuthUserInfo(session?.user));

    if (event === 'SIGNED_OUT' || !isAuthenticated) {
      clearDynamicRoutesCache();

      try {
        const menuStore = useMenuStore(pinia);
        menuStore.resetState();
      } catch (error) {
        console.warn('[AuthState] 重置菜单状态失败:', error);
      }

      if (!LOGIN_PATHS.includes(router.currentRoute.value.path)) {
        await router.replace('/login');
      }
    }
  });
}
