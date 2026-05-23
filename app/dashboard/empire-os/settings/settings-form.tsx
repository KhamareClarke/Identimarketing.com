'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { EmpireOSSettings, RecommendationType } from '@/lib/db/types';

const REC_TYPES: { id: RecommendationType; label: string; description: string }[] = [
  { id: 'generate_content', label: 'Content outlines', description: 'Blog post outlines and structures' },
  { id: 'email_sequence', label: 'Email sequences', description: 'Multi-step nurture and onboarding emails' },
  { id: 'social_calendar', label: 'Social calendars', description: '4-week social content plans' },
  { id: 'ad_copy', label: 'Ad copy', description: 'Meta and Google ad variations' },
  { id: 'strategy', label: 'Strategy docs', description: 'Pillars, KPIs, 90-day plans' },
  { id: 'advice', label: 'Advice notes', description: 'Plain-text optimisation guidance' },
];

export interface SettingsFormProps {
  initial: EmpireOSSettings;
  eventOptions: string[];
}

export function SettingsForm({ initial, eventOptions }: SettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [autoExecute, setAutoExecute] = useState(initial.auto_execute);
  const [confidence, setConfidence] = useState(initial.confidence_threshold);
  const [budget, setBudget] = useState(Number(initial.hourly_budget_usd));
  const [allowedTypes, setAllowedTypes] = useState<RecommendationType[]>(
    initial.allowed_recommendation_types,
  );
  const [enabledEvents, setEnabledEvents] = useState<string[]>(initial.enabled_event_types);
  const [busy, setBusy] = useState(false);

  function toggleType(id: RecommendationType): void {
    setAllowedTypes((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }
  function toggleEvent(id: string): void {
    setEnabledEvents((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function save(): Promise<void> {
    setBusy(true);
    try {
      const res = await fetch('/api/empire-os/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          auto_execute: autoExecute,
          confidence_threshold: confidence,
          hourly_budget_usd: budget,
          allowed_recommendation_types: allowedTypes,
          enabled_event_types: enabledEvents,
        }),
      });
      const json: { error?: { message?: string } } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || 'Save failed');
      toast({ title: 'Settings saved' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Could not save settings',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-background/60 border-white/10 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Label htmlFor="auto-execute" className="font-medium">
              Auto-execute approved recommendations
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              When on, approving a recommendation immediately generates the artifact (content, copy, etc.).
              When off, approval just records the decision and you generate manually.
            </p>
          </div>
          <Switch
            id="auto-execute"
            checked={autoExecute}
            onCheckedChange={setAutoExecute}
          />
        </div>

        <div>
          <Label htmlFor="confidence" className="font-medium">
            Confidence threshold ({confidence}%)
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Recommendations below this threshold won&apos;t auto-execute even with auto-execute on.
          </p>
          <Input
            id="confidence"
            type="number"
            min={0}
            max={100}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value || 0))}
            className="w-24"
          />
        </div>

        <div>
          <Label htmlFor="budget" className="font-medium">
            Hourly LLM budget (USD)
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Empire OS will skip skill runs once this is exceeded; resets every hour.
          </p>
          <Input
            id="budget"
            type="number"
            min={0}
            max={1000}
            step="0.5"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value || 0))}
            className="w-32"
          />
        </div>
      </Card>

      <Card className="p-5 bg-background/60 border-white/10">
        <h3 className="font-medium mb-2">Allowed recommendation types</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Empire OS will only auto-execute the types you check.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REC_TYPES.map((t) => (
            <label
              key={t.id}
              className="flex items-start gap-3 p-3 rounded-md border border-white/5 hover:border-white/10 cursor-pointer"
            >
              <Checkbox
                checked={allowedTypes.includes(t.id)}
                onCheckedChange={() => toggleType(t.id)}
              />
              <div>
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card className="p-5 bg-background/60 border-white/10">
        <h3 className="font-medium mb-2">Events to listen for</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Disable events you don&apos;t want Empire OS to react to (e.g. to silence monthly reviews).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {eventOptions.map((ev) => (
            <label key={ev} className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={enabledEvents.includes(ev)}
                onCheckedChange={() => toggleEvent(ev)}
              />
              <code className="text-xs font-mono">{ev}</code>
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save settings
        </Button>
      </div>
    </div>
  );
}
