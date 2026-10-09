import { parseJsonParameters } from '@/utils/json-parameters';

import {
  deleteDashboardFunction,
  saveDashboardFunction,
  updateDashboardFunction,
} from '@/api/dashboard-functions';

import type { FunctionItem } from './types';
import { generateId } from './model';
import type { PermissionState } from './state';
import type { usePermissionData } from './data';

export function useFeatureEditor(
  state: PermissionState,
  actions: Pick<ReturnType<typeof usePermissionData>, 'loadFunctions' | 'loadPermissionData'>
) {
  const { isModalOpen, isSaving, editingKvid, emptyForm, form, parametersText, parametersError } =
    state;
  const { loadFunctions, loadPermissionData } = actions;
  function openCreate() {
    editingKvid.value = null;
    form.value = emptyForm();
    isModalOpen.value = true;
  }

  function openEdit(item: FunctionItem) {
    editingKvid.value = item.kvid;
    form.value = {
      title: item.title ?? '',
      handler: item.handler,
      remark: item.remark ?? '',
      parameters: item.parameters ?? {},
      render_type: item.render_type,
      source_type: item.source_type,
      source_module: item.source_module ?? '',
      source_url: item.source_url ?? '',
      source_component: item.source_component ?? '',
      icon: item.icon ?? '',
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active,
    };
    isModalOpen.value = true;
  }

  function closeModal() {
    isModalOpen.value = false;
  }

  async function saveFunction() {
    if (!form.value.title?.trim() || !form.value.handler?.trim()) return;
    try {
      form.value.parameters = parseJsonParameters(parametersText.value);
      parametersError.value = '';
    } catch (err) {
      parametersError.value = (err as Error).message;
      return;
    }
    isSaving.value = true;
    const payload: FunctionItem = {
      kvid: editingKvid.value || generateId(),
      title: form.value.title.trim(),
      handler: form.value.handler.trim(),
      remark: form.value.remark?.trim() || null,
      parameters: form.value.parameters ?? {},
      render_type: form.value.render_type,
      source_type: form.value.source_type,
      source_module: form.value.source_module?.trim() || null,
      source_url: form.value.source_url?.trim() || null,
      source_component: form.value.source_component?.trim() || null,
      icon: form.value.icon?.trim() || null,
      sort_order: form.value.sort_order ?? 0,
      is_active: form.value.is_active,
    };

    try {
      await saveDashboardFunction(payload);
    } catch (err: any) {
      alert('保存失败：' + (err?.message ?? '未知错误'));
      isSaving.value = false;
      return;
    }
    isSaving.value = false;
    closeModal();
    await Promise.all([loadFunctions(), loadPermissionData()]);
  }

  async function deleteFunction(item: FunctionItem) {
    if (!confirm(`确认删除「${item.title || item.handler}」？`)) return;
    try {
      await deleteDashboardFunction(item.kvid);
    } catch (err: any) {
      alert('删除失败：' + (err?.message ?? '未知错误'));
      return;
    }
    await Promise.all([loadFunctions(), loadPermissionData()]);
  }

  async function toggleEnabled(item: FunctionItem) {
    try {
      await updateDashboardFunction(item.kvid, { is_active: !item.is_active });
    } catch (err: any) {
      alert('更新状态失败：' + (err?.message ?? '未知错误'));
      return;
    }
    await loadFunctions();
  }

  return { openCreate, openEdit, closeModal, saveFunction, deleteFunction, toggleEnabled };
}
