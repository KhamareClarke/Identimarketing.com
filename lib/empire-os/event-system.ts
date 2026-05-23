// =====================================================================
// Identimarketing SaaS - Empire OS event system
//
// Dispatches business events to Empire OS skills.
//
//   dispatchEvent({...}) -> picks inline or queued execution based on
//   the event type and current settings.
//
// Inline path:  runs 1-3 priority skills immediately and persists
// suggestions. Used for events the user is waiting on (client.created,
// project.created, manual_review).
//
// Queued path:  pushes one job per skill into empire_os_job_queue
// and returns a list of job IDs. Used for monthly reviews and bulk
// reanalysis. Drained by /api/cron/empire-os-analysis.
// =====================================================================

import type { TypedSupabaseClient } from '@/lib/db/client';
import { createServiceClient } from '@/lib/db/client';
import {
  getClient as fetchClient,
  getProfile,
  getProject,
  listDeliverables,
  listProjectMetrics,
} from '@/lib/db/queries';
import type {
  Client,
  Deliverable,
  EmpireEventMode,
  EmpireOSSettings,
  EmpireOSSuggestion,
  Profile,
  Project,
  ProjectMetric,
  ProjectWithClient,
} from '@/lib/db/types';
import { logger } from '@/lib/logging';

import { allSlugs } from './skill-registry';
import { runSkills, type SkillRunResult } from './skills';

// ---------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------
export const EMPIRE_EVENTS = [
  'client.created',
  'project.created',
  'project.updated',
  'deliverable.completed',
  'deliverable.status_changed',
  'low_performance_detected',
  'manual_review',
  'monthly_review',
] as const;

export type EmpireEventType = (typeof EMPIRE_EVENTS)[number];

// ---------------------------------------------------------------------
// Event -> default skill map. Spec mapping is preserved verbatim;
// missing skills are filtered against the installed registry inside
// `getSkillsForEvent` so we never dispatch a slug that doesn't exist.
// ---------------------------------------------------------------------
const BASE_MAP: Record<EmpireEventType, string[]> = {
  'client.created': ['onboarding-cro', 'email-sequence', 'copywriting'],
  'project.created': [],
  'project.updated': [],
  'deliverable.completed': ['analytics-tracking', 'ab-test-setup'],
  'deliverable.status_changed': ['analytics-tracking'],
  low_performance_detected: ['page-cro', 'popup-cro', 'paywall-upgrade-cro', 'signup-flow-cro', 'form-cro'],
  manual_review: [],
  monthly_review: [], // resolved to all-skills at runtime
};

const SERVICE_MAP: Record<string, string[]> = {
  seo: ['seo-audit', 'ai-seo', 'programmatic-seo', 'schema-markup'],
  content: ['copywriting', 'content-strategy', 'email-sequence', 'cold-email'],
  ads: ['paid-ads', 'ad-creative', 'page-cro', 'ab-test-setup'],
  paid_ads: ['paid-ads', 'ad-creative', 'page-cro', 'ab-test-setup'],
  social: ['social-content', 'marketing-ideas', 'marketing-psychology'],
  email: ['email-sequence', 'cold-email', 'copywriting'],
  design: ['ad-creative', 'page-cro'],
  cro: ['page-cro', 'popup-cro', 'form-cro', 'signup-flow-cro'],
  growth: ['referral-program', 'free-tool-strategy', 'marketing-ideas'],
};

function inferServiceKey(project: Pick<Project, 'service_type'> | null | undefined): string | null {
  if (!project?.service_type) return null;
  const slug = project.service_type.toLowerCase().replace(/[^a-z]/g, '_');
  if (SERVICE_MAP[slug]) return slug;
  for (const key of Object.keys(SERVICE_MAP)) {
    if (slug.includes(key)) return key;
  }
  return null;
}

