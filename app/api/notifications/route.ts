// =====================================================================
// /api/notifications
//
// GET   - list current user's notifications (filterable)
// PATCH - bulk mark-read; body: { ids?: string[], all?: boolean }
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import { errors, withErrorHandler } from '@/lib/error-handler';
import { listNotificationsForUser, markNotificationsRead } from '@/lib/notifications/dispatcher';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['project', 'team', 'performance', 'billing', 'system', 'empire_os'] as const;

const patchSchema = z
  .object({
    ids: z.array(z.string().uuid()).optional(),
    all: z.boolean().optional(),
  })
  .refine((v) => v.all || (v.ids && v.ids.length > 0), {
    message: 'Provide ids[] or all=true',
  });

export const GET = withErrorHandler('api.notifications.GET', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  const url = new URL(req.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? 100)));
  const unreadOnly = url.searchParams.get('unread') === '1';
  const category = url.searchParams.get('category');
  const safeCategory =
    category && (CATEGORIES as readonly string[]).includes(category)
      ? (category as (typeof CATEGORIES)[number])
      : undefined;

  const notifications = await listNotificationsForUser(supabase, user.id, {
    limit,
    unreadOnly,
    category: safeCategory,
  });

  return NextResponse.json({
    notifications,
    counts: {
      total: notifications.length,
      unread: notifications.filter((n) => !n.is_read).length,
    },
  });
});

export const PATCH = withErrorHandler('api.notifications.PATCH', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const input = patchSchema.parse(body);
  const count = await markNotificationsRead(
    supabase,
    user.id,
    input.all ? 'all' : (input.ids as string[]),
  );
  return NextResponse.json({ marked: count });
});

export const POST = withErrorHandler('api.notifications.POST', async () => {
  // POST is reserved for in-app debug/system testing in development.
  if (process.env.NODE_ENV === 'production') {
    throw errors.notFound('Not available in production.');
  }
  throw errors.badRequest('Use PATCH to mark notifications as read.');
});
