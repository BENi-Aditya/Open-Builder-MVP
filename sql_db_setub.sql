-- ============ ENUMS ============
create type public.collab_status as enum ('not_looking','open_to_collab','seeking_cofounder','seeking_designer','seeking_developer','available_for_hackathons');
create type public.project_visibility as enum ('public','unlisted','private');
create type public.collab_request_status as enum ('pending','accepted','rejected');
create type public.notification_type as enum ('follow','like','comment','collab_request','collab_accepted','build_log');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  banner_url text,
  skills text[] default '{}',
  tech_stack text[] default '{}',
  links jsonb default '{}'::jsonb,
  location text,
  collab_status public.collab_status default 'not_looking',
  currently_building text,
  currently_learning text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ============ PROJECTS ============
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null,
  tagline text,
  description text,
  tech_stack text[] default '{}',
  category text,
  github_url text,
  demo_url text,
  cover_url text,
  visibility public.project_visibility not null default 'public',
  like_count int not null default 0,
  comment_count int not null default 0,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, slug)
);
create index projects_owner_idx on public.projects(owner_id);
create index projects_created_idx on public.projects(created_at desc);
alter table public.projects enable row level security;
create policy "projects_select_public" on public.projects for select using (visibility = 'public' or owner_id = auth.uid());
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = owner_id);
create policy "projects_update_own" on public.projects for update using (auth.uid() = owner_id);
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = owner_id);

-- ============ PROJECT MEDIA ============
create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  url text not null,
  media_type text not null default 'image',
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index project_media_project_idx on public.project_media(project_id);
alter table public.project_media enable row level security;
create policy "media_select_all" on public.project_media for select using (true);
create policy "media_insert_owner" on public.project_media for insert with check (
  exists(select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);
create policy "media_delete_owner" on public.project_media for delete using (
  exists(select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

-- ============ BUILD LOGS ============
create table public.build_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  image_url text,
  created_at timestamptz not null default now()
);
create index build_logs_user_idx on public.build_logs(user_id, created_at desc);
create index build_logs_project_idx on public.build_logs(project_id, created_at desc);
alter table public.build_logs enable row level security;
create policy "build_logs_select_all" on public.build_logs for select using (true);
create policy "build_logs_insert_own" on public.build_logs for insert with check (auth.uid() = user_id);
create policy "build_logs_update_own" on public.build_logs for update using (auth.uid() = user_id);
create policy "build_logs_delete_own" on public.build_logs for delete using (auth.uid() = user_id);

-- ============ COMMENTS ============
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_project_idx on public.comments(project_id, created_at desc);
alter table public.comments enable row level security;
create policy "comments_select_all" on public.comments for select using (true);
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_update_own" on public.comments for update using (auth.uid() = user_id);
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = user_id);

-- ============ LIKES ============
create table public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);
alter table public.likes enable row level security;
create policy "likes_select_all" on public.likes for select using (true);
create policy "likes_insert_own" on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.likes for delete using (auth.uid() = user_id);

-- ============ SAVES ============
create table public.saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);
alter table public.saves enable row level security;
create policy "saves_select_own" on public.saves for select using (auth.uid() = user_id);
create policy "saves_insert_own" on public.saves for insert with check (auth.uid() = user_id);
create policy "saves_delete_own" on public.saves for delete using (auth.uid() = user_id);

-- ============ FOLLOWS ============
create table public.follows (
  follower_id uuid primary key default gen_random_uuid(),
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (follower_id <> following_id)
);
alter table public.follows enable row level security;
create policy "follows_select_all" on public.follows for select using (true);
create policy "follows_insert_own" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on public.follows for delete using (auth.uid() = follower_id);

-- ============ COLLAB POSTS ============
create table public.collab_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text not null,
  role_needed text,
  tech_tags text[] default '{}',
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);
create index collab_posts_created_idx on public.collab_posts(created_at desc);
alter table public.collab_posts enable row level security;
create policy "collab_posts_select_all" on public.collab_posts for select using (true);
create policy "collab_posts_insert_own" on public.collab_posts for insert with check (auth.uid() = user_id);
create policy "collab_posts_update_own" on public.collab_posts for update using (auth.uid() = user_id);
create policy "collab_posts_delete_own" on public.collab_posts for delete using (auth.uid() = user_id);

