-- supabase/migrations/002_custom_exercises.sql
create table if not exists custom_exercises (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  label       text not null,
  prompt      text not null,
  spec        jsonb not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, exercise_id)
);

alter table custom_exercises enable row level security;

create policy "Users manage own custom exercises"
  on custom_exercises
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
