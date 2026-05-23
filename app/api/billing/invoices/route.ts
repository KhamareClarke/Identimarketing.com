// =====================================================================
// GET /api/billing/invoices
//
// Returns the current user's invoices (mirrored from Stripe webhooks).
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import type { Invoice } from '@/lib/db/types';
import { errors, withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandler('api.billing.invoices.GET', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 25)));
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })
    .limit(limit);
  if (error) throw errors.serverError(error.message);
  return NextResponse.json({ invoices: (data ?? []) as Invoice[] });
});
