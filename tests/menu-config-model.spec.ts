import { describe, expect, it } from 'vitest';
import {
  buildTreeData,
  paramsArrayToObject,
  normalizeParametersToParams,
} from '../src/views/menu-config/model';
import type { MenuRootRow, MenuRow } from '../src/views/menu-config/types';

describe('menu configuration model', () => {
  it('builds sorted folders without changing source rows or folding pages into the tree', () => {
    const roots = [{ kvid: 'root', title: 'Root' }] as MenuRootRow[];
    const menus = [
      {
        kvid: 'second',
        title: 'Second',
        type: 'Folder',
        menu_root_kvid: 'root',
        parent_kvid: null,
        sort_order: 2,
      },
      { kvid: 'page', type: 'Page', menu_root_kvid: 'root', parent_kvid: 'second' },
      {
        kvid: 'first',
        title: 'First',
        type: 'Folder',
        menu_root_kvid: 'root',
        parent_kvid: null,
        sort_order: 1,
      },
    ] as MenuRow[];
    const before = structuredClone(menus);
    const tree = buildTreeData(roots, menus);
    expect(tree[0].children?.map(node => node.id)).toEqual(['first', 'second']);
    expect(menus).toEqual(before);
  });
  it('preserves booleans, numbers and structured parameters through the editor', () => {
    const parameters = {
      enabled: false,
      count: 0,
      filters: ['a'],
      nested: { a: true },
      title: 'label',
    };
    expect(paramsArrayToObject(normalizeParametersToParams(parameters))).toEqual(parameters);
  });
});
