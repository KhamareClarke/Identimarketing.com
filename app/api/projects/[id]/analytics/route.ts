import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { listProjectMetrics, getProject, listDeliverables } from '@/lib/db/queries';
import { withErrorHandler, errors } from '@/lib/error-handler';

export const GET = withErrorHandler('api.projects.[id].analytics.GET', async (req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const project = await getProject(supabase, ctx.params.id);
  if (!project) throw errors.notFound('Project not found');

  const url = new URL(req.url);
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;

  const [metricRows, deliverables] = await Promise.all([
    listProjectMetrics(supabase, ctx.params.id, { from, to }),
    listDeliverables(supabase, ctx.params.id),
  ]);

  const total = deliverables.length;
  const completed = deliverables.filter((d) => d.status === 'completed' || d.status === 'approved').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return NextResponse.json({
    metrics: metricRows,
    deliverables_total: total,
    deliverables_completed: completed,
    progress_pct: progress,
    budget: project.budget,
    spent: project.spent,
    budget_pct: project.budget > 0 ? Math.round((Number(project.spent) / Number(project.budget)) * 100) : 0,
  });
});
