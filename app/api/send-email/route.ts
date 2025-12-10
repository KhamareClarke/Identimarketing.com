import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_USER = 'khamareclarke@gmail.com';
const EMAIL_PASS = 'ovga hgzy rltc ifyh';
const AUDIT_EMAIL = 'khamareclarke@gmail.com';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    console.log('Email API called');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { name, email, message, type, phone, company } = body;

    // Validate required fields
    if (!name || !email || !message || !type) {
      console.log('Missing required fields:', { name: !!name, email: !!email, message: !!message, type: !!type });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('Sending email...');
    
    // Prepare email content
    const subject = `New Question from ${name} - Identimarketing AI Bot`;
    
    const mailOptions = {
      from: EMAIL_USER,
      to: AUDIT_EMAIL,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E40AF;">New Question Request</h2>
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
      `,
    };

    // Send email to recipient
    console.log('Sending email to recipient...');
    const recipientResult = await transporter.sendMail(mailOptions);
    console.log('Recipient email sent:', recipientResult.messageId);

    // Send confirmation email to sender
    const confirmationOptions = {
      from: EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Identimarketing!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E40AF;">Thank you for contacting Identimarketing!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for reaching out to us. We have received your question and will get back to you within 24 hours.</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1E40AF;">Your Message:</h3>
            <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #1E40AF;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p>In the meantime, feel free to explore our services or contact us directly.</p>
          <p>Best regards,<br>The Identimarketing Team</p>
        </div>
      `,
    };

    console.log('Sending confirmation email...');
    const confirmationResult = await transporter.sendMail(confirmationOptions);
    console.log('Confirmation email sent:', confirmationResult.messageId);

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Email API endpoint is working' },
    { status: 200 }
  );
}