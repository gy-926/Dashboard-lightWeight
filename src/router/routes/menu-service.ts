import type { MenuApiResponse, MenuItem } from './types';
import { adminSupabase } from '@/utils/supabase-admin';

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super('权限不足，请重新登录');
    this.name = 'UnauthorizedError';
  }
}

function parseParameters(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  if (typeof raw === 'object') return raw;
  return {};
}

export async function fetchAutoStartupKvid(menuRootKvid: string): Promise<string | null> {
  try {
    const { data, error } = await adminSupabase
      .from('menus')
      .select('kvid, parameters')
      .eq('parent_kvid', menuRootKvid)
      .eq('is_active', true);

    if (error || !data) return null;

    const item = data.find(m => {
      const val = parseParameters(m.parameters).AutoStartup;
      return val === true || val === 'true' || val === 1;
    });

    return item?.kvid ?? null;
  } catch {
    return null;
  }
}

export async function fetchMenuData(internalCode: string): Promise<MenuApiResponse> {
  const { data: root, error: rootErr } = await adminSupabase
    .from('menu_roots')
    .select('kvid, title, display_name')
    .eq('internal_code', internalCode)
    .single();

  if (rootErr || !root) {
    console.warn('[MenuService] 未找到菜单根节点:', internalCode, rootErr?.message);
    return { MenuRoot: { Kvid: '', Title: '' }, MenusMain: { Results: [], Total: 0 } };
  }

  const { data: items, error: itemsErr } = await adminSupabase
    .from('menus')
    .select('kvid, parent_kvid, title, display_name, type, icon, sort_order, remark, function_kvid, parameters')
    .eq('menu_root_kvid', root.kvid)
    .eq('is_active', true)
    .order('sort_order');

  if (itemsErr) {
    console.warn('[MenuService] 获取菜单列表失败:', itemsErr.message);
    return { MenuRoot: { Kvid: root.kvid, Title: root.title }, MenusMain: { Results: [], Total: 0 } };
  }

  const results: MenuItem[] = (items ?? []).map(r => ({
    Kvid:         r.kvid,
    ParentKvid:   r.parent_kvid,
    Title:        r.title,
    DisplayName:  r.display_name,
    Type:         r.type,
    Icon:         r.icon,
    Order:        r.sort_order,
    Remark:       r.remark,
    FunctionKvid: r.function_kvid,
    Parameters:   r.parameters,
  }));

  return {
    MenuRoot:  { Kvid: root.kvid, Title: root.title, DisplayName: root.display_name ?? undefined },
    MenusMain: { Results: results, Total: results.length },
  };
}
