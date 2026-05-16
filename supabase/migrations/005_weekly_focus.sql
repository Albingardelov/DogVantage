-- Per-week focus areas selected by the user. Used to weight the AI plan
-- generation toward specific exercise families (recall, impulse control etc.)
-- without changing the long-term goals.

CREATE TABLE public.weekly_focus (
  dog_id      uuid NOT NULL REFERENCES public.dog_profiles(id) ON DELETE CASCADE,
  iso_week    text NOT NULL,
  focus_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (dog_id, iso_week)
);

ALTER TABLE public.weekly_focus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage focus for their own dogs"
  ON public.weekly_focus FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.dog_profiles
      WHERE dog_profiles.id = weekly_focus.dog_id
        AND dog_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dog_profiles
      WHERE dog_profiles.id = weekly_focus.dog_id
        AND dog_profiles.user_id = auth.uid()
    )
  );

GRANT ALL ON public.weekly_focus TO authenticated;

CREATE INDEX weekly_focus_iso_week_idx ON public.weekly_focus (dog_id, iso_week);
