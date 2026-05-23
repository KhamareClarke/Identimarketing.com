// =====================================================================
// /api/notifications/[id]
//
// DELETE - soft-delete a single notification (set deleted_at).
// PATCH  - mark a single notification read / unread.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import { errors, withErrorHandler } from '@/lib/error-handler';
import { softDeleteNotifications } from '@/lib/notifications/dispatcher';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  is_read: z.boolean(),
});

export const PATCH = withErrorHandler(
  'api.notifications.[id].PATCH',
  async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const { user, supabase } = await requireUserApi();
    const id = ctx.params.id;
    if (!id) throw errors.badRequest('Missing notification id.');
    const body = await req.json().catch(() => ({}));
    const input = patchSchema.parse(body);
    const patch = input.is_read
      ? { is_read: true, read_at: new Date().toISOString() }
      : { is_read: false, read_at: null };
    const { data, error } = await supabase
      .from('notifications')
      .update(patch)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .maybeSingle();
    if (error) throw errors.serverError(error.message);
    if (!data) throw errors.notFound('Notification not found.');
    return NextResponse.json({ notification: data });
  },
);

export const DELETE = withErrorHandler(
  'api.notifications.[id].DELETE',
  async (_req: NextRequest, ctx: { params: Record<string, string> }) => {
    const { user, supabase } = await requireUserApi();
    const id = ctx.params.id;
    if (!id) throw errors.badRequest('Missing notification id.');
    const count = await softDeleteNotifications(supabase, user.id, [id]);
    if (count === 0) throw errors.notFound('Notification not found.');
    return NextResponse.json({ deleted: count });
  },
);
