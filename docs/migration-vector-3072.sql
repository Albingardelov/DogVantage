-- Migration: update embedding dimension from 768 to 3072
-- Google's text-embedding-004 is gone; gemini-embedding-001 returns 3072 dims
-- Run this in Supabase SQL Editor

-- Drop old index and column, recreate with correct dimension
DROP INDEX IF EXISTS breed_chunks_embedding_idx;
ALTER TABLE breed_chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE breed_chunks ADD COLUMN embedding vector(3072) NOT NULL DEFAULT array_fill(0, ARRAY[3072])::vector(3072);

-- Recreate vector index
CREATE INDEX breed_chunks_embedding_idx
  ON breed_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Update RPC function signature
CREATE OR REPLACE FUNCTION match_breed_chunks(
  query_embedding vector(3072),
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
