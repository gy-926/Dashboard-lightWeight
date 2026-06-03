-- Upgrade existing public.functions to the standardized function-center schema.
-- Safe to run multiple times.

ALTER TABLE public.functions
  ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;

UPDATE public.functions
SET parameters = '{}'::jsonb
WHERE parameters IS NULL;

ALTER TABLE public.functions
  ALTER COLUMN parameters SET DEFAULT '{}'::jsonb;

ALTER TABLE public.functions
  ADD COLUMN IF NOT EXISTS render_type TEXT DEFAULT 'webview';

ALTER TABLE public.functions
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'manual';

ALTER TABLE public.functions
  ADD COLUMN IF NOT EXISTS source_module TEXT;

ALTER TABLE public.functions
  ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE public.functions
  ADD COLUMN IF NOT EXISTS source_component TEXT;

ALTER TABLE public.functions
  ADD COLUMN IF NOT EXISTS icon TEXT;

ALTER TABLE public.functions
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE public.functions
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

UPDATE public.functions
SET render_type = CASE
  WHEN handler LIKE '<%>' THEN 'umd'
  WHEN handler LIKE '%.vue' THEN 'vue'
  ELSE 'webview'
END
WHERE render_type IS NULL
   OR render_type = '';

UPDATE public.functions
SET source_type = CASE
  WHEN render_type = 'umd' THEN 'umd'
  ELSE 'manual'
END
WHERE source_type IS NULL
   OR source_type = '';

UPDATE public.functions
SET source_component = REGEXP_REPLACE(handler, '^<([a-zA-Z0-9-]+)[^>]*>$', '\1')
WHERE render_type = 'umd'
  AND source_component IS NULL;

UPDATE public.functions
SET source_url = remark
WHERE render_type = 'umd'
  AND source_url IS NULL
  AND remark IS NOT NULL;

ALTER TABLE public.functions
  DROP CONSTRAINT IF EXISTS functions_render_type_check;

ALTER TABLE public.functions
  ADD CONSTRAINT functions_render_type_check
  CHECK (render_type IN ('webview', 'vue', 'umd'));

ALTER TABLE public.functions
  DROP CONSTRAINT IF EXISTS functions_source_type_check;

ALTER TABLE public.functions
  ADD CONSTRAINT functions_source_type_check
  CHECK (source_type IN ('manual', 'umd', 'system'));

CREATE INDEX IF NOT EXISTS idx_functions_render_type ON public.functions (render_type);
CREATE INDEX IF NOT EXISTS idx_functions_source_component ON public.functions (source_component);
CREATE INDEX IF NOT EXISTS idx_functions_is_active ON public.functions (is_active);
