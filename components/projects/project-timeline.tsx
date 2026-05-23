import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { Deliverable, Project } from '@/lib/db/types';
import { Calendar, Flag, FileText } from 'lucide-react';

export interface ProjectTimelineProps {
  project: Project;
  deliverables: Deliverable[];
}

interface Milestone {
  date: string;
  label: string;
  kind: 'project_start' | 'project_end' | 'deliverable';
  status?: string;
}

export function ProjectTimeline({ project, deliverables }: ProjectTimelineProps) {
  const milestones: Milestone[] = [];
  if (project.start_date) milestones.push({ date: project.start_date, label: 'Project kickoff', kind: 'project_start' });
  if (project.end_date) milestones.push({ date: project.end_date, label: 'Project end', kind: 'project_end' });
  for (const d of deliverables) {
    if (d.due_date) {
      milestones.push({ date: d.due_date, label: d.name, kind: 'deliverable', status: d.status });
    }
  }
  milestones.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card className="p-5 bg-background/60 border-white/10">
      <h2 className="font-semibold mb-4">Timeline</h2>
      {milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No dates set yet.</p>
      ) : (
        <ol className="relative border-l border-white/10 ml-3 space-y-5">
          {milestones.map((m, i) => {
            const Icon = m.kind === 'project_start' ? Flag : m.kind === 'project_end' ? Calendar : FileText;
            return (
              <li key={i} className="ml-6">
                <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(m.date)}
                  {m.status && <span className="capitalize"> &middot; {m.status.replace('_', ' ')}</span>}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
