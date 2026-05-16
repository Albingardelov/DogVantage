-- Migration: add dog_key to progress + metrics tables
-- Purpose: separate training data between multiple dogs of same breed
-- Run this in Supabase SQL Editor

-- 1) daily_progress
ALTER TABLE daily_progress
  ADD COLUMN IF NOT EXISTS dog_key text NOT NULL DEFAULT 'default';

-- Replace PK/unique so upserts can use dog_key
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'daily_progress'
      AND constraint_type = 'PRIMARY KEY'
      AND constraint_name = 'daily_progress_pkey'
  ) THEN
    ALTER TABLE daily_progress DROP CONSTRAINT daily_progress_pkey;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- table may not exist in some envs
END $$;

-- Create composite primary key (idempotent-ish)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'daily_progress'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE daily_progress
      ADD CONSTRAINT daily_progress_pkey PRIMARY KEY (dog_key, breed, date, exercise_id);
  END IF;
EXCEPTION WHEN undefined_table THEN
END $$;

-- 2) daily_exercise_metrics
ALTER TABLE daily_exercise_metrics
  ADD COLUMN IF NOT EXISTS dog_key text NOT NULL DEFAULT 'default';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'daily_exercise_metrics'
      AND constraint_type = 'PRIMARY KEY'
      AND constraint_name = 'daily_exercise_metrics_pk'
  ) THEN
    ALTER TABLE daily_exercise_metrics DROP CONSTRAINT daily_exercise_metrics_pk;
  END IF;
EXCEPTION WHEN undefined_table THEN
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'daily_exercise_metrics'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE daily_exercise_metrics
      ADD CONSTRAINT daily_exercise_metrics_pk PRIMARY KEY (dog_key, breed, date, exercise_id);
  END IF;
EXCEPTION WHEN undefined_table THEN
END $$;

