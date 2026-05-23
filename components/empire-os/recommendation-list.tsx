'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Loader2, RefreshCw, Search, Sparkles } from 'lucide-react';

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
import type { EmpireOSSuggestion } from '@/lib/db/types';

import { RecommendationCard } from './recommendation-card';

export interface ScoredRec extends EmpireOSSuggestion {
  composite_score?: number;
}

export interface ProjectOption {
  id: string;
  name: string;
}

export interface RecommendationListProps {
  recommendations: ScoredRec[];
  projects: ProjectOption[];
  /** Project currently filtered to (if any). */
  activeProjectId?: string | null;
}

const SKILL_PLACEHOLDER = 'all';

export function RecommendationList({
  recommendations,
  projects,
  activeProjectId,
}: RecommendationListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState(SKILL_PLACEHOLDER);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all' | 'approved' | 'declined'>('pending');
  const [refreshing, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const skills = useMemo(() => {
    const set = new Set<string>();
    for (const r of recommendations) set.add(r.skill_name);
    return Array.from(set).sort();
  }, [recommendations]);

  const filtered = useMemo(() => {
    return recommendations.filter((r) => {
      if (skillFilter !== SKILL_PLACEHOLDER && r.skill_name !== skillFilter) return false;
      if (statusFilter === 'pending' && (r.status === 'applied' || r.status === 'approved' || r.status === 'declined'))
        return false;
      if (statusFilter !== 'all' && statusFilter !== 'pending' && r.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const needle = search.toLowerCase();
      return (
        (r.title || '').toLowerCase().includes(needle) ||
        r.suggestion_text.toLowerCase().includes(needle) ||
        r.skill_name.toLowerCase().includes(needle)
      );
    });
  }, [recommendations, search, skillFilter, statusFilter]);

  async function rerun(): Promise<void> {
    if (!activeProjectId) {
      toast({
        title: 'Select a project',
        description: 'Pick a project from the filter before re-running analysis.',
      });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/empire-os/recommendations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ projectId: activeProjectId }),
      });
      const json: { error?: { message?: string }; recommendations?: ScoredRec[] } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message || 'Re-run failed');
      toast({
        title: 'Analysis complete',
        description: `${json.recommendations?.length ?? 0} recommendations generated.`,
      });
      startTransition(() => router.refresh());
    } catch (err) {
      toast({
        title: 'Re-run failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  }

  function onProjectChange(id: string): void {
    const url = new URL(window.location.href);
    if (id === SKILL_PLACEHOLDER) url.searchParams.delete('projectId');
    else url.searchParams.set('projectId', id);
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recommendations..."
            className="pl-8"
          />
        </div>

        <Select value={activeProjectId ?? SKILL_PLACEHOLDER} onValueChange={onProjectChange}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SKILL_PLACEHOLDER}>All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={skillFilter} onValueChange={setSkillFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All skills" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SKILL_PLACEHOLDER}>All skills</SelectItem>
            {skills.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Pending" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" onClick={rerun} disabled={busy || refreshing}>
          {busy || refreshing ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1" />
          )}
          Re-run analysis
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-white/10 rounded-lg p-10 text-center bg-background/40">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium mb-1">No recommendations yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {activeProjectId
              ? 'Click \u201cRe-run analysis\u201d to have Empire OS analyze this project.'
              : 'Add a project and Empire OS will start generating recommendations automatically.'}
          </p>
          {activeProjectId && (
            <Button type="button" onClick={rerun} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Filter className="w-4 h-4 mr-1" />}
              Generate recommendations
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
