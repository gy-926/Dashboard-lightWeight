import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error('[Supabase Admin] VITE_SUPABASE_URL 或 VITE_SUPABASE_SERVICE_KEY 未配置');
}

// service_role key 绕过 RLS，仅供管理后台写操作使用
export const adminSupabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
