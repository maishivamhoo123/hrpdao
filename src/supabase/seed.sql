-- supabase/seed.sql
-- Seed data for local development
-- Runs automatically after migrations via: supabase db reset

-- Disable RLS temporarily for seeding
-- (Re-enabled automatically by Supabase CLI)
set session role = 'service_role';

-- =====================================
-- 1. Test Users (linked to Supabase Auth)
-- =====================================

-- Note: In real auth, users are created via Supabase Auth.
-- Here we simulate with direct inserts into `users` table.
-- Use Supabase Auth in app to create real users.

insert into public.users (
  id,
  username,
  email,
  phone,
  country,
  profile_picture,
  bio,
  city,
  status,
  social_links,
  settings
) values
  (
    '11111111-1111-1111-1111-111111111111',
    'alice_dev',
    'alice@example.com',
    '+380991234567',
    'Ukraine',
    'https://i.pravatar.cc/150?img=1',
    'Frontend developer & coffee lover',
    'Kyiv',
    'online',
    '{"twitter": "alice_dev", "github": "alice"}'::jsonb,
    '{"theme": "dark", "notifications": true}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'bob_engineer',
    'bob@example.com',
    '+380987654321',
    'Poland',
    'https://i.pravatar.cc/150?img=2',
    'Backend wizard. Python, Node.js, Docker.',
    'Warsaw',
    'away',
    '{"linkedin": "bob-engineer"}'::jsonb,
    '{"language": "en"}'::jsonb
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'carol_design',
    'carol@example.com',
    '+380935551234',
    'Germany',
    'https://i.pravatar.cc/150?img=3',
    'UI/UX designer. Figma master.',
    'Berlin',
    'offline',
    '{"dribbble": "carol"}'::jsonb,
    '{"theme": "light"}'::jsonb
  )
on conflict (id) do nothing;

-- =====================================
-- 2. Communities
-- =====================================

insert into public.communities (
  id,
  name,
  description,
  category,
  cover_image,
  privacy,
  creator_id,
  rules
) values
  (
    'c1111111-1111-1111-1111-111111111111',
    'React Developers',
    'Community for React, Vite, and frontend enthusiasts.',
    'Technology',
    'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800',
    'public',
    '11111111-1111-1111-1111-111111111111',
    'Be kind. No spam. Share knowledge.'
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    'Kyiv Tech Hub',
    'Local meetups, hackathons, and networking in Kyiv.',
    'Events',
    'https://images.unsplash.com/photo-1505373877841-8d25f771d0b7?w=800',
    'public',
    '22222222-2222-2222-2222-222222222222',
    'RSVP to events. Respect speakers.'
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'Design & Chill',
    'Relax, share designs, get feedback.',
    'Design',
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800',
    'private',
    '33333333-3333-3333-3333-333333333333',
    'Invite-only. No screenshots.'
  )
on conflict (id) do nothing;

