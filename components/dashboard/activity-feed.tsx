import { Card } from '@/components/ui/card';
import { relativeTime } from '@/lib/utils';
import type { Notification } from '@/lib/db/types';
import { Activity, Bell, CheckCircle2, AlertTriangle, FolderPlus, UserPlus, FileText } from 'lucide-react';

function iconForType(type: string) {
  if (type.startsWith('client.')) return UserPlus;
  if (type.startsWith('project.')) return FolderPlus;
  if (type.startsWith('deliverable.')) return FileText;
  if (type.includes('alert') || type.includes('warning')) return AlertTriangle;
  if (type.includes('complete') || type.includes('success')) return CheckCircle2;
  if (type === 'system') return Activity;
  return Bell;
}

export interface ActivityFeedProps {
  items: Notification[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card className="p-5 bg-background/60 border-white/10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Recent activity</h3>
          <p className="text-xs text-muted-foreground">Latest events across your workspace</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No activity yet. Create your first client to get started.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const Icon = iconForType(n.type);
            return (
              <li key={n.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(n.sent_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
