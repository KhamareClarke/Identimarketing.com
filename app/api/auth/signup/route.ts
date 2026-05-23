import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerClient } from '@/lib/db/client';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { logger } from '@/lib/logging';
import { metrics } from '@/lib/metrics';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(120),
});

export const POST = withErrorHandler('api.auth.signup.POST', async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { email, password, name } = schema.parse(body);

  const supabase = createServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${appUrl}/auth/verify-email`,
    },
  });

  if (error) {
    logger.warn('signup failed', { email, code: error.code, status: error.status });
    if (error.message?.toLowerCase().includes('already registered') || error.status === 400) {
      throw errors.conflict('An account with that email already exists.');
    }
    throw errors.badRequest(error.message);
  }

  if (data.user) {
    void metrics.recordSignup(data.user.id, { source: 'web' });
  }

  return NextResponse.json({
    user: data.user
      ? { id: data.user.id, email: data.user.email, name }
      : null,
    needsVerification: !data.session,
  });
});
