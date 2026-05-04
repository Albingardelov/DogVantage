-- dog_profiles: one row per authenticated user
create table if not exists dog_profiles (
  user_id      uuid primary key references auth.users on delete cascade,
  name         text not null,
  breed        text not null,
  birthdate    date not null,
  training_week int not null default 1,
  onboarding   jsonb,
  assessment   jsonb,
  created_at   timestamptz not null default now()
);

alter table dog_profiles enable row level security;

create policy "Users manage their own profile"
  on dog_profiles for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- session_logs: add user_id, drop dog_key
alter table session_logs add column if not exists user_id uuid references auth.users;
alter table session_logs drop column if exists dog_key;

-- RLS on session_logs (drop existing open policies first)
drop policy if exists "Allow all" on session_logs;
drop policy if exists "Public access" on session_logs;

alter table session_logs enable row level security;

create policy "Users manage their own logs"
  on session_logs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
