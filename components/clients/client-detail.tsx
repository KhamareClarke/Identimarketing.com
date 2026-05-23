import Link from 'next/link';
import { Globe, Mail, MapPin, Phone, ExternalLink, Edit, FolderKanban } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Client, ProjectWithClient } from '@/lib/db/types';

export interface ClientDetailProps {
  client: Client;
  projects: ProjectWithClient[];
  stats: {
    project_count: number;
    active_projects: number;
    total_revenue: number;
    total_budget: number;
  };
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  lead: 'outline',
  active: 'default',
  paused: 'secondary',
  churned: 'destructive',
};

export function ClientDetail({ client, projects, stats }: ClientDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{client.company_name}</h1>
            <Badge variant={STATUS_VARIANTS[client.status] || 'default'} className="capitalize">
              {client.status}
            </Badge>
          </div>
          {client.industry && (
            <p className="text-sm text-muted-foreground mt-1">{client.industry}</p>
          )}
        </div>
        <Link href={`/dashboard/clients/${client.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 bg-background/60 border-white/10 lg:col-span-2">
          <h2 className="font-semibold mb-3">Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {client.contact_name && (
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Primary contact</div>
                <div className="mt-1">{client.contact_name}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide">Email</div>
              <a className="mt-1 flex items-center gap-1.5 text-primary hover:underline" href={`mailto:${client.contact_email}`}>
                <Mail className="w-3.5 h-3.5" /> {client.contact_email}
              </a>
            </div>
            {client.phone && (
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Phone</div>
                <a className="mt-1 flex items-center gap-1.5 text-primary hover:underline" href={`tel:${client.phone}`}>
                  <Phone className="w-3.5 h-3.5" /> {client.phone}
                </a>
              </div>
            )}
            {client.website && (
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Website</div>
                <a
                  className="mt-1 flex items-center gap-1.5 text-primary hover:underline"
                  href={client.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe className="w-3.5 h-3.5" /> {client.website.replace(/^https?:\/\//, '')}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            )}
            {client.address && (
              <div className="sm:col-span-2">
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Address</div>
                <div className="mt-1 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 mt-1" />
                  <span>{client.address}</span>
                </div>
              </div>
            )}
          </div>
          {client.notes && (
            <div className="mt-5 pt-5 border-t border-white/10">
              <div className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Notes</div>
              <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </Card>

        <Card className="p-5 bg-background/60 border-white/10">
          <h2 className="font-semibold mb-3">Overview</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total revenue</span>
              <span className="font-semibold">{formatCurrency(stats.total_revenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total budget</span>
              <span className="font-semibold">{formatCurrency(stats.total_budget)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Annual budget</span>
              <span className="font-semibold">{formatCurrency(client.budget)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Projects</span>
              <span className="font-semibold">
                {stats.project_count}
                {stats.active_projects > 0 && (
                  <span className="text-xs text-muted-foreground"> ({stats.active_projects} active)</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-muted-foreground">Client since</span>
              <span>{formatDate(client.created_at)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5 bg-background/60 border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Projects</h2>
          <Link href={`/dashboard/projects/new?clientId=${client.id}`}>
            <Button size="sm">
              <FolderKanban className="w-4 h-4 mr-2" /> New project
            </Button>
          </Link>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No projects yet.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/projects/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{p.status.replace('_', ' ')}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium">{formatCurrency(p.budget)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(p.start_date)} - {formatDate(p.end_date)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
