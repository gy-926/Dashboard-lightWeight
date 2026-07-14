import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

const renderTypes = new Set(['webview', 'vue', 'umd']);
const sourceTypes = new Set(['manual', 'umd', 'system']);

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

function sanitizeFunction(input: Record<string, unknown>, partial = false) {
  const result: Record<string, unknown> = {};
  const textFields = [
    'kvid',
    'title',
    'handler',
    'remark',
    'source_module',
    'source_url',
    'source_component',
    'icon',
  ];

  for (const field of textFields) {
    if (field in input) {
      const value = input[field];
      result[field] = value == null ? null : String(value).trim();
    }
  }

  if ('parameters' in input) {
    const value = input.parameters;
    result.parameters = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  if ('sort_order' in input) {
    const value = Number(input.sort_order);
    if (!Number.isFinite(value)) throw new Error('sort_order 必须是数字');
    result.sort_order = Math.trunc(value);
  }
  if ('is_active' in input) result.is_active = Boolean(input.is_active);

  if ('render_type' in input) {
    const value = String(input.render_type);
    if (!renderTypes.has(value)) throw new Error('render_type 不合法');
    result.render_type = value;
  }
  if ('source_type' in input) {
    const value = String(input.source_type);
    if (!sourceTypes.has(value)) throw new Error('source_type 不合法');
    result.source_type = value;
  }

  if (!partial) {
    if (!result.kvid) throw new Error('kvid 不能为空');
    if (!result.handler) throw new Error('handler 不能为空');
    if (!result.render_type) result.render_type = 'webview';
    if (!result.source_type) result.source_type = 'manual';
  }

  return result;
}

function pathAfterFunction(url: string): string[] {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  const functionIndex = parts.lastIndexOf('dashboard-functions');
  return functionIndex < 0 ? [] : parts.slice(functionIndex + 1);
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const anonKey = requiredEnv('SUPABASE_ANON_KEY');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = request.headers.get('Authorization') ?? '';
    const accessToken = authorization.replace(/^Bearer\s+/i, '');

    if (!accessToken) return jsonResponse(401, { error: '请先登录' });

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(accessToken);

    if (authError || !user) return jsonResponse(401, { error: '登录状态无效或已过期' });
    if (String(user.app_metadata?.role ?? '').toLowerCase() !== 'admin') {
      return jsonResponse(403, { error: '只有管理员可以维护功能数据' });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const path = pathAfterFunction(request.url);

    if (request.method === 'GET' && path.length === 0) {
      const { data, error } = await admin
        .from('functions')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('title', { ascending: true });
      if (error) throw error;
      return jsonResponse(200, { data: data ?? [] });
    }

    if (request.method === 'POST' && path.length === 0) {
      const payload = sanitizeFunction(await request.json());
      const { data, error } = await admin.from('functions').upsert(payload).select().single();
      if (error) throw error;
      return jsonResponse(200, { data });
    }

    if (request.method === 'POST' && path[0] === 'import') {
      const body = (await request.json()) as { items?: Array<Record<string, unknown>> };
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return jsonResponse(400, { error: 'items 不能为空' });
      }
      if (body.items.length > 100) {
        return jsonResponse(400, { error: '单次最多导入 100 条功能记录' });
      }

      const items = body.items.map(item => sanitizeFunction(item));
      const { data: existing, error: existingError } = await admin
        .from('functions')
        .select('source_component, source_url')
        .eq('render_type', 'umd');
      if (existingError) throw existingError;

      const existingKeys = new Set(
        (existing ?? []).map(row => `${row.source_component ?? ''}::${row.source_url ?? ''}`)
      );
      const newItems = items.filter(item => {
        const key = `${item.source_component ?? ''}::${item.source_url ?? ''}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      if (newItems.length > 0) {
        const { error } = await admin.from('functions').insert(newItems);
        if (error) throw error;
      }
      return jsonResponse(200, {
        data: { inserted: newItems.length, skipped: items.length - newItems.length },
      });
    }

    const kvid = path[0] ? decodeURIComponent(path[0]) : '';
    if (request.method === 'PATCH' && kvid) {
      const changes = sanitizeFunction(await request.json(), true);
      delete changes.kvid;
      if (Object.keys(changes).length === 0) {
        return jsonResponse(400, { error: '没有可更新的字段' });
      }
      const { data, error } = await admin
        .from('functions')
        .update(changes)
        .eq('kvid', kvid)
        .select()
        .single();
      if (error) throw error;
      return jsonResponse(200, { data });
    }

    if (request.method === 'DELETE' && kvid) {
      const { error } = await admin.from('functions').delete().eq('kvid', kvid);
      if (error) throw error;
      return jsonResponse(200, { data: null });
    }

    return jsonResponse(404, { error: '接口不存在' });
  } catch (error) {
    console.error('[dashboard-functions]', error);
    const message = error instanceof Error ? error.message : '服务器内部错误';
    return jsonResponse(500, { error: message });
  }
});
