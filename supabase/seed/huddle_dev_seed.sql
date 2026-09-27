-- ============================================================================
-- HUDDLE — DEVELOPER TEST SEED
--
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query)
-- AFTER applying supabase/migrations/20260922000000_add_huddle_events.sql.
--
-- What it does
--   1. Grants huddle_admin + huddle_organizer to the username you set below.
--   2. Deletes any previous "[DEV] …" events (so it is safe to re-run).
--   3. Creates 8 sample huddles covering every UI state:
--        upcoming / closing soon / live now / sold out / completed /
--        cancelled / draft / the 6-week offline finale (with guests).
--   4. Registers up to 8 other existing profiles so attendee lists, avatar
--      stacks, "builders in the huddle" and event group chats are populated.
--
-- Everything it creates is prefixed "[DEV]" — delete it any time with:
--   DELETE FROM public.events WHERE title LIKE '[DEV]%';
-- ============================================================================

DO $$
DECLARE
  v_username text := 'CHANGE_ME';   -- <<< your OpenBuilder username (profiles.username)

  v_org    uuid;
  v_others uuid[];
  v_u      uuid;
  e_kickoff uuid; e_hack uuid; e_live uuid; e_full uuid;
  e_done uuid; e_cancel uuid; e_draft uuid; e_finale uuid;
