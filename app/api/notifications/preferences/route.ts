// =====================================================================
// /api/notifications/preferences
//
// GET - the current user's notification preferences (auto-created on signup).
// PUT - update preferences. Body is a partial of NotificationPreferences.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import type { NotificationPreferences } from '@/lib/db/types';
import { errors, withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

const channelPrefsSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  in_app: z.boolean().optional(),
});

const putSchema = z
  .object({
    email_enabled: z.boolean().optional(),
    sms_enabled: z.boolean().optional(),
    in_app_enabled: z.boolean().optional(),
    daily_digest: z.boolean().optional(),
    weekly_summary: z.boolean().optional(),
    quiet_hours_start: z.string().nullable().optional(),
    quiet_hours_end: z.string().nullable().optional(),
    category_channels: z
      .object({
        project: channelPrefsSchema.optional(),
        team: channelPrefsSchema.optional(),
        performance: channelPrefsSchema.optional(),
        billing: channelPrefsSchema.optional(),
        system: channelPrefsSchema.optional(),
        empire_os: channelPrefsSchema.optional(),
      })
      .optional(),
  })
  .strict();

export const GET = withErrorHandler('api.notifications.preferences.GET', async () => {
  const { user, supabase } = await requireUserApi();
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw errors.serverError(error.message);
  return NextResponse.json({ preferences: data ?? null });
});

export const PUT = withErrorHandler(
  'api.notifications.preferences.PUT',
  async (req: NextRequest) => {
    const { user, supabase } = await requireUserApi();
    const body = await req.json().catch(() => ({}));
    const input = putSchema.parse(body);

    // Merge category_channels with the existing row so partial updates work.
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('category_channels')
      .eq('user_id', user.id)
      .maybeSingle();

    const merged: Record<string, unknown> = { ...input };
    if (input.category_channels) {
      const currentChannels =
        ((existing as { category_channels?: NotificationPreferences['category_channels'] } | null)
          ?.category_channels ?? {}) as Record<string, Record<string, boolean>>;
      const next: Record<string, Record<string, boolean>> = { ...currentChannels };
      for (const [cat, prefs] of Object.entries(input.category_channels)) {
        if (!prefs) continue;
        next[cat] = { ...(currentChannels[cat] ?? {}), ...prefs };
      }
      merged.category_channels = next;
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...merged }, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) throw errors.serverError(error.message);
    return NextResponse.json({ preferences: data });
  },
);
