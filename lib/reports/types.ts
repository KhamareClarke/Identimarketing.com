// =====================================================================
// Identimarketing SaaS - lib/reports/types.ts
//
// Shared shape consumed by build-report-html.ts and pdf-converter.ts.
// Keeping this tiny so both renderers stay in lockstep.
// =====================================================================

import type { MetricCard } from '@/lib/analytics/metrics-processor';
import type { Client, EmpireOSSuggestion, ProjectWithClient } from '@/lib/db/types';

export interface ReportRecommendation {
  title: string;
  summary: string;
  impactScore: number | null;
  confidenceScore: number;
  estimatedValue: number | null;
  actionSteps: string[];
  recommendationType: string | null;
}

export interface ReportPeriod {
  from: string;
  to: string;
}

export interface ReportData {
  generatedAt: string;
  period: ReportPeriod;
  agency: {
    name: string;
    logoUrl?: string | null;
  };
  project: Pick<ProjectWithClient, 'id' | 'name' | 'description' | 'service_type' | 'budget' | 'spent' | 'status' | 'start_date' | 'end_date'>;
  client: Pick<Client, 'id' | 'company_name' | 'industry' | 'website' | 'contact_email'> | null;
  executiveSummary: string;
  metricCards: MetricCard[];
  deliverables: {
    name: string;
    description: string | null;
    status: string;
    completedDate: string | null;
  }[];
  highlights: string[];
  challenges: string[];
  recommendations: ReportRecommendation[];
  nextSteps: string[];
  roiSummary: {
    totalEstimatedValue: number;
    totalBudget: number;
    totalSpent: number;
    roiMultiple: number | null;
  };
}

export function mapSuggestionsToRecommendations(
  suggestions: EmpireOSSuggestion[],
  limit = 8,
): ReportRecommendation[] {
  return suggestions.slice(0, limit).map((s) => ({
    title: s.title ?? s.suggestion_text.slice(0, 80),
    summary: s.suggestion_text,
    impactScore: s.impact_score ?? null,
    confidenceScore: s.confidence_score,
    estimatedValue: s.estimated_value ?? null,
    actionSteps: s.action_steps ?? [],
    recommendationType: s.recommendation_type,
  }));
}
