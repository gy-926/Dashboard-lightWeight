-- 必须在 dashboard-functions 与 dashboard-admin 都部署成功后执行。
-- 执行后，六张业务表只能由 Edge Function 的 service role 访问；
-- 浏览器中的 anon/authenticated token 不再拥有直接访问策略。
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
