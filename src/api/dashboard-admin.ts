import type { MenuApiResponse } from '@/router/routes/types';
import type { DashboardFunctionRecord } from './dashboard-functions';
import { requestEdgeFunction } from './edge-client';

export interface MenuRootRecord {
  kvid: string;
  title: string;
  display_name: string | null;
  internal_code: string;
  scope?: string | null;
  sort_order?: number | null;
  icon?: string | null;
  remark?: string | null;
  parameters?: Record<string, any> | null;
}

export interface MenuRecord {
  kvid: string;
  parent_kvid: string | null;
  menu_root_kvid: string;
  title: string;
  display_name: string | null;
  internal_code?: string | null;
  scope?: string | null;
  type: 'Page' | 'Folder' | 'Link' | 'System';
  icon: string | null;
  sort_order: number;
  remark: string | null;
  function_kvid: string | null;
  parameters: Record<string, any> | null;
  is_active: boolean;
}

export interface RoleRecord {
  kvid: string;
  code: string;
  name: string;
  remark: string | null;
  is_active: boolean;
}

export interface RoleFunctionRecord {
  role_kvid: string;
  function_kvid: string;
}

export interface UserRoleRecord {
  user_id: string;
  role_kvid: string;
}

export interface UserDirectoryRecord {
  user_id: string;
  email: string | null;
  app_role: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
}

export interface AuthRoleRecord {
  kvid: string;
  code: string;
  name: string;
}

export interface MenuConfigData {
  roots: MenuRootRecord[];
  menus: MenuRecord[];
  functions: DashboardFunctionRecord[];
}

export interface PermissionConfigData {
  roles: RoleRecord[];
  roleFunctions: RoleFunctionRecord[];
  userRoles: UserRoleRecord[];
  users: UserDirectoryRecord[];
}

const request = <T>(path = '', init: RequestInit = {}) =>
  requestEdgeFunction<T>('dashboard-admin', path, init);

export function getCurrentUserRoles(accessToken?: string): Promise<AuthRoleRecord[]> {
  return requestEdgeFunction<AuthRoleRecord[]>(
    'dashboard-admin',
    '/me/roles',
    {},
    accessToken
  );
}

export function getRuntimeMenu(internalCode: string): Promise<MenuApiResponse> {
  return request<MenuApiResponse>(`/menus/runtime?internalCode=${encodeURIComponent(internalCode)}`);
}

export function getAutoStartupMenuKvid(menuRootKvid: string): Promise<string | null> {
  return request<string | null>(`/menus/autostart?menuRootKvid=${encodeURIComponent(menuRootKvid)}`);
}

export function getMenuConfig(): Promise<MenuConfigData> {
  return request<MenuConfigData>('/admin/menu-config');
}

export function saveMenuRoot(item: MenuRootRecord): Promise<MenuRootRecord> {
  return request<MenuRootRecord>('/admin/menu-roots', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function deleteMenuRoot(kvid: string): Promise<void> {
  await request<null>(`/admin/menu-roots/${encodeURIComponent(kvid)}`, { method: 'DELETE' });
}

export function saveMenu(item: MenuRecord): Promise<MenuRecord> {
  return request<MenuRecord>('/admin/menus', { method: 'POST', body: JSON.stringify(item) });
}

export function createMenus(items: MenuRecord[]): Promise<MenuRecord[]> {
  return request<MenuRecord[]>('/admin/menus/bulk', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function deleteMenu(kvid: string): Promise<void> {
  await request<null>(`/admin/menus/${encodeURIComponent(kvid)}`, { method: 'DELETE' });
}

export function getPermissionConfig(): Promise<PermissionConfigData> {
  return request<PermissionConfigData>('/admin/permissions');
}

export function saveRole(item: RoleRecord): Promise<RoleRecord> {
  return request<RoleRecord>('/admin/roles', { method: 'POST', body: JSON.stringify(item) });
}

export async function deleteRoleRecord(kvid: string): Promise<void> {
  await request<null>(`/admin/roles/${encodeURIComponent(kvid)}`, { method: 'DELETE' });
}

export async function replaceRoleFunctions(roleKvid: string, functionKvids: string[]): Promise<void> {
  await request<null>(`/admin/roles/${encodeURIComponent(roleKvid)}/functions`, {
    method: 'PUT',
    body: JSON.stringify({ functionKvids }),
  });
}

export async function replaceUserRoles(userId: string, roleKvids: string[]): Promise<void> {
  await request<null>(`/admin/users/${encodeURIComponent(userId)}/roles`, {
    method: 'PUT',
    body: JSON.stringify({ roleKvids }),
  });
}
