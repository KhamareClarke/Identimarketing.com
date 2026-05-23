import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { requireUserApi } from '@/lib/auth/middleware';
import { createServiceClient } from '@/lib/db/client';
import { createTeamMember, getProfile, listTeamMembers } from '@/lib/db/queries';
import { withErrorHandler } from '@/lib/error-handler';
import { teamMemberInputSchema } from '@/lib/validations/team';
import { sendTeamInviteEmail } from '@/lib/email/auth-templates';

export const GET = withErrorHandler('api.team.GET', async () => {
  const { user, supabase } = await requireUserApi();
  const members = await listTeamMembers(supabase, user.id);
  return NextResponse.json({ members });
});

export const POST = withErrorHandler('api.team.POST', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const input = teamMemberInputSchema.parse(body);

  const inviteToken = crypto.randomBytes(24).toString('hex');
  const member = await createTeamMember(supabase, {
    owner_id: user.id,
    name: input.name,
    email: input.email,
    role: input.role,
    specialties: input.specialties || [],
    phone: input.phone ?? null,
    status: 'invited',
    invite_token: inviteToken,
    invite_sent_at: new Date().toISOString(),
  });

  // Trigger Supabase Auth invite email via the service-role admin API.
  try {
    const admin = createServiceClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    await admin.auth.admin.inviteUserByEmail(input.email, {
      redirectTo: `${appUrl}/auth/reset-password`,
      data: { name: input.name, invited_by: user.id, team_member_id: member.id },
    });
  } catch (err) {
    // Fall back to our own branded invite email if Supabase invite fails.
    const profile = await getProfile(supabase, user.id);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    await sendTeamInviteEmail({
      inviterName: profile?.name || user.email || 'Your teammate',
      workspaceName: 'Identimarketing',
      inviteeEmail: input.email,
      acceptUrl: `${appUrl}/auth/signup?invite=${inviteToken}`,
    });
    if (err) {
      // log and continue
    }
  }

  return NextResponse.json({ member }, { status: 201 });
});
