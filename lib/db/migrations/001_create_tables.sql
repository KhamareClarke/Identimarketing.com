-- =====================================================================
-- Identimarketing SaaS - 001_create_tables.sql
-- Run in Supabase SQL editor (or `supabase db push`) in numeric order.
-- All app tables live in the `public` schema. `auth.users` is owned by
-- Supabase Auth - we never touch it directly; `profiles` extends it.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Generic updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles  (extends auth.users with app-specific columns)
-- The spec calls this `users`; we use `profiles` so it cleanly extends
-- the Supabase-managed auth.users table and a view exposes a `users`
-- alias for spec compatibility.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member', 'client')),
  avatar_url text,
  ghl_contact_id text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'starter', 'pro', 'enterprise')),
  email_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists profiles_role_idx on public.profiles(role);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth.users row is inserted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A view that aliases `public.users` -> `profiles` joined with auth.users.
-- The spec uses `users` everywhere; this keeps that contract.
create or replace view public.users as
  select
    p.id,
    p.email,
    u.encrypted_password as password_hash,
    p.name,
    p.role,
    p.avatar_url,
    p.ghl_contact_id,
    p.subscription_tier,
    p.email_verified_at,
    p.last_login_at,
    p.created_at,
    p.updated_at
  from public.profiles p
  join auth.users u on u.id = p.id;

-- ---------------------------------------------------------------------
-- services  (catalog of services the agency offers)
-- ---------------------------------------------------------------------
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  price_base numeric(12,2) not null default 0,
  deliverables jsonb not null default '[]'::jsonb,
  timeline_weeks integer not null default 4,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  industry text,
  contact_name text,
  contact_email text not null,
  phone text,
  address text,
  website text,
  budget numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('lead', 'active', 'paused', 'churned')),
  notes text,
  ghl_client_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists clients_status_idx on public.clients(status);
create index if not exists clients_user_status_idx on public.clients(user_id, status);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id),
  name text not null,
  description text,
  service_type text,
  status text not null default 'planning' check (status in ('planning', 'active', 'in_review', 'completed', 'closed', 'cancelled')),
  budget numeric(12,2) not null default 0,
  spent numeric(12,2) not null default 0,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_client_id_idx on public.projects(client_id);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_user_status_idx on public.projects(user_id, status);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- deliverables
-- ---------------------------------------------------------------------
create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'under_review', 'approved', 'rejected')),
  due_date date,
  completed_date date,
  assigned_to uuid references public.profiles(id) on delete set null,
  notes text,
  file_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deliverables_project_id_idx on public.deliverables(project_id);
create index if not exists deliverables_assigned_to_idx on public.deliverables(assigned_to);
create index if not exists deliverables_status_idx on public.deliverables(status);

drop trigger if exists deliverables_set_updated_at on public.deliverables;
create trigger deliverables_set_updated_at
  before update on public.deliverables
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- team_members  (people working under a workspace owner)
-- ---------------------------------------------------------------------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'manager', 'designer', 'developer', 'strategist', 'member')),
  specialties text[] not null default array[]::text[],
  phone text,
  status text not null default 'invited' check (status in ('invited', 'active', 'inactive')),
  invite_token text,
  invite_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, email)
);

create index if not exists team_members_owner_id_idx on public.team_members(owner_id);
create index if not exists team_members_user_id_idx on public.team_members(user_id);

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

-- Project <-> team assignments (many-to-many)
create table if not exists public.project_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (project_id, team_member_id)
);

create index if not exists project_assignments_project_idx on public.project_assignments(project_id);
create index if not exists project_assignments_member_idx on public.project_assignments(team_member_id);

-- ---------------------------------------------------------------------
-- project_metrics
-- ---------------------------------------------------------------------
create table if not exists public.project_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  metric_type text not null,
  metric_value numeric(18,4) not null,
  metric_date date not null default current_date,
  meta jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create index if not exists project_metrics_project_idx on public.project_metrics(project_id);
create index if not exists project_metrics_type_date_idx on public.project_metrics(metric_type, metric_date);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  link text,
  is_read boolean not null default false,
  sent_via text[] not null default array[]::text[],
  sent_at timestamptz not null default now(),
  ghl_message_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, is_read) where is_read = false;

-- ---------------------------------------------------------------------
-- empire_os_suggestions  (AI / skill-driven recommendations)
-- ---------------------------------------------------------------------
create table if not exists public.empire_os_suggestions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  skill_name text not null,
  suggestion_text text not null,
  recommendation text,
  confidence_score numeric(5,4) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed', 'applied')),
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists empire_os_suggestions_project_idx on public.empire_os_suggestions(project_id);
create index if not exists empire_os_suggestions_status_idx on public.empire_os_suggestions(status);

-- ---------------------------------------------------------------------
-- ghl_syncs  (Go High Level sync log)
-- ---------------------------------------------------------------------
create table if not exists public.ghl_syncs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sync_type text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'success', 'error')),
  last_synced_at timestamptz,
  error_message text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ghl_syncs_user_idx on public.ghl_syncs(user_id);

drop trigger if exists ghl_syncs_set_updated_at on public.ghl_syncs;
create trigger ghl_syncs_set_updated_at
  before update on public.ghl_syncs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- billing
-- ---------------------------------------------------------------------
create table if not exists public.billing (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'free',
  monthly_cost numeric(12,2) not null default 0,
  billing_date date,
  next_billing_date date,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'active' check (status in ('active', 'past_due', 'cancelled', 'trialing')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_user_idx on public.billing(user_id);
create index if not exists billing_stripe_sub_idx on public.billing(stripe_subscription_id);

drop trigger if exists billing_set_updated_at on public.billing;
create trigger billing_set_updated_at
  before update on public.billing
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- system_logs  (used by lib/logging.ts for error-level events)
-- ---------------------------------------------------------------------
create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('debug', 'info', 'warn', 'error')),
  message text not null,
  context jsonb not null default '{}'::jsonb,
  user_id uuid references public.profiles(id) on delete set null,
  request_id text,
  created_at timestamptz not null default now()
);

create index if not exists system_logs_level_idx on public.system_logs(level);
create index if not exists system_logs_created_at_idx on public.system_logs(created_at desc);

-- ---------------------------------------------------------------------
-- metrics  (lib/monitoring.ts + lib/metrics.ts flush target)
-- ---------------------------------------------------------------------
create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  value numeric(18,4) not null,
  duration_ms numeric(12,2),
  user_id uuid references public.profiles(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create index if not exists metrics_name_idx on public.metrics(name);
create index if not exists metrics_recorded_at_idx on public.metrics(recorded_at desc);
