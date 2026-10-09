import { deleteMenu, deleteMenuRoot, saveMenu, saveMenuRoot } from '@/api/dashboard-admin';
import { clearDynamicRoutesCache } from '@/router/routes';
import type { MenuRootRow, MenuRow, TreeNodeData } from './types';
import type { MenuConfigState } from './state';
import {
  clampMinZero,
  scopeLabelToCode,
  paramsArrayToObject,
  getNodeRootKvid,
  removeNodeById,
} from './model';
import type { useMenuTree } from './tree';
import type { useMenuDialog } from './dialog';

export function useMenuNodeEditor(
  state: MenuConfigState,
  actions: Pick<ReturnType<typeof useMenuTree>, 'applySelectedToForm' | 'loadTree' | 'selectNode'> &
    Pick<ReturnType<typeof useMenuDialog>, 'showAlert' | 'showConfirm'>
) {
  const {
    menuRoots,
    menuRows,
    treeData,
    openIds,
    selectedId,
    selectedNode,
    saving,
    form,
    params,
    functions,
    templateFunctionKvid,
  } = state;
  const { applySelectedToForm, loadTree, selectNode, showAlert, showConfirm } = actions;
  async function saveCurrent() {
    const node = selectedNode.value;
    if (!node) return;

    const displayName = form.value.displayName.trim();
    if (!displayName) {
      await showAlert('显示名称不能为空');
      return;
    }

    saving.value = true;
    try {
      if (node.__entityKind === 'root') {
        const payload: MenuRootRow = {
          kvid: node.id,
          title: displayName,
          display_name: displayName,
          internal_code: form.value.internalCode.trim(),
          scope: scopeLabelToCode(form.value.scope),
          sort_order: clampMinZero(form.value.sortOrder),
          icon: form.value.iconPath.trim() || null,
          remark: form.value.notes.trim() || null,
          parameters: paramsArrayToObject(params.value),
        };
        if (!payload.internal_code) {
          await showAlert('根目录必须填写内部编号');
          return;
        }
        await saveMenuRoot(payload);
        await loadTree();
        clearDynamicRoutesCache();
        return;
      }

      const raw = (node.raw ?? {}) as Partial<MenuRow>;
      const isFolder = form.value.type === '目录';
      const payload: MenuRow = {
        kvid: raw.kvid ?? node.id,
        parent_kvid: node.__parentKvid ?? raw.parent_kvid ?? null,
        menu_root_kvid: getNodeRootKvid(node),
        title: raw.title ?? displayName,
        display_name: displayName,
        internal_code: form.value.internalCode.trim() || null,
        scope: scopeLabelToCode(form.value.scope),
        type: isFolder ? 'Folder' : 'Page',
        icon: form.value.iconPath.trim() || null,
        sort_order: clampMinZero(form.value.sortOrder),
        remark: form.value.notes.trim() || null,
        function_kvid: isFolder ? null : templateFunctionKvid.value || raw.function_kvid || null,
        parameters: paramsArrayToObject(params.value),
        is_active: raw.is_active ?? true,
      };

      if (!isFolder && !payload.function_kvid) {
        await showAlert('功能节点必须绑定模板功能');
        return;
      }

      await saveMenu(payload);
      await loadTree();
      clearDynamicRoutesCache();
    } catch (e: any) {
      console.error('[MenuConfig] saveCurrent failed', e);
      await showAlert('保存失败：' + (e?.message || e), '保存失败');
    } finally {
      saving.value = false;
    }
  }

  function generateId(): string {
    return (
      (crypto as any).randomUUID?.() ??
      Math.random().toString(36).slice(2) + Date.now().toString(36)
    );
  }

  function addRootFolder() {
    const id = generateId();
    const newNode: TreeNodeData = {
      id,
      label: '新建根目录',
      type: 'folder',
      children: [],
      raw: {
        kvid: id,
        title: '新建根目录',
        display_name: '新建根目录',
        internal_code: '',
        scope: 'Member',
        sort_order: menuRoots.value.length + 1,
        icon: null,
        remark: null,
        parameters: {},
      },
      __isNew: true,
      __entityKind: 'root',
      __rootKvid: id,
    };
    treeData.value.push(newNode);
    openIds.value = new Set([...openIds.value, newNode.id]);
    selectNode(newNode);
  }

  function addChildFolder() {
    if (!selectedNode.value || selectedNode.value.type !== 'folder') return;
    const target = selectedNode.value;
    if (!target.children) target.children = [];
    const id = generateId();
    const rootKvid = getNodeRootKvid(target);
    const parentKvid = target.__entityKind === 'root' ? null : target.id;
    const newNode: TreeNodeData = {
      id,
      label: '新建功能目录',
      type: 'folder',
      children: [],
      parentId: target.id,
      raw: {
        kvid: id,
        parent_kvid: parentKvid,
        menu_root_kvid: rootKvid,
        title: '新建功能目录',
        display_name: '新建功能目录',
        internal_code: '',
        scope: 'Member',
        type: 'Folder',
        icon: null,
        sort_order: (target.children?.length ?? 0) + 1,
        remark: null,
        function_kvid: null,
        parameters: {},
        is_active: true,
      },
      __isNew: true,
      __parentKvid: parentKvid,
      __entityKind: 'menu',
      __rootKvid: rootKvid,
    };
    target.children.push(newNode);
    openIds.value = new Set([...openIds.value, target.id]);
    selectNode(newNode);
  }

  async function deleteSelected() {
    if (!selectedId.value || !selectedNode.value) return;
    const node = selectedNode.value;

    const hasPages = menuRows.value.some(menu =>
      node.__entityKind === 'root' ? menu.menu_root_kvid === node.id : menu.parent_kvid === node.id
    );
    if ((node.children ?? []).length > 0 || hasPages) {
      await showAlert('请先删除子节点，再删除当前节点', '无法删除');
      return;
    }

    if (!(await showConfirm(`确定要删除“${node.label}”吗？`, '确认删除'))) return;

    if (node.__isNew) {
      removeNodeById(treeData.value, node.id);
      selectedId.value = '';
      selectedNode.value = null;
      applySelectedToForm(null);
      functions.value = [];
      return;
    }

    try {
      if (node.__entityKind === 'root') {
        await deleteMenuRoot(node.id);
      } else {
        await deleteMenu(node.id);
      }
      await loadTree();
      clearDynamicRoutesCache();
    } catch (e: any) {
      await showAlert('删除失败：' + (e?.message || e), '删除失败');
    }
  }

  function refreshTree() {
    loadTree();
  }

  return { saveCurrent, generateId, addRootFolder, addChildFolder, deleteSelected, refreshTree };
}
