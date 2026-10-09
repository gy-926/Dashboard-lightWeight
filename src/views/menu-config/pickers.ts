import { computed, watch } from 'vue';
import { createMenus } from '@/api/dashboard-admin';
import { clearDynamicRoutesCache } from '@/router/routes';
import type { FunctionRow } from './types';
import type { MenuConfigState } from './state';
import { getFunctionDisplayName, getNodeRootKvid } from './model';
import type { useMenuTree } from './tree';
import type { useMenuDialog } from './dialog';
import type { useMenuNodeEditor } from './node-editor';

export function useMenuPickers(
  state: MenuConfigState,
  actions: Pick<ReturnType<typeof useMenuTree>, 'buildRelatedFunctions' | 'loadTree'> &
    Pick<ReturnType<typeof useMenuDialog>, 'showAlert'> &
    Pick<ReturnType<typeof useMenuNodeEditor>, 'generateId'>
) {
  const {
    menuRows,
    functionRows,
    selectedNode,
    form,
    templatePickerOpen,
    templateLoading,
    templateError,
    templateSearch,
    templateItems,
    templateFunctionKvid,
    templateFunctionName,
    relatePickerOpen,
    relateLoading,
    relateLoadingMore,
    relateError,
    relateSearch,
    relateItems,
    relateTotal,
    relateHasMore,
    relateChecked,
    relateCheckedMap,
    canRelateFunctions,
  } = state;
  const { buildRelatedFunctions, loadTree, showAlert, generateId } = actions;
  function clearTemplateSelection() {
    form.value.template = '';
    templateFunctionKvid.value = '';
    templateFunctionName.value = '';
  }

  const filteredTemplateItems = computed(() => {
    const q = templateSearch.value.trim().toLowerCase();
    if (!q) return templateItems.value;
    return templateItems.value.filter(item => {
      const hay =
        `${item.DisplayName ?? ''} ${item.InternalCode ?? ''} ${item.Handler ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  });

  async function loadTemplateItems() {
    templateLoading.value = true;
    templateError.value = '';
    try {
      templateItems.value = functionRows.value
        .filter(item => item.is_active)
        .map(item => ({
          Kvid: item.kvid,
          DisplayName: getFunctionDisplayName(item),
          InternalCode: String(item.source_component ?? item.kvid ?? ''),
          Handler: String(item.handler ?? ''),
          ScopeLabel: '',
          __raw: item,
        }));
    } catch (e: any) {
      templateError.value = e?.message ? String(e.message) : '加载失败';
    } finally {
      templateLoading.value = false;
    }
  }

  function openTemplatePicker() {
    if (selectedNode.value?.type === 'folder') {
      showAlert('目录节点不需要绑定模板功能');
      return;
    }
    templatePickerOpen.value = true;
    templateSearch.value = '';
    loadTemplateItems();
  }

  function closeTemplatePicker() {
    templatePickerOpen.value = false;
  }

  function pickTemplate(item: any) {
    const func = item?.__raw as FunctionRow | undefined;
    templateFunctionKvid.value = String(func?.kvid ?? item?.Kvid ?? '');
    templateFunctionName.value = getFunctionDisplayName(func);
    form.value.template = templateFunctionName.value;
    templatePickerOpen.value = false;
  }

  function toggleRelateChecked(kvid: string, ev: Event, item: any) {
    const checked = Boolean((ev.target as HTMLInputElement | null)?.checked);
    relateChecked.value = { ...relateChecked.value, [kvid]: checked };
    if (checked) relateCheckedMap.value[kvid] = item;
    else delete relateCheckedMap.value[kvid];
  }

  const filteredRelateItems = computed(() => relateItems.value);

  watch(relateSearch, () => {
    if (relatePickerOpen.value) {
      loadRelateItems(true);
    }
  });

  async function loadRelateItems(_reset = true) {
    relateLoading.value = true;
    relateLoadingMore.value = false;
    relateError.value = '';
    try {
      const current = selectedNode.value;
      if (!current) {
        relateItems.value = [];
        relateTotal.value = 0;
        return;
      }
      const q = relateSearch.value.trim().toLowerCase();
      const usedFunctionKvids = new Set(
        buildRelatedFunctions(current)
          .map(item => item.FunctionKvid)
          .filter(Boolean) as string[]
      );

      const list = functionRows.value
        .filter(item => item.is_active && !usedFunctionKvids.has(item.kvid))
        .filter(item => {
          if (!q) return true;
          const hay =
            `${getFunctionDisplayName(item)} ${item.handler ?? ''} ${item.source_component ?? ''}`.toLowerCase();
          return hay.includes(q);
        })
        .map(item => ({
          Kvid: item.kvid,
          DisplayName: getFunctionDisplayName(item),
          InternalCode: String(item.source_component ?? ''),
          Handler: String(item.handler ?? ''),
          ScopeLabel: '',
          __raw: item,
        }));

      relateItems.value = list;
      relateTotal.value = list.length;
      relateHasMore.value = false;
      relateChecked.value = {};
      relateCheckedMap.value = {};
    } catch (e: any) {
      relateError.value = e?.message ? String(e.message) : '加载失败';
    } finally {
      relateLoading.value = false;
    }
  }

  function onRelateScroll() {
    // Dashboard API 数据源下当前使用本地筛选，无需分页加载
  }

  function openRelatePicker() {
    if (!canRelateFunctions.value) {
      showAlert('请先选择根目录或功能目录，再关联功能');
      return;
    }
    relatePickerOpen.value = true;
    relateSearch.value = '';
    loadRelateItems(true);
  }

  function closeRelatePicker() {
    relatePickerOpen.value = false;
  }

  async function confirmRelatePicker() {
    const current = selectedNode.value;
    if (!current) {
      await showAlert('未找到当前菜单数据，请重新选择左侧菜单');
      return;
    }

    const selectedFunctions = Object.values(relateCheckedMap.value).map(
      (item: any) => item.__raw as FunctionRow
    );
    if (selectedFunctions.length === 0) {
      closeRelatePicker();
      return;
    }

    const rootKvid = getNodeRootKvid(current);
    const parentKvid = current.__entityKind === 'root' ? null : current.id;
    const siblingPages = menuRows.value.filter(
      item =>
        item.menu_root_kvid === rootKvid && item.parent_kvid === parentKvid && item.type === 'Page'
    );
    const maxSort =
      siblingPages.length > 0
        ? Math.max(...siblingPages.map(item => Number(item.sort_order ?? 0)))
        : 0;

    const payload = selectedFunctions.map((func, index) => ({
      kvid: generateId(),
      parent_kvid: parentKvid,
      menu_root_kvid: rootKvid,
      title: getFunctionDisplayName(func) || func.handler,
      display_name: getFunctionDisplayName(func) || func.handler,
      internal_code: func.source_component ?? null,
      scope: 'Member',
      type: 'Page' as const,
      icon: func.icon ?? null,
      sort_order: maxSort + index + 1,
      remark: func.remark ?? null,
      function_kvid: func.kvid,
      parameters: func.parameters ?? {},
      is_active: true,
    }));

    try {
      await createMenus(payload);
      await loadTree();
      clearDynamicRoutesCache();
      closeRelatePicker();
    } catch (e: any) {
      await showAlert('关联失败：' + (e?.message || e), '关联失败');
    }
  }

  return {
    clearTemplateSelection,
    filteredTemplateItems,
    loadTemplateItems,
    openTemplatePicker,
    closeTemplatePicker,
    pickTemplate,
    toggleRelateChecked,
    filteredRelateItems,
    loadRelateItems,
    onRelateScroll,
    openRelatePicker,
    closeRelatePicker,
    confirmRelatePicker,
  };
}
