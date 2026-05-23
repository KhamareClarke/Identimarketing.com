-- =====================================================================
-- Identimarketing SaaS - 002_setup_rls.sql
-- Row-level security. Run after 001_create_tables.sql.
-- Pattern: every user-owned table is filtered by user_id = auth.uid().
-- Service role bypasses RLS by default in Supabase (it has bypass_rls).
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- inserts are handled by the on_auth_user_created trigger (security definer)

-- ---------------------------------------------------------------------
-- services  (public catalog, anyone authenticated can read)
-- ---------------------------------------------------------------------
alter table public.services enable row level security;

drop policy if exists services_select_authenticated on public.services;
create policy services_select_authenticated on public.services
  for select to authenticated using (true);

-- writes are service-role-only

-- ---------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------
alter table public.clients enable row level security;

drop policy if exists clients_select_own on public.clients;
create policy clients_select_own on public.clients
  for select using (auth.uid() = user_id);

drop policy if exists clients_insert_own on public.clients;
create policy clients_insert_own on public.clients
  for insert with check (auth.uid() = user_id);

drop policy if exists clients_update_own on public.clients;
create policy clients_update_own on public.clients
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists clients_delete_own on public.clients;
create policy clients_delete_own on public.clients
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- projects
-- Owner has full access. Team members assigned to the project can SELECT.
-- ---------------------------------------------------------------------
alter table public.projects enable row level security;

drop policy if exists projects_select_own on public.projects;
create policy projects_select_own on public.projects
  for select using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.project_assignments pa
      join public.team_members tm on tm.id = pa.team_member_id
      where pa.project_id = projects.id
        and tm.user_id = auth.uid()
        and tm.status = 'active'
    )
  );

drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own on public.projects
  for insert with check (auth.uid() = user_id);

drop policy if exists projects_update_own on public.projects;
create policy projects_update_own on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists projects_delete_own on public.projects;
create policy projects_delete_own on public.projects
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- deliverables  (inherits access from parent project)
-- ---------------------------------------------------------------------
alter table public.deliverables enable row level security;

drop policy if exists deliverables_select_via_project on public.deliverables;
create policy deliverables_select_via_project on public.deliverables
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = deliverables.project_id
        and (
          p.user_id = auth.uid()
          or exists (
            select 1
            from public.project_assignments pa
            join public.team_members tm on tm.id = pa.team_member_id
            where pa.project_id = p.id
              and tm.user_id = auth.uid()
              and tm.status = 'active'
          )
        )
    )
  );

drop policy if exists deliverables_write_via_project on public.deliverables;
create policy deliverables_write_via_project on public.deliverables
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = deliverables.project_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = deliverables.project_id and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------
alter table public.team_members enable row level security;

drop policy if exists team_members_select_own on public.team_members;
create policy team_members_select_own on public.team_members
  for select using (auth.uid() = owner_id or auth.uid() = user_id);

drop policy if exists team_members_write_own on public.team_members;
create policy team_members_write_own on public.team_members
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------
-- project_assignments  (owner of the project can manage)
-- ---------------------------------------------------------------------
alter table public.project_assignments enable row level security;

drop policy if exists project_assignments_select on public.project_assignments;
create policy project_assignments_select on public.project_assignments
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_assignments.project_id and p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.team_members tm
      where tm.id = project_assignments.team_member_id and tm.user_id = auth.uid()
    )
  );

drop policy if exists project_assignments_write on public.project_assignments;
create policy project_assignments_write on public.project_assignments
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = project_assignments.project_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = project_assignments.project_id and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- project_metrics
-- ---------------------------------------------------------------------
alter table public.project_metrics enable row level security;

drop policy if exists project_metrics_via_project on public.project_metrics;
create policy project_metrics_via_project on public.project_metrics
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_metrics.project_id and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- empire_os_suggestions
-- ---------------------------------------------------------------------
alter table public.empire_os_suggestions enable row level security;

drop policy if exists empire_os_suggestions_via_project on public.empire_os_suggestions;
create policy empire_os_suggestions_via_project on public.empire_os_suggestions
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = empire_os_suggestions.project_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = empire_os_suggestions.project_id and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- ghl_syncs
-- ---------------------------------------------------------------------
alter table public.ghl_syncs enable row level security;

drop policy if exists ghl_syncs_own on public.ghl_syncs;
create policy ghl_syncs_own on public.ghl_syncs
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- billing
-- ---------------------------------------------------------------------
alter table public.billing enable row level security;

drop policy if exists billing_select_own on public.billing;
create policy billing_select_own on public.billing
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- system_logs / metrics  (service-role only, no policies = locked down)
-- ---------------------------------------------------------------------
alter table public.system_logs enable row level security;
alter table public.metrics enable row level security;
