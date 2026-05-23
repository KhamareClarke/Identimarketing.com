// =====================================================================
// GET /api/cron/empire-os-analysis
//
// CRON_SECRET-gated worker that:
//   1. Picks up to N pending jobs from empire_os_job_queue
//   2. Runs each skill via runSkill()
//   3. Marks the job completed/failed with backoff on retriable failures
//
// Configure in vercel.json. Also callable from GitHub Actions:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron/empire-os-analysis
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/db/client';
import type { EmpireOSJob, EmpireOSSettings, ProjectStatus } from '@/lib/db/types';
import { getProjectContextBundle } from '@/lib/empire-os/event-system';
import { runSkill, type SkillRunResult } from '@/lib/empire-os/skills';
import { errors, withErrorHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logging';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const BATCH_SIZE = 8;
const LOCK_MINUTES = 5;

function authorize(req: NextRequest): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw errors.serverError('CRON_SECRET is not set. The cron worker is disabled.');
  }
  const header = req.headers.get('authorization') || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : req.nextUrl.searchParams.get('secret');
  if (provided !== secret) {
    throw errors.unauthorized('Invalid cron secret.');
  }
}

async function fetchSettings(supabase: ReturnType<typeof createServiceClient>, userId: string): Promise<EmpireOSSettings | null> {
  const { data } = await supabase.from('empire_os_settings').select('*').eq('user_id', userId).maybeSingle();
  return (data ?? null) as EmpireOSSettings | null;
}

