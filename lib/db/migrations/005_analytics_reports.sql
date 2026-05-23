-- =====================================================================
-- Identimarketing SaaS - 005_analytics_reports.sql
-- Phase 4: project metric targets + reports table + share tokens.
-- Run after 004_empire_os.sql. Safe to re-run (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- project_metric_targets
-- Per-project goals for each metric_type. Used to render "vs target"
-- comparisons on the analytics page and inside generated reports.
-- ---------------------------------------------------------------------
create table if not exists public.project_metric_targets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  metric_type text not null,
  target_value numeric(18,4) not null,
  direction text not null default 'up' check (direction in ('up', 'down')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, metric_type)
);

create index if not exists project_metric_targets_project_idx
  on public.project_metric_targets(project_id);

drop trigger if exists project_metric_targets_set_updated_at on public.project_metric_targets;
create trigger project_metric_targets_set_updated_at
  before update on public.project_metric_targets
  for each row execute function public.set_updated_at();

alter table public.project_metric_targets enable row level security;

drop policy if exists project_metric_targets_via_project on public.project_metric_targets;
create policy project_metric_targets_via_project on public.project_metric_targets
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = project_metric_targets.project_id
        and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = project_metric_targets.project_id
        and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- reports
-- Generated client-facing reports (PDF / HTML).
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  format text not null default 'pdf' check (format in ('pdf', 'html')),
  status text not null default 'ready' check (status in ('pending', 'ready', 'failed')),
  period_from date,
  period_to date,
  summary text,
  payload jsonb not null default '{}'::jsonb, -- raw report data (metrics snapshot)
  html_content text,                          -- cached HTML body
  share_token text unique,                    -- random token for public share URL
  share_expires_at timestamptz,
  share_views integer not null default 0,
  storage_path text,                          -- optional Supabase Storage path for PDF
  schedule text check (schedule in ('manual', 'weekly', 'monthly')) default 'manual',
  next_run_at timestamptz,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_user_idx on public.reports(user_id);
create index if not exists reports_project_idx on public.reports(project_id);
create index if not exists reports_share_token_idx on public.reports(share_token);
create index if not exists reports_generated_idx on public.reports(generated_at desc);
create index if not exists reports_schedule_idx on public.reports(schedule, next_run_at)
  where schedule <> 'manual';

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

alter table public.reports enable row level security;

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
  for select using (auth.uid() = user_id);

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert with check (auth.uid() = user_id);

drop policy if exists reports_update_own on public.reports;
create policy reports_update_own on public.reports
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists reports_delete_own on public.reports;
create policy reports_delete_own on public.reports
  for delete using (auth.uid() = user_id);

-- Service role bypasses RLS so the public share lookup (which uses the
-- service client to validate share_token without exposing user_id) works.
