import { FileText, Sparkles } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ReportPreview } from '@/components/reports/report-preview';
import { requireUser } from '@/lib/auth/middleware';
import { listProjects } from '@/lib/db/queries';
import type { Report } from '@/lib/db/types';

import { ReportToolbar } from './report-toolbar';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { projectId?: string; q?: string };
}

async function loadReports(
  supabase: Awaited<ReturnType<typeof requireUser>>['supabase'],
  userId: string,
  filters: { projectId?: string },
): Promise<Report[]> {
  let query = supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(50);
  if (filters.projectId) query = query.eq('project_id', filters.projectId);
  const { data } = await query;
  return (data ?? []) as Report[];
}

export default async function ReportsDashboardPage({ searchParams }: PageProps) {
  const { user, supabase } = await requireUser();
  const projects = await listProjects(supabase, user.id);
  const activeProjectId =
    searchParams?.projectId && projects.some((p) => p.id === searchParams.projectId)
      ? searchParams.projectId
      : undefined;
  const reports = await loadReports(supabase, user.id, { projectId: activeProjectId });

  const searchFiltered = searchParams?.q
    ? reports.filter((r) =>
        [r.title, r.summary ?? ''].some((field) =>
          field.toLowerCase().includes(searchParams.q!.toLowerCase()),
        ),
      )
    : reports;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Client Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          PDF and HTML reports generated from project analytics, deliverables, and Empire OS recommendations.
        </p>
      </div>

      <ReportToolbar
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        activeProjectId={activeProjectId ?? null}
        initialQuery={searchParams?.q ?? ''}
      />

      {searchFiltered.length === 0 ? (
        <Card className="p-10 text-center bg-background/40 border-white/10">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-medium mb-1">No reports yet</h3>
          <p className="text-sm text-muted-foreground">
            Select a project and click <strong>Generate report</strong> above to create the first one.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {searchFiltered.map((report) => (
            <ReportPreview key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}
