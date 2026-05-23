// =====================================================================
// Identimarketing SaaS - Session helpers
//
// Thin wrappers around Supabase Auth so server code never imports
// @supabase/ssr directly. Use these from Server Components, route
// handlers, and Server Actions.
// =====================================================================

import type { Session, User } from '@supabase/supabase-js';

import { createServerClient } from '@/lib/db/client';

export async function getSession(): Promise<Session | null> {
  const supabase = createServerClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const supabase = createServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function signOut(): Promise<void> {
  const supabase = createServerClient();
  await supabase.auth.signOut();
}
