-- Dashboard admin policies for Supabase tables used by:
-- 1. UMD 模块导入 -> functions
-- 2. 菜单配置 -> menus / menu_roots
-- 3. 运行时菜单读取 -> functions / menus / menu_roots
--
-- functions 表的写操作已迁移到 dashboard-functions Edge Function。
-- Edge Function 使用服务端 service role；浏览器仅保留公开读取权限。

ALTER TABLE public.functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_roots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS functions_select_policy ON public.functions;
DROP POLICY IF EXISTS functions_insert_policy ON public.functions;
DROP POLICY IF EXISTS functions_update_policy ON public.functions;
DROP POLICY IF EXISTS functions_delete_policy ON public.functions;

CREATE POLICY functions_select_policy
ON public.functions
FOR SELECT
TO anon, authenticated
USING (true);

-- 不创建 INSERT / UPDATE / DELETE 策略：浏览器不能直接写入。

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
