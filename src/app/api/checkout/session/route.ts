import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
  }
  const sessionId = new URL(req.url).searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session.' }, { status: 400 });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      paymentStatus: session.payment_status,
      plan: session.metadata?.plan || null,
    });
  } catch {
    return NextResponse.json({ error: 'Could not read that checkout session.' }, { status: 404 });
  }
}
