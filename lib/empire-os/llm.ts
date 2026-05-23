// =====================================================================
// Identimarketing SaaS - Empire OS LLM wrapper
//
// Thin Anthropic Claude client with:
//   - Per-call timeout (default 30s)
//   - Retry on 429 / 5xx with exponential backoff (max 3 attempts)
//   - Hourly USD budget guard (EMPIRE_OS_BUDGET_PER_HOUR_USD)
//   - Cost recording to public.metrics
//   - JSON-mode helper that asks Claude to emit a JSON object and parses it
//
// Models:
//   - "analysis" tier: ANTHROPIC_MODEL_ANALYSIS  (Sonnet)
//   - "bulk" tier:     ANTHROPIC_MODEL_BULK      (Haiku)
// =====================================================================

import Anthropic from '@anthropic-ai/sdk';

import { logger } from '@/lib/logging';

const DEFAULT_ANALYSIS = 'claude-sonnet-4-20250514';
const DEFAULT_BULK = 'claude-haiku-4-20250514';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing required environment variable: ANTHROPIC_API_KEY');
  }
  client = new Anthropic({ apiKey, maxRetries: 0 });
  return client;
}

export type LLMTier = 'analysis' | 'bulk';

export function getModelFor(tier: LLMTier): string {
  if (tier === 'bulk') {
    return process.env.ANTHROPIC_MODEL_BULK || DEFAULT_BULK;
  }
  return process.env.ANTHROPIC_MODEL_ANALYSIS || DEFAULT_ANALYSIS;
}

// ---------------------------------------------------------------------
// Pricing table - USD per 1M tokens. Updated for current Claude 4 prices.
// Used only for guardrail accounting; if a model isn't listed we fall
// back to Sonnet pricing (slight over-estimate).
// ---------------------------------------------------------------------
const PRICING_PER_MTOKEN: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'claude-haiku-4-20250514': { input: 0.8, output: 4 },
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
};

function priceFor(model: string): { input: number; output: number } {
  return PRICING_PER_MTOKEN[model] || PRICING_PER_MTOKEN[DEFAULT_ANALYSIS]!;
}

function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = priceFor(model);
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}

// ---------------------------------------------------------------------
// In-process hourly spend tracker. Multi-instance deployments should
// move this to the metrics table query (see assertBudget()). For now
// this is an additive safety check.
// ---------------------------------------------------------------------
interface SpendSlot {
  hourEpoch: number;
  usd: number;
}
const spendByUser = new Map<string, SpendSlot>();

function currentHourEpoch(): number {
  return Math.floor(Date.now() / (60 * 60 * 1000));
}

function readBudgetUsd(userBudget?: number | null): number {
  if (userBudget && userBudget > 0) return Number(userBudget);
  const raw = process.env.EMPIRE_OS_BUDGET_PER_HOUR_USD;
  const env = raw ? Number(raw) : NaN;
  return Number.isFinite(env) && env > 0 ? env : 5;
}

export interface BudgetGuardOptions {
  userId?: string | null;
  userBudgetUsd?: number | null;
}

export function getHourlySpend(userId: string | null = null): number {
  const slot = spendByUser.get(userId ?? '__global__');
  if (!slot) return 0;
  if (slot.hourEpoch !== currentHourEpoch()) return 0;
  return slot.usd;
}

function recordSpend(userId: string | null, usd: number): void {
  const key = userId ?? '__global__';
  const hour = currentHourEpoch();
  const slot = spendByUser.get(key);
  if (!slot || slot.hourEpoch !== hour) {
    spendByUser.set(key, { hourEpoch: hour, usd });
  } else {
    slot.usd += usd;
  }
}

export function isOverBudget(opts: BudgetGuardOptions = {}): boolean {
  const spent = getHourlySpend(opts.userId ?? null);
  const budget = readBudgetUsd(opts.userBudgetUsd);
  return spent >= budget;
}

