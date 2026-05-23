// =====================================================================
// Identimarketing SaaS - lib/analytics/metrics-processor.ts
//
// Service-type-aware metric catalog. Tells the analytics layer:
//   - Which metric_types matter for each service ("seo", "content", ...)
//   - How to label and format them in the UI / report
//   - Whether "up" or "down" is the desired direction
//   - A sensible default daily target (used until the agency sets a
//     custom target in project_metric_targets)
// =====================================================================

import type { ProcessedSeries } from './metrics';

export type MetricFormat = 'integer' | 'decimal' | 'percent' | 'currency' | 'duration' | 'rank';
export type MetricDirection = 'up' | 'down';
export type ServiceKey = 'seo' | 'content' | 'ads' | 'social' | 'email' | 'cro' | 'design' | 'growth';

export interface MetricDefinition {
  type: string;            // metric_type as stored in project_metrics
  label: string;           // human-friendly name
  description: string;
  format: MetricFormat;
  direction: MetricDirection;
  defaultTarget?: number;  // per-period target (e.g. monthly)
  unit?: string;
}

const SEO_METRICS: MetricDefinition[] = [
  {
    type: 'organic_traffic',
    label: 'Organic Traffic',
    description: 'Sessions from organic search.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 5000,
  },
  {
    type: 'keyword_rankings',
    label: 'Keywords Tracked',
    description: 'Keywords ranking on page 1 of Google.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 50,
  },
  {
    type: 'avg_keyword_position',
    label: 'Avg. Position',
    description: 'Average ranking across tracked keywords (lower is better).',
    format: 'rank',
    direction: 'down',
    defaultTarget: 10,
  },
  {
    type: 'backlinks_gained',
    label: 'Backlinks Gained',
    description: 'New referring domains in the period.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 10,
  },
  {
    type: 'domain_authority',
    label: 'Domain Authority',
    description: 'Moz Domain Authority score.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 40,
  },
  {
    type: 'search_clicks',
    label: 'Search Clicks',
    description: 'Clicks from search (GSC).',
    format: 'integer',
    direction: 'up',
    defaultTarget: 3000,
  },
];

const CONTENT_METRICS: MetricDefinition[] = [
  {
    type: 'articles_published',
    label: 'Articles Published',
    description: 'New articles shipped in the period.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 8,
  },
  {
    type: 'page_views',
    label: 'Page Views',
    description: 'Total page views.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 10000,
  },
  {
    type: 'time_on_page_seconds',
    label: 'Time on Page',
    description: 'Average time on page.',
    format: 'duration',
    direction: 'up',
    defaultTarget: 120,
    unit: 's',
  },
  {
    type: 'engagement_rate',
    label: 'Engagement Rate',
    description: 'GA4 engagement rate.',
    format: 'percent',
    direction: 'up',
    defaultTarget: 55,
  },
  {
    type: 'social_shares',
    label: 'Social Shares',
    description: 'Shares + backlinks earned by content.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 50,
  },
];

const ADS_METRICS: MetricDefinition[] = [
  {
    type: 'impressions',
    label: 'Impressions',
    description: 'Total ad impressions.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 100000,
  },
  {
    type: 'clicks',
    label: 'Clicks',
    description: 'Total ad clicks.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 2000,
  },
  {
    type: 'conversions',
    label: 'Conversions',
    description: 'Tracked conversions from paid traffic.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 100,
  },
  {
    type: 'cost_per_click',
    label: 'Cost per Click',
    description: 'Average CPC (lower is better).',
    format: 'currency',
    direction: 'down',
    defaultTarget: 1.5,
  },
  {
    type: 'return_on_ad_spend',
    label: 'ROAS',
    description: 'Revenue / ad spend.',
    format: 'decimal',
    direction: 'up',
    defaultTarget: 3,
  },
  {
    type: 'ad_spend',
    label: 'Ad Spend',
    description: 'Total spend in the period.',
    format: 'currency',
    direction: 'down',
  },
];

