'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, RotateCcw, Shield, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionActionsProps {
  hasActiveSubscription: boolean;
  cancelAtPeriodEnd: boolean;
}

export function SubscriptionActions({
  hasActiveSubscription,
  cancelAtPeriodEnd,
}: SubscriptionActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<null | 'portal' | 'cancel' | 'resume'>(null);

  async function openPortal(): Promise<void> {
    setBusy('portal');
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json: { error?: { message?: string }; url?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) throw new Error(json?.error?.message || 'Could not open portal');
      window.location.href = json.url;
    } catch (err) {
      toast({
        title: 'Portal unavailable',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
      setBusy(null);
    }
  }

  async function cancel(): Promise<void> {
    if (!confirm('Cancel at the end of the current billing period? You keep access until then.')) {
      return;
    }
    setBusy('cancel');
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const json: { error?: { message?: string } } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || 'Cancel failed');
      toast({ title: 'Subscription will end at period end.' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Could not cancel',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  async function resume(): Promise<void> {
    setBusy('resume');
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      });
      const json: { error?: { message?: string } } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || 'Resume failed');
      toast({ title: 'Cancellation reversed.' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Could not resume',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" onClick={openPortal} disabled={busy !== null}>
        {busy === 'portal' ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4 mr-1" />
        )}
        Manage payment & invoices
      </Button>
      {hasActiveSubscription && !cancelAtPeriodEnd && (
        <Button variant="ghost" onClick={cancel} disabled={busy !== null}>
          {busy === 'cancel' ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4 mr-1" />
          )}
          Cancel subscription
        </Button>
      )}
      {hasActiveSubscription && cancelAtPeriodEnd && (
        <Button variant="default" onClick={resume} disabled={busy !== null}>
          {busy === 'resume' ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4 mr-1" />
          )}
          Reactivate
        </Button>
      )}
      <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
        <Shield className="w-3 h-3" />
        Powered by Stripe
      </div>
    </div>
  );
}
