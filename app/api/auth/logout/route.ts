import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/db/client';
import { withErrorHandler } from '@/lib/error-handler';
import { emitEmpireActivity } from '@/lib/empire-activity';

export const POST = withErrorHandler('api.auth.logout.POST', async (req: NextRequest) => {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  if (user) {
    void emitEmpireActivity({
      event_type: 'logout',
      user_email: user.email,
      user_id: user.id,
      request: req,
    });
  }
  return NextResponse.json({ success: true });
});
