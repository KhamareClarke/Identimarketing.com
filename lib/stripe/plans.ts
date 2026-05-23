// =====================================================================
// Identimarketing SaaS - lib/stripe/plans.ts
//
// Single source of truth for billing plans. Each plan declares its
// limits, marketing description, and the Stripe price id it maps to
// in the current environment.
// =====================================================================

import type { SubscriptionTier } from '@/lib/db/types';

export type PlanId = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Plan {
  id: PlanId;
  /** Marketing-friendly name. */
  name: string;
  /** Maps to profiles.subscription_tier. */
  tier: SubscriptionTier;
  /** Monthly price in GBP (display only - source of truth is the Stripe price id). */
  priceGbp: number;
  /** ISO 4217 currency for display (lowercase, e.g. 'gbp'). */
  currency: 'gbp' | 'usd' | 'eur';
  /** Stripe price id (from env). */
  priceId: string | null;
  /** Two-line marketing tagline. */
  tagline: string;
  /** Bullet-point features for the plan-selector. */
  features: string[];
  /** Resource caps. -1 means unlimited. */
  limits: {
    clients: number;
    teamMembers: number;
    projects: number;
    monthlyReports: number;
    empireOsRunsPerMonth: number;
  };
}

const STARTER_PRICE = process.env.STRIPE_PRICE_STARTER ?? null;
const PRO_PRICE = process.env.STRIPE_PRICE_PROFESSIONAL ?? null;
const ENTERPRISE_PRICE = process.env.STRIPE_PRICE_ENTERPRISE ?? null;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    tier: 'free',
    priceGbp: 0,
    currency: 'gbp',
    priceId: null,
    tagline: 'Kick the tyres - one client and full Empire OS preview.',
    features: [
      '1 client',
      '1 team member',
      '1 project',
      'Empire OS preview (5 runs / month)',
      'Email-only support',
    ],
    limits: {
      clients: 1,
      teamMembers: 1,
      projects: 1,
      monthlyReports: 1,
      empireOsRunsPerMonth: 5,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    tier: 'starter',
    priceGbp: 999,
    currency: 'gbp',
    priceId: STARTER_PRICE,
    tagline: 'For solo agencies and freelancers shipping monthly retainers.',
    features: [
      'Up to 5 clients',
      'Up to 2 team members',
      'Basic analytics & monthly reports',
      'Empire OS (50 runs / month)',
      'Email support (24h SLA)',
    ],
    limits: {
      clients: 5,
      teamMembers: 2,
      projects: 15,
      monthlyReports: 10,
      empireOsRunsPerMonth: 50,
    },
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    tier: 'pro',
    priceGbp: 2999,
    currency: 'gbp',
    priceId: PRO_PRICE,
    tagline: 'For growing agencies juggling multi-service retainers.',
    features: [
      'Up to 25 clients',
      'Up to 10 team members',
      'Advanced analytics + shareable reports',
      'Empire OS (300 runs / month)',
      'Priority support (4h SLA)',
    ],
    limits: {
      clients: 25,
      teamMembers: 10,
      projects: 100,
      monthlyReports: 50,
      empireOsRunsPerMonth: 300,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    priceGbp: 9999,
    currency: 'gbp',
    priceId: ENTERPRISE_PRICE,
    tagline: 'Custom-built scale: dedicated CSM, SSO, custom integrations.',
    features: [
      'Unlimited clients, projects, and team members',
      'Empire OS unlimited',
      'Dedicated success manager',
      'SAML SSO and audit logs',
      'Custom contract & invoicing',
    ],
    limits: {
      clients: -1,
      teamMembers: -1,
      projects: -1,
      monthlyReports: -1,
      empireOsRunsPerMonth: -1,
    },
  },
};

export const PUBLIC_PLAN_IDS: PlanId[] = ['starter', 'pro', 'enterprise'];

export function listPublicPlans(): Plan[] {
  return PUBLIC_PLAN_IDS.map((id) => PLANS[id]);
}

export function getPlan(id: PlanId | string | null | undefined): Plan {
  if (!id) return PLANS.free;
  if ((PLANS as Record<string, Plan>)[id]) return PLANS[id as PlanId];
  // Map Stripe price id -> plan
  for (const plan of Object.values(PLANS)) {
    if (plan.priceId && plan.priceId === id) return plan;
  }
  return PLANS.free;
}

export function getPlanForPriceId(priceId: string | null | undefined): Plan {
  if (!priceId) return PLANS.free;
  for (const plan of Object.values(PLANS)) {
    if (plan.priceId === priceId) return plan;
  }
  return PLANS.free;
}

/** True when every public plan has a Stripe price id configured. */
export function isStripeConfigured(): boolean {
  return (
    Boolean(process.env.STRIPE_SECRET_KEY) &&
    PUBLIC_PLAN_IDS.every((id) => PLANS[id].priceId)
  );
}
