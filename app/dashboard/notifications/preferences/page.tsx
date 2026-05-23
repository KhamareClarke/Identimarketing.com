import Link from 'next/link';
import { ChevronLeft, Settings2 } from 'lucide-react';

import { PreferencesForm } from './preferences-form';
import { requireUser } from '@/lib/auth/middleware';
import type { NotificationPreferences } from '@/lib/db/types';

export const dynamic = 'force-dynamic';

const DEFAULT_PREFS: Omit<NotificationPreferences, 'user_id' | 'created_at' | 'updated_at'> = {
  email_enabled: true,
  sms_enabled: false,
  in_app_enabled: true,
  category_channels: {
    project: { email: true, sms: false, in_app: true },
    team: { email: true, sms: false, in_app: true },
    performance: { email: true, sms: false, in_app: true },
    billing: { email: true, sms: true, in_app: true },
    system: { email: true, sms: false, in_app: true },
    empire_os: { email: false, sms: false, in_app: true },
  },
  quiet_hours_start: null,
  quiet_hours_end: null,
  daily_digest: false,
  weekly_summary: true,
};

export default async function NotificationPreferencesPage() {
  const { user, supabase } = await requireUser();
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .maybeSingle();

  const prefs = (data as NotificationPreferences | null) ?? {
    user_id: user.id,
    ...DEFAULT_PREFS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        href="/dashboard/notifications"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" /> Back to notifications
      </Link>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-primary" />
          Notification preferences
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose which channels each category uses. Urgent billing/system alerts
          may still send by email regardless of these settings.
        </p>
      </div>

      <PreferencesForm preferences={prefs} hasPhone={Boolean((profile as { phone?: string } | null)?.phone)} />
    </div>
  );
}
