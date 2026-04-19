-- Storage bucket for user uploads (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-books', 'user-books', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access files in a folder named after their user id
CREATE POLICY "Users read own uploaded books"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-books' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own books"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-books' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own uploaded books"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-books' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own uploaded books"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-books' AND auth.uid()::text = (storage.foldername(name))[1]);

-- User uploaded books metadata + parsed chapters
CREATE TABLE public.user_uploaded_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'epub')),
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'parsing', 'ready', 'error')),
  error_message TEXT,
  total_chapters INTEGER DEFAULT 0,
  chapters JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_uploaded_books_user ON public.user_uploaded_books(user_id, created_at DESC);

ALTER TABLE public.user_uploaded_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own uploads" ON public.user_uploaded_books
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own uploads" ON public.user_uploaded_books
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own uploads" ON public.user_uploaded_books
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own uploads" ON public.user_uploaded_books
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_uploaded_books_updated_at
  BEFORE UPDATE ON public.user_uploaded_books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Title-only summary cache
CREATE TABLE public.title_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  mode TEXT NOT NULL DEFAULT 'overview' CHECK (mode IN ('overview', 'chapter')),
  chapter_label TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_title_summaries_user ON public.title_summaries(user_id, created_at DESC);
CREATE INDEX idx_title_summaries_lookup ON public.title_summaries(user_id, title, author, mode, chapter_label);

ALTER TABLE public.title_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own title summaries" ON public.title_summaries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own title summaries" ON public.title_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own title summaries" ON public.title_summaries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own title summaries" ON public.title_summaries
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_title_summaries_updated_at
  BEFORE UPDATE ON public.title_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();