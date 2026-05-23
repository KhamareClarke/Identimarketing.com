// =====================================================================
// Identimarketing SaaS - Supabase client factories
//
// Three contexts:
//   1) Browser (Client Components, browser bundle) -> createBrowserClient
//   2) Server (RSC + route handlers, bound to user cookie) -> createServerClient
//   3) Service role (cron, webhooks, admin scripts) -> createServiceClient
//
// RLS auto-applies for (1) and (2). The service-role client bypasses RLS
// and must NEVER be exposed to the browser bundle.
// =====================================================================

import { cookies } from 'next/headers';
import {
  createBrowserClient as createSsrBrowserClient,
  createServerClient as createSsrServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Notes on typing:
// - We intentionally do NOT thread our `Database` type through SupabaseClient
//   here. supabase-js v2.106+ uses RejectExcessProperties on insert/update
//   that conflicts with the generic helpers in lib/db/queries.ts. We rely on
//   Zod (lib/validations/*) for input validation and cast read rows to typed
//   shapes in queries.ts, which gives us the safety we actually want without
//   fighting the library.
export type TypedSupabaseClient = SupabaseClient;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// ---------------------------------------------------------------------
// 1) Browser client (anon key, reads cookies set by middleware)
// ---------------------------------------------------------------------
export function createBrowserClient(): TypedSupabaseClient {
  return createSsrBrowserClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  );
}

// ---------------------------------------------------------------------
// 2) Server client (RSC + route handlers, RLS-aware via user cookie)
//
// IMPORTANT: this function calls next/headers cookies() and must only be
// invoked from a Server Component, Server Action, or route handler.
// ---------------------------------------------------------------------
export function createServerClient(): TypedSupabaseClient {
  const cookieStore = cookies();
  return createSsrServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Server Component context - cookie writes are silently dropped here;
            // middleware refreshes the session cookie on every request instead.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // see above
          }
        },
      },
    },
  );
}

// ---------------------------------------------------------------------
// 3) Service-role client (bypasses RLS - never expose to the browser)
// ---------------------------------------------------------------------
export function createServiceClient(): TypedSupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('createServiceClient must never be called from the browser.');
  }
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
