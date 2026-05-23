'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import type { Client } from '@/lib/db/types';

export interface ClientFormProps {
  client?: Partial<Client>;
  mode: 'create' | 'edit';
}

const STATUSES = ['lead', 'active', 'paused', 'churned'] as const;

export function ClientForm({ client, mode }: ClientFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: client?.company_name ?? '',
    industry: client?.industry ?? '',
    contact_name: client?.contact_name ?? '',
    contact_email: client?.contact_email ?? '',
    phone: client?.phone ?? '',
    address: client?.address ?? '',
    website: client?.website ?? '',
    budget: client?.budget ?? 0,
    status: client?.status ?? 'active',
    notes: client?.notes ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = mode === 'create' ? '/api/clients' : `/api/clients/${client?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error?.message || 'Could not save client');
        return;
      }
      const id = body?.client?.id ?? client?.id;
      router.push(id ? `/dashboard/clients/${id}` : '/dashboard/clients');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!client?.id) return;
    if (!confirm('Delete this client and all associated projects? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error?.message || 'Could not delete client');
        return;
      }
      router.push('/dashboard/clients');
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-2">Company name *</label>
          <Input required value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Industry</label>
          <Input value={form.industry ?? ''} onChange={(e) => set('industry', e.target.value)} placeholder="e.g. SaaS, eCommerce" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <Select value={form.status as string} onValueChange={(v) => set('status', v as typeof STATUSES[number])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Primary contact name</label>
          <Input value={form.contact_name ?? ''} onChange={(e) => set('contact_name', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Contact email *</label>
          <Input
            type="email"
            required
            value={form.contact_email}
            onChange={(e) => set('contact_email', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Website</label>
          <Input
            type="url"
            placeholder="https://"
            value={form.website ?? ''}
            onChange={(e) => set('website', e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-2">Address</label>
          <Input value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Budget (annual)</label>
          <Input
            type="number"
            min={0}
            value={form.budget}
            onChange={(e) => set('budget', Number(e.target.value))}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-2">Notes</label>
          <Textarea
            rows={4}
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Anything important about this client..."
          />
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
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {mode === 'create' ? 'Create client' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
