// =====================================================================
// /api/cron/monthly
//
// Runs once a month (default: 1st @ 08:00 UTC). Two things:
//   1. Enqueue a monthly Empire OS review job per active project.
//   2. Notify users whose billing is still past_due / unpaid (final
//      reminder before downgrading).
//
// Schedule in vercel.json: "0 8 1 * *"
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/db/client';
import type { Billing, Project } from '@/lib/db/types';
import { withErrorHandler } from '@/lib/error-handler';
import { authorizeCronRequest, withCronRun } from '@/lib/cron/runner';
import { sendNotification } from '@/lib/notifications/dispatcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface MonthlyStats extends Record<string, unknown> {
  empire_os_jobs_enqueued: number;
  billing_reminders: number;
}

async function enqueueMonthlyReviews(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<number> {
  // Find every active project. For each, drop one "monthly_review" job
  // into empire_os_job_queue if there isn't already one pending/running.
  const { data: rows } = await supabase
    .from('projects')
    .select('id, user_id, status')
    .eq('status', 'active');
  let enqueued = 0;
  for (const project of (rows ?? []) as Pick<Project, 'id' | 'user_id' | 'status'>[]) {
    const { data: existing } = await supabase
      .from('empire_os_job_queue')
      .select('id')
      .eq('project_id', project.id)
      .eq('event_type', 'monthly_review')
      .in('status', ['pending', 'running'])
      .limit(1);
    if (existing && existing.length > 0) continue;
    const { error } = await supabase.from('empire_os_job_queue').insert({
      user_id: project.user_id,
      project_id: project.id,
      event_type: 'monthly_review',
      skill_slug: 'analytics',
      payload: {},
      priority: 5,
      status: 'pending',
      attempts: 0,
      max_attempts: 3,
      next_attempt_at: new Date().toISOString(),
    });
    if (!error) enqueued += 1;
  }
  return enqueued;
}

async function remindPastDue(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<number> {
  const { data: rows } = await supabase
    .from('billing')
    .select('*')
    .in('status', ['past_due', 'unpaid']);
  let sent = 0;
  for (const row of (rows ?? []) as Billing[]) {
    await sendNotification({
      userId: row.user_id,
      type: 'billing.monthly_reminder',
      category: 'billing',
      priority: 'urgent',
      title: 'Action required: payment overdue',
      message:
        'Your subscription is overdue. Add a payment method or downgrade to keep your account active.',
      actionUrl: '/dashboard/billing',
      actionLabel: 'Update billing',
      forceEmail: true,
      data: { billing_id: row.id, status: row.status, dedup_key: `monthly:${row.id}` },
    });
    sent += 1;
  }
  return sent;
}

async function run(): Promise<MonthlyStats> {
  const supabase = createServiceClient();
  const [enqueued, reminders] = await Promise.all([
    enqueueMonthlyReviews(supabase),
    remindPastDue(supabase),
  ]);
  return { empire_os_jobs_enqueued: enqueued, billing_reminders: reminders };
}

export const GET = withErrorHandler('api.cron.monthly.GET', async (req: NextRequest) => {
  authorizeCronRequest(req);
  const result = await withCronRun<MonthlyStats>('monthly', run);
  return NextResponse.json(result);
});

export const POST = GET;
