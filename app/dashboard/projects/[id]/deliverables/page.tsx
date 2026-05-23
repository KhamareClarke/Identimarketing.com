import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { getProject, listDeliverables } from '@/lib/db/queries';
import { DeliverablesList } from '@/components/projects/deliverables-list';

export const metadata = { title: 'Deliverables' };

export default async function ProjectDeliverablesPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireUser();
  const [project, deliverables] = await Promise.all([
    getProject(supabase, params.id),
    listDeliverables(supabase, params.id),
  ]);
  if (!project) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" /> Back to project
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Deliverables</h1>
        <p className="text-sm text-muted-foreground">{project.name}</p>
      </div>

      <DeliverablesList projectId={project.id} deliverables={deliverables} />
    </div>
  );
}
