-- pgvector cannot index vectors above 2000 dims — vector(3072) meant every RAG
-- query was a sequential scan. Switch to 1536 dims and add an HNSW index.
--
-- gemini-embedding-001 is MRL-trained (Matryoshka), so existing 3072-dim
-- embeddings convert losslessly-enough by truncating to the first 1536 dims
-- and re-normalizing — no re-ingest needed. New embeddings are truncated +
-- normalized the same way in src/lib/ai/embed.ts.

alter table public.breed_chunks
  alter column embedding type vector(1536)
  using l2_normalize(subvector(embedding, 1, 1536));

create index if not exists breed_chunks_embedding_hnsw_idx
  on public.breed_chunks
  using hnsw (embedding vector_cosine_ops);

create index if not exists breed_chunks_breed_idx
  on public.breed_chunks (breed);

-- Recreate the search RPC with the new dimensionality.
drop function if exists public.match_breed_and_general_chunks(text, vector, int);

create or replace function public.match_breed_and_general_chunks(
  match_breed text,
  query_embedding vector(1536),
  match_count int default 3
)
returns table (
  id uuid,
  content text,
  source text,
  source_url text,
  doc_version text,
  page_ref text,
  similarity float,
  breed text
)
language sql
stable
parallel safe
as $$
  select
    bc.id,
    bc.content,
    bc.source,
    bc.source_url,
    bc.doc_version,
    bc.page_ref,
    1 - (bc.embedding <=> query_embedding) as similarity,
    bc.breed
  from public.breed_chunks bc
  where bc.breed in (match_breed, 'general')
  order by bc.embedding <=> query_embedding
  limit match_count;
$$;

revoke all on function public.match_breed_and_general_chunks(text, vector, int) from public;
grant execute on function public.match_breed_and_general_chunks(text, vector, int) to authenticated, service_role;
