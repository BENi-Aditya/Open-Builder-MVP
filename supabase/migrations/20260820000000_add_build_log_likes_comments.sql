-- ============ BUILD LOG LIKES ============
CREATE TABLE IF NOT EXISTS public.build_log_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  build_log_id uuid NOT NULL REFERENCES public.build_logs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, build_log_id)
);
ALTER TABLE public.build_log_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "build_log_likes_select_all" ON public.build_log_likes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "build_log_likes_insert_own" ON public.build_log_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "build_log_likes_delete_own" ON public.build_log_likes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add like_count to build_logs
DO $$ BEGIN
  ALTER TABLE public.build_logs ADD COLUMN like_count int NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Add comment_count to build_logs
DO $$ BEGIN
  ALTER TABLE public.build_logs ADD COLUMN comment_count int NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Build log likes trigger
CREATE OR REPLACE FUNCTION public.tg_build_log_likes_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF tg_op = 'INSERT' THEN UPDATE public.build_logs SET like_count = like_count + 1 WHERE id = NEW.build_log_id;
  ELSIF tg_op = 'DELETE' THEN UPDATE public.build_logs SET like_count = greatest(like_count - 1, 0) WHERE id = OLD.build_log_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS build_log_likes_count_trg ON public.build_log_likes;
CREATE TRIGGER build_log_likes_count_trg AFTER INSERT OR DELETE ON public.build_log_likes FOR EACH ROW EXECUTE FUNCTION public.tg_build_log_likes_count();

-- ============ BUILD LOG COMMENTS ============
CREATE TABLE IF NOT EXISTS public.build_log_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_log_id uuid NOT NULL REFERENCES public.build_logs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.build_log_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS build_log_comments_log_idx ON public.build_log_comments(build_log_id, created_at DESC);
ALTER TABLE public.build_log_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "build_log_comments_select_all" ON public.build_log_comments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "build_log_comments_insert_own" ON public.build_log_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "build_log_comments_update_own" ON public.build_log_comments FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "build_log_comments_delete_own" ON public.build_log_comments FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add like_count to build_log_comments
DO $$ BEGIN
  ALTER TABLE public.build_log_comments ADD COLUMN like_count int NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Build log comments count trigger
CREATE OR REPLACE FUNCTION public.tg_build_log_comments_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF tg_op = 'INSERT' THEN UPDATE public.build_logs SET comment_count = comment_count + 1 WHERE id = NEW.build_log_id;
  ELSIF tg_op = 'DELETE' THEN UPDATE public.build_logs SET comment_count = greatest(comment_count - 1, 0) WHERE id = OLD.build_log_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS build_log_comments_count_trg ON public.build_log_comments;
CREATE TRIGGER build_log_comments_count_trg AFTER INSERT OR DELETE ON public.build_log_comments FOR EACH ROW EXECUTE FUNCTION public.tg_build_log_comments_count();

-- ============ BUILD LOG COMMENT LIKES ============
CREATE TABLE IF NOT EXISTS public.build_log_comment_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES public.build_log_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);
ALTER TABLE public.build_log_comment_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "build_log_comment_likes_select_all" ON public.build_log_comment_likes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "build_log_comment_likes_insert_own" ON public.build_log_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "build_log_comment_likes_delete_own" ON public.build_log_comment_likes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Build log comment likes trigger
CREATE OR REPLACE FUNCTION public.tg_build_log_comment_likes_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF tg_op = 'INSERT' THEN UPDATE public.build_log_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF tg_op = 'DELETE' THEN UPDATE public.build_log_comments SET like_count = greatest(like_count - 1, 0) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS build_log_comment_likes_count_trg ON public.build_log_comment_likes;
CREATE TRIGGER build_log_comment_likes_count_trg AFTER INSERT OR DELETE ON public.build_log_comment_likes FOR EACH ROW EXECUTE FUNCTION public.tg_build_log_comment_likes_count();

-- ============ NOTIFICATIONS FOR BUILD LOGS ============
-- Notify on build log like
CREATE OR REPLACE FUNCTION public.tg_notify_build_log_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE log_owner uuid;
BEGIN
  SELECT user_id INTO log_owner FROM public.build_logs WHERE id = NEW.build_log_id;
  IF log_owner IS NOT NULL AND log_owner <> NEW.user_id THEN
    INSERT INTO public.notifications(user_id, actor_id, type, entity_id, entity_type)
    VALUES (log_owner, NEW.user_id, 'like', NEW.build_log_id, 'build_log');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS build_log_likes_notify ON public.build_log_likes;
CREATE TRIGGER build_log_likes_notify AFTER INSERT ON public.build_log_likes FOR EACH ROW EXECUTE FUNCTION public.tg_notify_build_log_like();

-- Notify on build log comment
CREATE OR REPLACE FUNCTION public.tg_notify_build_log_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE log_owner uuid;
BEGIN
  SELECT user_id INTO log_owner FROM public.build_logs WHERE id = NEW.build_log_id;
  IF log_owner IS NOT NULL AND log_owner <> NEW.user_id THEN
    INSERT INTO public.notifications(user_id, actor_id, type, entity_id, entity_type, body)
    VALUES (log_owner, NEW.user_id, 'comment', NEW.build_log_id, 'build_log', left(NEW.body, 140));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS build_log_comments_notify ON public.build_log_comments;
CREATE TRIGGER build_log_comments_notify AFTER INSERT ON public.build_log_comments FOR EACH ROW EXECUTE FUNCTION public.tg_notify_build_log_comment();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.build_log_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.build_log_likes;
