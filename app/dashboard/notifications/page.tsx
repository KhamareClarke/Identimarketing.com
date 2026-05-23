import Link from 'next/link';
import { Bell, Settings2 } from 'lucide-react';

import { NotificationList } from '@/components/notifications/notification-list';
import { Badge } from '@/components/ui/badge';
import { requireUser } from '@/lib/auth/middleware';
import { listNotificationsForUser } from '@/lib/notifications/dispatcher';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const { user, supabase } = await requireUser();
  const notifications = await listNotificationsForUser(supabase, user.id, { limit: 200 });
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notifications
            {unread > 0 && (
              <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                {unread} unread
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Activity across projects, team, billing, and Empire OS.
          </p>
        </div>
        <Link href="/dashboard/notifications/preferences">
          <Badge variant="outline" className="cursor-pointer">
            <Settings2 className="w-3 h-3 mr-1" />
            Preferences
          </Badge>
        </Link>
      </div>

      <NotificationList notifications={notifications} />
    </div>
  );
}
