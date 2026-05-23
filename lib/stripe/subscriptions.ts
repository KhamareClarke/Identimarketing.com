// =====================================================================
// Identimarketing SaaS - lib/stripe/subscriptions.ts
//
// High-level subscription operations:
//   - ensureStripeCustomer   - create/find customer for a user
//   - createCheckoutSession  - hosted checkout for new subscriptions
//   - createPortalSession    - Stripe Customer Portal for self-service
//                              cancel / upgrade / payment-method update
//   - cancelSubscription     - cancel at period end (preserves access)
//   - resumeSubscription     - undo a pending cancel
//   - updateSubscription     - switch the current subscription to a new
//                              price (proration handled by Stripe)
// =====================================================================

import type Stripe from 'stripe';

import { createServiceClient, type TypedSupabaseClient } from '@/lib/db/client';
import { getProfile } from '@/lib/db/queries';
import type { Billing } from '@/lib/db/types';
import { logger } from '@/lib/logging';

import { PLANS, type PlanId } from './plans';
import { getReturnUrl, getStripe, logStripeError } from './setup';

// ---------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------
async function loadBillingRow(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<Billing | null> {
  const { data, error } = await supabase
    .from('billing')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    logger.warn('stripe: failed to load billing row', { userId, err: error.message });
    return null;
  }
  return (data ?? null) as Billing | null;
}

export interface EnsureCustomerOptions {
  userId: string;
  email?: string;
  name?: string | null;
}

export async function ensureStripeCustomer(opts: EnsureCustomerOptions): Promise<string> {
  const supabase = createServiceClient();
  const existing = await loadBillingRow(supabase, opts.userId);
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const stripe = getStripe();
  const profile = await getProfile(supabase, opts.userId).catch(() => null);
  const email = opts.email ?? profile?.email;
  if (!email) {
    throw new Error(`Cannot create Stripe customer: no email for user ${opts.userId}`);
  }
  const customer = await stripe.customers.create({
    email,
    name: opts.name ?? profile?.name ?? undefined,
    metadata: { user_id: opts.userId },
  });

  // Upsert billing row.
  if (existing) {
    await supabase
      .from('billing')
      .update({ stripe_customer_id: customer.id })
      .eq('id', existing.id);
  } else {
    await supabase.from('billing').insert({
      user_id: opts.userId,
      plan: 'free',
      status: 'active',
      stripe_customer_id: customer.id,
    });
  }
  return customer.id;
}

// ---------------------------------------------------------------------
// Checkout (new subscriptions)
// ---------------------------------------------------------------------
export interface CreateCheckoutOptions {
  userId: string;
  planId: PlanId;
  successUrl?: string;
  cancelUrl?: string;
  trialDays?: number;
  promotionCode?: string;
}

export interface CreateCheckoutResult {
  url: string;
  sessionId: string;
}

export async function createCheckoutSession(
  opts: CreateCheckoutOptions,
): Promise<CreateCheckoutResult> {
  const plan = PLANS[opts.planId];
  if (!plan.priceId) {
    throw new Error(
      `Plan ${plan.id} has no Stripe price id configured. Set STRIPE_PRICE_${plan.id.toUpperCase()}.`,
    );
  }
  const customerId = await ensureStripeCustomer({ userId: opts.userId });
  const stripe = getStripe();

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    customer: customerId,
    success_url: opts.successUrl ?? getReturnUrl('/dashboard/billing?status=success'),
    cancel_url: opts.cancelUrl ?? getReturnUrl('/dashboard/billing?status=cancelled'),
    line_items: [{ price: plan.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_update: { address: 'auto', name: 'auto' },
    metadata: { user_id: opts.userId, plan_id: plan.id },
    subscription_data: {
      metadata: { user_id: opts.userId, plan_id: plan.id },
      ...(opts.trialDays && opts.trialDays > 0 ? { trial_period_days: opts.trialDays } : {}),
    },
  };
  if (opts.promotionCode) {
    params.discounts = [{ promotion_code: opts.promotionCode }];
    delete params.allow_promotion_codes;
  }

  try {
    const session = await stripe.checkout.sessions.create(params);
    if (!session.url) throw new Error('Stripe Checkout did not return a URL.');
    return { url: session.url, sessionId: session.id };
  } catch (err) {
    logStripeError('createCheckoutSession', err);
    throw err;
  }
}

// ---------------------------------------------------------------------
// Customer Portal (manage payment method, cancel, switch plan)
// ---------------------------------------------------------------------
export interface CreatePortalOptions {
  userId: string;
  returnUrl?: string;
}

export async function createPortalSession(opts: CreatePortalOptions): Promise<{ url: string }> {
  const supabase = createServiceClient();
  const row = await loadBillingRow(supabase, opts.userId);
  let customerId = row?.stripe_customer_id ?? null;
  if (!customerId) {
    customerId = await ensureStripeCustomer({ userId: opts.userId });
  }
  const stripe = getStripe();
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: opts.returnUrl ?? getReturnUrl('/dashboard/billing'),
    });
    return { url: session.url };
  } catch (err) {
    logStripeError('createPortalSession', err);
    throw err;
  }
}

// ---------------------------------------------------------------------
// Direct mutations (used by support tools + the webhook handler)
// ---------------------------------------------------------------------
export async function cancelSubscription(
  opts: { userId: string; immediate?: boolean },
): Promise<{ status: Stripe.Subscription.Status; cancelAtPeriodEnd: boolean }> {
  const supabase = createServiceClient();
  const row = await loadBillingRow(supabase, opts.userId);
  if (!row?.stripe_subscription_id) {
    throw new Error('No active subscription to cancel.');
  }
  const stripe = getStripe();
  try {
    const sub = opts.immediate
      ? await stripe.subscriptions.cancel(row.stripe_subscription_id)
      : await stripe.subscriptions.update(row.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
    return { status: sub.status, cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end) };
  } catch (err) {
    logStripeError('cancelSubscription', err);
    throw err;
  }
}

export async function resumeSubscription(opts: { userId: string }): Promise<void> {
  const supabase = createServiceClient();
  const row = await loadBillingRow(supabase, opts.userId);
  if (!row?.stripe_subscription_id) throw new Error('No subscription found to resume.');
  const stripe = getStripe();
  try {
    await stripe.subscriptions.update(row.stripe_subscription_id, {
      cancel_at_period_end: false,
    });
  } catch (err) {
    logStripeError('resumeSubscription', err);
    throw err;
  }
}

export async function updateSubscription(opts: {
  userId: string;
  planId: PlanId;
  prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior;
}): Promise<{ subscriptionId: string; priceId: string }> {
  const supabase = createServiceClient();
  const row = await loadBillingRow(supabase, opts.userId);
  if (!row?.stripe_subscription_id) {
    throw new Error('No active subscription to update. Use checkout to create one first.');
  }
  const plan = PLANS[opts.planId];
  if (!plan.priceId) {
    throw new Error(`Plan ${plan.id} has no Stripe price id configured.`);
  }
  const stripe = getStripe();
  try {
    const current = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
    const itemId = current.items.data[0]?.id;
    if (!itemId) throw new Error('Subscription has no items.');
    const updated = await stripe.subscriptions.update(row.stripe_subscription_id, {
      items: [{ id: itemId, price: plan.priceId }],
      proration_behavior: opts.prorationBehavior ?? 'create_prorations',
      metadata: { ...current.metadata, plan_id: plan.id, user_id: opts.userId },
    });
    return { subscriptionId: updated.id, priceId: plan.priceId };
  } catch (err) {
    logStripeError('updateSubscription', err);
    throw err;
  }
}
