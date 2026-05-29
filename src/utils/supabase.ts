import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 未配置，请检查 .env 文件。'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 专用于存储操作的客户端：禁用 session 持久化，始终使用匿名 key
// 避免浏览器中已登录的用户 session 干扰 storage.list() 的 RLS 策略
export const storageClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
