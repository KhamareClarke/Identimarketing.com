import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler, errors } from '@/lib/error-handler';
import { requireUserApi } from '@/lib/auth/middleware';
import { sendPasswordChangedEmail } from '@/lib/email/auth-templates';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const POST = withErrorHandler('api.auth.update-password.POST', async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { currentPassword, newPassword } = schema.parse(body);

  const { user, supabase } = await requireUserApi();

  // Verify the current password by attempting a sign-in with it.
  const verify = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });
  if (verify.error) {
    throw errors.unauthorized('Current password is incorrect.');
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw errors.badRequest(error.message);
  }

  void sendPasswordChangedEmail(
    (user.user_metadata?.name as string | undefined) || 'there',
    user.email!,
  ).catch(() => {});

  return NextResponse.json({ success: true });
});
