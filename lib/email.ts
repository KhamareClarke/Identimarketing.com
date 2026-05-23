// =====================================================================
// Identimarketing SaaS - Transactional email (app notifications only)
//
// Authentication emails (verify, reset) are handled by Supabase Auth.
// This module handles:
//   - Contact form / question replies
//   - Booking + audit requests (legacy)
//   - Onboarding notifications
//   - Welcome + team-invite emails (composed from lib/email/auth-templates.ts)
//
// All credentials come from environment variables. Never hardcode.
// =====================================================================

import nodemailer, { type Transporter } from 'nodemailer';

import { logger } from './logging';

let transporter: Transporter | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const user = requireEnv('EMAIL_USER');
  const pass = requireEnv('EMAIL_PASS').replace(/^"|"$/g, '');
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return transporter;
}

function getNotifyEmail(): string {
  return process.env.NOTIFY_EMAIL || process.env.EMAIL_USER || '';
}

export interface EmailData {
  name: string;
  email: string;
  message: string;
  type: 'question' | 'booking' | 'audit';
  phone?: string;
  company?: string;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendMail(options: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const t = getTransporter();
    const from = options.from || `"Identimarketing" <${requireEnv('EMAIL_USER')}>`;
    const result = await t.sendMail({ ...options, from });
    return { success: true, messageId: result.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error';
    logger.error('sendMail failed', { to: options.to, subject: options.subject, message });
    return { success: false, error: message };
  }
}

export async function sendEmail(data: EmailData): Promise<{ success: boolean; message: string }> {
  try {
    const { name, email, message, type, phone, company } = data;

    let subject = '';
    let recipientEmail = '';

    switch (type) {
      case 'question':
        subject = `New Question from ${name} - Identimarketing AI Bot`;
        recipientEmail = getNotifyEmail();
        break;
      case 'booking':
        subject = `New Booking Request from ${name} - Identimarketing`;
        recipientEmail = getNotifyEmail();
        break;
      case 'audit':
        subject = `New Audit Request from ${name} - Identimarketing`;
        recipientEmail = getNotifyEmail();
        break;
    }

    if (!recipientEmail) {
      throw new Error('NOTIFY_EMAIL is not configured.');
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E40AF;">New ${type.charAt(0).toUpperCase() + type.slice(1)} Request</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
          <p><strong>Message:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #1E40AF;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <p style="color: #666; font-size: 14px;">
          This message was sent through the Identimarketing AI Bot system.
        </p>
      </div>
    `;

    const sendResult = await sendMail({ to: recipientEmail, subject, html, replyTo: email });
    if (!sendResult.success) throw new Error(sendResult.error || 'send failed');

    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1E40AF;">Thank you for contacting Identimarketing!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for reaching out to us. We have received your ${type} request and will get back to you within 24 hours.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1E40AF;">Your Message:</h3>
          <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #1E40AF;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <p>In the meantime, feel free to explore our services or contact us directly.</p>
        <p>Best regards,<br>The Identimarketing Team</p>
      </div>
    `;
    await sendMail({ to: email, subject: 'Thank you for contacting Identimarketing!', html: confirmationHtml });

    return { success: true, message: 'Email sent successfully' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('sendEmail failed', { message });
    return { success: false, message: `Failed to send email: ${message}` };
  }
}

export async function sendQuestionEmail(name: string, email: string, message: string, phone?: string) {
  return sendEmail({ name, email, message, type: 'question', phone });
}

export async function sendBookingEmail(name: string, email: string, message: string, phone?: string, company?: string) {
  return sendEmail({ name, email, message, type: 'booking', phone, company });
}

export async function sendAuditEmail(name: string, email: string, message: string, phone?: string, company?: string) {
  return sendEmail({ name, email, message, type: 'audit', phone, company });
}
