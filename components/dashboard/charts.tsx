'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

const PIE_COLORS = ['#1E40AF', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

export interface ChartsProps {
  revenueTrend: { date: string; revenue: number }[];
  serviceBreakdown: { service: string; count: number; revenue: number }[];
  clientStatusBreakdown: { status: string; count: number }[];
}

export function DashboardCharts({ revenueTrend, serviceBreakdown, clientStatusBreakdown }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Revenue trend - spans 2 cols */}
      <Card className="lg:col-span-2 p-5 bg-background/60 border-white/10">
        <div className="mb-4">
          <h3 className="font-semibold">Revenue trend</h3>
          <p className="text-xs text-muted-foreground">Last 90 days</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1E40AF" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#1E40AF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }} width={70} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ background: 'rgb(15, 23, 42)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#1E40AF" strokeWidth={2} fill="url(#revFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Clients by status (pie) */}
      <Card className="p-5 bg-background/60 border-white/10">
        <div className="mb-4">
          <h3 className="font-semibold">Clients by status</h3>
          <p className="text-xs text-muted-foreground">Snapshot</p>
        </div>
        <div className="h-64">
          {clientStatusBreakdown.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No clients yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={clientStatusBreakdown} dataKey="count" nameKey="status" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {clientStatusBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgb(15, 23, 42)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-3 space-y-1.5 text-xs">
          {clientStatusBreakdown.map((row, idx) => (
            <div key={row.status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="capitalize text-muted-foreground">{row.status}</span>
              </div>
              <span className="font-medium">{row.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Revenue by service - full width below */}
      <Card className="lg:col-span-3 p-5 bg-background/60 border-white/10">
        <div className="mb-4">
          <h3 className="font-semibold">Revenue by service</h3>
          <p className="text-xs text-muted-foreground">Lifetime</p>
        </div>
        <div className="h-64">
          {serviceBreakdown.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No project data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="service" tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }} width={70} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{
                    background: 'rgb(15, 23, 42)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="revenue" fill="#1E40AF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}