const SOCIAL_METRICS: MetricDefinition[] = [
  {
    type: 'followers_gained',
    label: 'Followers Gained',
    description: 'Net follower growth.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 500,
  },
  {
    type: 'engagement_rate',
    label: 'Engagement Rate',
    description: 'Avg. engagement rate per post.',
    format: 'percent',
    direction: 'up',
    defaultTarget: 4,
  },
  {
    type: 'reach',
    label: 'Reach',
    description: 'Unique accounts reached.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 50000,
  },
  {
    type: 'social_conversions',
    label: 'Social Conversions',
    description: 'Conversions attributed to social.',
    format: 'integer',
    direction: 'up',
    defaultTarget: 25,
  },
];

const EMAIL_METRICS: MetricDefinition[] = [
  {
    type: 'emails_sent',
    label: 'Emails Sent',
    description: 'Total emails delivered.',
    format: 'integer',
    direction: 'up',
  },
  {
    type: 'open_rate',
    label: 'Open Rate',
    description: 'Open rate.',
    format: 'percent',
    direction: 'up',
    defaultTarget: 35,
  },
  {
    type: 'click_through_rate',
    label: 'CTR',
    description: 'Click-through rate.',
    format: 'percent',
    direction: 'up',
    defaultTarget: 5,
  },
  {
    type: 'unsubscribe_rate',
    label: 'Unsub Rate',
    description: 'Unsubscribe rate.',
    format: 'percent',
    direction: 'down',
    defaultTarget: 0.5,
  },
];

const CRO_METRICS: MetricDefinition[] = [
  {
    type: 'conversion_rate',
    label: 'Conversion Rate',
    description: 'Site-wide conversion rate.',
    format: 'percent',
    direction: 'up',
    defaultTarget: 3,
  },
  {
    type: 'bounce_rate',
    label: 'Bounce Rate',
    description: 'Site-wide bounce rate.',
    format: 'percent',
    direction: 'down',
    defaultTarget: 40,
  },
  {
    type: 'page_speed_seconds',
    label: 'Page Speed',
    description: 'Largest Contentful Paint.',
    format: 'decimal',
    direction: 'down',
    defaultTarget: 2.5,
    unit: 's',
  },
];

const CATALOG: Record<ServiceKey, MetricDefinition[]> = {
  seo: SEO_METRICS,
  content: CONTENT_METRICS,
  ads: ADS_METRICS,
  social: SOCIAL_METRICS,
  email: EMAIL_METRICS,
  cro: CRO_METRICS,
  design: CONTENT_METRICS,
  growth: SOCIAL_METRICS,
};

export function resolveServiceKey(serviceType: string | null | undefined): ServiceKey {
  if (!serviceType) return 'content';
  const slug = serviceType.toLowerCase().replace(/[^a-z]/g, '_');
  for (const key of Object.keys(CATALOG) as ServiceKey[]) {
    if (slug.startsWith(key) || slug.includes(key)) return key;
  }
  return 'content';
}

export function getMetricCatalog(serviceType: string | null | undefined): MetricDefinition[] {
  return CATALOG[resolveServiceKey(serviceType)];
}

export function findMetricDefinition(
  metricType: string,
  serviceType?: string | null,
): MetricDefinition | undefined {
  if (serviceType) {
    const list = getMetricCatalog(serviceType);
    const direct = list.find((m) => m.type === metricType);
    if (direct) return direct;
  }
  for (const list of Object.values(CATALOG)) {
    const found = list.find((m) => m.type === metricType);
    if (found) return found;
  }
  return undefined;
}

// ---------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------
const NUMBER_FORMATTER = new Intl.NumberFormat('en-GB');
const CURRENCY_FORMATTER = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
});

export function formatMetricValue(value: number, format: MetricFormat, unit?: string): string {
  if (!Number.isFinite(value)) return '\u2014';
  switch (format) {
    case 'integer':
      return NUMBER_FORMATTER.format(Math.round(value));
    case 'decimal':
      return value.toFixed(2);
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return CURRENCY_FORMATTER.format(value);
    case 'duration':
      return unit === 's' && value >= 60
        ? `${Math.floor(value / 60)}m ${Math.round(value % 60)}s`
        : `${Math.round(value)}${unit ?? 's'}`;
    case 'rank':
      return `#${value.toFixed(1)}`;
    default:
      return String(value);
  }
}

