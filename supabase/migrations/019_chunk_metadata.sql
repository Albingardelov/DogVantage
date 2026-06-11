-- Enrich breed_chunks with topic/life_stage/difficulty for filtered retrieval.
-- Existing rows are backfilled with keyword heuristics (no re-ingest needed).

alter table public.breed_chunks
  add column if not exists topic text not null default 'general',
  add column if not exists life_stage text not null default 'all',
  add column if not exists difficulty smallint not null default 2;

create index if not exists breed_chunks_topic_idx on public.breed_chunks (topic);
create index if not exists breed_chunks_life_stage_idx on public.breed_chunks (life_stage);

-- Heuristic backfill from content (English + Swedish cues).
update public.breed_chunks set topic = case
  when content ~* '(?i)(marker|clicker|markör|ladda mark)' then 'marker'
  when content ~* '(?i)(recall|inkallning|kom hit|come when called)' then 'recall'
  when content ~* '(?i)(\bsit\b|\bsitt\b|sitt-kommando)' then 'sit'
  when content ~* '(?i)(\bdown\b|\bligg\b|ligg-kommando)' then 'down'
  when content ~* '(?i)(leash|koppel|loose leash|gå fint)' then 'leash'
  when content ~* '(?i)(socializ|valp|puppy|mötet hund)' then 'socialization'
  when content ~* '(?i)(crate|bur|burbur)' then 'crate'
  when content ~* '(?i)(groom|borsta|handling|hantering)' then 'handling'
  else 'general'
end;

update public.breed_chunks set life_stage = case
  when content ~* '(?i)(valp|puppy|8 veckor|8 weeks|ny hem)' then 'puppy'
  when content ~* '(?i)(adolescent|tonår|teen)' then 'adolescent'
  when content ~* '(?i)(vuxen|adult|senior)' then 'adult'
  else 'all'
end
where life_stage = 'all';

-- Replace search RPC with metadata-aware ranking.
drop function if exists public.match_breed_and_general_chunks(text, vector, int);

create or replace function public.match_breed_and_general_chunks(
  match_breed text,
  query_embedding vector(1536),
  match_count int default 3,
  p_life_stage text default null,
  p_topic text default null
)
returns table (
  id uuid,
  content text,
  source text,
  source_url text,
  doc_version text,
  page_ref text,
  similarity float,
  breed text,
  topic text,
  life_stage text,
  difficulty smallint
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
    (
      (1 - (bc.embedding <=> query_embedding))
      + case when p_topic is not null and bc.topic = p_topic then 0.12 else 0 end
      + case
          when p_life_stage is null then 0
          when bc.life_stage in (p_life_stage, 'all') then 0.08
          else -0.04
        end
    )::float as similarity,
    bc.breed,
    bc.topic,
    bc.life_stage,
    bc.difficulty
  from public.breed_chunks bc
  where bc.breed in (match_breed, 'general')
  order by similarity desc
  limit match_count;
$$;

revoke all on function public.match_breed_and_general_chunks(text, vector, int, text, text) from public;
grant execute on function public.match_breed_and_general_chunks(text, vector, int, text, text) to authenticated, service_role;
