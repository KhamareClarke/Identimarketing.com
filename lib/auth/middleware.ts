// =====================================================================
// Identimarketing SaaS - Server-side auth guards
//
// Use these inside Server Components, route handlers, or Server Actions.
// (Edge middleware lives in /middleware.ts at project root.)
// =====================================================================

import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { errors } from '@/lib/error-handler';
import { createServerClient, type TypedSupabaseClient } from '@/lib/db/client';

export interface AuthedContext {
  user: User;
  supabase: TypedSupabaseClient;
}

/**
 * Used in Server Components / pages. Redirects to /auth/login if no session.
 */
export async function requireUser(redirectTo: string = '/auth/login'): Promise<AuthedContext> {
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const next = encodeURIComponent('/dashboard');
    redirect(`${redirectTo}?next=${next}`);
  }
  return { user: data.user, supabase };
}

/**
 * Used in API route handlers. Throws a 401 ApiError if no session.
 */
export async function requireUserApi(): Promise<AuthedContext> {
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw errors.unauthorized();
  }
  return { user: data.user, supabase };
}

/**
 * Returns the user if signed in, otherwise null. No redirect.
 */
export async function optionalUser(): Promise<AuthedContext | { user: null; supabase: TypedSupabaseClient }> {
  const supabase = createServerClient();
  const { data } = await supabase.auth.getUser();
  return { user: data.user, supabase } as AuthedContext | { user: null; supabase: TypedSupabaseClient };
}
