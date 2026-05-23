// =====================================================================
// Identimarketing SaaS - lib/cron/runner.ts
//
// Shared helpers for the /api/cron/* routes:
//   - authorizeCronRequest(req): asserts the CRON_SECRET bearer header.
//   - withCronRun(name, fn): logs a row in public.cron_runs around fn().
// =====================================================================

import type { NextRequest } from 'next/server';

import { createServiceClient } from '@/lib/db/client';
import { errors } from '@/lib/error-handler';
import { logger } from '@/lib/logging';

export function authorizeCronRequest(req: NextRequest): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw errors.serverError('CRON_SECRET is not set. Cron jobs are disabled.');
  }
  const header = req.headers.get('authorization') || '';
  const provided = header.startsWith('Bearer ')
    ? header.slice(7)
    : req.nextUrl.searchParams.get('secret');
  if (provided !== secret) {
    throw errors.unauthorized('Invalid cron secret.');
  }
}

export interface CronRunResult<T> {
  ok: boolean;
  stats: T;
  durationMs: number;
  error?: string;
}

export async function withCronRun<T extends Record<string, unknown>>(
  job: string,
  fn: () => Promise<T>,
): Promise<CronRunResult<T>> {
  const supabase = createServiceClient();
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const { data: row, error: insertErr } = await supabase
    .from('cron_runs')
    .insert({ job, started_at: startedAt, status: 'running' })
    .select('id')
    .single();
  if (insertErr) {
    logger.warn('cron_runs insert failed', { job, err: insertErr.message });
  }
  const runId = (row as { id?: string } | null)?.id ?? null;

  try {
    const stats = await fn();
    const durationMs = Date.now() - t0;
    if (runId) {
      await supabase
        .from('cron_runs')
        .update({
          finished_at: new Date().toISOString(),
          status: 'ok',
          stats: { ...stats, duration_ms: durationMs },
        })
        .eq('id', runId);
    }
    logger.info(`cron.${job} ok`, { duration_ms: durationMs, ...stats });
    return { ok: true, stats, durationMs };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - t0;
    if (runId) {
      await supabase
        .from('cron_runs')
        .update({
          finished_at: new Date().toISOString(),
          status: 'failed',
          error: message,
          stats: { duration_ms: durationMs },
        })
        .eq('id', runId);
    }
    logger.error(`cron.${job} failed`, { err: message, duration_ms: durationMs });
    return { ok: false, stats: {} as T, durationMs, error: message };
  }
}
