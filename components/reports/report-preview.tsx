'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Copy,
  Download,
  Eye,
  Link2,
  Loader2,
  RefreshCw,
  ShieldOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Report } from '@/lib/db/types';
import { formatDate } from '@/lib/utils';

export interface ReportPreviewProps {
  report: Report;
  /** When true, the row inlines the iframe preview underneath the actions. */
  defaultOpen?: boolean;
}

export function ReportPreview({ report, defaultOpen }: ReportPreviewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<null | 'pdf' | 'share' | 'revoke' | 'regen'>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(
    report.share_token && process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/api/reports/share/${report.id}?token=${report.share_token}`
      : null,
  );
  const [previewOpen, setPreviewOpen] = useState(defaultOpen ?? false);

  async function downloadPdf(): Promise<void> {
    setBusy('pdf');
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          projectId: report.project_id,
          format: 'pdf',
          from: report.period_from,
          to: report.period_to,
          title: report.title,
        }),
      });
      if (!res.ok) {
        const json: { error?: { message?: string } } = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || 'Download failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugify(report.title)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'PDF downloaded' });
    } catch (err) {
      toast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  async function shareLink(): Promise<void> {
    setBusy('share');
    try {
      const res = await fetch(`/api/reports/share/${report.id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 30 }),
      });
      const json: { error?: { message?: string }; url?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) throw new Error(json?.error?.message || 'Share failed');
      setShareUrl(json.url);
      await navigator.clipboard?.writeText(json.url).catch(() => {});
      toast({ title: 'Share link created', description: 'Link copied to clipboard.' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Could not create share link',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  async function revokeShare(): Promise<void> {
    setBusy('revoke');
    try {
      const res = await fetch(`/api/reports/share/${report.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json: { error?: { message?: string } } = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || 'Revoke failed');
      }
      setShareUrl(null);
      toast({ title: 'Share link revoked' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Could not revoke link',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  async function regenerate(): Promise<void> {
    setBusy('regen');
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          projectId: report.project_id,
          format: report.format,
          from: report.period_from,
          to: report.period_to,
          title: report.title,
          download: false,
        }),
      });
      if (!res.ok) {
        const json: { error?: { message?: string } } = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || 'Regenerate failed');
      }
      toast({ title: 'Report regenerated' });
      router.refresh();
    } catch (err) {
      toast({
        title: 'Could not regenerate',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  }

  function copyShareUrl(): void {
    if (!shareUrl) return;
    void navigator.clipboard?.writeText(shareUrl);
    toast({ title: 'Link copied' });
  }

  return (
    <Card className="p-5 bg-background/60 border-white/10">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{report.title}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
            <Badge variant="outline" className="uppercase">{report.format}</Badge>
            <Badge
              variant={report.status === 'ready' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {report.status}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(report.period_from)} \u2013 {formatDate(report.period_to)}
            </span>
            <span>Generated {formatDate(report.generated_at)}</span>
            {report.share_views > 0 && (
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {report.share_views} view{report.share_views === 1 ? '' : 's'}
              </span>
            )}
          </div>
          {report.summary && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{report.summary}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)} disabled={!report.html_content}>
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button size="sm" variant="outline" onClick={downloadPdf} disabled={busy !== null}>
            {busy === 'pdf' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
            PDF
          </Button>
          {shareUrl ? (
            <Button size="sm" variant="ghost" onClick={revokeShare} disabled={busy !== null}>
              {busy === 'revoke' ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <ShieldOff className="w-4 h-4 mr-1" />
              )}
              Revoke
            </Button>
          ) : (
            <Button size="sm" onClick={shareLink} disabled={busy !== null}>
              {busy === 'share' ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4 mr-1" />
              )}
              Share
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={regenerate} disabled={busy !== null}>
            {busy === 'regen' ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            Re-generate
          </Button>
        </div>
      </div>

      {shareUrl && (
        <div className="mt-3 p-2 rounded-md border border-white/10 bg-white/[0.02] flex items-center gap-2">
          <Link2 className="w-3 h-3 text-muted-foreground shrink-0" />
          <code className="text-xs text-muted-foreground truncate flex-1">{shareUrl}</code>
          <Button size="sm" variant="ghost" onClick={copyShareUrl}>
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{report.title}</DialogTitle>
            <DialogDescription>
              Period {formatDate(report.period_from)} to {formatDate(report.period_to)}
            </DialogDescription>
          </DialogHeader>
          {report.html_content ? (
            <iframe
              title={report.title}
              srcDoc={report.html_content}
              className="w-full h-[70vh] rounded-md bg-white"
            />
          ) : (
            <p className="text-sm text-muted-foreground">No HTML cached for this report.</p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'report'
  );
}
