// =====================================================================
// Identimarketing SaaS - lib/stripe/limits.ts
//
// Per-plan resource limits + helpers for the billing dashboard and any
// route that wants to gate a write behind the current plan.
// =====================================================================

import type { TypedSupabaseClient } from '@/lib/db/client';
import type { Billing } from '@/lib/db/types';
import { logger } from '@/lib/logging';

import { getPlanForPriceId, PLANS, type Plan, type PlanId } from './plans';

export interface BillingSnapshot {
  billing: Billing | null;
  plan: Plan;
  active: boolean;
}

export async function getBillingSnapshot(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<BillingSnapshot> {
  const { data, error } = await supabase
    .from('billing')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    logger.warn('billing: getBillingSnapshot failed', { userId, err: error.message });
    return { billing: null, plan: PLANS.free, active: false };
  }
  const row = (data ?? null) as Billing | null;
  let plan: Plan;
  if (row?.price_id) {
    plan = getPlanForPriceId(row.price_id);
  } else if (row?.plan && (PLANS as Record<string, Plan>)[row.plan]) {
    plan = PLANS[row.plan as PlanId];
  } else {
    plan = PLANS.free;
  }
  const active = Boolean(
    row && ['active', 'trialing', 'past_due'].includes(row.status as string),
  );
  return { billing: row, plan, active };
}

// ---------------------------------------------------------------------
// Usage counters
// ---------------------------------------------------------------------
export interface UsageSnapshot {
  clients: number;
  teamMembers: number;
  projects: number;
  monthlyReports: number;
  monthlyEmpireOsRuns: number;
}

async function countRows(
  supabase: TypedSupabaseClient,
  table: string,
  filters: Record<string, string>,
  rangeStart?: string,
): Promise<number> {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val);
  }
  if (rangeStart) query = query.gte('created_at', rangeStart);
  const { count, error } = await query;
  if (error) {
    logger.warn('billing: count failed', { table, err: error.message });
    return 0;
  }
  return count ?? 0;
}

export async function getUsageSnapshot(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<UsageSnapshot> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthIso = monthStart.toISOString();

  const [clients, teamMembers, projects, monthlyReports, monthlyEmpireRuns] = await Promise.all([
    countRows(supabase, 'clients', { user_id: userId }),
    countRows(supabase, 'team_members', { owner_id: userId }),
    countRows(supabase, 'projects', { user_id: userId }),
    countRows(supabase, 'reports', { user_id: userId }, monthIso),
    countRows(supabase, 'empire_os_events', { user_id: userId }, monthIso),
  ]);

  return {
    clients,
    teamMembers,
    projects,
    monthlyReports,
    monthlyEmpireOsRuns: monthlyEmpireRuns,
  };
}

// ---------------------------------------------------------------------
// Limit checks
// ---------------------------------------------------------------------
export type LimitResource = keyof Plan['limits'];

export interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  unlimited: boolean;
  /** True if the user is currently at the boundary (current === limit). */
  atLimit: boolean;
}

function checkOne(current: number, limit: number): LimitCheck {
  const unlimited = limit < 0;
  if (unlimited) return { allowed: true, current, limit, unlimited: true, atLimit: false };
  return {
    allowed: current < limit,
    current,
    limit,
    unlimited: false,
    atLimit: current >= limit,
  };
}

export interface PlanUsageReport {
  plan: Plan;
  active: boolean;
  usage: UsageSnapshot;
  checks: Record<LimitResource, LimitCheck>;
}

export async function getPlanUsageReport(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<PlanUsageReport> {
  const [{ plan, active }, usage] = await Promise.all([
    getBillingSnapshot(supabase, userId),
    getUsageSnapshot(supabase, userId),
  ]);
  const checks: Record<LimitResource, LimitCheck> = {
    clients: checkOne(usage.clients, plan.limits.clients),
    teamMembers: checkOne(usage.teamMembers, plan.limits.teamMembers),
    projects: checkOne(usage.projects, plan.limits.projects),
    monthlyReports: checkOne(usage.monthlyReports, plan.limits.monthlyReports),
    empireOsRunsPerMonth: checkOne(
      usage.monthlyEmpireOsRuns,
      plan.limits.empireOsRunsPerMonth,
    ),
  };
  return { plan, active, usage, checks };
}

/**
 * Throws when the user has hit the limit for the given resource. Routes
 * that want to enforce this can do:
 *   await assertWithinLimit(supabase, user.id, 'clients');
 */
export async function assertWithinLimit(
  supabase: TypedSupabaseClient,
  userId: string,
  resource: LimitResource,
): Promise<void> {
  const report = await getPlanUsageReport(supabase, userId);
  const check = report.checks[resource];
  if (!check.allowed) {
    const planName = report.plan.name;
    throw Object.assign(
      new Error(
        `Your ${planName} plan is limited to ${check.limit} ${resource.replace(
          /([A-Z])/g,
          ' $1',
        ).toLowerCase().trim()}. Upgrade to add more.`,
      ),
      { code: 'plan_limit_exceeded', http: 402 },
    );
  }
}
