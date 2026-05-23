// =====================================================================
// /api/projects/[id]/metrics
//
// GET  - returns metric series (with trends + targets + cards) for the
//        requested date range and service type.
// POST - records a metric data point (single or batch).
// PUT  - upserts a metric target.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import { getProjectMetrics, trackMetric, trackMetricsBatch } from '@/lib/analytics/metrics';
import { buildMetricCards, getMetricCatalog, resolveServiceKey } from '@/lib/analytics/metrics-processor';
import { getProject } from '@/lib/db/queries';
import type { ProjectMetricTarget } from '@/lib/db/types';
import { errors, withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

const RANGE_PRESETS = ['7d', '30d', '60d', '90d', '180d', '365d'] as const;

const postBodySchema = z.union([
  z.object({
    metricType: z.string().min(1).max(80),
    value: z.number(),
    date: DATE.optional(),
    meta: z.record(z.unknown()).optional(),
  }),
  z.object({
    metrics: z
      .array(
        z.object({
          metricType: z.string().min(1).max(80),
          value: z.number(),
          date: DATE.optional(),
          meta: z.record(z.unknown()).optional(),
        }),
      )
      .min(1)
      .max(500),
  }),
]);

const putBodySchema = z.object({
  metricType: z.string().min(1).max(80),
  targetValue: z.number(),
  direction: z.enum(['up', 'down']).default('up'),
  notes: z.string().max(500).optional(),
});

export const GET = withErrorHandler('api.projects.[id].metrics.GET', async (req: NextRequest, ctx) => {
  const { user, supabase } = await requireUserApi();
  const projectId = ctx.params.id;
  const project = await getProject(supabase, projectId);
  if (!project) throw errors.notFound('Project not found');
  if (project.user_id !== user.id) throw errors.forbidden('You do not own this project.');

  const url = new URL(req.url);
  const rangeParam = url.searchParams.get('range') ?? '30d';
  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');

  const range =
    fromParam && toParam
      ? { from: fromParam, to: toParam }
      : ((RANGE_PRESETS as readonly string[]).includes(rangeParam)
          ? (rangeParam as (typeof RANGE_PRESETS)[number])
          : '30d');

  const result = await getProjectMetrics(supabase, { projectId, range });
  const cards = buildMetricCards({ serviceType: project.service_type, series: result.series });
  const catalog = getMetricCatalog(project.service_type);

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      service_type: project.service_type,
      service_key: resolveServiceKey(project.service_type),
    },
    range: { from: result.from, to: result.to, preset: typeof range === 'string' ? range : 'custom' },
    cards,
    series: result.series,
    catalog,
  });
});

export const POST = withErrorHandler('api.projects.[id].metrics.POST', async (req: NextRequest, ctx) => {
  const { user, supabase } = await requireUserApi();
  const projectId = ctx.params.id;
  const project = await getProject(supabase, projectId);
  if (!project) throw errors.notFound('Project not found');
  if (project.user_id !== user.id) throw errors.forbidden('You do not own this project.');

  const body = await req.json().catch(() => ({}));
  const input = postBodySchema.parse(body);

  if ('metrics' in input) {
    const rows = await trackMetricsBatch(
      supabase,
      input.metrics.map((m) => ({
        projectId,
        metricType: m.metricType,
        value: m.value,
        date: m.date,
        meta: m.meta,
      })),
    );
    return NextResponse.json({ success: true, inserted: rows.length, rows });
  }
  const row = await trackMetric(supabase, {
    projectId,
    metricType: input.metricType,
    value: input.value,
    date: input.date,
    meta: input.meta,
  });
  return NextResponse.json({ success: true, row }, { status: 201 });
});

export const PUT = withErrorHandler('api.projects.[id].metrics.PUT', async (req: NextRequest, ctx) => {
  const { user, supabase } = await requireUserApi();
  const projectId = ctx.params.id;
  const project = await getProject(supabase, projectId);
  if (!project) throw errors.notFound('Project not found');
  if (project.user_id !== user.id) throw errors.forbidden('You do not own this project.');

  const body = await req.json().catch(() => ({}));
  const input = putBodySchema.parse(body);

  // Upsert target on (project_id, metric_type).
  const existing = await supabase
    .from('project_metric_targets')
    .select('*')
    .eq('project_id', projectId)
    .eq('metric_type', input.metricType)
    .maybeSingle();

  if (existing.data) {
    const { data, error } = await supabase
      .from('project_metric_targets')
      .update({
        target_value: input.targetValue,
        direction: input.direction,
        notes: input.notes ?? null,
      })
      .eq('id', (existing.data as ProjectMetricTarget).id)
      .select('*')
      .single();
    if (error) throw errors.serverError(error.message);
    return NextResponse.json({ target: data });
  }
  const { data, error } = await supabase
    .from('project_metric_targets')
    .insert({
      project_id: projectId,
      metric_type: input.metricType,
      target_value: input.targetValue,
      direction: input.direction,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();
  if (error) throw errors.serverError(error.message);
  return NextResponse.json({ target: data }, { status: 201 });
});
