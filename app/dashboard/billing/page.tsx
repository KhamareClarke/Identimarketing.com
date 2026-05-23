import Link from 'next/link';
import { AlertTriangle, Calendar, CreditCard, FileText, Settings2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { InvoiceTable } from '@/components/billing/invoice-table';
import { PlanSelector } from '@/components/billing/plan-selector';
import { SubscriptionActions } from '@/components/billing/subscription-actions';
import { requireUser } from '@/lib/auth/middleware';
import type { Invoice } from '@/lib/db/types';
import { getPlanUsageReport, type LimitResource } from '@/lib/stripe/limits';
import { isStripeConfigured, listPublicPlans, PLANS } from '@/lib/stripe/plans';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const LIMIT_LABELS: Record<LimitResource, string> = {
  clients: 'Clients',
  teamMembers: 'Team members',
  projects: 'Projects',
  monthlyReports: 'Reports this month',
  empireOsRunsPerMonth: 'Empire OS runs this month',
};

interface PageProps {
  searchParams: { status?: string };
}

export default async function BillingPage({ searchParams }: PageProps) {
  const { user, supabase } = await requireUser();
  const report = await getPlanUsageReport(supabase, user.id);

  // Fetch billing row and the 5 most recent invoices.
  const [{ data: billing }, { data: invoices }] = await Promise.all([
    supabase.from('billing').select('*').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false })
      .limit(5),
  ]);

  const billingRow = (billing ?? null) as
    | (typeof PLANS)[keyof typeof PLANS] extends never
      ? never
      : {
          cancel_at_period_end?: boolean;
          current_period_end?: string | null;
          status?: string;
          trial_end?: string | null;
        } | null;
  const cancelAtPeriodEnd = Boolean(billingRow?.cancel_at_period_end);
  const periodEnd = billingRow?.current_period_end ?? null;
  const trialEnd = billingRow?.trial_end ?? null;
  const stripeConfigured = isStripeConfigured();

  const statusBanner =
    searchParams?.status === 'success'
      ? { tone: 'success' as const, text: 'Subscription updated. Welcome aboard!' }
      : searchParams?.status === 'cancelled'
      ? { tone: 'info' as const, text: 'Checkout cancelled - no changes were made.' }
      : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary" />
            Billing
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription, payment method, and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/billing/invoices">
            <Badge variant="outline" className="cursor-pointer">
              <FileText className="w-3 h-3 mr-1" />
              All invoices
            </Badge>
          </Link>
          <Link href="/dashboard/billing/settings">
            <Badge variant="outline" className="cursor-pointer">
              <Settings2 className="w-3 h-3 mr-1" />
              Billing settings
            </Badge>
          </Link>
        </div>
      </div>

      {!stripeConfigured && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/30 text-amber-100 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-sm">
            Stripe isn&apos;t fully configured. Add <code>STRIPE_SECRET_KEY</code> and the three{' '}
            <code>STRIPE_PRICE_*</code> env vars to enable paid plans.
          </div>
        </Card>
      )}

      {statusBanner && (
        <Card
          className={`p-4 border ${
            statusBanner.tone === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-sky-500/10 border-sky-500/30 text-sky-200'
          }`}
        >
          <p className="text-sm">{statusBanner.text}</p>
        </Card>
      )}

      <Card className="p-5 bg-background/60 border-white/10 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Current plan</p>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-xl font-bold">{report.plan.name}</h2>
              <Badge
                variant={report.active ? 'default' : 'secondary'}
                className="capitalize"
              >
                {billingRow?.status ?? (report.active ? 'active' : 'free')}
              </Badge>
              {cancelAtPeriodEnd && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                  Ends {formatDate(periodEnd)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{report.plan.tagline}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {report.plan.priceGbp === 0 ? 'Price' : 'Monthly'}
            </p>
            <p className="text-2xl font-bold">
              {report.plan.priceGbp === 0
                ? 'Free'
                : new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: report.plan.currency.toUpperCase(),
                    maximumFractionDigits: 0,
                  }).format(report.plan.priceGbp)}
            </p>
            {periodEnd && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1 justify-end">
                <Calendar className="w-3 h-3" />
                Renews {formatDate(periodEnd)}
              </p>
            )}
            {trialEnd && new Date(trialEnd) > new Date() && (
              <p className="text-xs text-amber-300 mt-0.5">Trial ends {formatDate(trialEnd)}</p>
            )}
          </div>
        </div>

        <SubscriptionActions
          hasActiveSubscription={report.active && report.plan.id !== 'free'}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
        />
      </Card>

      <Card className="p-5 bg-background/60 border-white/10">
        <h3 className="font-semibold mb-3">Usage this month</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(LIMIT_LABELS) as LimitResource[]).map((key) => {
            const check = report.checks[key];
            const percent =
              check.unlimited || check.limit === 0
                ? 0
                : Math.min(100, Math.round((check.current / check.limit) * 100));
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{LIMIT_LABELS[key]}</span>
                  <span className="font-medium">
                    {check.current}
                    {check.unlimited ? '' : ` / ${check.limit}`}
                  </span>
                </div>
                {!check.unlimited && <Progress value={percent} className="h-1.5" />}
                {!check.unlimited && check.atLimit && (
                  <p className="text-xs text-amber-300">At plan limit</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <section>
        <h2 className="text-lg font-semibold mb-3">Plans</h2>
        <PlanSelector
          plans={listPublicPlans()}
          currentPlanId={report.plan.id}
          hasActiveSubscription={report.active && report.plan.id !== 'free'}
          stripeConfigured={stripeConfigured}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent invoices</h2>
          <Link
            href="/dashboard/billing/invoices"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all \u2192
          </Link>
        </div>
        <InvoiceTable invoices={(invoices ?? []) as Invoice[]} />
      </section>
    </div>
  );
}
