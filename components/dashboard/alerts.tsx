import { AlertTriangle, Calendar, DollarSign } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export type AlertSeverity = 'info' | 'warning' | 'danger';
export type AlertKind = 'budget' | 'deadline' | 'performance';

export interface DashboardAlert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  message?: string;
  href?: string;
  date?: string | null;
}

export interface AlertsProps {
  items: DashboardAlert[];
}

function iconFor(kind: AlertKind) {
  if (kind === 'budget') return DollarSign;
  if (kind === 'deadline') return Calendar;
  return AlertTriangle;
}

function colorFor(sev: AlertSeverity): { dot: string; text: string } {
  if (sev === 'danger') return { dot: 'bg-red-500', text: 'text-red-400' };
  if (sev === 'warning') return { dot: 'bg-amber-500', text: 'text-amber-400' };
  return { dot: 'bg-sky-500', text: 'text-sky-400' };
}

export function Alerts({ items }: AlertsProps) {
  return (
    <Card className="p-5 bg-background/60 border-white/10">
      <div className="mb-4">
        <h3 className="font-semibold">Alerts</h3>
        <p className="text-xs text-muted-foreground">Things that need your attention</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">All clear. No alerts right now.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const Icon = iconFor(a.kind);
            const c = colorFor(a.severity);
            return (
              <li key={a.id} className="flex items-start gap-3">
                <span className={`w-2 h-2 rounded-full mt-1.5 ${c.dot}`} aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${c.text}`} />
                    <p className="text-sm font-medium">{a.title}</p>
                  </div>
                  {a.message && <p className="text-xs text-muted-foreground">{a.message}</p>}
                  {a.date && (
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(a.date)}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
