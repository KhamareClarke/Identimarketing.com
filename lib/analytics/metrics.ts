// =====================================================================
// Identimarketing SaaS - lib/analytics/metrics.ts
//
// Generic metric tracking, retrieval, and trend calculation.
// Service-type-specific concerns (which metrics matter, how to format,
// what the goals are) live in metrics-processor.ts.
// =====================================================================

import type { TypedSupabaseClient } from '@/lib/db/client';
import type { ProjectMetric, ProjectMetricTarget, TrendDirection } from '@/lib/db/types';
import { logger } from '@/lib/logging';

// ---------------------------------------------------------------------
// trackMetric - persist a single metric data point
// ---------------------------------------------------------------------
export interface TrackMetricInput {
  projectId: string;
  metricType: string;
  value: number;
  date?: string;          // YYYY-MM-DD (defaults to today)
  meta?: Record<string, unknown>;
}

export async function trackMetric(
  supabase: TypedSupabaseClient,
  input: TrackMetricInput,
): Promise<ProjectMetric> {
  const date = input.date ?? new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('project_metrics')
    .insert({
      project_id: input.projectId,
      metric_type: input.metricType,
      metric_value: input.value,
      metric_date: date,
      meta: input.meta ?? {},
    })
    .select()
    .single();
  if (error) {
    logger.warn('analytics: trackMetric failed', {
      projectId: input.projectId,
      metricType: input.metricType,
      err: error.message,
    });
    throw new Error(error.message);
  }
  return data as ProjectMetric;
}

export async function trackMetricsBatch(
  supabase: TypedSupabaseClient,
  rows: TrackMetricInput[],
): Promise<ProjectMetric[]> {
  if (rows.length === 0) return [];
  const payload = rows.map((row) => ({
    project_id: row.projectId,
    metric_type: row.metricType,
    metric_value: row.value,
    metric_date: row.date ?? new Date().toISOString().slice(0, 10),
    meta: row.meta ?? {},
  }));
  const { data, error } = await supabase.from('project_metrics').insert(payload).select();
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectMetric[];
}

// ---------------------------------------------------------------------
// Trend calculation
// ---------------------------------------------------------------------
export interface TrendResult {
  direction: TrendDirection;
  changePct: number;          // percentage change vs previous half
  currentAvg: number;
  previousAvg: number;
  delta: number;
  samples: number;
}

const TREND_THRESHOLD_PCT = 2; // < +/-2% is treated as flat

/**
 * Compare the average of the second half of the supplied series to the
 * average of the first half. Returns flat when the series has fewer than
 * 2 samples or the change is within ±2%.
 */
export function calculateTrend(values: number[]): TrendResult {
  if (!values || values.length === 0) {
    return { direction: 'flat', changePct: 0, currentAvg: 0, previousAvg: 0, delta: 0, samples: 0 };
  }
  if (values.length === 1) {
    return {
      direction: 'flat',
      changePct: 0,
      currentAvg: values[0]!,
      previousAvg: values[0]!,
      delta: 0,
      samples: 1,
    };
  }
  const mid = Math.floor(values.length / 2);
  const first = values.slice(0, mid);
  const second = values.slice(mid);
  const avg = (arr: number[]): number => (arr.length ? arr.reduce((sum, v) => sum + v, 0) / arr.length : 0);
  const previousAvg = avg(first);
  const currentAvg = avg(second);
  const delta = currentAvg - previousAvg;
  const changePct = previousAvg === 0 ? (currentAvg > 0 ? 100 : 0) : (delta / Math.abs(previousAvg)) * 100;
  let direction: TrendDirection;
  if (Math.abs(changePct) < TREND_THRESHOLD_PCT) direction = 'flat';
  else direction = changePct > 0 ? 'up' : 'down';
  return {
    direction,
    changePct: Math.round(changePct * 10) / 10,
    currentAvg: Math.round(currentAvg * 100) / 100,
    previousAvg: Math.round(previousAvg * 100) / 100,
    delta: Math.round(delta * 100) / 100,
    samples: values.length,
  };
}

// ---------------------------------------------------------------------
// Date-range helpers
// ---------------------------------------------------------------------
export type DateRangePreset = '7d' | '30d' | '60d' | '90d' | '180d' | '365d';

export function rangeToDates(range: DateRangePreset | { from: string; to: string }): {
  from: string;
  to: string;
} {
  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  if (typeof range === 'object') return { from: range.from, to: range.to };
  const days = Number(range.replace('d', ''));
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - days + 1);
  from.setUTCHours(0, 0, 0, 0);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

// ---------------------------------------------------------------------
// getProjectMetrics - fetch + group + trend
// ---------------------------------------------------------------------
export interface ProcessedSeries {
  metricType: string;
  points: Array<{ date: string; value: number }>;
  total: number;
  latest: number;
  trend: TrendResult;
  target?: ProjectMetricTarget | null;
  pctOfTarget?: number | null;
}

export interface GetProjectMetricsOptions {
  projectId: string;
  range?: DateRangePreset | { from: string; to: string };
  metricTypes?: string[];
}

export async function getProjectMetrics(
  supabase: TypedSupabaseClient,
  opts: GetProjectMetricsOptions,
): Promise<{ from: string; to: string; series: ProcessedSeries[] }> {
  const { from, to } = rangeToDates(opts.range ?? '30d');
  let query = supabase
    .from('project_metrics')
    .select('*')
    .eq('project_id', opts.projectId)
    .gte('metric_date', from)
    .lte('metric_date', to)
    .order('metric_date', { ascending: true });
  if (opts.metricTypes && opts.metricTypes.length > 0) {
    query = query.in('metric_type', opts.metricTypes);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ProjectMetric[];

  const { data: targetRows } = await supabase
    .from('project_metric_targets')
    .select('*')
    .eq('project_id', opts.projectId);
  const targets = new Map<string, ProjectMetricTarget>();
  for (const row of (targetRows ?? []) as ProjectMetricTarget[]) {
    targets.set(row.metric_type, row);
  }

  const byType = new Map<string, ProjectMetric[]>();
  for (const row of rows) {
    const arr = byType.get(row.metric_type);
    if (arr) arr.push(row);
    else byType.set(row.metric_type, [row]);
  }

  const series: ProcessedSeries[] = [];
  for (const [type, list] of Array.from(byType.entries())) {
    const points = list.map((row) => ({ date: row.metric_date, value: Number(row.metric_value) }));
    const values = points.map((p) => p.value);
    const total = values.reduce((sum, v) => sum + v, 0);
    const latest = values[values.length - 1] ?? 0;
    const trend = calculateTrend(values);
    const target = targets.get(type) ?? null;
    const pctOfTarget =
      target && target.target_value !== 0 ? Math.round((latest / target.target_value) * 100) : null;
    series.push({ metricType: type, points, total, latest, trend, target, pctOfTarget });
  }
  series.sort((a, b) => a.metricType.localeCompare(b.metricType));
  return { from, to, series };
}
