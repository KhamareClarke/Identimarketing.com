'use client';

import Link from 'next/link';
import { Download, ExternalLink, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Invoice } from '@/lib/db/types';
import { formatDate } from '@/lib/utils';

export interface InvoiceTableProps {
  invoices: Invoice[];
}

function formatAmount(amountMinor: number, currency: string): string {
  const major = amountMinor / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase() || 'USD',
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${currency.toUpperCase()} ${major.toFixed(2)}`;
  }
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'paid') return 'default';
  if (status === 'open') return 'secondary';
  if (status === 'uncollectible' || status === 'void') return 'destructive';
  return 'outline';
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <Card className="p-10 text-center bg-background/40 border-white/10">
        <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <h3 className="font-medium mb-1">No invoices yet</h3>
        <p className="text-sm text-muted-foreground">
          Invoices will appear here automatically after your first paid billing cycle.
        </p>
      </Card>
    );
  }
  return (
    <Card className="bg-background/60 border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Period</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-mono text-xs">
                  {invoice.number || invoice.stripe_invoice_id.slice(-10)}
                </td>
                <td className="px-4 py-3">{formatDate(invoice.issued_at)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {invoice.period_start && invoice.period_end
                    ? `${formatDate(invoice.period_start)} \u2013 ${formatDate(invoice.period_end)}`
                    : '\u2014'}
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatAmount(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariant(invoice.status)} className="capitalize">
                    {invoice.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    {invoice.hosted_invoice_url && (
                      <Link
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </Link>
                    )}
                    {invoice.invoice_pdf && (
                      <Link
                        href={invoice.invoice_pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
