'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  score = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ['Too short', 'Weak', 'Okay', 'Strong', 'Very strong'];
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agree) {
      setError('You must accept the terms of service.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error?.message || 'Signup failed');
        return;
      }
      if (body?.needsVerification) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Create your account</h1>
      <p className="text-sm text-muted-foreground mb-6">Start managing clients and projects in minutes.</p>

      <form onSubmit={onSubmit} className="space-y-4" suppressHydrationWarning>
        <div>
          <label className="block text-sm font-medium mb-2">Full name</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input required value={name} onChange={(e) => setName(e.target.value)} className="pl-10" placeholder="Your name" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              placeholder="At least 8 characters"
            />
          </div>
          {password && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${(strength.score / 4) * 100}%`,
                    background:
                      strength.score <= 1
                        ? '#ef4444'
                        : strength.score === 2
                          ? '#f59e0b'
                          : strength.score === 3
                            ? '#22c55e'
                            : '#16a34a',
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Strength: {strength.label}</p>
            </div>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-muted-foreground">
            I agree to the{' '}
            <Link href="/terms-conditions" className="text-primary hover:underline">Terms</Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
          </span>
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full rounded-full font-semibold">
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
