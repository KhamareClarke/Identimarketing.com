import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServiceClient } from '@/lib/db/client';
import { sendMail } from '@/lib/email';
import { withErrorHandler, errors } from '@/lib/error-handler';
import { logger } from '@/lib/logging';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional().default('identimarketing'),
});

export const POST = withErrorHandler('api.onboarding.POST', async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { name, email, phone, message, source } = schema.parse(body);

  const supabase = createServiceClient();
  const { error } = await supabase.from('onboarding_clients' as never).insert({
    contact_name: name,
    email,
    phone: phone || null,
    current_challenges: message || null,
  } as never);
  if (error) {
    logger.error('onboarding insert failed', { error: error.message });
    throw errors.serverError('Failed to save onboarding data');
  }

  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (notifyEmail) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E40AF;">New onboarding / contact</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${message ? `<p><strong>Message:</strong></p><div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #1E40AF;">${message.replace(/\n/g, '<br>')}</div>` : ''}
          <p><strong>Source:</strong> ${source}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Sent at ${new Date().toLocaleString('en-GB')}</p>
      </div>
    `;
    await sendMail({
      to: notifyEmail,
      subject: `New onboarding: ${name} - Identimarketing`,
      html,
      replyTo: email,
    });
  }

  return NextResponse.json({ success: true });
});
