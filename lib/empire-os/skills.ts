// =====================================================================
// Identimarketing SaaS - Empire OS skills executor
//
// Runs Empire OS skills (system prompts loaded from .agents/skills/*)
// against a ProjectContextBundle, validates the structured LLM output
// against a Zod schema, and persists each recommendation as a row in
// empire_os_suggestions.
// =====================================================================

import pLimit from 'p-limit';
import { z } from 'zod';

import type { TypedSupabaseClient } from '@/lib/db/client';
import { createServiceClient } from '@/lib/db/client';
import type {
  EmpireEventStatus,
  EmpireOSSuggestion,
  RecommendationType,
} from '@/lib/db/types';
import { logger } from '@/lib/logging';

import type { ProjectContextBundle } from './event-system';
import { isOverBudget, runLLMJson } from './llm';
import { getSkill, type Skill } from './skill-registry';

// ---------------------------------------------------------------------
// LLM output schema
// ---------------------------------------------------------------------
const RECOMMENDATION_TYPES = [
  'generate_content',
  'email_sequence',
  'social_calendar',
  'ad_copy',
  'strategy',
  'advice',
] as const;

export const SkillOutputSchema = z.object({
  title: z.string().min(3).max(160),
  summary: z.string().min(10).max(2000),
  recommendation: z.string().min(10).max(4000),
  recommendation_type: z.enum(RECOMMENDATION_TYPES).default('advice'),
  confidence_score: z.number().min(0).max(100).default(70),
  impact_score: z.number().min(0).max(100).default(60),
  estimated_time_minutes: z.number().int().min(0).max(10000).optional().nullable(),
  estimated_value: z.number().min(0).max(10_000_000).optional().nullable(),
  action_steps: z.array(z.string().min(2).max(500)).max(20).default([]),
  auto_executable: z.boolean().default(false),
});

export type SkillOutput = z.infer<typeof SkillOutputSchema>;

// ---------------------------------------------------------------------
// Context serializer - keeps the JSON we send to Claude lean.
// ---------------------------------------------------------------------
function serializeContext(ctx: ProjectContextBundle): string {
  const project = ctx.project
    ? {
        id: ctx.project.id,
        name: ctx.project.name,
        description: ctx.project.description,
        service_type: ctx.project.service_type,
        status: ctx.project.status,
        budget: ctx.project.budget,
        spent: ctx.project.spent,
        start_date: ctx.project.start_date,
        end_date: ctx.project.end_date,
        client: ctx.project.client ?? null,
      }
    : null;
  const client = ctx.client
    ? {
        id: ctx.client.id,
        company_name: ctx.client.company_name,
        industry: ctx.client.industry,
        website: ctx.client.website,
        budget: ctx.client.budget,
        status: ctx.client.status,
      }
    : null;
  const deliverables = (ctx.deliverables ?? []).slice(0, 25).map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    status: d.status,
    due_date: d.due_date,
    completed_date: d.completed_date,
  }));
  const metrics = (ctx.metrics ?? []).slice(-30).map((m) => ({
    metric_type: m.metric_type,
    value: m.metric_value,
    date: m.metric_date,
  }));
  return JSON.stringify({ project, client, deliverables, metrics }, null, 2);
}

// ---------------------------------------------------------------------
// JSON-instruction appended to every skill system prompt.
// ---------------------------------------------------------------------
function buildSystemPrompt(skill: Skill): string {
  return `${skill.systemPrompt}

---

# Output contract (Empire OS)

You are being invoked programmatically by the Empire OS recommendations engine, NOT by a chat user. Do not ask clarifying questions. Use the project context below to produce ONE specific, actionable recommendation.

Return a single JSON object with these fields:

- title           string  - <= 120 chars, action-oriented
- summary         string  - 1-3 sentences explaining the situation
- recommendation  string  - the concrete recommendation (markdown OK)
- recommendation_type  one of: "generate_content" | "email_sequence" | "social_calendar" | "ad_copy" | "strategy" | "advice"
- confidence_score   integer 0-100  - how confident you are this is the right call
- impact_score       integer 0-100  - estimated business impact
- estimated_time_minutes  integer  - implementation time
- estimated_value         number   - estimated USD value (revenue, savings, etc.)
- action_steps       array of strings - 3-7 concrete steps to implement
- auto_executable    boolean  - true ONLY if this recommendation can be fulfilled by generating an output artifact (content, copy, email sequence, calendar, ad copy). false otherwise.

Be specific. Cite the project data. No generic platitudes.`;
}

function buildUserPrompt(skill: Skill, ctx: ProjectContextBundle, eventType: string): string {
  return `Skill: ${skill.name} (${skill.slug})
Event: ${eventType}

Project context (JSON):
${serializeContext(ctx)}

Apply the skill above to this specific project and emit the JSON object described in the Output contract.`;
}

