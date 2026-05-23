// =====================================================================
// Identimarketing SaaS - lib/notifications/templates.ts
//
// Per-`type` render hooks that produce subject/HTML/SMS for the
// notifications dispatcher. Templates are deliberately simple - the
// dispatcher already stores all context in notifications.data, so the
// template just shapes the channel payloads.
// =====================================================================

import type { Notification } from '@/lib/db/types';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface RenderedSms {
  text: string;
}

export interface NotificationInputForRender {
  type: string;
  title: string;
  message: string | null;
  action_url?: string | null;
  action_label?: string | null;
  data?: Record<string, unknown>;
}

const BRAND = 'Identimarketing';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function absoluteUrl(href: string | null | undefined): string | null {
  if (!href) return null;
  if (/^https?:\/\//i.test(href)) return href;
  const base = APP_URL.replace(/\/$/, '');
  return `${base}${href.startsWith('/') ? '' : '/'}${href}`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderButton(url: string | null, label: string | null): string {
  if (!url) return '';
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label || 'Open in dashboard');
  return `
  <p style="text-align:center;margin:24px 0;">
    <a href="${safeUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">
      ${safeLabel}
    </a>
  </p>`;
}

function defaultEmailLayout(input: NotificationInputForRender): RenderedEmail {
  const title = escapeHtml(input.title);
  const body = escapeHtml(input.message ?? '');
  const url = absoluteUrl(input.action_url ?? null);

  const html = `
<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;padding:32px 12px;color:#111;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
    <p style="margin:0 0 4px;font-size:13px;color:#6b7280;letter-spacing:0.05em;text-transform:uppercase;">${escapeHtml(BRAND)}</p>
    <h1 style="margin:0 0 12px;font-size:20px;color:#111827;">${title}</h1>
    <p style="margin:0;color:#374151;line-height:1.6;white-space:pre-wrap;">${body}</p>
    ${renderButton(url, input.action_label ?? null)}
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
      You're receiving this because you have notifications enabled for ${escapeHtml(BRAND)}.
      <br/>
      Manage preferences in your <a href="${escapeHtml(absoluteUrl('/dashboard/notifications') || '#')}" style="color:#6366f1;">notification settings</a>.
    </p>
  </div>
</body></html>`;
  const text = `${input.title}\n\n${input.message ?? ''}${url ? `\n\n${url}` : ''}`;
  return { subject: `[${BRAND}] ${input.title}`, html, text };
}

function defaultSms(input: NotificationInputForRender): RenderedSms {
  const url = absoluteUrl(input.action_url ?? null);
  const parts = [input.title];
  if (input.message) parts.push(input.message);
  if (url) parts.push(url);
  // Keep under 320 chars (2 SMS segments).
  const joined = parts.join(' - ').slice(0, 320);
  return { text: joined };
}

export function renderEmail(input: NotificationInputForRender): RenderedEmail {
  return defaultEmailLayout(input);
}

export function renderSms(input: NotificationInputForRender): RenderedSms {
  return defaultSms(input);
}

export function renderFromNotification(notification: Notification): {
  email: RenderedEmail;
  sms: RenderedSms;
} {
  const input: NotificationInputForRender = {
    type: notification.type,
    title: notification.title,
    message: notification.message,
    action_url: notification.action_url,
    action_label: notification.action_label,
    data: notification.data,
  };
  return { email: renderEmail(input), sms: renderSms(input) };
}
