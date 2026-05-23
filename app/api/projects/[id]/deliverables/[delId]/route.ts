import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { deleteDeliverable, getDeliverable, updateDeliverable } from '@/lib/db/queries';
import { dispatchEventBackground } from '@/lib/empire-os/event-system';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { deliverableUpdateSchema } from '@/lib/validations/project';
import { DELIVERABLE_STATUS_TRANSITIONS } from '@/lib/db/types';
import { metrics } from '@/lib/metrics';
import { sendNotificationBackground } from '@/lib/notifications/dispatcher';

export const GET = withErrorHandler('api.deliverables.[id].GET', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  const deliverable = await getDeliverable(supabase, ctx.params.delId);
  if (!deliverable) throw errors.notFound('Deliverable not found');
  return NextResponse.json({ deliverable });
});

export const PUT = withErrorHandler('api.deliverables.[id].PUT', async (req: NextRequest, ctx) => {
  const { user, supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const patch = deliverableUpdateSchema.parse(body);

  const existing = await getDeliverable(supabase, ctx.params.delId);
  if (patch.status && existing && existing.status !== patch.status) {
    const allowed = DELIVERABLE_STATUS_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(patch.status)) {
      throw errors.badRequest(`Cannot transition deliverable from ${existing.status} to ${patch.status}.`);
    }
  }

  const deliverable = await updateDeliverable(supabase, ctx.params.delId, patch);
  if (deliverable.status === 'completed' || deliverable.status === 'approved') {
    void metrics.recordDeliverableCompleted(user.id, deliverable.id);
  }
  if (patch.status && existing && existing.status !== deliverable.status) {
    const eventType = deliverable.status === 'completed' ? 'deliverable.completed' : 'deliverable.status_changed';
    dispatchEventBackground({
      eventType,
      userId: user.id,
      projectId: deliverable.project_id,
      payload: {
        deliverableId: deliverable.id,
        previousStatus: existing.status,
        newStatus: deliverable.status,
        name: deliverable.name,
      },
    });
    if (deliverable.status === 'completed') {
      sendNotificationBackground({
        userId: user.id,
        type: 'deliverable.completed',
        category: 'project',
        title: `Deliverable completed: ${deliverable.name}`,
        message: `"${deliverable.name}" was marked complete.`,
        actionUrl: `/dashboard/projects/${deliverable.project_id}/deliverables`,
        actionLabel: 'View',
        data: { deliverable_id: deliverable.id, project_id: deliverable.project_id },
      });
    }
  }
  return NextResponse.json({ deliverable });
});

export const DELETE = withErrorHandler('api.deliverables.[id].DELETE', async (_req: NextRequest, ctx) => {
  const { supabase } = await requireUserApi();
  await deleteDeliverable(supabase, ctx.params.delId);
  return NextResponse.json({ success: true });
});
