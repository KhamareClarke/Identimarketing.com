import Link from 'next/link';
import { Plus } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { listTeamMembers } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { TeamTable } from '@/components/team/team-table';

export const metadata = { title: 'Team' };

export default async function TeamPage() {
  const { user, supabase } = await requireUser();
  const members = await listTeamMembers(supabase, user.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-sm text-muted-foreground">Manage everyone who works on your projects.</p>
        </div>
        <Link href="/dashboard/team/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Invite member
          </Button>
        </Link>
      </div>

      <TeamTable members={members} />
    </div>
  );
}
