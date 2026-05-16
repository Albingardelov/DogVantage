-- REFACTOR-3 scale optimizations:
-- 1) Merge breed+general chunk lookup into one RPC
-- 2) Wrap auth.uid() with (select auth.uid()) in dog-scoped RLS policies
-- 3) Add TTL cleanup infra for training_cache via pg_cron

create or replace function public.match_breed_and_general_chunks(
  match_breed text,
  query_embedding vector(3072),
  match_count int default 3
)
returns table (
  id uuid,
  content text,
  source text,
  source_url text,
  doc_version text,
  page_ref text,
  similarity float,
  breed text
)
language sql
stable
parallel safe
as $$
  select
    bc.id,
    bc.content,
    bc.source,
    bc.source_url,
    bc.doc_version,
    bc.page_ref,
    1 - (bc.embedding <=> query_embedding) as similarity,
    bc.breed
  from public.breed_chunks bc
  where bc.breed in (match_breed, 'general')
  order by bc.embedding <=> query_embedding
  limit match_count;
$$;

revoke all on function public.match_breed_and_general_chunks(text, vector, int) from public;
grant execute on function public.match_breed_and_general_chunks(text, vector, int) to authenticated, service_role;

-- session_logs
drop policy if exists "Users manage their own logs" on public.session_logs;
create policy "Users manage their own logs"
  on public.session_logs
  for all
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = session_logs.dog_id and dp.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = session_logs.dog_id and dp.user_id = (select auth.uid())
    )
  );

-- custom_exercises
drop policy if exists "Users manage own custom exercises" on public.custom_exercises;
create policy "Users manage own custom exercises"
  on public.custom_exercises
  for all
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = custom_exercises.dog_id and dp.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = custom_exercises.dog_id and dp.user_id = (select auth.uid())
    )
  );

-- weekly_focus
drop policy if exists "Users manage focus for their own dogs" on public.weekly_focus;
create policy "Users manage focus for their own dogs"
  on public.weekly_focus
  for all
  using (
    exists (
      select 1 from public.dog_profiles dp
      where dp.id = weekly_focus.dog_id
        and dp.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.dog_profiles dp
      where dp.id = weekly_focus.dog_id
        and dp.user_id = (select auth.uid())
    )
  );

-- heat_cycles
drop policy if exists "Users manage heat cycles for their own dogs" on public.heat_cycles;
create policy "Users manage heat cycles for their own dogs"
  on public.heat_cycles
  for all
  using (
    exists (
      select 1 from public.dog_profiles dp
      where dp.id = heat_cycles.dog_id
        and dp.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.dog_profiles dp
      where dp.id = heat_cycles.dog_id
        and dp.user_id = (select auth.uid())
    )
  );

-- daily_progress
alter table public.daily_progress enable row level security;
drop policy if exists "Users manage daily progress for their own dogs" on public.daily_progress;
create policy "Users manage daily progress for their own dogs"
  on public.daily_progress
  for all
  using (
    exists (
      select 1 from public.dog_profiles dp
      where dp.id = daily_progress.dog_id
        and dp.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.dog_profiles dp
      where dp.id = daily_progress.dog_id
        and dp.user_id = (select auth.uid())
    )
  );

-- daily_exercise_metrics
alter table public.daily_exercise_metrics enable row level security;
drop policy if exists "Users manage daily exercise metrics for their own dogs" on public.daily_exercise_metrics;
create policy "Users manage daily exercise metrics for their own dogs"
  on public.daily_exercise_metrics
  for all
  using (
    exists (
      select 1 from public.dog_profiles dp
      where dp.id = daily_exercise_metrics.dog_id
        and dp.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.dog_profiles dp
      where dp.id = daily_exercise_metrics.dog_id
        and dp.user_id = (select auth.uid())
    )
  );

-- training_cache
alter table public.training_cache enable row level security;
drop policy if exists "Users manage dog-scoped training cache" on public.training_cache;
create policy "Users manage dog-scoped training cache"
  on public.training_cache
  for all
  using (
    dog_id is null
    or exists (
      select 1 from public.dog_profiles dp
      where dp.id = training_cache.dog_id
        and dp.user_id = (select auth.uid())
    )
  )
  with check (
    dog_id is null
    or exists (
      select 1 from public.dog_profiles dp
      where dp.id = training_cache.dog_id
        and dp.user_id = (select auth.uid())
    )
  );

create extension if not exists pg_cron;

alter table public.training_cache
  add column if not exists last_accessed_at timestamptz default now();

create index if not exists training_cache_last_accessed_idx
  on public.training_cache(last_accessed_at);

do $$
declare
  existing_job_id int;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'training-cache-cleanup'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'training-cache-cleanup',
  '0 3 * * *',
  $$
    delete from public.training_cache
    where (source = 'chat' and last_accessed_at < now() - interval '30 days')
       or (source = 'week_plan' and last_accessed_at < now() - interval '90 days');
  $$
);
