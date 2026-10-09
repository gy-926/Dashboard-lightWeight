import { replaceFunctionAccess } from '@/api/dashboard-functions';

import { sameIds } from './model';
import type { PermissionState } from './state';

export function useFunctionAccess(state: PermissionState) {
  const {
    roles,
    ordinaryRole,
    roleFunctionMap,
    functionRoleDrafts,
    departments,
    departmentFunctionMap,
    functionDepartmentDrafts,
    expandedFunctionId,
    savingFunctionId,
    permissionError,
  } = state;
  function roleIdsForFunction(functionKvid: string): string[] {
    const role = ordinaryRole.value;
    return role && (roleFunctionMap.value[role.kvid] ?? []).includes(functionKvid)
      ? [role.kvid]
      : [];
  }

  function departmentIdsForFunction(functionKvid: string): string[] {
    return departments.value
      .filter(department =>
        (departmentFunctionMap.value[department.id] ?? []).includes(functionKvid)
      )
      .map(department => department.id);
  }

  function functionHasChanges(functionKvid: string): boolean {
    return (
      !sameIds(
        functionRoleDrafts.value[functionKvid] ?? roleIdsForFunction(functionKvid),
        roleIdsForFunction(functionKvid)
      ) ||
      !sameIds(
        functionDepartmentDrafts.value[functionKvid] ?? departmentIdsForFunction(functionKvid),
        departmentIdsForFunction(functionKvid)
      )
    );
  }

  function toggleFunctionExpanded(functionKvid: string) {
    expandedFunctionId.value = expandedFunctionId.value === functionKvid ? null : functionKvid;
    if (!functionRoleDrafts.value[functionKvid]) {
      functionRoleDrafts.value = {
        ...functionRoleDrafts.value,
        [functionKvid]: roleIdsForFunction(functionKvid),
      };
    }
    if (!functionDepartmentDrafts.value[functionKvid]) {
      functionDepartmentDrafts.value = {
        ...functionDepartmentDrafts.value,
        [functionKvid]: departmentIdsForFunction(functionKvid),
      };
    }
  }

  function toggleFunctionRole(functionKvid: string, roleKvid: string) {
    if (roleKvid !== ordinaryRole.value?.kvid) return;
    const current = new Set(
      functionRoleDrafts.value[functionKvid] ?? roleIdsForFunction(functionKvid)
    );
    if (current.has(roleKvid)) current.delete(roleKvid);
    else current.add(roleKvid);
    functionRoleDrafts.value = { ...functionRoleDrafts.value, [functionKvid]: [...current] };
  }

  function toggleFunctionDepartment(functionKvid: string, departmentId: string) {
    const current = new Set(
      functionDepartmentDrafts.value[functionKvid] ?? departmentIdsForFunction(functionKvid)
    );
    if (current.has(departmentId)) current.delete(departmentId);
    else current.add(departmentId);
    functionDepartmentDrafts.value = {
      ...functionDepartmentDrafts.value,
      [functionKvid]: [...current],
    };
  }

  async function saveFunctionAccess(functionKvid: string) {
    if (!ordinaryRole.value) {
      permissionError.value = '普通用户授权配置缺失，请先运行数据库迁移';
      return;
    }
    const selectedRoles = [
      ...new Set(functionRoleDrafts.value[functionKvid] ?? roleIdsForFunction(functionKvid)),
    ];
    const selectedDepartments = [
      ...new Set(
        functionDepartmentDrafts.value[functionKvid] ?? departmentIdsForFunction(functionKvid)
      ),
    ];
    savingFunctionId.value = functionKvid;
    try {
      await replaceFunctionAccess(functionKvid, selectedRoles, selectedDepartments);
      const next: Record<string, string[]> = {};
      for (const role of roles.value) {
        const ids = new Set(roleFunctionMap.value[role.kvid] ?? []);
        if (selectedRoles.includes(role.kvid)) ids.add(functionKvid);
        else ids.delete(functionKvid);
        next[role.kvid] = [...ids];
      }
      roleFunctionMap.value = next;
      const nextDepartments: Record<string, string[]> = {};
      for (const department of departments.value) {
        const ids = new Set(departmentFunctionMap.value[department.id] ?? []);
        if (selectedDepartments.includes(department.id)) ids.add(functionKvid);
        else ids.delete(functionKvid);
        nextDepartments[department.id] = [...ids];
      }
      departmentFunctionMap.value = nextDepartments;
    } catch (err: any) {
      alert('保存功能授权失败：' + (err?.message ?? '未知错误'));
    } finally {
      savingFunctionId.value = null;
    }
  }

  return {
    roleIdsForFunction,
    departmentIdsForFunction,
    functionHasChanges,
    toggleFunctionExpanded,
    toggleFunctionRole,
    toggleFunctionDepartment,
    saveFunctionAccess,
  };
}
