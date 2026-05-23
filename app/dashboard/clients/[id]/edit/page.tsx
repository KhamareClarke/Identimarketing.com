import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { getClient } from '@/lib/db/queries';
import { ClientForm } from '@/components/clients/client-form';

export const metadata = { title: 'Edit client' };

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireUser();
  const client = await getClient(supabase, params.id);
  if (!client) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/clients/${client.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Back to client
        </Link>
        <h1 className="text-2xl font-bold mt-2">Edit client</h1>
        <p className="text-sm text-muted-foreground">Update {client.company_name}&apos;s record.</p>
      </div>

      <ClientForm mode="edit" client={client} />
    </div>
  );
}