// ---------------------------------------------------------------------
// Processed series + catalog -> "metric card" shape used by both
// the analytics dashboard and the PDF report.
// ---------------------------------------------------------------------
export interface MetricCard {
  type: string;
  label: string;
  description: string;
  value: number;
  formattedValue: string;
  format: MetricFormat;
  desiredDirection: MetricDirection;
  trend: ProcessedSeries['trend'];
  /** "good" if the trend is in the desired direction, "bad" if reversed. */
  trendQuality: 'good' | 'bad' | 'neutral';
  target?: number | null;
  formattedTarget?: string | null;
  pctOfTarget?: number | null;
  performance?: 'on_track' | 'behind' | 'exceeded' | null;
}

function classifyTrend(
  trend: ProcessedSeries['trend'],
  desired: MetricDirection,
): MetricCard['trendQuality'] {
  if (trend.direction === 'flat') return 'neutral';
  if (desired === 'up') return trend.direction === 'up' ? 'good' : 'bad';
  return trend.direction === 'down' ? 'good' : 'bad';
}

function classifyPerformance(
  pct: number | null | undefined,
  desired: MetricDirection,
): MetricCard['performance'] {
  if (pct == null) return null;
  if (desired === 'up') {
    if (pct >= 100) return 'exceeded';
    if (pct >= 75) return 'on_track';
    return 'behind';
  }
  // for "down" metrics: lower is better, so pctOfTarget < 100 means we are
  // below the target threshold and doing well.
  if (pct <= 100) return pct < 75 ? 'exceeded' : 'on_track';
  return 'behind';
}

export interface BuildCardsOptions {
  serviceType: string | null | undefined;
  series: ProcessedSeries[];
}

export function buildMetricCards({ serviceType, series }: BuildCardsOptions): MetricCard[] {
  const cards: MetricCard[] = [];
  const seriesByType = new Map(series.map((s) => [s.metricType, s]));
  const catalog = getMetricCatalog(serviceType);

  for (const def of catalog) {
    const s = seriesByType.get(def.type);
    const latest = s?.latest ?? 0;
    const target = s?.target?.target_value ?? def.defaultTarget ?? null;
    const direction = (s?.target?.direction as MetricDirection | undefined) ?? def.direction;
    const pctOfTarget =
      target && target !== 0 ? Math.round((latest / target) * 100) : null;
    const trend = s?.trend ?? {
      direction: 'flat' as const,
      changePct: 0,
      currentAvg: 0,
      previousAvg: 0,
      delta: 0,
      samples: 0,
    };
    cards.push({
      type: def.type,
      label: def.label,
      description: def.description,
      value: latest,
      formattedValue: formatMetricValue(latest, def.format, def.unit),
      format: def.format,
      desiredDirection: direction,
      trend,
      trendQuality: classifyTrend(trend, direction),
      target,
      formattedTarget: target != null ? formatMetricValue(target, def.format, def.unit) : null,
      pctOfTarget,
      performance: classifyPerformance(pctOfTarget, direction),
    });
  }

  // Bring in any metric_types stored in the DB that aren't in the catalog
  // (custom KPIs entered by the agency).
  for (const s of series) {
    if (cards.find((c) => c.type === s.metricType)) continue;
    const fallback: MetricDefinition = {
      type: s.metricType,
      label: s.metricType.replace(/_/g, ' '),
      description: 'Custom metric.',
      format: 'integer',
      direction: 'up',
    };
    cards.push({
      type: fallback.type,
      label: fallback.label.replace(/\b\w/g, (c) => c.toUpperCase()),
      description: fallback.description,
      value: s.latest,
      formattedValue: formatMetricValue(s.latest, fallback.format),
      format: fallback.format,
      desiredDirection: fallback.direction,
      trend: s.trend,
      trendQuality: classifyTrend(s.trend, fallback.direction),
      target: s.target?.target_value ?? null,
      formattedTarget:
        s.target?.target_value != null
          ? formatMetricValue(s.target.target_value, fallback.format)
          : null,
      pctOfTarget: s.pctOfTarget ?? null,
      performance: classifyPerformance(s.pctOfTarget ?? null, fallback.direction),
    });
  }

  return cards;
}
