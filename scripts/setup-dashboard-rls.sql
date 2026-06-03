-- Dashboard admin policies for Supabase tables used by:
-- 1. UMD 模块导入 -> functions
-- 2. 菜单配置 -> menus / menu_roots
-- 3. 运行时菜单读取 -> functions / menus / menu_roots
--
-- 当前前端在未配置 VITE_SUPABASE_SERVICE_KEY 时，会回退为 anon key。
-- 因此如果这些表启用了 RLS，就必须为 anon / authenticated 增加策略。

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

CREATE POLICY functions_insert_policy
ON public.functions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY functions_update_policy
ON public.functions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY functions_delete_policy
ON public.functions
FOR DELETE
TO anon, authenticated
USING (true);

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
