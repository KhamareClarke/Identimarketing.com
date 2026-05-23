import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerClient } from '@/lib/db/client';
import { recordLogin } from '@/lib/db/queries';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { logger } from '@/lib/logging';
import { metrics } from '@/lib/metrics';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const POST = withErrorHandler('api.auth.login.POST', async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { email, password } = schema.parse(body);

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    logger.warn('login failed', { email, code: error?.code });
    throw errors.unauthorized(error?.message || 'Invalid email or password');
  }

  void recordLogin(supabase, data.user.id).catch(() => {});
  void metrics.recordLogin(data.user.id);

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email },
  });
});
