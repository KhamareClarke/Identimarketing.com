// =====================================================================
// /api/cron/weekly
//
// Runs Monday 08:00 UTC. For every user that opted in
// (notification_preferences.weekly_summary = true), summarise the
// previous 7 days as an in-app notification + email.
//
// Schedule in vercel.json: "0 8 * * 1"
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/db/client';
import type { Profile } from '@/lib/db/types';
import { withErrorHandler } from '@/lib/error-handler';
import { authorizeCronRequest, withCronRun } from '@/lib/cron/runner';
import { sendNotification } from '@/lib/notifications/dispatcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface WeeklyStats extends Record<string, unknown> {
  users_eligible: number;
  summaries_sent: number;
}

async function countNew(
  supabase: ReturnType<typeof createServiceClient>,
  table: string,
  userId: string,
  sinceIso: string,
): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sinceIso);
  return count ?? 0;
}

async function run(): Promise<WeeklyStats> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('weekly_summary', true);
  const userIds = ((prefs ?? []) as { user_id: string }[]).map((p) => p.user_id);

  let sent = 0;
  for (const userId of userIds) {
    const [clients, projects, completedDeliverables, suggestions] = await Promise.all([
      countNew(supabase, 'clients', userId, since),
      countNew(supabase, 'projects', userId, since),
      (async () => {
        const { count } = await supabase
          .from('deliverables')
          .select('id, projects!inner(user_id)', { count: 'exact', head: true })
          .eq('projects.user_id', userId)
          .eq('status', 'completed')
          .gte('completed_at', since);
        return count ?? 0;
      })(),
      countNew(supabase, 'empire_os_suggestions', userId, since),
    ]);

    // Skip users with zero activity.
    if (clients + projects + completedDeliverables + suggestions === 0) continue;

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .maybeSingle();
    const p = profile as Pick<Profile, 'email' | 'name'> | null;
    if (!p?.email) continue;

    const lines: string[] = [];
    if (clients) lines.push(`- ${clients} new client${clients === 1 ? '' : 's'}`);
    if (projects) lines.push(`- ${projects} new project${projects === 1 ? '' : 's'}`);
    if (completedDeliverables)
      lines.push(`- ${completedDeliverables} deliverable${completedDeliverables === 1 ? '' : 's'} completed`);
    if (suggestions)
      lines.push(`- ${suggestions} Empire OS recommendation${suggestions === 1 ? '' : 's'}`);

    await sendNotification({
      userId,
      type: 'system.weekly_summary',
      category: 'system',
      priority: 'low',
      title: 'Your week in review',
      message: lines.join('\n'),
      actionUrl: '/dashboard',
      actionLabel: 'Open dashboard',
      data: { clients, projects, completedDeliverables, suggestions },
    });
    sent += 1;
  }

  return { users_eligible: userIds.length, summaries_sent: sent };
}

export const GET = withErrorHandler('api.cron.weekly.GET', async (req: NextRequest) => {
  authorizeCronRequest(req);
  const result = await withCronRun<WeeklyStats>('weekly', run);
  return NextResponse.json(result);
});

export const POST = GET;
