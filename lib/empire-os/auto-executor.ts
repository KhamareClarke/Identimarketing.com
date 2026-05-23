// =====================================================================
// Identimarketing SaaS - Empire OS auto-executor
//
// Turns an approved recommendation into a concrete artifact (blog
// outline, email sequence, ad copy, etc.) by calling Claude with a
// type-specific prompt and persisting the JSON output to
// empire_os_suggestions.applied_output.
//
// Branches by recommendation_type. Falls back to "advice" mode for
// non-content recommendations - we simply mark them approved.
// =====================================================================

import { z } from 'zod';

import type { TypedSupabaseClient } from '@/lib/db/client';
import type { EmpireOSSuggestion, ProjectWithClient } from '@/lib/db/types';
import { logger } from '@/lib/logging';

import { getProjectContextBundle } from './event-system';
import { runLLMJson } from './llm';
import { getSkill } from './skill-registry';

const ContentOutlineSchema = z.object({
  type: z.literal('content_outline'),
  title: z.string(),
  target_keyword: z.string().optional(),
  meta_description: z.string().optional(),
  sections: z
    .array(
      z.object({
        heading: z.string(),
        points: z.array(z.string()).min(1),
      }),
    )
    .min(2),
  call_to_action: z.string().optional(),
});

const EmailSequenceSchema = z.object({
  type: z.literal('email_sequence'),
  audience: z.string(),
  goal: z.string(),
  emails: z
    .array(
      z.object({
        subject: z.string(),
        preheader: z.string().optional(),
        send_day_offset: z.number().int().min(0).max(60),
        body: z.string(),
        cta: z.string().optional(),
      }),
    )
    .min(3)
    .max(10),
});

