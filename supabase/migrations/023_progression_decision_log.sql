create table public.progression_decision_log (
  id                uuid primary key default gen_random_uuid(),
  dog_id            uuid not null references public.dog_profiles(id) on delete cascade,
  exercise_id       text not null,
  decision          text not null check (decision in ('advance', 'hold', 'regress')),
  success_rate      numeric not null,
  criteria_level_id text,
  created_at        timestamptz not null default now(),
  evaluated_at      timestamptz,
  outcome           text check (outcome in ('good', 'bad', 'neutral'))
);

create index progression_decision_log_dog_idx
  on public.progression_decision_log (dog_id, exercise_id, created_at desc);

alter table public.progression_decision_log enable row level security;

create policy "owner_only" on public.progression_decision_log
  for all
  using (
    dog_id in (
      select id from public.dog_profiles where user_id = auth.uid()
    )
  )
  with check (
    dog_id in (
      select id from public.dog_profiles where user_id = auth.uid()
    )
  );
