// =====================================================================
// Identimarketing SaaS - lib/reports/pdf-converter.ts
//
// Renders a ReportData object to a PDF Buffer using @react-pdf/renderer.
// No headless Chrome required; works in any Node.js runtime (Vercel
// serverless, Node 20, etc).
//
// The file ends with `.ts` instead of `.tsx` because we use createElement
// directly — keeps the file usable from API routes that don't compile TSX.
// =====================================================================

import { createElement, type ReactElement } from 'react';
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

import type { ReportData } from './types';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 36,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    marginBottom: 18,
  },
  title: { fontSize: 20, fontWeight: 700 },
  subtitle: { fontSize: 11, color: '#64748b', marginTop: 2 },
  meta: { fontSize: 9, color: '#64748b', textAlign: 'right' },
  metaStrong: { fontSize: 10, color: '#0f172a', fontWeight: 700 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    paddingBottom: 2,
    alignSelf: 'flex-start',
  },
  sectionBlock: { marginBottom: 14 },
  paragraph: { lineHeight: 1.5, color: '#334155' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  metricCard: {
    width: '32%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 8,
    marginRight: '2%',
    marginBottom: 8,
  },
  metricLabel: { fontSize: 8, color: '#64748b', textTransform: 'uppercase' },
  metricValue: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  metricTrend: { fontSize: 9, marginTop: 2 },
  metricTarget: { fontSize: 8, color: '#64748b', marginTop: 2 },

  roiRow: { flexDirection: 'row', marginTop: 6 },
  roiCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 8,
    marginRight: 6,
  },
  roiLabel: { fontSize: 8, color: '#64748b', textTransform: 'uppercase' },
  roiValue: { fontSize: 12, fontWeight: 700, marginTop: 2 },

  list: { marginTop: 4 },
  listItem: { flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' },
  bullet: { width: 8, color: '#64748b' },
  listText: { flex: 1, color: '#334155' },

  recommendation: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
    backgroundColor: '#f8fafc',
  },
  recommendationTitle: { fontSize: 11, fontWeight: 700 },
  recommendationMeta: { fontSize: 8, color: '#64748b', marginTop: 4 },
  recommendationSummary: { fontSize: 9, color: '#334155', marginTop: 4, lineHeight: 1.4 },

  deliverableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
  },
  delName: { flex: 2, color: '#0f172a', fontWeight: 700 },
  delStatus: { flex: 1, color: '#475569' },
  delDate: { flex: 1, color: '#64748b' },

  footer: {
    marginTop: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
});

function formatDate(value: string | null | undefined): string {
  if (!value) return '\u2014';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '\u00a30';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}

function arrow(direction: string): string {
  if (direction === 'up') return '\u2191';
  if (direction === 'down') return '\u2193';
  return '\u2192';
}

function trendColor(quality: string): string {
  if (quality === 'good') return '#15803d';
  if (quality === 'bad') return '#b91c1c';
  return '#52525b';
}

function bulletList(items: string[]): ReactElement {
  return createElement(
    View,
    { style: styles.list },
    items.map((text, idx) =>
      createElement(
        View,
        { key: idx, style: styles.listItem },
        createElement(Text, { style: styles.bullet }, '\u2022'),
        createElement(Text, { style: styles.listText }, text),
      ),
    ),
  );
}

