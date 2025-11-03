-- supabase/migrations/001_init_tables.sql
-- Full DB schema based on export from Supabase
-- Use: supabase db reset

-- ========================
-- EXTENSIONS
-- ========================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ========================
-- TABLES
-- ========================

create table public.chat_members (
  chat_id uuid not null,
  user_id uuid not null,
  joined_at timestamp with time zone default CURRENT_TIMESTAMP,
  primary key (chat_id, user_id)
);

create table public.chats (
  id uuid not null default gen_random_uuid(),
  name text,
  is_group boolean not null default false,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  created_by uuid,
  primary key (id)
);

create table public.comment_reactions (
  id uuid not null default uuid_generate_v4(),
  comment_id uuid not null,
  user_id uuid not null,
  reaction_type text not null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  primary key (id)
);

create table public.comments (
  id uuid not null default uuid_generate_v4(),
  post_id uuid not null,
  user_id uuid not null,
  content text not null,
  created_at timestamp without time zone default CURRENT_TIMESTAMP,
  parent_comment_id uuid,
  primary key (id)
);

create table public.communities (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  cover_image text,
  privacy text,
  creator_id uuid,
  created_at timestamp without time zone default CURRENT_TIMESTAMP,
  rules text,
  primary key (id)
);

create table public.community_complaints (
  id uuid not null default gen_random_uuid(),
  community_id uuid,
  user_id uuid,
  content_id uuid,
  reason text not null,
  status text,
  created_at timestamp without time zone default CURRENT_TIMESTAMP,
  primary key (id)
);

create table public.community_event_participants (
  id uuid not null default gen_random_uuid(),
  event_id uuid not null,
  user_id uuid not null,
  joined_at timestamp without time zone default CURRENT_TIMESTAMP,
  primary key (id)
);

create table public.community_events (
  id uuid not null default gen_random_uuid(),
  community_id uuid,
  title text not null,
  description text,
  event_date timestamp without time zone,
  location text,
  created_at timestamp without time zone default CURRENT_TIMESTAMP,
  creator_id uuid,
  primary key (id)
);

create table public.community_members (
  id uuid not null default gen_random_uuid(),
  community_id uuid,
  user_id uuid,
  role text,
  joined_at timestamp without time zone default CURRENT_TIMESTAMP,
  status text,
  primary key (id)
);

create table public.community_posts (
  id uuid not null default gen_random_uuid(),
  community_id uuid,
  user_id uuid,
  content text not null,
  media text[], -- ARRAY
  created_at timestamp without time zone default CURRENT_TIMESTAMP,
  likes integer default 0,
  shares integer default 0,
  primary key (id)
);

create table public.complaints (
  id uuid not null default uuid_generate_v4(),
  user_id uuid,
  content text not null,
  created_at timestamp without time zone default CURRENT_TIMESTAMP,
  primary key (id)
);

create table public.follows (
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamp without time zone default CURRENT_TIMESTAMP,
  primary key (follower_id, following_id)
);

create table public.freedom_ratings (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  country_code text,
  speech_freedom integer,
  economic_freedom integer,
  political_freedom integer,
  human_rights_freedom integer,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  primary key (id)
);

create table public.messages (
  id uuid not null default gen_random_uuid(),
  chat_id uuid,
  user_id uuid,
  content text not null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  file_url text,
  updated_at timestamp with time zone,
  primary key (id)
);

create table public.notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  sender_id uuid,
  type text not null,
  post_id uuid,
  comment_id uuid,
  community_id uuid,
  chat_id uuid,
  message text,
  is_read boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  service_id uuid,
  primary key (id)
);

create table public.post_hashtags (
  id uuid not null default uuid_generate_v4(),
  post_id uuid,
  tag text not null,
  created_at timestamp with time zone default now(),
  primary key (id)
);

create table public.posts (
  id uuid not null default uuid_generate_v4(),
  user_id uuid,
  content text not null,
  created_at timestamp without time zone default CURRENT_TIMESTAMP,
  media_url text,
  media_type text,
  country_code text,
  original_post_id uuid,
  primary key (id)
);

create table public.reactions (
  id uuid not null default uuid_generate_v4(),
  post_id uuid not null,
  user_id uuid not null,
  reaction_type text not null,
  created_at timestamp without time zone default CURRENT_TIMESTAMP,
  primary key (id)
);

create table public.service_comments (
  id uuid not null default gen_random_uuid(),
  service_id uuid,
  user_id uuid,
  content text not null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  primary key (id)
);

create table public.services (
  id uuid not null default uuid_generate_v4(),
  user_id uuid,
  service_type text not null,
  company_name text not null,
  phone text,
  address text,
  cost text,
  description text,
  country text not null,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone default CURRENT_TIMESTAMP,
  primary key (id)
);

create table public.typing_status (
  id uuid not null default gen_random_uuid(),
  chat_id uuid,
  user_id uuid,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  primary key (id)
);

