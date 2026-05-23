// =====================================================================
// GET  /api/empire-os/settings
// PUT  /api/empire-os/settings
//
// Per-user Empire OS preferences (auto-execute, confidence threshold,
// allowed recommendation types, enabled events, hourly budget).
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import type { EmpireOSSettings } from '@/lib/db/types';
import { EMPIRE_EVENTS, type EmpireEventType } from '@/lib/empire-os/event-system';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

const RECOMMENDATION_TYPES = [
  'generate_content',
  'email_sequence',
  'social_calendar',
  'ad_copy',
  'strategy',
  'advice',
] as const;

const schema = z.object({
  auto_execute: z.boolean().optional(),
  confidence_threshold: z.number().int().min(0).max(100).optional(),
  allowed_recommendation_types: z.array(z.enum(RECOMMENDATION_TYPES)).optional(),
  enabled_event_types: z
    .array(z.enum(EMPIRE_EVENTS as unknown as [EmpireEventType, ...EmpireEventType[]]))
    .optional(),
  hourly_budget_usd: z.number().min(0).max(1000).optional(),
});

async function ensureRow(
  supabase: Awaited<ReturnType<typeof requireUserApi>>['supabase'],
  userId: string,
): Promise<EmpireOSSettings> {
  const existing = await supabase.from('empire_os_settings').select('*').eq('user_id', userId).maybeSingle();
  if (existing.data) return existing.data as EmpireOSSettings;
  const { data: inserted, error } = await supabase
    .from('empire_os_settings')
    .insert({ user_id: userId })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return inserted as EmpireOSSettings;
}

export const GET = withErrorHandler('api.empire-os.settings.GET', async () => {
  const { user, supabase } = await requireUserApi();
  const settings = await ensureRow(supabase, user.id);
  return NextResponse.json({ settings });
});

export const PUT = withErrorHandler('api.empire-os.settings.PUT', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const patch = schema.parse(body);
  await ensureRow(supabase, user.id);
  const { data, error } = await supabase
    .from('empire_os_settings')
    .update(patch)
    .eq('user_id', user.id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return NextResponse.json({ settings: data });
});
