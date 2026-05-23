'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const queryEmail = params.get('email') ?? '';

  const [email, setEmail] = useState(queryEmail);
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [done, setDone] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    // Auto-focus the first input on mount.
    inputs.current[0]?.focus();
  }, []);

  const code = digits.join('');

  function setDigit(idx: number, value: string) {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = cleaned;
      return next;
    });
    if (cleaned && idx < CODE_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
    }
  }

  function onKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < CODE_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
    } else if (e.key === 'Enter' && code.length === CODE_LENGTH) {
      void submit();
    }
  }

  function onPaste(idx: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setDigits(() => {
      const filled = Array(CODE_LENGTH).fill('');
      for (let i = 0; i < pasted.length; i++) filled[i] = pasted[i];
      return filled;
    });
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputs.current[focusIdx]?.focus();
  }

  async function submit() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError('Please enter the email you signed up with.');
      return;
    }
    if (code.length !== CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message || 'Could not verify the code.');
        return;
      }
      setDone(true);
      if (body?.signedIn) {
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 800);
      } else {
        setTimeout(() => router.push('/auth/login'), 1200);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setError(null);
    setInfo(null);
    if (!email) {
      setError('Please enter your email first.');
      return;
    }
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error?.message || 'Could not resend the code.');
        return;
      }
      setInfo(body?.message || 'A new code is on its way.');
      setCooldown(RESEND_COOLDOWN);
    } finally {
      setResending(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Email verified</h1>
        <p className="text-sm text-muted-foreground">Taking you to your dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center">
        <MailCheck className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Enter your code</h1>
        <p className="text-sm text-muted-foreground mb-6">
          We emailed a 6-digit code to{' '}
          <strong className="text-foreground">{email || 'your inbox'}</strong>.
          It expires in 15 minutes.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-5"
      >
        {!queryEmail && (
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
        )}

        <div className="flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={(e) => onPaste(i, e)}
              className="w-12 h-14 text-center text-2xl font-bold bg-background border border-white/15 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-colors"
            />
          ))}
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        {info && <p className="text-sm text-emerald-400 text-center">{info}</p>}

        <Button
          type="submit"
          disabled={submitting || code.length !== CODE_LENGTH}
          className="w-full rounded-full font-semibold"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify and continue'
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Didn&apos;t get an email?{' '}
          <button
            type="button"
            onClick={resend}
            disabled={resending || cooldown > 0}
            className="text-primary hover:underline disabled:opacity-50 disabled:hover:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Resending...' : 'Resend code'}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Wrong account?{' '}
        <Link href="/auth/signup" className="text-primary hover:underline">
          Start over
        </Link>
      </p>
    </div>
  );
}
