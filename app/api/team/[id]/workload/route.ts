import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { getMemberWorkload } from '@/lib/db/queries';
import { withErrorHandler } from '@/lib/error-handler';

export const GET = withErrorHandler('api.team.[id].workload.GET', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const workload = await getMemberWorkload(supabase, ctx.params.id);
  return NextResponse.json({ workload });
});
