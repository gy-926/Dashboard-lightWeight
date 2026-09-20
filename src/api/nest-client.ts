const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export function isNestApiRequest(url: string): boolean {
  const request = new URL(url, window.location.href);
  const base = new URL(`${API_BASE}/`, window.location.href);
  return request.origin === base.origin && request.pathname.startsWith(base.pathname);
}

export interface ApiUser { id: string; name: string; email: string; role: 'user' | 'super_admin' }
interface AuthResult { accessToken: string; expiresIn: number; user: ApiUser }

let accessToken: string | null = null;
let currentUser: ApiUser | null = null;
let refreshPromise: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

export function onAuthChange(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
function notify() { listeners.forEach(listener => listener()); }
export function getAccessToken() { return accessToken; }
export function getCurrentUser() { return currentUser; }
function setAuth(result: AuthResult | null) { accessToken = result?.accessToken ?? null; currentUser = result?.user ?? null; notify(); }

async function parse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `请求失败（HTTP ${response.status}）`);
  return payload.Results as T;
}

export async function refreshAuth(): Promise<boolean> {
  if (!refreshPromise) refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
      setAuth(await parse<AuthResult>(response));
      return true;
    } catch { setAuth(null); return false; }
    finally { refreshPromise = null; }
  })();
  return refreshPromise;
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  setAuth(await parse<AuthResult>(response));
}

export async function register(email: string, password: string) {
  const name = email.split('@')[0] || '用户';
  const response = await fetch(`${API_BASE}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
  await parse<ApiUser>(response);
  await login(email, password);
}

export async function logout() {
  try { await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }); }
  finally { setAuth(null); }
}

export async function apiFetch(path: string, init: RequestInit = {}, explicitToken?: string): Promise<Response> {
  if (!accessToken && !explicitToken) await refreshAuth();
  const hasFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const send = (token: string | null) => fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(!hasFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  let response = await send(explicitToken ?? accessToken);
  if (response.status === 401 && !explicitToken && await refreshAuth()) response = await send(accessToken);
  if (response.status === 401) setAuth(null);
  return response;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, explicitToken?: string): Promise<T> {
  const response = await apiFetch(path, init, explicitToken);
  return parse<T>(response);
}
