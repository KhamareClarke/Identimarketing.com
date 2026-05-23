'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { NotificationCategory, NotificationPreferences } from '@/lib/db/types';

const CATEGORIES: { id: NotificationCategory; label: string; description: string }[] = [
  {
    id: 'project',
    label: 'Projects & deliverables',
    description: 'Created, status changes, due dates, completion.',
  },
  {
    id: 'team',
    label: 'Team',
    description: 'Assignments, invitations, role changes.',
  },
  {
    id: 'performance',
    label: 'Performance alerts',
    description: 'Metrics below target, budget warnings.',
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Renewals, payment failures, plan limits.',
  },
  {
    id: 'empire_os',
    label: 'Empire OS',
    description: 'New AI recommendations, executed actions.',
  },
  {
    id: 'system',
    label: 'System',
    description: 'Service announcements, maintenance.',
  },
];

type PrefsState = Omit<NotificationPreferences, 'created_at' | 'updated_at'>;

export interface PreferencesFormProps {
  preferences: NotificationPreferences;
  hasPhone: boolean;
}

export function PreferencesForm({ preferences, hasPhone }: PreferencesFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<PrefsState>(() => ({
    user_id: preferences.user_id,
    email_enabled: preferences.email_enabled,
    sms_enabled: preferences.sms_enabled,
    in_app_enabled: preferences.in_app_enabled,
    category_channels: preferences.category_channels,
    quiet_hours_start: preferences.quiet_hours_start,
    quiet_hours_end: preferences.quiet_hours_end,
    daily_digest: preferences.daily_digest,
    weekly_summary: preferences.weekly_summary,
  }));
  const [saving, setSaving] = useState(false);

  function setMaster(key: 'email_enabled' | 'sms_enabled' | 'in_app_enabled', value: boolean) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function setCategoryChannel(
    cat: NotificationCategory,
    channel: 'email' | 'sms' | 'in_app',
    value: boolean,
  ) {
    setState((s) => ({
      ...s,
      category_channels: {
        ...s.category_channels,
        [cat]: { ...s.category_channels[cat], [channel]: value },
      },
    }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email_enabled: state.email_enabled,
          sms_enabled: state.sms_enabled,
          in_app_enabled: state.in_app_enabled,
          category_channels: state.category_channels,
          quiet_hours_start: state.quiet_hours_start,
          quiet_hours_end: state.quiet_hours_end,
          daily_digest: state.daily_digest,
          weekly_summary: state.weekly_summary,
        }),
      });
      const json: { error?: { message?: string } } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || 'Save failed');
      toast({ title: 'Preferences saved' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Could not save',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 bg-background/60 border-white/10">
        <h2 className="font-semibold mb-3">Channels</h2>
        <div className="space-y-3 text-sm">
          <Toggle
            label="In-app notifications"
            description="Always recommended - this powers the bell icon."
            checked={state.in_app_enabled}
            onChange={(v) => setMaster('in_app_enabled', v)}
          />
          <Toggle
            label="Email"
            description="HTML emails for important events. Sent from your registered address."
            checked={state.email_enabled}
            onChange={(v) => setMaster('email_enabled', v)}
          />
          <Toggle
            label="SMS"
            description={
              hasPhone
                ? 'Delivered via Go High Level.'
                : 'Add a phone number to your profile first.'
            }
            checked={state.sms_enabled}
            onChange={(v) => setMaster('sms_enabled', v)}
            disabled={!hasPhone}
          />
        </div>
      </Card>

      <Card className="p-5 bg-background/60 border-white/10">
        <h2 className="font-semibold mb-3">By category</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground text-xs uppercase tracking-wide">
                <th className="pb-2">Category</th>
                <th className="pb-2 text-center w-20">In-app</th>
                <th className="pb-2 text-center w-20">Email</th>
                <th className="pb-2 text-center w-20">SMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {CATEGORIES.map((cat) => {
                const channels = state.category_channels[cat.id];
                return (
                  <tr key={cat.id} className="align-top">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{cat.label}</div>
                      <div className="text-xs text-muted-foreground">{cat.description}</div>
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={channels.in_app}
                        onChange={(e) => setCategoryChannel(cat.id, 'in_app', e.target.checked)}
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={channels.email}
                        onChange={(e) => setCategoryChannel(cat.id, 'email', e.target.checked)}
                      />
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={channels.sms}
                        onChange={(e) => setCategoryChannel(cat.id, 'sms', e.target.checked)}
                        disabled={!hasPhone}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 bg-background/60 border-white/10">
        <h2 className="font-semibold mb-3">Digests</h2>
        <div className="space-y-3 text-sm">
          <Toggle
            label="Daily digest"
            description="One email summarising the previous day, sent at 08:00."
            checked={state.daily_digest}
            onChange={(v) => setState((s) => ({ ...s, daily_digest: v }))}
          />
          <Toggle
            label="Weekly summary"
            description="Monday morning round-up of last week."
            checked={state.weekly_summary}
            onChange={(v) => setState((s) => ({ ...s, weekly_summary: v }))}
          />
        </div>
      </Card>

      <Card className="p-5 bg-background/60 border-white/10">
        <h2 className="font-semibold mb-3">Quiet hours</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Non-urgent email + SMS won&apos;t fire during these hours (UTC).
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <label className="text-sm space-y-1">
            <span className="text-muted-foreground">Start</span>
            <input
              type="time"
              value={state.quiet_hours_start ?? ''}
              onChange={(e) =>
                setState((s) => ({ ...s, quiet_hours_start: e.target.value || null }))
              }
              className="w-full bg-background border border-white/10 rounded px-2 py-1"
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-muted-foreground">End</span>
            <input
              type="time"
              value={state.quiet_hours_end ?? ''}
              onChange={(e) =>
                setState((s) => ({ ...s, quiet_hours_end: e.target.value || null }))
              }
              className="w-full bg-background border border-white/10 rounded px-2 py-1"
            />
          </label>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save preferences
        </Button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 accent-primary"
      />
      <div>
        <div className="font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground">{description}</div>}
      </div>
    </label>
  );
}
