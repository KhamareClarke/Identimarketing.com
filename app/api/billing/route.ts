// =====================================================================
// /api/billing
//
// GET  - current plan + usage snapshot for the dashboard.
// POST - create a Stripe Checkout session for the given plan, OR
//        update an existing subscription (when one already exists).
//        Body: { planId, action?: 'checkout' | 'update' | 'cancel' | 'resume' }
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import { errors, withErrorHandler } from '@/lib/error-handler';
import { getPlanUsageReport } from '@/lib/stripe/limits';
import { isStripeConfigured, PLANS, type PlanId } from '@/lib/stripe/plans';
import {
  cancelSubscription,
  createCheckoutSession,
  resumeSubscription,
  updateSubscription,
} from '@/lib/stripe/subscriptions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PLAN_IDS = ['starter', 'pro', 'enterprise'] as const;

const postSchema = z.object({
  planId: z.enum(PLAN_IDS).optional(),
  action: z.enum(['checkout', 'update', 'cancel', 'resume']).default('checkout'),
  immediate: z.boolean().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  trialDays: z.number().int().min(0).max(60).optional(),
  promotionCode: z.string().optional(),
});

export const GET = withErrorHandler('api.billing.GET', async () => {
  const { user, supabase } = await requireUserApi();
  const report = await getPlanUsageReport(supabase, user.id);
  return NextResponse.json({
    plan: report.plan,
    active: report.active,
    billing: report.usage,
    checks: report.checks,
  });
});

export const POST = withErrorHandler('api.billing.POST', async (req: NextRequest) => {
  const { user } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const input = postSchema.parse(body);

  switch (input.action) {
    case 'checkout': {
      if (!input.planId) throw errors.badRequest('planId is required for checkout.');
      if (!isStripeConfigured()) {
        throw errors.badRequest(
          'Stripe is not fully configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_<PLAN> env vars and restart.',
        );
      }
      const plan = PLANS[input.planId as PlanId];
      if (!plan.priceId) {
        throw errors.badRequest(
          `Plan ${plan.id} has no Stripe price id. Set STRIPE_PRICE_${plan.id.toUpperCase()}.`,
        );
      }
      const result = await createCheckoutSession({
        userId: user.id,
        planId: input.planId as PlanId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        trialDays: input.trialDays,
        promotionCode: input.promotionCode,
      });
      return NextResponse.json({ ...result });
    }
    case 'update': {
      if (!input.planId) throw errors.badRequest('planId is required for update.');
      const result = await updateSubscription({
        userId: user.id,
        planId: input.planId as PlanId,
      });
      return NextResponse.json({ success: true, ...result });
    }
    case 'cancel': {
      const result = await cancelSubscription({ userId: user.id, immediate: input.immediate });
      return NextResponse.json({ success: true, ...result });
    }
    case 'resume': {
      await resumeSubscription({ userId: user.id });
      return NextResponse.json({ success: true });
    }
    default:
      throw errors.badRequest('Unknown action.');
  }
});
