import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_USER = 'khamareclarke@gmail.com';
const EMAIL_PASS = 'ovga hgzy rltc ifyh';
const AUDIT_EMAIL = 'khamareclarke@gmail.com';
const BOOKING_EMAIL = 'khamareclarke@gmail.com';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export interface EmailData {
  name: string;
  email: string;
  message: string;
  type: 'question' | 'booking' | 'audit';
  phone?: string;
  company?: string;
}

export async function sendEmail(data: EmailData) {
  try {
    console.log('sendEmail called with data:', data);
    const { name, email, message, type, phone, company } = data;
    
    let subject = '';
    let recipientEmail = '';
    
    switch (type) {
      case 'question':
        subject = `New Question from ${name} - Identimarketing AI Bot`;
        recipientEmail = AUDIT_EMAIL;
        break;
      case 'booking':
        subject = `New Booking Request from ${name} - Identimarketing`;
        recipientEmail = BOOKING_EMAIL;
        break;
      case 'audit':
        subject = `New Audit Request from ${name} - Identimarketing`;
        recipientEmail = AUDIT_EMAIL;
        break;
    }

    console.log('Email configuration:', { subject, recipientEmail, from: EMAIL_USER });

    const mailOptions = {
      from: EMAIL_USER,
      to: recipientEmail,
      subject,
      html: `
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
      `,
    };

    console.log('Sending confirmation email...');
    const confirmationResult = await transporter.sendMail(confirmationOptions);
    console.log('Confirmation email sent:', confirmationResult.messageId);

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function sendQuestionEmail(name: string, email: string, message: string, phone?: string) {
  return sendEmail({
    name,
    email,
    message,
    type: 'question',
    phone,
  });
}

export async function sendBookingEmail(name: string, email: string, message: string, phone?: string, company?: string) {
  return sendEmail({
    name,
    email,
    message,
    type: 'booking',
    phone,
    company,
  });
}

export async function sendAuditEmail(name: string, email: string, message: string, phone?: string, company?: string) {
  return sendEmail({
    name,
    email,
    message,
    type: 'audit',
    phone,
    company,
  });
}
