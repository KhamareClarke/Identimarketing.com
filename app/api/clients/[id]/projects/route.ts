import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { listProjects } from '@/lib/db/queries';
import { withErrorHandler } from '@/lib/error-handler';

export const GET = withErrorHandler('api.clients.[id].projects.GET', async (_req: NextRequest, ctx) => {
  const { user, supabase } = await requireUserApi();
  const projects = await listProjects(supabase, user.id, { clientId: ctx.params.id, withClient: false });
  return NextResponse.json({ projects });
});
