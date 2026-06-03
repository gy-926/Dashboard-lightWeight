-- Upgrade menu schema for the new MenuConfig.vue implementation.
-- Safe to run multiple times.

ALTER TABLE public.menu_roots
  ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'Member';

ALTER TABLE public.menu_roots
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE public.menu_roots
  ADD COLUMN IF NOT EXISTS icon TEXT;

ALTER TABLE public.menu_roots
  ADD COLUMN IF NOT EXISTS remark TEXT;

ALTER TABLE public.menu_roots
  ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;

UPDATE public.menu_roots
SET parameters = '{}'::jsonb
WHERE parameters IS NULL;

ALTER TABLE public.menu_roots
  ALTER COLUMN parameters SET DEFAULT '{}'::jsonb;

ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS internal_code TEXT;

ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'Member';

UPDATE public.menus
SET parameters = '{}'::jsonb
WHERE parameters IS NULL;

ALTER TABLE public.menus
  ALTER COLUMN parameters SET DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_menu_roots_sort_order ON public.menu_roots (sort_order);
CREATE INDEX IF NOT EXISTS idx_menus_internal_code ON public.menus (internal_code);
