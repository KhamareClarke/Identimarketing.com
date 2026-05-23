// =====================================================================
// Identimarketing SaaS - Database query helpers
//
// Every helper accepts a SupabaseClient so callers can choose RLS-aware
// (user cookie) vs service-role contexts. Always returns typed rows or
// throws a PostgrestError so the error-handler middleware can translate
// it to a user-facing response.
// =====================================================================

import type {
  Client,
  ClientStatus,
  ClientWithStats,
  Deliverable,
  DeliverableStatus,
  EmpireOSSuggestion,
  Notification,
  Profile,
  Project,
  ProjectAssignment,
  ProjectMetric,
  ProjectStatus,
  ProjectWithClient,
  Service,
  TeamMember,
  TeamMemberStatus,
} from './types';
import type { TypedSupabaseClient } from './client';

type QueryResult<T> = { data: T | null; error: { message: string } | null };

async function unwrap<T>(promise: PromiseLike<QueryResult<T>>): Promise<T> {
  const { data, error } = await promise;
  if (error) {
    throw new Error(error.message);
  }
  if (data === null) {
    throw new Error('Not found');
  }
  return data;
}

async function unwrapNullable<T>(promise: PromiseLike<QueryResult<T>>): Promise<T | null> {
  const { data, error } = await promise;
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// ---------------------------------------------------------------------
// Profiles / users
// ---------------------------------------------------------------------
export async function getProfile(supabase: TypedSupabaseClient, userId: string): Promise<Profile | null> {
  return unwrapNullable<Profile>(
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
  );
}

export async function updateProfile(
  supabase: TypedSupabaseClient,
  userId: string,
  patch: Partial<Pick<Profile, 'name' | 'avatar_url' | 'role' | 'subscription_tier' | 'ghl_contact_id'>>,
): Promise<Profile> {
  return unwrap<Profile>(
    supabase.from('profiles').update(patch).eq('id', userId).select().single(),
  );
}

export async function recordLogin(supabase: TypedSupabaseClient, userId: string): Promise<void> {
  await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', userId);
}

export const getUser = getProfile;

// ---------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------
export async function listServices(supabase: TypedSupabaseClient): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Service[];
}

// ---------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------
export interface ListClientsOptions {
  status?: ClientStatus;
  search?: string;
  limit?: number;
}

export async function listClients(
  supabase: TypedSupabaseClient,
  userId: string,
  opts: ListClientsOptions = {},
): Promise<Client[]> {
  let query = supabase.from('clients').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.search) {
    const term = `%${opts.search}%`;
    query = query.or(`company_name.ilike.${term},contact_email.ilike.${term},industry.ilike.${term}`);
  }
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function getClient(supabase: TypedSupabaseClient, clientId: string): Promise<Client | null> {
  return unwrapNullable<Client>(
    supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
  );
}

export async function createClient(
  supabase: TypedSupabaseClient,
  userId: string,
  input: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'ghl_client_id'> & {
    ghl_client_id?: string | null;
  },
): Promise<Client> {
  return unwrap<Client>(
    supabase
      .from('clients')
      .insert({ ...input, user_id: userId })
      .select()
      .single(),
  );
}

export async function updateClient(
  supabase: TypedSupabaseClient,
  clientId: string,
  patch: Partial<Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<Client> {
  return unwrap<Client>(
    supabase.from('clients').update(patch).eq('id', clientId).select().single(),
  );
}

export async function deleteClient(supabase: TypedSupabaseClient, clientId: string): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) throw new Error(error.message);
}

export async function getClientStats(
  supabase: TypedSupabaseClient,
  clientId: string,
): Promise<{ project_count: number; active_projects: number; total_revenue: number; total_budget: number }> {
  const { data, error } = await supabase
    .from('projects')
    .select('status,budget,spent')
    .eq('client_id', clientId);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Pick<Project, 'status' | 'budget' | 'spent'>[];
  return {
    project_count: rows.length,
    active_projects: rows.filter((r) => r.status === 'active').length,
    total_budget: rows.reduce((sum, r) => sum + Number(r.budget || 0), 0),
    total_revenue: rows.reduce((sum, r) => sum + Number(r.spent || 0), 0),
  };
}

