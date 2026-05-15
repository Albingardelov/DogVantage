-- Finish multi-dog: dog_id only on daily_progress and daily_exercise_metrics.
-- Legacy rows with dog_key = 'default' and null dog_id are removed (no safe backfill).

-- Backfill dog_id where dog_key is a valid dog_profiles UUID
UPDATE public.daily_progress dp
SET dog_id = dp.dog_key::uuid
WHERE dp.dog_id IS NULL
  AND dp.dog_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (SELECT 1 FROM public.dog_profiles p WHERE p.id = dp.dog_key::uuid);

UPDATE public.daily_exercise_metrics dem
SET dog_id = dem.dog_key::uuid
WHERE dem.dog_id IS NULL
  AND dem.dog_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (SELECT 1 FROM public.dog_profiles p WHERE p.id = dem.dog_key::uuid);

DELETE FROM public.daily_progress WHERE dog_id IS NULL;
DELETE FROM public.daily_exercise_metrics WHERE dog_id IS NULL;

-- Collapse duplicate keys after backfill (keep row with highest reps / most attempts)
DELETE FROM public.daily_progress a
USING public.daily_progress b
WHERE a.dog_id = b.dog_id
  AND a.breed = b.breed
  AND a.date = b.date
  AND a.exercise_id = b.exercise_id
  AND a.ctid < b.ctid;

DELETE FROM public.daily_exercise_metrics a
USING public.daily_exercise_metrics b
WHERE a.dog_id = b.dog_id
  AND a.breed = b.breed
  AND a.date = b.date
  AND a.exercise_id = b.exercise_id
  AND a.ctid < b.ctid;

ALTER TABLE public.daily_progress
  DROP CONSTRAINT IF EXISTS daily_progress_pkey;

ALTER TABLE public.daily_progress
  DROP CONSTRAINT IF EXISTS daily_progress_breed_date_exercise_id_key;

ALTER TABLE public.daily_exercise_metrics
  DROP CONSTRAINT IF EXISTS daily_exercise_metrics_pk;

ALTER TABLE public.daily_exercise_metrics
  DROP CONSTRAINT IF EXISTS daily_exercise_metrics_breed_date_exercise_id_key;

ALTER TABLE public.daily_progress
  ADD CONSTRAINT daily_progress_dog_breed_date_exercise_key
  UNIQUE (dog_id, breed, date, exercise_id);

ALTER TABLE public.daily_exercise_metrics
  ADD CONSTRAINT daily_exercise_metrics_dog_breed_date_exercise_key
  UNIQUE (dog_id, breed, date, exercise_id);

ALTER TABLE public.daily_progress
  ALTER COLUMN dog_id SET NOT NULL;

ALTER TABLE public.daily_exercise_metrics
  ALTER COLUMN dog_id SET NOT NULL;

ALTER TABLE public.daily_progress
  DROP COLUMN IF EXISTS dog_key;

ALTER TABLE public.daily_exercise_metrics
  DROP COLUMN IF EXISTS dog_key;
