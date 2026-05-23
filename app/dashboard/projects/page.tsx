import Link from 'next/link';
import { Plus } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { listProjects } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { ProjectTable } from '@/components/projects/project-table';

export const metadata = { title: 'Projects' };

export default async function ProjectsPage() {
  const { user, supabase } = await requireUser();
  const projects = await listProjects(supabase, user.id, { withClient: true });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-muted-foreground">Track every project from kickoff to delivery.</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New project
          </Button>
        </Link>
      </div>

      <ProjectTable projects={projects} />
    </div>
  );
}
