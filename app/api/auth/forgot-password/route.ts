import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerClient } from '@/lib/db/client';
import { withErrorHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logging';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export const POST = withErrorHandler('api.auth.forgot-password.POST', async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { email } = schema.parse(body);

  const supabase = createServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/reset-password`,
  });

  if (error) {
    logger.warn('forgot-password failed', { email, msg: error.message });
  }

  // Always return the same response to avoid leaking which emails exist.
  return NextResponse.json({
    success: true,
    message: 'If an account exists for that email, a reset link is on its way.',
  });
});
