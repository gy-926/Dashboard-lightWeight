import type { MenuApiResponse, MenuItem } from './types';
import { adminSupabase } from '@/utils/supabase-admin';
import { supabase } from '@/utils/supabase';

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
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw;
  return {};
}

interface PermissionContext {
  roleCodes: string[];
  allowedFunctionKvids: Set<string> | null;
}

async function fetchCurrentPermissionContext(): Promise<PermissionContext> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { roleCodes: [], allowedFunctionKvids: null };
    }

    const appRole = String(user.app_metadata?.role ?? '').trim();
    if (appRole.toLowerCase() === 'admin') {
      return { roleCodes: ['admin'], allowedFunctionKvids: null };
    }

    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select('role_kvid')
      .eq('user_id', user.id);

    if (userRolesError) {
      console.warn('[MenuService] 获取用户角色失败，已回退为不过滤菜单:', userRolesError.message);
      return { roleCodes: appRole ? [appRole] : [], allowedFunctionKvids: null };
    }

    const roleKvids = Array.from(
      new Set((userRoles ?? []).map(item => String(item.role_kvid ?? '').trim()).filter(Boolean))
    );

    if (roleKvids.length === 0) {
      return { roleCodes: appRole ? [appRole] : [], allowedFunctionKvids: null };
    }

    const [
      { data: rolesData, error: rolesError },
      { data: roleFunctions, error: roleFunctionsError },
    ] = await Promise.all([
      supabase.from('roles').select('kvid, code').in('kvid', roleKvids),
      supabase.from('role_functions').select('function_kvid').in('role_kvid', roleKvids),
    ]);

    if (rolesError) {
      console.warn('[MenuService] 获取角色定义失败:', rolesError.message);
    }
    if (roleFunctionsError) {
      console.warn('[MenuService] 获取角色功能权限失败:', roleFunctionsError.message);
      return { roleCodes: appRole ? [appRole] : [], allowedFunctionKvids: null };
    }

    const roleCodes = Array.from(
      new Set(
        [
          appRole,
          ...((rolesData ?? [])
            .map(item => String(item.code ?? '').trim())
            .filter(Boolean) as string[]),
        ].filter(Boolean)
      )
    );

    if (roleCodes.some(code => code.toLowerCase() === 'admin')) {
      return { roleCodes, allowedFunctionKvids: null };
    }

    const allowedFunctionKvids = new Set(
      (roleFunctions ?? []).map(item => String(item.function_kvid ?? '').trim()).filter(Boolean)
    );

    return { roleCodes, allowedFunctionKvids };
  } catch (error) {
    console.warn('[MenuService] 获取权限上下文失败，已回退为不过滤菜单:', error);
    return { roleCodes: [], allowedFunctionKvids: null };
  }
}

function filterMenuItemsByPermissions(
  items: MenuItem[],
  allowedFunctionKvids: Set<string> | null
): MenuItem[] {
  if (!allowedFunctionKvids) {
    return items;
  }
  const allowedSet = allowedFunctionKvids as Set<string>;

  const byParent = new Map<string, MenuItem[]>();
  const normalizedItems = items.map(item => ({ ...item }));

  normalizedItems.forEach(item => {
    const parentKey = String(item.ParentKvid ?? '');
    if (!byParent.has(parentKey)) {
      byParent.set(parentKey, []);
    }
    byParent.get(parentKey)!.push(item);
  });

  const includedIds = new Set<string>();

  function visit(item: MenuItem): boolean {
    const children = byParent.get(String(item.Kvid)) ?? [];
    const hasIncludedChild = children.some(child => visit(child));
    const functionKvid = String(item.FunctionKvid ?? '').trim();
    const hasAccessibleFunction = functionKvid ? allowedSet.has(functionKvid) : false;
    const shouldKeep =
      hasIncludedChild || hasAccessibleFunction || (item.Type === 'Folder' && hasIncludedChild);

    if (shouldKeep) {
      includedIds.add(item.Kvid);
    }

    return shouldKeep;
  }

  const roots = normalizedItems.filter(item => {
    const parentKvid = String(item.ParentKvid ?? '').trim();
    return !parentKvid || !normalizedItems.some(candidate => candidate.Kvid === parentKvid);
  });

  roots.forEach(root => visit(root));

  return normalizedItems.filter(item => includedIds.has(item.Kvid));
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
  const [{ data: root, error: rootErr }, permissionContext] = await Promise.all([
    adminSupabase
      .from('menu_roots')
      .select('kvid, title, display_name')
      .eq('internal_code', internalCode)
      .single(),
    fetchCurrentPermissionContext(),
  ]);

  if (rootErr || !root) {
    console.warn('[MenuService] 未找到菜单根节点:', internalCode, rootErr?.message);
    return { MenuRoot: { Kvid: '', Title: '' }, MenusMain: { Results: [], Total: 0 } };
  }

  const { data: items, error: itemsErr } = await adminSupabase
    .from('menus')
    .select(
      'kvid, parent_kvid, title, display_name, type, icon, sort_order, remark, function_kvid, parameters'
    )
    .eq('menu_root_kvid', root.kvid)
    .eq('is_active', true)
    .order('sort_order');

  if (itemsErr) {
    console.warn('[MenuService] 获取菜单列表失败:', itemsErr.message);
    return {
      MenuRoot: { Kvid: root.kvid, Title: root.title },
      MenusMain: { Results: [], Total: 0 },
    };
  }

  const results: MenuItem[] = (items ?? []).map(r => ({
    Kvid: r.kvid,
    ParentKvid: r.parent_kvid,
    Title: r.title,
    DisplayName: r.display_name,
    Type: r.type,
    Icon: r.icon,
    Order: r.sort_order,
    Remark: r.remark,
    FunctionKvid: r.function_kvid,
    Parameters: r.parameters,
  }));

  const permissionFilteredResults = filterMenuItemsByPermissions(
    results,
    permissionContext.allowedFunctionKvids
  );

  return {
    MenuRoot: { Kvid: root.kvid, Title: root.title, DisplayName: root.display_name ?? undefined },
    MenusMain: {
      Results: permissionFilteredResults,
      Total: permissionFilteredResults.length,
    },
  };
}
