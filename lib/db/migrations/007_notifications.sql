-- =====================================================================
-- Identimarketing SaaS - 007_notifications.sql
-- Phase 6: notifications dispatcher schema + per-user preferences.
-- Safe to re-run. Run after 006_billing.sql.
-- =====================================================================

-- Phone column on profiles so SMS notifications can target the user.
alter table public.profiles
  add column if not exists phone text,
  add column if not exists timezone text default 'Europe/London';

-- ---------------------------------------------------------------------
-- Extend public.notifications with priority, action url, error tracking,
-- and a single canonical category enum (so the dispatcher can route).
-- ---------------------------------------------------------------------
alter table public.notifications
  add column if not exists category text not null default 'system'
    check (category in ('project', 'team', 'performance', 'billing', 'system', 'empire_os')),
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  add column if not exists action_url text,
  add column if not exists action_label text,
  add column if not exists data jsonb not null default '{}'::jsonb,
  add column if not exists read_at timestamptz,
  add column if not exists email_status text
    check (email_status in ('queued', 'sent', 'failed', null) or email_status is null),
  add column if not exists email_error text,
  add column if not exists sms_status text
    check (sms_status in ('queued', 'sent', 'failed', null) or sms_status is null),
  add column if not exists sms_error text,
  add column if not exists deleted_at timestamptz;

create index if not exists notifications_category_idx
  on public.notifications(category);
create index if not exists notifications_priority_idx
  on public.notifications(priority);
create index if not exists notifications_user_active_idx
  on public.notifications(user_id, is_read, sent_at desc)
  where deleted_at is null;

-- ---------------------------------------------------------------------
-- notification_preferences  (per-user, per-category channel toggles)
-- ---------------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  -- Master toggles per channel.
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  in_app_enabled boolean not null default true,
  -- Per-category channel routing. true = include, false = skip.
  -- JSON shape: { project: { email, sms, in_app }, team: {...}, ... }
  category_channels jsonb not null default jsonb_build_object(
    'project',     jsonb_build_object('email', true,  'sms', false, 'in_app', true),
    'team',        jsonb_build_object('email', true,  'sms', false, 'in_app', true),
    'performance', jsonb_build_object('email', true,  'sms', false, 'in_app', true),
    'billing',     jsonb_build_object('email', true,  'sms', true,  'in_app', true),
    'system',      jsonb_build_object('email', true,  'sms', false, 'in_app', true),
    'empire_os',   jsonb_build_object('email', false, 'sms', false, 'in_app', true)
  ),
  -- Quiet hours (in user's profile timezone). 24h clock.
  quiet_hours_start text,
  quiet_hours_end text,
  -- Cron digests.
  daily_digest boolean not null default false,
  weekly_summary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists notification_preferences_set_updated_at
  on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_select_own
  on public.notification_preferences;
create policy notification_preferences_select_own
  on public.notification_preferences for select using (auth.uid() = user_id);

drop policy if exists notification_preferences_modify_own
  on public.notification_preferences;
create policy notification_preferences_modify_own
  on public.notification_preferences
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create a preferences row for every new profile.
create or replace function public.handle_new_notification_prefs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_notification_prefs on public.profiles;
create trigger on_profile_created_notification_prefs
  after insert on public.profiles
  for each row execute function public.handle_new_notification_prefs();

-- Backfill for existing profiles.
insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------
-- cron_runs  (idempotency / observability for scheduled jobs)
-- ---------------------------------------------------------------------
create table if not exists public.cron_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'ok', 'failed')),
  stats jsonb not null default '{}'::jsonb,
  error text
);

create index if not exists cron_runs_job_idx on public.cron_runs(job);
create index if not exists cron_runs_started_idx on public.cron_runs(started_at desc);

alter table public.cron_runs enable row level security;
-- No policies; service role only.
