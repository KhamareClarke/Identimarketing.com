// =====================================================================
// Identimarketing SaaS - Auth-flavored email templates
//
// Supabase Auth handles the actual verify/reset emails. These helpers
// cover the post-verification welcome message and the team-invite email.
// =====================================================================

import { sendMail } from '../email';

function brand(): { appUrl: string } {
  return { appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://www.identimarketing.com' };
}

function shell(title: string, bodyHtml: string): string {
  const { appUrl } = brand();
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${appUrl}" style="font-size: 24px; font-weight: 800; color: #1E40AF; text-decoration: none;">Identimarketing</a>
      </div>
      <div style="background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px;">
        <h2 style="margin-top: 0; color: #111827;">${title}</h2>
        ${bodyHtml}
      </div>
      <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 16px;">
        You're receiving this email because you have an Identimarketing account.<br>
        ${appUrl}
      </p>
    </div>
  `;
}

export async function sendWelcomeEmail(name: string, email: string) {
  const { appUrl } = brand();
  const body = `
    <p>Hi ${name || 'there'},</p>
    <p>Welcome to <strong>Identimarketing</strong> - your new home for managing clients, projects, and growth marketing in one place.</p>
    <p>Here are a few things you can do right now:</p>
    <ul style="padding-left: 18px;">
      <li>Invite your team</li>
      <li>Add your first client</li>
      <li>Spin up a project and assign deliverables</li>
    </ul>
    <p style="text-align: center; margin: 28px 0;">
      <a href="${appUrl}/dashboard" style="background: #1E40AF; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to dashboard</a>
    </p>
    <p>If you have any questions, just reply to this email - a real human reads everything.</p>
    <p>- The Identimarketing team</p>
  `;
  return sendMail({
    to: email,
    subject: 'Welcome to Identimarketing',
    html: shell('Welcome aboard', body),
  });
}

export async function sendTeamInviteEmail(opts: {
  inviterName: string;
  workspaceName: string;
  inviteeEmail: string;
  acceptUrl: string;
}) {
  const body = `
    <p>${opts.inviterName} has invited you to join <strong>${opts.workspaceName}</strong> on Identimarketing.</p>
    <p>Click below to accept and create your account.</p>
    <p style="text-align: center; margin: 28px 0;">
      <a href="${opts.acceptUrl}" style="background: #1E40AF; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Accept invite</a>
    </p>
    <p style="color: #6b7280; font-size: 13px;">If the button doesn't work, paste this URL into your browser:<br>${opts.acceptUrl}</p>
  `;
  return sendMail({
    to: opts.inviteeEmail,
    subject: `You're invited to join ${opts.workspaceName} on Identimarketing`,
    html: shell('You have been invited', body),
  });
}

export async function sendPasswordChangedEmail(name: string, email: string) {
  const body = `
    <p>Hi ${name || 'there'},</p>
    <p>This is a confirmation that the password for your Identimarketing account was just changed.</p>
    <p>If this wasn't you, please reset your password immediately and contact support.</p>
  `;
  return sendMail({
    to: email,
    subject: 'Your Identimarketing password was changed',
    html: shell('Password updated', body),
  });
}
