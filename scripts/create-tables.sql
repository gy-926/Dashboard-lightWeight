CREATE TABLE IF NOT EXISTS public.functions (
  kvid             TEXT PRIMARY KEY,
  handler          TEXT NOT NULL,
  remark           TEXT,
  title            TEXT,
  parameters       JSONB DEFAULT '{}'::jsonb,
  render_type      TEXT NOT NULL DEFAULT 'webview',
  source_type      TEXT NOT NULL DEFAULT 'manual',
  source_module    TEXT,
  source_url       TEXT,
  source_component TEXT,
  icon             TEXT,
  sort_order       INTEGER DEFAULT 0,
  is_active        BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.functions
  ADD CONSTRAINT functions_render_type_check
  CHECK (render_type IN ('webview', 'vue', 'umd'));

ALTER TABLE public.functions
  ADD CONSTRAINT functions_source_type_check
  CHECK (source_type IN ('manual', 'umd', 'system'));

CREATE INDEX IF NOT EXISTS idx_functions_render_type ON public.functions (render_type);
CREATE INDEX IF NOT EXISTS idx_functions_source_component ON public.functions (source_component);
CREATE INDEX IF NOT EXISTS idx_functions_is_active ON public.functions (is_active);

CREATE TABLE IF NOT EXISTS public.menu_roots (
  kvid          TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  display_name  TEXT,
  internal_code TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.menus (
  kvid           TEXT PRIMARY KEY,
  parent_kvid    TEXT REFERENCES public.menus(kvid) ON DELETE CASCADE,
  menu_root_kvid TEXT NOT NULL REFERENCES public.menu_roots(kvid) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  display_name   TEXT,
  type           TEXT NOT NULL DEFAULT 'Page',
  icon           TEXT,
  sort_order     INTEGER DEFAULT 0,
  remark         TEXT,
  function_kvid  TEXT REFERENCES public.functions(kvid) ON DELETE SET NULL,
  parameters     JSONB,
  is_active      BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.menus
  ADD CONSTRAINT menus_type_check
  CHECK (type IN ('Page', 'Folder', 'Link', 'System'));

CREATE INDEX IF NOT EXISTS idx_menus_root   ON public.menus (menu_root_kvid);
CREATE INDEX IF NOT EXISTS idx_menus_parent ON public.menus (parent_kvid);

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

ALTER TABLE public.functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_roots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_functions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS functions_select_policy ON public.functions;
DROP POLICY IF EXISTS functions_insert_policy ON public.functions;
DROP POLICY IF EXISTS functions_update_policy ON public.functions;
DROP POLICY IF EXISTS functions_delete_policy ON public.functions;

CREATE POLICY functions_select_policy
ON public.functions
FOR SELECT
TO anon, authenticated
USING (true);

-- functions 写操作必须经过 dashboard-functions Edge Function。
-- 不为 anon / authenticated 创建 INSERT / UPDATE / DELETE 策略。

DROP POLICY IF EXISTS menu_roots_select_policy ON public.menu_roots;
DROP POLICY IF EXISTS menu_roots_insert_policy ON public.menu_roots;
DROP POLICY IF EXISTS menu_roots_update_policy ON public.menu_roots;
DROP POLICY IF EXISTS menu_roots_delete_policy ON public.menu_roots;

CREATE POLICY menu_roots_select_policy
ON public.menu_roots
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY menu_roots_insert_policy
ON public.menu_roots
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY menu_roots_update_policy
ON public.menu_roots
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY menu_roots_delete_policy
ON public.menu_roots
FOR DELETE
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS menus_select_policy ON public.menus;
DROP POLICY IF EXISTS menus_insert_policy ON public.menus;
DROP POLICY IF EXISTS menus_update_policy ON public.menus;
DROP POLICY IF EXISTS menus_delete_policy ON public.menus;

CREATE POLICY menus_select_policy
ON public.menus
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY menus_insert_policy
ON public.menus
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY menus_update_policy
ON public.menus
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY menus_delete_policy
ON public.menus
FOR DELETE
TO anon, authenticated
USING (true);

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

INSERT INTO public.functions (kvid, handler, title, render_type, source_type)
VALUES ('func-demo-iframe', 'https://example.com', 'iframe 示例', 'webview', 'manual');

INSERT INTO public.menu_roots (kvid, title, display_name, internal_code)
VALUES ('root-mock', 'GavinYin Dashboard', 'GavinYin Dashboard', 'umdDashboard');

INSERT INTO public.menus (kvid, parent_kvid, menu_root_kvid, title, type, icon, sort_order)
VALUES ('mock-demo', NULL, 'root-mock', '功能演示', 'Folder', 'fas fa-flask', 1);

INSERT INTO public.menus (kvid, parent_kvid, menu_root_kvid, title, display_name, type, icon, sort_order, function_kvid)
VALUES ('mock-demo-iframe', 'mock-demo', 'root-mock', 'iframe 嵌入示例', 'iframe 嵌入示例', 'Page', 'fas fa-window-restore', 1, 'func-demo-iframe');
-- Edge API 安全边界：业务表不再允许浏览器直接访问。
ALTER TABLE public.functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_roots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_functions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS functions_select_policy ON public.functions;
DROP POLICY IF EXISTS functions_insert_policy ON public.functions;
DROP POLICY IF EXISTS functions_update_policy ON public.functions;
DROP POLICY IF EXISTS functions_delete_policy ON public.functions;
DROP POLICY IF EXISTS menu_roots_select_policy ON public.menu_roots;
DROP POLICY IF EXISTS menu_roots_insert_policy ON public.menu_roots;
DROP POLICY IF EXISTS menu_roots_update_policy ON public.menu_roots;
DROP POLICY IF EXISTS menu_roots_delete_policy ON public.menu_roots;
DROP POLICY IF EXISTS menus_select_policy ON public.menus;
DROP POLICY IF EXISTS menus_insert_policy ON public.menus;
DROP POLICY IF EXISTS menus_update_policy ON public.menus;
DROP POLICY IF EXISTS menus_delete_policy ON public.menus;
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