export async function listClientsWithStats(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<ClientWithStats[]> {
  const clients = await listClients(supabase, userId);
  const stats = await Promise.all(clients.map((c) => getClientStats(supabase, c.id)));
  return clients.map((c, i) => ({ ...c, ...stats[i]! }));
}

// ---------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------
export interface ListProjectsOptions {
  status?: ProjectStatus;
  clientId?: string;
  search?: string;
  limit?: number;
  withClient?: boolean;
}

export async function listProjects(
  supabase: TypedSupabaseClient,
  userId: string,
  opts: ListProjectsOptions = {},
): Promise<ProjectWithClient[]> {
  const selectExpr = opts.withClient
    ? '*, client:clients(id, company_name)'
    : '*';
  let query = supabase
    .from('projects')
    .select(selectExpr)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.clientId) query = query.eq('client_id', opts.clientId);
  if (opts.search) query = query.ilike('name', `%${opts.search}%`);
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ProjectWithClient[];
}

export async function getProject(supabase: TypedSupabaseClient, projectId: string): Promise<ProjectWithClient | null> {
  return unwrapNullable<ProjectWithClient>(
    supabase
      .from('projects')
      .select('*, client:clients(id, company_name)')
      .eq('id', projectId)
      .maybeSingle() as unknown as Promise<{ data: ProjectWithClient | null; error: { message: string } | null }>,
  );
}

export async function createProject(
  supabase: TypedSupabaseClient,
  userId: string,
  input: Omit<Project, 'id' | 'user_id' | 'spent' | 'created_at' | 'updated_at'>,
): Promise<Project> {
  return unwrap<Project>(
    supabase
      .from('projects')
      .insert({ ...input, user_id: userId, spent: 0 })
      .select()
      .single(),
  );
}

export async function updateProject(
  supabase: TypedSupabaseClient,
  projectId: string,
  patch: Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
): Promise<Project> {
  return unwrap<Project>(
    supabase.from('projects').update(patch).eq('id', projectId).select().single(),
  );
}

export async function deleteProject(supabase: TypedSupabaseClient, projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw new Error(error.message);
}

export async function listProjectMetrics(
  supabase: TypedSupabaseClient,
  projectId: string,
  opts: { from?: string; to?: string; metricType?: string } = {},
): Promise<ProjectMetric[]> {
  let query = supabase
    .from('project_metrics')
    .select('*')
    .eq('project_id', projectId)
    .order('metric_date', { ascending: true });
  if (opts.from) query = query.gte('metric_date', opts.from);
  if (opts.to) query = query.lte('metric_date', opts.to);
  if (opts.metricType) query = query.eq('metric_type', opts.metricType);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectMetric[];
}

// ---------------------------------------------------------------------
// Deliverables
// ---------------------------------------------------------------------
export async function listDeliverables(supabase: TypedSupabaseClient, projectId: string): Promise<Deliverable[]> {
  const { data, error } = await supabase
    .from('deliverables')
    .select('*')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Deliverable[];
}

export async function getDeliverable(supabase: TypedSupabaseClient, deliverableId: string): Promise<Deliverable | null> {
  return unwrapNullable<Deliverable>(
    supabase.from('deliverables').select('*').eq('id', deliverableId).maybeSingle(),
  );
}

export async function createDeliverable(
  supabase: TypedSupabaseClient,
  input: Omit<Deliverable, 'id' | 'created_at' | 'updated_at' | 'completed_date' | 'file_urls'> & {
    file_urls?: string[];
    completed_date?: string | null;
  },
): Promise<Deliverable> {
  return unwrap<Deliverable>(
    supabase
      .from('deliverables')
      .insert({ ...input, file_urls: input.file_urls ?? [] })
      .select()
      .single(),
  );
}

export async function updateDeliverable(
  supabase: TypedSupabaseClient,
  deliverableId: string,
  patch: Partial<Omit<Deliverable, 'id' | 'project_id' | 'created_at' | 'updated_at'>>,
): Promise<Deliverable> {
  const finalPatch: Partial<Deliverable> = { ...patch };
  if (patch.status === 'completed' || patch.status === 'approved') {
    finalPatch.completed_date = finalPatch.completed_date ?? new Date().toISOString().slice(0, 10);
  }
  return unwrap<Deliverable>(
    supabase.from('deliverables').update(finalPatch).eq('id', deliverableId).select().single(),
  );
}