-- Community Members
insert into public.community_members (
  community_id,
  user_id,
  role,
  status
) values
  ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'admin', 'active'),
  ('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'member', 'active'),
  ('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'admin', 'active'),
  ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'member', 'active'),
  ('c3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'admin', 'active')
on conflict (id) do nothing;

-- =====================================
-- 3. Posts
-- =====================================

insert into public.posts (
  id,
  user_id,
  content,
  media_url,
  media_type,
  country_code,
  community_id
) values
  (
    'p1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Just launched my new React + Vite + Supabase app! Check it out!',
    'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=600',
    'image',
    'UA',
    'c1111111-1111-1111-1111-111111111111'
  ),
  (
    'p2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'Who’s coming to the Kyiv Tech Meetup next week? Let’s connect!',
    null,
    null,
    'PL',
    'c2222222-2222-2222-2222-222222222222'
  ),
  (
    'p3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'New design system is live. Feedback welcome!',
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600',
    'image',
    'DE',
    null
  )
on conflict (id) do nothing;

-- Post Hashtags
insert into public.post_hashtags (
  post_id,
  tag
) values
  ('p1111111-1111-1111-1111-111111111111', 'react'),
  ('p1111111-1111-1111-1111-111111111111', 'vite'),
  ('p1111111-1111-1111-1111-111111111111', 'supabase'),
  ('p2222222-2222-2222-2222-222222222222', 'kyiv'),
  ('p2222222-2222-2222-2222-222222222222', 'meetup'),
  ('p3333333-3333-3333-3333-333333333333', 'design'),
  ('p3333333-3333-3333-3333-333333333333', 'figma')
on conflict (id) do nothing;

-- =====================================
-- 4. Comments & Reactions
-- =====================================

insert into public.comments (
  id,
  post_id,
  user_id,
  content,
  parent_comment_id
) values
  (
    'c1111111-1111-1111-1111-111111111111',
    'p1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Looks awesome! How did you handle auth?',
    null
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    'p1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '@bob_engineer Using Supabase Auth + RLS. Super easy!',
    'c1111111-1111-1111-1111-111111111111'
  )
on conflict (id) do nothing;

insert into public.reactions (
  post_id,
  user_id,
  reaction_type
) values
  ('p1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'like'),
  ('p1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'heart'),
  ('p2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'like')
on conflict (id) do nothing;

-- =====================================
-- 5. Chats & Messages
-- =====================================

insert into public.chats (
  id,
  name,
  is_group,
  created_by
) values
  (
    'chat1111-1111-1111-1111-111111111111',
    'Alice & Bob',
    false,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'chat2222-2222-2222-2222-222222222222',
    'React Devs Group',
    true,
    '11111111-1111-1111-1111-111111111111'
  )
on conflict (id) do nothing;

insert into public.chat_members (
  chat_id,
  user_id
) values
  ('chat1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('chat1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
  ('chat2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
  ('chat2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),
  ('chat2222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')
on conflict (chat_id, user_id) do nothing;

insert into public.messages (
  id,
  chat_id,
  user_id,
  content,
  file_url
) values
  (
    'm1111111-1111-1111-1111-111111111111',
    'chat1111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Hey Bob, how''s the backend going?',
    null
  ),
  (
    'm2222222-2222-2222-2222-222222222222',
    'chat1111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Great! Just deployed to Vercel.',
    null
  ),
  (
    'm3333333-3333-3333-3333-333333333333',
    'chat2222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    'Anyone using Tailwind with React?',
    'https://images.unsplash.com/photo-1558655146-d09352e53e14?w=400'
  )
on conflict (id) do nothing;

-- =====================================
-- 6. Follows
-- =====================================

insert into public.follows (
  follower_id,
  following_id
) values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333')
on conflict (follower_id, following_id) do nothing;

-- =====================================
-- 7. Services
-- =====================================

insert into public.services (
  id,
  user_id,
  service_type,
  company_name,
  phone,
  address,
  cost,
  description,
  country
) values
  (
    's1111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'Consulting',
    'TechFlow Solutions',
    '+380991112233',
    'Kyiv, Ukraine',
    '150 USD/hour',
    'Full-stack development, DevOps, cloud architecture.',
    'Ukraine'
  ),
  (
    's2222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    'Design',
    'PixelCraft Studio',
    '+49123456789',
    'Berlin, Germany',
    '80 EUR/hour',
    'UI/UX design, branding, Figma prototypes.',
    'Germany'
  )
on conflict (id) do nothing;

-- =====================================
-- 8. Events
-- =====================================

insert into public.community_events (
  id,
  community_id,
  title,
  description,
  event_date,
  location,
  creator_id
) values
  (
    'e1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    'Kyiv React Meetup #5',
    'Talks about React 19, Server Components, and Vite.',
    '2025-04-15 18:00:00',
    'Unit.City, Kyiv',
    '22222222-2222-2222-2222-222222222222'
  )
on conflict (id) do nothing;

insert into public.community_event_participants (
  event_id,
  user_id
) values
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
on conflict (id) do nothing;

-- =====================================
-- 9. Freedom Ratings (example)
-- =====================================

insert into public.freedom_ratings (
  user_id,
  country_code,
  speech_freedom,
  economic_freedom,
  political_freedom,
  human_rights_freedom
) values
  ('11111111-1111-1111-1111-111111111111', 'UA', 8, 6, 7, 7),
  ('22222222-2222-2222-2222-222222222222', 'PL', 9, 8, 8, 9)
on conflict (id) do nothing;

-- =====================================
-- 10. Notifications (example)
-- =====================================

insert into public.notifications (
  id,
  user_id,
  sender_id,
  type,
  post_id,
  comment_id,
  message,
  is_read
) values
  (
    'n1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'comment',
    'p1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'Bob commented on your post',
    false
  )
on conflict (id) do nothing;

-- Re-enable RLS
reset role;