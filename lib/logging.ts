// =====================================================================
// Identimarketing SaaS - Structured logger
//
// Levels: debug, info, warn, error.
// - All levels print to console with a structured prefix.
// - `error` (and optionally `warn`) gets persisted to the system_logs
//   table via the service-role client. Persistence is fire-and-forget so
//   a logging failure never breaks the request.
// - When SENTRY_DSN is set, errors are forwarded to Sentry (hook left as
//   a TODO until you install @sentry/nextjs).
// =====================================================================

import type { LogLevel } from './db/types';

type LogContext = Record<string, unknown>;

interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  user_id?: string | null;
  request_id?: string | null;
  timestamp: string;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const envLevel = (process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug')) as LogLevel;
const minLevel: LogLevel = LEVEL_RANK[envLevel] !== undefined ? envLevel : 'info';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[minLevel];
}

function consoleSink(entry: LogEntry): void {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const meta = entry.request_id ? ` (req=${entry.request_id})` : '';
  const payload = Object.keys(entry.context).length ? entry.context : undefined;
  const line = `${prefix}${meta} ${entry.message}`;
  if (entry.level === 'error') {
    console.error(line, payload ?? '');
  } else if (entry.level === 'warn') {
    console.warn(line, payload ?? '');
  } else if (entry.level === 'debug') {
    console.debug(line, payload ?? '');
  } else {
    console.log(line, payload ?? '');
  }
}

async function persistSink(entry: LogEntry): Promise<void> {
  if (entry.level !== 'error' && entry.level !== 'warn') return;
  if (typeof window !== 'undefined') return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const { createServiceClient } = await import('./db/client');
    const supabase = createServiceClient();
    await supabase.from('system_logs').insert({
      level: entry.level,
      message: entry.message,
      context: entry.context,
      user_id: entry.user_id ?? null,
      request_id: entry.request_id ?? null,
    });
  } catch (err) {
    console.error('[logger] failed to persist log entry:', err);
  }
}

function sentrySink(_entry: LogEntry): void {
  // TODO: Sentry - install @sentry/nextjs and forward errors here once SENTRY_DSN is set.
  // Example:
  //   import * as Sentry from '@sentry/nextjs';
  //   if (entry.level === 'error') Sentry.captureMessage(entry.message, { level: 'error', extra: entry.context });
}

function emit(level: LogLevel, message: string, context: LogContext = {}, extra: { userId?: string | null; requestId?: string | null } = {}): void {
  if (!shouldLog(level)) return;
  const entry: LogEntry = {
    level,
    message,
    context,
    user_id: extra.userId ?? null,
    request_id: extra.requestId ?? null,
    timestamp: new Date().toISOString(),
  };
  consoleSink(entry);
  sentrySink(entry);
  void persistSink(entry);
}

export const logger = {
  debug(message: string, context: LogContext = {}, extra?: { userId?: string | null; requestId?: string | null }) {
    emit('debug', message, context, extra);
  },
  info(message: string, context: LogContext = {}, extra?: { userId?: string | null; requestId?: string | null }) {
    emit('info', message, context, extra);
  },
  warn(message: string, context: LogContext = {}, extra?: { userId?: string | null; requestId?: string | null }) {
    emit('warn', message, context, extra);
  },
  error(message: string, context: LogContext = {}, extra?: { userId?: string | null; requestId?: string | null }) {
    emit('error', message, context, extra);
  },
};

export type Logger = typeof logger;
