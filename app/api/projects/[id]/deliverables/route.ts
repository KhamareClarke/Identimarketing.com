import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { createDeliverable, listDeliverables } from '@/lib/db/queries';
import { withErrorHandler } from '@/lib/error-handler';
import { deliverableInputSchema } from '@/lib/validations/project';

export const GET = withErrorHandler('api.projects.[id].deliverables.GET', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const deliverables = await listDeliverables(supabase, ctx.params.id);
  return NextResponse.json({ deliverables });
});

export const POST = withErrorHandler('api.projects.[id].deliverables.POST', async (req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const input = deliverableInputSchema.parse(body);

  const deliverable = await createDeliverable(supabase, {
    project_id: ctx.params.id,
    name: input.name,
    description: input.description ?? null,
    status: input.status,
    due_date: input.due_date ?? null,
    assigned_to: input.assigned_to ?? null,
    notes: input.notes ?? null,
    file_urls: input.file_urls ?? [],
  });

  return NextResponse.json({ deliverable }, { status: 201 });
});
