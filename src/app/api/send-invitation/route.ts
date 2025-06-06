import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, link, preview } = await req.json();
    if (!email || !link) {
      return NextResponse.json({ error: 'Missing email or link' }, { status: 400 });
    }

    const html = `<p>You are invited! Please visit <a href="${link}">${link}</a> for details.</p>`;

    if (preview) {
      return NextResponse.json({ success: true, html });
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
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Wedding Invitation',
      html,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error('Error sending invitation:', err);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
