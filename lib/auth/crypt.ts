// =====================================================================
// Identimarketing SaaS - lib/auth/crypt.ts
//
// AES-256-GCM symmetric encryption used by the OTP signup flow to keep
// the user's password decryptable for ~15 minutes so we can sign them
// in immediately after they enter their verification code.
//
// Key derivation: SHA-256(JWT_SECRET). JWT_SECRET must be kept secret
// the same way the Supabase service-role key is.
//
// Token format: <ivHex>:<ciphertextHex>:<authTagHex>
// =====================================================================

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required for crypt.ts but is not set.');
  }
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

/** Encrypt a UTF-8 string. Returns `iv:cipher:tag` in hex. */
export function encryptSecret(plain: string): string {
  if (typeof plain !== 'string') {
    throw new Error('encryptSecret requires a string input.');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), ciphertext.toString('hex'), tag.toString('hex')].join(':');
}

/** Reverse of `encryptSecret`. Throws when the auth tag mismatches. */
export function decryptSecret(token: string): string {
  if (typeof token !== 'string' || !token.includes(':')) {
    throw new Error('Invalid encrypted token format.');
  }
  const [ivHex, ctHex, tagHex] = token.split(':');
  if (!ivHex || !ctHex || !tagHex) {
    throw new Error('Invalid encrypted token format.');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(ctHex, 'hex')),
    decipher.final(),
  ]);
  return plain.toString('utf8');
}

/** Generate a 6-digit numeric OTP, returned as a zero-padded string. */
export function generateNumericOtp(digits = 6): string {
  if (digits < 4 || digits > 10) throw new Error('OTP length must be 4-10 digits.');
  // Reject-sampling using crypto.randomInt for uniform distribution.
  const max = 10 ** digits;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(digits, '0');
}
