import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUserApi } from '@/lib/auth/middleware';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { sendGHLSms, isGHLConfigured } from '@/lib/integrations/ghl';

// Loose E.164-ish phone validation (GHL is strict about format).
const phoneRegex = /^\+?[1-9]\d{6,14}$/;

const schema = z
  .object({
    phone: z.string().regex(phoneRegex, 'Phone must be in E.164 format (e.g. +447700900000)').optional(),
    contactId: z.string().min(1).optional(),
    message: z.string().min(1, 'Message is required').max(1600, 'Message too long'),
    fromNumberId: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
  })
  .refine((v) => Boolean(v.phone || v.contactId), {
    message: 'Either phone or contactId is required.',
    path: ['phone'],
  });

export const POST = withErrorHandler('api.integrations.ghl.sms.POST', async (req: NextRequest) => {
  await requireUserApi();

  if (!isGHLConfigured()) {
    throw errors.badRequest(
      'GHL is not configured. Set GHL_API_KEY and GHL_LOCATION_ID in .env.local and restart.',
    );
  }

  const body = await req.json().catch(() => ({}));
  const input = schema.parse(body);

  const result = await sendGHLSms({
    phone: input.phone,
    contactId: input.contactId,
    message: input.message,
    fromNumberId: input.fromNumberId,
    contact: {
      firstName: input.firstName,
      lastName: input.lastName,
      name: input.name,
      email: input.email,
    },
  });

  if (!result.ok) {
    throw errors.serverError(result.error || 'GHL SMS send failed.');
  }

  return NextResponse.json({
    success: true,
    contactId: result.contactId,
    messageId: result.messageId,
    conversationId: result.conversationId,
  });
});
