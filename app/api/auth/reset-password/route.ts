import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerClient } from '@/lib/db/client';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { sendPasswordChangedEmail } from '@/lib/email/auth-templates';

const schema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Supabase puts the user into a temporary recovery session when they
 * click the reset link, so the request must arrive with the recovery
 * cookies already set (handled by middleware). We just update the
 * password on the active session here.
 */
export const POST = withErrorHandler('api.auth.reset-password.POST', async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { newPassword } = schema.parse(body);

  const supabase = createServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) {
    throw errors.unauthorized('Reset link expired. Please request a new one.');
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw errors.badRequest(error.message);
  }

  void sendPasswordChangedEmail(
    (userRes.user.user_metadata?.name as string | undefined) || 'there',
    userRes.user.email!,
  ).catch(() => {});

  return NextResponse.json({ success: true });
});
