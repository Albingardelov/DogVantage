-- Migration 008: Per-user daily chat usage counter
-- Protects Groq free-tier quota by capping how many AI calls a single
-- user can make per day. Cache hits don't count — only actual AI calls.

create table public.chat_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  count integer not null default 0,
  primary key (user_id, date)
);

alter table public.chat_usage enable row level security;

-- No policies → only service_role can read/write. The API route runs
-- with admin credentials when incrementing, and reads the user's own
-- count via the same admin client (after verifying auth).
