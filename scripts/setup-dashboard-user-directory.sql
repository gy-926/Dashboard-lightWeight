-- Dashboard user directory RPC
-- 供权限配置页读取可分配角色的用户列表
-- 仅 app_metadata.role = 'admin' 的登录用户可返回结果

CREATE OR REPLACE FUNCTION public.dashboard_user_directory()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  app_role TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id AS user_id,
    u.email::text AS email,
    COALESCE(u.raw_app_meta_data ->> 'role', '')::text AS app_role,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  WHERE (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  ORDER BY u.email;
$$;

REVOKE ALL ON FUNCTION public.dashboard_user_directory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dashboard_user_directory() TO authenticated;