async function processJob(
  supabase: ReturnType<typeof createServiceClient>,
  job: EmpireOSJob,
): Promise<{ ok: boolean; error?: string; result?: SkillRunResult }> {
  try {
    const settings = await fetchSettings(supabase, job.user_id);
    const ctx = await getProjectContextBundle(supabase, {
      projectId: job.project_id,
      userId: job.user_id,
    });
    const result = await runSkill({
      skillSlug: job.skill_slug,
      context: ctx,
      userId: job.user_id,
      eventType: job.event_type,
      budgetUsd: settings?.hourly_budget_usd ?? null,
      tier: job.event_type === 'monthly_review' ? 'bulk' : 'analysis',
    });

    let resultSuggestionId: string | null = null;
    if (result.ok && result.output && job.project_id) {
      const { data: inserted, error } = await supabase
        .from('empire_os_suggestions')
        .insert({
          project_id: job.project_id,
          user_id: job.user_id,
          skill_name: result.skillName,
          event_type: job.event_type,
          recommendation_type: result.output.recommendation_type,
          title: result.output.title,
          suggestion_text: result.output.summary,
          recommendation: result.output.recommendation,
          confidence_score: Math.round(result.output.confidence_score),
          impact_score: Math.round(result.output.impact_score),
          estimated_time_minutes: result.output.estimated_time_minutes ?? null,
          estimated_value: result.output.estimated_value ?? null,
          action_steps: result.output.action_steps,
          auto_executable: Boolean(result.output.auto_executable),
          status: 'pending',
        })
        .select('id')
        .single();
      if (error) {
        return { ok: false, error: `persist: ${error.message}`, result };
      }
      resultSuggestionId = (inserted as { id: string } | null)?.id ?? null;
    }

    await supabase
      .from('empire_os_job_queue')
      .update({
        status: result.ok ? 'completed' : 'failed',
        attempts: job.attempts + 1,
        last_error: result.error ?? null,
        result_suggestion_id: resultSuggestionId,
        locked_until: null,
      })
      .eq('id', job.id);

    return { ok: result.ok, error: result.error, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

async function claimBatch(supabase: ReturnType<typeof createServiceClient>): Promise<EmpireOSJob[]> {
  const now = new Date();
  const lockUntil = new Date(now.getTime() + LOCK_MINUTES * 60_000).toISOString();
  const { data: candidates, error } = await supabase
    .from('empire_os_job_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('next_attempt_at', now.toISOString())
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);
  if (error) throw new Error(error.message);
  const jobs: EmpireOSJob[] = [];
  for (const candidate of (candidates ?? []) as EmpireOSJob[]) {
    const { data: locked, error: lockErr } = await supabase
      .from('empire_os_job_queue')
      .update({ status: 'running', locked_until: lockUntil, attempts: candidate.attempts + 1 })
      .eq('id', candidate.id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle();
    if (lockErr) {
      logger.warn('cron: lock attempt failed', { id: candidate.id, err: lockErr.message });
      continue;
    }
    if (locked) jobs.push(locked as EmpireOSJob);
  }
  return jobs;
}

async function backoffFailed(
  supabase: ReturnType<typeof createServiceClient>,
  job: EmpireOSJob,
  error: string,
): Promise<void> {
  const attempts = job.attempts + 1;
  if (attempts >= job.max_attempts) {
    await supabase
      .from('empire_os_job_queue')
      .update({ status: 'failed', last_error: error, locked_until: null, attempts })
      .eq('id', job.id);
    return;
  }
  const next = new Date(Date.now() + Math.min(30, 5 * 2 ** attempts) * 60_000).toISOString();
  await supabase
    .from('empire_os_job_queue')
    .update({
      status: 'pending',
      last_error: error,
      locked_until: null,
      attempts,
      next_attempt_at: next,
    })
    .eq('id', job.id);
}

async function enqueueMonthlyReviews(supabase: ReturnType<typeof createServiceClient>): Promise<number> {
  // Only the first run of the month enqueues to keep cost predictable.
  const today = new Date();
  if (today.getUTCDate() !== 1) return 0;
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, user_id, status')
    .in('status', ['active', 'in_review', 'planning'] as ProjectStatus[]);
  if (error) {
    logger.warn('cron: monthly review project lookup failed', { err: error.message });
    return 0;
  }
  const list = (projects ?? []) as { id: string; user_id: string }[];
  if (list.length === 0) return 0;

  // Only enqueue if there isn't already an open monthly-review job from this month.
  const since = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)).toISOString();
  const { data: existing } = await supabase
    .from('empire_os_job_queue')
    .select('project_id')
    .eq('event_type', 'monthly_review')
    .gte('created_at', since);
  const skip = new Set((existing as { project_id: string }[] | null ?? []).map((r) => r.project_id));

  let inserted = 0;
  for (const project of list) {
    if (skip.has(project.id)) continue;
    const { dispatchEvent } = await import('@/lib/empire-os/event-system');
    await dispatchEvent({
      eventType: 'monthly_review',
      userId: project.user_id,
      projectId: project.id,
      mode: 'queued',
    });
    inserted++;
  }
  return inserted;
}

async function runCron(req: NextRequest): Promise<NextResponse> {
  authorize(req);
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ success: false, reason: 'ANTHROPIC_API_KEY missing' }, { status: 503 });
  }
  const supabase = createServiceClient();
  const startedAt = Date.now();
  const enqueued = await enqueueMonthlyReviews(supabase).catch((err) => {
    logger.warn('cron: monthly review enqueue failed', { err: err instanceof Error ? err.message : String(err) });
    return 0;
  });

  const jobs = await claimBatch(supabase);
  const outcomes: Array<{ id: string; skill: string; ok: boolean; error?: string }> = [];
  for (const job of jobs) {
    const res = await processJob(supabase, job);
    if (!res.ok) await backoffFailed(supabase, job, res.error ?? 'unknown');
    outcomes.push({ id: job.id, skill: job.skill_slug, ok: res.ok, error: res.error });
  }
  return NextResponse.json({
    success: true,
    durationMs: Date.now() - startedAt,
    monthlyReviewsEnqueued: enqueued,
    processed: outcomes.length,
    outcomes,
  });
}

export const GET = withErrorHandler('api.cron.empire-os-analysis.GET', runCron);
export const POST = withErrorHandler('api.cron.empire-os-analysis.POST', runCron);
