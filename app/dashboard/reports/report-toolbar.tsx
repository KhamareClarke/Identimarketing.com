'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FilePlus, Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const RANGE_OPTIONS = [
  { value: '30d', label: 'Last 30 days' },
  { value: '60d', label: 'Last 60 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '180d', label: 'Last 6 months' },
  { value: '365d', label: 'Last 12 months' },
] as const;

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'html', label: 'HTML' },
] as const;

const ALL = 'all';

export interface ReportToolbarProps {
  projects: { id: string; name: string }[];
  activeProjectId: string | null;
  initialQuery: string;
}

export function ReportToolbar({ projects, activeProjectId, initialQuery }: ReportToolbarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState(initialQuery);
  const [projectId, setProjectId] = useState(activeProjectId ?? ALL);
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]['value']>('30d');
  const [format, setFormat] = useState<(typeof FORMAT_OPTIONS)[number]['value']>('pdf');
  const [busy, setBusy] = useState(false);

  function pushState(opts: { projectId?: string; q?: string }): void {
    const params = new URLSearchParams();
    const pid = opts.projectId ?? projectId;
    const q = opts.q ?? query;
    if (pid && pid !== ALL) params.set('projectId', pid);
    if (q) params.set('q', q);
    const qs = params.toString();
    router.push(qs ? `/dashboard/reports?${qs}` : '/dashboard/reports');
  }

  async function generate(): Promise<void> {
    if (projectId === ALL) {
      toast({
        title: 'Pick a project',
        description: 'Select a project before generating a report.',
      });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          projectId,
          format,
          range,
          download: false,
        }),
      });
      if (!res.ok) {
        const json: { error?: { message?: string } } = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || 'Generation failed');
      }
      toast({ title: 'Report generated' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Could not generate report',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row md:items-center md:flex-wrap gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => pushState({ q: query })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') pushState({ q: query });
          }}
          placeholder="Search reports..."
          className="pl-8"
        />
      </div>

      <Select
        value={projectId}
        onValueChange={(v) => {
          setProjectId(v);
          pushState({ projectId: v });
        }}
      >
        <SelectTrigger className="w-full md:w-60">
          <SelectValue placeholder="All projects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All projects</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
        <SelectTrigger className="w-full md:w-44">
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          {RANGE_OPTIONS.map((r) => (
            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
        <SelectTrigger className="w-full md:w-28">
          <SelectValue placeholder="Format" />
        </SelectTrigger>
        <SelectContent>
          {FORMAT_OPTIONS.map((f) => (
            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={generate} disabled={busy}>
        {busy ? (
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
        ) : (
          <FilePlus className="w-4 h-4 mr-1" />
        )}
        Generate report
      </Button>
    </div>
  );
}
