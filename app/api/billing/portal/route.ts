// =====================================================================
// POST /api/billing/portal
//
// Creates a Stripe Customer Portal session and returns the redirect URL.
// The Portal is the canonical place users update payment methods,
// switch plans, and cancel subscriptions.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import { errors, withErrorHandler } from '@/lib/error-handler';
import { isStripeReady } from '@/lib/stripe/setup';
import { createPortalSession } from '@/lib/stripe/subscriptions';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  returnUrl: z.string().url().optional(),
});

export const POST = withErrorHandler('api.billing.portal.POST', async (req: NextRequest) => {
  const { user } = await requireUserApi();
  if (!isStripeReady()) {
    throw errors.badRequest(
      'Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local and restart.',
    );
  }
  const body = await req.json().catch(() => ({}));
  const input = schema.parse(body);
  const result = await createPortalSession({ userId: user.id, returnUrl: input.returnUrl });
  return NextResponse.json(result);
});
