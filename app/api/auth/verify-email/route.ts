import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerClient } from '@/lib/db/client';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { sendWelcomeEmail } from '@/lib/email/auth-templates';

const schema = z.object({
  token_hash: z.string().min(1),
  type: z.enum(['signup', 'email', 'magiclink', 'recovery', 'invite', 'email_change']).default('signup'),
});

export const POST = withErrorHandler('api.auth.verify-email.POST', async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { token_hash, type } = schema.parse(body);

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error || !data.user) {
    throw errors.badRequest(error?.message || 'Invalid or expired verification link.');
  }

  await supabase
    .from('profiles')
    .update({ email_verified_at: new Date().toISOString() })
    .eq('id', data.user.id);

  const name =
    (data.user.user_metadata?.name as string | undefined) ||
    data.user.email?.split('@')[0] ||
    'there';
  void sendWelcomeEmail(name, data.user.email!).catch(() => {});

  return NextResponse.json({ success: true, user: { id: data.user.id, email: data.user.email } });
});

export const GET = withErrorHandler('api.auth.verify-email.GET', async (req: NextRequest) => {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = (url.searchParams.get('type') || 'signup') as
    | 'signup'
    | 'email'
    | 'magiclink'
    | 'recovery'
    | 'invite'
    | 'email_change';
  if (!token_hash) {
    throw errors.badRequest('Missing verification token.');
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  if (error || !data.user) {
    return NextResponse.redirect(`${appUrl}/auth/verify-email?status=error&message=${encodeURIComponent(error?.message || 'Verification failed')}`);
  }
  await supabase
    .from('profiles')
    .update({ email_verified_at: new Date().toISOString() })
    .eq('id', data.user.id);

  return NextResponse.redirect(`${appUrl}/auth/verify-email?status=success`);
});
