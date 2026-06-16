alter table public.user_settings
  add column if not exists locale text not null default 'sv';
