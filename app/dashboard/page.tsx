import { requireUser } from '@/lib/auth/middleware';
import {
  getDashboardSummary,
  getRecentActivity,
  getRevenueTrend,
  getServiceBreakdown,
  listClients,
  listProjects,
  getProfile,
} from '@/lib/db/queries';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { DashboardCharts } from '@/components/dashboard/charts';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Alerts, type DashboardAlert } from '@/components/dashboard/alerts';
import type { Project } from '@/lib/db/types';

function computeAlerts(projects: Project[]): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const today = new Date();
  for (const p of projects) {
    const budget = Number(p.budget || 0);
    const spent = Number(p.spent || 0);
    if (budget > 0 && spent / budget >= 0.85) {
      const pct = Math.round((spent / budget) * 100);
      alerts.push({
        id: `${p.id}-budget`,
        kind: 'budget',
        severity: spent >= budget ? 'danger' : 'warning',
        title: `${p.name}: ${pct}% of budget used`,
        message: spent >= budget ? 'Over budget. Review immediately.' : 'Approaching budget cap.',
        href: `/dashboard/projects/${p.id}`,
      });
    }
    if (p.end_date && p.status !== 'completed' && p.status !== 'closed') {
      const end = new Date(p.end_date);
      const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 7 && days >= 0) {
        alerts.push({
          id: `${p.id}-deadline`,
          kind: 'deadline',
          severity: days <= 2 ? 'danger' : 'warning',
          title: `${p.name}: due in ${days} day${days === 1 ? '' : 's'}`,
          date: p.end_date,
          href: `/dashboard/projects/${p.id}`,
        });
      } else if (days < 0) {
        alerts.push({
          id: `${p.id}-overdue`,
          kind: 'deadline',
          severity: 'danger',
          title: `${p.name} is overdue`,
          message: `End date was ${Math.abs(days)} day${days === -1 ? '' : 's'} ago.`,
          date: p.end_date,
          href: `/dashboard/projects/${p.id}`,
        });
      }
    }
  }
  return alerts.slice(0, 8);
}

export default async function DashboardPage() {
  const { user, supabase } = await requireUser();

  const [profile, summary, revenueTrend, serviceBreakdown, clients, projects, activity] = await Promise.all([
    getProfile(supabase, user.id),
    getDashboardSummary(supabase, user.id),
    getRevenueTrend(supabase, user.id, 90),
    getServiceBreakdown(supabase, user.id),
    listClients(supabase, user.id),
    listProjects(supabase, user.id),
    getRecentActivity(supabase, user.id, 10),
  ]);

  const clientStatusBreakdown = ['lead', 'active', 'paused', 'churned'].map((status) => ({
    status,
    count: clients.filter((c) => c.status === status).length,
  })).filter((row) => row.count > 0);

  const alerts = computeAlerts(projects);
  const displayName = profile?.name || user.email?.split('@')[0] || 'there';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {displayName}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s how your agency is performing.</p>
      </div>

      <KpiCards
        clientsActive={summary.clients_active}
        projectsActive={summary.projects_active}
        revenueTotal={summary.revenue_total}
        teamActive={summary.team_members_active}
        revenueLast30={summary.revenue_last_30_days}
      />

      <DashboardCharts
        revenueTrend={revenueTrend}
        serviceBreakdown={serviceBreakdown}
        clientStatusBreakdown={clientStatusBreakdown}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActivityFeed items={activity} />
        </div>
        <div>
          <Alerts items={alerts} />
        </div>
      </div>
    </div>
  );
}
