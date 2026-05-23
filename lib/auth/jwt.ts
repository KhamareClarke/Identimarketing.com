// =====================================================================
// Identimarketing SaaS - JWT helpers (service-to-service only)
//
// User auth tokens are handled by Supabase. These helpers are used for:
//   - Signing webhook callbacks (e.g. GHL webhook verification)
//   - Short-lived API tokens for internal jobs
//   - Team-member invite tokens
// =====================================================================

import jwt, { type SignOptions, type JwtPayload } from 'jsonwebtoken';

import { errors } from '@/lib/error-handler';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  return secret;
}

export function sign(payload: Record<string, unknown>, options: SignOptions = {}): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d', ...options });
}

export function verify<T extends JwtPayload = JwtPayload>(token: string): T {
  try {
    return jwt.verify(token, getSecret()) as T;
  } catch {
    throw errors.unauthorized('Invalid or expired token');
  }
}

export function decode<T extends JwtPayload = JwtPayload>(token: string): T | null {
  try {
    return jwt.decode(token) as T | null;
  } catch {
    return null;
  }
}
