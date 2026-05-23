import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Edit, FileText } from 'lucide-react';

import { requireUser } from '@/lib/auth/middleware';
import { getProject, listDeliverables } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProjectTimeline } from '@/components/projects/project-timeline';
import { DeliverablesList } from '@/components/projects/deliverables-list';
import { formatCurrency, formatDate } from '@/lib/utils';

export const metadata = { title: 'Project' };

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  planning: 'outline',
  active: 'default',
  in_review: 'secondary',
  completed: 'default',
  closed: 'secondary',
  cancelled: 'destructive',
};

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireUser();
  const [project, deliverables] = await Promise.all([
    getProject(supabase, params.id),
    listDeliverables(supabase, params.id),
  ]);
  if (!project) notFound();

  const completed = deliverables.filter((d) => d.status === 'completed' || d.status === 'approved').length;
  const progress = deliverables.length > 0 ? Math.round((completed / deliverables.length) * 100) : 0;
  const budgetPct = Number(project.budget) > 0 ? Math.min(100, Math.round((Number(project.spent) / Number(project.budget)) * 100)) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4" /> All projects
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant={STATUS_VARIANT[project.status]} className="capitalize">
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          {project.client && (
            <p className="text-sm text-muted-foreground mt-1">
              For{' '}
              <Link href={`/dashboard/clients/${project.client.id}`} className="text-primary hover:underline">
                {project.client.company_name}
              </Link>
            </p>
          )}
        </div>
        <Link href={`/dashboard/projects/${project.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-background/60 border-white/10">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Budget</div>
          <div className="text-lg font-semibold mt-1">{formatCurrency(project.budget)}</div>
          <div className="h-1.5 mt-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full ${budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 85 ? 'bg-amber-500' : 'bg-primary'}`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{formatCurrency(project.spent)} spent ({budgetPct}%)</div>
        </Card>
        <Card className="p-4 bg-background/60 border-white/10">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Progress</div>
          <div className="text-lg font-semibold mt-1">{progress}%</div>
          <div className="h-1.5 mt-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-green-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{completed} of {deliverables.length} deliverables</div>
        </Card>
        <Card className="p-4 bg-background/60 border-white/10">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Start</div>
          <div className="text-lg font-semibold mt-1">{formatDate(project.start_date)}</div>
        </Card>
        <Card className="p-4 bg-background/60 border-white/10">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">End</div>
          <div className="text-lg font-semibold mt-1">{formatDate(project.end_date)}</div>
        </Card>
      </div>

      {project.description && (
        <Card className="p-5 bg-background/60 border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold">Description</h2>
          </div>
          <p className="text-sm whitespace-pre-wrap text-muted-foreground">{project.description}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DeliverablesList projectId={project.id} deliverables={deliverables} />
        </div>
        <div>
          <ProjectTimeline project={project} deliverables={deliverables} />
        </div>
      </div>
    </div>
  );
}
