import nodemailer from 'nodemailer';

/**
 * KaizenViz was not in the repositories this environment can read.
 * Mail goes out through SMTP environment variables, which is the
 * interface Resend, Postmark, SendGrid, and most other providers expose.
 */
export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail(options: { to: string; subject: string; html: string }) {
  if (!mailConfigured()) {
    return { sent: false as const, reason: 'smtp_not_configured' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  return { sent: true as const, messageId: info.messageId };
}
