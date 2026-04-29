-- DogVantage Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Breed chunks: RAG source data from breed club PDFs
CREATE TABLE IF NOT EXISTS breed_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed       text NOT NULL,
  source      text NOT NULL,
  source_url  text NOT NULL DEFAULT '',
  doc_version text NOT NULL DEFAULT '',
  page_ref    text NOT NULL DEFAULT '',
  content     text NOT NULL,
  embedding   vector(768) NOT NULL
);

CREATE INDEX IF NOT EXISTS breed_chunks_breed_idx ON breed_chunks (breed);
CREATE INDEX IF NOT EXISTS breed_chunks_embedding_idx
  ON breed_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Training cache
CREATE TABLE IF NOT EXISTS training_cache (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed       text NOT NULL,
  week_number int  NOT NULL,
  content     text NOT NULL,
  source      text NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(breed, week_number)
);

-- Session logs: hybrid logging per training session
CREATE TABLE IF NOT EXISTS session_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed        text NOT NULL,
  week_number  int  NOT NULL,
  quick_rating text NOT NULL CHECK (quick_rating IN ('good', 'mixed', 'bad')),
  focus        int  NOT NULL CHECK (focus BETWEEN 1 AND 5),
  obedience    int  NOT NULL CHECK (obedience BETWEEN 1 AND 5),
  notes        text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_logs_breed_idx ON session_logs (breed, created_at DESC);

-- Takedown requests: document removal requests from breed clubs
CREATE TABLE IF NOT EXISTS takedown_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed      text NOT NULL,
  source     text NOT NULL,
  reason     text NOT NULL,
  contact    text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Community submissions: user-contributed PDFs queued for admin review
CREATE TABLE IF NOT EXISTS community_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed       text NOT NULL,
  filename    text NOT NULL,
  file_size   int  NOT NULL,
  source_url  text NOT NULL DEFAULT '',
  doc_version text NOT NULL DEFAULT '',
  reviewed    boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- RPC function for pgvector similarity search
CREATE OR REPLACE FUNCTION match_breed_chunks(
  query_embedding vector(768),
  match_breed     text,
  match_count     int DEFAULT 5
)
RETURNS TABLE(
  id          uuid,
  content     text,
  source      text,
  source_url  text,
  doc_version text,
  page_ref    text,
  similarity  float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.id, bc.content, bc.source, bc.source_url,
    bc.doc_version, bc.page_ref,
    (1 - (bc.embedding <=> query_embedding))::float AS similarity
  FROM breed_chunks bc
  WHERE bc.breed = match_breed
  ORDER BY bc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
