ALTER TABLE public.weekly_focus
  ADD COLUMN IF NOT EXISTS priority_exercise_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
