import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const clientKey = serviceKey || anonKey;

if (!url || !clientKey) {
  throw new Error(
    '[Supabase Admin] VITE_SUPABASE_URL 与 Supabase Key 未配置，请检查 VITE_SUPABASE_SERVICE_KEY 或 VITE_SUPABASE_ANON_KEY'
  );
}

if (!serviceKey && anonKey) {
  console.warn('[Supabase Admin] 未配置 service key，已回退到 anon key，写操作可能受 RLS 限制');
}

// 优先使用 service_role；未提供时回退到 anon key，避免模块加载阶段直接崩溃
export const adminSupabase = createClient(url, clientKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
