import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}

/** Stable label so this flow can be compared in the Stripe Dashboard. */
export const CHECKOUT_INTEGRATION_ID = 'the-big-day-wplanpay';
