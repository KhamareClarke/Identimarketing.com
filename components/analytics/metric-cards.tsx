'use client';

import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Minus, Target, TrendingUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { MetricCard } from '@/lib/analytics/metrics-processor';

export interface MetricCardsProps {
  cards: MetricCard[];
}

function trendIcon(card: MetricCard) {
  if (card.trend.direction === 'flat') return Minus;
  if (card.trend.direction === 'up') return ArrowUpRight;
  return ArrowDownRight;
}

function trendColor(card: MetricCard): string {
  if (card.trendQuality === 'good') return 'text-emerald-400';
  if (card.trendQuality === 'bad') return 'text-red-400';
  return 'text-muted-foreground';
}

function performanceBadge(card: MetricCard) {
  if (!card.performance) return null;
  if (card.performance === 'exceeded') {
    return (
      <Badge variant="default" className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Exceeded target
      </Badge>
    );
  }
  if (card.performance === 'on_track') {
    return (
      <Badge variant="outline" className="border-sky-500/30 text-sky-300">
        <Target className="w-3 h-3 mr-1" />
        On track
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-500/30 text-amber-300">
      <ArrowRight className="w-3 h-3 mr-1" />
      Behind
    </Badge>
  );
}

export function MetricCards({ cards }: MetricCardsProps) {
  if (cards.length === 0) {
    return (
      <Card className="p-6 bg-background/60 border-white/10 text-center">
        <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <h3 className="font-medium mb-1">No metrics recorded yet</h3>
        <p className="text-sm text-muted-foreground">
          Use <code className="text-xs">POST /api/projects/[id]/metrics</code> or paste data into the analytics
          uploader to start tracking results.
        </p>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Trend = trendIcon(card);
        const color = trendColor(card);
        const pct = card.pctOfTarget ?? null;
        const progressValue = pct == null ? null : Math.min(100, Math.max(0, pct));
        return (
          <Card key={card.type} className="p-5 bg-background/60 border-white/10 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold mt-1">{card.formattedValue}</p>
              </div>
              <div className={`flex items-center text-xs font-medium ${color}`}>
                <Trend className="w-4 h-4 mr-0.5" />
                {card.trend.direction === 'flat' ? 'Flat' : `${Math.abs(card.trend.changePct).toFixed(1)}%`}
              </div>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>
            {card.formattedTarget && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Target {card.formattedTarget}
                  </span>
                  {pct != null && (
                    <span className={color}>{pct}%</span>
                  )}
                </div>
                {progressValue != null && <Progress value={progressValue} className="h-1.5" />}
              </div>
            )}
            <div className="flex items-center justify-between">
              {performanceBadge(card)}
              <span className="text-[11px] text-muted-foreground">
                {card.trend.samples} sample{card.trend.samples === 1 ? '' : 's'}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
