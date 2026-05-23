import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { getClientStats } from '@/lib/db/queries';
import { withErrorHandler } from '@/lib/error-handler';

export const GET = withErrorHandler('api.clients.[id].stats.GET', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const stats = await getClientStats(supabase, ctx.params.id);
  return NextResponse.json({ stats });
});
