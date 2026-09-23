import type { MenuApiResponse } from '@/router/routes/types';
import type { DashboardFunctionRecord } from './dashboard-functions';
import { requestDashboardModule } from './dashboard-client';

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
  name: string | null;
  email: string | null;
  app_role: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  department_id: string | null;
}

export interface DepartmentRecord {
  id: string;
  parent_id: string | null;
  code: string;
  name: string;
  kind: 'organization' | 'department';
  full_name: string;
  address: string | null;
  mnemonic_code: string | null;
  internal_code: string | null;
  manager_user_id: string | null;
  floor: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface DepartmentFunctionRecord {
  department_id: string;
  function_kvid: string;
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
  departments: DepartmentRecord[];
  departmentFunctions: DepartmentFunctionRecord[];
}

const request = <T>(path = '', init: RequestInit = {}) =>
  requestDashboardModule<T>('dashboard-admin', path, init);

export function getCurrentUserRoles(accessToken?: string): Promise<AuthRoleRecord[]> {
  return requestDashboardModule<AuthRoleRecord[]>(
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

export function saveDepartment(item: DepartmentRecord): Promise<DepartmentRecord> {
  return request<DepartmentRecord>('/admin/departments', { method: 'POST', body: JSON.stringify(item) });
}

export async function deleteDepartment(id: string): Promise<void> {
  await request<null>(`/admin/departments/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function assignUserDepartment(userId: string, departmentId: string | null): Promise<void> {
  await request<null>(`/admin/users/${encodeURIComponent(userId)}/department`, {
    method: 'PUT',
    body: JSON.stringify({ departmentId }),
  });
}

export function setUserAppRole(userId: string, role: 'user' | 'super_admin'): Promise<{ role: 'user' | 'super_admin' }> {
  return request<{ role: 'user' | 'super_admin' }>(`/admin/users/${encodeURIComponent(userId)}/app-role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

export function addDepartmentUsers(departmentId: string, userIds: string[]): Promise<{ assigned: number }> {
  return request<{ assigned: number }>(`/admin/departments/${encodeURIComponent(departmentId)}/users`, {
    method: 'PUT',
    body: JSON.stringify({ userIds }),
  });
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
