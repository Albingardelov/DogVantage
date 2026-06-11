-- User-scoped curriculum completion + spaced-repetition quiz cards.

create table if not exists public.curriculum_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  dog_id uuid not null references public.dog_profiles (id) on delete cascade,
  module_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, dog_id, module_id)
);

alter table public.curriculum_progress enable row level security;

create policy "Users manage curriculum progress for their dogs"
  on public.curriculum_progress
  for all
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = curriculum_progress.dog_id
        and dp.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = curriculum_progress.dog_id
        and dp.user_id = (select auth.uid())
    )
  );

create table if not exists public.quiz_cards (
  user_id uuid not null references auth.users (id) on delete cascade,
  dog_id uuid not null references public.dog_profiles (id) on delete cascade,
  card_key text not null,
  context_key text not null,
  question text not null,
  options jsonb not null,
  correct_index smallint not null,
  explanation text,
  interval_days int not null default 1,
  next_review_at timestamptz not null default now(),
  consecutive_correct int not null default 0,
  last_result boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, dog_id, card_key)
);

create index if not exists quiz_cards_due_idx
  on public.quiz_cards (user_id, dog_id, next_review_at);

alter table public.quiz_cards enable row level security;

create policy "Users manage quiz cards for their dogs"
  on public.quiz_cards
  for all
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = quiz_cards.dog_id
        and dp.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.dog_profiles dp
      where dp.id = quiz_cards.dog_id
        and dp.user_id = (select auth.uid())
    )
  );
