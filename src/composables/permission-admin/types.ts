import type { DashboardFunctionRecord } from '@/api/dashboard-functions';

export type RenderType = 'webview' | 'vue' | 'umd';
export type SourceType = 'manual' | 'umd' | 'system';

export type FunctionItem = DashboardFunctionRecord;

export interface FunctionForm {
  title: string;
  handler: string;
  remark: string;
  parameters: Record<string, any>;
  render_type: RenderType;
  source_type: SourceType;
  source_module: string;
  source_url: string;
  source_component: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface RoleItem {
  kvid: string;
  code: string;
  name: string;
  remark: string | null;
  is_active: boolean;
}

export interface RoleForm {
  code: string;
  name: string;
  remark: string;
  is_active: boolean;
}

export interface RoleFunctionRow {
  role_kvid: string;
  function_kvid: string;
}

export interface UserRoleRow {
  user_id: string;
  role_kvid: string;
}

export interface UserDirectoryRow {
  user_id: string;
  name: string | null;
  email: string | null;
  app_role: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  department_id: string | null;
}

export interface DepartmentFunctionRow {
  department_id: string;
  function_kvid: string;
}
