'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, Loader2, Sparkles, ThumbsDown, TrendingUp, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { EmpireOSSuggestion, RecommendationType } from '@/lib/db/types';
import { formatCurrency } from '@/lib/utils';

const REC_TYPE_LABEL: Record<RecommendationType, string> = {
  generate_content: 'Generate content',
  email_sequence: 'Email sequence',
  social_calendar: 'Social calendar',
  ad_copy: 'Ad copy',
  strategy: 'Strategy',
  advice: 'Advice',
};

export interface RecommendationCardProps {
  recommendation: EmpireOSSuggestion & { composite_score?: number };
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<'approve' | 'decline' | null>(null);
  const [status, setStatus] = useState(recommendation.status);
  const [output, setOutput] = useState<unknown>(recommendation.applied_output);

  async function call(action: 'approve' | 'decline'): Promise<void> {
    setBusy(action);
    try {
      const res = await fetch(`/api/empire-os/${action}/${recommendation.id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: action === 'decline' ? JSON.stringify({ reason: 'User declined from dashboard' }) : '{}',
      });
      const json: { error?: { message?: string }; suggestion?: EmpireOSSuggestion; result?: unknown } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Request failed');
      }
      if (json.suggestion) {
        setStatus(json.suggestion.status);
        setOutput(json.suggestion.applied_output ?? null);
      } else {
        setStatus(action === 'approve' ? 'approved' : 'declined');
      }
      toast({
        title: action === 'approve' ? 'Recommendation approved' : 'Recommendation declined',
        description: action === 'approve' ? 'Empire OS executed the action.' : 'We won\u2019t show this again.',
      });
      router.refresh();
    } catch (err) {
      toast({
        title: `Could not ${action}`,
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  const isApproved = status === 'approved' || status === 'applied';
  const isDeclined = status === 'declined';
  const typeLabel =
    REC_TYPE_LABEL[(recommendation.recommendation_type ?? 'advice') as RecommendationType] ?? 'Advice';

  return (
    <Card className="p-5 bg-background/60 border-white/10">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs uppercase tracking-wide">
              <Sparkles className="w-3 h-3 mr-1" />
              {recommendation.skill_name}
            </Badge>
            <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
            {recommendation.auto_executable && (
              <Badge variant="default" className="text-xs">Auto-executable</Badge>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-base leading-snug">
            {recommendation.title || recommendation.suggestion_text.slice(0, 80)}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-muted-foreground">Score</span>
          <span className="text-lg font-bold">
            {Math.round(recommendation.composite_score ?? recommendation.impact_score ?? 0)}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">
        {recommendation.suggestion_text}
      </p>

      {recommendation.recommendation && (
        <details className="mb-3">
          <summary className="text-xs cursor-pointer text-foreground/80 hover:text-foreground">
            View full recommendation
          </summary>
          <pre className="mt-2 text-xs whitespace-pre-wrap break-words font-sans bg-white/[0.02] p-3 rounded-md border border-white/5">
            {recommendation.recommendation}
          </pre>
        </details>
      )}

      {recommendation.action_steps && recommendation.action_steps.length > 0 && (
        <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-0.5 mb-3">
          {recommendation.action_steps.slice(0, 6).map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 flex-wrap gap-2">
        <span className="inline-flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Confidence {Math.round(recommendation.confidence_score)}%
        </span>
        {recommendation.estimated_time_minutes != null && (
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {recommendation.estimated_time_minutes} min
          </span>
        )}
        {recommendation.estimated_value != null && (
          <span className="inline-flex items-center gap-1 text-emerald-400">
            {formatCurrency(recommendation.estimated_value)} potential
          </span>
        )}
      </div>

      {isApproved ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <Check className="w-4 h-4" />
          Approved
          {output ? (
            <details className="ml-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">View generated output</summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap break-words font-sans bg-white/[0.02] p-3 rounded-md border border-white/5">
                {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>
      ) : isDeclined ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <X className="w-4 h-4" />
          Declined
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void call('approve')}
            disabled={busy !== null}
          >
            {busy === 'approve' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-1" />
            )}
            Approve & execute
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => void call('decline')}
            disabled={busy !== null}
          >
            {busy === 'decline' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ThumbsDown className="w-4 h-4 mr-1" />
            )}
            Decline
          </Button>
        </div>
      )}
    </Card>
  );
}
