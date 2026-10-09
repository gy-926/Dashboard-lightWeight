import { listDashboardFunctions } from '@/api/dashboard-functions';
import { getPermissionConfig } from '@/api/dashboard-admin';

import type {
  RoleItem,
  RoleFunctionRow,
  UserRoleRow,
  UserDirectoryRow,
  DepartmentFunctionRow,
} from './types';

import type { PermissionState } from './state';

export function usePermissionData(state: PermissionState) {
  const {
    functions,
    loading,
    error,
    roles,
    roleFunctionMap,
    functionRoleDrafts,
    departments,
    departmentFunctionMap,
    functionDepartmentDrafts,
    userRoleMap,
    savedUserRoleMap,
    userDirectory,
    permissionLoading,
    permissionError,
  } = state;
  async function loadFunctions() {
    loading.value = true;
    error.value = null;
    try {
      functions.value = await listDashboardFunctions();
    } catch (err: any) {
      error.value = err?.message ?? '加载功能列表失败';
    } finally {
      loading.value = false;
    }
  }

  function buildRoleFunctionMap(data: RoleFunctionRow[]) {
    const nextMap: Record<string, string[]> = {};
    data.forEach(item => {
      if (!nextMap[item.role_kvid]) {
        nextMap[item.role_kvid] = [];
      }
      nextMap[item.role_kvid].push(item.function_kvid);
    });

    roleFunctionMap.value = nextMap;
    functionRoleDrafts.value = {};
  }

  function buildDepartmentFunctionMap(data: DepartmentFunctionRow[]) {
    const nextMap: Record<string, string[]> = {};
    for (const item of data) (nextMap[item.department_id] ??= []).push(item.function_kvid);
    departmentFunctionMap.value = nextMap;
    functionDepartmentDrafts.value = {};
  }

  function buildUserRoleMap(data: UserRoleRow[]) {
    const nextMap: Record<string, string[]> = {};
    data.forEach(item => {
      if (!nextMap[item.user_id]) {
        nextMap[item.user_id] = [];
      }
      nextMap[item.user_id].push(item.role_kvid);
    });

    userRoleMap.value = nextMap;
    savedUserRoleMap.value = structuredClone(nextMap);
  }

  async function loadPermissionData() {
    permissionLoading.value = true;
    permissionError.value = null;
    try {
      const data = await getPermissionConfig();
      roles.value = data.roles as RoleItem[];
      departments.value = data.departments;
      buildRoleFunctionMap(data.roleFunctions as RoleFunctionRow[]);
      buildDepartmentFunctionMap(data.departmentFunctions as DepartmentFunctionRow[]);
      buildUserRoleMap(data.userRoles as UserRoleRow[]);
      userDirectory.value = (data.users as UserDirectoryRow[]).sort((a, b) =>
        String(a.email ?? '').localeCompare(String(b.email ?? ''))
      );
    } catch (err: any) {
      permissionError.value = err?.message ?? '加载权限配置失败';
    } finally {
      permissionLoading.value = false;
    }
  }

  return {
    loadFunctions,
    buildRoleFunctionMap,
    buildDepartmentFunctionMap,
    buildUserRoleMap,
    loadPermissionData,
  };
}
