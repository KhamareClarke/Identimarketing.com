// =====================================================================
// /api/reports/share/[id]
//
// POST   - owner-only. Generates (or rotates) a share token and returns
//          the shareable URL.
// DELETE - owner-only. Revokes the share token.
// GET    - public. Returns the HTML report when ?token=... matches.
//          Increments share_views.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import { createServiceClient } from '@/lib/db/client';
import type { Report } from '@/lib/db/types';
import { rotateShareToken, revokeShareToken } from '@/lib/reports/generate';
import { errors, withErrorHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logging';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const postSchema = z.object({
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export const POST = withErrorHandler('api.reports.share.POST', async (req: NextRequest, ctx) => {
  const reportId = ctx.params.id;
  if (!reportId) throw errors.badRequest('Missing report id.');
  const { user, supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const input = postSchema.parse(body);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const info = await rotateShareToken(supabase, {
    reportId,
    userId: user.id,
    expiresInDays: input.expiresInDays ?? 30,
    appUrl,
  });
  return NextResponse.json({ success: true, ...info });
});

export const DELETE = withErrorHandler('api.reports.share.DELETE', async (_req: NextRequest, ctx) => {
  const reportId = ctx.params.id;
  if (!reportId) throw errors.badRequest('Missing report id.');
  const { user, supabase } = await requireUserApi();
  await revokeShareToken(supabase, { reportId, userId: user.id });
  return NextResponse.json({ success: true });
});

// Public GET - no auth required, token is the credential.
export const GET = withErrorHandler('api.reports.share.GET', async (req: NextRequest, ctx) => {
  const reportId = ctx.params.id;
  if (!reportId) throw errors.badRequest('Missing report id.');
  const token = new URL(req.url).searchParams.get('token');
  if (!token) throw errors.unauthorized('Share token required.');

  const admin = createServiceClient();
  const { data, error } = await admin
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .eq('share_token', token)
    .maybeSingle();
  if (error) throw errors.serverError(error.message);
  const report = data as Report | null;
  if (!report) throw errors.notFound('Report not found or token invalid.');
  if (report.share_expires_at && new Date(report.share_expires_at) < new Date()) {
    throw errors.unauthorized('Share token has expired.');
  }
  if (report.status !== 'ready' || !report.html_content) {
    throw errors.serverError('Report is not ready.');
  }

  // Increment view counter (fire and forget).
  void admin
    .from('reports')
    .update({ share_views: report.share_views + 1 })
    .eq('id', report.id)
    .then((res) => {
      if (res.error) logger.warn('reports: share_views increment failed', { err: res.error.message });
    });

  return new NextResponse(report.html_content, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'private, max-age=300',
      'x-report-id': report.id,
    },
  });
});