const SocialCalendarSchema = z.object({
  type: z.literal('social_calendar'),
  weeks: z
    .array(
      z.object({
        week_number: z.number().int().min(1),
        theme: z.string(),
        posts: z
          .array(
            z.object({
              platform: z.string(),
              format: z.string(),
              hook: z.string(),
              caption: z.string(),
              cta: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

const AdCopySchema = z.object({
  type: z.literal('ad_copy'),
  variations: z
    .array(
      z.object({
        platform: z.string(),
        headline: z.string(),
        primary_text: z.string(),
        cta: z.string(),
        target: z.string().optional(),
      }),
    )
    .min(3)
    .max(10),
});

const StrategySchema = z.object({
  type: z.literal('strategy'),
  thesis: z.string(),
  pillars: z.array(z.object({ name: z.string(), tactics: z.array(z.string()).min(1) })).min(2),
  kpis: z.array(z.string()).min(1),
  ninety_day_plan: z.array(z.string()).min(3),
});

export type AppliedOutput =
  | z.infer<typeof ContentOutlineSchema>
  | z.infer<typeof EmailSequenceSchema>
  | z.infer<typeof SocialCalendarSchema>
  | z.infer<typeof AdCopySchema>
  | z.infer<typeof StrategySchema>
  | { type: 'advice'; notes: string };

function getPromptFor(rec: EmpireOSSuggestion, project: ProjectWithClient | null): {
  system: string;
  user: string;
  schema: z.ZodTypeAny;
} {
  const recommendation = rec.recommendation ?? rec.suggestion_text;
  const projectName = project?.name ?? 'this project';
  const service = project?.service_type ?? 'marketing';

  const baseSystem = `You are Empire OS executing an approved recommendation for ${projectName} (${service}).
The user has APPROVED the recommendation below. Produce the concrete artifact they will use.
Return only valid JSON. No prose, no code fences, no comments.`;

  switch (rec.recommendation_type) {
    case 'generate_content':
      return {
        system: baseSystem,
        user: `Approved recommendation:\n\n${recommendation}\n\nProduce a content outline as JSON with this exact shape:\n{\n  "type": "content_outline",\n  "title": "...",\n  "target_keyword": "...",\n  "meta_description": "...",\n  "sections": [ { "heading": "...", "points": ["..."] }, ... ],\n  "call_to_action": "..."\n}\n\nMinimum 3 sections, each with 2-5 bullet points.`,
        schema: ContentOutlineSchema,
      };
    case 'email_sequence':
      return {
        system: baseSystem,
        user: `Approved recommendation:\n\n${recommendation}\n\nProduce an email sequence as JSON with this exact shape:\n{\n  "type": "email_sequence",\n  "audience": "...",\n  "goal": "...",\n  "emails": [ { "subject": "...", "preheader": "...", "send_day_offset": 0, "body": "...", "cta": "..." }, ... ]\n}\n\nMinimum 5 emails, max 10. send_day_offset is days after enrollment.`,
        schema: EmailSequenceSchema,
      };
    case 'social_calendar':
      return {
        system: baseSystem,
        user: `Approved recommendation:\n\n${recommendation}\n\nProduce a 4-week social calendar as JSON:\n{\n  "type": "social_calendar",\n  "weeks": [\n    { "week_number": 1, "theme": "...", "posts": [ { "platform": "instagram", "format": "carousel", "hook": "...", "caption": "...", "cta": "..." } ] }\n  ]\n}\n\nMinimum 3 posts per week across LinkedIn, Instagram, Twitter/X.`,
        schema: SocialCalendarSchema,
      };
    case 'ad_copy':
      return {
        system: baseSystem,
        user: `Approved recommendation:\n\n${recommendation}\n\nProduce ad copy variations as JSON:\n{\n  "type": "ad_copy",\n  "variations": [ { "platform": "meta", "headline": "...", "primary_text": "...", "cta": "Sign Up", "target": "..." }, ... ]\n}\n\nGenerate at least 5 variations across Meta and Google Ads, optimized for distinct hooks.`,
        schema: AdCopySchema,
      };
    case 'strategy':
      return {
        system: baseSystem,
        user: `Approved recommendation:\n\n${recommendation}\n\nProduce a strategy doc as JSON:\n{\n  "type": "strategy",\n  "thesis": "...",\n  "pillars": [ { "name": "...", "tactics": ["..."] } ],\n  "kpis": ["..."],\n  "ninety_day_plan": ["Week 1: ...", "Week 2: ..."]\n}`,
        schema: StrategySchema,
      };
    default:
      return {
        system: baseSystem,
        user: '',
        schema: z.object({ type: z.literal('advice'), notes: z.string() }),
      };
  }
}

export interface ExecuteOptions {
  supabase: TypedSupabaseClient;
  userId: string;
  recommendation: EmpireOSSuggestion;
  hourlyBudgetUsd?: number | null;
}

export interface ExecuteResult {
  ok: boolean;
  output: AppliedOutput | null;
  costUsd?: number;
  error?: string;
}

export async function executeRecommendation(opts: ExecuteOptions): Promise<ExecuteResult> {
  const { supabase, userId, recommendation } = opts;
  const recType = recommendation.recommendation_type ?? 'advice';

  // Plain advice: just mark approved.
  if (recType === 'advice' || !recommendation.auto_executable) {
    const notes = recommendation.recommendation ?? recommendation.suggestion_text;
    const output: AppliedOutput = { type: 'advice', notes };
    await supabase
      .from('empire_os_suggestions')
      .update({
        status: 'approved',
        applied_at: new Date().toISOString(),
        applied_output: output,
        applied_by: userId,
      })
      .eq('id', recommendation.id);
    return { ok: true, output };
  }

  // Generate artifact via Claude.
  const ctx = await getProjectContextBundle(supabase, {
    projectId: recommendation.project_id,
    userId,
  });
  const { system, user, schema } = getPromptFor(recommendation, ctx.project);
  if (!user) {
    return { ok: false, output: null, error: `No executor for type ${recType}` };
  }

  // Pull skill context for richer prompting (optional).
  const skill = await getSkill(recommendation.skill_name).catch(() => undefined);
  const enrichedSystem = skill ? `${system}\n\nSkill context:\n${skill.systemPrompt.slice(0, 1500)}` : system;

  try {
    const res = await runLLMJson({
      systemPrompt: enrichedSystem,
      userPrompt: user,
      userId,
      userBudgetUsd: opts.hourlyBudgetUsd ?? null,
      skillSlug: recommendation.skill_name,
      tier: 'analysis',
      maxTokens: 3072,
      temperature: 0.5,
      timeoutMs: 60_000,
      parse: (raw) => schema.parse(raw) as AppliedOutput,
    });
    await supabase
      .from('empire_os_suggestions')
      .update({
        status: 'applied',
        applied_at: new Date().toISOString(),
        applied_output: res.data,
        applied_by: userId,
      })
      .eq('id', recommendation.id);
    return { ok: true, output: res.data, costUsd: res.costUsd };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('empire-os: auto-execute failed', {
      recId: recommendation.id,
      type: recType,
      err: message,
    });
    return { ok: false, output: null, error: message };
  }
}
