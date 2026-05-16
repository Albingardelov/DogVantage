-- Migration 007: Finish multi-dog migration for session_logs + custom_exercises
-- Issue #48: previously these tables were keyed only by user_id, which caused
-- two dogs of the same breed to share data and the AI to receive the wrong
-- dog's recent performance when generating week plans.

-- 1. Clean up orphan test data (rows with null user_id, pre-multi-dog migration)
delete from public.session_logs where user_id is null;

-- 2. Backfill session_logs.dog_id from the user's first dog (oldest by created_at)
update public.session_logs sl
set dog_id = (
  select dp.id from public.dog_profiles dp
  where dp.user_id = sl.user_id
  order by dp.created_at asc
  limit 1
)
where sl.dog_id is null;

-- 3. Enforce NOT NULL on session_logs.dog_id
alter table public.session_logs
  alter column dog_id set not null;

-- 4. Add dog_id to custom_exercises (was empty, no backfill needed)
alter table public.custom_exercises
  add column dog_id uuid not null references public.dog_profiles(id) on delete cascade;

-- 5. Indexes for the new query patterns
create index if not exists idx_session_logs_dog_id_week
  on public.session_logs(dog_id, week_number);
create index if not exists idx_session_logs_dog_id_created
  on public.session_logs(dog_id, created_at desc);
create index if not exists idx_custom_exercises_dog_id_active
  on public.custom_exercises(dog_id, active);

-- 6. Tighten RLS — defense in depth: also verify dog ownership, not just user_id
drop policy if exists "Users manage their own logs" on public.session_logs;
create policy "Users manage their own logs"
  on public.session_logs
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = session_logs.dog_id and dp.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = session_logs.dog_id and dp.user_id = auth.uid()
    )
  );

drop policy if exists "Users manage own custom exercises" on public.custom_exercises;
create policy "Users manage own custom exercises"
  on public.custom_exercises
  for all
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = custom_exercises.dog_id and dp.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = custom_exercises.dog_id and dp.user_id = auth.uid()
    )
  );
