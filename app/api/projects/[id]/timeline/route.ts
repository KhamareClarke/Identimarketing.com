import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { getProject, listDeliverables } from '@/lib/db/queries';
import { withErrorHandler, errors } from '@/lib/error-handler';

export const GET = withErrorHandler('api.projects.[id].timeline.GET', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const project = await getProject(supabase, ctx.params.id);
  if (!project) throw errors.notFound('Project not found');

  const deliverables = await listDeliverables(supabase, ctx.params.id);

  const milestones = [
    project.start_date ? { date: project.start_date, label: 'Project kickoff', kind: 'project_start' as const } : null,
    project.end_date ? { date: project.end_date, label: 'Project end', kind: 'project_end' as const } : null,
    ...deliverables
      .filter((d) => d.due_date)
      .map((d) => ({
        date: d.due_date!,
        label: d.name,
        kind: 'deliverable' as const,
        status: d.status,
        id: d.id,
      })),
  ].filter(Boolean) as { date: string; label: string; kind: 'project_start' | 'project_end' | 'deliverable'; status?: string; id?: string }[];

  milestones.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    project_id: project.id,
    start_date: project.start_date,
    end_date: project.end_date,
    milestones,
  });
});
