// =====================================================================
// Identimarketing SaaS - Go High Level integration
//
// Implements:
//   - Contact upsert (POST /contacts/upsert)
//   - SMS send via Conversations API (POST /conversations/messages)
//   - Stubs for client sync / outbound contact sync (Phase 2 wiring)
//
// Authentication: Private Integration Token (PIT) via Bearer header.
// Per-tenant credentials override env defaults: callers can pass
// { apiKey, locationId } to use a tenant's own GHL credentials.
// =====================================================================

import { logger } from '@/lib/logging';
import type { Client, Profile } from '@/lib/db/types';

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_VERSION_CONTACTS = '2021-07-28';
const GHL_VERSION_MESSAGES = '2021-04-15';

export interface GHLCredentials {
  apiKey: string;
  locationId: string;
}

export interface GHLSyncResult {
  ok: boolean;
  ghlId?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

export interface GHLContact {
  id: string;
  locationId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface SendSmsResult extends GHLSyncResult {
  messageId?: string;
  conversationId?: string;
  contactId?: string;
}

// ---------------------------------------------------------------------
// Credential resolution
// ---------------------------------------------------------------------
function envCredentials(): GHLCredentials | null {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiKey || !locationId) return null;
  return { apiKey, locationId };
}

function resolveCredentials(override?: Partial<GHLCredentials>): GHLCredentials | null {
  const env = envCredentials();
  const apiKey = override?.apiKey || env?.apiKey;
  const locationId = override?.locationId || env?.locationId;
  if (!apiKey || !locationId) return null;
  return { apiKey, locationId };
}

function isConfigured(override?: Partial<GHLCredentials>): boolean {
  return resolveCredentials(override) !== null;
}

// ---------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------
interface GhlFetchOptions {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  version: string;
  apiKey: string;
  body?: unknown;
  query?: Record<string, string | undefined>;
}

async function ghlFetch<T>({ path, method = 'GET', version, apiKey, body, query }: GhlFetchOptions): Promise<T> {
  const url = new URL(`${GHL_BASE_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: version,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : null) || `GHL ${method} ${path} failed (${res.status})`;
    const err = new Error(message) as Error & { status: number; data: unknown };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

// ---------------------------------------------------------------------
// Contact upsert
// ---------------------------------------------------------------------
export interface UpsertContactInput {
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  tags?: string[];
  source?: string;
  customFields?: Record<string, unknown>;
}

export async function upsertGHLContact(
  input: UpsertContactInput,
  credentialsOverride?: Partial<GHLCredentials>,
): Promise<GHLContact> {
  const creds = resolveCredentials(credentialsOverride);
  if (!creds) {
    throw new Error('GHL is not configured (missing GHL_API_KEY or GHL_LOCATION_ID).');
  }
  if (!input.phone && !input.email) {
    throw new Error('upsertGHLContact requires at least a phone or email.');
  }

  const body: Record<string, unknown> = {
    locationId: creds.locationId,
  };
  if (input.phone) body.phone = input.phone;
  if (input.email) body.email = input.email;
  if (input.firstName) body.firstName = input.firstName;
  if (input.lastName) body.lastName = input.lastName;
  if (input.name) body.name = input.name;
  if (input.tags) body.tags = input.tags;
  if (input.source) body.source = input.source;
  if (input.customFields) body.customFields = input.customFields;

  const res = await ghlFetch<{ contact: GHLContact; new: boolean; traceId?: string }>({
    path: '/contacts/upsert',
    method: 'POST',
    version: GHL_VERSION_CONTACTS,
    apiKey: creds.apiKey,
    body,
  });

  return res.contact;
}

// ---------------------------------------------------------------------
// Send SMS
// ---------------------------------------------------------------------
export interface SendSmsInput {
  /** E.164 phone number (e.g. +447700900000). One of phone or contactId required. */
  phone?: string;
  /** Existing GHL contact id. If supplied, no upsert is needed. */
  contactId?: string;
  /** Message body. GHL hard-limit ~1600 chars; we don't truncate. */
  message: string;
  /** Optional GHL phone-number id ("from"). If omitted, GHL picks the default. */
  fromNumberId?: string;
  /** Optional contact attributes for upsert when only phone is provided. */
  contact?: Omit<UpsertContactInput, 'phone'>;
}

export async function sendGHLSms(
  input: SendSmsInput,
  credentialsOverride?: Partial<GHLCredentials>,
): Promise<SendSmsResult> {
  const creds = resolveCredentials(credentialsOverride);
  if (!creds) {
    logger.debug('GHL not configured, skipping SMS');
    return { ok: true, skipped: true, reason: 'not_configured' };
  }
  if (!input.message || !input.message.trim()) {
    return { ok: false, error: 'Message body is required.' };
  }
  if (!input.phone && !input.contactId) {
    return { ok: false, error: 'Either phone or contactId is required.' };
  }

  try {
    let contactId = input.contactId;
    if (!contactId && input.phone) {
      const contact = await upsertGHLContact(
        { phone: input.phone, ...input.contact },
        credentialsOverride,
      );
      contactId = contact.id;
    }
    if (!contactId) {
      return { ok: false, error: 'Could not resolve contactId.' };
    }

    const body: Record<string, unknown> = {
      type: 'SMS',
      contactId,
      message: input.message,
    };
    if (input.fromNumberId) body.fromNumberId = input.fromNumberId;

    const res = await ghlFetch<{ messageId?: string; conversationId?: string; msg?: string }>({
      path: '/conversations/messages',
      method: 'POST',
      version: GHL_VERSION_MESSAGES,
      apiKey: creds.apiKey,
      body,
    });

    logger.info('GHL SMS sent', {
      contactId,
      messageId: res.messageId,
      conversationId: res.conversationId,
    });

    return {
      ok: true,
      contactId,
      messageId: res.messageId,
      conversationId: res.conversationId,
      ghlId: res.messageId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown GHL error';
    logger.error('GHL SMS send failed', {
      message,
      status: (err as { status?: number }).status,
      phone: input.phone ? `${input.phone.slice(0, 4)}***` : undefined,
    });
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------
// Contact + client sync (used by signup / clients/* routes)
// ---------------------------------------------------------------------
export async function syncContactToGHL(
  profile: Profile,
  credentialsOverride?: Partial<GHLCredentials>,
): Promise<GHLSyncResult> {
  if (!isConfigured(credentialsOverride)) {
    logger.debug('GHL not configured, skipping contact sync');
    return { ok: true, skipped: true, reason: 'not_configured' };
  }
  try {
    const contact = await upsertGHLContact(
      {
        email: profile.email,
        name: profile.name ?? undefined,
        source: 'Identimarketing signup',
        tags: ['identimarketing-user'],
      },
      credentialsOverride,
    );
    return { ok: true, ghlId: contact.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown GHL error';
    logger.warn('syncContactToGHL failed', { message });
    return { ok: false, error: message };
  }
}

export async function syncClientToGHL(
  client: Client,
  credentialsOverride?: Partial<GHLCredentials>,
): Promise<GHLSyncResult> {
  if (!isConfigured(credentialsOverride)) {
    logger.debug('GHL not configured, skipping client sync');
    return { ok: true, skipped: true, reason: 'not_configured' };
  }
  try {
    const contact = await upsertGHLContact(
      {
        email: client.contact_email,
        phone: client.phone ?? undefined,
        name: client.contact_name ?? client.company_name,
        source: 'Identimarketing client',
        tags: ['identimarketing-client', `industry:${client.industry ?? 'unknown'}`],
        customFields: {
          company_name: client.company_name,
          website: client.website,
          budget: client.budget,
        },
      },
      credentialsOverride,
    );
    return { ok: true, ghlId: contact.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown GHL error';
    logger.warn('syncClientToGHL failed', { message });
    return { ok: false, error: message };
  }
}

export { isConfigured as isGHLConfigured };
