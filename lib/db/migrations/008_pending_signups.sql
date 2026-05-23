-- =====================================================================
-- Identimarketing SaaS - 008_pending_signups.sql
--
-- Holds in-flight signups while we wait for the user to enter the OTP
-- emailed to them. Rows are deleted on successful verification or
-- expire after 15 minutes. Password is stored AES-256-GCM encrypted
-- (lib/auth/crypt.ts) so we can sign the user in immediately on verify.
-- The OTP is stored as a bcrypt hash, never plaintext.
-- =====================================================================

create table if not exists public.pending_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_encrypted text not null,
  code_hash text not null,
  attempts integer not null default 0,
  last_sent_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now()
);

create index if not exists pending_signups_email_idx
  on public.pending_signups(email);
create index if not exists pending_signups_expires_idx
  on public.pending_signups(expires_at);

alter table public.pending_signups enable row level security;
-- No policies: service role only. The auth API routes always use
-- createServiceClient() for this table.

-- Periodic cleanup helper (optional - cron can also DELETE on expiry).
create or replace function public.purge_expired_pending_signups()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.pending_signups where expires_at < now();
$$;