create table public.users (
  id uuid not null default uuid_generate_v4(),
  username text not null,
  email text,
  phone text,
  country text,
  created_at timestamp without time zone default CURRENT_TIMESTAMP,
  profile_picture text,
  bio text,
  city text,
  status text,
  social_links jsonb default '{}'::jsonb,
  settings jsonb default '{}'::jsonb,
  primary key (id)
);

-- ========================
-- INDEXES
-- ========================

create unique index posts_pkey on public.posts using btree (id);
create unique index post_hashtags_pkey on public.post_hashtags using btree (id);
create unique index post_hashtags_post_id_tag_key on public.post_hashtags using btree (post_id, tag);
create unique index community_event_participants_pkey on public.community_event_participants using btree (id);
create unique index unique_event_user on public.community_event_participants using btree (event_id, user_id);
create unique index reactions_pkey on public.reactions using btree (id);
create unique index reactions_unique on public.reactions using btree (post_id, user_id, reaction_type);
create unique index communities_pkey on public.communities using btree (id);
create unique index comments_pkey on public.comments using btree (id);
create index idx_comments_parent_comment_id on public.comments using btree (parent_comment_id);
create unique index chat_members_pkey on public.chat_members using btree (chat_id, user_id);
create unique index community_members_pkey on public.community_members using btree (id);
create unique index unique_community_member on public.community_members using btree (community_id, user_id);
create unique index messages_pkey on public.messages using btree (id);
create unique index comment_reactions_pkey on public.comment_reactions using btree (id);
create index idx_comment_reactions_comment_id on public.comment_reactions using btree (comment_id);
create index idx_comment_reactions_user_id on public.comment_reactions using btree (user_id);
create unique index chats_pkey on public.chats using btree (id);
create unique index community_posts_pkey on public.community_posts using btree (id);
create unique index complaints_pkey on public.complaints using btree (id);
create unique index freedom_ratings_pkey on public.freedom_ratings using btree (id);
create unique index freedom_ratings_user_id_country_code_key on public.freedom_ratings using btree (user_id, country_code);
create unique index community_events_pkey on public.community_events using btree (id);
create unique index users_pkey on public.users using btree (id);
create unique index users_username_key on public.users using btree (username);
create unique index users_email_key on public.users using btree (email);
create unique index users_phone_key on public.users using btree (phone);
create unique index community_complaints_pkey on public.community_complaints using btree (id);
create unique index notifications_pkey on public.notifications using btree (id);
create index notifications_user_id_idx on public.notifications using btree (user_id);
create index notifications_sender_id_idx on public.notifications using btree (sender_id);
create index notifications_is_read_idx on public.notifications using btree (is_read);
create index notifications_created_at_idx on public.notifications using btree (created_at DESC);
create index notifications_type_idx on public.notifications using btree (type);
create unique index services_pkey on public.services using btree (id);
create unique index service_comments_pkey on public.service_comments using btree (id);
create unique index typing_status_pkey on public.typing_status using btree (id);
create unique index follows_pkey on public.follows using btree (follower_id, following_id);

-- ========================
-- RLS (Row Level Security)
-- ========================

alter table public.posts enable row level security;
alter table public.reactions enable row level security;
alter table public.follows enable row level security;
alter table public.comments enable row level security;
alter table public.complaints enable row level security;
alter table public.post_hashtags enable row level security;
alter table public.users enable row level security;
alter table public.freedom_ratings enable row level security;
alter table public.services enable row level security;
alter table public.chats enable row level security;
alter table public.chat_members enable row level security;
alter table public.messages enable row level security;

-- RLS Policies
create policy "Allow authenticated users to insert posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Allow public read access to posts" on public.posts for select using (true);
create policy "Allow authenticated users to update own posts" on public.posts for update using (auth.uid() = user_id);

create policy "Allow authenticated users to insert reactions" on public.reactions for insert with check (auth.uid() = user_id);
create policy "Allow public read access to reactions" on public.reactions for select using (true);

create policy "Allow authenticated users to manage follows" on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

create policy "Allow authenticated users to insert comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Allow public read access to comments" on public.comments for select using (true);

create policy "Allow authenticated users to insert complaints" on public.complaints for insert with check (auth.uid() = user_id);
create policy "Allow admin read access to complaints" on public.complaints for select using (auth.role() = 'service_role');

create policy "Allow read for all" on public.post_hashtags for select using (true);
create policy "Allow insert for authenticated" on public.post_hashtags for insert with check (auth.role() = 'authenticated');
create policy "Allow delete for authenticated" on public.post_hashtags for delete using (
  auth.uid() = (select user_id from public.posts where id = post_hashtags.post_id)
);

create policy "Allow read for all" on public.reactions for select using (true);
create policy "Allow insert for authenticated" on public.reactions for insert with check (auth.role() = 'authenticated');
create policy "Allow update for own reactions" on public.reactions for update using (auth.uid() = user_id);
create policy "Allow delete for own reactions" on public.reactions for delete using (auth.uid() = user_id);

create policy "Allow read for all" on public.posts for select using (true);
create policy "Allow insert for authenticated" on public.posts for insert with check (auth.role() = 'authenticated');
create policy "Allow update for own posts" on public.posts for update using (auth.uid() = user_id);
create policy "Allow delete for own posts" on public.posts for delete using (auth.uid() = user_id);

