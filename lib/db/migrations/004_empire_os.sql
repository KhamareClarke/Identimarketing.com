-- =====================================================================
-- Identimarketing SaaS - 004_empire_os.sql
-- Empire OS event system, queue, recommendations engine.
-- Run after 003_seed_services.sql. Safe to re-run (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extend empire_os_suggestions with the columns Phase 3 needs.
-- (Original table created in 001_create_tables.sql.)
-- ---------------------------------------------------------------------
alter table public.empire_os_suggestions
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists event_type text,
  add column if not exists recommendation_type text,
  add column if not exists title text,
  add column if not exists impact_score integer,
  add column if not exists estimated_time_minutes integer,
  add column if not exists estimated_value numeric(12,2),
  add column if not exists action_steps jsonb not null default '[]'::jsonb,
  add column if not exists auto_executable boolean not null default false,
  add column if not exists applied_output jsonb,
  add column if not exists applied_by uuid references public.profiles(id) on delete set null,
  add column if not exists declined_reason text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists empire_os_suggestions_user_idx on public.empire_os_suggestions(user_id);
create index if not exists empire_os_suggestions_event_type_idx on public.empire_os_suggestions(event_type);
create index if not exists empire_os_suggestions_rec_type_idx on public.empire_os_suggestions(recommendation_type);
create index if not exists empire_os_suggestions_status_idx on public.empire_os_suggestions(status);
create index if not exists empire_os_suggestions_impact_idx on public.empire_os_suggestions(impact_score desc);

-- Drop the legacy status CHECK and add a broader one that supports the
-- Phase 3 vocabulary (approved/declined) alongside the original set.
do $$
declare
  con record;
begin
  for con in
    select conname
      from pg_constraint
     where conrelid = 'public.empire_os_suggestions'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute 'alter table public.empire_os_suggestions drop constraint ' || quote_ident(con.conname);
  end loop;
end$$;

alter table public.empire_os_suggestions
  add constraint empire_os_suggestions_status_check
  check (status in ('pending', 'accepted', 'dismissed', 'applied', 'approved', 'declined'));

drop trigger if exists empire_os_suggestions_set_updated_at on public.empire_os_suggestions;
create trigger empire_os_suggestions_set_updated_at
  before update on public.empire_os_suggestions
  for each row execute function public.set_updated_at();

-- Backfill user_id from project owner so existing rows pass RLS.
update public.empire_os_suggestions s
   set user_id = p.user_id
  from public.projects p
 where s.project_id = p.id
   and s.user_id is null;

-- Refresh RLS policy with the new user-aware scope.
drop policy if exists empire_os_suggestions_via_project on public.empire_os_suggestions;
drop policy if exists empire_os_suggestions_own on public.empire_os_suggestions;
create policy empire_os_suggestions_own on public.empire_os_suggestions
  for all using (
    auth.uid() = user_id
    or exists (
      select 1 from public.projects p
      where p.id = empire_os_suggestions.project_id and p.user_id = auth.uid()
    )
  ) with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.projects p
      where p.id = empire_os_suggestions.project_id and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- empire_os_events  (audit log of every event dispatched)
-- ---------------------------------------------------------------------
create table if not exists public.empire_os_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  skills_dispatched text[] not null default array[]::text[],
  mode text not null default 'inline' check (mode in ('inline', 'queued', 'cron')),
  status text not null default 'completed' check (status in ('completed', 'failed', 'queued')),
  duration_ms integer,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists empire_os_events_user_idx on public.empire_os_events(user_id);
create index if not exists empire_os_events_project_idx on public.empire_os_events(project_id);
create index if not exists empire_os_events_type_idx on public.empire_os_events(event_type);
create index if not exists empire_os_events_created_idx on public.empire_os_events(created_at desc);

alter table public.empire_os_events enable row level security;

drop policy if exists empire_os_events_own on public.empire_os_events;
create policy empire_os_events_own on public.empire_os_events
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- empire_os_job_queue  (bulk/async skill execution)
-- ---------------------------------------------------------------------
create table if not exists public.empire_os_job_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  event_type text not null,
  skill_slug text not null,
  payload jsonb not null default '{}'::jsonb,
  priority integer not null default 100,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  last_error text,
  result_suggestion_id uuid references public.empire_os_suggestions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists empire_os_job_queue_pending_idx
  on public.empire_os_job_queue(next_attempt_at)
  where status = 'pending';
create index if not exists empire_os_job_queue_user_idx on public.empire_os_job_queue(user_id);
create index if not exists empire_os_job_queue_project_idx on public.empire_os_job_queue(project_id);

drop trigger if exists empire_os_job_queue_set_updated_at on public.empire_os_job_queue;
create trigger empire_os_job_queue_set_updated_at
  before update on public.empire_os_job_queue
  for each row execute function public.set_updated_at();

alter table public.empire_os_job_queue enable row level security;

drop policy if exists empire_os_job_queue_own on public.empire_os_job_queue;
create policy empire_os_job_queue_own on public.empire_os_job_queue
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- empire_os_settings  (per-user Empire OS preferences)
-- ---------------------------------------------------------------------
create table if not exists public.empire_os_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  auto_execute boolean not null default false,
  confidence_threshold integer not null default 80 check (confidence_threshold between 0 and 100),
  allowed_recommendation_types text[] not null default array[
    'generate_content', 'email_sequence', 'social_calendar', 'ad_copy', 'strategy'
  ]::text[],
  enabled_event_types text[] not null default array[
    'client.created', 'project.created', 'deliverable.completed', 'low_performance_detected', 'manual_review', 'monthly_review'
  ]::text[],
  hourly_budget_usd numeric(8,2) not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists empire_os_settings_set_updated_at on public.empire_os_settings;
create trigger empire_os_settings_set_updated_at
  before update on public.empire_os_settings
  for each row execute function public.set_updated_at();

alter table public.empire_os_settings enable row level security;

drop policy if exists empire_os_settings_own on public.empire_os_settings;
create policy empire_os_settings_own on public.empire_os_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create empty settings on new profile (additive to handle_new_user trigger)
create or replace function public.handle_new_empire_os_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.empire_os_settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_empire_settings on public.profiles;
create trigger on_profile_created_empire_settings
  after insert on public.profiles
  for each row execute function public.handle_new_empire_os_settings();

-- Backfill settings for existing profiles.
insert into public.empire_os_settings (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
