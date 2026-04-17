
-- Shared updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============== PROFILES ==============
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============== BOOKS (universal catalog) ==============
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  year INTEGER,
  era TEXT,
  description TEXT,
  cover_url TEXT,
  gutenberg_id TEXT,
  open_library_id TEXT,
  source TEXT NOT NULL DEFAULT 'metadata_only',
  total_chapters INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Books are readable by everyone"
  ON public.books FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert books"
  ON public.books FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update books"
  ON public.books FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_books_slug ON public.books(slug);
CREATE INDEX idx_books_title_author ON public.books(lower(title), lower(author));

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== USER LIBRARY ==============
CREATE TABLE public.user_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'reading',
  current_chapter INTEGER NOT NULL DEFAULT 0,
  scroll_ratio REAL NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own library"
  ON public.user_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own library"
  ON public.user_library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own library"
  ON public.user_library FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own library"
  ON public.user_library FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_library_user ON public.user_library(user_id);
CREATE TRIGGER update_user_library_updated_at
  BEFORE UPDATE ON public.user_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== HIGHLIGHTS ==============
CREATE TABLE public.highlights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL,
  text TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own highlights"
  ON public.highlights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own highlights"
  ON public.highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own highlights"
  ON public.highlights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own highlights"
  ON public.highlights FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_highlights_user_book ON public.highlights(user_id, book_id);

-- ============== AI CACHE (per-user) ==============
CREATE TABLE public.ai_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL,
  style TEXT NOT NULL DEFAULT '',
  payload JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id, chapter, kind, style)
);
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai cache"
  ON public.ai_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ai cache"
  ON public.ai_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ai cache"
  ON public.ai_cache FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own ai cache"
  ON public.ai_cache FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_cache_user_book ON public.ai_cache(user_id, book_id, chapter);
CREATE TRIGGER update_ai_cache_updated_at
  BEFORE UPDATE ON public.ai_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== CHAT MESSAGES ==============
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own chat"
  ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own chat"
  ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own chat"
  ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_chat_user_book_chapter ON public.chat_messages(user_id, book_id, chapter, created_at);