create policy "Allow read for all" on public.comments for select using (true);
create policy "Allow insert for authenticated" on public.comments for insert with check (auth.role() = 'authenticated');
create policy "Allow delete for own comments" on public.comments for delete using (auth.uid() = user_id);
create policy "Allow update for own comments" on public.comments for update using (auth.uid() = user_id);

create policy "Allow read for authenticated users" on public.users for select using (true);
create policy "Allow update for own profile" on public.users for update using (auth.uid() = id);

create policy "Allow read follows for authenticated users" on public.follows for select using (true);
create policy "Allow read access to follows for authenticated users" on public.follows for select using ((follower_id = auth.uid()) OR (following_id = auth.uid()));

create policy "Authenticated users can read their freedom ratings" on public.freedom_ratings for select using ((auth.role() = 'authenticated') AND (user_id = auth.uid()));
create policy "Authenticated users can create/update their freedom ratings" on public.freedom_ratings for all using ((auth.role() = 'authenticated') AND (user_id = auth.uid())) with check (user_id = auth.uid());

create policy "Allow users to update their own services" on public.services for update using (auth.uid() = user_id);
create policy "Allow users to delete their own services" on public.services for delete using (auth.uid() = user_id);

create policy "Користувачі можуть бачити чати, в " on public.chats for select using (
  exists (select 1 from public.chat_members where chat_members.chat_id = chats.id and chat_members.user_id = auth.uid())
);
create policy "Користувачі можуть створювати чат" on public.chats for insert with check (true);
create policy "Користувачі можуть оновлювати сво" on public.chats for update using ((created_by = auth.uid()) AND (is_group = true));

create policy "Користувачі можуть додаватися до " on public.chat_members for insert with check (
  exists (select 1 from public.chats where chats.id = chat_members.chat_id and (chats.is_group = true or chats.created_by = auth.uid()))
);

create policy "Користувачі можуть бачити повідом" on public.messages for select using (
  exists (select 1 from public.chat_members where chat_members.chat_id = messages.chat_id and chat_members.user_id = auth.uid())
);
create policy "Користувачі можуть надсилати пові" on public.messages for insert with check (
  exists (select 1 from public.chat_members where chat_members.chat_id = messages.chat_id and chat_members.user_id = auth.uid())
);

create policy "Користувачі можуть бачити учасник" on public.chat_members for select using (
  exists (select 1 from public.chats where chats.id = chat_members.chat_id and exists (select 1 from public.chat_members cm where cm.chat_id = chats.id and cm.user_id = auth.uid()))
);

create policy "Users can view chats they are members of" on public.chats for select using (
  exists (select 1 from public.chat_members where chat_members.chat_id = chats.id and chat_members.user_id = auth.uid())
);
create policy "Users can insert chats" on public.chats for insert with check (created_by = auth.uid());

create policy "Users can insert chat members for their chats" on public.chat_members for insert with check (
  exists (select 1 from public.chats where chats.id = chat_members.chat_id and chats.created_by = auth.uid())
);

create policy "Users can view messages in their chats" on public.messages for select using (
  exists (select 1 from public.chat_members where chat_members.chat_id = messages.chat_id and chat_members.user_id = auth.uid())
);
create policy "Users can insert messages in their chats" on public.messages for insert with check (
  exists (select 1 from public.chat_members where chat_members.chat_id = messages.chat_id and chat_members.user_id = auth.uid())
);

create policy "Users can view public profiles" on public.users for select using (true);

create policy "Users can view follows" on public.follows for select using ((follower_id = auth.uid()) OR (following_id = auth.uid()));

create policy "Users can view their chat memberships" on public.chat_members for select using (user_id = auth.uid());

create policy "Allow authenticated users to read their follows" on public.follows for select using (follower_id = auth.uid());

create policy "Користувачі можуть бачити свої чати" on public.chat_members for select using (
  (auth.uid() = user_id) and exists (select 1 from public.chats where chats.id = chat_members.chat_id)
);

create policy "Користувачі можуть бачити свої чати" on public.chats for select using (
  exists (select 1 from public.chat_members where chat_members.chat_id = chats.id and chat_members.user_id = auth.uid())
);

create policy "Allow authenticated users to read services" on public.services for select using (auth.role() = 'authenticated');
create policy "Allow users to insert their own services" on public.services for insert with check (auth.uid() = user_id);

-- ========================
-- TRIGGERS
-- ========================

-- Function for updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for notifications
create trigger update_notifications_updated_at
  before update on public.notifications
  for each row execute function update_updated_at_column();

-- Notification triggers (functions must exist in DB)
-- create or replace function create_like_notification() returns trigger ... (add manually if needed)
-- create or replace function create_comment_notification() returns trigger ...
-- create or replace function create_follow_notification() returns trigger ...
-- create or replace function create_service_comment_notification() returns trigger ...

-- Example trigger (you need to create functions separately)
-- create trigger on_like_created after insert on public.reactions for each row execute function create_like_notification();

-- ========================
-- END
-- ========================