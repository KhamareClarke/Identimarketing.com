import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import { createProject, listProjects } from '@/lib/db/queries';
import { sendNotificationBackground } from '@/lib/notifications/dispatcher';
import { dispatchEventBackground } from '@/lib/empire-os/event-system';
import { withErrorHandler } from '@/lib/error-handler';
import { projectInputSchema } from '@/lib/validations/project';
import { metrics } from '@/lib/metrics';

export const GET = withErrorHandler('api.projects.GET', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || undefined;
  const clientId = url.searchParams.get('clientId') || undefined;
  const projects = await listProjects(supabase, user.id, {
    status: status as never,
    clientId: clientId || undefined,
    withClient: true,
  });
  return NextResponse.json({ projects });
});

export const POST = withErrorHandler('api.projects.POST', async (req: NextRequest) => {
  const { user, supabase } = await requireUserApi();
  const body = await req.json().catch(() => ({}));
  const input = projectInputSchema.parse(body);

  const project = await createProject(supabase, user.id, {
    ...input,
    description: input.description ?? null,
    service_type: input.service_type ?? null,
    service_id: input.service_id ?? null,
    start_date: input.start_date ?? null,
    end_date: input.end_date ?? null,
  });

  void metrics.recordProjectCreated(user.id, project.id, project.budget);
  sendNotificationBackground({
    userId: user.id,
    type: 'project.created',
    category: 'project',
    title: 'New project created',
    message: project.name,
    actionUrl: `/dashboard/projects/${project.id}`,
    actionLabel: 'Open project',
    data: { project_id: project.id },
  });

  dispatchEventBackground({
    eventType: 'project.created',
    userId: user.id,
    projectId: project.id,
    clientId: project.client_id,
    payload: { name: project.name, service_type: project.service_type, budget: project.budget },
  });

  return NextResponse.json({ project }, { status: 201 });
});
