-- Derived per-dog adaptive profile, computed from existing tables and cached.
create table public.dog_state (
  dog_id      uuid primary key references public.dog_profiles(id) on delete cascade,
  payload     jsonb not null,
  computed_at timestamptz not null default now()
);

alter table public.dog_state enable row level security;

create policy "owner_only" on public.dog_state
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