// ---------------------------------------------------------------------
// Sleep helper for retry backoff
// ---------------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------
// Persist a cost sample to public.metrics (fire-and-forget)
// ---------------------------------------------------------------------
async function persistCost(opts: {
  model: string;
  tier: LLMTier;
  userId: string | null;
  skillSlug: string | null;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  ok: boolean;
}): Promise<void> {
  if (typeof window !== 'undefined') return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const { createServiceClient } = await import('@/lib/db/client');
    const supabase = createServiceClient();
    const cost = estimateCostUsd(opts.model, opts.inputTokens, opts.outputTokens);
    await supabase.from('metrics').insert({
      name: 'empire_os.llm.call',
      value: cost,
      duration_ms: opts.durationMs,
      user_id: opts.userId,
      meta: {
        model: opts.model,
        tier: opts.tier,
        skill: opts.skillSlug,
        input_tokens: opts.inputTokens,
        output_tokens: opts.outputTokens,
        ok: opts.ok,
      },
    });
  } catch (err) {
    logger.warn('empire-os: cost persist failed', {
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

// ---------------------------------------------------------------------
// runLLM - low-level entry point
// ---------------------------------------------------------------------
export interface RunLLMOptions extends BudgetGuardOptions {
  tier?: LLMTier;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  skillSlug?: string | null;
  maxAttempts?: number;
}

export interface RunLLMResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  attempts: number;
}

export async function runLLM(options: RunLLMOptions): Promise<RunLLMResult> {
  const tier = options.tier ?? 'analysis';
  const model = options.model ?? getModelFor(tier);
  const userId = options.userId ?? null;
  const skillSlug = options.skillSlug ?? null;

  if (isOverBudget({ userId, userBudgetUsd: options.userBudgetUsd })) {
    throw new Error(
      `Empire OS hourly budget exceeded (${readBudgetUsd(options.userBudgetUsd).toFixed(2)} USD). Try again next hour.`,
    );
  }

  const maxTokens = options.maxTokens ?? 2048;
  const temperature = options.temperature ?? 0.4;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);

  const anthropic = getClient();
  let attempt = 0;
  let lastError: unknown = null;
  const startedAt = Date.now();

  while (attempt < maxAttempts) {
    attempt++;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await anthropic.messages.create(
        {
          model,
          max_tokens: maxTokens,
          temperature,
          system: options.systemPrompt,
          messages: [{ role: 'user', content: options.userPrompt }],
        },
        { signal: controller.signal },
      );
      clearTimeout(timeout);

      const text = res.content
        .map((block) => ('text' in block ? block.text : ''))
        .join('')
        .trim();
      const inputTokens = res.usage?.input_tokens ?? 0;
      const outputTokens = res.usage?.output_tokens ?? 0;
      const costUsd = estimateCostUsd(model, inputTokens, outputTokens);
      const durationMs = Date.now() - startedAt;

      recordSpend(userId, costUsd);
      void persistCost({ model, tier, userId, skillSlug, inputTokens, outputTokens, durationMs, ok: true });

      return { text, model, inputTokens, outputTokens, costUsd, durationMs, attempts: attempt };
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      const status = (err as { status?: number }).status;
      const isRetriable = status === 429 || (status !== undefined && status >= 500 && status < 600);
      const aborted = (err as { name?: string }).name === 'AbortError';
      logger.warn('empire-os LLM attempt failed', {
        attempt,
        status,
        aborted,
        message: err instanceof Error ? err.message : String(err),
        model,
        skill: skillSlug,
      });
      if (attempt >= maxAttempts || (!isRetriable && !aborted)) break;
      const backoffMs = Math.min(500 * 2 ** (attempt - 1), 4000);
      await sleep(backoffMs);
    }
  }

  const durationMs = Date.now() - startedAt;
  void persistCost({
    model,
    tier,
    userId,
    skillSlug,
    inputTokens: 0,
    outputTokens: 0,
    durationMs,
    ok: false,
  });
  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`LLM call failed after ${attempt} attempt(s): ${message}`);
}

// ---------------------------------------------------------------------
// runLLMJson - Asks Claude for a JSON response and parses it.
// Adds a "respond with valid JSON only" suffix to the user prompt and
// retries once on parse failure with a stricter prompt.
// ---------------------------------------------------------------------
export interface RunLLMJsonOptions<T> extends RunLLMOptions {
  /** Optional Zod or zod-like parser. If omitted we just return JSON.parse'd value. */
  parse?: (raw: unknown) => T;
}

export interface RunLLMJsonResult<T> extends RunLLMResult {
  data: T;
}

const JSON_GUIDANCE =
  '\n\nRespond with a single JSON object only. No prose before or after. No code fences. No comments. The JSON must parse with JSON.parse().';

function extractJson(text: string): string {
  // Strip ``` fences if Claude ignored the no-fences instruction.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1]!.trim();
  // Find the first { and last } to handle prose-wrapped JSON.
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return text.trim();
  return text.slice(first, last + 1).trim();
}

export async function runLLMJson<T = unknown>(options: RunLLMJsonOptions<T>): Promise<RunLLMJsonResult<T>> {
  const augmented: RunLLMOptions = {
    ...options,
    userPrompt: options.userPrompt + JSON_GUIDANCE,
  };
  let result = await runLLM(augmented);
  let raw: unknown;
  try {
    raw = JSON.parse(extractJson(result.text));
  } catch (firstErr) {
    logger.warn('empire-os: JSON parse failed once, retrying with stricter prompt', {
      sample: result.text.slice(0, 240),
    });
    const stricter: RunLLMOptions = {
      ...options,
      userPrompt:
        options.userPrompt +
        '\n\nYour previous response was not valid JSON. Respond again with ONLY a valid JSON object. Do not include any other text.',
      temperature: 0,
    };
    result = await runLLM(stricter);
    raw = JSON.parse(extractJson(result.text));
  }

  const data = options.parse ? options.parse(raw) : (raw as T);
  return { ...result, data };
}
