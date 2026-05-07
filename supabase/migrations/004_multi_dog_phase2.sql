-- Phase 2: add dog_id FK to all per-dog data tables
-- dog_key columns remain during transition; ticket #44 migrates API routes to use dog_id

-- session_logs: backfill via user_id where possible
ALTER TABLE public.session_logs
  ADD COLUMN IF NOT EXISTS dog_id uuid REFERENCES public.dog_profiles(id) ON DELETE CASCADE;

UPDATE public.session_logs sl
SET dog_id = dp.id
FROM public.dog_profiles dp
WHERE sl.user_id = dp.user_id
  AND sl.dog_id IS NULL;

CREATE INDEX IF NOT EXISTS session_logs_dog_id_idx
  ON public.session_logs (dog_id, created_at DESC);

-- daily_progress: no backfill possible (dog_key values don't match any user_id)
ALTER TABLE public.daily_progress
  ADD COLUMN IF NOT EXISTS dog_id uuid REFERENCES public.dog_profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS daily_progress_dog_id_idx
  ON public.daily_progress (dog_id, date);

-- daily_exercise_metrics: same as daily_progress
ALTER TABLE public.daily_exercise_metrics
  ADD COLUMN IF NOT EXISTS dog_id uuid REFERENCES public.dog_profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS daily_exercise_metrics_dog_id_idx
  ON public.daily_exercise_metrics (dog_id, date);

-- training_cache: dog_id embedded in breed key string today; explicit FK added for future cleanup
ALTER TABLE public.training_cache
  ADD COLUMN IF NOT EXISTS dog_id uuid REFERENCES public.dog_profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS training_cache_dog_id_idx
  ON public.training_cache (dog_id, week_number);
