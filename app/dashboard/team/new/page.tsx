import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { TeamForm } from '@/components/team/team-form';

export const metadata = { title: 'Invite team member' };

export default async function NewTeamMemberPage() {
  await requireUser();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/team"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Team
        </Link>
        <h1 className="text-2xl font-bold mt-2">Invite a team member</h1>
        <p className="text-sm text-muted-foreground">They&apos;ll receive an email invite to join your workspace.</p>
      </div>

      <TeamForm mode="create" />
    </div>
  );
}
