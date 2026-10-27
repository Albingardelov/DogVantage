-- Shared tables are only read and written by the server with the service role
-- key, which bypasses RLS. Without RLS, Supabase's default grants let anyone
-- holding the public anon key read and write them directly through PostgREST:
-- poison the RAG chunks or shared caches served to every user, read takedown
-- contact details, or reset and inflate other users' rate limits.

alter table if exists public.breed_chunks enable row level security;
alter table if exists public.takedown_requests enable row level security;
alter table if exists public.community_submissions enable row level security;
alter table if exists public.api_rate_limits enable row level security;

-- training_cache: the previous policy also matched rows with dog_id is null,
-- which are the shared chat, week-plan, quiz and curriculum caches. Users may
-- only touch rows of their own dogs; shared rows are service-role only.
drop policy if exists "Users manage dog-scoped training cache" on public.training_cache;
create policy "Users manage dog-scoped training cache"
  on public.training_cache
  for all
  to authenticated
  using (
    exists (
      select 1 from public.dog_profiles dp
      where dp.id = training_cache.dog_id
        and dp.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.dog_profiles dp
      where dp.id = training_cache.dog_id
        and dp.user_id = (select auth.uid())
    )
  );