-- ============ COLLAB REQUESTS ============
create table public.collab_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.collab_posts(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  status public.collab_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique(post_id, sender_id)
);
alter table public.collab_requests enable row level security;
create policy "collab_requests_select_involved" on public.collab_requests for select using (
  auth.uid() = sender_id or exists(select 1 from public.collab_posts p where p.id = post_id and p.user_id = auth.uid())
);
create policy "collab_requests_insert_own" on public.collab_requests for insert with check (auth.uid() = sender_id);
create policy "collab_requests_update_owner" on public.collab_requests for update using (
  exists(select 1 from public.collab_posts p where p.id = post_id and p.user_id = auth.uid())
);

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  entity_id uuid,
  entity_type text,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notif_user_idx on public.notifications(user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "notif_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notif_update_own" on public.notifications for update using (auth.uid() = user_id);
create policy "notif_insert_any" on public.notifications for insert with check (auth.uid() = actor_id or auth.uid() = user_id);

-- ============ TRIGGERS ============
-- updated_at helper
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_updated before update on public.profiles for each row execute function public.tg_set_updated_at();
create trigger projects_updated before update on public.projects for each row execute function public.tg_set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  counter int := 0;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1), 'builder'), '[^a-z0-9_]', '', 'g'));
  if length(base_username) < 3 then base_username := 'builder' || substr(new.id::text,1,6); end if;
  final_username := base_username;
  while exists(select 1 from public.profiles where username = final_username) loop
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;
  insert into public.profiles (id, username, display_name, avatar_url)
  values (new.id, final_username, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', final_username), new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- like / comment counters
create or replace function public.tg_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then update public.projects set like_count = like_count + 1 where id = new.project_id;
  elsif tg_op = 'DELETE' then update public.projects set like_count = greatest(like_count - 1, 0) where id = old.project_id;
  end if;
  return null;
end $$;
create trigger likes_count_trg after insert or delete on public.likes for each row execute function public.tg_likes_count();

create or replace function public.tg_comments_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then update public.projects set comment_count = comment_count + 1 where id = new.project_id;
  elsif tg_op = 'DELETE' then update public.projects set comment_count = greatest(comment_count - 1, 0) where id = old.project_id;
  end if;
  return null;
end $$;
create trigger comments_count_trg after insert or delete on public.comments for each row execute function public.tg_comments_count();

-- notification triggers
create or replace function public.tg_notify_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications(user_id, actor_id, type, entity_id, entity_type)
  values (new.following_id, new.follower_id, 'follow', new.follower_id, 'profile');
  return new;
end $$;
create trigger follows_notify after insert on public.follows for each row execute function public.tg_notify_follow();

create or replace function public.tg_notify_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select owner_id into owner from public.projects where id = new.project_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications(user_id, actor_id, type, entity_id, entity_type)
    values (owner, new.user_id, 'like', new.project_id, 'project');
  end if;
  return new;
end $$;
create trigger likes_notify after insert on public.likes for each row execute function public.tg_notify_like();

create or replace function public.tg_notify_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select owner_id into owner from public.projects where id = new.project_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications(user_id, actor_id, type, entity_id, entity_type, body)
    values (owner, new.user_id, 'comment', new.project_id, 'project', left(new.body,140));
  end if;
  return new;
end $$;
create trigger comments_notify after insert on public.comments for each row execute function public.tg_notify_comment();

create or replace function public.tg_notify_collab_req()
returns trigger language plpgsql security definer set search_path = public as $$
declare post_owner uuid;
begin
  select user_id into post_owner from public.collab_posts where id = new.post_id;
  if post_owner is not null and post_owner <> new.sender_id then
    insert into public.notifications(user_id, actor_id, type, entity_id, entity_type, body)
    values (post_owner, new.sender_id, 'collab_request', new.post_id, 'collab_post', left(new.message,140));
  end if;
  return new;
end $$;
create trigger collab_req_notify after insert on public.collab_requests for each row execute function public.tg_notify_collab_req();

-- ============ STORAGE ============
insert into storage.buckets(id, name, public) values ('media','media', true) on conflict do nothing;

create policy "media_read_public" on storage.objects for select using (bucket_id = 'media');
create policy "media_upload_authed" on storage.objects for insert with check (
  bucket_id = 'media' and auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "media_delete_own" on storage.objects for delete using (
  bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text
);

-- ============ REALTIME ============
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.likes;