function buildDocument(data: ReportData): ReactElement {
  const metrics = data.metricCards.slice(0, 9).map((card, idx) =>
    createElement(
      View,
      { key: card.type, style: styles.metricCard, wrap: false },
      createElement(Text, { style: styles.metricLabel }, card.label),
      createElement(Text, { style: styles.metricValue }, card.formattedValue),
      createElement(
        Text,
        { style: [styles.metricTrend, { color: trendColor(card.trendQuality) }] },
        `${arrow(card.trend.direction)} ${Math.abs(card.trend.changePct).toFixed(1)}%`,
      ),
      card.formattedTarget
        ? createElement(
            Text,
            { style: styles.metricTarget },
            `Target ${card.formattedTarget} \u00b7 ${card.pctOfTarget ?? 0}%`,
          )
        : null,
    ),
  );

  const recommendations = data.recommendations.map((rec, idx) =>
    createElement(
      View,
      { key: idx, style: styles.recommendation, wrap: false },
      createElement(Text, { style: styles.recommendationTitle }, rec.title),
      createElement(Text, { style: styles.recommendationSummary }, rec.summary),
      rec.actionSteps.length > 0 ? bulletList(rec.actionSteps) : null,
      createElement(
        Text,
        { style: styles.recommendationMeta },
        `Confidence ${rec.confidenceScore}%${
          rec.estimatedValue != null ? ` \u00b7 Est. ${formatCurrency(rec.estimatedValue)}` : ''
        }${rec.impactScore != null ? ` \u00b7 Impact ${rec.impactScore}/100` : ''}`,
      ),
    ),
  );

  const deliverables = data.deliverables.map((d, idx) =>
    createElement(
      View,
      { key: idx, style: styles.deliverableRow, wrap: false },
      createElement(Text, { style: styles.delName }, d.name),
      createElement(Text, { style: styles.delStatus }, d.status.replace(/_/g, ' ')),
      createElement(Text, { style: styles.delDate }, formatDate(d.completedDate)),
    ),
  );

  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: 'A4', style: styles.page },

      // Header
      createElement(
        View,
        { style: styles.headerRow },
        createElement(
          View,
          null,
          createElement(Text, { style: styles.title }, data.project.name),
          createElement(
            Text,
            { style: styles.subtitle },
            `${data.client?.company_name ?? 'Client report'}${
              data.client?.industry ? ` \u00b7 ${data.client.industry}` : ''
            }`,
          ),
        ),
        createElement(
          View,
          null,
          createElement(Text, { style: styles.metaStrong }, data.agency.name),
          createElement(
            Text,
            { style: styles.meta },
            `${formatDate(data.period.from)} \u2013 ${formatDate(data.period.to)}`,
          ),
          createElement(Text, { style: styles.meta }, `Generated ${formatDate(data.generatedAt)}`),
        ),
      ),

      // Executive Summary
      createElement(
        View,
        { style: styles.sectionBlock },
        createElement(Text, { style: styles.sectionTitle }, 'Executive Summary'),
        createElement(Text, { style: styles.paragraph }, data.executiveSummary),
      ),

      // ROI summary
      createElement(
        View,
        { style: styles.sectionBlock },
        createElement(
          View,
          { style: styles.roiRow },
          createElement(
            View,
            { style: styles.roiCard },
            createElement(Text, { style: styles.roiLabel }, 'Budget'),
            createElement(Text, { style: styles.roiValue }, formatCurrency(data.roiSummary.totalBudget)),
          ),
          createElement(
            View,
            { style: styles.roiCard },
            createElement(Text, { style: styles.roiLabel }, 'Spent'),
            createElement(Text, { style: styles.roiValue }, formatCurrency(data.roiSummary.totalSpent)),
          ),
          createElement(
            View,
            { style: styles.roiCard },
            createElement(Text, { style: styles.roiLabel }, 'Upside'),
            createElement(
              Text,
              { style: styles.roiValue },
              formatCurrency(data.roiSummary.totalEstimatedValue),
            ),
          ),
          createElement(
            View,
            { style: styles.roiCard },
            createElement(Text, { style: styles.roiLabel }, 'Projected ROI'),
            createElement(
              Text,
              { style: styles.roiValue },
              data.roiSummary.roiMultiple != null ? `${data.roiSummary.roiMultiple.toFixed(2)}x` : '\u2014',
            ),
          ),
        ),
      ),

      // Performance metrics
      createElement(
        View,
        { style: styles.sectionBlock },
        createElement(Text, { style: styles.sectionTitle }, 'Performance'),
        metrics.length > 0
          ? createElement(View, { style: styles.metricsGrid }, metrics)
          : createElement(Text, { style: styles.paragraph }, 'No metrics recorded for this period.'),
      ),

      // Highlights
      createElement(
        View,
        { style: styles.sectionBlock },
        createElement(Text, { style: styles.sectionTitle }, 'Highlights'),
        data.highlights.length > 0
          ? bulletList(data.highlights)
          : createElement(Text, { style: styles.paragraph }, 'No highlights captured for this period.'),
      ),

      // Deliverables
      createElement(
        View,
        { style: styles.sectionBlock },
        createElement(Text, { style: styles.sectionTitle }, 'Deliverables'),
        deliverables.length > 0
          ? createElement(View, null, deliverables)
          : createElement(Text, { style: styles.paragraph }, 'No deliverables tracked.'),
      ),

      // Challenges
      createElement(
        View,
        { style: styles.sectionBlock },
        createElement(Text, { style: styles.sectionTitle }, 'Challenges & Solutions'),
        data.challenges.length > 0
          ? bulletList(data.challenges)
          : createElement(Text, { style: styles.paragraph }, 'No major challenges this period.'),
      ),

      // Recommendations
      createElement(
        View,
        { style: styles.sectionBlock },
        createElement(Text, { style: styles.sectionTitle }, 'Recommendations'),
        recommendations.length > 0
          ? createElement(View, null, recommendations)
          : createElement(Text, { style: styles.paragraph }, 'No active recommendations.'),
      ),

      // Next steps
      createElement(
        View,
        { style: styles.sectionBlock },
        createElement(Text, { style: styles.sectionTitle }, 'Next Steps'),
        data.nextSteps.length > 0
          ? bulletList(data.nextSteps)
          : createElement(Text, { style: styles.paragraph }, 'Awaiting client direction for next steps.'),
      ),

      // Footer
      createElement(
        Text,
        { style: styles.footer, fixed: true },
        `Prepared by ${data.agency.name} \u00b7 Powered by Empire OS`,
      ),
    ),
  );
}

export async function renderReportPdf(data: ReportData): Promise<Buffer> {
  return renderToBuffer(buildDocument(data));
}

/** Back-compat alias for any caller still importing buildReportPdf. */
export const buildReportPdf = renderReportPdf;
