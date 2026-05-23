import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, FileBarChart, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MetricCards } from '@/components/analytics/metric-cards';
import { TrendCharts } from '@/components/analytics/trend-charts';
import { getProjectMetrics, type DateRangePreset } from '@/lib/analytics/metrics';
import { buildMetricCards, resolveServiceKey } from '@/lib/analytics/metrics-processor';
import { requireUser } from '@/lib/auth/middleware';
import { getProject } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
  searchParams: { range?: string; from?: string; to?: string };
}

const RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '60d', label: '60d' },
  { value: '90d', label: '90d' },
  { value: '180d', label: '6mo' },
  { value: '365d', label: '1y' },
];

function pickRange(raw: string | undefined): DateRangePreset {
  const valid = RANGE_OPTIONS.map((r) => r.value) as readonly string[];
  return valid.includes(raw ?? '') ? (raw as DateRangePreset) : '30d';
}

export default async function ProjectAnalyticsPage({ params, searchParams }: PageProps) {
  const { user, supabase } = await requireUser();
  const project = await getProject(supabase, params.id);
  if (!project) notFound();
  if (project.user_id !== user.id) notFound();

  const range =
    searchParams?.from && searchParams?.to
      ? { from: searchParams.from, to: searchParams.to }
      : pickRange(searchParams?.range);

  const result = await getProjectMetrics(supabase, { projectId: project.id, range });
  const cards = buildMetricCards({ serviceType: project.service_type, series: result.series });
  const serviceKey = resolveServiceKey(project.service_type);

  const cardsWithTargets = cards.filter((c) => c.target != null);
  const onTrack = cardsWithTargets.filter((c) => c.performance === 'on_track' || c.performance === 'exceeded').length;
  const totalWithTargets = cardsWithTargets.length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" /> Back to project
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileBarChart className="w-6 h-6 text-primary" />
              Analytics
            </h1>
            <Badge variant="secondary" className="capitalize">{serviceKey}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {project.name}
            {project.client && ` \u00b7 ${project.client.company_name}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex border border-white/10 rounded-md overflow-hidden">
            {RANGE_OPTIONS.map((r) => {
              const isActive =
                typeof range === 'string' ? range === r.value : false;
              return (
                <Link
                  key={r.value}
                  href={`/dashboard/projects/${project.id}/analytics?range=${r.value}`}
                  className={`px-3 py-1.5 text-xs ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-white/5'
                  }`}
                >
                  {r.label}
                </Link>
              );
            })}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/reports?projectId=${project.id}`}>
              <FileText className="w-4 h-4 mr-1" />
              Reports
            </Link>
          </Button>
        </div>
      </div>

      {totalWithTargets > 0 && (
        <Card className="p-4 bg-background/60 border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Performance vs targets</p>
            <p className="text-lg font-semibold">
              {onTrack} of {totalWithTargets} on track
            </p>
          </div>
          <Badge
            variant={onTrack === totalWithTargets ? 'default' : 'outline'}
            className={onTrack === totalWithTargets ? 'bg-emerald-500/20 text-emerald-300' : ''}
          >
            {result.from} \u2192 {result.to}
          </Badge>
        </Card>
      )}

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Key metrics</h2>
        <MetricCards cards={cards} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Trends</h2>
        <TrendCharts series={result.series} cards={cards} serviceType={project.service_type} />
      </section>
    </div>
  );
}
