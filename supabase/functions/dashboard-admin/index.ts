import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`缺少服务端环境变量：${name}`);
  return value;
}

function routeParts(url: string): string[] {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  const index = parts.lastIndexOf('dashboard-admin');
  return index < 0 ? [] : parts.slice(index + 1);
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('请求内容必须是 JSON 对象');
  }
  return value as Record<string, unknown>;
}

function nullableText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

function requiredText(value: unknown, field: string): string {
  const text = nullableText(value);
  if (!text) throw new Error(`${field} 不能为空`);
  return text;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function integerValue(value: unknown): number {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) throw new Error('排序值必须是数字');
  return Math.max(0, Math.trunc(number));
}

function sanitizeMenuRoot(value: unknown) {
  const input = asObject(value);
  return {
    kvid: requiredText(input.kvid, 'kvid'),
    title: requiredText(input.title, 'title'),
    display_name: nullableText(input.display_name),
    internal_code: requiredText(input.internal_code, 'internal_code'),
    scope: nullableText(input.scope) ?? 'Member',
    sort_order: integerValue(input.sort_order),
    icon: nullableText(input.icon),
    remark: nullableText(input.remark),
    parameters: objectValue(input.parameters),
  };
}

function sanitizeMenu(value: unknown) {
  const input = asObject(value);
  const type = requiredText(input.type, 'type');
  if (!['Page', 'Folder', 'Link', 'System'].includes(type)) throw new Error('菜单 type 不合法');
  return {
    kvid: requiredText(input.kvid, 'kvid'),
    parent_kvid: nullableText(input.parent_kvid),
    menu_root_kvid: requiredText(input.menu_root_kvid, 'menu_root_kvid'),
    title: requiredText(input.title, 'title'),
    display_name: nullableText(input.display_name),
    internal_code: nullableText(input.internal_code),
    scope: nullableText(input.scope) ?? 'Member',
    type,
    icon: nullableText(input.icon),
    sort_order: integerValue(input.sort_order),
    remark: nullableText(input.remark),
    function_kvid: nullableText(input.function_kvid),
    parameters: objectValue(input.parameters),
    is_active: input.is_active !== false,
  };
}

function sanitizeRole(value: unknown) {
  const input = asObject(value);
  return {
    kvid: requiredText(input.kvid, 'kvid'),
    code: requiredText(input.code, 'code'),
    name: requiredText(input.name, 'name'),
    remark: nullableText(input.remark),
    is_active: input.is_active !== false,
  };
}

function parseParameters(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return objectValue(JSON.parse(raw));
    } catch {
      return {};
    }
  }
  return objectValue(raw);
}

async function getAllowedFunctionKvids(
  admin: SupabaseClient,
  user: User
): Promise<Set<string> | null> {
  if (String(user.app_metadata?.role ?? '').toLowerCase() === 'admin') return null;

  const { data: userRoles, error: userRolesError } = await admin
    .from('user_roles')
    .select('role_kvid')
    .eq('user_id', user.id);
  if (userRolesError) throw userRolesError;

  const roleKvids = (userRoles ?? []).map(row => String(row.role_kvid)).filter(Boolean);
  if (roleKvids.length === 0) return new Set();

  const { data, error } = await admin
    .from('role_functions')
    .select('function_kvid')
    .in('role_kvid', roleKvids);
  if (error) throw error;
  return new Set((data ?? []).map(row => String(row.function_kvid)).filter(Boolean));
}

function filterMenusByPermission(items: Array<Record<string, unknown>>, allowed: Set<string> | null) {
  if (!allowed) return items;

  const byParent = new Map<string, Array<Record<string, unknown>>>();
  for (const item of items) {
    const parent = String(item.ParentKvid ?? '');
    const siblings = byParent.get(parent) ?? [];
    siblings.push(item);
    byParent.set(parent, siblings);
  }

  const included = new Set<string>();
  const visit = (item: Record<string, unknown>): boolean => {
    const kvid = String(item.Kvid ?? '');
    const children = byParent.get(kvid) ?? [];
    const hasChild = children.some(visit);
    const functionKvid = String(item.FunctionKvid ?? '');
    const hasFunction = functionKvid ? allowed.has(functionKvid) : false;
    if (hasChild || hasFunction) included.add(kvid);
    return included.has(kvid);
  };

  const ids = new Set(items.map(item => String(item.Kvid ?? '')));
  items
    .filter(item => !item.ParentKvid || !ids.has(String(item.ParentKvid)))
    .forEach(item => visit(item));
  return items.filter(item => included.has(String(item.Kvid ?? '')));
}

