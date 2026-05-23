import { Users, FolderKanban, DollarSign, UsersRound, ArrowUpRight, ArrowDownRight } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface Kpi {
  label: string;
  value: string;
  delta?: number;
  icon: 'clients' | 'projects' | 'revenue' | 'team';
}

const ICONS = {
  clients: Users,
  projects: FolderKanban,
  revenue: DollarSign,
  team: UsersRound,
} as const;

export interface KpiCardsProps {
  clientsActive: number;
  projectsActive: number;
  revenueTotal: number;
  teamActive: number;
  revenueLast30: number;
}

export function KpiCards(props: KpiCardsProps) {
  const items: Kpi[] = [
    { label: 'Active clients', value: formatNumber(props.clientsActive), icon: 'clients' },
    { label: 'Active projects', value: formatNumber(props.projectsActive), icon: 'projects' },
    {
      label: 'Total revenue',
      value: formatCurrency(props.revenueTotal),
      icon: 'revenue',
      delta:
        props.revenueTotal > 0
          ? Math.round((props.revenueLast30 / props.revenueTotal) * 100)
          : undefined,
    },
    { label: 'Team members', value: formatNumber(props.teamActive), icon: 'team' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((kpi) => {
        const Icon = ICONS[kpi.icon];
        return (
          <Card key={kpi.label} className="p-5 bg-background/60 border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{kpi.label}</div>
                <div className="text-2xl font-bold mt-1">{kpi.value}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            {kpi.delta !== undefined && (
              <div
                className={`flex items-center gap-1 text-xs mt-3 ${
                  kpi.delta >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {kpi.delta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {Math.abs(kpi.delta)}% from prior period
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
