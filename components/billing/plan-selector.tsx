'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Plan, PlanId } from '@/lib/stripe/plans';

export interface PlanSelectorProps {
  plans: Plan[];
  currentPlanId: PlanId;
  /** True if the user already has an active Stripe subscription. */
  hasActiveSubscription: boolean;
  stripeConfigured: boolean;
}

function formatPrice(value: number, currency: string): string {
  if (value === 0) return 'Free';
  const code = currency.toUpperCase();
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${code} ${value}`;
  }
}

export function PlanSelector({
  plans,
  currentPlanId,
  hasActiveSubscription,
  stripeConfigured,
}: PlanSelectorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<PlanId | null>(null);

  async function selectPlan(planId: PlanId): Promise<void> {
    if (!stripeConfigured) {
      toast({
        title: 'Stripe not configured',
        description:
          'Set STRIPE_SECRET_KEY and STRIPE_PRICE_<PLAN> in .env.local then restart the dev server.',
        variant: 'destructive',
      });
      return;
    }
    setBusy(planId);
    try {
      const action = hasActiveSubscription ? 'update' : 'checkout';
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ planId, action }),
      });
      const json: { error?: { message?: string }; url?: string; success?: boolean } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || 'Plan change failed');
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      toast({ title: 'Plan updated' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Could not change plan',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const isUpgrade =
          plan.priceGbp > (plans.find((p) => p.id === currentPlanId)?.priceGbp ?? 0);
        return (
          <Card
            key={plan.id}
            className={`p-5 bg-background/60 border ${
              isCurrent ? 'border-primary/60 ring-1 ring-primary/40' : 'border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{plan.name}</h3>
              {isCurrent && (
                <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                  Current
                </Badge>
              )}
              {plan.id === 'pro' && !isCurrent && (
                <Badge variant="outline" className="border-amber-500/40 text-amber-300">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>
            <div className="text-3xl font-bold">{formatPrice(plan.priceGbp, plan.currency)}</div>
            <div className="text-xs text-muted-foreground mb-3">
              {plan.priceGbp > 0 ? 'per month' : 'forever'}
            </div>
            <p className="text-sm text-muted-foreground mb-4">{plan.tagline}</p>
            <ul className="space-y-1.5 mb-5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              variant={isCurrent ? 'outline' : 'default'}
              disabled={isCurrent || busy !== null}
              onClick={() => selectPlan(plan.id)}
            >
              {busy === plan.id ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : null}
              {isCurrent
                ? 'Current plan'
                : hasActiveSubscription
                ? isUpgrade
                  ? `Upgrade to ${plan.name}`
                  : `Switch to ${plan.name}`
                : `Choose ${plan.name}`}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
