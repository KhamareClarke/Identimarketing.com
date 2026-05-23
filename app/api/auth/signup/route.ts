// =====================================================================
// POST /api/auth/signup
//
// Stage-1 of the OTP signup flow. No Supabase auth user is created here.
// Instead we:
//   1. Validate input.
//   2. Refuse if an active profile already exists for the email.
//   3. Generate a 6-digit code, bcrypt-hash it, encrypt the password,
//      upsert into public.pending_signups (15-minute TTL).
//   4. Email the code via lib/email/auth-templates.ts.
//   5. Return { needsVerification: true, email }.
//
// The actual auth.users row is created in /api/auth/verify-email after
// the user enters the matching code.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServiceClient } from '@/lib/db/client';
import { hash } from '@/lib/auth/bcrypt';
import { encryptSecret, generateNumericOtp } from '@/lib/auth/crypt';
import { sendVerificationOtpEmail } from '@/lib/email/auth-templates';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { logger } from '@/lib/logging';
import { metrics } from '@/lib/metrics';

const schema = z.object({
  email: z.string().email('Please enter a valid email').transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().min(1, 'Name is required').max(120),
});

const OTP_TTL_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 30;

export const POST = withErrorHandler('api.auth.signup.POST', async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { email, password, name } = schema.parse(body);

  const supabase = createServiceClient();

  // 1. Don't allow signup if a verified account already exists.
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existingProfile) {
    throw errors.conflict('An account with that email already exists. Sign in instead.');
  }

  // 2. Resend-cooldown: if a row exists and we sent within the last
  //    RESEND_COOLDOWN_SECONDS, ask the user to wait.
  const { data: existingPending } = await supabase
    .from('pending_signups')
    .select('last_sent_at')
    .eq('email', email)
    .maybeSingle();
  if (existingPending) {
    const lastSent = new Date(
      (existingPending as { last_sent_at: string }).last_sent_at,
    ).getTime();
    const elapsed = (Date.now() - lastSent) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
      throw errors.rateLimited(`Please wait ${waitSeconds}s before requesting another code.`);
    }
  }

  // 3. Generate OTP + secrets.
  const code = generateNumericOtp(6);
  const codeHash = await hash(code, 10);
  const passwordEncrypted = encryptSecret(password);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  // 4. Upsert pending row (replaces any prior in-flight signup for this email).
  const { error: upsertError } = await supabase
    .from('pending_signups')
    .upsert(
      {
        email,
        name,
        password_encrypted: passwordEncrypted,
        code_hash: codeHash,
        attempts: 0,
        last_sent_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: 'email' },
    );
  if (upsertError) {
    logger.error('signup: pending_signups upsert failed', {
      email,
      code: (upsertError as { code?: string }).code,
      err: upsertError.message,
    });
    // Postgres `undefined_table` -> the 008 migration was never run.
    if (
      (upsertError as { code?: string }).code === '42P01' ||
      /pending_signups/i.test(upsertError.message)
    ) {
      throw errors.serverError(
        'Signup is not provisioned: run lib/db/migrations/008_pending_signups.sql in Supabase, then try again.',
      );
    }
    throw errors.serverError(`Could not start signup: ${upsertError.message}`);
  }

  // 5. Send the email. We don't fail the request if email fails - we log
  //    and instruct the user to use the resend button.
  const result = await sendVerificationOtpEmail({
    email,
    name,
    code,
    expiresInMinutes: OTP_TTL_MINUTES,
  });
  if (!result.success) {
    logger.error('signup: OTP email send failed', { email, err: result.error });
    // Roll the pending row back so the user can retry without cooldown.
    await supabase.from('pending_signups').delete().eq('email', email);
    throw errors.serverError(
      'We could not send your verification email. Please try again in a moment.',
    );
  }

  void metrics.recordSignup('pending', { source: 'web', stage: 'otp_sent', email });

  return NextResponse.json({
    ok: true,
    needsVerification: true,
    email,
    expiresInMinutes: OTP_TTL_MINUTES,
  });
});
