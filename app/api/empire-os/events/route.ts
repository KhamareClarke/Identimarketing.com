// =====================================================================
// POST /api/empire-os/events
//
// Dispatch a business event into the Empire OS executor. Inline mode
// returns the suggestions immediately; queued mode returns the job ids.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import { dispatchEvent, EMPIRE_EVENTS, type EmpireEventType } from '@/lib/empire-os/event-system';
import { errors, withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const schema = z
  .object({
    eventType: z.enum(EMPIRE_EVENTS as unknown as [EmpireEventType, ...EmpireEventType[]]),
    projectId: z.string().uuid().optional(),
    clientId: z.string().uuid().optional(),
    payload: z.record(z.unknown()).optional(),
    mode: z.enum(['inline', 'queued']).optional(),
    maxInline: z.number().int().min(1).max(8).optional(),
  })
  .refine((v) => v.projectId || v.clientId || v.eventType === 'monthly_review' || v.eventType === 'manual_review', {
    message: 'projectId or clientId is required for this event type.',
    path: ['projectId'],
  });

export const POST = withErrorHandler('api.empire-os.events.POST', async (req: NextRequest) => {
  const { user } = await requireUserApi();
  if (!process.env.ANTHROPIC_API_KEY) {
    throw errors.badRequest(
      'Empire OS is not configured. Set ANTHROPIC_API_KEY in .env.local and restart the server.',
    );
  }
  const body = await req.json().catch(() => ({}));
  const input = schema.parse(body);

  const result = await dispatchEvent({
    eventType: input.eventType,
    userId: user.id,
    projectId: input.projectId ?? null,
    clientId: input.clientId ?? null,
    payload: input.payload ?? {},
    mode: input.mode,
    maxInline: input.maxInline,
  });

  return NextResponse.json({
    success: true,
    eventId: result.eventId,
    mode: result.mode,
    skillsDispatched: result.skills,
    inline: result.inline.map((r) => ({
      skill: r.skillSlug,
      ok: r.ok,
      error: r.error,
      costUsd: r.costUsd,
      durationMs: r.durationMs,
    })),
    queuedJobIds: result.queuedJobIds,
    suggestions: result.suggestions,
  });
});
