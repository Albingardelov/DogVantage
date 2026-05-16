-- Phase 1: dog_profiles gets its own id, user_id becomes a regular FK
-- Allows multiple dogs per account (phase 2+ adds the switcher UI)

-- Add id column (gen_random_uuid() fills existing rows automatically)
ALTER TABLE public.dog_profiles
  ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();

-- Swap primary key from user_id to id
ALTER TABLE public.dog_profiles
  DROP CONSTRAINT dog_profiles_pkey;

ALTER TABLE public.dog_profiles
  ADD CONSTRAINT dog_profiles_pkey PRIMARY KEY (id);

-- user_id must remain NOT NULL (was implicit as PK before)
ALTER TABLE public.dog_profiles
  ALTER COLUMN user_id SET NOT NULL;

-- Index for user_id lookups (replaces the old PK index)
CREATE INDEX dog_profiles_user_id_idx ON public.dog_profiles (user_id);

-- user_settings: tracks which dog is active per account
CREATE TABLE public.user_settings (
  user_id       uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  active_dog_id uuid REFERENCES public.dog_profiles(id) ON DELETE SET NULL,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.user_settings TO authenticated;
