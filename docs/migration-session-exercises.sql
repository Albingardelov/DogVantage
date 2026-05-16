-- Add exercises column to session_logs
-- Run this in the Supabase SQL Editor

ALTER TABLE session_logs
  ADD COLUMN IF NOT EXISTS exercises jsonb;
