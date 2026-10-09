import { computed, ref } from 'vue';
import { deleteMenu, saveMenu } from '@/api/dashboard-admin';
import { clearDynamicRoutesCache } from '@/router/routes';
import type { MenuRow, Param, FnItem } from './types';
import type { MenuConfigState } from './state';
import { clampMinZero, paramsArrayToObject, normalizeParametersToParams } from './model';
import type { useMenuTree } from './tree';
import type { useMenuDialog } from './dialog';

export function useMenuFunctionEditor(
  state: MenuConfigState,
  actions: Pick<ReturnType<typeof useMenuTree>, 'loadTree'> &
    Pick<ReturnType<typeof useMenuDialog>, 'showAlert' | 'showConfirm'>
) {
  const { menuRows, params, showParamForm, newParam, functions } = state;
  const { loadTree, showAlert, showConfirm } = actions;
  function addParam() {
    showParamForm.value = true;
    newParam.value = { name: '', value: '' };
  }

  function confirmAddParam() {
    if (!newParam.value.name.trim()) return;
    params.value.push({ ...newParam.value });
    showParamForm.value = false;
    newParam.value = { name: '', value: '' };
  }

  function removeParam(idx: number) {
    params.value.splice(idx, 1);
  }

  function clearParams() {
    params.value = [];
    showParamForm.value = false;
    newParam.value = { name: '', value: '' };
  }

  async function removeFunction(idx: number) {
    const fn = functions.value[idx];
    if (!fn?.Kvid) {
      functions.value.splice(idx, 1);
      return;
    }

    if (!(await showConfirm(`确定要删除关联功能“${fn.DisplayName || fn.Kvid}”吗？`, '确认删除'))) {
      return;
    }

    try {
      await deleteMenu(fn.Kvid);
      await loadTree();
      clearDynamicRoutesCache();
    } catch (e: any) {
      await showAlert('删除失败：' + (e?.message || e), '删除失败');
    }
  }

  function addFunctionParam(fn: FnItem) {
    fn.Parameters = Array.isArray(fn.Parameters) ? fn.Parameters : [];
    fn.Parameters.push({ name: '', value: '' });
  }

  function removeFunctionParam(fn: FnItem, idx: number) {
    fn.Parameters = Array.isArray(fn.Parameters) ? fn.Parameters : [];
    fn.Parameters.splice(idx, 1);
  }

  function clearFunctionParams(fn: FnItem) {
    fn.Parameters = [];
  }

  function makeFnSnapshot(fn: FnItem) {
    return {
      DisplayName: String(fn?.DisplayName ?? ''),
      SortId: clampMinZero(fn?.SortId),
      Icon: String(fn?.Icon ?? ''),
      Remark: String(fn?.Remark ?? ''),
      ParametersText: JSON.stringify(paramsArrayToObject(fn?.Parameters ?? [])),
    };
  }

  async function updateFnItem(fn: FnItem, nextSnapshot?: FnItem['__snapshot']) {
    const raw = fn.__raw;
    if (!raw?.kvid || fn.__saving) return false;

    const payload: MenuRow = {
      ...raw,
      display_name: fn.DisplayName || null,
      icon: fn.Icon || null,
      sort_order: clampMinZero(fn.SortId),
      remark: fn.Remark || null,
      parameters: paramsArrayToObject(fn.Parameters),
    };

    fn.__saving = true;
    try {
      await saveMenu(payload);
      fn.__raw = payload;
      fn.__snapshot = nextSnapshot ?? makeFnSnapshot(fn);
      const target = menuRows.value.find(item => item.kvid === payload.kvid);
      if (target) Object.assign(target, payload);
      functions.value = [...functions.value].sort((a, b) => a.SortId - b.SortId);
      clearDynamicRoutesCache();
      return true;
    } catch (e: any) {
      await showAlert('保存失败：' + (e?.message || e), '保存失败');
      return false;
    } finally {
      fn.__saving = false;
    }
  }

  function startFnEdit(fn: FnItem, field: NonNullable<FnItem['__editing']>) {
    if (!fn.__snapshot) fn.__snapshot = makeFnSnapshot(fn);
    fn.__editing = field;
  }

  async function commitFnEdit(fn: FnItem) {
    fn.SortId = clampMinZero(fn.SortId);
    const before = fn.__snapshot ?? makeFnSnapshot(fn);
    const after = makeFnSnapshot(fn);
    const changed =
      before.DisplayName !== after.DisplayName ||
      before.SortId !== after.SortId ||
      before.Icon !== after.Icon ||
      before.Remark !== after.Remark ||
      before.ParametersText !== after.ParametersText;
    if (!changed || (await updateFnItem(fn, after))) fn.__editing = '';
  }

  const fnParamEditorOpen = ref(false);
  const fnParamEditorTarget = ref<FnItem | null>(null);
  const fnParamDraft = ref<Param[]>([]);
  const fnParamEditorTitle = computed(() => fnParamEditorTarget.value?.DisplayName ?? '');

  function formatFnParameters(list: Param[]): string {
    const pairs = (Array.isArray(list) ? list : [])
      .map(p => {
        const n = String(p?.name ?? '').trim();
        const v = String(p?.value ?? '').trim();
        if (!n && !v) return '';
        if (!n) return v;
        if (!v) return n;
        return `${n}:${v}`;
      })
      .filter(Boolean);
    return pairs.length ? pairs.join('; ') : '';
  }

  function openFnParamEditor(fn: FnItem) {
    fnParamEditorTarget.value = fn;
    fnParamDraft.value = normalizeParametersToParams(fn.__raw?.parameters ?? fn.Parameters).map(
      p => ({
        name: String(p?.name ?? ''),
        value: String(p?.value ?? ''),
      })
    );
    fnParamEditorOpen.value = true;
  }

  function closeFnParamEditor() {
    fnParamEditorOpen.value = false;
    fnParamEditorTarget.value = null;
    fnParamDraft.value = [];
  }

  function addFnParamDraft() {
    fnParamDraft.value.push({ name: '', value: '' });
  }

  function removeFnParamDraft(idx: number) {
    fnParamDraft.value.splice(idx, 1);
  }

  function clearFnParamDraft() {
    fnParamDraft.value = [];
  }

  async function saveFnParamDraft() {
    const target = fnParamEditorTarget.value;
    if (!target) {
      closeFnParamEditor();
      return;
    }
    target.Parameters = fnParamDraft.value
      .map(p => ({ name: String(p?.name ?? '').trim(), value: String(p?.value ?? '').trim() }))
      .filter(p => p.name || p.value);
    if (await updateFnItem(target, makeFnSnapshot(target))) closeFnParamEditor();
  }

  return {
    addParam,
    confirmAddParam,
    removeParam,
    clearParams,
    removeFunction,
    addFunctionParam,
    removeFunctionParam,
    clearFunctionParams,
    makeFnSnapshot,
    updateFnItem,
    startFnEdit,
    commitFnEdit,
    fnParamEditorOpen,
    fnParamEditorTarget,
    fnParamDraft,
    fnParamEditorTitle,
    formatFnParameters,
    openFnParamEditor,
    closeFnParamEditor,
    addFnParamDraft,
    removeFnParamDraft,
    clearFnParamDraft,
    saveFnParamDraft,
  };
}
