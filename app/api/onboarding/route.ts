import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createServerSupabase } from '@/lib/supabase-server';

const NOTIFY_EMAIL = 'clarkekhamare@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;
    const source = body.source ?? 'identimarketing';

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    try {
      const supabase = createServerSupabase();
      const { error } = await supabase.from('onboarding_clients').insert({
        contact_name: name,
        email,
        phone: phone || null,
        current_challenges: message || null,
      });
      if (error) throw error;
    } catch (dbError) {
      console.error('Supabase onboarding_clients insert error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save onboarding data' },
        { status: 500 }
      );
    }

    const emailUser = process.env.EMAIL_USER || 'khamareclarke@gmail.com';
    const emailPass = (process.env.EMAIL_PASS || '').replace(/^"|"$/g, '');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass },
    });

    const mailOptions = {
      from: `"Identimarketing" <${emailUser}>`,
      to: NOTIFY_EMAIL,
      subject: `New onboarding: ${name} – Identimarketing`,
      html: `
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
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit' },
      { status: 500 }
    );
  }
}
