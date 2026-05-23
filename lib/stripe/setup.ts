// =====================================================================
// Identimarketing SaaS - lib/stripe/setup.ts
//
// Lazy Stripe client singleton. Throws a clear error if STRIPE_SECRET_KEY
// is missing so the rest of the app can dispatch billing flows without
// guarding every call.
// =====================================================================

import Stripe from 'stripe';

import { logger } from '@/lib/logging';

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
  }
  // The SDK pins to its bundled LatestApiVersion when apiVersion is omitted.
  client = new Stripe(secret, {
    appInfo: { name: 'Identimarketing', version: '1.0.0' },
    typescript: true,
  });
  return client;
}

export function isStripeReady(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getReturnUrl(path = '/dashboard/billing'): string {
  const base =
    process.env.STRIPE_BILLING_RETURN_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000';
  const trimmed = base.replace(/\/$/, '');
  const cleaned = path.startsWith('/') ? path : `/${path}`;
  return `${trimmed}${cleaned}`;
}

export function logStripeError(scope: string, err: unknown): void {
  if (err instanceof Stripe.errors.StripeError) {
    logger.warn(`stripe.${scope}`, {
      code: err.code,
      type: err.type,
      statusCode: err.statusCode,
      message: err.message,
      requestId: err.requestId,
    });
    return;
  }
  logger.warn(`stripe.${scope}`, { err: err instanceof Error ? err.message : String(err) });
}
