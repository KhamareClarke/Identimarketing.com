import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { createClient as createClientRow, listClientsWithStats } from '@/lib/db/queries';
import { dispatchEventBackground } from '@/lib/empire-os/event-system';
import { withErrorHandler } from '@/lib/error-handler';
import { clientInputSchema } from '@/lib/validations/client';
import { metrics } from '@/lib/metrics';
import { syncClientToGHL } from '@/lib/integrations/ghl';
import { sendNotificationBackground } from '@/lib/notifications/dispatcher';

export const GET = withErrorHandler('api.clients.GET', async () => {
  const { user, supabase } = await requireUserApi();
  const clients = await listClientsWithStats(supabase, user.id);
  return NextResponse.json({ clients });
});

export const POST = withErrorHandler('api.clients.POST', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const input = clientInputSchema.parse(body);

  const client = await createClientRow(supabase, user.id, {
    ...input,
    website: input.website || null,
    industry: input.industry ?? null,
    contact_name: input.contact_name ?? null,
    phone: input.phone ?? null,
    address: input.address ?? null,
    notes: input.notes ?? null,
  });

  void metrics.recordClientCreated(user.id, client.id);
  void syncClientToGHL(client).catch(() => {});
  sendNotificationBackground({
    userId: user.id,
    type: 'client.created',
    category: 'project',
    title: 'New client added',
    message: client.company_name,
    actionUrl: `/dashboard/clients/${client.id}`,
    actionLabel: 'Open client',
    data: { client_id: client.id },
  });

  dispatchEventBackground({
    eventType: 'client.created',
    userId: user.id,
    clientId: client.id,
    payload: { company_name: client.company_name, industry: client.industry },
  });

  return NextResponse.json({ client }, { status: 201 });
});
