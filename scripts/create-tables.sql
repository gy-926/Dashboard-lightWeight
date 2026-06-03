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

INSERT INTO public.functions (kvid, handler, title, render_type, source_type)
VALUES ('func-demo-iframe', 'https://example.com', 'iframe 示例', 'webview', 'manual');

INSERT INTO public.menu_roots (kvid, title, display_name, internal_code)
VALUES ('root-mock', 'GavinYin Dashboard', 'GavinYin Dashboard', 'umdDashboard');

INSERT INTO public.menus (kvid, parent_kvid, menu_root_kvid, title, type, icon, sort_order)
VALUES ('mock-demo', NULL, 'root-mock', '功能演示', 'Folder', 'fas fa-flask', 1);

INSERT INTO public.menus (kvid, parent_kvid, menu_root_kvid, title, display_name, type, icon, sort_order, function_kvid)
VALUES ('mock-demo-iframe', 'mock-demo', 'root-mock', 'iframe 嵌入示例', 'iframe 嵌入示例', 'Page', 'fas fa-window-restore', 1, 'func-demo-iframe');
