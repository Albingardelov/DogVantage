-- Migration: add daily_exercise_metrics
-- Purpose: store per-day per-exercise learning signals (success/fail, latency, criteria level)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS daily_exercise_metrics (
  breed             text        NOT NULL,
  date              date        NOT NULL,
  exercise_id       text        NOT NULL,
  success_count     int         NOT NULL DEFAULT 0,
  fail_count        int         NOT NULL DEFAULT 0,
  latency_bucket    text        NULL,
  criteria_level_id text        NULL,
  notes             text        NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT daily_exercise_metrics_pk PRIMARY KEY (breed, date, exercise_id)
);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS daily_exercise_metrics_set_updated_at ON daily_exercise_metrics;
CREATE TRIGGER daily_exercise_metrics_set_updated_at
BEFORE UPDATE ON daily_exercise_metrics
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

