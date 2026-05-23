'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

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
import type { Client, Project, Service } from '@/lib/db/types';
import { canTransitionProjectStatus } from '@/lib/db/types';

export interface ProjectFormProps {
  mode: 'create' | 'edit';
  project?: Partial<Project>;
  clients: Pick<Client, 'id' | 'company_name'>[];
  services: Pick<Service, 'id' | 'slug' | 'name'>[];
  defaultClientId?: string;
}

const ALL_STATUSES = ['planning', 'active', 'in_review', 'completed', 'closed', 'cancelled'] as const;

export function ProjectForm({ mode, project, clients, services, defaultClientId }: ProjectFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    client_id: project?.client_id ?? defaultClientId ?? '',
    service_id: project?.service_id ?? '',
    name: project?.name ?? '',
    description: project?.description ?? '',
    service_type: project?.service_type ?? '',
    status: project?.status ?? ('planning' as const),
    budget: project?.budget ?? 0,
    spent: project?.spent ?? 0,
    start_date: project?.start_date ?? '',
    end_date: project?.end_date ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const allowedStatuses = useMemo(() => {
    if (mode === 'create') return ALL_STATUSES.slice();
    const current = project?.status ?? 'planning';
    return ALL_STATUSES.filter((s) => s === current || canTransitionProjectStatus(current, s));
  }, [mode, project?.status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = mode === 'create' ? '/api/projects' : `/api/projects/${project?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const payload = {
        ...form,
        service_id: form.service_id || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description || null,
        service_type: form.service_type || null,
      };
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error?.message || 'Could not save project');
        return;
      }
      const id = body?.project?.id ?? project?.id;
      router.push(id ? `/dashboard/projects/${id}` : '/dashboard/projects');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!project?.id) return;
    if (!confirm('Delete this project and all its deliverables? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message || 'Could not delete project');
        return;
      }
      router.push('/dashboard/projects');
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Client *</label>
          <Select value={form.client_id} onValueChange={(v) => set('client_id', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Service</label>
          <Select
            value={form.service_id || 'none'}
            onValueChange={(v) => {
              if (v === 'none') {
                set('service_id', '');
                return;
              }
              set('service_id', v);
              const svc = services.find((s) => s.id === v);
              if (svc && !form.service_type) set('service_type', svc.name);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No service</SelectItem>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-2">Project name *</label>
          <Input required value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            rows={4}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What's this project about?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <Select value={form.status as string} onValueChange={(v) => set('status', v as typeof ALL_STATUSES[number])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedStatuses.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Service label</label>
          <Input value={form.service_type ?? ''} onChange={(e) => set('service_type', e.target.value)} placeholder="e.g. SEO" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Budget</label>
          <Input type="number" min={0} value={form.budget} onChange={(e) => set('budget', Number(e.target.value))} />
        </div>
        {mode === 'edit' && (
          <div>
            <label className="block text-sm font-medium mb-2">Spent</label>
            <Input type="number" min={0} value={form.spent} onChange={(e) => set('spent', Number(e.target.value))} />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2">Start date</label>
          <Input type="date" value={form.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">End date</label>
          <Input type="date" value={form.end_date ?? ''} onChange={(e) => set('end_date', e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          {mode === 'edit' && (
            <Button type="button" variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !form.client_id}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {mode === 'create' ? 'Create project' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
