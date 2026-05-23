// =====================================================================
// Identimarketing SaaS - lib/reports/generate.ts
//
// Orchestrator that loads project + metrics + suggestions, builds a
// ReportData, renders HTML/PDF, and persists a row in public.reports.
// =====================================================================

import crypto from 'node:crypto';

import { getProjectMetrics, rangeToDates, type DateRangePreset } from '@/lib/analytics/metrics';
import { buildMetricCards } from '@/lib/analytics/metrics-processor';
import type { TypedSupabaseClient } from '@/lib/db/client';
import {
  getClient as fetchClient,
  getProject,
  listDeliverables,
  listSuggestions,
} from '@/lib/db/queries';
import type { EmpireOSSuggestion, Report, ReportFormat, ReportSchedule } from '@/lib/db/types';
import { logger } from '@/lib/logging';

import { buildReportHtml } from './build-report-html';
import { renderReportPdf } from './pdf-converter';
import { mapSuggestionsToRecommendations, type ReportData } from './types';

const AGENCY_NAME = 'Identimarketing';

// ---------------------------------------------------------------------
// Build a ReportData object from live project data
// ---------------------------------------------------------------------
export async function buildReportData(
  supabase: TypedSupabaseClient,
  opts: {
    projectId: string;
    range?: DateRangePreset | { from: string; to: string };
  },
): Promise<ReportData> {
  const project = await getProject(supabase, opts.projectId);
  if (!project) throw new Error(`Project not found: ${opts.projectId}`);
  const range = opts.range ?? '30d';
  const { from, to } = rangeToDates(range);

  const [metricsResult, deliverables, suggestions, client] = await Promise.all([
    getProjectMetrics(supabase, { projectId: project.id, range }),
    listDeliverables(supabase, project.id),
    listSuggestions(supabase, project.id),
    project.client_id ? fetchClient(supabase, project.client_id) : Promise.resolve(null),
  ]);

  const cards = buildMetricCards({ serviceType: project.service_type, series: metricsResult.series });
  const activeSuggestions = (suggestions as EmpireOSSuggestion[])
    .filter((s) => s.status === 'pending' || s.status === 'approved')
    .sort((a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0));

  // Highlights & challenges - derived from metric performance + deliverable progress.
  const highlights: string[] = [];
  const challenges: string[] = [];
  for (const card of cards) {
    if (card.performance === 'exceeded') {
      highlights.push(
        `${card.label} exceeded target (${card.formattedValue} vs ${card.formattedTarget}).`,
      );
    } else if (card.performance === 'behind' && card.trendQuality === 'bad') {
      challenges.push(
        `${card.label} is behind target (${card.formattedValue} vs ${card.formattedTarget}, ${card.trend.changePct.toFixed(1)}% trend).`,
      );
    }
  }
  const completed = deliverables.filter((d) => d.status === 'completed' || d.status === 'approved');
  if (completed.length > 0) {
    highlights.unshift(
      `${completed.length} deliverable${completed.length === 1 ? '' : 's'} completed in the period.`,
    );
  }
  const overdue = deliverables.filter(
    (d) =>
      d.status !== 'completed' &&
      d.status !== 'approved' &&
      d.due_date &&
      new Date(d.due_date) < new Date(),
  );
  if (overdue.length > 0) {
    challenges.push(`${overdue.length} deliverable${overdue.length === 1 ? '' : 's'} overdue.`);
  }

  // Next steps - first 5 action steps from the top recommendation, plus any pending deliverables.
  const top = activeSuggestions[0];
  const nextSteps: string[] = top?.action_steps?.slice(0, 5) ?? [];
  const upcoming = deliverables
    .filter((d) => d.status === 'pending' || d.status === 'in_progress')
    .slice(0, 3);
  for (const d of upcoming) {
    nextSteps.push(`Ship "${d.name}"${d.due_date ? ` by ${d.due_date}` : ''}.`);
  }

  // ROI summary
  const totalEstimatedValue = activeSuggestions.reduce(
    (sum, s) => sum + Number(s.estimated_value || 0),
    0,
  );
  const totalBudget = Number(project.budget || 0);
  const totalSpent = Number(project.spent || 0);
  const roiMultiple = totalSpent > 0 ? totalEstimatedValue / totalSpent : null;

  // Executive summary - one-paragraph synthesis.
  const executiveSummary = composeExecutiveSummary({
    projectName: project.name,
    clientName: client?.company_name ?? null,
    period: { from, to },
    cardsExceeded: cards.filter((c) => c.performance === 'exceeded').length,
    cardsOnTrack: cards.filter((c) => c.performance === 'on_track').length,
    cardsBehind: cards.filter((c) => c.performance === 'behind').length,
    completedDeliverables: completed.length,
    totalDeliverables: deliverables.length,
    activeRecommendations: activeSuggestions.length,
  });

  const data: ReportData = {
    generatedAt: new Date().toISOString(),
    period: { from, to },
    agency: { name: AGENCY_NAME },
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      service_type: project.service_type,
      budget: project.budget,
      spent: project.spent,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
    },
    client: client
      ? {
          id: client.id,
          company_name: client.company_name,
          industry: client.industry,
          website: client.website,
          contact_email: client.contact_email,
        }
      : null,
    executiveSummary,
    metricCards: cards,
    deliverables: deliverables.map((d) => ({
      name: d.name,
      description: d.description,
      status: d.status,
      completedDate: d.completed_date,
    })),
    highlights,
    challenges,
    recommendations: mapSuggestionsToRecommendations(activeSuggestions, 8),
    nextSteps,
    roiSummary: { totalEstimatedValue, totalBudget, totalSpent, roiMultiple },
  };
  return data;
}

