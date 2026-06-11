alter table daily_check_ins
  add column if not exists handler_energy text check (handler_energy in ('low', 'ok', 'high')),
  add column if not exists minutes_available int check (minutes_available between 0 and 120);
