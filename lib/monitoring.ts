// =====================================================================
// Identimarketing SaaS - Runtime monitoring
//
// In-process aggregation of timing samples (count, total, avg). Flushed
// to the `metrics` table every FLUSH_INTERVAL_MS via the service-role
// client. Cheap, no external dependency.
//
// Plug Sentry in here once SENTRY_DSN is provided.
// =====================================================================

import { logger } from './logging';

interface Sample {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
}

const samples: Map<string, Sample> = new Map();
const FLUSH_INTERVAL_MS = 60_000;
let flushTimer: ReturnType<typeof setInterval> | null = null;

function ensureFlusher(): void {
  if (flushTimer || typeof window !== 'undefined') return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  flushTimer = setInterval(() => {
    void flushSamples();
  }, FLUSH_INTERVAL_MS);
  if (typeof flushTimer === 'object' && flushTimer && 'unref' in flushTimer) {
    (flushTimer as unknown as { unref: () => void }).unref();
  }
}

async function flushSamples(): Promise<void> {
  if (samples.size === 0) return;
  const snapshot = Array.from(samples.entries());
  samples.clear();
  try {
    const { createServiceClient } = await import('./db/client');
    const supabase = createServiceClient();
    const rows = snapshot.map(([name, s]) => ({
      name,
      value: s.count,
      duration_ms: s.totalMs / Math.max(s.count, 1),
      meta: { total_ms: s.totalMs, min_ms: s.minMs, max_ms: s.maxMs, count: s.count },
    }));
    await supabase.from('metrics').insert(rows);
  } catch (err) {
    logger.warn('monitoring flush failed', { err: err instanceof Error ? err.message : String(err) });
  }
}

export function trackTiming(name: string, durationMs: number, meta: Record<string, unknown> = {}): void {
  ensureFlusher();
  const current = samples.get(name);
  if (current) {
    current.count += 1;
    current.totalMs += durationMs;
    current.minMs = Math.min(current.minMs, durationMs);
    current.maxMs = Math.max(current.maxMs, durationMs);
  } else {
    samples.set(name, { count: 1, totalMs: durationMs, minMs: durationMs, maxMs: durationMs });
  }
  if (durationMs > 2_000) {
    logger.warn(`slow operation: ${name}`, { durationMs, ...meta });
  }
}

export async function track(name: string, fn: () => Promise<unknown>, meta: Record<string, unknown> = {}): Promise<unknown> {
  const start = Date.now();
  try {
    const result = await fn();
    trackTiming(name, Date.now() - start, { ok: true, ...meta });
    return result;
  } catch (err) {
    trackTiming(name, Date.now() - start, { ok: false, ...meta });
    throw err;
  }
}

export async function flushMonitoringNow(): Promise<void> {
  await flushSamples();
}
