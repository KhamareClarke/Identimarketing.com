// =====================================================================
// GET /api/health
//
// Tiny diagnostics endpoint. Returns:
//   - which Supabase project URL the app is using
//   - a per-table SELECT 1 to confirm each migration has been applied
//   - whether key env vars are present (without exposing values)
//
// Safe to expose publicly: never returns secret values.
// =====================================================================

import { NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/db/client';
import { verifyMailTransport } from '@/lib/email';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

const REQUIRED_TABLES = [
  'profiles',
  'clients',
  'projects',
  'deliverables',
  'team_members',
  'services',
  'notifications',
  'empire_os_suggestions',
  'billing',
  'invoices',
  'reports',
  'project_metric_targets',
  'notification_preferences',
  'pending_signups',
] as const;

interface TableProbe {
  table: string;
  exists: boolean;
  error?: string;
}

interface EnvProbe {
  name: string;
  present: boolean;
}

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'CRON_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'GHL_API_KEY',
  'GHL_LOCATION_ID',
  'ANTHROPIC_API_KEY',
];

function deriveProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/^https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

export const GET = withErrorHandler('api.health.GET', async () => {
  const supabase = createServiceClient();
  const tables: TableProbe[] = [];

  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .limit(1);
    if (!error) {
      tables.push({ table, exists: true });
    } else {
      tables.push({
        table,
        exists: false,
        error: error.message,
      });
    }
  }

  const env: EnvProbe[] = REQUIRED_ENV.map((name) => ({
    name,
    present: Boolean(process.env[name] && process.env[name]!.length > 0),
  }));

  // Upsert probe - this mirrors what /api/auth/signup does. If the
  // SELECT probe above says the table exists but THIS errors with
  // PGRST205, we know the PostgREST schema cache is split-brained
  // (read path works, write path doesn't). Forces a real diagnostic.
  let pendingSignupsWriteProbe: {
    ok: boolean;
    code?: string;
    error?: string;
  } = { ok: false };
  try {
    const probeEmail = `_health-probe-${Date.now()}@identimarketing.invalid`;
    const { error: probeErr } = await supabase.from('pending_signups').upsert(
      {
        email: probeEmail,
        name: 'health probe',
        password_encrypted: 'probe',
        code_hash: 'probe',
        attempts: 0,
        last_sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60_000).toISOString(),
      },
      { onConflict: 'email' },
    );
    if (probeErr) {
      pendingSignupsWriteProbe = {
        ok: false,
        code: (probeErr as { code?: string }).code,
        error: probeErr.message,
      };
    } else {
      pendingSignupsWriteProbe = { ok: true };
      // Clean up the probe row.
      await supabase.from('pending_signups').delete().eq('email', probeEmail);
    }
  } catch (err) {
    pendingSignupsWriteProbe = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // SMTP probe (Gmail App Password). Skipped if EMAIL_* env not set.
  let smtp: { ok: boolean; error?: string; skipped?: boolean } = { ok: false, skipped: true };
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    smtp = await verifyMailTransport();
  }

  const missingTables = tables.filter((t) => !t.exists).map((t) => t.table);
  const missingEnv = env.filter((e) => !e.present).map((e) => e.name);

  const hints: string[] = [];
  if (missingTables.includes('pending_signups')) {
    hints.push('Run lib/db/migrations/008_pending_signups.sql in Supabase SQL editor.');
  } else if (missingTables.length > 0) {
    hints.push(`Apply migrations for: ${missingTables.join(', ')}`);
  }
  if (!pendingSignupsWriteProbe.ok) {
    if (pendingSignupsWriteProbe.code === 'PGRST205') {
      hints.push(
        'PostgREST schema cache is stale on the write path. Go to Supabase Dashboard -> Project Settings -> Restart project. Wait 60s, then refresh this URL.',
      );
    } else if (pendingSignupsWriteProbe.code === '42501') {
      hints.push(
        'pending_signups upsert blocked by RLS / grants. The service-role key in Vercel may actually be the anon key.',
      );
    } else {
      hints.push(
        `pending_signups write probe failed (${pendingSignupsWriteProbe.code ?? 'no code'}): ${pendingSignupsWriteProbe.error ?? 'unknown'}.`,
      );
    }
  }
  if (smtp && !smtp.ok && !smtp.skipped) {
    hints.push(
      `SMTP auth failed (${smtp.error ?? 'unknown'}). Most likely a Gmail App Password with spaces or 2FA not enabled.`,
    );
  }

  return NextResponse.json({
    ok:
      missingTables.length === 0 &&
      missingEnv.length === 0 &&
      pendingSignupsWriteProbe.ok &&
      (smtp.ok || smtp.skipped),
    supabase: {
      projectRef: deriveProjectRef(),
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    },
    env,
    tables,
    pendingSignupsWriteProbe,
    smtp,
    summary: {
      missingTables,
      missingEnv,
      hint: hints.length > 0 ? hints.join(' ') : 'All checks passed.',
    },
  });
});
