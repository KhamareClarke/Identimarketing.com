-- =====================================================================
-- Identimarketing SaaS - 006_billing.sql
-- Phase 5: Stripe billing extensions + invoices + webhook idempotency.
-- Run after 005_analytics_reports.sql. Safe to re-run (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extend public.billing with the columns Stripe webhooks populate.
-- (Original table created in 001_create_tables.sql with stripe_customer_id
--  and stripe_subscription_id already present.)
-- ---------------------------------------------------------------------
alter table public.billing
  add column if not exists currency text not null default 'usd',
  add column if not exists price_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists trial_end timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists default_payment_method text,
  add column if not exists last_invoice_id text,
  add column if not exists last_synced_at timestamptz;

-- Widen the status check so we accept all Stripe subscription statuses.
do $$
declare con record;
begin
  for con in
    select conname from pg_constraint
     where conrelid = 'public.billing'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute 'alter table public.billing drop constraint ' || quote_ident(con.conname);
  end loop;
end$$;

alter table public.billing
  add constraint billing_status_check check (
    status in (
      'active', 'trialing', 'past_due', 'unpaid', 'canceled', 'cancelled',
      'incomplete', 'incomplete_expired', 'paused'
    )
  );

-- Enforce one billing row per user (Stripe = one subscription per tenant).
do $$
begin
  if not exists (
    select 1 from pg_indexes
     where schemaname = 'public'
       and tablename = 'billing'
       and indexname = 'billing_user_id_unique'
  ) then
    create unique index billing_user_id_unique on public.billing(user_id);
  end if;
end$$;

create index if not exists billing_status_idx on public.billing(status);
create index if not exists billing_period_end_idx on public.billing(current_period_end);
create index if not exists billing_stripe_customer_idx on public.billing(stripe_customer_id);

alter table public.billing enable row level security;

drop policy if exists billing_select_own on public.billing;
create policy billing_select_own on public.billing
  for select using (auth.uid() = user_id);

-- Writes are service-role-only; the webhook handler bypasses RLS.

-- ---------------------------------------------------------------------
-- invoices  (mirror of Stripe invoices for in-app history)
-- ---------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  number text,
  status text not null default 'draft' check (
    status in ('draft', 'open', 'paid', 'void', 'uncollectible')
  ),
  amount_due integer not null default 0,        -- minor units
  amount_paid integer not null default 0,
  amount_remaining integer not null default 0,
  currency text not null default 'usd',
  hosted_invoice_url text,
  invoice_pdf text,
  period_start timestamptz,
  period_end timestamptz,
  issued_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_user_idx on public.invoices(user_id);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_issued_idx on public.invoices(issued_at desc);

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;

drop policy if exists invoices_select_own on public.invoices;
create policy invoices_select_own on public.invoices
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- stripe_webhook_events  (idempotency log)
-- ---------------------------------------------------------------------
create table if not exists public.stripe_webhook_events (
  id text primary key,                              -- Stripe event id
  type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists stripe_webhook_events_type_idx on public.stripe_webhook_events(type);
create index if not exists stripe_webhook_events_created_idx
  on public.stripe_webhook_events(created_at desc);

alter table public.stripe_webhook_events enable row level security;
-- No SELECT policies; only the service role can read this table.

-- ---------------------------------------------------------------------
-- Auto-create a billing row for every new profile so the dashboard
-- always has something to render even before the user subscribes.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_billing_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.billing (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_billing on public.profiles;
create trigger on_profile_created_billing
  after insert on public.profiles
  for each row execute function public.handle_new_billing_row();

-- Backfill billing rows for existing profiles.
insert into public.billing (user_id, plan, status)
select id, 'free', 'active' from public.profiles
on conflict (user_id) do nothing;
