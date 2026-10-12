alter function public.match_breed_chunks(vector, text, integer) set search_path = public, pg_temp;
alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.match_breed_and_general_chunks(text, vector, integer, text, text) set search_path = public, pg_temp;