export async function deleteDeliverable(supabase: TypedSupabaseClient, deliverableId: string): Promise<void> {
  const { error } = await supabase.from('deliverables').delete().eq('id', deliverableId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------
// Team members
// ---------------------------------------------------------------------
export async function listTeamMembers(
  supabase: TypedSupabaseClient,
  ownerId: string,
  opts: { status?: TeamMemberStatus } = {},
): Promise<TeamMember[]> {
  let query = supabase.from('team_members').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false });
  if (opts.status) query = query.eq('status', opts.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as TeamMember[];
}

export async function getTeamMember(supabase: TypedSupabaseClient, id: string): Promise<TeamMember | null> {
  return unwrapNullable<TeamMember>(
    supabase.from('team_members').select('*').eq('id', id).maybeSingle(),
  );
}

export async function createTeamMember(
  supabase: TypedSupabaseClient,
  input: Omit<TeamMember, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'invite_token' | 'invite_sent_at'> & {
    user_id?: string | null;
    invite_token?: string | null;
    invite_sent_at?: string | null;
  },
): Promise<TeamMember> {
  return unwrap<TeamMember>(
    supabase.from('team_members').insert(input).select().single(),
  );
}

export async function updateTeamMember(
  supabase: TypedSupabaseClient,
  id: string,
  patch: Partial<Omit<TeamMember, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>,
): Promise<TeamMember> {
  return unwrap<TeamMember>(
    supabase.from('team_members').update(patch).eq('id', id).select().single(),
  );
}

export async function deleteTeamMember(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listMemberAssignments(
  supabase: TypedSupabaseClient,
  memberId: string,
): Promise<ProjectAssignment[]> {
  const { data, error } = await supabase
    .from('project_assignments')
    .select('*')
    .eq('team_member_id', memberId)
    .order('assigned_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectAssignment[];
}

export async function getMemberWorkload(
  supabase: TypedSupabaseClient,
  memberId: string,
): Promise<{ active_projects: number; open_deliverables: number; completed_deliverables: number }> {
  const { data: assignments, error: ae } = await supabase
    .from('project_assignments')
    .select('project_id')
    .eq('team_member_id', memberId);
  if (ae) throw new Error(ae.message);
  const projectIds = ((assignments ?? []) as Pick<ProjectAssignment, 'project_id'>[]).map((a) => a.project_id);

  if (projectIds.length === 0) {
    return { active_projects: 0, open_deliverables: 0, completed_deliverables: 0 };
  }

  const [projectsRes, deliverablesRes] = await Promise.all([
    supabase.from('projects').select('id,status').in('id', projectIds),
    supabase.from('deliverables').select('id,status').in('project_id', projectIds),
  ]);
  if (projectsRes.error) throw new Error(projectsRes.error.message);
  if (deliverablesRes.error) throw new Error(deliverablesRes.error.message);

  const projectRows = (projectsRes.data ?? []) as Pick<Project, 'id' | 'status'>[];
  const deliverableRows = (deliverablesRes.data ?? []) as Pick<Deliverable, 'id' | 'status'>[];

  return {
    active_projects: projectRows.filter((p) => p.status === 'active').length,
    open_deliverables: deliverableRows.filter(
      (d) => d.status === 'pending' || d.status === 'in_progress' || d.status === 'under_review',
    ).length,
    completed_deliverables: deliverableRows.filter(
      (d) => d.status === 'completed' || d.status === 'approved',
    ).length,
  };
}

export async function assignMemberToProject(
  supabase: TypedSupabaseClient,
  projectId: string,
  teamMemberId: string,
): Promise<ProjectAssignment> {
  return unwrap<ProjectAssignment>(
    supabase
      .from('project_assignments')
      .upsert({ project_id: projectId, team_member_id: teamMemberId }, { onConflict: 'project_id,team_member_id' })
      .select()
      .single(),
  );
}

export async function unassignMemberFromProject(
  supabase: TypedSupabaseClient,
  projectId: string,
  teamMemberId: string,
): Promise<void> {
  const { error } = await supabase
    .from('project_assignments')
    .delete()
    .eq('project_id', projectId)
    .eq('team_member_id', teamMemberId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------
export async function listNotifications(
  supabase: TypedSupabaseClient,
  userId: string,
  opts: { limit?: number; unreadOnly?: boolean } = {},
): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('sent_at', { ascending: false });
  if (opts.unreadOnly) query = query.eq('is_read', false);
  query = query.limit(opts.limit ?? 50);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Notification[];
}

export async function createNotification(
  supabase: TypedSupabaseClient,
  input: Omit<Notification, 'id' | 'created_at' | 'sent_at' | 'is_read' | 'sent_via' | 'meta' | 'ghl_message_id' | 'link' | 'message'> & {
    sent_via?: string[];
    meta?: Record<string, unknown>;
    message?: string | null;
    link?: string | null;
    ghl_message_id?: string | null;
  },
): Promise<Notification> {
  return unwrap<Notification>(
    supabase
      .from('notifications')
      .insert({
        ...input,
        sent_via: input.sent_via ?? ['in_app'],
        meta: input.meta ?? {},
      })
      .select()
      .single(),
  );
}

export async function markNotificationRead(supabase: TypedSupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------
// Dashboard aggregates
// ---------------------------------------------------------------------
export interface DashboardSummary {
  clients_total: number;
  clients_active: number;
  projects_total: number;
  projects_active: number;
  team_members_active: number;
  revenue_total: number;
  revenue_last_30_days: number;
  pipeline_value: number;
}

export async function getDashboardSummary(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<DashboardSummary> {
  const [clientsRes, projectsRes, teamRes] = await Promise.all([
    supabase.from('clients').select('id,status').eq('user_id', userId),
    supabase.from('projects').select('id,status,budget,spent,start_date').eq('user_id', userId),
    supabase.from('team_members').select('id,status').eq('owner_id', userId),
  ]);
  if (clientsRes.error) throw new Error(clientsRes.error.message);
  if (projectsRes.error) throw new Error(projectsRes.error.message);
  if (teamRes.error) throw new Error(teamRes.error.message);

  const clients = (clientsRes.data ?? []) as Pick<Client, 'id' | 'status'>[];
  const projects = (projectsRes.data ?? []) as Pick<Project, 'id' | 'status' | 'budget' | 'spent' | 'start_date'>[];
  const team = (teamRes.data ?? []) as Pick<TeamMember, 'id' | 'status'>[];

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString().slice(0, 10);

  return {
    clients_total: clients.length,
    clients_active: clients.filter((c) => c.status === 'active').length,
    projects_total: projects.length,
    projects_active: projects.filter((p) => p.status === 'active' || p.status === 'in_review').length,
    team_members_active: team.filter((t) => t.status === 'active').length,
    revenue_total: projects.reduce((s, p) => s + Number(p.spent || 0), 0),
    revenue_last_30_days: projects
      .filter((p) => p.start_date && p.start_date >= sinceIso)
      .reduce((s, p) => s + Number(p.spent || 0), 0),
    pipeline_value: projects
      .filter((p) => p.status === 'planning' || p.status === 'active')
      .reduce((s, p) => s + Math.max(Number(p.budget || 0) - Number(p.spent || 0), 0), 0),
  };
}

export async function getRevenueTrend(
  supabase: TypedSupabaseClient,
  userId: string,
  days = 90,
): Promise<{ date: string; revenue: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('projects')
    .select('start_date,spent')
    .eq('user_id', userId)
    .gte('start_date', sinceIso);
  if (error) throw new Error(error.message);

  const buckets = new Map<string, number>();
  for (let i = 0; i <= days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of (data ?? []) as Pick<Project, 'start_date' | 'spent'>[]) {
    if (!row.start_date) continue;
    const key = row.start_date.slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + Number(row.spent || 0));
  }
  return Array.from(buckets.entries()).map(([date, revenue]) => ({ date, revenue }));
}

export async function getServiceBreakdown(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<{ service: string; count: number; revenue: number }[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('service_type,spent')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  const map = new Map<string, { count: number; revenue: number }>();
  for (const row of (data ?? []) as Pick<Project, 'service_type' | 'spent'>[]) {
    const key = row.service_type || 'Other';
    const current = map.get(key) ?? { count: 0, revenue: 0 };
    map.set(key, { count: current.count + 1, revenue: current.revenue + Number(row.spent || 0) });
  }
  return Array.from(map.entries()).map(([service, v]) => ({ service, ...v }));
}

export async function getRecentActivity(
  supabase: TypedSupabaseClient,
  userId: string,
  limit = 10,
): Promise<Notification[]> {
  return listNotifications(supabase, userId, { limit });
}

// ---------------------------------------------------------------------
// Empire OS suggestions  (stubbed for Phase 0/1; real generation in P2)
// ---------------------------------------------------------------------
export async function listSuggestions(
  supabase: TypedSupabaseClient,
  projectId: string,
): Promise<EmpireOSSuggestion[]> {
  const { data, error } = await supabase
    .from('empire_os_suggestions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as EmpireOSSuggestion[];
}
