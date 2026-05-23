'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { Deliverable, DeliverableStatus } from '@/lib/db/types';

const STATUSES: DeliverableStatus[] = [
  'pending',
  'in_progress',
  'completed',
  'under_review',
  'approved',
  'rejected',
];

const STATUS_VARIANT: Record<DeliverableStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  in_progress: 'secondary',
  completed: 'default',
  under_review: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

export interface DeliverablesListProps {
  projectId: string;
  deliverables: Deliverable[];
}

export function DeliverablesList({ projectId, deliverables }: DeliverablesListProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    due_date: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addDeliverable(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          due_date: form.due_date || null,
          status: 'pending',
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error?.message || 'Could not add deliverable');
        return;
      }
      setForm({ name: '', description: '', due_date: '' });
      setCreating(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(id: string, status: DeliverableStatus) {
    const res = await fetch(`/api/projects/${projectId}/deliverables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) router.refresh();
    else {
      const body = await res.json().catch(() => ({}));
      alert(body?.error?.message || 'Could not update status');
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this deliverable?')) return;
    const res = await fetch(`/api/projects/${projectId}/deliverables/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }

  return (
    <Card className="p-5 bg-background/60 border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">Deliverables</h2>
          <p className="text-xs text-muted-foreground">
            {deliverables.length === 0
              ? 'No deliverables yet.'
              : `${deliverables.length} total, ${deliverables.filter((d) => d.status === 'completed' || d.status === 'approved').length} done`}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating((v) => !v)}>
          <Plus className="w-4 h-4 mr-2" /> {creating ? 'Cancel' : 'Add'}
        </Button>
      </div>

      {creating && (
        <form onSubmit={addDeliverable} className="mb-4 grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-2 items-start">
          <Input
            placeholder="Deliverable name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
          />
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Add
          </Button>
          <Textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="sm:col-span-3"
            rows={2}
          />
          {error && <p className="sm:col-span-3 text-sm text-destructive">{error}</p>}
        </form>
      )}

      {deliverables.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No deliverables. Add the first milestone.</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {deliverables.map((d) => (
            <li key={d.id} className="py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{d.name}</span>
                  <Badge variant={STATUS_VARIANT[d.status]} className="capitalize text-xs">
                    {d.status.replace('_', ' ')}
                  </Badge>
                </div>
                {d.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{d.description}</p>
                )}
                {d.due_date && (
                  <p className="text-xs text-muted-foreground mt-0.5">Due {formatDate(d.due_date)}</p>
                )}
              </div>
              <Select value={d.status} onValueChange={(v) => updateStatus(d.id, v as DeliverableStatus)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => remove(d.id)} aria-label="Delete">
                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
