import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { deleteTeamMember, getTeamMember, updateTeamMember } from '@/lib/db/queries';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { teamMemberUpdateSchema } from '@/lib/validations/team';

export const GET = withErrorHandler('api.team.[id].GET', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const member = await getTeamMember(supabase, ctx.params.id);
  if (!member) throw errors.notFound('Team member not found');
  return NextResponse.json({ member });
});

export const PUT = withErrorHandler('api.team.[id].PUT', async (req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const patch = teamMemberUpdateSchema.parse(body);
  const member = await updateTeamMember(supabase, ctx.params.id, patch);
  return NextResponse.json({ member });
});

export const DELETE = withErrorHandler('api.team.[id].DELETE', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  await deleteTeamMember(supabase, ctx.params.id);
  return NextResponse.json({ success: true });
});
