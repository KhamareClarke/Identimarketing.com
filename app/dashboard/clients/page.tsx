import Link from 'next/link';
import { Plus } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { listClientsWithStats } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { ClientTable } from '@/components/clients/client-table';

export const metadata = { title: 'Clients' };

export default async function ClientsPage() {
  const { user, supabase } = await requireUser();
  const clients = await listClientsWithStats(supabase, user.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">Manage your client roster and revenue.</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Add client
          </Button>
        </Link>
      </div>

      <ClientTable clients={clients} />
    </div>
  );
}
