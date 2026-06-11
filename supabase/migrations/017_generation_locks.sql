-- Singleflight locks for expensive generation work (AI week plans).
-- Advisory locks don't survive PostgREST's transaction-per-request model,
-- so we use a lock table with TTL-based stealing instead.

create table if not exists public.generation_locks (
  key text primary key,
  acquired_at timestamptz not null default now()
);

alter table public.generation_locks enable row level security;
-- No policies: only the service role (bypasses RLS) may touch locks.

create or replace function public.try_acquire_generation_lock(
  p_key text,
  p_ttl_seconds int default 30
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_rows int := 0;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    return false;
  end if;

  insert into public.generation_locks as gl (key, acquired_at)
  values (p_key, v_now)
  on conflict (key) do update
    set acquired_at = v_now
    where gl.acquired_at < v_now - make_interval(secs => p_ttl_seconds);

  -- The insert/update only succeeded if we got the row (new or stolen-expired).
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

create or replace function public.release_generation_lock(p_key text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.generation_locks where key = p_key;
$$;

revoke all on function public.try_acquire_generation_lock(text, int) from public;
revoke all on function public.release_generation_lock(text) from public;
grant execute on function public.try_acquire_generation_lock(text, int) to service_role;
grant execute on function public.release_generation_lock(text) to service_role;

-- Safety net: clear abandoned locks (crashed functions) hourly.
do $$
declare
  existing_job_id int;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'generation-locks-cleanup'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'generation-locks-cleanup',
  '5 * * * *',
  $$
    delete from public.generation_locks
    where acquired_at < now() - interval '5 minutes';
  $$
);
