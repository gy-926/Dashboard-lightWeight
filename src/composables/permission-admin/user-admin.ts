import {
  assignUserDepartment,
  replaceUserRoles,
  setUserAppRole as saveUserAppRole,
} from '@/api/dashboard-admin';
import { getCurrentUser } from '@/api/nest-client';

import type { UserDirectoryRow } from './types';
import { sameIds } from './model';
import type { PermissionState } from './state';

export function useUserAdmin(state: PermissionState) {
  const { userRoleMap, savedUserRoleMap, savingUserId, assigningUserId } = state;
  function userHasChanges(userId: string): boolean {
    return !sameIds(userRoleMap.value[userId], savedUserRoleMap.value[userId]);
  }

  function toggleUserRole(userId: string, roleKvid: string) {
    const current = new Set(userRoleMap.value[userId] ?? []);
    if (current.has(roleKvid)) {
      current.delete(roleKvid);
    } else {
      current.add(roleKvid);
    }
    userRoleMap.value = {
      ...userRoleMap.value,
      [userId]: Array.from(current),
    };
  }

  async function saveUserRoles(user: UserDirectoryRow) {
    savingUserId.value = user.user_id;
    const selectedRoleIds = Array.from(new Set(userRoleMap.value[user.user_id] ?? []));

    try {
      await replaceUserRoles(user.user_id, selectedRoleIds);
    } catch (err: any) {
      alert('保存用户角色失败：' + (err?.message ?? '未知错误'));
      savingUserId.value = null;
      return;
    }
    savingUserId.value = null;
    savedUserRoleMap.value = { ...savedUserRoleMap.value, [user.user_id]: selectedRoleIds };
  }

  async function setUserDepartment(user: UserDirectoryRow, event: Event) {
    const select = event.target as HTMLSelectElement;
    const departmentId = select.value || null;
    assigningUserId.value = user.user_id;
    try {
      await assignUserDepartment(user.user_id, departmentId);
      user.department_id = departmentId;
    } catch (err: any) {
      select.value = user.department_id ?? '';
      alert('分配部门失败：' + (err?.message ?? '未知错误'));
    } finally {
      assigningUserId.value = null;
    }
  }

  async function setUserAppRole(user: UserDirectoryRow, event: Event) {
    const select = event.target as HTMLSelectElement;
    const previousRole = user.app_role === 'admin' ? 'super_admin' : 'user';
    const role = select.value as 'user' | 'super_admin';
    if (role === previousRole) return;
    savingUserId.value = user.user_id;
    try {
      await saveUserAppRole(user.user_id, role);
      user.app_role = role === 'super_admin' ? 'admin' : null;
      if (getCurrentUser()?.id === user.user_id) window.location.reload();
    } catch (err: any) {
      select.value = previousRole;
      alert('设置用户权限失败：' + (err?.message ?? '未知错误'));
    } finally {
      savingUserId.value = null;
    }
  }

  return { userHasChanges, toggleUserRole, saveUserRoles, setUserDepartment, setUserAppRole };
}
