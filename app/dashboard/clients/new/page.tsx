import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { ClientForm } from '@/components/clients/client-form';

export const metadata = { title: 'New client' };

export default async function NewClientPage() {
  await requireUser();
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> All clients
        </Link>
        <h1 className="text-2xl font-bold mt-2">Add client</h1>
        <p className="text-sm text-muted-foreground">Create a new client record.</p>
      </div>

      <ClientForm mode="create" />
    </div>
  );
}
