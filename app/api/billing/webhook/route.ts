// =====================================================================
// POST /api/billing/webhook
//
// Stripe webhook receiver. Verifies the signature with
// STRIPE_WEBHOOK_SECRET and dispatches to lib/stripe/webhooks.ts.
//
// IMPORTANT: this route must read the raw request body (not parsed JSON)
// or Stripe's signature check will fail. Next.js App Router gives us
// req.text() which returns the raw body verbatim.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { logger } from '@/lib/logging';
import { getStripe } from '@/lib/stripe/setup';
import { handleStripeWebhook } from '@/lib/stripe/webhooks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not configured on the server.' },
      { status: 503 },
    );
  }
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature header.' }, { status: 400 });
  }

  let payload: string;
  try {
    payload = await req.text();
  } catch (err) {
    logger.warn('stripe webhook: failed to read raw body', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Could not read request body.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    logger.warn('stripe webhook: signature verification failed', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    await handleStripeWebhook(event);
    return NextResponse.json({ received: true, id: event.id, type: event.type });
  } catch (err) {
    // Returning 500 prompts Stripe to retry with exponential backoff.
    logger.error('stripe webhook: handler threw', {
      id: event.id,
      type: event.type,
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Webhook handler failure.' }, { status: 500 });
  }
}
