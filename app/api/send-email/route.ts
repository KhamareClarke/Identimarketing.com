import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { sendEmail } from '@/lib/email';
import { withErrorHandler, errors } from '@/lib/error-handler';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['question', 'booking', 'audit']),
  phone: z.string().optional(),
  company: z.string().optional(),
});

export const POST = withErrorHandler('api.send-email.POST', async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const data = schema.parse(body);

  const result = await sendEmail(data);
  if (!result.success) {
    throw errors.serverError(result.message);
  }
  return NextResponse.json({ message: 'Email sent successfully' });
});

export async function GET() {
  return NextResponse.json({ message: 'Email API endpoint is working' });
}
