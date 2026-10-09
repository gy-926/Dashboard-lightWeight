import type { MenuRootRow, MenuRow, FunctionRow, TreeNodeData, Param } from './types';

export function clampMinZero(input: any): number {
  const n = typeof input === 'number' ? input : Number(input);
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n;
}

export function normalizeScopeLabel(input: any): string {
  const v = String(input ?? '').trim();
  if (!v) return '内部人员';
  const lower = v.toLowerCase();
  if (lower === 'guest' || v === '访客') return '访客';
  if (lower === 'contact' || v === '客户') return '客户';
  return '内部人员';
}

export function scopeLabelToCode(label: string): 'Member' | 'Guest' | 'Contact' {
  const v = String(label ?? '').trim();
  if (v === '访客' || v.toLowerCase() === 'guest') return 'Guest';
  if (v === '客户' || v.toLowerCase() === 'contact') return 'Contact';
  return 'Member';
}

export function paramsArrayToObject(list: Param[]): Record<string, any> {
  const obj: Record<string, any> = {};
  (Array.isArray(list) ? list : []).forEach(p => {
    const key = String(p?.name ?? '').trim();
    if (!key) return;
    const raw = String(p?.value ?? '');
    const trimmed = raw.trim();
    if (trimmed === 'true') {
      obj[key] = true;
      return;
    }
    if (trimmed === 'false') {
      obj[key] = false;
      return;
    }
    if (trimmed !== '' && !Number.isNaN(Number(trimmed))) {
      obj[key] = Number(trimmed);
      return;
    }
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        obj[key] = JSON.parse(trimmed);
        return;
      } catch {
        obj[key] = raw;
        return;
      }
    }
    obj[key] = raw;
  });
  return obj;
}

export function normalizeParametersToParams(input: any): Param[] {
  let value = input;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value).map(([name, item]) => ({
    name,
    value: typeof item === 'string' ? item : JSON.stringify(item),
  }));
}

export function getFunctionDisplayName(func: FunctionRow | null | undefined): string {
  if (!func) return '';
  return String(func.title ?? func.source_component ?? func.handler ?? '').trim();
}

export function getNodeRootKvid(node: TreeNodeData | null): string {
  if (!node) return '';
  if (node.__entityKind === 'root') return node.id;
  return String(node.__rootKvid ?? (node.raw as MenuRow | undefined)?.menu_root_kvid ?? '');
}

export function buildTreeData(rootsInput: MenuRootRow[], menusInput: MenuRow[]): TreeNodeData[] {
  const rootMap = new Map<string, TreeNodeData>();
  const roots = [...rootsInput].sort(
    (a, b) =>
      Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
      String(a.title ?? '').localeCompare(String(b.title ?? ''))
  );
  roots.forEach(root => {
    rootMap.set(root.kvid, {
      id: root.kvid,
      label: String(root.display_name ?? root.title ?? '未命名根目录'),
      type: 'folder',
      children: [],
      parentId: null,
      raw: root,
      __entityKind: 'root',
      __rootKvid: root.kvid,
    });
  });

  const menuMap = new Map<string, TreeNodeData>();
  const menus = [...menusInput.filter(m => m.type !== 'Page')].sort(
    (a, b) =>
      Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
      String(a.display_name ?? a.title ?? '').localeCompare(String(b.display_name ?? b.title ?? ''))
  );

  menus.forEach(menu => {
    menuMap.set(menu.kvid, {
      id: menu.kvid,
      label: String(menu.display_name ?? menu.title ?? '未命名菜单'),
      type: menu.type === 'Folder' ? 'folder' : 'page',
      children: [],
      parentId: menu.parent_kvid ?? menu.menu_root_kvid,
      raw: menu,
      __entityKind: 'menu',
      __rootKvid: menu.menu_root_kvid,
    });
  });

  menus.forEach(menu => {
    const node = menuMap.get(menu.kvid)!;
    if (menu.parent_kvid && menuMap.has(menu.parent_kvid)) {
      menuMap.get(menu.parent_kvid)!.children!.push(node);
    } else {
      rootMap.get(menu.menu_root_kvid)?.children?.push(node);
    }
  });

  const sortNodes = (nodes: TreeNodeData[]) => {
    nodes.sort((a, b) => {
      const aSort = Number((a.raw as any)?.sort_order ?? 0);
      const bSort = Number((b.raw as any)?.sort_order ?? 0);
      if (aSort !== bSort) return aSort - bSort;
      return String(a.label).localeCompare(String(b.label));
    });
    nodes.forEach(node => node.children?.length && sortNodes(node.children));
  };

  const tree = Array.from(rootMap.values());
  sortNodes(tree);
  return tree;
}

export function findNodeById(nodes: TreeNodeData[], id: string): TreeNodeData | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = node.children?.length ? findNodeById(node.children, id) : null;
    if (child) return child;
  }
  return null;
}

export function removeNodeById(nodes: TreeNodeData[], id: string): boolean {
  const index = nodes.findIndex(node => node.id === id);
  if (index !== -1) {
    nodes.splice(index, 1);
    return true;
  }
  return nodes.some(node => removeNodeById(node.children ?? [], id));
}
