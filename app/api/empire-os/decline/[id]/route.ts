// =====================================================================
// POST /api/empire-os/decline/[id]
//
// Mark an Empire OS recommendation as declined with optional reason.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import type { EmpireOSSuggestion } from '@/lib/db/types';
import { errors, withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

const schema = z.object({
  reason: z.string().max(500).optional(),
});

export const POST = withErrorHandler('api.empire-os.decline.POST', async (req: NextRequest, ctx) => {
  const id = ctx.params?.id;
  if (!id) throw errors.badRequest('Missing recommendation id.');
  const { user, supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const input = schema.parse(body);

  const { data: existing } = await supabase
    .from('empire_os_suggestions')
    .select('id, user_id, status')
    .eq('id', id)
    .maybeSingle();
  const rec = existing as Pick<EmpireOSSuggestion, 'id' | 'user_id' | 'status'> | null;
  if (!rec) throw errors.notFound('Recommendation not found.');
  if (rec.user_id && rec.user_id !== user.id) throw errors.forbidden('You do not own this recommendation.');

  const { data: updated, error } = await supabase
    .from('empire_os_suggestions')
    .update({
      status: 'declined',
      declined_reason: input.reason ?? null,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw errors.serverError(error.message);

  return NextResponse.json({ success: true, suggestion: updated });
});
