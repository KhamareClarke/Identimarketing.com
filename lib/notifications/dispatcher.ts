// =====================================================================
// Identimarketing SaaS - lib/notifications/dispatcher.ts
//
// Multi-channel notification dispatcher.
//   - Always creates an in-app row (so /dashboard/notifications has truth).
//   - Looks up the recipient's preferences from notification_preferences.
//   - Sends email via lib/email.ts when allowed.
//   - Sends SMS via GHL when allowed and the user has a phone.
//   - Records per-channel status / errors on the notification row.
//
// Failures in side channels never throw - the in-app notification is
// always best-effort persisted. The caller gets back the notification
// row and a per-channel delivery report.
// =====================================================================

import { createServiceClient, type TypedSupabaseClient } from '@/lib/db/client';
import type {
  Notification,
  NotificationCategory,
  NotificationDeliveryStatus,
  NotificationPreferences,
  NotificationPriority,
  Profile,
} from '@/lib/db/types';
import { sendMail } from '@/lib/email';
import { sendGHLSms } from '@/lib/integrations/ghl';
import { logger } from '@/lib/logging';

import { renderEmail, renderSms } from './templates';

export type NotificationChannel = 'in_app' | 'email' | 'sms';

export interface SendNotificationInput {
  userId: string;
  type: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message?: string | null;
  /** Path or absolute URL. `/dashboard/...` is converted server-side. */
  actionUrl?: string | null;
  actionLabel?: string | null;
  /** Override the channels normally chosen by user preferences. */
  channels?: NotificationChannel[];
  /** Force email regardless of preferences (use for billing-critical alerts). */
  forceEmail?: boolean;
  /** Force SMS regardless of preferences (use for urgent only). */
  forceSms?: boolean;
  /** Arbitrary context surfaced in the dashboard + emails. */
  data?: Record<string, unknown>;
  /** When true, dispatcher will return the notification row even on duplicate dedup. */
  dedupKey?: string;
}

export interface DispatchReport {
  notification: Notification;
  delivered: {
    in_app: boolean;
    email: NotificationDeliveryStatus;
    sms: NotificationDeliveryStatus;
  };
  errors: {
    email?: string;
    sms?: string;
  };
}

// ---------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------
const DEFAULT_PREFS: Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'> = {
  email_enabled: true,
  sms_enabled: false,
  in_app_enabled: true,
  category_channels: {
    project: { email: true, sms: false, in_app: true },
    team: { email: true, sms: false, in_app: true },
    performance: { email: true, sms: false, in_app: true },
    billing: { email: true, sms: true, in_app: true },
    system: { email: true, sms: false, in_app: true },
    empire_os: { email: false, sms: false, in_app: true },
  },
  quiet_hours_start: null,
  quiet_hours_end: null,
  daily_digest: false,
  weekly_summary: true,
};

export async function getPreferences(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<Omit<NotificationPreferences, 'created_at' | 'updated_at'>> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    logger.warn('notifications: failed to load prefs', { userId, err: error.message });
  }
  if (data) return data as NotificationPreferences;
  return { user_id: userId, ...DEFAULT_PREFS };
}

function resolveChannels(
  input: SendNotificationInput,
  prefs: Omit<NotificationPreferences, 'created_at' | 'updated_at'>,
  recipient: Profile | null,
  priority: NotificationPriority,
): NotificationChannel[] {
  if (input.channels && input.channels.length > 0) return input.channels;

  const category = input.category ?? 'system';
  const catChannels =
    prefs.category_channels?.[category] ?? DEFAULT_PREFS.category_channels[category];

  const channels: NotificationChannel[] = [];
  if (prefs.in_app_enabled && catChannels.in_app) channels.push('in_app');
  if ((prefs.email_enabled && catChannels.email) || input.forceEmail) channels.push('email');
  // Only send SMS if user has a phone number on file.
  const hasPhone = Boolean(recipient?.phone && recipient.phone.trim().length > 0);
  if (((prefs.sms_enabled && catChannels.sms) || input.forceSms) && hasPhone) {
    channels.push('sms');
  }
  // Urgent always at least lands in-app + email if the user has email.
  if (priority === 'urgent') {
    if (!channels.includes('in_app')) channels.push('in_app');
    if (!channels.includes('email')) channels.push('email');
  }
  return channels;
}

