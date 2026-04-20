-- Curated mentor library: famous copyrighted books we cannot host text for,
-- but for which we offer AI-generated overviews and chapter-by-chapter mentor guides.
-- No full text is ever stored here — only metadata + a chapter table-of-contents.

CREATE TABLE public.mentor_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  year INTEGER,
  era TEXT,
  genres TEXT[] NOT NULL DEFAULT '{}',
  moods TEXT[] NOT NULL DEFAULT '{}',
  cover_url TEXT,
  hook TEXT,
  description TEXT,
  total_chapters INTEGER NOT NULL DEFAULT 0,
  -- chapters: array of { index: int, title: string, blurb?: string }
  chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mentor_books ENABLE ROW LEVEL SECURITY;

-- Public read; writes are admin-only (no insert/update/delete policy → blocked for end users)
CREATE POLICY "Mentor books are readable by everyone"
  ON public.mentor_books
  FOR SELECT
  USING (true);

CREATE INDEX idx_mentor_books_featured ON public.mentor_books (featured, sort_order);
CREATE INDEX idx_mentor_books_era ON public.mentor_books (era);

CREATE TRIGGER update_mentor_books_updated_at
  BEFORE UPDATE ON public.mentor_books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();