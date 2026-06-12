create table public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  dog_id     uuid not null references public.dog_profiles(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index chat_messages_dog_idx on public.chat_messages (dog_id, created_at desc);

alter table public.chat_messages enable row level security;

create policy "owner_only" on public.chat_messages
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
