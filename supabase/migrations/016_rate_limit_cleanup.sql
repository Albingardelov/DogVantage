-- api_rate_limits grows unbounded (one row per key, keys include path+actor).
-- Rows older than 1 hour are dead — the largest window in use is 60 seconds.

do $$
declare
  existing_job_id int;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'api-rate-limits-cleanup'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
end $$;

select cron.schedule(
  'api-rate-limits-cleanup',
  '15 * * * *',
  $$
    delete from public.api_rate_limits
    where updated_at < now() - interval '1 hour';
  $$
);
