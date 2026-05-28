
-- Add chat_message to notification_type
-- Note: In some environments, ALTER TYPE ... ADD VALUE cannot be executed in a transaction.
-- If this fails, you might need to run it outside a transaction.
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'chat_message';

-- ============ COMMENT LIKES ============
CREATE TABLE IF NOT EXISTS public.comment_likes (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "comment_likes_select_all" ON public.comment_likes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "comment_likes_insert_own" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "comment_likes_delete_own" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add like_count to comments
DO $$ BEGIN
  ALTER TABLE public.comments ADD COLUMN like_count int NOT NULL DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Comment likes trigger
CREATE OR REPLACE FUNCTION public.tg_comment_likes_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF tg_op = 'INSERT' THEN UPDATE public.comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
  ELSIF tg_op = 'DELETE' THEN UPDATE public.comments SET like_count = greatest(like_count - 1, 0) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS comment_likes_count_trg ON public.comment_likes;
CREATE TRIGGER comment_likes_count_trg AFTER INSERT OR DELETE ON public.comment_likes FOR EACH ROW EXECUTE FUNCTION public.tg_comment_likes_count();

-- ============ CHATS ============
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_request_id uuid REFERENCES public.collab_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "chats_select_involved" ON public.chats FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.chat_id = public.chats.id AND cp.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ CHAT PARTICIPANTS ============
CREATE TABLE IF NOT EXISTS public.chat_participants (
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "chat_participants_select_involved" ON public.chat_participants FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.chat_id = public.chat_participants.chat_id AND cp.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ MESSAGES ============
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "messages_select_involved" ON public.messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.chat_id = public.messages.chat_id AND cp.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "messages_insert_involved" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.chat_id = public.messages.chat_id AND cp.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update chats.updated_at on new message
CREATE OR REPLACE FUNCTION public.tg_update_chat_timestamp()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.chats SET updated_at = now() WHERE id = NEW.chat_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS update_chat_timestamp_trg ON public.messages;
CREATE TRIGGER update_chat_timestamp_trg AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.tg_update_chat_timestamp();
