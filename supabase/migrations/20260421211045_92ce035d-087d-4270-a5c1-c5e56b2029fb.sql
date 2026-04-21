-- 1. Track catalog refresh runs (latest timestamp + counts) so /library can show "last updated"
CREATE TABLE IF NOT EXISTS public.catalog_refresh_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'gutenberg-top',
  inserted_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_message text
);

ALTER TABLE public.catalog_refresh_log ENABLE ROW LEVEL SECURITY;

-- Anyone (signed in or not) can read the log so the library can display last refresh time.
CREATE POLICY "Catalog refresh log is readable by everyone"
  ON public.catalog_refresh_log FOR SELECT
  USING (true);

-- 2. Cache for richer mentor dossier sections (synopsis, themes, characters, ...).
-- One row per (slug, section). Public read so guests can see the richer page; only
-- service role inserts/updates (via the dossier server function using the admin client).
CREATE TABLE IF NOT EXISTS public.mentor_dossier_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  section text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(slug, section)
);

CREATE INDEX IF NOT EXISTS idx_mentor_dossier_sections_slug ON public.mentor_dossier_sections(slug);

ALTER TABLE public.mentor_dossier_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentor dossier sections are readable by everyone"
  ON public.mentor_dossier_sections FOR SELECT
  USING (true);

-- updated_at trigger
CREATE TRIGGER update_mentor_dossier_sections_updated_at
  BEFORE UPDATE ON public.mentor_dossier_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add a generated_at column on books so the refresh job can ignore recently-touched rows
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS last_refreshed_at timestamptz;