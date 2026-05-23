// =====================================================================
// /api/cron/daily
//
// Runs once a day (default: 08:00 UTC). For every user that opted in
// (notification_preferences.daily_digest = true), build a digest of the
// last 24h and send a single email.
//
// Schedule in vercel.json: "0 8 * * *"
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/db/client';
import type { Notification, Profile } from '@/lib/db/types';
import { sendMail } from '@/lib/email';
import { withErrorHandler } from '@/lib/error-handler';
import { authorizeCronRequest, withCronRun } from '@/lib/cron/runner';
import { logger } from '@/lib/logging';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface DailyStats extends Record<string, unknown> {
  users_eligible: number;
  digests_sent: number;
  digests_failed: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDigestHtml(name: string, notifications: Notification[]): string {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const dashboardUrl = `${APP_URL.replace(/\/$/, '')}/dashboard/notifications`;
  const rows = notifications
    .map((n) => {
      const link = n.action_url
        ? `<a href="${escapeHtml(/^https?:/.test(n.action_url) ? n.action_url : APP_URL + n.action_url)}" style="color:#6366f1;">${escapeHtml(n.action_label ?? 'Open')}</a>`
        : '';
      return `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          <div style="font-weight:600;color:#111827;">${escapeHtml(n.title)}</div>
          ${n.message ? `<div style="color:#374151;font-size:13px;margin-top:2px;">${escapeHtml(n.message)}</div>` : ''}
          <div style="color:#9ca3af;font-size:11px;margin-top:4px;">${escapeHtml(n.category)} - ${escapeHtml(n.priority)}${link ? ' - ' + link : ''}</div>
        </td>
      </tr>`;
    })
    .join('');
  return `
<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;padding:32px 12px;color:#111;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <p style="margin:0 0 4px;font-size:13px;color:#6b7280;letter-spacing:0.05em;text-transform:uppercase;">Identimarketing</p>
    <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Your daily digest</h1>
    <p style="margin:0 0 16px;color:#374151;">Hi ${escapeHtml(name)}, here&apos;s what happened in the last 24 hours.</p>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
      <a href="${escapeHtml(dashboardUrl)}" style="color:#6366f1;">Open dashboard</a>
      &nbsp;-&nbsp;
      <a href="${escapeHtml(dashboardUrl)}/preferences" style="color:#6366f1;">Notification preferences</a>
    </p>
  </div>
</body></html>`;
}

async function run(): Promise<DailyStats> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Find users who opted in to daily digests.
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('user_id, email_enabled')
    .eq('daily_digest', true)
    .eq('email_enabled', true);

  const userIds = ((prefs ?? []) as { user_id: string }[]).map((p) => p.user_id);
  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('sent_at', since)
      .order('priority', { ascending: true })
      .order('sent_at', { ascending: false })
      .limit(30);
    if (!notifications || notifications.length === 0) continue;

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .maybeSingle();
    const p = profile as Pick<Profile, 'email' | 'name'> | null;
    if (!p?.email) continue;

    const html = buildDigestHtml(p.name || p.email.split('@')[0], notifications as Notification[]);
    const result = await sendMail({
      to: p.email,
      subject: `Your Identimarketing digest (${(notifications as Notification[]).length} updates)`,
      html,
    });
    if (result.success) {
      sent += 1;
    } else {
      failed += 1;
      logger.warn('daily digest failed', { userId, err: result.error });
    }
  }

  return { users_eligible: userIds.length, digests_sent: sent, digests_failed: failed };
}

export const GET = withErrorHandler('api.cron.daily.GET', async (req: NextRequest) => {
  authorizeCronRequest(req);
  const result = await withCronRun<DailyStats>('daily', run);
  return NextResponse.json(result);
});

export const POST = GET;
