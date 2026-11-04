import { NextResponse } from 'next/server';
import { mailConfigured, sendMail } from '@/lib/mailer';

export const runtime = 'nodejs';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
}

export async function POST(req: Request) {
  let body: { email?: string; name?: string; status?: string; weddingTitle?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const email = body.email?.trim() || '';
  const name = body.name?.trim() || 'there';
  const status = body.status || 'received';
  const weddingTitle = body.weddingTitle?.trim() || 'the wedding';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ sent: false, reason: 'no_email' });
  }

  if (!mailConfigured()) {
    return NextResponse.json({ sent: false, reason: 'smtp_not_configured' });
  }

  const statusLabel = status === 'accepted' ? 'joyfully accepted' : status === 'declined' ? 'declined' : status === 'maybe' ? 'marked as maybe' : 'received';

  try {
    const result = await sendMail({
      to: email,
      subject: `RSVP ${statusLabel} for ${weddingTitle}`,
      html: `<p>Hello ${escapeHtml(name)},</p><p>Your RSVP for ${escapeHtml(weddingTitle)} is ${escapeHtml(statusLabel)}.</p><p>You can change it from the same invitation link.</p>`,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('RSVP confirmation email failed');
    return NextResponse.json({ sent: false, error: error instanceof Error ? error.message : 'Email failed.' }, { status: 500 });
  }
}
