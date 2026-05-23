// =====================================================================
// /api/cron/hourly
//
// Runs every hour. Generates time-sensitive alerts:
//   - Deliverables due in the next 24h (one alert per deliverable, dedup
//     by checking notifications.data->>deliverable_id).
//   - Deliverables past due that are still pending/in_progress.
//   - Billing with status in (past_due, unpaid) - payment-failed alert.
//   - Subscriptions ending in <= 3 days (cancel_at_period_end).
//
// Configure with Vercel Cron: schedule "0 * * * *"
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/db/client';
import type { Billing, Deliverable, Project } from '@/lib/db/types';
import { withErrorHandler } from '@/lib/error-handler';
import { authorizeCronRequest, withCronRun } from '@/lib/cron/runner';
import { sendNotification } from '@/lib/notifications/dispatcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface HourlyStats extends Record<string, unknown> {
  deliverable_due_alerts: number;
  deliverable_overdue_alerts: number;
  payment_failed_alerts: number;
  cancel_soon_alerts: number;
}

async function alertOnceFor(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  type: string,
  key: string,
  windowHours: number,
): Promise<boolean> {
  // Return true when no recent identical alert exists (so the caller should send).
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('sent_at', since)
    .contains('data', { dedup_key: key })
    .limit(1);
  return !data || data.length === 0;
}

function hoursUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (t - Date.now()) / (60 * 60 * 1000);
}

async function scanDeliverables(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ due: number; overdue: number }> {
  let due = 0;
  let overdue = 0;
  const horizon = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: rows } = await supabase
    .from('deliverables')
    .select('id, name, status, due_date, project_id, projects:projects(id, name, user_id)')
    .lte('due_date', horizon)
    .in('status', ['pending', 'in_progress', 'under_review']);

  type Row = Pick<Deliverable, 'id' | 'name' | 'status' | 'due_date' | 'project_id'> & {
    projects:
      | Pick<Project, 'id' | 'name' | 'user_id'>
      | Array<Pick<Project, 'id' | 'name' | 'user_id'>>
      | null;
  };
  for (const row of (rows ?? []) as unknown as Row[]) {
    const project = Array.isArray(row.projects) ? row.projects[0] ?? null : row.projects;
    if (!project) continue;
    const hours = hoursUntil(row.due_date);
    if (hours === null) continue;
    const dedupKey = `deliverable:${row.id}:${hours < 0 ? 'overdue' : 'due'}`;
    const shouldSend = await alertOnceFor(
      supabase,
      project.user_id,
      hours < 0 ? 'deliverable.overdue' : 'deliverable.due_soon',
      dedupKey,
      24,
    );
    if (!shouldSend) continue;

    if (hours < 0) {
      overdue += 1;
      await sendNotification({
        userId: project.user_id,
        type: 'deliverable.overdue',
        category: 'project',
        priority: 'high',
        title: `Deliverable overdue: ${row.name}`,
        message: `"${row.name}" on project ${project.name} was due ${formatRelative(row.due_date)}.`,
        actionUrl: `/dashboard/projects/${project.id}/deliverables`,
        actionLabel: 'Review deliverable',
        data: { deliverable_id: row.id, project_id: project.id, dedup_key: dedupKey },
      });
    } else if (hours <= 24) {
      due += 1;
      await sendNotification({
        userId: project.user_id,
        type: 'deliverable.due_soon',
        category: 'project',
        priority: hours <= 4 ? 'high' : 'normal',
        title: `Due ${formatRelative(row.due_date)}: ${row.name}`,
        message: `Deliverable "${row.name}" on ${project.name} is due soon.`,
        actionUrl: `/dashboard/projects/${project.id}/deliverables`,
        actionLabel: 'Open',
        data: { deliverable_id: row.id, project_id: project.id, dedup_key: dedupKey },
      });
    }
  }
  return { due, overdue };
}

async function scanBilling(
  supabase: ReturnType<typeof createServiceClient>,
): Promise<{ payment: number; cancelSoon: number }> {
  let payment = 0;
  let cancelSoon = 0;
  const { data: rows } = await supabase
    .from('billing')
    .select('*')
    .in('status', ['past_due', 'unpaid']);
  for (const row of (rows ?? []) as Billing[]) {
    const dedupKey = `billing:payment_failed:${row.id}`;
    const should = await alertOnceFor(supabase, row.user_id, 'billing.payment_failed', dedupKey, 24);
    if (!should) continue;
    payment += 1;
    await sendNotification({
      userId: row.user_id,
      type: 'billing.payment_failed',
      category: 'billing',
      priority: 'urgent',
      title: 'Payment failed',
      message:
        'Your most recent payment failed. Update your payment method to keep your subscription active.',
      actionUrl: '/dashboard/billing',
      actionLabel: 'Update payment method',
      forceEmail: true,
      data: { dedup_key: dedupKey, status: row.status },
    });
  }

  // cancel_at_period_end + period_end <= 3 days from now -> reminder
  const horizon = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: cancelRows } = await supabase
    .from('billing')
    .select('*')
    .eq('cancel_at_period_end', true)
    .lte('current_period_end', horizon)
    .gte('current_period_end', new Date().toISOString());
  for (const row of (cancelRows ?? []) as Billing[]) {
    const dedupKey = `billing:cancel_soon:${row.id}`;
    const should = await alertOnceFor(supabase, row.user_id, 'billing.cancel_soon', dedupKey, 24);
    if (!should) continue;
    cancelSoon += 1;
    await sendNotification({
      userId: row.user_id,
      type: 'billing.cancel_soon',
      category: 'billing',
      priority: 'high',
      title: 'Subscription ends soon',
      message: `Your subscription ends ${formatRelative(row.current_period_end)}. Reactivate to keep your team running.`,
      actionUrl: '/dashboard/billing',
      actionLabel: 'Reactivate',
      data: { dedup_key: dedupKey },
    });
  }
  return { payment, cancelSoon };
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'soon';
  const t = new Date(iso).getTime();
  const diff = t - Date.now();
  const abs = Math.abs(diff);
  const days = Math.round(abs / (24 * 60 * 60 * 1000));
  const hours = Math.round(abs / (60 * 60 * 1000));
  if (diff < 0) return days >= 1 ? `${days}d ago` : `${hours}h ago`;
  return days >= 1 ? `in ${days}d` : `in ${hours}h`;
}

async function run(): Promise<HourlyStats> {
  const supabase = createServiceClient();
  const [deliverableStats, billingStats] = await Promise.all([
    scanDeliverables(supabase),
    scanBilling(supabase),
  ]);
  return {
    deliverable_due_alerts: deliverableStats.due,
    deliverable_overdue_alerts: deliverableStats.overdue,
    payment_failed_alerts: billingStats.payment,
    cancel_soon_alerts: billingStats.cancelSoon,
  };
}

export const GET = withErrorHandler('api.cron.hourly.GET', async (req: NextRequest) => {
  authorizeCronRequest(req);
  const result = await withCronRun<HourlyStats>('hourly', run);
  return NextResponse.json(result);
});

export const POST = GET;
