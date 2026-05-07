-- Add sex and castration_status to dog_profiles
ALTER TABLE public.dog_profiles
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS castration_status text CHECK (castration_status IN ('intact', 'castrated', 'unknown'));

-- heat_cycles: one row per löp/cycle, ended_at NULL = ongoing
CREATE TABLE public.heat_cycles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id      uuid NOT NULL REFERENCES public.dog_profiles(id) ON DELETE CASCADE,
  started_at  timestamptz NOT NULL DEFAULT now(),
  ended_at    timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.heat_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage heat cycles for their own dogs"
  ON public.heat_cycles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.dog_profiles
      WHERE dog_profiles.id = heat_cycles.dog_id
        AND dog_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dog_profiles
      WHERE dog_profiles.id = heat_cycles.dog_id
        AND dog_profiles.user_id = auth.uid()
    )
  );

GRANT ALL ON public.heat_cycles TO authenticated;

CREATE INDEX heat_cycles_dog_id_idx ON public.heat_cycles (dog_id, started_at DESC);
