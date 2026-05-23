// =====================================================================
// Identimarketing SaaS - lib/stripe/webhooks.ts
//
// Event-router for /api/billing/webhook. Handles:
//   - customer.subscription.created / updated / deleted
//   - invoice.payment_succeeded / payment_failed / created / finalized
//   - checkout.session.completed
//
// All writes are upserts so the same event can replay idempotently.
// Each event id is recorded in stripe_webhook_events for idempotency.
// =====================================================================

import type Stripe from 'stripe';

import { createServiceClient, type TypedSupabaseClient } from '@/lib/db/client';
import type { Billing, BillingStatus, InvoiceStatus, SubscriptionTier } from '@/lib/db/types';
import { logger } from '@/lib/logging';

import { getPlanForPriceId, PLANS, type PlanId } from './plans';
import { getStripe } from './setup';

// ---------------------------------------------------------------------
// Idempotency log
// ---------------------------------------------------------------------
async function recordEvent(
  supabase: TypedSupabaseClient,
  event: Stripe.Event,
): Promise<{ alreadyProcessed: boolean }> {
  const { data: existing } = await supabase
    .from('stripe_webhook_events')
    .select('id, processed_at')
    .eq('id', event.id)
    .maybeSingle();
  if (existing && (existing as { processed_at: string | null }).processed_at) {
    return { alreadyProcessed: true };
  }
  if (!existing) {
    await supabase.from('stripe_webhook_events').insert({
      id: event.id,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });
  }
  return { alreadyProcessed: false };
}

async function markProcessed(
  supabase: TypedSupabaseClient,
  eventId: string,
  error?: string,
): Promise<void> {
  await supabase
    .from('stripe_webhook_events')
    .update({
      processed_at: new Date().toISOString(),
      error: error ?? null,
    })
    .eq('id', eventId);
}

