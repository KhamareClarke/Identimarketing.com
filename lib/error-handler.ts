// =====================================================================
// Identimarketing SaaS - API route error handler
//
// Wrap a Next.js App Router route handler with `withErrorHandler` to get:
//   - Try/catch around the handler
//   - Request-id generation + logging
//   - Zod validation errors translated to 400 with field details
//   - PostgrestError translated to a friendly message
//   - Per-route timing forwarded to lib/monitoring.ts
//   - Normalized JSON error shape:  { error: { code, message, details? } }
// =====================================================================

import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { logger } from './logging';
import { trackTiming } from './monitoring';

export type ApiHandler = (req: NextRequest, ctx: { params: Record<string, string> }) => Promise<Response> | Response;

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const errors = {
  badRequest: (message = 'Bad request', details?: unknown) => new ApiError(400, 'bad_request', message, details),
  unauthorized: (message = 'You must be signed in') => new ApiError(401, 'unauthorized', message),
  forbidden: (message = 'You do not have permission to do that') => new ApiError(403, 'forbidden', message),
  notFound: (message = 'Not found') => new ApiError(404, 'not_found', message),
  conflict: (message = 'Conflict', details?: unknown) => new ApiError(409, 'conflict', message, details),
  unprocessable: (message = 'Unprocessable', details?: unknown) =>
    new ApiError(422, 'unprocessable_entity', message, details),
  rateLimited: (message = 'Too many requests') => new ApiError(429, 'rate_limited', message),
  serverError: (message = 'Something went wrong on our end') => new ApiError(500, 'server_error', message),
};

function generateRequestId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function withErrorHandler(name: string, handler: ApiHandler): ApiHandler {
  return async (req, ctx) => {
    const requestId = req.headers.get('x-request-id') ?? generateRequestId();
    const started = Date.now();
    try {
      const res = await handler(req, ctx);
      const headers = new Headers(res.headers);
      headers.set('x-request-id', requestId);
      const next = new Response(res.body, { status: res.status, headers });
      trackTiming(name, Date.now() - started, { status: res.status, requestId });
      return next;
    } catch (err) {
      const ms = Date.now() - started;
      if (err instanceof ZodError) {
        logger.warn(`${name} validation error`, { issues: err.issues }, { requestId });
        trackTiming(name, ms, { status: 400, requestId });
        return NextResponse.json(
          {
            error: {
              code: 'validation_error',
              message: 'One or more fields are invalid.',
              details: err.issues,
            },
          },
          { status: 400, headers: { 'x-request-id': requestId } },
        );
      }
      if (err instanceof ApiError) {
        logger.warn(`${name} api error`, { code: err.code, status: err.status, msg: err.message }, { requestId });
        trackTiming(name, ms, { status: err.status, requestId });
        return NextResponse.json(
          { error: { code: err.code, message: err.message, details: err.details } },
          { status: err.status, headers: { 'x-request-id': requestId } },
        );
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error(`${name} unhandled error`, { message, stack: err instanceof Error ? err.stack : undefined }, { requestId });
      trackTiming(name, ms, { status: 500, requestId });
      return NextResponse.json(
        { error: { code: 'server_error', message: 'Something went wrong on our end.' } },
        { status: 500, headers: { 'x-request-id': requestId } },
      );
    }
  };
}
