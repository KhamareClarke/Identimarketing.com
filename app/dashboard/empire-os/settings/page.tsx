import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/middleware';
import type { EmpireOSSettings } from '@/lib/db/types';
import { EMPIRE_EVENTS } from '@/lib/empire-os/event-system';

import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

async function loadSettings(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase'],
  userId: string,
): Promise<EmpireOSSettings> {
  const { data } = await supabase
    .from('empire_os_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (data) return data as EmpireOSSettings;
  const { data: inserted } = await supabase
    .from('empire_os_settings')
    .insert({ user_id: userId })
    .select('*')
    .single();
  return inserted as EmpireOSSettings;
}

async function loadHistory(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase'],
  userId: string,
): Promise<Array<{ id: string; created_at: string; event_type: string; mode: string; status: string; skills_dispatched: string[] }>> {
  const { data } = await supabase
    .from('empire_os_events')
    .select('id, created_at, event_type, mode, status, skills_dispatched')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(15);
  return (data ?? []) as Array<{
    id: string;
    created_at: string;
    event_type: string;
    mode: string;
    status: string;
    skills_dispatched: string[];
  }>;
}

export default async function EmpireOsSettingsPage() {
  const { user, supabase } = await requireUser();
  const [settings, history] = await Promise.all([
    loadSettings(supabase, user.id),
    loadHistory(supabase, user.id),
  ]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href="/dashboard/empire-os">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Empire OS Settings</h1>
        <p className="text-sm text-muted-foreground">
          Control how Empire OS analyzes your projects and applies recommendations.
        </p>
      </div>

      <SettingsForm
        initial={settings}
        eventOptions={Array.from(EMPIRE_EVENTS)}
      />

      <Card className="p-5 bg-background/60 border-white/10">
        <h2 className="font-semibold mb-3">Recent activity</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {history.map((event) => (
              <li key={event.id} className="border-b border-white/5 pb-2 last:border-b-0">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-mono text-xs">{event.event_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {event.mode} \u00b7 {event.status} \u00b7 {event.skills_dispatched.join(', ') || 'no skills'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
