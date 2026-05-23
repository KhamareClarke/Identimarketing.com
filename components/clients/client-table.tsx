'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, ChevronRight, Mail, Phone } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { ClientWithStats } from '@/lib/db/types';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  lead: 'outline',
  active: 'default',
  paused: 'secondary',
  churned: 'destructive',
};

export interface ClientTableProps {
  clients: ClientWithStats[];
}

export function ClientTable({ clients }: ClientTableProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');

  const rows = useMemo(() => {
    return clients.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.company_name.toLowerCase().includes(q) ||
        c.contact_email.toLowerCase().includes(q) ||
        (c.industry ?? '').toLowerCase().includes(q)
      );
    });
  }, [clients, search, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by company, email, industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3 hidden md:table-cell">Industry</th>
                <th className="px-4 py-3 hidden lg:table-cell">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Projects</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No clients found. Try a different filter or add your first client.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/clients/${c.id}`} className="font-medium hover:text-primary">
                        {c.company_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {c.industry || '-'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3" /> {c.contact_email}
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANTS[c.status] || 'default'} className="capitalize">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{c.project_count}</span>
                      {c.active_projects > 0 && (
                        <span className="text-xs text-muted-foreground"> ({c.active_projects} active)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(c.total_revenue)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <Link href={`/dashboard/clients/${c.id}`}>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
