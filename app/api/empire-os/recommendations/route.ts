// =====================================================================
// /api/empire-os/recommendations
//
// GET  - returns the top recommendations for ?projectId=... or the
//        current user (if no projectId).
// POST - triggers a fresh manual_review on the given projectId and
//        returns the suggestions that just landed.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import type { TypedSupabaseClient } from '@/lib/db/client';
import { getProject } from '@/lib/db/queries';
import {
  analyzeProject,
  analyzeUserRecommendations,
  triggerProjectAnalysis,
} from '@/lib/empire-os/recommender';
import { errors, withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const postSchema = z.object({
  projectId: z.string().uuid(),
  includeDeclined: z.boolean().optional(),
});

async function assertProjectOwnership(
  supabase: TypedSupabaseClient,
  projectId: string,
  userId: string,
): Promise<void> {
  const project = await getProject(supabase, projectId);
  if (!project) throw errors.notFound('Project not found.');
  if (project.user_id !== userId) throw errors.forbidden('You do not own this project.');
}

export const GET = withErrorHandler('api.empire-os.recommendations.GET', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  const limitParam = url.searchParams.get('limit');
  const includeDeclined = url.searchParams.get('includeDeclined') === 'true';
  const limit = limitParam ? Math.min(50, Math.max(1, Number(limitParam))) : undefined;

  if (projectId) {
    await assertProjectOwnership(supabase, projectId, user.id);
    const recommendations = await analyzeProject(supabase, { projectId, limit, includeDeclined });
    return NextResponse.json({ recommendations });
  }
  const recommendations = await analyzeUserRecommendations(supabase, { userId: user.id, limit });
  return NextResponse.json({ recommendations });
});

export const POST = withErrorHandler('api.empire-os.recommendations.POST', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  if (!process.env.ANTHROPIC_API_KEY) {
    throw errors.badRequest('Empire OS is not configured. Set ANTHROPIC_API_KEY and try again.');
  }
  const body = await req.json().catch(() => ({}));
  const input = postSchema.parse(body);
  await assertProjectOwnership(supabase, input.projectId, user.id);
  const { eventId, suggestionIds } = await triggerProjectAnalysis({
    userId: user.id,
    projectId: input.projectId,
  });
  const recommendations = await analyzeProject(supabase, {
    projectId: input.projectId,
    includeDeclined: input.includeDeclined,
  });
  return NextResponse.json({ success: true, eventId, suggestionIds, recommendations });
});
