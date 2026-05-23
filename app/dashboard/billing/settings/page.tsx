import Link from 'next/link';
import { ChevronLeft, CreditCard, ExternalLink, Settings2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubscriptionActions } from '@/components/billing/subscription-actions';
import { requireUser } from '@/lib/auth/middleware';
import type { Billing } from '@/lib/db/types';
import { getBillingSnapshot } from '@/lib/stripe/limits';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function BillingSettingsPage() {
  const { user, supabase } = await requireUser();
  const snapshot = await getBillingSnapshot(supabase, user.id);
  const billing = snapshot.billing as Billing | null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" /> Back to billing
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-primary" />
          Billing Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your payment method, billing address, and tax details through the Stripe Customer Portal.
        </p>
      </div>

      <Card className="p-5 bg-background/60 border-white/10 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Subscription</p>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-lg font-semibold">{snapshot.plan.name}</h2>
            <Badge variant={snapshot.active ? 'default' : 'secondary'} className="capitalize">
              {billing?.status ?? (snapshot.active ? 'active' : 'free')}
            </Badge>
            {billing?.cancel_at_period_end && (
              <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                Cancels {formatDate(billing.current_period_end)}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Renewal date</p>
            <p className="font-medium mt-1">{formatDate(billing?.current_period_end)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Trial end</p>
            <p className="font-medium mt-1">
              {billing?.trial_end && new Date(billing.trial_end) > new Date()
                ? formatDate(billing.trial_end)
                : '\u2014'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Currency</p>
            <p className="font-medium mt-1">{(billing?.currency ?? 'usd').toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Stripe customer</p>
            <p className="font-mono text-xs mt-1 break-all">
              {billing?.stripe_customer_id ?? '\u2014'}
            </p>
          </div>
        </div>

        <SubscriptionActions
          hasActiveSubscription={snapshot.active && snapshot.plan.id !== 'free'}
          cancelAtPeriodEnd={Boolean(billing?.cancel_at_period_end)}
        />
      </Card>

      <Card className="p-5 bg-background/60 border-white/10">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Payment method, billing address & tax ID
        </h3>
        <p className="text-sm text-muted-foreground">
          Use the <strong>Manage payment & invoices</strong> button above to open the Stripe
          Customer Portal. Payment methods, billing address, and tax IDs are all updated there.
        </p>
      </Card>

      <Card className="p-5 bg-background/60 border-white/10">
        <h3 className="font-semibold mb-2">Email for invoices</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Invoices are sent to <span className="font-mono">{user.email}</span>. Update via the
          Customer Portal &gt; Billing details.
        </p>
        <Link
          href="https://dashboard.stripe.com/customers"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Open Stripe dashboard
        </Link>
      </Card>
    </div>
  );
}
