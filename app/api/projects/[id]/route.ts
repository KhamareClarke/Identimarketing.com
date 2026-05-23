import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { deleteProject, getProject, updateProject } from '@/lib/db/queries';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { projectUpdateSchema } from '@/lib/validations/project';
import { canTransitionProjectStatus } from '@/lib/db/types';

export const GET = withErrorHandler('api.projects.[id].GET', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const project = await getProject(supabase, ctx.params.id);
  if (!project) throw errors.notFound('Project not found');
  return NextResponse.json({ project });
});

export const PUT = withErrorHandler('api.projects.[id].PUT', async (req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const patch = projectUpdateSchema.parse(body);

  if (patch.status) {
    const existing = await getProject(supabase, ctx.params.id);
    if (existing && existing.status !== patch.status && !canTransitionProjectStatus(existing.status, patch.status)) {
      throw errors.badRequest(`Cannot transition project from ${existing.status} to ${patch.status}.`);
    }
  }

  const project = await updateProject(supabase, ctx.params.id, patch);
  return NextResponse.json({ project });
});

export const DELETE = withErrorHandler('api.projects.[id].DELETE', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  await deleteProject(supabase, ctx.params.id);
  return NextResponse.json({ success: true });
});