export async function getSkillsForEvent(
  event: EmpireEventType,
  ctx: { project?: Pick<Project, 'service_type'> | null } = {},
): Promise<string[]> {
  const installed = new Set(await allSlugs());
  let raw: string[];
  if (event === 'monthly_review') {
    raw = await allSlugs();
  } else if (event === 'project.created' || event === 'project.updated' || event === 'manual_review') {
    const key = inferServiceKey(ctx.project ?? null);
    raw = key && SERVICE_MAP[key] ? SERVICE_MAP[key] : ['content-strategy', 'marketing-ideas'];
  } else {
    raw = BASE_MAP[event] ?? [];
  }
  return Array.from(new Set(raw)).filter((slug) => installed.has(slug));
}

// ---------------------------------------------------------------------
// Project context bundle (D6) - shape sent to skills
// ---------------------------------------------------------------------
export interface ProjectContextBundle {
  profile: Pick<Profile, 'id' | 'name' | 'role' | 'subscription_tier'> | null;
  project: ProjectWithClient | null;
  client: Client | null;
  deliverables: Deliverable[];
  metrics: ProjectMetric[];
}

export async function getProjectContextBundle(
  supabase: TypedSupabaseClient,
  opts: { projectId?: string | null; clientId?: string | null; userId: string },
): Promise<ProjectContextBundle> {
  const profile = await getProfile(supabase, opts.userId).catch(() => null);
  const slimProfile = profile
    ? { id: profile.id, name: profile.name, role: profile.role, subscription_tier: profile.subscription_tier }
    : null;

  let project: ProjectWithClient | null = null;
  if (opts.projectId) project = await getProject(supabase, opts.projectId).catch(() => null);

  let client: Client | null = null;
  if (project?.client_id) client = await fetchClient(supabase, project.client_id).catch(() => null);
  else if (opts.clientId) client = await fetchClient(supabase, opts.clientId).catch(() => null);

  const deliverables = project ? await listDeliverables(supabase, project.id).catch(() => []) : [];
  const metrics = project
    ? await listProjectMetrics(supabase, project.id).catch(() => [])
    : [];

  return { profile: slimProfile, project, client, deliverables, metrics };
}

