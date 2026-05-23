'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TeamMember, TeamMemberStatus, TeamRole } from '@/lib/db/types';

const ROLES: TeamRole[] = ['admin', 'manager', 'designer', 'developer', 'strategist', 'member'];
const STATUSES: TeamMemberStatus[] = ['invited', 'active', 'inactive'];

const SUGGESTED_SPECIALTIES = [
  'SEO',
  'Content',
  'Paid ads',
  'Social media',
  'Design',
  'Brand strategy',
  'Web development',
  'Email',
  'Analytics',
  'AI / automation',
];

export interface TeamFormProps {
  mode: 'create' | 'edit';
  member?: Partial<TeamMember>;
}

export function TeamForm({ mode, member }: TeamFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: member?.name ?? '',
    email: member?.email ?? '',
    role: member?.role ?? ('member' as const),
    phone: member?.phone ?? '',
    specialties: member?.specialties ?? [],
    status: member?.status ?? ('invited' as const),
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSpecialty(label: string) {
    setForm((prev) =>
      prev.specialties.includes(label)
        ? { ...prev, specialties: prev.specialties.filter((s) => s !== label) }
        : { ...prev, specialties: [...prev.specialties, label] },
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = mode === 'create' ? '/api/team' : `/api/team/${member?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error?.message || 'Could not save team member');
        return;
      }
      const id = body?.member?.id ?? member?.id;
      router.push(id ? `/dashboard/team/${id}` : '/dashboard/team');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!member?.id) return;
    if (!confirm('Remove this team member?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/team/${member.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/team');
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name *</label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email *</label>
          <Input
            type="email"
            required
            disabled={mode === 'edit'}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {mode === 'create' && (
            <p className="text-xs text-muted-foreground mt-1">An invite will be sent to this email.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Role</label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as TeamRole })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r} className="capitalize">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        {mode === 'edit' && (
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TeamMemberStatus })}>
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
        )}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-2">Specialties</label>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SPECIALTIES.map((s) => {
              const active = form.specialties.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${
                    active ? 'bg-primary text-primary-foreground border-primary' : 'border-white/10 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          {mode === 'edit' && (
            <Button type="button" variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Remove
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {mode === 'create' ? 'Send invite' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
