// =====================================================================
// /api/reports/generate
//
// GET  - list all reports for the current user (filterable).
// POST - generate a new report (HTML or PDF).
//
// POST returns the binary PDF when format=pdf, or JSON with the report
// row + HTML when format=html.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import type { Report } from '@/lib/db/types';
import { generateReport } from '@/lib/reports/generate';
import { errors, withErrorHandler } from '@/lib/error-handler';
import { getProject } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const postSchema = z.object({
  projectId: z.string().uuid(),
  format: z.enum(['pdf', 'html']).default('pdf'),
  schedule: z.enum(['manual', 'weekly', 'monthly']).optional(),
  range: z.enum(['7d', '30d', '60d', '90d', '180d', '365d']).optional(),
  from: DATE.optional(),
  to: DATE.optional(),
  title: z.string().max(200).optional(),
  download: z.boolean().optional(),
});

export const GET = withErrorHandler('api.reports.generate.GET', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? 25)));

  let query = supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .order('generated_at', { ascending: false })
    .limit(limit);
  if (projectId) query = query.eq('project_id', projectId);

  const { data, error } = await query;
  if (error) throw errors.serverError(error.message);
  return NextResponse.json({ reports: (data ?? []) as Report[] });
});

export const POST = withErrorHandler('api.reports.generate.POST', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const input = postSchema.parse(body);

  const project = await getProject(supabase, input.projectId);
  if (!project) throw errors.notFound('Project not found.');
  if (project.user_id !== user.id) throw errors.forbidden('You do not own this project.');

  const range = input.from && input.to ? { from: input.from, to: input.to } : input.range;
  const result = await generateReport({
    supabase,
    userId: user.id,
    projectId: input.projectId,
    format: input.format,
    range,
    schedule: input.schedule,
    title: input.title,
  });

  if (input.format === 'pdf' && result.pdf && input.download !== false) {
    const filename = `${slugify(result.report.title)}.pdf`;
    const body = new Uint8Array(result.pdf);
    return new NextResponse(body, {
      status: 201,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `attachment; filename="${filename}"`,
        'x-report-id': result.report.id,
      },
    });
  }
  return NextResponse.json(
    {
      success: true,
      report: result.report,
      html: input.format === 'html' ? result.html : undefined,
    },
    { status: 201 },
  );
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'report';
}
