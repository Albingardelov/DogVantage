create or replace function public.increment_chat_usage(p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  insert into public.chat_usage (user_id, date, count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, date)
  do update set count = chat_usage.count + 1
  returning count into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_chat_usage(uuid) from public;
grant execute on function public.increment_chat_usage(uuid) to service_role;
