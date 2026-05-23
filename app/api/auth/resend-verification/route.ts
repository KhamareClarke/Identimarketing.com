// =====================================================================
// POST /api/auth/resend-verification
//
// Body: { email }. Re-emails the OTP for an in-flight signup, applying
// the same 30-second cooldown as /api/auth/signup. Returns a generic
// success message so we don't leak whether an email is registered.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { hash } from '@/lib/auth/bcrypt';
import { generateNumericOtp } from '@/lib/auth/crypt';
import { createServiceClient } from '@/lib/db/client';
import { sendVerificationOtpEmail } from '@/lib/email/auth-templates';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { logger } from '@/lib/logging';

const schema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
});

const OTP_TTL_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 30;

const GENERIC_RESPONSE = {
  ok: true,
  message:
    "If a signup is in progress for that email, we've sent a fresh code. It can take a minute to arrive.",
};

export const POST = withErrorHandler(
  'api.auth.resend-verification.POST',
  async (req: NextRequest) => {
    const body = await req.json().catch(() => ({}));
    const { email } = schema.parse(body);

    const supabase = createServiceClient();
    const { data: row } = await supabase
      .from('pending_signups')
      .select('id, name, last_sent_at')
      .eq('email', email)
      .maybeSingle();
    const pending = row as { id: string; name: string; last_sent_at: string } | null;

    if (!pending) {
      // No in-flight signup. Return the generic message anyway.
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const elapsed = (Date.now() - new Date(pending.last_sent_at).getTime()) / 1000;
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
      throw errors.rateLimited(`Please wait ${wait}s before requesting another code.`);
    }

    const code = generateNumericOtp(6);
    const codeHash = await hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('pending_signups')
      .update({
        code_hash: codeHash,
        attempts: 0,
        last_sent_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .eq('id', pending.id);
    if (updateError) {
      logger.error('resend-verification: update failed', { email, err: updateError.message });
      throw errors.serverError('Could not refresh your code. Please try again.');
    }

    const result = await sendVerificationOtpEmail({
      email,
      name: pending.name,
      code,
      expiresInMinutes: OTP_TTL_MINUTES,
    });
    if (!result.success) {
      logger.error('resend-verification: email send failed', { email, err: result.error });
      throw errors.serverError('We could not send the email. Please try again in a moment.');
    }

    return NextResponse.json(GENERIC_RESPONSE);
  },
);
