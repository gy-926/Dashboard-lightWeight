-- Dashboard permission model
-- 1. roles:        角色定义
-- 2. user_roles:   Supabase auth.users 与角色绑定
-- 3. role_functions: 角色可访问的功能列表
--
-- 建议：
-- - admin 角色用于菜单、功能、UMD 配置维护
-- - demo/viewer 角色用于只读演示

CREATE TABLE IF NOT EXISTS public.roles (
  kvid       TEXT PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  remark     TEXT,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  kvid       TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_kvid  TEXT NOT NULL REFERENCES public.roles(kvid) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role_kvid)
);

CREATE TABLE IF NOT EXISTS public.role_functions (
  kvid          TEXT PRIMARY KEY,
  role_kvid     TEXT NOT NULL REFERENCES public.roles(kvid) ON DELETE CASCADE,
  function_kvid TEXT NOT NULL REFERENCES public.functions(kvid) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (role_kvid, function_kvid)
);

CREATE INDEX IF NOT EXISTS idx_roles_code ON public.roles (code);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON public.roles (is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_kvid ON public.user_roles (role_kvid);
CREATE INDEX IF NOT EXISTS idx_role_functions_role_kvid ON public.role_functions (role_kvid);
CREATE INDEX IF NOT EXISTS idx_role_functions_function_kvid ON public.role_functions (function_kvid);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_functions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_select_policy ON public.roles;
DROP POLICY IF EXISTS roles_insert_policy ON public.roles;
DROP POLICY IF EXISTS roles_update_policy ON public.roles;
DROP POLICY IF EXISTS roles_delete_policy ON public.roles;

DROP POLICY IF EXISTS user_roles_select_policy ON public.user_roles;
DROP POLICY IF EXISTS user_roles_insert_policy ON public.user_roles;
DROP POLICY IF EXISTS user_roles_update_policy ON public.user_roles;
DROP POLICY IF EXISTS user_roles_delete_policy ON public.user_roles;

DROP POLICY IF EXISTS role_functions_select_policy ON public.role_functions;
DROP POLICY IF EXISTS role_functions_insert_policy ON public.role_functions;
DROP POLICY IF EXISTS role_functions_update_policy ON public.role_functions;
DROP POLICY IF EXISTS role_functions_delete_policy ON public.role_functions;

CREATE POLICY roles_select_policy
ON public.roles
FOR SELECT
TO authenticated
USING (is_active = TRUE OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY roles_insert_policy
ON public.roles
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY roles_update_policy
ON public.roles
FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY roles_delete_policy
ON public.roles
FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY user_roles_select_policy
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY user_roles_insert_policy
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY user_roles_update_policy
ON public.user_roles
FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY user_roles_delete_policy
ON public.user_roles
FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY role_functions_select_policy
ON public.role_functions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY role_functions_insert_policy
ON public.role_functions
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY role_functions_update_policy
ON public.role_functions
FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY role_functions_delete_policy
ON public.role_functions
FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

INSERT INTO public.roles (kvid, code, name, remark, is_active)
VALUES
  ('role-admin', 'admin', '管理员', '拥有全部功能访问与维护权限', TRUE),
  ('role-demo', 'demo', '演示账号', '演示环境使用，只授予指定功能的访问权限', TRUE),
  ('role-viewer', 'viewer', '只读账号', '仅查看授权功能，不可维护配置', TRUE)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  remark = EXCLUDED.remark,
  is_active = EXCLUDED.is_active;
