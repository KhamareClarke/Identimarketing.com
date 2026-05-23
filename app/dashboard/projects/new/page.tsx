import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { listClients, listServices } from '@/lib/db/queries';
import { ProjectForm } from '@/components/projects/project-form';

export const metadata = { title: 'New project' };

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams?: { clientId?: string };
}) {
  const { user, supabase } = await requireUser();
  const [clients, services] = await Promise.all([
    listClients(supabase, user.id),
    listServices(supabase),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> All projects
        </Link>
        <h1 className="text-2xl font-bold mt-2">New project</h1>
        <p className="text-sm text-muted-foreground">Set up the project and assign deliverables next.</p>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-background/50 p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">You need at least one client before you can create a project.</p>
          <Link href="/dashboard/clients/new" className="text-primary font-medium hover:underline">
            Add your first client
          </Link>
        </div>
      ) : (
        <ProjectForm
          mode="create"
          clients={clients}
          services={services}
          defaultClientId={searchParams?.clientId}
        />
      )}
    </div>
  );
}