// ---------------------------------------------------------------------
// runSkill - single skill, single LLM call
// ---------------------------------------------------------------------
export interface SkillRunResult {
  skillSlug: string;
  skillName: string;
  ok: boolean;
  output?: SkillOutput;
  costUsd?: number;
  durationMs?: number;
  error?: string;
}

export interface RunSkillOptions {
  skillSlug: string;
  context: ProjectContextBundle;
  userId: string;
  eventType: string;
  budgetUsd?: number | null;
  tier?: 'analysis' | 'bulk';
}

export async function runSkill(opts: RunSkillOptions): Promise<SkillRunResult> {
  const skill = await getSkill(opts.skillSlug);
  if (!skill) {
    return { skillSlug: opts.skillSlug, skillName: opts.skillSlug, ok: false, error: 'Skill not installed' };
  }
  if (isOverBudget({ userId: opts.userId, userBudgetUsd: opts.budgetUsd })) {
    return { skillSlug: skill.slug, skillName: skill.name, ok: false, error: 'Hourly LLM budget exceeded' };
  }
  try {
    const res = await runLLMJson({
      tier: opts.tier ?? 'analysis',
      systemPrompt: buildSystemPrompt(skill),
      userPrompt: buildUserPrompt(skill, opts.context, opts.eventType),
      userId: opts.userId,
      userBudgetUsd: opts.budgetUsd ?? null,
      skillSlug: skill.slug,
      parse: (raw) => SkillOutputSchema.parse(raw),
      maxTokens: 2048,
      temperature: 0.4,
      timeoutMs: 45_000,
    });
    return {
      skillSlug: skill.slug,
      skillName: skill.name,
      ok: true,
      output: res.data,
      costUsd: res.costUsd,
      durationMs: res.durationMs,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('empire-os: skill failed', { skill: skill.slug, err: message });
    return { skillSlug: skill.slug, skillName: skill.name, ok: false, error: message };
  }
}

// ---------------------------------------------------------------------
// runSkills - parallel batch with concurrency cap + persistence
// ---------------------------------------------------------------------
export interface RunSkillsOptions {
  skillSlugs: string[];
  context: ProjectContextBundle;
  userId: string;
  eventType: string;
  budgetUsd?: number | null;
  concurrency?: number;
  tier?: 'analysis' | 'bulk';
  supabase?: TypedSupabaseClient;
}

export interface RunSkillsResult {
  results: SkillRunResult[];
  suggestions: EmpireOSSuggestion[];
}

export async function runSkills(opts: RunSkillsOptions): Promise<RunSkillsResult> {
  const limit = pLimit(Math.max(1, Math.min(4, opts.concurrency ?? 2)));
  const supabase = opts.supabase ?? createServiceClient();

  const tasks = opts.skillSlugs.map((slug) =>
    limit(() =>
      runSkill({
        skillSlug: slug,
        context: opts.context,
        userId: opts.userId,
        eventType: opts.eventType,
        budgetUsd: opts.budgetUsd ?? null,
        tier: opts.tier,
      }),
    ),
  );
  const results = await Promise.all(tasks);
  const suggestions = await persistResults(supabase, opts, results);
  return { results, suggestions };
}

async function persistResults(
  supabase: TypedSupabaseClient,
  opts: RunSkillsOptions,
  results: SkillRunResult[],
): Promise<EmpireOSSuggestion[]> {
  const projectId = opts.context.project?.id;
  if (!projectId) {
    logger.warn('empire-os: cannot persist suggestions without project_id', {
      event: opts.eventType,
      results: results.length,
    });
    return [];
  }
  const rows = results
    .filter((r) => r.ok && r.output)
    .map((r) => {
      const out = r.output!;
      return {
        project_id: projectId,
        user_id: opts.userId,
        skill_name: r.skillName,
        event_type: opts.eventType,
        recommendation_type: out.recommendation_type as RecommendationType,
        title: out.title,
        suggestion_text: out.summary,
        recommendation: out.recommendation,
        confidence_score: Math.round(out.confidence_score),
        impact_score: Math.round(out.impact_score),
        estimated_time_minutes: out.estimated_time_minutes ?? null,
        estimated_value: out.estimated_value ?? null,
        action_steps: out.action_steps,
        auto_executable: Boolean(out.auto_executable),
        status: 'pending',
      };
    });
  if (rows.length === 0) return [];
  const { data, error } = await supabase.from('empire_os_suggestions').insert(rows).select('*');
  if (error) {
    logger.warn('empire-os: suggestions insert failed', { err: error.message });
    return [];
  }
  return (data ?? []) as EmpireOSSuggestion[];
}

// ---------------------------------------------------------------------
// Status mapping helper (used by event-system to mirror failures)
// ---------------------------------------------------------------------
export function deriveEventStatus(results: SkillRunResult[]): EmpireEventStatus {
  if (results.length === 0) return 'completed';
  const ok = results.some((r) => r.ok);
  return ok ? 'completed' : 'failed';
}
