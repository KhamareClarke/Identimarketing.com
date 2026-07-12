/**
 * Fleet ingest emitter — fire-and-forget POST to the central
 * khamareclarke.com hub so every lead/form event shows in JARVIS.
 *
 * Required env vars:
 *   FLEET_INGEST_URL      default https://www.khamareclarke.com/api/fleet/ingest
 *   FLEET_INGEST_SECRET   shared with the hub (never commit)
 */
export interface FleetIngestInput {
  project?: string;
  event_type: string;
  summary: string;
  payload?: Record<string, unknown>;
}

const PROJECT = 'identimarketing';

function hubUrl(): string {
  const raw = (process.env.FLEET_INGEST_URL || 'https://www.khamareclarke.com/api/fleet/ingest').trim();
  return raw.replace(/\/$/, '');
}

async function fetchPreservingAuth(
  url: string,
  init: RequestInit,
  maxHops = 3
): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= maxHops; hop += 1) {
    const res = await fetch(current, { ...init, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return res;
      current = new URL(loc, current).toString();
      continue;
    }
    return res;
  }
  throw new Error(`Too many redirects (>${maxHops}) from ${url}`);
}

export async function emitFleetIngest(input: FleetIngestInput): Promise<void> {
  try {
    const secret = process.env.FLEET_INGEST_SECRET;
    if (!secret) return;

    const body = {
      project: input.project || PROJECT,
      event_type: input.event_type,
      summary: input.summary,
      payload: input.payload || {},
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    await fetchPreservingAuth(hubUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    }).catch(() => undefined);

    clearTimeout(timeout);
  } catch {
    // Best-effort telemetry — never throws.
  }
}
