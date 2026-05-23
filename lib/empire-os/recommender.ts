// =====================================================================
// Identimarketing SaaS - Empire OS recommender
//
// analyzeProject() pulls the latest suggestions for a project, scores
// them, deduplicates by skill+title, and returns the top N.
//
// triggerProjectAnalysis() dispatches a manual_review event so the
// dashboard's "Re-run analysis" button can refresh recommendations.
// =====================================================================

import type { TypedSupabaseClient } from '@/lib/db/client';
import type { EmpireOSSuggestion } from '@/lib/db/types';

import { dispatchEvent } from './event-system';

export interface ScoredRecommendation extends EmpireOSSuggestion {
  composite_score: number;
}

const FRESH_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function ageDecayFactor(createdAt: string): number {
  const age = Date.now() - new Date(createdAt).getTime();
  if (age <= 0) return 1;
  if (age >= FRESH_MS) return 0.2;
  return 1 - (age / FRESH_MS) * 0.8;
}

function statusFactor(status: string): number {
  switch (status) {
    case 'approved':
    case 'applied':
      return 0;
    case 'declined':
      return 0.3;
    case 'pending':
    default:
      return 1;
  }
}

export function scoreRecommendation(rec: EmpireOSSuggestion): number {
  const impact = rec.impact_score ?? 50;
  const confidence = rec.confidence_score ?? 60;
  const base = impact * 0.6 + confidence * 0.4;
  const adjusted = base * ageDecayFactor(rec.created_at) * statusFactor(rec.status);
  return Math.round(adjusted * 10) / 10;
}

function dedupeKey(rec: EmpireOSSuggestion): string {
  return `${rec.skill_name}::${(rec.title || rec.suggestion_text || '').slice(0, 80).toLowerCase()}`;
}

export interface AnalyzeProjectOptions {
  projectId: string;
  limit?: number;
  /** Include recommendations the user has already declined. */
  includeDeclined?: boolean;
}

export async function analyzeProject(
  supabase: TypedSupabaseClient,
  options: AnalyzeProjectOptions,
): Promise<ScoredRecommendation[]> {
  const limit = options.limit ?? 15;
  let query = supabase
    .from('empire_os_suggestions')
    .select('*')
    .eq('project_id', options.projectId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (!options.includeDeclined) {
    query = query.not('status', 'in', '(applied,approved)');
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as EmpireOSSuggestion[];
  const seen = new Set<string>();
  const scored: ScoredRecommendation[] = [];
  for (const row of rows) {
    const key = dedupeKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    scored.push({ ...row, composite_score: scoreRecommendation(row) });
  }
  scored.sort((a, b) => b.composite_score - a.composite_score);
  return scored.slice(0, limit);
}

export interface AnalyzeUserOptions {
  userId: string;
  limit?: number;
}

export async function analyzeUserRecommendations(
  supabase: TypedSupabaseClient,
  options: AnalyzeUserOptions,
): Promise<ScoredRecommendation[]> {
  const limit = options.limit ?? 25;
  const { data, error } = await supabase
    .from('empire_os_suggestions')
    .select('*')
    .eq('user_id', options.userId)
    .not('status', 'in', '(applied,approved)')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as EmpireOSSuggestion[];
  const seen = new Set<string>();
  const scored: ScoredRecommendation[] = [];
  for (const row of rows) {
    const key = `${row.project_id}::${dedupeKey(row)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    scored.push({ ...row, composite_score: scoreRecommendation(row) });
  }
  scored.sort((a, b) => b.composite_score - a.composite_score);
  return scored.slice(0, limit);
}

export async function triggerProjectAnalysis(opts: {
  userId: string;
  projectId: string;
}): Promise<{ eventId: string; suggestionIds: string[] }> {
  const result = await dispatchEvent({
    eventType: 'manual_review',
    userId: opts.userId,
    projectId: opts.projectId,
    mode: 'inline',
    maxInline: 5,
  });
  return {
    eventId: result.eventId,
    suggestionIds: result.suggestions.map((s) => s.id),
  };
}
