import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerClient } from '@/lib/db/client';
import { recordLogin } from '@/lib/db/queries';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { logger } from '@/lib/logging';
import { metrics } from '@/lib/metrics';
import { emitEmpireActivity } from '@/lib/empire-activity';

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
    void emitEmpireActivity({
      event_type: 'signin_failed',
      user_email: email,
      message: error?.message || 'Invalid email or password',
      request: req,
    });
    throw errors.unauthorized(error?.message || 'Invalid email or password');
  }

  void recordLogin(supabase, data.user.id).catch(() => {});
  void metrics.recordLogin(data.user.id);
  void emitEmpireActivity({
    event_type: 'signin',
    user_email: data.user.email,
    user_id: data.user.id,
    user_name: (data.user.user_metadata as { name?: string } | null)?.name,
    request: req,
  });

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email },
  });
});
