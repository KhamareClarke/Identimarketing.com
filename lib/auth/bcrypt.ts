// =====================================================================
// Identimarketing SaaS - bcrypt wrappers
//
// User passwords are managed by Supabase Auth - we never hash them.
// This module is for INTERNAL secrets only:
//   - Team invite tokens
//   - Webhook signing keys
//   - API keys
// =====================================================================

import bcrypt from 'bcryptjs';

const DEFAULT_ROUNDS = 10;

export async function hash(secret: string, rounds = DEFAULT_ROUNDS): Promise<string> {
  return bcrypt.hash(secret, rounds);
}

export async function compare(secret: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(secret, hashed);
}

export function hashSync(secret: string, rounds = DEFAULT_ROUNDS): string {
  return bcrypt.hashSync(secret, rounds);
}
