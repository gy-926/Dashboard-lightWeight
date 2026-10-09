import { deleteRoleRecord, saveRole as saveRoleRecord } from '@/api/dashboard-admin';

import type { RoleItem } from './types';
import { generateId } from './model';
import type { PermissionState } from './state';
import type { usePermissionData } from './data';

export function useRoleEditor(
  state: PermissionState,
  actions: Pick<ReturnType<typeof usePermissionData>, 'loadPermissionData'>
) {
  const { isRoleModalOpen, isRoleSaving, editingRoleKvid, emptyRoleForm, roleForm } = state;
  const { loadPermissionData } = actions;
  function openCreateRole() {
    editingRoleKvid.value = null;
    roleForm.value = emptyRoleForm();
    isRoleModalOpen.value = true;
  }

  function openEditRole(role: RoleItem) {
    editingRoleKvid.value = role.kvid;
    roleForm.value = {
      code: role.code,
      name: role.name,
      remark: role.remark ?? '',
      is_active: role.is_active,
    };
    isRoleModalOpen.value = true;
  }

  function closeRoleModal() {
    isRoleModalOpen.value = false;
  }

  async function saveRole() {
    if (!roleForm.value.code.trim() || !roleForm.value.name.trim()) return;
    isRoleSaving.value = true;
    const payload = {
      kvid: editingRoleKvid.value || generateId(),
      code: roleForm.value.code.trim(),
      name: roleForm.value.name.trim(),
      remark: roleForm.value.remark.trim() || null,
      is_active: roleForm.value.is_active,
    };
    try {
      await saveRoleRecord(payload);
    } catch (err: any) {
      alert('保存角色失败：' + (err?.message ?? '未知错误'));
      isRoleSaving.value = false;
      return;
    }
    isRoleSaving.value = false;
    closeRoleModal();
    await loadPermissionData();
  }

  async function deleteRole(role: RoleItem) {
    if (role.code === 'admin') {
      alert('内置管理员角色不建议删除。');
      return;
    }
    if (!confirm(`确认删除角色「${role.name}」？这会同时移除其用户绑定和功能授权。`)) return;
    try {
      await deleteRoleRecord(role.kvid);
    } catch (err: any) {
      alert('删除角色失败：' + (err?.message ?? '未知错误'));
      return;
    }
    await loadPermissionData();
  }

  return { openCreateRole, openEditRole, closeRoleModal, saveRole, deleteRole };
}
