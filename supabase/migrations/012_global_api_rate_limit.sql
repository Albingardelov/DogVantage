-- Global API rate limiter store + atomic check RPC

create table if not exists public.api_rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_api_rate_limits_updated_at
  on public.api_rate_limits (updated_at desc);

create or replace function public.check_api_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz := v_now - make_interval(secs => p_window_seconds);
  v_count int;
  v_effective_window_start timestamptz;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    return jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_at', v_now
    );
  end if;

  insert into public.api_rate_limits as rl (key, window_start, count, updated_at)
  values (p_key, v_now, 1, v_now)
  on conflict (key) do update
    set window_start = case
      when rl.window_start < v_window_start then v_now
      else rl.window_start
    end,
    count = case
      when rl.window_start < v_window_start then 1
      else rl.count + 1
    end,
    updated_at = v_now
  returning count, window_start
  into v_count, v_effective_window_start;

  return jsonb_build_object(
    'allowed', v_count <= p_limit,
    'remaining', greatest(p_limit - v_count, 0),
    'reset_at', v_effective_window_start + make_interval(secs => p_window_seconds)
  );
end;
$$;

revoke all on function public.check_api_rate_limit(text, int, int) from public;
grant execute on function public.check_api_rate_limit(text, int, int) to anon;
grant execute on function public.check_api_rate_limit(text, int, int) to authenticated;
grant execute on function public.check_api_rate_limit(text, int, int) to service_role;