// ---------------------------------------------------------------------
// Settings + event-enabled check
// ---------------------------------------------------------------------
async function getSettings(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<EmpireOSSettings | null> {
  const { data, error } = await supabase
    .from('empire_os_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    logger.warn('empire-os: failed to load settings', { userId, err: error.message });
    return null;
  }
  return (data ?? null) as EmpireOSSettings | null;
}

// ---------------------------------------------------------------------
// dispatchEvent
// ---------------------------------------------------------------------
export interface DispatchInput {
  eventType: EmpireEventType;
  userId: string;
  projectId?: string | null;
  clientId?: string | null;
  payload?: Record<string, unknown>;
  /** Force inline vs queued. If omitted, auto-decided. */
  mode?: EmpireEventMode;
  /** Cap inline skill count (default 3). */
  maxInline?: number;
}

export interface DispatchResult {
  eventId: string;
  mode: EmpireEventMode;
  skills: string[];
  inline: SkillRunResult[];
  queuedJobIds: string[];
  suggestions: EmpireOSSuggestion[];
}

const QUEUED_EVENTS = new Set<EmpireEventType>(['monthly_review']);

export async function dispatchEvent(input: DispatchInput): Promise<DispatchResult> {
  const supabase = createServiceClient();
  const userId = input.userId;
  const startedAt = Date.now();

  const settings = await getSettings(supabase, userId);
  if (settings && !settings.enabled_event_types.includes(input.eventType)) {
    logger.info('empire-os: event disabled in user settings', { event: input.eventType, userId });
    const { data: row } = await supabase
      .from('empire_os_events')
      .insert({
        user_id: userId,
        event_type: input.eventType,
        project_id: input.projectId ?? null,
        client_id: input.clientId ?? null,
        payload: input.payload ?? {},
        skills_dispatched: [],
        mode: 'inline',
        status: 'completed',
        duration_ms: 0,
      })
      .select('id')
      .single();
    return {
      eventId: (row as { id?: string } | null)?.id ?? '',
      mode: 'inline',
      skills: [],
      inline: [],
      queuedJobIds: [],
      suggestions: [],
    };
  }

  const project = input.projectId
    ? await getProject(supabase, input.projectId).catch(() => null)
    : null;
  const skills = await getSkillsForEvent(input.eventType, { project });

  let mode: EmpireEventMode = input.mode ?? (QUEUED_EVENTS.has(input.eventType) ? 'queued' : 'inline');
  const maxInline = Math.max(1, input.maxInline ?? 3);

  // Log the event eagerly so we always have an audit row even on failure.
  const { data: eventRow, error: eventErr } = await supabase
    .from('empire_os_events')
    .insert({
      user_id: userId,
      event_type: input.eventType,
      project_id: input.projectId ?? null,
      client_id: input.clientId ?? null,
      payload: input.payload ?? {},
      skills_dispatched: skills,
      mode,
      status: mode === 'queued' ? 'queued' : 'completed',
      duration_ms: 0,
    })
    .select('id')
    .single();
  if (eventErr) logger.warn('empire-os: event insert failed', { err: eventErr.message });
  const eventId = (eventRow as { id?: string } | null)?.id ?? '';

  if (skills.length === 0) {
    return { eventId, mode, skills, inline: [], queuedJobIds: [], suggestions: [] };
  }

  const inlineSkills: string[] = mode === 'inline' ? skills.slice(0, maxInline) : [];
  const queuedSkills: string[] =
    mode === 'queued' ? skills : mode === 'inline' && skills.length > maxInline ? skills.slice(maxInline) : [];

  // Inline batch
  let inline: SkillRunResult[] = [];
  let suggestions: EmpireOSSuggestion[] = [];
  if (inlineSkills.length > 0) {
    try {
      const ctx = await getProjectContextBundle(supabase, {
        projectId: input.projectId ?? null,
        clientId: input.clientId ?? null,
        userId,
      });
      const runResult = await runSkills({
        skillSlugs: inlineSkills,
        context: ctx,
        userId,
        eventType: input.eventType,
        budgetUsd: settings?.hourly_budget_usd ?? null,
      });
      inline = runResult.results;
      suggestions = runResult.suggestions;
    } catch (err) {
      logger.error('empire-os: inline run failed', {
        eventId,
        err: err instanceof Error ? err.message : String(err),
      });
      if (eventId) {
        await supabase
          .from('empire_os_events')
          .update({
            status: 'failed',
            error: err instanceof Error ? err.message : String(err),
            duration_ms: Date.now() - startedAt,
          })
          .eq('id', eventId);
      }
    }
  }

  // Queue overflow / async skills
  const queuedJobIds: string[] = [];
  if (queuedSkills.length > 0) {
    const rows = queuedSkills.map((slug, idx) => ({
      user_id: userId,
      project_id: input.projectId ?? null,
      event_type: input.eventType,
      skill_slug: slug,
      payload: input.payload ?? {},
      priority: 100 + idx,
      status: 'pending' as const,
    }));
    const { data: inserted, error: queueErr } = await supabase
      .from('empire_os_job_queue')
      .insert(rows)
      .select('id');
    if (queueErr) {
      logger.warn('empire-os: queue insert failed', { err: queueErr.message });
    } else if (inserted) {
      for (const row of inserted as { id: string }[]) queuedJobIds.push(row.id);
    }
    if (mode === 'inline' && inlineSkills.length === 0) mode = 'queued';
  }

  if (eventId) {
    await supabase
      .from('empire_os_events')
      .update({
        mode,
        duration_ms: Date.now() - startedAt,
        status: mode === 'queued' && inlineSkills.length === 0 ? 'queued' : 'completed',
      })
      .eq('id', eventId);
  }

  return { eventId, mode, skills, inline, queuedJobIds, suggestions };
}

/** Fire-and-forget wrapper used by API routes that mustn't block users. */
export function dispatchEventBackground(input: DispatchInput): void {
  void dispatchEvent(input).catch((err) => {
    logger.error('empire-os: background dispatch failed', {
      event: input.eventType,
      err: err instanceof Error ? err.message : String(err),
    });
  });
}