async function getUserRoles(admin: SupabaseClient, user: User) {
  const { data: bindings, error: bindingError } = await admin
    .from('user_roles')
    .select('role_kvid')
    .eq('user_id', user.id);
  if (bindingError) throw bindingError;
  const ids = (bindings ?? []).map(row => String(row.role_kvid)).filter(Boolean);
  if (ids.length === 0) return [];
  const { data, error } = await admin.from('roles').select('kvid, code, name').in('kvid', ids);
  if (error) throw error;
  return data ?? [];
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const anonKey = requiredEnv('SUPABASE_ANON_KEY');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const accessToken = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!accessToken) return jsonResponse(401, { error: '请先登录' });

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(accessToken);
    if (authError || !user) return jsonResponse(401, { error: '登录状态无效或已过期' });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const path = routeParts(request.url);
    const url = new URL(request.url);

    if (request.method === 'GET' && path.join('/') === 'me/roles') {
      return jsonResponse(200, { data: await getUserRoles(admin, user) });
    }

    if (request.method === 'GET' && path.join('/') === 'menus/runtime') {
      const internalCode = requiredText(url.searchParams.get('internalCode'), 'internalCode');
      const { data: root, error: rootError } = await admin
        .from('menu_roots')
        .select('kvid, title, display_name')
        .eq('internal_code', internalCode)
        .single();
      if (rootError || !root) {
        return jsonResponse(200, {
          data: { MenuRoot: { Kvid: '', Title: '' }, MenusMain: { Results: [], Total: 0 } },
        });
      }

      const { data: menuRows, error: menuError } = await admin
        .from('menus')
        .select(
          'kvid, parent_kvid, title, display_name, type, icon, sort_order, remark, function_kvid, parameters'
        )
        .eq('menu_root_kvid', root.kvid)
        .eq('is_active', true)
        .order('sort_order');
      if (menuError) throw menuError;

      const functionKvids = Array.from(
        new Set((menuRows ?? []).map(row => String(row.function_kvid ?? '')).filter(Boolean))
      );
      const handlerMap = new Map<string, string>();
      if (functionKvids.length > 0) {
        const { data: functions, error } = await admin
          .from('functions')
          .select('kvid, handler')
          .in('kvid', functionKvids);
        if (error) throw error;
        (functions ?? []).forEach(row => handlerMap.set(String(row.kvid), String(row.handler ?? '')));
      }

      const items = (menuRows ?? []).map(row => ({
        Kvid: row.kvid,
        ParentKvid: row.parent_kvid,
        Title: row.title,
        DisplayName: row.display_name,
        Type: row.type,
        Icon: row.icon,
        Order: row.sort_order,
        Remark: row.remark,
        FunctionKvid: row.function_kvid,
        Parameters: row.parameters,
        Handler: row.function_kvid ? (handlerMap.get(String(row.function_kvid)) ?? '') : '',
      }));
      const filtered = filterMenusByPermission(items, await getAllowedFunctionKvids(admin, user));
      return jsonResponse(200, {
        data: {
          MenuRoot: {
            Kvid: root.kvid,
            Title: root.title,
            DisplayName: root.display_name ?? undefined,
          },
          MenusMain: { Results: filtered, Total: filtered.length },
        },
      });
    }

    if (request.method === 'GET' && path.join('/') === 'menus/autostart') {
      const rootKvid = requiredText(url.searchParams.get('menuRootKvid'), 'menuRootKvid');
      const { data, error } = await admin
        .from('menus')
        .select('kvid, function_kvid, parameters')
        .eq('menu_root_kvid', rootKvid)
        .is('parent_kvid', null)
        .eq('is_active', true);
      if (error) throw error;
      const allowed = await getAllowedFunctionKvids(admin, user);
      const item = (data ?? []).find(row => {
        const autoStartup = parseParameters(row.parameters).AutoStartup;
        const canAccess =
          !allowed || !row.function_kvid || allowed.has(String(row.function_kvid ?? ''));
        return canAccess && (autoStartup === true || autoStartup === 'true' || autoStartup === 1);
      });
      return jsonResponse(200, { data: item?.kvid ?? null });
    }

    if (String(user.app_metadata?.role ?? '').toLowerCase() !== 'admin') {
      return jsonResponse(403, { error: '只有管理员可以执行此操作' });
    }

    if (request.method === 'GET' && path.join('/') === 'admin/menu-config') {
      const [roots, menus, functions] = await Promise.all([
        admin.from('menu_roots').select('*').order('sort_order').order('title'),
        admin.from('menus').select('*').order('sort_order').order('title'),
        admin
          .from('functions')
          .select('*')
          .order('is_active', { ascending: false })
          .order('sort_order')
          .order('title'),
      ]);
      if (roots.error) throw roots.error;
      if (menus.error) throw menus.error;
      if (functions.error) throw functions.error;
      return jsonResponse(200, {
        data: { roots: roots.data ?? [], menus: menus.data ?? [], functions: functions.data ?? [] },
      });
    }

    if (request.method === 'POST' && path.join('/') === 'admin/menu-roots') {
      const payload = sanitizeMenuRoot(await request.json());
      const { data, error } = await admin.from('menu_roots').upsert(payload).select().single();
      if (error) throw error;
      return jsonResponse(200, { data });
    }

    if (request.method === 'DELETE' && path[0] === 'admin' && path[1] === 'menu-roots' && path[2]) {
      const { error } = await admin.from('menu_roots').delete().eq('kvid', decodeURIComponent(path[2]));
      if (error) throw error;
      return jsonResponse(200, { data: null });
    }

    if (request.method === 'POST' && path.join('/') === 'admin/menus/bulk') {
      const body = asObject(await request.json());
      if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 200) {
        return jsonResponse(400, { error: 'items 数量必须在 1 到 200 之间' });
      }
      const payload = body.items.map(sanitizeMenu);
      const { data, error } = await admin.from('menus').insert(payload).select();
      if (error) throw error;
      return jsonResponse(200, { data: data ?? [] });
    }

    if (request.method === 'POST' && path.join('/') === 'admin/menus') {
      const payload = sanitizeMenu(await request.json());
      const { data, error } = await admin.from('menus').upsert(payload).select().single();
      if (error) throw error;
      return jsonResponse(200, { data });
    }

    if (request.method === 'DELETE' && path[0] === 'admin' && path[1] === 'menus' && path[2]) {
      const { error } = await admin.from('menus').delete().eq('kvid', decodeURIComponent(path[2]));
      if (error) throw error;
      return jsonResponse(200, { data: null });
    }

    if (request.method === 'GET' && path.join('/') === 'admin/permissions') {
      const [roles, roleFunctions, userRoles, users] = await Promise.all([
        admin.from('roles').select('kvid, code, name, remark, is_active').order('is_active', { ascending: false }).order('name'),
        admin.from('role_functions').select('role_kvid, function_kvid'),
        admin.from('user_roles').select('user_id, role_kvid'),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);
      if (roles.error) throw roles.error;
      if (roleFunctions.error) throw roleFunctions.error;
      if (userRoles.error) throw userRoles.error;
      if (users.error) throw users.error;
      return jsonResponse(200, {
        data: {
          roles: roles.data ?? [],
          roleFunctions: roleFunctions.data ?? [],
          userRoles: userRoles.data ?? [],
          users: users.data.users.map(item => ({
            user_id: item.id,
            email: item.email ?? null,
            app_role: item.app_metadata?.role ? String(item.app_metadata.role) : null,
            created_at: item.created_at ?? null,
            last_sign_in_at: item.last_sign_in_at ?? null,
          })),
        },
      });
    }

    if (request.method === 'POST' && path.join('/') === 'admin/roles') {
      const payload = sanitizeRole(await request.json());
      const { data, error } = await admin.from('roles').upsert(payload).select().single();
      if (error) throw error;
      return jsonResponse(200, { data });
    }

    if (request.method === 'DELETE' && path[0] === 'admin' && path[1] === 'roles' && path[2]) {
      const kvid = decodeURIComponent(path[2]);
      const { data: role, error: lookupError } = await admin.from('roles').select('code').eq('kvid', kvid).single();
      if (lookupError) throw lookupError;
      if (role?.code === 'admin') return jsonResponse(400, { error: '不能删除内置管理员角色' });
      const { error } = await admin.from('roles').delete().eq('kvid', kvid);
      if (error) throw error;
      return jsonResponse(200, { data: null });
    }

    if (request.method === 'PUT' && path[0] === 'admin' && path[1] === 'roles' && path[2] && path[3] === 'functions') {
      const roleKvid = decodeURIComponent(path[2]);
      const body = asObject(await request.json());
      const ids = Array.isArray(body.functionKvids)
        ? Array.from(new Set(body.functionKvids.map(item => String(item).trim()).filter(Boolean)))
        : [];
      const { error: deleteError } = await admin.from('role_functions').delete().eq('role_kvid', roleKvid);
      if (deleteError) throw deleteError;
      if (ids.length > 0) {
        const { error } = await admin.from('role_functions').insert(
          ids.map(functionKvid => ({ kvid: crypto.randomUUID(), role_kvid: roleKvid, function_kvid: functionKvid }))
        );
        if (error) throw error;
      }
      return jsonResponse(200, { data: null });
    }

    if (request.method === 'PUT' && path[0] === 'admin' && path[1] === 'users' && path[2] && path[3] === 'roles') {
      const userId = decodeURIComponent(path[2]);
      const body = asObject(await request.json());
      const ids = Array.isArray(body.roleKvids)
        ? Array.from(new Set(body.roleKvids.map(item => String(item).trim()).filter(Boolean)))
        : [];
      const { error: deleteError } = await admin.from('user_roles').delete().eq('user_id', userId);
      if (deleteError) throw deleteError;
      if (ids.length > 0) {
        const { error } = await admin.from('user_roles').insert(
          ids.map(roleKvid => ({ kvid: crypto.randomUUID(), user_id: userId, role_kvid: roleKvid }))
        );
        if (error) throw error;
      }
      return jsonResponse(200, { data: null });
    }

    return jsonResponse(404, { error: '接口不存在' });
  } catch (error) {
    console.error('[dashboard-admin]', error);
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return jsonResponse(500, { error: message });
  }
});
