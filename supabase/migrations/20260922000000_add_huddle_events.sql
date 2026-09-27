-- ============================================================================
-- HUDDLE — offline events for OpenBuilder
--
-- Adds: role-based permissions, events + media + guests + registrations,
-- event group chats (reusing the existing chats / chat_participants /
-- messages architecture), direct-message bootstrap RPC, notifications and
-- storage policies for organizer-owned event assets.
--
-- Safe to run more than once (IF NOT EXISTS / OR REPLACE / exception guards).
-- Run in the Supabase SQL editor or via `supabase db push`.
-- ============================================================================

-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('user', 'huddle_organizer', 'huddle_admin', 'openbuilder_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.event_status AS ENUM ('draft', 'published', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.event_registration_status AS ENUM ('registered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_registered';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'event_update';

-- ============ ROLES ============
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helpers so policies never recurse into RLS-protected tables.
CREATE OR REPLACE FUNCTION public.has_role(check_user_id uuid, check_role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = check_user_id AND ur.role = check_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_huddle_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'huddle_admin') OR public.has_role(auth.uid(), 'openbuilder_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_huddle_organizer()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.has_role(auth.uid(), 'huddle_organizer') OR public.is_huddle_admin()
  );
$$;

DO $$ BEGIN
  CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid() OR public.is_huddle_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "user_roles_insert_admin" ON public.user_roles
    FOR INSERT WITH CHECK (public.is_huddle_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "user_roles_delete_admin" ON public.user_roles
    FOR DELETE USING (public.is_huddle_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ EXTEND CHATS FOR GROUP CONVERSATIONS ============
-- Existing chats are 1:1 DMs. Event group chats reuse the same tables with
-- kind = 'event' so the Messages page, realtime and RLS keep working.
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'direct';
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS event_id uuid;

DO $$ BEGIN
  ALTER TABLE public.chats ADD CONSTRAINT chats_kind_check CHECK (kind IN ('direct', 'event'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ EVENTS ============
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  tagline text,
  description text,
  cover_image_url text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  registration_deadline timestamptz,
  registration_enabled boolean NOT NULL DEFAULT true,
  capacity int CHECK (capacity IS NULL OR capacity > 0),
  venue_name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text,
  country text NOT NULL DEFAULT 'India',
  latitude double precision,
  longitude double precision,
  maps_url text,
  status public.event_status NOT NULL DEFAULT 'draft',
  registration_count int NOT NULL DEFAULT 0,
  chat_id uuid REFERENCES public.chats(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS events_starts_idx ON public.events(starts_at);
CREATE INDEX IF NOT EXISTS events_status_idx ON public.events(status, starts_at);
CREATE INDEX IF NOT EXISTS events_organizer_idx ON public.events(organizer_id);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  ALTER TABLE public.chats
    ADD CONSTRAINT chats_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.can_manage_event(check_event_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    public.is_huddle_admin()
    OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = check_event_id AND e.organizer_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_event(check_event_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = check_event_id
      AND (e.status <> 'draft' OR public.can_manage_event(e.id))
  );
$$;

-- Policies on `events` itself must reference the row's own columns (not a
-- lookup through can_manage_event): `INSERT ... RETURNING` on a draft evaluates
-- the SELECT policy before the new row is visible to a subquery, which would
-- otherwise reject the organizer's own insert.
DROP POLICY IF EXISTS "events_select_visible" ON public.events;
CREATE POLICY "events_select_visible" ON public.events
  FOR SELECT USING (status <> 'draft' OR organizer_id = auth.uid() OR public.is_huddle_admin());

DROP POLICY IF EXISTS "events_insert_organizer" ON public.events;
CREATE POLICY "events_insert_organizer" ON public.events
  FOR INSERT WITH CHECK (public.is_huddle_organizer() AND organizer_id = auth.uid());

DROP POLICY IF EXISTS "events_update_manager" ON public.events;
CREATE POLICY "events_update_manager" ON public.events
  FOR UPDATE
  USING (organizer_id = auth.uid() OR public.is_huddle_admin())
  WITH CHECK (organizer_id = auth.uid() OR public.is_huddle_admin());

DROP POLICY IF EXISTS "events_delete_manager" ON public.events;
CREATE POLICY "events_delete_manager" ON public.events
  FOR DELETE USING (organizer_id = auth.uid() OR public.is_huddle_admin());

DROP TRIGGER IF EXISTS events_updated ON public.events;
CREATE TRIGGER events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ EVENT IMAGES ============
CREATE TABLE IF NOT EXISTS public.event_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_images_event_idx ON public.event_images(event_id, sort_order);
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "event_images_select_visible" ON public.event_images FOR SELECT USING (public.can_view_event(event_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "event_images_write_manager" ON public.event_images FOR ALL
    USING (public.can_manage_event(event_id)) WITH CHECK (public.can_manage_event(event_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ EVENT GUESTS (mentors / speakers / chief guests) ============
CREATE TABLE IF NOT EXISTS public.event_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text,
  designation text,
  organization text,
  role text NOT NULL DEFAULT 'guest',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_guests_event_idx ON public.event_guests(event_id, sort_order);
ALTER TABLE public.event_guests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "event_guests_select_visible" ON public.event_guests FOR SELECT USING (public.can_view_event(event_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "event_guests_write_manager" ON public.event_guests FOR ALL
    USING (public.can_manage_event(event_id)) WITH CHECK (public.can_manage_event(event_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ EVENT REGISTRATIONS ============
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.event_registration_status NOT NULL DEFAULT 'registered',
  registered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS event_registrations_event_idx ON public.event_registrations(event_id, status);
CREATE INDEX IF NOT EXISTS event_registrations_user_idx ON public.event_registrations(user_id, status);
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Attendee lists of visible events are public (avatars / names). Cancelled
-- registrations are visible only to the user themselves and event managers.
DO $$ BEGIN
  CREATE POLICY "event_registrations_select" ON public.event_registrations FOR SELECT USING (
    user_id = auth.uid()
    OR public.can_manage_event(event_id)
    OR (status = 'registered' AND public.can_view_event(event_id))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Writes happen through the RPCs below (they enforce deadline / capacity and
-- keep group-chat membership in sync). Managers may update rows directly.
DO $$ BEGIN
  CREATE POLICY "event_registrations_update_manager" ON public.event_registrations FOR UPDATE
    USING (public.can_manage_event(event_id)) WITH CHECK (public.can_manage_event(event_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS event_registrations_updated ON public.event_registrations;
CREATE TRIGGER event_registrations_updated BEFORE UPDATE ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Keep events.registration_count in sync.
CREATE OR REPLACE FUNCTION public.tg_event_registration_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN v_event := OLD.event_id; ELSE v_event := NEW.event_id; END IF;
  UPDATE public.events
  SET registration_count = (
    SELECT count(*) FROM public.event_registrations r WHERE r.event_id = v_event AND r.status = 'registered'
  )
  WHERE id = v_event;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS event_registration_count_trg ON public.event_registrations;
CREATE TRIGGER event_registration_count_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.tg_event_registration_count();

-- ============ EVENT GROUP CHAT ============
-- Every event gets one group chat. The organizer is always a member;
-- attendees are added / removed by the registration RPCs.
CREATE OR REPLACE FUNCTION public.ensure_event_chat(p_event_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_chat uuid;
  v_title text;
  v_org uuid;
BEGIN
  SELECT e.chat_id, e.title, e.organizer_id INTO v_chat, v_title, v_org FROM public.events e WHERE e.id = p_event_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'event_not_found'; END IF;

  IF v_chat IS NULL THEN
    SELECT c.id INTO v_chat FROM public.chats c WHERE c.event_id = p_event_id AND c.kind = 'event' LIMIT 1;
  END IF;

  IF v_chat IS NULL THEN
    INSERT INTO public.chats (kind, title, event_id) VALUES ('event', v_title, p_event_id) RETURNING id INTO v_chat;
  ELSE
    UPDATE public.chats SET title = v_title WHERE id = v_chat AND (title IS DISTINCT FROM v_title);
  END IF;

  UPDATE public.events SET chat_id = v_chat WHERE id = p_event_id AND chat_id IS DISTINCT FROM v_chat;

  INSERT INTO public.chat_participants (chat_id, user_id) VALUES (v_chat, v_org) ON CONFLICT DO NOTHING;
  RETURN v_chat;
END $$;

CREATE OR REPLACE FUNCTION public.tg_event_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_event_chat(NEW.id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS event_after_insert_trg ON public.events;
CREATE TRIGGER event_after_insert_trg AFTER INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION public.tg_event_after_insert();

-- Sync chat title on rename, notify attendees on cancellation / reschedule / venue change.
CREATE OR REPLACE FUNCTION public.tg_event_after_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_body text;
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title AND NEW.chat_id IS NOT NULL THEN
    UPDATE public.chats SET title = NEW.title WHERE id = NEW.chat_id;
  END IF;

  IF NEW.organizer_id IS DISTINCT FROM OLD.organizer_id AND NEW.chat_id IS NOT NULL THEN
    INSERT INTO public.chat_participants (chat_id, user_id) VALUES (NEW.chat_id, NEW.organizer_id) ON CONFLICT DO NOTHING;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    v_body := '"' || NEW.title || '" has been cancelled.';
  ELSIF NEW.status = 'published' AND (
      NEW.starts_at IS DISTINCT FROM OLD.starts_at
      OR NEW.venue_name IS DISTINCT FROM OLD.venue_name
      OR NEW.address IS DISTINCT FROM OLD.address
  ) THEN
    v_body := '"' || NEW.title || '" was updated — check the new time or venue.';
  END IF;

  IF v_body IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type, body)
    SELECT r.user_id, NEW.organizer_id, 'event_update', NEW.id, 'event', v_body
    FROM public.event_registrations r
    WHERE r.event_id = NEW.id AND r.status = 'registered' AND r.user_id <> NEW.organizer_id;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS event_after_update_trg ON public.events;
CREATE TRIGGER event_after_update_trg AFTER UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.tg_event_after_update();

-- ============ REGISTRATION RPCs ============
CREATE OR REPLACE FUNCTION public.register_for_event(p_event_id uuid)
RETURNS public.event_registrations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_event public.events%ROWTYPE;
  v_reg public.event_registrations%ROWTYPE;
  v_chat uuid;
  v_count int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF v_event.id IS NULL THEN RAISE EXCEPTION 'event_not_found'; END IF;
  IF v_event.status <> 'published' THEN RAISE EXCEPTION 'event_not_open'; END IF;
  IF NOT v_event.registration_enabled THEN RAISE EXCEPTION 'registration_disabled'; END IF;
  IF now() >= COALESCE(v_event.registration_deadline, v_event.starts_at) THEN RAISE EXCEPTION 'registration_closed'; END IF;
  IF now() >= v_event.ends_at THEN RAISE EXCEPTION 'event_completed'; END IF;

  SELECT * INTO v_reg FROM public.event_registrations WHERE event_id = p_event_id AND user_id = v_uid;
  IF v_reg.id IS NOT NULL AND v_reg.status = 'registered' THEN
    RAISE EXCEPTION 'already_registered';
  END IF;

  IF v_event.capacity IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.event_registrations WHERE event_id = p_event_id AND status = 'registered';
    IF v_count >= v_event.capacity THEN RAISE EXCEPTION 'event_full'; END IF;
  END IF;

  IF v_reg.id IS NULL THEN
    INSERT INTO public.event_registrations (event_id, user_id, status)
    VALUES (p_event_id, v_uid, 'registered')
    RETURNING * INTO v_reg;
  ELSE
    UPDATE public.event_registrations SET status = 'registered', registered_at = now()
    WHERE id = v_reg.id RETURNING * INTO v_reg;
  END IF;

  v_chat := public.ensure_event_chat(p_event_id);
  INSERT INTO public.chat_participants (chat_id, user_id) VALUES (v_chat, v_uid) ON CONFLICT DO NOTHING;

  INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type, body)
  VALUES (v_uid, v_event.organizer_id, 'event_registered', p_event_id, 'event',
          'You registered for "' || v_event.title || '". You''ve been added to the event chat.');

  RETURN v_reg;
END $$;

CREATE OR REPLACE FUNCTION public.cancel_event_registration(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_chat uuid;
  v_org uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE public.event_registrations SET status = 'cancelled'
  WHERE event_id = p_event_id AND user_id = v_uid AND status = 'registered';

  SELECT e.chat_id, e.organizer_id INTO v_chat, v_org FROM public.events e WHERE e.id = p_event_id;
  -- Leaving the event removes access to the private group chat (organizer always stays).
  IF v_chat IS NOT NULL AND v_uid <> v_org THEN
    DELETE FROM public.chat_participants WHERE chat_id = v_chat AND user_id = v_uid;
  END IF;
END $$;

-- ============ DIRECT MESSAGES FROM PROFILES ============
-- DMs previously only started from an accepted collab request. Attendees can
-- now message each other directly; reuses the 1-chat-per-pair unique index.
CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_low uuid;
  v_high uuid;
  v_chat uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF other_user_id IS NULL OR other_user_id = v_uid THEN RAISE EXCEPTION 'invalid_target'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = other_user_id) THEN RAISE EXCEPTION 'user_not_found'; END IF;

  v_low := LEAST(v_uid, other_user_id);
  v_high := GREATEST(v_uid, other_user_id);

  SELECT c.id INTO v_chat FROM public.chats c
  WHERE c.user_low = v_low AND c.user_high = v_high LIMIT 1;

  IF v_chat IS NULL THEN
    INSERT INTO public.chats (kind, user_low, user_high) VALUES ('direct', v_low, v_high) RETURNING id INTO v_chat;
  END IF;

  INSERT INTO public.chat_participants (chat_id, user_id) VALUES (v_chat, v_uid) ON CONFLICT DO NOTHING;
  INSERT INTO public.chat_participants (chat_id, user_id) VALUES (v_chat, other_user_id) ON CONFLICT DO NOTHING;

  RETURN v_chat;
END $$;

-- ============ GROUP CHAT NOTIFICATIONS ============
-- One unread "new message" notification per member per event chat (no spam).
CREATE OR REPLACE FUNCTION public.tg_notify_event_chat_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_kind text; v_title text;
BEGIN
  SELECT c.kind, c.title INTO v_kind, v_title FROM public.chats c WHERE c.id = NEW.chat_id;
  IF v_kind <> 'event' THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type, body)
  SELECT cp.user_id, NEW.sender_id, 'chat_message', NEW.chat_id, 'chat',
         'New message in "' || COALESCE(v_title, 'event chat') || '"'
  FROM public.chat_participants cp
  WHERE cp.chat_id = NEW.chat_id
    AND cp.user_id <> NEW.sender_id
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = cp.user_id AND n.type = 'chat_message' AND n.entity_id = NEW.chat_id AND n.read = false
    );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS notify_event_chat_message_trg ON public.messages;
CREATE TRIGGER notify_event_chat_message_trg AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.tg_notify_event_chat_message();

-- ============ STORAGE ============
-- Event assets live in the existing public `media` bucket under
--   events/{event_id}/cover|gallery|guests/{uuid}.{ext}
-- Only Huddle organizers/admins may write under the events/ prefix.
DO $$ BEGIN
  CREATE POLICY "media_upload_events_organizer" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'media' AND (storage.foldername(name))[1] = 'events' AND public.is_huddle_organizer()
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "media_update_events_organizer" ON storage.objects FOR UPDATE USING (
    bucket_id = 'media' AND (storage.foldername(name))[1] = 'events' AND public.is_huddle_organizer()
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "media_delete_events_organizer" ON storage.objects FOR DELETE USING (
    bucket_id = 'media' AND (storage.foldername(name))[1] = 'events' AND public.is_huddle_organizer()
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ REALTIME ============
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ GRANTS ============
GRANT EXECUTE ON FUNCTION public.register_for_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_event_registration(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_chat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_huddle_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_huddle_organizer() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_event(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_view_event(uuid) TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_event_chat(uuid) FROM PUBLIC, anon, authenticated;

-- ============ BOOTSTRAP ============
-- Grant the first Huddle admin manually (replace the username), e.g.:
--   INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'huddle_admin' FROM public.profiles WHERE username = 'your_username'
--   ON CONFLICT DO NOTHING;
-- Admins can then grant `huddle_organizer` to others from /huddle/manage.
