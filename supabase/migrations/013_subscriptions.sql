create type subscription_tier as enum ('free', 'basic', 'pro');
create type subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid'
);

create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  tier subscription_tier not null default 'free',
  status subscription_status not null default 'canceled',
  current_period_end timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_stripe_customer_idx
  on public.subscriptions (stripe_customer_id);
create index subscriptions_stripe_subscription_idx
  on public.subscriptions (stripe_subscription_id);

alter table public.subscriptions enable row level security;

create policy "users read own subscription"
  on public.subscriptions
  for select
  using ((select auth.uid()) = user_id);
