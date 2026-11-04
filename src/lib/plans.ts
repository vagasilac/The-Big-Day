export const CHECKOUT_PLANS = [
  {
    id: 'basic',
    name: 'Basic Plan',
    priceLabel: '$49',
    env: 'STRIPE_PRICE_BASIC',
    productName: 'The Big Day Basic',
    amountUsd: 49,
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    priceLabel: '$99',
    env: 'STRIPE_PRICE_PREMIUM',
    productName: 'The Big Day Premium',
    amountUsd: 99,
  },
  {
    id: 'deluxe',
    name: 'Deluxe Plan',
    priceLabel: '$149',
    env: 'STRIPE_PRICE_DELUXE',
    productName: 'The Big Day Deluxe',
    amountUsd: 149,
  },
] as const;

export type CheckoutPlanId = (typeof CHECKOUT_PLANS)[number]['id'];

export function planById(id: string) {
  return CHECKOUT_PLANS.find((plan) => plan.id === id) || null;
}
