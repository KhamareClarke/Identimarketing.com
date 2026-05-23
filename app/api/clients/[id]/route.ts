import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { deleteClient, getClient, updateClient } from '@/lib/db/queries';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { clientUpdateSchema } from '@/lib/validations/client';

export const GET = withErrorHandler('api.clients.[id].GET', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const client = await getClient(supabase, ctx.params.id);
  if (!client) throw errors.notFound('Client not found');
  return NextResponse.json({ client });
});

export const PUT = withErrorHandler('api.clients.[id].PUT', async (req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const patch = clientUpdateSchema.parse(body);
  const client = await updateClient(supabase, ctx.params.id, {
    ...patch,
    website: patch.website === '' ? null : patch.website,
  });
  return NextResponse.json({ client });
});

export const DELETE = withErrorHandler('api.clients.[id].DELETE', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  await deleteClient(supabase, ctx.params.id);
  return NextResponse.json({ success: true });
});
