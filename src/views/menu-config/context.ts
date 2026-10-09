import { inject, type InjectionKey } from 'vue';
import type { useMenuConfig } from './useMenuConfig';

export const menuConfigKey: InjectionKey<ReturnType<typeof useMenuConfig>> = Symbol('menu-config');
export function useMenuConfigContext() {
  const editor = inject(menuConfigKey);
  if (!editor) throw new Error('菜单编辑组件必须放在 MenuConfig 中');
  return editor;
}
