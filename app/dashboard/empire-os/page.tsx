import Link from 'next/link';
import { Settings2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecommendationList } from '@/components/empire-os/recommendation-list';
import { requireUser } from '@/lib/auth/middleware';
import { listProjects } from '@/lib/db/queries';
import { analyzeProject, analyzeUserRecommendations } from '@/lib/empire-os/recommender';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { projectId?: string };
}

export default async function EmpireOsDashboardPage({ searchParams }: PageProps) {
  const { user, supabase } = await requireUser();
  const projects = await listProjects(supabase, user.id);
  const activeProjectId =
    searchParams?.projectId && projects.some((p) => p.id === searchParams.projectId)
      ? searchParams.projectId
      : null;

  const recommendations = activeProjectId
    ? await analyzeProject(supabase, { projectId: activeProjectId, limit: 30 })
    : await analyzeUserRecommendations(supabase, { userId: user.id, limit: 30 });

  const totals = {
    total: recommendations.length,
    pending: recommendations.filter((r) => r.status === 'pending').length,
    autoExecutable: recommendations.filter((r) => r.auto_executable && r.status === 'pending').length,
    estimatedValue: recommendations
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + Number(r.estimated_value || 0), 0),
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Empire OS
          </h1>
          <p className="text-sm text-muted-foreground">
            AI marketing strategist running 30 skills across your portfolio.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/empire-os/settings">
            <Settings2 className="w-4 h-4 mr-1" />
            Settings
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 bg-background/60 border-white/10">
          <p className="text-xs text-muted-foreground">Total recommendations</p>
          <p className="text-2xl font-bold mt-1">{totals.total}</p>
        </Card>
        <Card className="p-4 bg-background/60 border-white/10">
          <p className="text-xs text-muted-foreground">Pending review</p>
          <p className="text-2xl font-bold mt-1 text-amber-400">{totals.pending}</p>
        </Card>
        <Card className="p-4 bg-background/60 border-white/10">
          <p className="text-xs text-muted-foreground">Auto-executable</p>
          <p className="text-2xl font-bold mt-1 text-sky-400">{totals.autoExecutable}</p>
        </Card>
        <Card className="p-4 bg-background/60 border-white/10">
          <p className="text-xs text-muted-foreground">Potential upside</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">
            $
            {totals.estimatedValue.toLocaleString('en-US', {
              maximumFractionDigits: 0,
            })}
          </p>
        </Card>
      </div>

      <RecommendationList
        recommendations={recommendations}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        activeProjectId={activeProjectId}
      />
    </div>
  );
}
