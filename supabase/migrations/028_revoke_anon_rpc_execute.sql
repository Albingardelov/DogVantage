-- Earlier migrations revoked EXECUTE from PUBLIC only; Supabase also grants it
-- to anon and authenticated explicitly. The app calls these functions only
-- through the service-role client.
revoke execute on function public.increment_chat_usage(uuid) from anon, authenticated;
revoke execute on function public.release_generation_lock(text) from anon, authenticated;
revoke execute on function public.try_acquire_generation_lock(text, integer) from anon, authenticated;
revoke execute on function public.check_api_rate_limit(text, integer, integer) from anon, authenticated;