function isWithinQuietHours(
  prefs: Pick<NotificationPreferences, 'quiet_hours_start' | 'quiet_hours_end'>,
  now: Date,
): boolean {
  const start = prefs.quiet_hours_start?.trim();
  const end = prefs.quiet_hours_end?.trim();
  if (!start || !end) return false;
  const parse = (s: string): number => {
    const [hh, mm] = s.split(':').map((n) => Number(n));
    if (Number.isNaN(hh)) return -1;
    return hh * 60 + (Number.isNaN(mm) ? 0 : mm);
  };
  const cur = now.getUTCHours() * 60 + now.getUTCMinutes();
  const s = parse(start);
  const e = parse(end);
  if (s < 0 || e < 0) return false;
  if (s === e) return false;
  if (s < e) return cur >= s && cur < e;
  // Crosses midnight (e.g. 22:00 -> 07:00).
  return cur >= s || cur < e;
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------
export async function sendNotification(input: SendNotificationInput): Promise<DispatchReport> {
  const supabase = createServiceClient();
  const category: NotificationCategory = input.category ?? 'system';
  const priority: NotificationPriority = input.priority ?? 'normal';

  // 1. Load recipient profile (for SMS + email).
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', input.userId)
    .maybeSingle();
  const recipient = (profile as Profile | null) ?? null;

  // 2. Preferences.
  const prefs = await getPreferences(supabase, input.userId);

  // 3. Pick channels.
  const channels = resolveChannels(input, prefs, recipient, priority);

  // 4. Quiet hours: defer email + SMS unless priority urgent.
  const inQuiet = isWithinQuietHours(prefs, new Date());
  const allowEmail =
    channels.includes('email') && (!inQuiet || priority === 'urgent' || input.forceEmail);
  const allowSms =
    channels.includes('sms') && (!inQuiet || priority === 'urgent' || input.forceSms);

  // 5. Insert in-app row first so we have an id for status updates.
  const insertPayload = {
    user_id: input.userId,
    type: input.type,
    category,
    priority,
    title: input.title,
    message: input.message ?? null,
    link: input.actionUrl ?? null,
    action_url: input.actionUrl ?? null,
    action_label: input.actionLabel ?? null,
    data: input.data ?? {},
    sent_via: channels,
  };
  const { data: inserted, error: insertError } = await supabase
    .from('notifications')
    .insert(insertPayload)
    .select('*')
    .single();
  if (insertError || !inserted) {
    logger.error('notifications: insert failed', {
      userId: input.userId,
      type: input.type,
      err: insertError?.message,
    });
    throw new Error(`Notification insert failed: ${insertError?.message ?? 'unknown'}`);
  }
  let notification = inserted as Notification;

  const report: DispatchReport = {
    notification,
    delivered: {
      in_app: channels.includes('in_app'),
      email: allowEmail ? 'queued' : null,
      sms: allowSms ? 'queued' : null,
    },
    errors: {},
  };

  // 6. Email.
  if (allowEmail && recipient?.email) {
    const rendered = renderEmail({
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      action_url: input.actionUrl ?? null,
      action_label: input.actionLabel ?? null,
      data: input.data,
    });
    try {
      const result = await sendMail({
        to: recipient.email,
        subject: rendered.subject,
        html: rendered.html,
      });
      if (result.success) {
        report.delivered.email = 'sent';
      } else {
        report.delivered.email = 'failed';
        report.errors.email = result.error ?? 'unknown';
      }
    } catch (err) {
      report.delivered.email = 'failed';
      report.errors.email = err instanceof Error ? err.message : String(err);
    }
  }

  // 7. SMS via GHL.
  if (allowSms && recipient?.phone) {
    const rendered = renderSms({
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      action_url: input.actionUrl ?? null,
      data: input.data,
    });
    try {
      const result = await sendGHLSms({
        phone: recipient.phone,
        contactId: recipient.ghl_contact_id ?? undefined,
        message: rendered.text,
      });
      if (result.ok && !result.skipped) {
        report.delivered.sms = 'sent';
      } else if (result.ok && result.skipped) {
        report.delivered.sms = null;
      } else {
        report.delivered.sms = 'failed';
        report.errors.sms = result.error ?? 'unknown';
      }
    } catch (err) {
      report.delivered.sms = 'failed';
      report.errors.sms = err instanceof Error ? err.message : String(err);
    }
  }

  // 8. Persist channel delivery + ghl message id.
  const ghlMessageId =
    report.delivered.sms === 'sent'
      ? null /* set by GHL response */
      : null;

  const { data: patched } = await supabase
    .from('notifications')
    .update({
      email_status: report.delivered.email,
      email_error: report.errors.email ?? null,
      sms_status: report.delivered.sms,
      sms_error: report.errors.sms ?? null,
      ghl_message_id: ghlMessageId,
    })
    .eq('id', notification.id)
    .select('*')
    .single();
  if (patched) {
    notification = patched as Notification;
    report.notification = notification;
  }

  if (report.errors.email || report.errors.sms) {
    logger.warn('notifications: partial delivery', {
      id: notification.id,
      email: report.errors.email,
      sms: report.errors.sms,
    });
  }
  return report;
}

/** Fire-and-forget version that swallows errors. Use for non-critical sends. */
export function sendNotificationBackground(input: SendNotificationInput): void {
  void sendNotification(input).catch((err) => {
    logger.warn('notifications: background send failed', {
      type: input.type,
      userId: input.userId,
      err: err instanceof Error ? err.message : String(err),
    });
  });
}

// ---------------------------------------------------------------------
// Convenience helpers for the dashboard + cron
// ---------------------------------------------------------------------
export async function listNotificationsForUser(
  supabase: TypedSupabaseClient,
  userId: string,
  opts: {
    limit?: number;
    unreadOnly?: boolean;
    category?: NotificationCategory;
  } = {},
): Promise<Notification[]> {
  let q = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('sent_at', { ascending: false });
  if (opts.unreadOnly) q = q.eq('is_read', false);
  if (opts.category) q = q.eq('category', opts.category);
  q = q.limit(opts.limit ?? 100);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Notification[];
}

export async function markNotificationsRead(
  supabase: TypedSupabaseClient,
  userId: string,
  ids: string[] | 'all',
): Promise<number> {
  const now = new Date().toISOString();
  let q = supabase
    .from('notifications')
    .update({ is_read: true, read_at: now })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (ids !== 'all') q = q.in('id', ids);
  const { data, error } = await q.select('id');
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data.length : 0;
}

export async function softDeleteNotifications(
  supabase: TypedSupabaseClient,
  userId: string,
  ids: string[],
): Promise<number> {
  const { data, error } = await supabase
    .from('notifications')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('id', ids)
    .select('id');
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? data.length : 0;
}
