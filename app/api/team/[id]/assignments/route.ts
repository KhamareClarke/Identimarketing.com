import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { listMemberAssignments } from '@/lib/db/queries';
import { withErrorHandler } from '@/lib/error-handler';

export const GET = withErrorHandler('api.team.[id].assignments.GET', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const assignments = await listMemberAssignments(supabase, ctx.params.id);
  return NextResponse.json({ assignments });
});
