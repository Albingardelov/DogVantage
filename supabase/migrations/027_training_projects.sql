-- Träningsprojekt: ägarens aktuella mål som styrande enhet för veckoplanen.
-- Ett aktivt projekt per hund; lever tills det slutförs/avbryts (nollställs
-- inte per ISO-vecka som weekly_focus).

CREATE TABLE public.training_projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id      uuid NOT NULL REFERENCES public.dog_profiles(id) ON DELETE CASCADE,
  protocol_id text NOT NULL,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped')),
  started_at  timestamptz NOT NULL DEFAULT now(),
  ended_at    timestamptz
);

CREATE UNIQUE INDEX training_projects_one_active_idx
  ON public.training_projects (dog_id)
  WHERE status = 'active';

CREATE INDEX training_projects_dog_idx ON public.training_projects (dog_id);

ALTER TABLE public.training_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage projects for their own dogs"
  ON public.training_projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.dog_profiles
      WHERE dog_profiles.id = training_projects.dog_id
        AND dog_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dog_profiles
      WHERE dog_profiles.id = training_projects.dog_id
        AND dog_profiles.user_id = auth.uid()
    )
  );

GRANT ALL ON public.training_projects TO authenticated;

-- Bortvalda övningar (t.ex. via "byt övning" i dagens pass). Används som
-- negativ signal i veckoplaneringen.

CREATE TABLE public.exercise_skips (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dog_id      uuid NOT NULL REFERENCES public.dog_profiles(id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  date        date NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX exercise_skips_dog_date_idx ON public.exercise_skips (dog_id, date);

ALTER TABLE public.exercise_skips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage skips for their own dogs"
  ON public.exercise_skips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.dog_profiles
      WHERE dog_profiles.id = exercise_skips.dog_id
        AND dog_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dog_profiles
      WHERE dog_profiles.id = exercise_skips.dog_id
        AND dog_profiles.user_id = auth.uid()
    )
  );

GRANT ALL ON public.exercise_skips TO authenticated;
