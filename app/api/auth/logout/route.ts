import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/db/client';
import { withErrorHandler } from '@/lib/error-handler';

export const POST = withErrorHandler('api.auth.logout.POST', async () => {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
});
