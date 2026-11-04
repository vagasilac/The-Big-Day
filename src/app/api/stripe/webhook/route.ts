import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { adminConfigured, adminDb } from '@/lib/firebase-admin';
import { planById } from '@/lib/plans';

export const runtime = 'nodejs';

async function fulfill(session: Stripe.Checkout.Session) {
  if (session.payment_status === 'unpaid') return;
  const plan = session.metadata?.plan || '';
  if (!planById(plan)) return;
  if (!adminConfigured()) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required to record a paid plan.');
  }

  const db = adminDb();
  const purchaseRef = db.collection('purchases').doc(session.id);
  const existing = await purchaseRef.get();
  if (existing.exists && existing.data()?.fulfilled) return;

  const uid = session.client_reference_id || session.metadata?.uid || null;
  const email = session.customer_details?.email || session.customer_email || null;

  await purchaseRef.set({
    plan,
    uid,
    email,
    paymentStatus: session.payment_status,
    customerId: typeof session.customer === 'string' ? session.customer : null,
    fulfilled: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  if (uid) {
    await db.collection('users').doc(uid).set({
      plan,
      stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
      planUpdatedAt: new Date().toISOString(),
    }, { merge: true });
  }
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({
      error: 'Stripe webhook is not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.',
    }, { status: 503 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('Stripe webhook signature check failed');
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid payload.' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      await fulfill(event.data.object as Stripe.Checkout.Session);
    }
    if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (adminConfigured()) {
        await adminDb().collection('purchases').doc(session.id).set({
          plan: session.metadata?.plan || null,
          paymentStatus: 'failed',
          fulfilled: false,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }
  } catch (error) {
    console.error('Stripe webhook fulfilment failed');
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Fulfilment failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
