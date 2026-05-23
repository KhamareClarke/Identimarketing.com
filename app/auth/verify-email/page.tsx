'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, MailCheck, AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const status = params.get('status');
  const message = params.get('message');

  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendInfo, setResendInfo] = useState<string | null>(null);

  if (status === 'success') {
    return (
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Email verified</h1>
        <p className="text-sm text-muted-foreground mb-6">Your account is ready. You can sign in now.</p>
        <Link href="/auth/login" className="inline-block">
          <Button className="rounded-full font-semibold">Continue to sign in</Button>
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Verification failed</h1>
        <p className="text-sm text-muted-foreground mb-6">{message || 'The link may have expired.'}</p>
        <Link href="/auth/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  async function onResend(e: React.FormEvent) {
    e.preventDefault();
    setResending(true);
    setResendInfo(null);
    try {
      // Resending uses the signup flow (same email -> Supabase resends verification).
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setResendInfo('If an account exists for that email, we just sent a fresh verification link.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <div className="text-center">
        <MailCheck className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Check your email</h1>
        <p className="text-sm text-muted-foreground mb-6">
          We just sent you a verification link. Click the button in the email to activate your account.
        </p>
      </div>

      <form onSubmit={onResend} className="space-y-3">
        <label className="block text-sm font-medium">Resend verification email</label>
        <Input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={resending} variant="outline" className="w-full rounded-full">
          {resending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Resend link
        </Button>
        {resendInfo && <p className="text-xs text-muted-foreground text-center">{resendInfo}</p>}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/auth/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
