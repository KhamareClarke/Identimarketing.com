'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Circle,
  CreditCard,
  Folder,
  Loader2,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Notification, NotificationCategory } from '@/lib/db/types';
import { relativeTime } from '@/lib/utils';

const CATEGORIES: { id: NotificationCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'project', label: 'Projects' },
  { id: 'team', label: 'Team' },
  { id: 'performance', label: 'Performance' },
  { id: 'billing', label: 'Billing' },
  { id: 'empire_os', label: 'Empire OS' },
  { id: 'system', label: 'System' },
];

const CATEGORY_ICON: Record<NotificationCategory, React.ComponentType<{ className?: string }>> = {
  project: Folder,
  team: Users,
  performance: Zap,
  billing: CreditCard,
  system: Bell,
  empire_os: Sparkles,
};

const PRIORITY_TONE: Record<string, string> = {
  urgent: 'border-red-500/40 text-red-300',
  high: 'border-amber-500/40 text-amber-300',
  normal: 'border-white/10 text-muted-foreground',
  low: 'border-white/5 text-muted-foreground',
};

export interface NotificationListProps {
  notifications: Notification[];
}

export function NotificationList({ notifications: initial }: NotificationListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');
  const [hideRead, setHideRead] = useState(false);
  const [items, setItems] = useState(initial);

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (filter !== 'all' && n.category !== filter) return false;
      if (hideRead && n.is_read) return false;
      return true;
    });
  }, [items, filter, hideRead]);

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  async function markRead(id: string, isRead: boolean): Promise<void> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ is_read: isRead }),
      });
      if (!res.ok) throw new Error('Update failed');
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: isRead, read_at: isRead ? new Date().toISOString() : null } : n,
        ),
      );
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  }

  async function softDelete(id: string): Promise<void> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead(): Promise<void> {
    startTransition(async () => {
      try {
        const res = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ all: true }),
        });
        if (!res.ok) throw new Error('Update failed');
        setItems((prev) =>
          prev.map((n) => ({ ...n, is_read: true, read_at: n.read_at ?? new Date().toISOString() })),
        );
        toast({ title: 'All notifications marked read.' });
        router.refresh();
      } catch (err) {
        toast({
          title: 'Could not mark all read',
          description: err instanceof Error ? err.message : 'Unknown error',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={filter === cat.id ? 'default' : 'outline'}
              onClick={() => setFilter(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={hideRead}
              onChange={(e) => setHideRead(e.target.checked)}
              className="accent-primary"
            />
            Hide read
          </label>
          <Button
            size="sm"
            variant="ghost"
            onClick={markAllRead}
            disabled={pending || unreadCount === 0}
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5 mr-1" />}
            Mark all read ({unreadCount})
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center bg-background/40 border-white/10">
          <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <h3 className="font-medium mb-1">No notifications</h3>
          <p className="text-sm text-muted-foreground">
            {filter === 'all'
              ? 'You are all caught up.'
              : `Nothing in ${CATEGORIES.find((c) => c.id === filter)?.label}.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = CATEGORY_ICON[n.category] ?? Bell;
            const tone = PRIORITY_TONE[n.priority] ?? PRIORITY_TONE.normal;
            return (
              <Card
                key={n.id}
                className={`p-4 bg-background/60 border ${
                  n.is_read ? 'border-white/5' : 'border-primary/30 bg-primary/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`shrink-0 mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center ${
                      n.is_read ? 'bg-white/5' : 'bg-primary/15'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <div className="font-medium leading-snug">{n.title}</div>
                      {!n.is_read && <Circle className="w-2 h-2 text-primary fill-primary mt-1.5" />}
                      {n.priority !== 'normal' && (
                        <Badge variant="outline" className={`uppercase text-[10px] ${tone}`}>
                          {n.priority === 'urgent' && <AlertTriangle className="w-3 h-3 mr-0.5" />}
                          {n.priority}
                        </Badge>
                      )}
                    </div>
                    {n.message && (
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                        {n.message}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                      <div className="text-xs text-muted-foreground">
                        {relativeTime(n.sent_at)}
                        {n.email_status === 'sent' && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Emailed
                          </span>
                        )}
                        {n.sms_status === 'sent' && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            SMS sent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {n.action_url && (
                          <Link href={n.action_url}>
                            <Button size="sm" variant="ghost" className="h-7 text-xs">
                              {n.action_label ?? 'Open'}
                            </Button>
                          </Link>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => markRead(n.id, !n.is_read)}
                          disabled={busyId === n.id}
                        >
                          {n.is_read ? 'Mark unread' : 'Mark read'}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-red-300"
                          onClick={() => softDelete(n.id)}
                          disabled={busyId === n.id}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
