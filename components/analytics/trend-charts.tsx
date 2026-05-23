'use client';

import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';

import { Card } from '@/components/ui/card';
import type { ProcessedSeries } from '@/lib/analytics/metrics';
import { findMetricDefinition, formatMetricValue, type MetricCard } from '@/lib/analytics/metrics-processor';

export interface TrendChartsProps {
  series: ProcessedSeries[];
  cards: MetricCard[];
  serviceType: string | null;
}

const LINE_COLORS = ['#1E40AF', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];

function tickFormatter(value: number, type: string, serviceType: string | null): string {
  const def = findMetricDefinition(type, serviceType);
  return def ? formatMetricValue(value, def.format, def.unit) : String(Math.round(value));
}

export function TrendCharts({ series, cards, serviceType }: TrendChartsProps) {
  const charts = useMemo(
    () =>
      series
        .filter((s) => s.points.length > 0)
        .map((s, idx) => {
          const card = cards.find((c) => c.type === s.metricType);
          const def = findMetricDefinition(s.metricType, serviceType);
          return {
            series: s,
            card,
            def,
            color: LINE_COLORS[idx % LINE_COLORS.length]!,
          };
        }),
    [series, cards, serviceType],
  );

  if (charts.length === 0) {
    return (
      <Card className="p-6 bg-background/60 border-white/10 text-center text-sm text-muted-foreground">
        No trend data in this date range.
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {charts.map(({ series: s, card, def, color }) => (
        <Card key={s.metricType} className="p-5 bg-background/60 border-white/10">
          <div className="mb-3">
            <h3 className="font-semibold">{card?.label ?? def?.label ?? s.metricType}</h3>
            <p className="text-xs text-muted-foreground">
              {def?.description ?? 'Trend over the selected period.'}
            </p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={s.points} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }}
                  width={60}
                  tickFormatter={(v) => tickFormatter(Number(v), s.metricType, serviceType)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: 'rgb(226, 232, 240)' }}
                  formatter={(value: number) => [
                    tickFormatter(Number(value), s.metricType, serviceType),
                    card?.label ?? s.metricType,
                  ]}
                />
                {card?.target != null && (
                  <ReferenceLine
                    y={card.target}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Target',
                      position: 'right',
                      fill: '#f59e0b',
                      fontSize: 10,
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ))}
    </div>
  );
}
