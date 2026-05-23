import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { getClient, getClientStats, listProjects } from '@/lib/db/queries';
import { ClientDetail } from '@/components/clients/client-detail';

export const metadata = { title: 'Client' };

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const { user, supabase } = await requireUser();
  const [client, stats, projects] = await Promise.all([
    getClient(supabase, params.id),
    getClientStats(supabase, params.id),
    listProjects(supabase, user.id, { clientId: params.id, withClient: false }),
  ]);
  if (!client) notFound();

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" /> All clients
      </Link>
      <ClientDetail client={client} stats={stats} projects={projects} />
    </div>
  );
}
