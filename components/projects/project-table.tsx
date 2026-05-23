'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ProjectWithClient } from '@/lib/db/types';

const STATUSES: Array<ProjectWithClient['status'] | 'all'> = [
  'all',
  'planning',
  'active',
  'in_review',
  'completed',
  'closed',
  'cancelled',
];

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  planning: 'outline',
  active: 'default',
  in_review: 'secondary',
  completed: 'default',
  closed: 'secondary',
  cancelled: 'destructive',
};

export interface ProjectTableProps {
  projects: ProjectWithClient[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');

  const rows = useMemo(() => {
    return projects.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.client?.company_name || '').toLowerCase().includes(q);
    });
  }, [projects, search, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-white/10 bg-background/50 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3 hidden md:table-cell">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden lg:table-cell">Budget</th>
                <th className="px-4 py-3 hidden lg:table-cell">Spent</th>
                <th className="px-4 py-3 hidden xl:table-cell">Timeline</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No projects found.
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const pct = Number(p.budget) > 0 ? Math.min(100, Math.round((Number(p.spent) / Number(p.budget)) * 100)) : 0;
                  return (
                    <tr key={p.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/projects/${p.id}`} className="font-medium hover:text-primary">
                          {p.name}
                        </Link>
                        {p.service_type && (
                          <div className="text-xs text-muted-foreground">{p.service_type}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {p.client ? (
                          <Link href={`/dashboard/clients/${p.client.id}`} className="hover:text-primary">
                            {p.client.company_name}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[p.status] || 'default'} className="capitalize">
                          {p.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">{formatCurrency(p.budget)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {formatCurrency(p.spent)}
                        <div className="h-1 mt-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full ${pct >= 100 ? 'bg-red-500' : pct >= 85 ? 'bg-amber-500' : 'bg-primary'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                        {formatDate(p.start_date)} - {formatDate(p.end_date)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <Link href={`/dashboard/projects/${p.id}`}>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
