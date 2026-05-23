import Link from 'next/link';
import { ChevronLeft, FileText } from 'lucide-react';

import { InvoiceTable } from '@/components/billing/invoice-table';
import { requireUser } from '@/lib/auth/middleware';
import type { Invoice } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

export default async function BillingInvoicesPage() {
  const { user, supabase } = await requireUser();
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })
    .limit(100);

  const invoices = (data ?? []) as Invoice[];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" /> Back to billing
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Invoices
        </h1>
        <p className="text-sm text-muted-foreground">
          All invoices mirrored from Stripe. Download PDFs or open the hosted invoice URL.
        </p>
      </div>

      <InvoiceTable invoices={invoices} />
    </div>
  );
}
