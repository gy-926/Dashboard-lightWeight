import { computed } from 'vue';
import { getMenuConfig } from '@/api/dashboard-admin';
import type {
  MenuRootRow,
  MenuRow,
  FunctionRow,
  TreeNodeData,
  FlatTreeItem,
  FnItem,
} from './types';
import type { MenuConfigState } from './state';
import {
  clampMinZero,
  normalizeScopeLabel,
  paramsArrayToObject,
  normalizeParametersToParams,
  getFunctionDisplayName,
  getNodeRootKvid,
  buildTreeData,
  findNodeById,
} from './model';

export function useMenuTree(state: MenuConfigState) {
  const {
    menuRoots,
    menuRows,
    functionRows,
    treeData,
    openIds,
    searchQuery,
    selectedId,
    selectedNode,
    loading,
    form,
    params,
    showParamForm,
    newParam,
    functions,
    page,
    templateFunctionKvid,
    templateFunctionName,
    functionMap,
  } = state;
  function flattenTree(nodes: TreeNodeData[], depth = 0, q = ''): FlatTreeItem[] {
    const result: FlatTreeItem[] = [];
    for (const node of nodes) {
      const matchesSelf = !q || node.label.includes(q);
      const children = node.children ?? [];
      const flatChildren = flattenTree(children, depth + 1, q);
      const hasMatchingDescendants = flatChildren.length > 0;
      if (!matchesSelf && !hasMatchingDescendants) continue;
      const isOpen = openIds.value.has(node.id);
      result.push({ node, depth, hasChildren: children.length > 0, open: isOpen });
      if (isOpen || q) result.push(...flatChildren);
    }
    return result;
  }

  const flatTree = computed(() => flattenTree(treeData.value, 0, searchQuery.value));

  function toggleNode(id: string) {
    const next = new Set(openIds.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    openIds.value = next;
  }

  function buildRelatedFunctions(node: TreeNodeData | null): FnItem[] {
    if (!node || node.type !== 'folder') return [];
    const rootKvid = getNodeRootKvid(node);
    const parentKvid = node.__entityKind === 'root' ? null : node.id;
    return menuRows.value
      .filter(
        menu =>
          menu.menu_root_kvid === rootKvid &&
          menu.parent_kvid === parentKvid &&
          menu.type === 'Page'
      )
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map(menu => {
        const func = functionMap.value.get(String(menu.function_kvid ?? ''));
        const displayName = String(
          menu.display_name ?? menu.title ?? getFunctionDisplayName(func) ?? ''
        );
        return {
          Kvid: menu.kvid,
          DisplayName: displayName,
          SortId: Number(menu.sort_order ?? 0),
          Icon: String(menu.icon ?? func?.icon ?? ''),
          Parameters: normalizeParametersToParams(menu.parameters ?? func?.parameters),
          Remark: String(menu.remark ?? func?.remark ?? ''),
          Handler: String(func?.handler ?? ''),
          FunctionKvid: menu.function_kvid ?? undefined,
          FunctionName: getFunctionDisplayName(func),
          __raw: { ...menu },
          __editing: '',
          __snapshot: {
            DisplayName: displayName,
            SortId: Number(menu.sort_order ?? 0),
            Icon: String(menu.icon ?? func?.icon ?? ''),
            Remark: String(menu.remark ?? ''),
            ParametersText: JSON.stringify(
              paramsArrayToObject(normalizeParametersToParams(menu.parameters))
            ),
          },
        };
      });
  }

  function applySelectedToForm(node: TreeNodeData | null) {
    if (!node) {
      form.value = {
        displayName: '',
        internalCode: '',
        scope: '内部人员',
        type: '目录',
        sortOrder: 0,
        iconPath: '',
        template: '',
        notes: '',
      };
      params.value = [];
      templateFunctionKvid.value = '';
      templateFunctionName.value = '';
      return;
    }

    const raw = (node.raw ?? {}) as any;
    form.value.displayName = String(raw.display_name ?? raw.title ?? node.label ?? '');
    form.value.internalCode = String(raw.internal_code ?? '');
    form.value.scope = normalizeScopeLabel(raw.scope);
    form.value.type = node.type === 'folder' ? '目录' : '功能';
    form.value.sortOrder = clampMinZero(raw.sort_order ?? 0);
    form.value.iconPath = String(raw.icon ?? '');
    form.value.notes = String(raw.remark ?? '');
    params.value = normalizeParametersToParams(raw.parameters);

    const func = functionMap.value.get(String(raw.function_kvid ?? ''));
    templateFunctionKvid.value = String(raw.function_kvid ?? '');
    templateFunctionName.value = getFunctionDisplayName(func);
    form.value.template = templateFunctionName.value;

    showParamForm.value = false;
    newParam.value = { name: '', value: '' };
  }

  function refreshSelectedNode(preferredId = selectedId.value) {
    treeData.value = buildTreeData(menuRoots.value, menuRows.value);
    if (openIds.value.size === 0) {
      const initialOpenIds = new Set<string>();
      treeData.value.forEach(root => {
        initialOpenIds.add(root.id);
        (root.children ?? []).forEach(
          child => child.type === 'folder' && initialOpenIds.add(child.id)
        );
      });
      openIds.value = initialOpenIds;
    }

    const nextSelected = preferredId
      ? findNodeById(treeData.value, preferredId)
      : (treeData.value[0] ?? null);
    if (nextSelected) {
      selectedId.value = nextSelected.id;
      selectedNode.value = nextSelected;
      applySelectedToForm(nextSelected);
      functions.value = buildRelatedFunctions(nextSelected);
      page.value = 1;
    } else {
      selectedId.value = '';
      selectedNode.value = null;
      applySelectedToForm(null);
      functions.value = [];
    }
  }

  async function loadTree() {
    loading.value = true;
    try {
      const data = await getMenuConfig();
      menuRoots.value = data.roots as MenuRootRow[];
      menuRows.value = data.menus as MenuRow[];
      functionRows.value = data.functions as FunctionRow[];

      refreshSelectedNode();
    } catch (e) {
      console.error('[MenuConfig] loadTree failed', e);
    } finally {
      loading.value = false;
    }
  }

  function selectNode(node: TreeNodeData) {
    selectedId.value = node.id;
    selectedNode.value = node;
    applySelectedToForm(node);
    functions.value = buildRelatedFunctions(node);
    page.value = 1;
  }

  return {
    flattenTree,
    flatTree,
    toggleNode,
    buildRelatedFunctions,
    applySelectedToForm,
    refreshSelectedNode,
    loadTree,
    selectNode,
  };
}
