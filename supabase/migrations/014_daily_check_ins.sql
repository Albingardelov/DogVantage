create table daily_check_ins (
  dog_id  uuid  not null references dog_profiles(id) on delete cascade,
  date    date  not null,
  zone    text  not null check (zone in ('green', 'yellow', 'red')),
  primary key (dog_id, date)
);

alter table daily_check_ins enable row level security;

create policy "owner_only" on daily_check_ins
  for all
  using (
    dog_id in (
      select id from dog_profiles where user_id = auth.uid()
    )
  );
