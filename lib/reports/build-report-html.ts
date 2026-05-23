// =====================================================================
// Identimarketing SaaS - lib/reports/build-report-html.ts
//
// Pure function that converts a ReportData object into a printable
// HTML document. Used for in-app preview and for the HTML format
// returned by /api/reports/generate.
// =====================================================================

import type { ReportData } from './types';

function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

function metricCardHtml(card: ReportData['metricCards'][number]): string {
  const trendColor =
    card.trendQuality === 'good' ? '#15803d' : card.trendQuality === 'bad' ? '#b91c1c' : '#52525b';
  const trendArrow = card.trend.direction === 'up' ? '\u2191' : card.trend.direction === 'down' ? '\u2193' : '\u2192';
  const performance =
    card.performance === 'exceeded'
      ? 'Exceeded'
      : card.performance === 'on_track'
      ? 'On track'
      : card.performance === 'behind'
      ? 'Behind target'
      : '';
  return `<div class="metric-card">
    <div class="metric-label">${escapeHtml(card.label)}</div>
    <div class="metric-value">${escapeHtml(card.formattedValue)}</div>
    <div class="metric-trend" style="color: ${trendColor}">
      ${escapeHtml(trendArrow)} ${escapeHtml(Math.abs(card.trend.changePct).toFixed(1))}% vs prev. period
    </div>
    ${
      card.formattedTarget
        ? `<div class="metric-target">Target: ${escapeHtml(card.formattedTarget)} \u00b7 ${
            card.pctOfTarget ?? 0
          }% achieved</div>`
        : ''
    }
    ${performance ? `<div class="metric-performance">${escapeHtml(performance)}</div>` : ''}
  </div>`;
}

function recommendationHtml(rec: ReportData['recommendations'][number]): string {
  return `<div class="recommendation">
    <div class="recommendation-head">
      <div class="recommendation-title">${escapeHtml(rec.title)}</div>
      ${
        rec.impactScore != null
          ? `<div class="recommendation-impact">Impact ${escapeHtml(rec.impactScore)}/100</div>`
          : ''
      }
    </div>
    <p class="recommendation-summary">${escapeHtml(rec.summary)}</p>
    ${
      rec.actionSteps.length > 0
        ? `<ol class="recommendation-steps">${rec.actionSteps
            .map((step) => `<li>${escapeHtml(step)}</li>`)
            .join('')}</ol>`
        : ''
    }
    <div class="recommendation-meta">
      Confidence ${escapeHtml(rec.confidenceScore)}%
      ${
        rec.estimatedValue != null
          ? ` \u00b7 Est. value ${escapeHtml(formatCurrency(rec.estimatedValue))}`
          : ''
      }
    </div>
  </div>`;
}

const STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0f172a; background: #f8fafc; margin: 0; padding: 0; }
  .report { max-width: 880px; margin: 0 auto; background: #fff; padding: 48px; box-shadow: 0 1px 3px rgba(15,23,42,0.08); }
  .report-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 32px; }
  .report-header h1 { margin: 0; font-size: 28px; font-weight: 700; }
  .report-header .meta { text-align: right; color: #64748b; font-size: 13px; }
  .section { margin-bottom: 36px; }
  .section h2 { font-size: 18px; font-weight: 600; margin: 0 0 16px; color: #0f172a; border-bottom: 2px solid #1e40af; padding-bottom: 6px; display: inline-block; }
  .summary { font-size: 14px; line-height: 1.65; color: #334155; }
  .grid { display: grid; gap: 16px; }
  .grid-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-2 { grid-template-columns: repeat(2, 1fr); }
  .metric-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
  .metric-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  .metric-value { font-size: 22px; font-weight: 700; margin-top: 6px; color: #0f172a; }
  .metric-trend { font-size: 12px; margin-top: 4px; font-weight: 500; }
  .metric-target { font-size: 11px; color: #64748b; margin-top: 6px; }
  .metric-performance { font-size: 11px; margin-top: 4px; font-weight: 600; color: #1e40af; }
  .recommendation { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px; background: #f8fafc; }
  .recommendation-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .recommendation-title { font-weight: 600; font-size: 14px; color: #0f172a; }
  .recommendation-impact { font-size: 11px; color: #1e40af; font-weight: 600; }
  .recommendation-summary { font-size: 13px; color: #334155; line-height: 1.55; margin: 6px 0; }
  .recommendation-steps { padding-left: 18px; margin: 6px 0; color: #334155; font-size: 12px; }
  .recommendation-steps li { margin: 2px 0; }
  .recommendation-meta { font-size: 11px; color: #64748b; margin-top: 4px; }
  .deliverable-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .deliverable-table th, .deliverable-table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
  .deliverable-table th { background: #f8fafc; font-weight: 600; color: #475569; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
  .pill-success { background: #dcfce7; color: #15803d; }
  .pill-progress { background: #dbeafe; color: #1e40af; }
  .pill-pending { background: #fef3c7; color: #b45309; }
  .pill-muted { background: #f1f5f9; color: #475569; }
  .roi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .roi .item { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
  .roi .item .label { font-size: 11px; text-transform: uppercase; color: #64748b; }
  .roi .item .value { font-size: 18px; font-weight: 700; margin-top: 2px; }
  ul.flat { padding-left: 18px; margin: 0; }
  ul.flat li { margin: 4px 0; color: #334155; font-size: 13px; line-height: 1.5; }
  .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  @media print { body { background: #fff; } .report { box-shadow: none; padding: 24px; max-width: 100%; } }
`;

function pillFor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'approved') return 'pill pill-success';
  if (s === 'in_progress' || s === 'under_review') return 'pill pill-progress';
  if (s === 'pending') return 'pill pill-pending';
  return 'pill pill-muted';
}

export function buildReportHtml(data: ReportData): string {
  const periodLabel = `${formatDate(data.period.from)} \u2013 ${formatDate(data.period.to)}`;
  const metricsHtml = data.metricCards.length
    ? `<div class="grid grid-3">${data.metricCards.slice(0, 9).map(metricCardHtml).join('')}</div>`
    : '<p class="summary">No metrics recorded for this period.</p>';

  const deliverablesHtml = data.deliverables.length
    ? `<table class="deliverable-table">
        <thead><tr><th>Deliverable</th><th>Status</th><th>Completed</th></tr></thead>
        <tbody>${data.deliverables
          .map(
            (d) => `<tr>
              <td>
                <div style="font-weight: 600; color: #0f172a;">${escapeHtml(d.name)}</div>
                ${d.description ? `<div style="font-size: 12px; color: #64748b;">${escapeHtml(d.description)}</div>` : ''}
              </td>
              <td><span class="${pillFor(d.status)}">${escapeHtml(d.status.replace(/_/g, ' '))}</span></td>
              <td>${escapeHtml(formatDate(d.completedDate))}</td>
            </tr>`,
          )
          .join('')}</tbody>
      </table>`
    : '<p class="summary">No deliverables tracked.</p>';

  const recommendationsHtml = data.recommendations.length
    ? data.recommendations.map(recommendationHtml).join('')
    : '<p class="summary">No active recommendations.</p>';

  const highlightsHtml = data.highlights.length
    ? `<ul class="flat">${data.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`
    : '<p class="summary">No highlights captured for this period.</p>';

  const challengesHtml = data.challenges.length
    ? `<ul class="flat">${data.challenges.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`
    : '<p class="summary">No major challenges this period.</p>';

  const nextStepsHtml = data.nextSteps.length
    ? `<ul class="flat">${data.nextSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
    : '<p class="summary">Awaiting client direction for next steps.</p>';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(data.project.name)} \u00b7 Report</title>
<style>${STYLES}</style>
</head>
<body>
  <div class="report">
    <div class="report-header">
      <div>
        <h1>${escapeHtml(data.project.name)}</h1>
        <div style="color: #64748b; font-size: 13px;">
          ${escapeHtml(data.client?.company_name ?? 'Client report')}
          ${data.client?.industry ? ` \u00b7 ${escapeHtml(data.client.industry)}` : ''}
        </div>
      </div>
      <div class="meta">
        <div style="font-weight: 600; color: #0f172a;">${escapeHtml(data.agency.name)}</div>
        <div>${escapeHtml(periodLabel)}</div>
        <div>Generated ${escapeHtml(formatDate(data.generatedAt))}</div>
      </div>
    </div>

    <div class="section">
      <h2>Executive Summary</h2>
      <p class="summary">${escapeHtml(data.executiveSummary)}</p>
      <div class="roi" style="margin-top: 16px;">
        <div class="item"><div class="label">Budget</div><div class="value">${escapeHtml(formatCurrency(data.roiSummary.totalBudget))}</div></div>
        <div class="item"><div class="label">Spent</div><div class="value">${escapeHtml(formatCurrency(data.roiSummary.totalSpent))}</div></div>
        <div class="item"><div class="label">Estimated upside</div><div class="value">${escapeHtml(formatCurrency(data.roiSummary.totalEstimatedValue))}</div></div>
        <div class="item"><div class="label">Projected ROI</div><div class="value">${
          data.roiSummary.roiMultiple != null
            ? `${data.roiSummary.roiMultiple.toFixed(2)}x`
            : '\u2014'
        }</div></div>
      </div>
    </div>

    <div class="section">
      <h2>Performance</h2>
      ${metricsHtml}
    </div>

    <div class="section">
      <h2>Highlights</h2>
      ${highlightsHtml}
    </div>

    <div class="section">
      <h2>Deliverables</h2>
      ${deliverablesHtml}
    </div>

    <div class="section">
      <h2>Challenges &amp; Solutions</h2>
      ${challengesHtml}
    </div>

    <div class="section">
      <h2>Recommendations</h2>
      ${recommendationsHtml}
    </div>

    <div class="section">
      <h2>Next Steps</h2>
      ${nextStepsHtml}
    </div>

    <div class="footer">
      Prepared by ${escapeHtml(data.agency.name)} \u00b7 Powered by Empire OS
    </div>
  </div>
</body>
</html>`;
}
