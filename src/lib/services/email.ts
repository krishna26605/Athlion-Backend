import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

const isGmail = (process.env.SMTP_HOST || '').includes('gmail.com') || (process.env.SMTP_USER || '').includes('gmail.com');
const smtpUser = (process.env.SMTP_USER || '').trim();
const smtpPass = (process.env.SMTP_PASS || '').trim();

const transporter = nodemailer.createTransport(
  isGmail
    ? {
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      }
    : {
        host: (process.env.SMTP_HOST || '').trim(),
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      }
);

export const sendRegistrationConfirmation = async (user: any, event: any, registration: any) => {
  const qrCodeBuffer = await QRCode.toBuffer(registration.qrCode, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });

  const discountLine =
    registration.discountValue > 0
      ? `<tr>
            <td style="padding: 8px 0; color: #10b981; font-weight: 600;">Discount (${registration.discountLabel || 'Applied'})</td>
            <td style="padding: 8px 0; text-align: right; color: #10b981; font-weight: 700;">- ₹${registration.discountValue}</td>
           </tr>`
      : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Arial, sans-serif; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a;">
            <div style="background: linear-gradient(135deg, #f82506 0%, #c91d04 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 36px; font-weight: 900; font-style: italic; letter-spacing: -2px; text-transform: uppercase; color: #ffffff;">
                    ATHLiON
                </h1>
                <p style="margin: 8px 0 0; font-size: 11px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; color: rgba(255,255,255,0.8);">
                    Registration Confirmed
                </p>
            </div>
            <div style="padding: 40px 30px;">
                <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 900; font-style: italic; text-transform: uppercase; letter-spacing: -1px; color: #ffffff;">
                    Hey ${user.name}! 🏆
                </h2>
                <p style="margin: 0 0 30px; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                    Your registration for <strong style="color: #ffffff;">${event.name}</strong> has been confirmed. You're officially in!
                </p>
                <div style="background: linear-gradient(135deg, #18181b 0%, #1c1c1f 100%); border: 2px solid #f82506; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 30px;">
                    <p style="margin: 0 0 8px; font-size: 10px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; color: #f82506;">
                        YOUR EVENT QR CODE
                    </p>
                    <p style="margin: 0 0 16px; font-size: 11px; color: #6b7280; font-weight: 600;">
                        Show this QR code at the event for instant verification
                    </p>
                    <div style="background: #ffffff; border-radius: 16px; display: inline-block; padding: 16px;">
                        <img src="cid:qrcode" alt="QR Code" width="250" height="250" style="display: block;" />
                    </div>
                    <p style="margin: 16px 0 0; font-size: 10px; color: #4b5563; font-weight: 600;">
                        Registration ID: <span style="font-family: monospace; color: #9ca3af;">${registration.qrCode}</span>
                    </p>
                </div>
                <div style="background: linear-gradient(135deg, #18181b 0%, #1c1c1f 100%); border: 1px solid #333; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 30px;">
                    <p style="margin: 0 0 8px; font-size: 10px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; color: #f82506;">
                        Secret Verification Code (Backup)
                    </p>
                    <div style="font-size: 48px; font-weight: 900; font-style: italic; letter-spacing: 8px; color: #ffffff; margin: 10px 0;">
                        ${registration.verificationCode}
                    </div>
                    <p style="margin: 10px 0 0; font-size: 11px; color: #6b7280; font-weight: 600;">
                        Use this code as manual fallback if QR scan fails
                    </p>
                </div>
                <div style="background: #18181b; border-radius: 16px; padding: 24px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 16px; font-size: 12px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #f82506;">
                        Event Details
                    </h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Event</td>
                            <td style="padding: 8px 0; text-align: right; color: #ffffff; font-weight: 700; font-size: 13px;">${event.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Date</td>
                            <td style="padding: 8px 0; text-align: right; color: #ffffff; font-weight: 700; font-size: 13px;">${new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Venue</td>
                            <td style="padding: 8px 0; text-align: right; color: #ffffff; font-weight: 700; font-size: 13px;">${event.venue.address}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Wave Time</td>
                            <td style="padding: 8px 0; text-align: right; color: #ffffff; font-weight: 700; font-size: 13px;">${registration.batchTime || 'TBA'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Level</td>
                            <td style="padding: 8px 0; text-align: right; color: #ffffff; font-weight: 700; font-size: 13px; text-transform: uppercase;">${registration.level || 'N/A'}</td>
                        </tr>
                    </table>
                </div>
                <div style="background: #18181b; border-radius: 16px; padding: 24px; margin-bottom: 30px;">
                    <h3 style="margin: 0 0 16px; font-size: 12px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #f82506;">
                        Payment Summary
                    </h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Registration Fee</td>
                            <td style="padding: 8px 0; text-align: right; color: #ffffff; font-weight: 700; font-size: 13px;">₹${event.price}</td>
                        </tr>
                        ${discountLine}
                        <tr style="border-top: 1px solid #333;">
                            <td style="padding: 12px 0 8px; color: #ffffff; font-size: 15px; font-weight: 800;">Amount Paid</td>
                            <td style="padding: 12px 0 8px; text-align: right; color: #f82506; font-weight: 900; font-size: 20px;">₹${registration.amountPaid}</td>
                        </tr>
                    </table>
                </div>
                ${event.venue.googleMapsLink ? `
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${event.venue.googleMapsLink}" target="_blank" style="display: inline-block; background: #f82506; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                        📍 Get Directions
                    </a>
                </div>
                ` : ''}
            </div>
            <div style="padding: 30px; border-top: 1px solid #1a1a1a; text-align: center;">
                <p style="margin: 0 0 4px; font-size: 10px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase; color: #f82506;">
                    ATHLiON
                </p>
                <p style="margin: 0; font-size: 11px; color: #4b5563; line-height: 1.6;">
                    The World's Largest Fitness Race<br>
                    This is an automated email. Please do not reply.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'ATHLiON'}" <${process.env.SMTP_USER || process.env.FROM_EMAIL}>`,
    to: user.email,
    subject: `🏆 Registration Confirmed — ${event.name} | ATHLiON`,
    html,
    attachments: [
      {
        filename: 'qrcode.png',
        content: qrCodeBuffer,
        cid: 'qrcode',
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Confirmation email sent to ${user.email}: ${info.messageId}`);
    return info;
  } catch (error: any) {
    console.error(`📧 Email Error: ${error.message}`);
    throw error;
  }
};

export const sendEarlyAccessNotification = async (lead: any, event: any, customMessage?: string) => {
  const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const defaultMsg = `The wait is over! Athlion's flagship event <strong>${event.name}</strong> is officially open for registration. As an Early Access member, secure your spot now!`;
  const messageBody = customMessage || defaultMsg;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Arial, sans-serif; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a;">
            <div style="background: linear-gradient(135deg, #f82506 0%, #c91d04 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 36px; font-weight: 900; font-style: italic; letter-spacing: -2px; color: #ffffff;">ATHLiON</h1>
                <p style="margin: 8px 0 0; font-size: 11px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; color: rgba(255,255,255,0.9);">
                    🔥 Early Access Launch Alert
                </p>
            </div>
            <div style="padding: 40px 30px;">
                <h2 style="margin: 0 0 12px; font-size: 24px; font-weight: 900; color: #ffffff;">Hey ${lead.fullName}! 🚀</h2>
                <p style="font-size: 15px; color: #d1d5db; line-height: 1.6;">${messageBody}</p>
                <div style="background: #18181b; border: 1px solid #f82506; border-radius: 16px; padding: 24px; margin: 24px 0;">
                    <h3 style="margin: 0 0 12px; font-size: 18px; color: #f82506; font-style: italic;">${event.name}</h3>
                    <p style="margin: 4px 0; color: #9ca3af; font-size: 14px;">📅 Date: <strong style="color: #fff;">${eventDate}</strong></p>
                    <p style="margin: 4px 0; color: #9ca3af; font-size: 14px;">📍 Venue: <strong style="color: #fff;">${event.venue?.address || 'TBA'}</strong></p>
                    <p style="margin: 4px 0; color: #9ca3af; font-size: 14px;">🎟️ Ticket Price: <strong style="color: #f82506;">₹${event.price}</strong></p>
                </div>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="https://athlion-frontend.vercel.app/events/${event._id || ''}" style="background: #f82506; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                        Get Your Tickets Now
                    </a>
                </div>
            </div>
            <div style="padding: 24px; border-top: 1px solid #1a1a1a; text-align: center; font-size: 11px; color: #4b5563;">
                <p style="margin: 0;">ATHLiON — The World's Largest Fitness Race</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'ATHLiON'}" <${process.env.SMTP_USER || process.env.FROM_EMAIL}>`,
    to: lead.email,
    subject: `🔥 EARLY ACCESS ALERT: ${event.name} Registration is LIVE! | ATHLiON`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Early Access email sent to ${lead.email}`);
    return info;
  } catch (error: any) {
    console.error(`📧 Early Access Email Error for ${lead.email}: ${error.message}`);
  }
};
