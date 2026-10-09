import { onScopeDispose } from 'vue';
import type { MenuConfigState } from './state';

export function useMenuDialog(state: MenuConfigState) {
  const { dialog } = state;
  onScopeDispose(() => {
    dialog.value.resolve?.(false);
    dialog.value.resolve = null;
    dialog.value.open = false;
  });
  function showAlert(message: string, title = '提示'): Promise<void> {
    return new Promise<void>(resolve => {
      dialog.value = {
        open: true,
        title,
        message,
        confirmOnly: true,
        resolve: () => resolve(),
      };
    });
  }

  function showConfirm(message: string, title = '确认'): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      dialog.value = { open: true, title, message, confirmOnly: false, resolve };
    });
  }

  function dialogCancel() {
    dialog.value.resolve?.(false);
    dialog.value.open = false;
  }

  function dialogConfirm() {
    dialog.value.resolve?.(true);
    dialog.value.open = false;
  }

  return { showAlert, showConfirm, dialogCancel, dialogConfirm };
}
