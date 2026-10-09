import {
  deleteDepartment,
  addDepartmentUsers,
  saveDepartment as saveDepartmentRecord,
  type DepartmentRecord,
} from '@/api/dashboard-admin';

import type { PermissionState } from './state';
import type { usePermissionData } from './data';

export function useOrganizationAdmin(
  state: PermissionState,
  actions: Pick<ReturnType<typeof usePermissionData>, 'loadPermissionData'>
) {
  const {
    departments,
    userDirectory,
    departmentForm,
    departmentSaving,
    departmentEditorOpen,
    addTarget,
    personnelTarget,
    personnelSearch,
    selectedPersonnelIds,
    personnelSaving,
  } = state;
  const { loadPermissionData } = actions;
  function departmentName(id: string | null): string {
    return departments.value.find(item => item.id === id)?.name ?? '未分配部门';
  }

  function newDepartment(parentId: string | null = null) {
    departmentForm.value = {
      id: '',
      parent_id: parentId,
      code: '',
      name: '',
      kind: parentId ? 'department' : 'organization',
      full_name: '',
      address: null,
      mnemonic_code: null,
      internal_code: null,
      manager_user_id: null,
      floor: null,
      is_active: true,
      sort_order: departments.value.length,
    };
    departmentEditorOpen.value = true;
  }

  function editDepartment(item: DepartmentRecord) {
    departmentForm.value = { ...item };
    departmentEditorOpen.value = true;
  }

  function openAddMenu(item: DepartmentRecord) {
    addTarget.value = item;
  }

  function createChildFromMenu() {
    const parentId = addTarget.value?.id;
    addTarget.value = null;
    if (parentId) newDepartment(parentId);
  }

  function openPersonnelPicker(item: DepartmentRecord) {
    addTarget.value = null;
    personnelTarget.value = item;
    personnelSearch.value = '';
    selectedPersonnelIds.value = [];
  }

  function togglePersonnel(userId: string) {
    const selected = new Set(selectedPersonnelIds.value);
    if (selected.has(userId)) selected.delete(userId);
    else selected.add(userId);
    selectedPersonnelIds.value = [...selected];
  }

  async function savePersonnel() {
    const departmentId = personnelTarget.value?.id;
    const userIds = selectedPersonnelIds.value;
    if (!departmentId || !userIds.length) return;
    personnelSaving.value = true;
    try {
      await addDepartmentUsers(departmentId, userIds);
      const selected = new Set(userIds);
      for (const user of userDirectory.value)
        if (selected.has(user.user_id)) user.department_id = departmentId;
      personnelTarget.value = null;
    } catch (err: any) {
      alert('添加人员失败：' + (err?.message ?? '未知错误'));
    } finally {
      personnelSaving.value = false;
    }
  }

  async function saveDepartment() {
    departmentSaving.value = true;
    try {
      const item = departmentForm.value;
      await saveDepartmentRecord(
        item.kind === 'department'
          ? { ...item, full_name: item.name, address: null, mnemonic_code: null }
          : { ...item, manager_user_id: null, floor: null, mnemonic_code: null }
      );
      await loadPermissionData();
      departmentEditorOpen.value = false;
    } catch (err: any) {
      alert('保存组织机构失败：' + (err?.message ?? '未知错误'));
    } finally {
      departmentSaving.value = false;
    }
  }

  async function removeDepartment(item: DepartmentRecord) {
    if (!confirm(`确认删除“${item.name}”？其下级组织和成员需先迁出。`)) return;
    try {
      await deleteDepartment(item.id);
      await loadPermissionData();
      if (departmentForm.value.id === item.id) departmentEditorOpen.value = false;
    } catch (err: any) {
      alert('删除组织机构失败：' + (err?.message ?? '未知错误'));
    }
  }

  return {
    departmentName,
    newDepartment,
    editDepartment,
    openAddMenu,
    createChildFromMenu,
    openPersonnelPicker,
    togglePersonnel,
    savePersonnel,
    saveDepartment,
    removeDepartment,
  };
}
