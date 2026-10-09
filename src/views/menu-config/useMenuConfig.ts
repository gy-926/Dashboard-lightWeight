import { onMounted } from 'vue';
import { createMenuConfigState } from './state';
import { useMenuDialog } from './dialog';
import { useMenuTree } from './tree';
import { useMenuFunctionEditor } from './function-editor';
import { useMenuPickers } from './pickers';
import { useMenuNodeEditor } from './node-editor';

export function useMenuConfig() {
  const state = createMenuConfigState();
  const dialogs = useMenuDialog(state);
  const tree = useMenuTree(state);
  const actions = { ...dialogs, ...tree };
  const functions = useMenuFunctionEditor(state, actions);
  const nodes = useMenuNodeEditor(state, actions);
  const pickers = useMenuPickers(state, { ...actions, ...nodes });
  onMounted(tree.loadTree);
  return { ...state, ...tree, ...functions, ...pickers, ...nodes, ...dialogs };
}
