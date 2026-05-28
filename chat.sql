


-- CHAT RLS RESET (NO RECURSION) + ALLOW ACCEPT FLOW
-- Run in Supabase SQL Editor

-- 1) Drop ALL policies for these tables (avoids "already exists" and mismatched names)
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('chats', 'chat_participants', 'messages', 'message_reactions', 'chat_collab_requests')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 2) Helper function (bypasses RLS; prevents recursion)
CREATE OR REPLACE FUNCTION public.check_chat_access(check_chat_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_participants cp
    WHERE cp.chat_id = check_chat_id
      AND cp.user_id = auth.uid()
  );
$$;

-- 3) Ensure RLS is enabled
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3a) Ensure 1 chat per user pair (merge chats across multiple collab accepts)
ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS user_low uuid;

ALTER TABLE public.chats
  ADD COLUMN IF NOT EXISTS user_high uuid;

CREATE UNIQUE INDEX IF NOT EXISTS chats_pair_unique_idx
  ON public.chats (user_low, user_high)
  WHERE user_low IS NOT NULL AND user_high IS NOT NULL;

-- 3b) Extend messages for attachments + replies
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to uuid;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_reply_to_fkey') THEN
    ALTER TABLE public.messages 
      ADD CONSTRAINT messages_reply_to_fkey 
      FOREIGN KEY (reply_to) REFERENCES public.messages(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_url text;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_type text;

CREATE INDEX IF NOT EXISTS messages_chat_created_idx ON public.messages(chat_id, created_at);
CREATE INDEX IF NOT EXISTS messages_reply_to_idx ON public.messages(reply_to);

-- 3c) Message reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- 3d) Track which collab requests the chat is connected to (for display/history)
CREATE TABLE IF NOT EXISTS public.chat_collab_requests (
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  collab_request_id uuid NOT NULL REFERENCES public.collab_requests(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, collab_request_id)
);
ALTER TABLE public.chat_collab_requests ENABLE ROW LEVEL SECURITY;

-- 4) CHATS policies
-- Allow authenticated users to create chats (Accept flow creates chat first)
CREATE POLICY "chats_insert_authed" ON public.chats
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow reading chats if:
-- - you're a participant OR
-- - you're the collab post owner OR
-- - you're the collab request sender
-- This allows `.insert(...).select()` to work before participants are inserted.
CREATE POLICY "chats_select_involved" ON public.chats
  FOR SELECT USING (
    public.check_chat_access(id)
    OR EXISTS (
      SELECT 1
      FROM public.collab_requests cr
      JOIN public.collab_posts cp ON cp.id = cr.post_id
      WHERE cr.id = public.chats.collab_request_id
        AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.collab_requests cr
      WHERE cr.id = public.chats.collab_request_id
        AND cr.sender_id = auth.uid()
    )
  );

-- 5) CHAT PARTICIPANTS policies
CREATE POLICY "cp_select_involved" ON public.chat_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.check_chat_access(chat_id)
  );

-- Allow inserting yourself, OR allow collab post owner to add the other participant (Accept flow)
CREATE POLICY "cp_insert_involved" ON public.chat_participants
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.chats ch
        JOIN public.collab_requests cr ON cr.id = ch.collab_request_id
        JOIN public.collab_posts cp ON cp.id = cr.post_id
        WHERE ch.id = public.chat_participants.chat_id
          AND cp.user_id = auth.uid()
      )
    )
  );

-- 6) MESSAGES policies
CREATE POLICY "messages_select_involved" ON public.messages
  FOR SELECT USING (public.check_chat_access(chat_id));

CREATE POLICY "messages_insert_involved" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND public.check_chat_access(chat_id)
  );

-- 6b) MESSAGE REACTIONS policies
CREATE POLICY "message_reactions_select_involved" ON public.message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.id = public.message_reactions.message_id
        AND public.check_chat_access(m.chat_id)
    )
  );

CREATE POLICY "message_reactions_insert_own" ON public.message_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.id = public.message_reactions.message_id
        AND public.check_chat_access(m.chat_id)
    )
  );

CREATE POLICY "message_reactions_update_own" ON public.message_reactions
  FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.id = public.message_reactions.message_id
        AND public.check_chat_access(m.chat_id)
    )
  );

CREATE POLICY "message_reactions_delete_own" ON public.message_reactions
  FOR DELETE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE m.id = public.message_reactions.message_id
        AND public.check_chat_access(m.chat_id)
    )
  );

-- 6c) CHAT COLLAB REQUESTS policies
CREATE POLICY "chat_collab_requests_select_involved" ON public.chat_collab_requests
  FOR SELECT USING (public.check_chat_access(chat_id));

-- 7) Accept flow RPC (bypasses RLS issues on INSERT by doing server-side writes)
CREATE OR REPLACE FUNCTION public.accept_collab_request(request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender uuid;
  v_post_id uuid;
  v_post_owner uuid;
  v_post_title text;
  v_chat_id uuid;
  v_low uuid;
  v_high uuid;
BEGIN
  SELECT cr.sender_id, cr.post_id INTO v_sender, v_post_id
  FROM public.collab_requests cr
  WHERE cr.id = request_id;

  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'collab_request_not_found';
  END IF;

  SELECT cp.user_id, cp.title INTO v_post_owner, v_post_title
  FROM public.collab_posts cp
  WHERE cp.id = v_post_id;

  IF v_post_owner IS NULL THEN
    RAISE EXCEPTION 'collab_post_not_found';
  END IF;

  IF v_post_owner <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  UPDATE public.collab_requests SET status = 'accepted' WHERE id = request_id;

  v_low := LEAST(v_post_owner, v_sender);
  v_high := GREATEST(v_post_owner, v_sender);

  SELECT c.id INTO v_chat_id
  FROM public.chats c
  WHERE c.user_low = v_low AND c.user_high = v_high
  LIMIT 1;

  IF v_chat_id IS NULL THEN
    INSERT INTO public.chats (collab_request_id, user_low, user_high)
    VALUES (request_id, v_low, v_high)
    RETURNING id INTO v_chat_id;
  ELSE
    UPDATE public.chats
    SET collab_request_id = request_id, updated_at = now()
    WHERE id = v_chat_id;
  END IF;

  INSERT INTO public.chat_participants (chat_id, user_id)
  VALUES (v_chat_id, v_post_owner)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.chat_participants (chat_id, user_id)
  VALUES (v_chat_id, v_sender)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.chat_collab_requests (chat_id, collab_request_id)
  VALUES (v_chat_id, request_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type, body)
  VALUES (
    v_sender,
    v_post_owner,
    'collab_accepted',
    v_post_id,
    'collab',
    'accepted your request for "' || COALESCE(v_post_title, 'collab') || '"'
  );

  RETURN v_chat_id;
END;
$$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
