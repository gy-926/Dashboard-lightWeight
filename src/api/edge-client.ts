import { supabase } from '@/utils/supabase';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function requestEdgeFunction<T>(
  functionName: string,
  path = '',
  init: RequestInit = {},
  accessToken?: string
): Promise<T> {
  let token = accessToken;
  if (!token) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    token = session?.access_token;
  }

  if (!token) {
    throw new Error('登录状态已失效，请重新登录');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok) {
    throw new Error(payload.error || `请求失败（HTTP ${response.status}）`);
  }

  return payload.data as T;
}
