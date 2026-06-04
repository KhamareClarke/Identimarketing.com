// =====================================================================
// POST /api/auth/verify-email
//
// Stage-2 of the OTP signup flow. Body: { email, code }.
//   1. Lookup public.pending_signups for that email.
//   2. Reject if expired or attempts >= 5.
//   3. bcrypt.compare(code, code_hash). On miss, increment attempts.
//   4. On match: decrypt the password and create the Supabase auth user
//      via the admin API with email_confirm=true. Wait for the
//      on_auth_user_created trigger to provision the profile row.
//   5. Delete the pending row, then call signInWithPassword on the
//      cookie-bound server client so the session cookie is set on the
//      response - the user lands on /dashboard already signed in.
//   6. Email a welcome message in the background.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { compare } from '@/lib/auth/bcrypt';
import { decryptSecret } from '@/lib/auth/crypt';
import { createServerClient, createServiceClient } from '@/lib/db/client';
import { sendWelcomeEmail } from '@/lib/email/auth-templates';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { logger } from '@/lib/logging';
import { metrics } from '@/lib/metrics';
import { emitEmpireActivity } from '@/lib/empire-activity';

const schema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  code: z
    .string()
    .min(4)
    .max(8)
    .regex(/^[0-9]+$/, 'Code must be numeric'),
});

const MAX_ATTEMPTS = 5;

interface PendingSignupRow {
  id: string;
  email: string;
  name: string;
  password_encrypted: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
}

export const POST = withErrorHandler(
  'api.auth.verify-email.POST',
  async (req: NextRequest) => {
    const body = await req.json().catch(() => ({}));
    const { email, code } = schema.parse(body);

    const admin = createServiceClient();

    // 1. Look up the pending row.
    const { data: row } = await admin
      .from('pending_signups')
      .select('id, email, name, password_encrypted, code_hash, attempts, expires_at')
      .eq('email', email)
      .maybeSingle();
    const pending = row as PendingSignupRow | null;
    if (!pending) {
      throw errors.badRequest('No verification in progress for that email. Please sign up again.');
    }

    // 2. Expiry / attempts.
    if (new Date(pending.expires_at).getTime() < Date.now()) {
      await admin.from('pending_signups').delete().eq('id', pending.id);
      throw errors.badRequest('Verification code expired. Please request a new one.');
    }
    if (pending.attempts >= MAX_ATTEMPTS) {
      await admin.from('pending_signups').delete().eq('id', pending.id);
      throw errors.rateLimited('Too many incorrect attempts. Please request a new code.');
    }

    // 3. Compare code.
    const match = await compare(code, pending.code_hash);
    if (!match) {
      const nextAttempts = pending.attempts + 1;
      await admin
        .from('pending_signups')
        .update({ attempts: nextAttempts })
        .eq('id', pending.id);
      const remaining = Math.max(0, MAX_ATTEMPTS - nextAttempts);
      throw errors.badRequest(
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many incorrect attempts. Please request a new code.',
      );
    }

    // 4. Decrypt the password and create the Supabase auth user.
    let password: string;
    try {
      password = decryptSecret(pending.password_encrypted);
    } catch (err) {
      logger.error('verify-email: password decrypt failed', {
        email,
        err: err instanceof Error ? err.message : String(err),
      });
      await admin.from('pending_signups').delete().eq('id', pending.id);
      throw errors.serverError('Your signup expired. Please start over.');
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: pending.email,
      password,
      email_confirm: true,
      user_metadata: { name: pending.name },
    });
    if (createError || !created.user) {
      logger.error('verify-email: admin.createUser failed', {
        email,
        err: createError?.message,
      });
      // Common case: account already exists (e.g. user verified in another tab).
      const msg = createError?.message || 'Could not create your account.';
      if (msg.toLowerCase().includes('already')) {
        await admin.from('pending_signups').delete().eq('id', pending.id);
        throw errors.conflict('That account already exists. Please sign in.');
      }
      throw errors.serverError(msg);
    }

    // 5. Make sure profiles is populated (the on_auth_user_created trigger
    //    usually handles this, but we backfill defensively).
    await admin
      .from('profiles')
      .upsert(
        {
          id: created.user.id,
          email: pending.email,
          name: pending.name,
          email_verified_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

    // 6. Clean up pending row.
    await admin.from('pending_signups').delete().eq('id', pending.id);

    // 7. Sign the user in via the cookie-bound server client so the
    //    session cookie is set on the response.
    const supabase = createServerClient();
    const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
      email: pending.email,
      password,
    });
    if (signInError || !signIn.session) {
      logger.warn('verify-email: auto signin failed', { email, err: signInError?.message });
      // Account exists but session wasn't established. The user can sign in manually.
      return NextResponse.json({
        ok: true,
        verified: true,
        signedIn: false,
        message: 'Verified. Please sign in to continue.',
      });
    }

    void metrics.recordSignup(created.user.id, { source: 'web', stage: 'verified' });
    void sendWelcomeEmail(pending.name, pending.email).catch(() => {});
    void emitEmpireActivity({
      event_type: 'signup',
      user_email: created.user.email,
      user_id: created.user.id,
      user_name: pending.name,
      message: 'Verified signup',
      request: req,
    });
    void emitEmpireActivity({
      event_type: 'verify_email',
      user_email: created.user.email,
      user_id: created.user.id,
      request: req,
    });

    return NextResponse.json({
      ok: true,
      verified: true,
      signedIn: true,
      user: {
        id: created.user.id,
        email: created.user.email,
        name: pending.name,
      },
    });
  },
);
