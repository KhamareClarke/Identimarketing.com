// =====================================================================
// POST /api/empire-os/approve/[id]
//
// Approve an Empire OS recommendation and (if auto-executable) generate
// the concrete artifact via Claude.
// =====================================================================

import { NextRequest, NextResponse } from 'next/server';

import { requireUserApi } from '@/lib/auth/middleware';
import type { EmpireOSSettings, EmpireOSSuggestion } from '@/lib/db/types';
import { executeRecommendation } from '@/lib/empire-os/auto-executor';
import { errors, withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';
export const maxDuration = 90;

export const POST = withErrorHandler('api.empire-os.approve.POST', async (req: NextRequest, ctx) => {
  const id = ctx.params?.id;
  if (!id) throw errors.badRequest('Missing recommendation id.');
  const { user, supabase } = await requireUserApi();

  const { data: rec, error } = await supabase
    .from('empire_os_suggestions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw errors.serverError(error.message);
  const recommendation = rec as EmpireOSSuggestion | null;
  if (!recommendation) throw errors.notFound('Recommendation not found.');
  if (recommendation.user_id && recommendation.user_id !== user.id) {
    throw errors.forbidden('You do not own this recommendation.');
  }
  if (recommendation.status === 'applied') {
    return NextResponse.json({ success: true, suggestion: recommendation, alreadyApplied: true });
  }

  const { data: settingsRow } = await supabase
    .from('empire_os_settings')
    .select('hourly_budget_usd, auto_execute, allowed_recommendation_types')
    .eq('user_id', user.id)
    .maybeSingle();
  const settings = (settingsRow ?? null) as
    | Pick<EmpireOSSettings, 'hourly_budget_usd' | 'auto_execute' | 'allowed_recommendation_types'>
    | null;

  const recType = recommendation.recommendation_type ?? 'advice';
  const typeAllowed = settings?.allowed_recommendation_types?.includes(recType) ?? true;

  // If auto_execute is on AND the rec type is allowed AND the rec is auto-executable, generate output.
  const shouldGenerate =
    recommendation.auto_executable && typeAllowed && (settings?.auto_execute || req.headers.get('x-force-execute') === '1');

  if (!shouldGenerate) {
    const { data: updated, error: updErr } = await supabase
      .from('empire_os_suggestions')
      .update({
        status: 'approved',
        applied_at: new Date().toISOString(),
        applied_by: user.id,
      })
      .eq('id', id)
      .select('*')
      .single();
    if (updErr) throw errors.serverError(updErr.message);
    return NextResponse.json({ success: true, suggestion: updated, executed: false });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw errors.badRequest('Empire OS is not configured. Set ANTHROPIC_API_KEY and try again.');
  }
  const result = await executeRecommendation({
    supabase,
    userId: user.id,
    recommendation,
    hourlyBudgetUsd: settings?.hourly_budget_usd ?? null,
  });
  if (!result.ok) {
    throw errors.serverError(result.error || 'Auto-execution failed');
  }
  const { data: refreshed } = await supabase
    .from('empire_os_suggestions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return NextResponse.json({
    success: true,
    suggestion: refreshed,
    executed: true,
    output: result.output,
    costUsd: result.costUsd,
  });
});