BEGIN
  SELECT id INTO v_org FROM public.profiles WHERE username = v_username;
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'No profile with username "%". Edit v_username at the top of this script.', v_username;
  END IF;

  -- 1) roles --------------------------------------------------------------
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_org, 'huddle_admin'), (v_org, 'huddle_organizer')
  ON CONFLICT DO NOTHING;

  -- 2) clean previous dev data ------------------------------------------
  DELETE FROM public.events WHERE title LIKE '[DEV]%';

  -- other builders to register (real profiles, excluding the organizer)
  SELECT COALESCE(array_agg(id), '{}') INTO v_others
  FROM (SELECT id FROM public.profiles WHERE id <> v_org LIMIT 8) s;

  -- 3) events ------------------------------------------------------------
  -- Upcoming, registration open, 10 days out
  INSERT INTO public.events (organizer_id, title, tagline, description, starts_at, ends_at, timezone, registration_deadline, capacity,
                             venue_name, address, city, state, country, status)
  VALUES (v_org, '[DEV] Season 1 Kickoff',
          'Week 1 of the 6-week sprint. Bring an idea, leave with a plan.',
          E'The opening session of Huddle Season 1.\n\nWe form teams, lock scopes, and set the weekly demo cadence. Online builders join on Google Meet; the campus crew meets in person.',
          now() + interval '10 days', now() + interval '10 days 4 hours', 'Asia/Kolkata', now() + interval '9 days', 60,
          'Scaler School of Technology', 'Electronic City Phase 1', 'Bengaluru', 'Karnataka', 'India', 'published')
  RETURNING id INTO e_kickoff;

  -- Closing soon: deadline in 24h, event in 3 days
  INSERT INTO public.events (organizer_id, title, tagline, description, starts_at, ends_at, timezone, registration_deadline, capacity,
                             venue_name, address, city, state, country, status)
  VALUES (v_org, '[DEV] Hack Night — Week 2',
          'Six hours. One feature. Ship it before midnight.',
          'Heads-down build session with mentors floating between tables. Registration closes 24h before doors open.',
          now() + interval '3 days', now() + interval '3 days 6 hours', 'Asia/Kolkata', now() + interval '1 day', 40,
          'Scaler School of Technology', 'Electronic City Phase 1', 'Bengaluru', 'Karnataka', 'India', 'published')
  RETURNING id INTO e_hack;

  -- Live right now
  INSERT INTO public.events (organizer_id, title, tagline, description, starts_at, ends_at, timezone, capacity,
                             venue_name, address, city, state, country, status)
  VALUES (v_org, '[DEV] Weekly Build Sync (LIVE)',
          'Happening now — share progress, unblock each other.',
          'The weekly online check-in. Every builder gets 3 minutes: what shipped, what broke, what is next.',
          now() - interval '1 hour', now() + interval '3 hours', 'Asia/Kolkata', 100,
          'Google Meet (online)', 'meet.google.com', 'Online', NULL, 'India', 'published')
  RETURNING id INTO e_live;

  -- Sold out: capacity 3, filled below
  INSERT INTO public.events (organizer_id, title, tagline, description, starts_at, ends_at, timezone, capacity,
                             venue_name, address, city, state, country, status)
  VALUES (v_org, '[DEV] Founder Office Hours (small room)',
          'Three seats. Deep feedback on your build.',
          'A tiny-room session so the "Sold out" state can be tested. Capacity is 3 and it is already full.',
          now() + interval '6 days', now() + interval '6 days 2 hours', 'Asia/Kolkata', 3,
          'Scaler School of Technology', 'Electronic City Phase 1', 'Bengaluru', 'Karnataka', 'India', 'published')
  RETURNING id INTO e_full;

  -- Completed last week
  INSERT INTO public.events (organizer_id, title, tagline, description, starts_at, ends_at, timezone, capacity,
                             venue_name, address, city, state, country, status)
  VALUES (v_org, '[DEV] Season 0 Retro (completed)',
          'What we learned from the pilot cohort.',
          'A past event so the completed state, past filter and "Thanks for building together" banner can be tested.',
          now() - interval '7 days', now() - interval '7 days' + interval '3 hours', 'Asia/Kolkata', 50,
          'Third Wave Coffee, Koramangala', '80 Feet Rd, Koramangala', 'Bengaluru', 'Karnataka', 'India', 'published')
  RETURNING id INTO e_done;

  -- Cancelled
  INSERT INTO public.events (organizer_id, title, tagline, description, starts_at, ends_at, timezone, capacity,
                             venue_name, address, city, state, country, status)
  VALUES (v_org, '[DEV] Design Workshop (cancelled)',
          'Cancelled — venue fell through.',
          'A cancelled event so the cancelled badge, greyscale cover and "Re-publish" organizer action can be tested.',
          now() + interval '5 days', now() + interval '5 days 3 hours', 'Asia/Kolkata', 30,
          'WeWork Galaxy', 'Residency Rd', 'Bengaluru', 'Karnataka', 'India', 'cancelled')
  RETURNING id INTO e_cancel;

  -- Draft (only organizer/admin can see it)
  INSERT INTO public.events (organizer_id, title, tagline, description, starts_at, ends_at, timezone, capacity,
                             venue_name, address, city, state, country, status)
  VALUES (v_org, '[DEV] Mumbai Meetup (draft)',
          'Not published yet.',
          'A draft so the draft banner, "Publish now" and manage-page filters can be tested. Regular users must NOT see this.',
          now() + interval '45 days', now() + interval '45 days 4 hours', 'Asia/Kolkata', 80,
          'TBD', 'TBD', 'Mumbai', 'Maharashtra', 'India', 'draft')
  RETURNING id INTO e_draft;

  -- The offline finale, 6 weeks out, with guests
  INSERT INTO public.events (organizer_id, title, tagline, description, starts_at, ends_at, timezone, registration_deadline, capacity,
                             venue_name, address, city, state, country, status)
  VALUES (v_org, '[DEV] Offline Finale — Bengaluru',
          'Six weeks of building ends here. Demo what you shipped.',
          E'The Season 1 finale. Every team presents, mentors give feedback, and the community picks favourites.\n\nDoors 10:00 · Demos 11:00 · Lunch · Awards 16:00.',
          now() + interval '42 days', now() + interval '42 days 8 hours', 'Asia/Kolkata', now() + interval '40 days', 150,
          'Scaler School of Technology', 'Electronic City Phase 1', 'Bengaluru', 'Karnataka', 'India', 'published')
  RETURNING id INTO e_finale;

  INSERT INTO public.event_guests (event_id, name, designation, organization, role, sort_order) VALUES
    (e_finale, 'Priya Nair',    'Founder',            'Scaler',          'chief_guest', 0),
    (e_finale, 'Arjun Mehta',   'Staff Engineer',     'Razorpay',        'mentor',      1),
    (e_finale, 'Sana Iqbal',    'Product Designer',   'Zomato',          'speaker',     2),
    (e_finale, 'Dev Kapoor',    'Angel Investor',     'Independent',     'judge',       3),
    (e_kickoff, 'Arjun Mehta',  'Staff Engineer',     'Razorpay',        'mentor',      0);

  -- 4) registrations -------------------------------------------------------
  -- (direct inserts: the trigger keeps registration_count in sync; chat
  --  membership is synced below the same way register_for_event() does it)
  FOREACH v_u IN ARRAY v_others[1:6] LOOP
    INSERT INTO public.event_registrations (event_id, user_id) VALUES (e_kickoff, v_u) ON CONFLICT DO NOTHING;
  END LOOP;
  FOREACH v_u IN ARRAY v_others[1:4] LOOP
    INSERT INTO public.event_registrations (event_id, user_id) VALUES (e_hack, v_u) ON CONFLICT DO NOTHING;
  END LOOP;
  FOREACH v_u IN ARRAY v_others[1:5] LOOP
    INSERT INTO public.event_registrations (event_id, user_id) VALUES (e_live, v_u) ON CONFLICT DO NOTHING;
  END LOOP;
  FOREACH v_u IN ARRAY v_others[1:3] LOOP
    INSERT INTO public.event_registrations (event_id, user_id) VALUES (e_full, v_u) ON CONFLICT DO NOTHING;
  END LOOP;
  FOREACH v_u IN ARRAY v_others[1:8] LOOP
    INSERT INTO public.event_registrations (event_id, user_id) VALUES (e_done, v_u) ON CONFLICT DO NOTHING;
  END LOOP;
  FOREACH v_u IN ARRAY v_others[1:7] LOOP
    INSERT INTO public.event_registrations (event_id, user_id) VALUES (e_finale, v_u) ON CONFLICT DO NOTHING;
  END LOOP;

  -- add registered builders to each event's group chat
  INSERT INTO public.chat_participants (chat_id, user_id)
  SELECT e.chat_id, r.user_id
  FROM public.event_registrations r
  JOIN public.events e ON e.id = r.event_id
  WHERE e.title LIKE '[DEV]%' AND e.chat_id IS NOT NULL AND r.status = 'registered'
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Huddle dev seed done. Organizer: % (%). Other builders registered: %.', v_username, v_org, array_length(v_others, 1);
END $$;

-- Quick check
SELECT title, status, registration_count, capacity, starts_at
FROM public.events WHERE title LIKE '[DEV]%' ORDER BY starts_at;
