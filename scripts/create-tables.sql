CREATE TABLE IF NOT EXISTS public.functions (
  kvid       TEXT PRIMARY KEY,
  handler    TEXT NOT NULL,
  remark     TEXT,
  title      TEXT,
  parameters JSONB
);

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

INSERT INTO public.functions (kvid, handler, title)
VALUES ('func-demo-iframe', 'https://example.com', 'iframe 示例');

INSERT INTO public.menu_roots (kvid, title, display_name, internal_code)
VALUES ('root-mock', 'GavinYin Dashboard', 'GavinYin Dashboard', 'umdDashboard');

INSERT INTO public.menus (kvid, parent_kvid, menu_root_kvid, title, type, icon, sort_order)
VALUES ('mock-demo', NULL, 'root-mock', '功能演示', 'Folder', 'fas fa-flask', 1);

INSERT INTO public.menus (kvid, parent_kvid, menu_root_kvid, title, display_name, type, icon, sort_order, function_kvid)
VALUES ('mock-demo-iframe', 'mock-demo', 'root-mock', 'iframe 嵌入示例', 'iframe 嵌入示例', 'Page', 'fas fa-window-restore', 1, 'func-demo-iframe');
