import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { getProject, listClients, listServices } from '@/lib/db/queries';
import { ProjectForm } from '@/components/projects/project-form';

export const metadata = { title: 'Edit project' };

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const { user, supabase } = await requireUser();
  const [project, clients, services] = await Promise.all([
    getProject(supabase, params.id),
    listClients(supabase, user.id),
    listServices(supabase),
  ]);
  if (!project) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Back to project
        </Link>
        <h1 className="text-2xl font-bold mt-2">Edit project</h1>
        <p className="text-sm text-muted-foreground">Update settings for {project.name}.</p>
      </div>

      <ProjectForm mode="edit" project={project} clients={clients} services={services} />
    </div>
  );
}
