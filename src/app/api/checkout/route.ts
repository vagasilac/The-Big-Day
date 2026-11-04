import { NextResponse } from 'next/server';
import { CHECKOUT_INTEGRATION_ID, getStripe } from '@/lib/stripe';
import { planById } from '@/lib/plans';
import { uidFromAuthHeader } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({
      error: 'Stripe is not configured. Set STRIPE_SECRET_KEY and the STRIPE_PRICE_BASIC, STRIPE_PRICE_PREMIUM, and STRIPE_PRICE_DELUXE price IDs.',
    }, { status: 503 });
  }

  let planId = '';
  try {
    const body = await req.json() as { plan?: string };
    planId = body.plan || '';
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const plan = planById(planId);
  if (!plan) {
    return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 });
  }

  const priceId = process.env[plan.env];
  if (!priceId) {
    return NextResponse.json({
      error: `Missing ${plan.env}. Create a one-time Stripe Price for ${plan.productName} ($${plan.amountUsd} USD) and put its price id in that variable.`,
    }, { status: 503 });
  }

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const uid = await uidFromAuthHeader(req.headers.get('authorization'));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      client_reference_id: uid || undefined,
      metadata: {
        plan: plan.id,
        ...(uid ? { uid } : {}),
      },
      // Tags this flow in the Stripe Dashboard. Requires a current API version.
      integration_identifier: CHECKOUT_INTEGRATION_ID,
    } as Parameters<typeof stripe.checkout.sessions.create>[0]);

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start checkout.';
    console.error('Checkout session failed');
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