function composeExecutiveSummary(input: {
  projectName: string;
  clientName: string | null;
  period: { from: string; to: string };
  cardsExceeded: number;
  cardsOnTrack: number;
  cardsBehind: number;
  completedDeliverables: number;
  totalDeliverables: number;
  activeRecommendations: number;
}): string {
  const audience = input.clientName ?? 'the client';
  const lines: string[] = [];
  lines.push(
    `This report covers ${input.projectName} for ${audience} across the period ${input.period.from} to ${input.period.to}.`,
  );
  if (input.cardsExceeded + input.cardsOnTrack > 0) {
    lines.push(
      `${input.cardsExceeded + input.cardsOnTrack} key metric${
        input.cardsExceeded + input.cardsOnTrack === 1 ? ' is' : 's are'
      } meeting or exceeding target, with ${input.cardsBehind} requiring attention.`,
    );
  }
  if (input.totalDeliverables > 0) {
    lines.push(
      `${input.completedDeliverables} of ${input.totalDeliverables} deliverable${
        input.totalDeliverables === 1 ? '' : 's'
      } completed in the period.`,
    );
  }
  if (input.activeRecommendations > 0) {
    lines.push(
      `Empire OS surfaced ${input.activeRecommendations} active recommendation${
        input.activeRecommendations === 1 ? '' : 's'
      } - top items are summarized below.`,
    );
  }
  return lines.join(' ');
}

// ---------------------------------------------------------------------
// generateReport - end-to-end orchestrator
// ---------------------------------------------------------------------
export interface GenerateReportOptions {
  supabase: TypedSupabaseClient;
  userId: string;
  projectId: string;
  format?: ReportFormat;
  range?: DateRangePreset | { from: string; to: string };
  schedule?: ReportSchedule;
  title?: string;
}

export interface GenerateReportResult {
  report: Report;
  html: string;
  pdf?: Buffer;
}

export async function generateReport(opts: GenerateReportOptions): Promise<GenerateReportResult> {
  const format: ReportFormat = opts.format ?? 'pdf';
  const data = await buildReportData(opts.supabase, {
    projectId: opts.projectId,
    range: opts.range,
  });

  const html = buildReportHtml(data);
  let pdf: Buffer | undefined;
  if (format === 'pdf') {
    try {
      pdf = await renderReportPdf(data);
    } catch (err) {
      logger.error('reports: PDF rendering failed', {
        projectId: opts.projectId,
        err: err instanceof Error ? err.message : String(err),
      });
      throw new Error(
        `PDF rendering failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const title =
    opts.title ?? `${data.project.name} \u2013 ${data.period.from} to ${data.period.to}`;

  const { data: row, error } = await opts.supabase
    .from('reports')
    .insert({
      user_id: opts.userId,
      project_id: opts.projectId,
      title,
      format,
      status: 'ready',
      period_from: data.period.from,
      period_to: data.period.to,
      summary: data.executiveSummary,
      payload: {
        metricCards: data.metricCards,
        recommendations: data.recommendations,
        highlights: data.highlights,
        challenges: data.challenges,
        nextSteps: data.nextSteps,
        roiSummary: data.roiSummary,
      },
      html_content: html,
      schedule: opts.schedule ?? 'manual',
      generated_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  return { report: row as Report, html, pdf };
}

// ---------------------------------------------------------------------
// rotateShareToken - generate (or refresh) a public share token
// ---------------------------------------------------------------------
export interface ShareTokenInfo {
  token: string;
  expiresAt: string | null;
  url: string;
}

export async function rotateShareToken(
  supabase: TypedSupabaseClient,
  opts: { reportId: string; userId: string; expiresInDays?: number | null; appUrl?: string },
): Promise<ShareTokenInfo> {
  const token = crypto.randomBytes(24).toString('base64url');
  const expiresAt =
    opts.expiresInDays && opts.expiresInDays > 0
      ? new Date(Date.now() + opts.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
  const { data, error } = await supabase
    .from('reports')
    .update({ share_token: token, share_expires_at: expiresAt })
    .eq('id', opts.reportId)
    .eq('user_id', opts.userId)
    .select('id, share_token, share_expires_at')
    .single();
  if (error) throw new Error(error.message);
  const baseUrl = opts.appUrl || process.env.NEXT_PUBLIC_APP_URL || '';
  const sharedUrl = `${baseUrl.replace(/\/$/, '')}/api/reports/share/${(data as { id: string }).id}?token=${token}`;
  return {
    token,
    expiresAt: (data as { share_expires_at: string | null }).share_expires_at,
    url: sharedUrl,
  };
}

export async function revokeShareToken(
  supabase: TypedSupabaseClient,
  opts: { reportId: string; userId: string },
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({ share_token: null, share_expires_at: null })
    .eq('id', opts.reportId)
    .eq('user_id', opts.userId);
  if (error) throw new Error(error.message);
}