// ---------------------------------------------------------------------
// Helpers: resolve user_id from Stripe objects
// ---------------------------------------------------------------------
async function resolveUserIdFromCustomer(
  supabase: TypedSupabaseClient,
  customerId: string | null | undefined,
): Promise<string | null> {
  if (!customerId) return null;
  const { data } = await supabase
    .from('billing')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  if (data) return (data as { user_id: string }).user_id;

  // Fall back to retrieving the customer and reading metadata.user_id.
  try {
    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(customerId);
    if ('deleted' in customer && customer.deleted) return null;
    return ((customer as Stripe.Customer).metadata?.user_id as string | undefined) ?? null;
  } catch (err) {
    logger.warn('stripe webhook: resolveUserIdFromCustomer failed', {
      customerId,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

function statusToBilling(status: Stripe.Subscription.Status): BillingStatus {
  return status as BillingStatus;
}

function priceIdFromSubscription(subscription: Stripe.Subscription): string | null {
  return subscription.items?.data?.[0]?.price?.id ?? null;
}

function tierFromPlanId(planId: PlanId): SubscriptionTier {
  return PLANS[planId].tier;
}

// ---------------------------------------------------------------------
// Subscription event handler
// ---------------------------------------------------------------------
async function syncSubscription(
  supabase: TypedSupabaseClient,
  subscription: Stripe.Subscription,
  customerIdOverride?: string | null,
): Promise<void> {
  const customerId =
    customerIdOverride ?? (typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id);
  const userId =
    ((subscription.metadata?.user_id as string | undefined) ?? null) ||
    (await resolveUserIdFromCustomer(supabase, customerId));
  if (!userId) {
    logger.warn('stripe webhook: cannot resolve user_id for subscription', {
      subscriptionId: subscription.id,
      customerId,
    });
    return;
  }

  const priceId = priceIdFromSubscription(subscription);
  const plan = getPlanForPriceId(priceId);
  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? null;
  const periodEnd = item?.current_period_end ?? null;

  const patch: Partial<Billing> = {
    plan: plan.id,
    monthly_cost: plan.priceGbp,
    status: statusToBilling(subscription.status),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    price_id: priceId,
    currency: subscription.currency ?? 'usd',
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    next_billing_date: periodEnd
      ? new Date(periodEnd * 1000).toISOString().slice(0, 10)
      : null,
    default_payment_method:
      typeof subscription.default_payment_method === 'string'
        ? subscription.default_payment_method
        : subscription.default_payment_method?.id ?? null,
    last_synced_at: new Date().toISOString(),
  };

  // Upsert billing row keyed on user_id.
  const { data: existing } = await supabase
    .from('billing')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    await supabase
      .from('billing')
      .update(patch)
      .eq('id', (existing as { id: string }).id);
  } else {
    await supabase.from('billing').insert({ user_id: userId, ...patch });
  }

  // Mirror the effective tier into profiles.subscription_tier.
  const tier =
    subscription.status === 'active' ||
    subscription.status === 'trialing' ||
    subscription.status === 'past_due'
      ? tierFromPlanId(plan.id)
      : 'free';
  await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', userId);
}

async function deleteSubscription(
  supabase: TypedSupabaseClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const userId =
    ((subscription.metadata?.user_id as string | undefined) ?? null) ||
    (await resolveUserIdFromCustomer(supabase, customerId));
  if (!userId) return;

  await supabase
    .from('billing')
    .update({
      plan: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      price_id: null,
      cancel_at_period_end: false,
      canceled_at: new Date().toISOString(),
      current_period_end: null,
      next_billing_date: null,
      last_synced_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  await supabase.from('profiles').update({ subscription_tier: 'free' }).eq('id', userId);
}

// ---------------------------------------------------------------------
// Invoice event handler
// ---------------------------------------------------------------------
function invoiceStatus(invoice: Stripe.Invoice): InvoiceStatus {
  return (invoice.status ?? 'draft') as InvoiceStatus;
}

async function syncInvoice(
  supabase: TypedSupabaseClient,
  invoice: Stripe.Invoice,
): Promise<void> {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id ?? null;
  const userId = await resolveUserIdFromCustomer(supabase, customerId);
  if (!userId) {
    logger.warn('stripe webhook: cannot resolve user_id for invoice', {
      invoiceId: invoice.id,
      customerId,
    });
    return;
  }
  const subscriptionId =
    typeof (invoice as unknown as { subscription?: string | Stripe.Subscription | null }).subscription === 'string'
      ? ((invoice as unknown as { subscription: string }).subscription)
      : ((invoice as unknown as { subscription?: { id?: string } }).subscription?.id ?? null);

  const row = {
    user_id: userId,
    stripe_invoice_id: invoice.id ?? '',
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    number: invoice.number ?? null,
    status: invoiceStatus(invoice),
    amount_due: invoice.amount_due,
    amount_paid: invoice.amount_paid,
    amount_remaining: invoice.amount_remaining ?? 0,
    currency: invoice.currency ?? 'usd',
    hosted_invoice_url: invoice.hosted_invoice_url ?? null,
    invoice_pdf: invoice.invoice_pdf ?? null,
    period_start: invoice.period_start
      ? new Date(invoice.period_start * 1000).toISOString()
      : null,
    period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
    issued_at: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
    paid_at:
      invoice.status === 'paid' && invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        : null,
  };

  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('stripe_invoice_id', invoice.id ?? '')
    .maybeSingle();
  if (existing) {
    await supabase
      .from('invoices')
      .update(row)
      .eq('id', (existing as { id: string }).id);
  } else if (invoice.id) {
    await supabase.from('invoices').insert(row);
  }

  // Update billing.last_invoice_id pointer.
  await supabase
    .from('billing')
    .update({ last_invoice_id: invoice.id ?? null, last_synced_at: new Date().toISOString() })
    .eq('user_id', userId);
}

// ---------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------
export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  const supabase = createServiceClient();
  const { alreadyProcessed } = await recordEvent(supabase, event);
  if (alreadyProcessed) {
    logger.info('stripe webhook: skipping replayed event', { id: event.id, type: event.type });
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // The subscription.created event handles most of the work; here we
        // just make sure the billing row has the customer id mapped.
        const customerId =
          typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
        const userId = (session.metadata?.user_id as string | undefined) ?? null;
        if (customerId && userId) {
          await supabase
            .from('billing')
            .update({ stripe_customer_id: customerId })
            .eq('user_id', userId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.resumed':
      case 'customer.subscription.paused':
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(supabase, sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await deleteSubscription(supabase, sub);
        break;
      }
      case 'invoice.created':
      case 'invoice.finalized':
      case 'invoice.updated':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'invoice.voided': {
        const invoice = event.data.object as Stripe.Invoice;
        await syncInvoice(supabase, invoice);
        break;
      }
      default:
        logger.info('stripe webhook: ignored event type', { type: event.type, id: event.id });
    }
    await markProcessed(supabase, event.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('stripe webhook: handler error', { id: event.id, type: event.type, err: message });
    await markProcessed(supabase, event.id, message);
    throw err;
  }
}
