// =====================================================================
// Identimarketing SaaS - Business KPI tracker
//
// Small typed wrapper over the `metrics` table for events the dashboard
// cares about (signups, project lifecycle, deliverable lifecycle,
// revenue events). Fire-and-forget; never throws.
// =====================================================================

import { logger } from './logging';

async function record(name: string, value: number, meta: Record<string, unknown> = {}, userId?: string | null): Promise<void> {
  if (typeof window !== 'undefined') return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const { createServiceClient } = await import('./db/client');
    const supabase = createServiceClient();
    await supabase.from('metrics').insert({ name, value, meta, user_id: userId ?? null });
  } catch (err) {
    logger.warn('metric record failed', { name, err: err instanceof Error ? err.message : String(err) });
  }
}

export const metrics = {
  recordSignup: (userId: string, meta: Record<string, unknown> = {}) =>
    record('user.signup', 1, meta, userId),
  recordLogin: (userId: string, meta: Record<string, unknown> = {}) =>
    record('user.login', 1, meta, userId),
  recordClientCreated: (userId: string, clientId: string) =>
    record('client.created', 1, { clientId }, userId),
  recordProjectCreated: (userId: string, projectId: string, budget: number) =>
    record('project.created', 1, { projectId, budget }, userId),
  recordProjectCompleted: (userId: string, projectId: string, durationDays: number) =>
    record('project.completed', 1, { projectId, durationDays }, userId),
  recordDeliverableCompleted: (userId: string, deliverableId: string) =>
    record('deliverable.completed', 1, { deliverableId }, userId),
  recordRevenue: (userId: string, amount: number, projectId?: string) =>
    record('revenue.collected', amount, { projectId }, userId),
};

export type Metrics = typeof metrics;
