import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Edit, Mail, Phone } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { getMemberWorkload, getTeamMember, listMemberAssignments } from '@/lib/db/queries';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TeamForm } from '@/components/team/team-form';
import { formatDate, initials } from '@/lib/utils';

export const metadata = { title: 'Team member' };

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  invited: 'outline',
  active: 'default',
  inactive: 'secondary',
};

export default async function TeamMemberDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { edit?: string };
}) {
  const { supabase } = await requireUser();
  const [member, workload, assignments] = await Promise.all([
    getTeamMember(supabase, params.id),
    getMemberWorkload(supabase, params.id),
    listMemberAssignments(supabase, params.id),
  ]);
  if (!member) notFound();

  const editing = searchParams?.edit === '1';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/dashboard/team"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" /> Team
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback>{initials(member.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{member.name}</h1>
              <Badge variant={STATUS_VARIANT[member.status]} className="capitalize">
                {member.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
          </div>
        </div>
        {!editing && (
          <Link href={`/dashboard/team/${member.id}?edit=1`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
          </Link>
        )}
      </div>

      {editing ? (
        <TeamForm mode="edit" member={member} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5 bg-background/60 border-white/10 lg:col-span-2">
            <h2 className="font-semibold mb-3">Contact</h2>
            <div className="space-y-2 text-sm">
              <a className="flex items-center gap-2 text-primary hover:underline" href={`mailto:${member.email}`}>
                <Mail className="w-3.5 h-3.5" /> {member.email}
              </a>
              {member.phone && (
                <a className="flex items-center gap-2 text-primary hover:underline" href={`tel:${member.phone}`}>
                  <Phone className="w-3.5 h-3.5" /> {member.phone}
                </a>
              )}
            </div>
            {member.specialties && member.specialties.length > 0 && (
              <>
                <div className="mt-5 pt-5 border-t border-white/10">
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {member.specialties.map((s) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="mt-5 pt-5 border-t border-white/10 text-xs text-muted-foreground">
              {member.invite_sent_at && (
                <p>Invite sent {formatDate(member.invite_sent_at)}.</p>
              )}
              <p>Member since {formatDate(member.created_at)}.</p>
            </div>
          </Card>

          <Card className="p-5 bg-background/60 border-white/10">
            <h2 className="font-semibold mb-3">Workload</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active projects</span>
                <span className="font-semibold">{workload.active_projects}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Open deliverables</span>
                <span className="font-semibold">{workload.open_deliverables}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completed deliverables</span>
                <span className="font-semibold">{workload.completed_deliverables}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-muted-foreground">Assignments</span>
                <span className="font-semibold">{assignments.length}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
